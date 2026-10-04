package com.meetclone.signaling.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;

public class UserSession {

    private static final Logger log = LoggerFactory.getLogger(UserSession.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final String userId;
    private final String roomId;
    private final String displayName;
    private final WebSocketSession webSocketSession;
    private final long connectedAt;

    public UserSession(String userId, String roomId, String displayName, WebSocketSession webSocketSession) {
        this.userId = userId;
        this.roomId = roomId;
        this.displayName = displayName != null ? displayName : userId;
        this.webSocketSession = webSocketSession;
        this.connectedAt = System.currentTimeMillis();
    }

    public synchronized boolean sendMessage(SignalingMessage message) {
        if (webSocketSession == null || !webSocketSession.isOpen()) {
            log.warn("Cannot send message to user {} in room {}: WebSocket session is closed or null", userId, roomId);
            return false;
        }

        try {
            String payload = OBJECT_MAPPER.writeValueAsString(message);
            webSocketSession.sendMessage(new TextMessage(payload));
            return true;
        } catch (IOException e) {
            log.error("Failed to send message type {} to user {} in room {}: {}",
                    message.getType(), userId, roomId, e.getMessage());
            return false;
        }
    }

    public synchronized void close() {
        if (webSocketSession != null && webSocketSession.isOpen()) {
            try {
                webSocketSession.close();
            } catch (IOException e) {
                log.debug("Error while closing WebSocket session for user {}: {}", userId, e.getMessage());
            }
        }
    }

    public String getUserId() {
        return userId;
    }

    public String getRoomId() {
        return roomId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public WebSocketSession getWebSocketSession() {
        return webSocketSession;
    }

    public String getWebSocketSessionId() {
        return webSocketSession != null ? webSocketSession.getId() : null;
    }

    public long getConnectedAt() {
        return connectedAt;
    }

    public boolean isOpen() {
        return webSocketSession != null && webSocketSession.isOpen();
    }

    @Override
    public String toString() {
        return "UserSession{" +
                "userId='" + userId + '\'' +
                ", roomId='" + roomId + '\'' +
                ", displayName='" + displayName + '\'' +
                ", wsSessionId='" + getWebSocketSessionId() + '\'' +
                '}';
    }
}
