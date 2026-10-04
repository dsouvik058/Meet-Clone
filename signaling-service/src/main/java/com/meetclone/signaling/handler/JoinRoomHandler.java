package com.meetclone.signaling.handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.meetclone.signaling.model.Room;
import com.meetclone.signaling.model.SignalingMessage;
import com.meetclone.signaling.model.UserSession;
import com.meetclone.signaling.registry.RoomManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.List;
import java.util.Optional;

@Component
public class JoinRoomHandler {

    private static final Logger log = LoggerFactory.getLogger(JoinRoomHandler.class);

    private final RoomManager roomManager;

    public JoinRoomHandler(RoomManager roomManager) {
        this.roomManager = roomManager;
    }

    public void handle(SignalingMessage message, WebSocketSession wsSession) {
        String roomId = message.getRoomId();
        String userId = message.getSenderUserId();

        if (roomId == null || roomId.trim().isEmpty() || userId == null || userId.trim().isEmpty()) {
            log.warn("Rejected JOIN_ROOM: roomId or senderUserId is missing (wsSessionId: {})", wsSession.getId());
            UserSession ephemeralSession = new UserSession("anonymous", "unknown", "unknown", wsSession);
            ephemeralSession.sendMessage(SignalingMessage.error(roomId, userId, "INVALID_PAYLOAD", "roomId and senderUserId are required"));
            return;
        }

        String displayName = userId;
        JsonNode data = message.getData();
        if (data != null && data.hasNonNull("displayName")) {
            displayName = data.get("displayName").asText();
        }

        // 1. Discover already connected peers before registering newcomer
        Optional<Room> existingRoomOpt = roomManager.getRoom(roomId);
        List<String> existingPeers = existingRoomOpt
                .map(room -> room.getOtherParticipantUserIds(userId))
                .orElse(List.of());

        // 2. Register participant in RoomManager
        UserSession userSession = roomManager.registerSession(roomId, userId, displayName, wsSession);

        // 3. Respond to newcomer with list of peers already present in the room
        SignalingMessage roomJoinedMsg = SignalingMessage.roomJoined(roomId, userId, existingPeers);
        userSession.sendMessage(roomJoinedMsg);

        // 4. Announce newcomer arrival to all existing peers in the room
        Room room = roomManager.getOrCreateRoom(roomId);
        SignalingMessage peerJoinedMsg = SignalingMessage.peerJoined(roomId, userId, displayName);
        room.broadcast(peerJoinedMsg, userId);

        log.info("User [{}] ({}) joined room [{}]. Discovered {} existing peer(s)",
                userId, displayName, roomId, existingPeers.size());
    }
}
