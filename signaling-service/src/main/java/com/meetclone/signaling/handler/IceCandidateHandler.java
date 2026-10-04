package com.meetclone.signaling.handler;

import com.meetclone.signaling.model.SignalingMessage;
import com.meetclone.signaling.model.UserSession;
import com.meetclone.signaling.registry.RoomManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

@Component
public class IceCandidateHandler {

    private static final Logger log = LoggerFactory.getLogger(IceCandidateHandler.class);

    private final RoomManager roomManager;

    public IceCandidateHandler(RoomManager roomManager) {
        this.roomManager = roomManager;
    }

    public void handle(SignalingMessage message, WebSocketSession wsSession) {
        String roomId = message.getRoomId();
        String senderId = message.getSenderUserId();
        String targetId = message.getTargetUserId();

        if (roomId == null || senderId == null || targetId == null) {
            log.warn("Malformed {} candidate frame: missing roomId, senderUserId, or targetUserId (wsSessionId: {})",
                    message.getType(), wsSession.getId());
            return;
        }

        UserSession targetSession = roomManager.getSession(roomId, targetId);
        if (targetSession == null || !targetSession.isOpen()) {
            log.debug("Target [{}] for {} candidate(s) from [{}] is offline or unreachable in room [{}]",
                    targetId, message.getType(), senderId, roomId);
            return;
        }

        // Direct forward of single or batched candidates without altering payload
        targetSession.sendMessage(message);
    }
}
