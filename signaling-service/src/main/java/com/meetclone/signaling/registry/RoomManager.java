package com.meetclone.signaling.registry;

import com.meetclone.signaling.model.Room;
import com.meetclone.signaling.model.UserSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RoomManager {

    private static final Logger log = LoggerFactory.getLogger(RoomManager.class);

    private final ConcurrentHashMap<String, Room> rooms = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, UserSession> sessionsByWsId = new ConcurrentHashMap<>();

    public Room getOrCreateRoom(String roomId) {
        return rooms.computeIfAbsent(roomId, Room::new);
    }

    public Optional<Room> getRoom(String roomId) {
        if (roomId == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(rooms.get(roomId));
    }

    public UserSession registerSession(String roomId, String userId, String displayName, WebSocketSession wsSession) {
        Room room = getOrCreateRoom(roomId);
        UserSession userSession = new UserSession(userId, roomId, displayName, wsSession);

        room.addParticipant(userSession);
        sessionsByWsId.put(wsSession.getId(), userSession);

        log.info("Registered user [{}] ({}) in room [{}]. Active peers in room: {}",
                userId, displayName, roomId, room.size());
        return userSession;
    }

    public UserSession leaveRoom(String roomId, String userId) {
        Room room = rooms.get(roomId);
        if (room == null) {
            return null;
        }

        UserSession removed = room.removeParticipant(userId);
        if (removed != null) {
            sessionsByWsId.remove(removed.getWebSocketSessionId());
            log.info("User [{}] left room [{}]. Remaining peers: {}", userId, roomId, room.size());
        }

        if (room.isEmpty()) {
            rooms.remove(roomId);
            log.info("Room [{}] is now empty and has been removed from registry", roomId);
        }

        return removed;
    }

    public UserSession handleDisconnect(WebSocketSession wsSession) {
        if (wsSession == null) {
            return null;
        }

        UserSession session = sessionsByWsId.remove(wsSession.getId());
        if (session != null) {
            log.info("Handling disconnect for user [{}] in room [{}] (wsSessionId: {})",
                    session.getUserId(), session.getRoomId(), wsSession.getId());
            leaveRoom(session.getRoomId(), session.getUserId());
        }
        return session;
    }

    public UserSession getSession(String roomId, String userId) {
        Room room = rooms.get(roomId);
        if (room == null) {
            return null;
        }
        return room.getParticipant(userId);
    }

    public UserSession getSessionByWsId(String wsSessionId) {
        if (wsSessionId == null) {
            return null;
        }
        return sessionsByWsId.get(wsSessionId);
    }

    public List<String> getParticipantUserIds(String roomId) {
        Room room = rooms.get(roomId);
        if (room == null) {
            return Collections.emptyList();
        }
        return List.copyOf(room.getParticipantUserIds());
    }

    public int getActiveRoomCount() {
        return rooms.size();
    }

    public int getActiveSessionCount() {
        return sessionsByWsId.size();
    }
}
