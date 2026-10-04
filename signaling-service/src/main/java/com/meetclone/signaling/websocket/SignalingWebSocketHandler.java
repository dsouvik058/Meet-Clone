package com.meetclone.signaling.websocket;

import com.meetclone.signaling.handler.LeaveRoomHandler;
import com.meetclone.signaling.model.UserSession;
import com.meetclone.signaling.registry.RoomManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class SignalingWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(SignalingWebSocketHandler.class);

    private final SignalingMessageRouter router;
    private final RoomManager roomManager;
    private final LeaveRoomHandler leaveRoomHandler;

    public SignalingWebSocketHandler(SignalingMessageRouter router,
                                   RoomManager roomManager,
                                   LeaveRoomHandler leaveRoomHandler) {
        this.router = router;
        this.roomManager = roomManager;
        this.leaveRoomHandler = leaveRoomHandler;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("WebSocket handshake complete: id={}, remoteAddress={}",
                session.getId(), session.getRemoteAddress());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        router.routeMessage(session, message);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("WebSocket closed: id={}, status={}", session.getId(), status);
        UserSession userSession = roomManager.handleDisconnect(session);
        if (userSession != null) {
            leaveRoomHandler.handleUserLeave(userSession.getRoomId(), userSession.getUserId());
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.warn("WebSocket transport error for session [{}]: {}", session.getId(), exception.getMessage());
    }
}
