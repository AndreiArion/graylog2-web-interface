/*
 * Copyright 2013 TORCH UG
 *
 * This file is part of Graylog2.
 *
 * Graylog2 is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Graylog2 is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Graylog2.  If not, see <http://www.gnu.org/licenses/>.
 */
package models;

import com.google.inject.Inject;
import lib.notifications.*;
import models.api.responses.system.NotificationSummaryResponse;
import org.joda.time.DateTime;

import java.util.Map;

/**
 * @author Lennart Koopmann <lennart@torch.sh>
 */
public class Notification {

    @Inject
    private NodeService nodeService;

    public enum Type {
        DEFLECTOR_EXISTS_AS_INDEX,
        MULTI_MASTER,
        ES_OPEN_FILES,
        NO_INPUT_RUNNING,
        INPUT_FAILED_TO_START;

        public static Type fromString(String name) {
            return valueOf(name.toUpperCase());
        }
    }

    public enum Severity {
        NORMAL, URGENT
    }

    private final Type type;
    private final DateTime timestamp;
    private final Severity severity;
    private final String node_id;
    private final Map<String, Object> details;

    public Notification(NotificationSummaryResponse x) {
        this.type = Type.valueOf(x.type.toUpperCase());
        this.timestamp = DateTime.parse(x.timestamp);
        this.severity = Severity.valueOf(x.severity.toUpperCase());
        this.node_id = x.node_id;
        this.details = x.details;
    }

    public NotificationType get() {
        switch (type) {
            case DEFLECTOR_EXISTS_AS_INDEX:
                return new DeflectorExistsAsIndexNotification();
            case MULTI_MASTER:
                return new MultiMasterNotification();
            case ES_OPEN_FILES:
                return new EsOpenFilesNotification();
            case NO_INPUT_RUNNING:
                return new NoInputRunningNotification(getNodeId());
            case INPUT_FAILED_TO_START:
                return new InputFailedToStartNotification(this);
        }

        throw new RuntimeException("No notification registered for " + type);
    }

    public Type getType() {
        return type;
    }

    public DateTime getTimestamp() {
        return timestamp;
    }

    public String getNodeId() {
        return this.node_id;
    }

    public Node getNode() {
        try {
            return nodeService.loadNode(this.node_id);
        } catch (NodeService.NodeNotFoundException e) {
            return null;
        }
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public Object getDetail(String id) {
        if (details == null)
            return null;

        return details.get(id);
    }
}
