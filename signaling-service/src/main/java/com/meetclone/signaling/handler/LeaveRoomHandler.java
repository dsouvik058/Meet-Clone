package com.meetclone.signaling.handler;

import com.meetclone.signaling.model.Room;
import com.meetclone.signaling.model.SignalingMessage;
import com.meetclone.signaling.model.UserSession;
import com.meetclone.signaling.registry.RoomManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.Optional;

@Component
public class LeaveRoomHandler {

    private static final Logger log = LoggerFactory.getLogger(LeaveRoomHandler.class);

    private final RoomManager roomManager;

    public LeaveRoomHandler(RoomManager roomManager) {
        this.roomManager = roomManager;
    }

    public void handle(SignalingMessage message, WebSocketSession wsSession) {
        String roomId = message.getRoomId();
        String senderId = message.getSenderUserId();

        // If not explicitly provided in the payload, look up by WebSocket session ID
        if (roomId == null || senderId == null) {
            UserSession session = roomManager.getSessionByWsId(wsSession.getId());
            if (session != null) {
                roomId = session.getRoomId();
                senderId = session.getUserId();
            }
        }

        if (roomId != null && senderId != null) {
            handleUserLeave(roomId, senderId);
        } else {
            log.warn("LEAVE_ROOM received but unable to resolve user session (wsSessionId: {})", wsSession.getId());
        }
    }

    public void handleUserLeave(String roomId, String userId) {
        UserSession removed = roomManager.leaveRoom(roomId, userId);
        if (removed != null) {
            Optional<Room> roomOpt = roomManager.getRoom(roomId);
            if (roomOpt.isPresent()) {
                SignalingMessage peerLeftMsg = SignalingMessage.peerLeft(roomId, userId);
                roomOpt.get().broadcastToAll(peerLeftMsg);
                log.info("Broadcasted PEER_LEFT for user [{}] in room [{}]. Remaining occupants: {}",
                        userId, roomId, roomOpt.get().size());
            }
        }
    }
}
