package com.meetclone.signaling.handler;

import com.meetclone.signaling.model.SignalingMessage;
import com.meetclone.signaling.model.UserSession;
import com.meetclone.signaling.registry.RoomManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

@Component
public class OfferAnswerHandler {

    private static final Logger log = LoggerFactory.getLogger(OfferAnswerHandler.class);

    private final RoomManager roomManager;

    public OfferAnswerHandler(RoomManager roomManager) {
        this.roomManager = roomManager;
    }

    public void handle(SignalingMessage message, WebSocketSession wsSession) {
        String roomId = message.getRoomId();
        String senderId = message.getSenderUserId();
        String targetId = message.getTargetUserId();

        if (roomId == null || senderId == null || targetId == null) {
            log.warn("Malformed {} message: roomId, senderUserId, or targetUserId is missing (wsSessionId: {})",
                    message.getType(), wsSession.getId());
            sendError(wsSession, roomId, senderId, "INVALID_PAYLOAD", "roomId, senderUserId, and targetUserId are required");
            return;
        }

        UserSession targetSession = roomManager.getSession(roomId, targetId);
        if (targetSession == null || !targetSession.isOpen()) {
            log.warn("Cannot relay {} from [{}] to [{}]: target peer not found or offline in room [{}]",
                    message.getType(), senderId, targetId, roomId);
            sendError(wsSession, roomId, senderId, "TARGET_NOT_FOUND",
                    "Target user [" + targetId + "] is not active in room [" + roomId + "]");
            return;
        }

        // Direct forward of unmodified SDP to target peer
        log.debug("Relaying {} from [{}] to [{}] in room [{}]", message.getType(), senderId, targetId, roomId);
        boolean sent = targetSession.sendMessage(message);
        if (!sent) {
            log.error("Failed to forward {} to target [{}] in room [{}]", message.getType(), targetId, roomId);
            sendError(wsSession, roomId, senderId, "DELIVERY_FAILED",
                    "Failed to deliver " + message.getType() + " to user [" + targetId + "]");
        }
    }

    private void sendError(WebSocketSession wsSession, String roomId, String targetUserId, String code, String errorMsg) {
        UserSession tempSession = new UserSession(targetUserId, roomId, targetUserId, wsSession);
        tempSession.sendMessage(SignalingMessage.error(roomId, targetUserId, code, errorMsg));
    }
}
