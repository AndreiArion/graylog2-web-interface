focussed = true;

$(window).blur(function(){
    $(".focuslimit").css("text-decoration", "line-through");
    focussed = false;
});
$(window).focus(function(){
    $(".focuslimit").css("text-decoration", "none");
    focussed = true;
});


$(document).ready(function() {

    // Total event counts;
    (function updateTotalEvents() {
        if ($(".total-events").length > 0) {
            var interval = 2500;

            if(!focussed) {
                setTimeout(updateTotalEvents, interval);
                return;
            }

            $.ajax({
                url: '/a/messagecounts/total',
                success: function(data) {
                    $(".total-events").animatedIntChange(data.events, 500)
                },
                error: function() {
                    $(".total-events").text("?");
                },
                complete: function() {
                    setTimeout(updateTotalEvents, interval);
                }
            });
        }
    })();

    // Total throughput.
    (function updateTotalThroughput() {
        if ($(".total-throughput").length > 0) {
            var interval = 1000;

            if(!focussed) {
                setTimeout(updateTotalThroughput, interval);
                return;
            }

            $.ajax({
                url: '/a/system/throughput',
                success: function(data) {
                    $(".total-throughput").text(data.throughput);

                    if (data.nodecount > 1) {
                        $(".total-nodes").html(" across <strong>" + data.nodecount + "</strong> nodes");
                    } else {
                        $(".total-nodes").html(" on 1 node");
                    }
                },
                error: function() {
                    $(".total-throughput").html("?");
                    $(".total-nodes").html("");
                },
                complete: function() {
                    setTimeout(updateTotalThroughput, interval);
                }
            });
        }
    })();

    // Individual node throughput.
    (function updateNodeThroughput() {
        if ($(".node-throughput").length > 0) {
            var interval = 1000;

            if(!focussed) {
                setTimeout(updateNodeThroughput, interval);
                return;
            }

            $(".node-throughput").each(function(i) {
                var nodeType = $(this).attr("data-node-type");
                var url;
                if (!!nodeType && $(this).attr("data-node-type") == "radio") {
                    url = "/a/system/throughput/radio/" + $(this).attr("data-radio-id");
                } else {
                    url = "/a/system/throughput/node/" + $(this).attr("data-node-id");
                }

                var thisNodeT = $(this);
                $.ajax({
                    url: url,
                    success: function(data) {
                        thisNodeT.text(data.throughput);
                    },
                    error: function() {
                        thisNodeT.text("?");
                    },
                    complete: function() {
                        // Trigger next call of the whole function when we updated the last element.
                        if (i == $(".node-throughput").length-1) {
                            setTimeout(updateNodeThroughput, interval);
                        }
                    }
                });
            });
        };
    })();

    // Node heap usage.
    (function updateNodeHeapUsage() {
        if ($(".node-heap-usage").length > 0) {
            var interval = 1000;

            if(!focussed) {
                setTimeout(updateNodeHeapUsage, interval);
                return;
            }

            $(".node-heap-usage").each(function(i) {
                var nodeType = $(this).attr("data-node-type");
                var url;
                if (!!nodeType && $(this).attr("data-node-type") == "radio") {
                    url = "/a/system/radio/" + $(this).attr("data-radio-id") + "/heap"
                } else {
                    url = "/a/system/node/" + $(this).attr("data-node-id") + "/heap"
                }

                var thisHeap = $(this);
                $.ajax({
                    url: url,
                    success: function(data) {
                        var total_percentage = data.total_percentage-data.used_percentage;
                        $(".progress .heap-used-percent", thisHeap).css("width", data.used_percentage + "%");
                        $(".progress .heap-total-percent", thisHeap).css("width", total_percentage + "%");

                        $(".heap-used", thisHeap).text(data.used);
                        $(".heap-total", thisHeap).text(data.total);
                        $(".heap-max", thisHeap).text(data.max);

                        $(".input-master-cache", thisHeap).text(data.input_master_cache);
                    },
                    complete: function() {
                        // Trigger next call of the whole function when we updated the last element.
                        if (i == $(".node-heap-usage").length-1) {
                            setTimeout(updateNodeHeapUsage, interval);
                        }
                    }
                });
            });
        };
    })();

    // IO of input.
    (function updateInputIO() {
        var interval = 1000;

        if(!focussed) {
            setTimeout(updateInputIO, interval);
            return;
        }

        $(".input-io").each(function() {
            var inputId = $(this).attr("data-input-id");
            var nodeId = $(this).attr("data-node-id");

            var io = $(this);

            $.ajax({
                url: '/a/system/inputs/' + encodeURIComponent(nodeId) + '/' + encodeURIComponent(inputId) + '/io',
                success: function(data) {
                    $(".persec .rx", io).text(data.rx);
                    $(".persec .tx", io).text(data.tx);
                    $(".total .rx", io).text(data.total_rx);
                    $(".total .tx", io).text(data.total_tx);
                }
            });

        }).promise().done(function(){ setTimeout(updateInputIO, interval); });;
    })();

    // Connection counts of input.
    (function updateInputConnections() {
        var interval = 1000;

        if(!focussed) {
            setTimeout(updateInputConnections, interval);
            return;
        }

        $(".input-connections").each(function() {
            var inputId = $(this).attr("data-input-id");
            var nodeId = $(this).attr("data-node-id");

            var connections = $(this);

            $.ajax({
                url: '/a/system/inputs/' + encodeURIComponent(nodeId) + '/' + encodeURIComponent(inputId) + '/connections',
                success: function(data) {
                    $(".total", connections).text(data.total);
                    $(".active", connections).text(data.active);
                }
            });

        }).promise().done(function(){ setTimeout(updateInputConnections, interval); });
    })();

    // Notification count badge.
    (function updateNotificationCount() {
        $.ajax({
            url: '/a/system/notifications',
            success: function(data) {
                var count = data.length;
                if (count > 0) {
                    $("#notification-badge").text(count);
                    var urgent = data.filter(function(x) { return x.severity == "URGENT"});
                    if (urgent.length > 0) {
                        if (!$("#notification-badge").data("bouncing")) {
                            var bouncer = setInterval(function() {
                                if ($("#notification-badge").data("bouncing"))
                                    $("#notification-badge").effect("bounce")
                            }, 2000);

                            $("#notification-badge").data("bouncing", bouncer);
                        }
                    } else {
                        if ($("#notification-badge").data("bouncing")) {
                            clearInterval($("#notification-badge").data("bouncing"));
                            $("#notification-badge").data("bouncing", undefined);
                        }
                    }
                    $("#notification-badge").show();
                } else {
                    // Badges are collapsing when empty so we make a 0 collapse.
                    $("#notification-badge").text("");
                    $("#notification-badge").hide();
                    if ($("#notification-badge").data("bouncing")) {
                        clearInterval($("#notification-badge").data("bouncing"));
                        $("#notification-badge").data("bouncing", undefined);
                    }
                }
            },
            complete: function() {
                setTimeout(updateNotificationCount, 10000);
            }
        });
    })();

    // Total log message counts of a node;
    (function updateTotalLogs() {
        if ($(".total-logs").length > 0) {
            var interval = 1000;

            if(!focussed) {
                setTimeout(updateTotalLogs, interval);
                return;
            }

            $(".total-logs").each(function() {
                var nodeId = $(this).attr("data-node-id");

                var logs = $(this);
                $.ajax({
                    url: '/a/system/internallogs/' + encodeURIComponent(nodeId),
                    success: function(data) {
                        logs.animatedIntChange(data.total, 500);
                    }
                });

            }).promise().done(function(){ setTimeout(updateTotalLogs, interval); });
        }
    })();

    // Total log level metrics of a node;
    (function updateLogLevelMetrics() {
        if ($(".loglevel-metrics").length > 0) {
            var interval = 1000;

            if(!focussed) {
                setTimeout(updateLogLevelMetrics, interval);
                return;
            }

            $(".loglevel-metrics:visible").each(function() {
                var nodeId = $(this).attr("data-node-id");

                var theseMetrics = $(this);
                $.ajax({
                    url: '/a/system/internallogs/' + encodeURIComponent(nodeId) + '/metrics',
                    success: function(data) {
                        for (var level in data) {
                            var metrics = data[level];
                            var list = $("dl.loglevel-metrics-list[data-level=" + level + "]", theseMetrics);
                            $(".loglevel-metric-total", list).animatedIntChange(metrics.total, 500);
                            $(".loglevel-metric-mean", list).animatedIntChange(metrics.mean_rate, 500);
                            $(".loglevel-metric-1min", list).animatedIntChange(metrics.one_min_rate, 500);
                        }
                    }
                });

            }).promise().done(function(){ setTimeout(updateLogLevelMetrics, interval); });
        }
    })();

});