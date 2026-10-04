package com.meetclone.signaling.model;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

public class Room {

    private static final Logger log = LoggerFactory.getLogger(Room.class);

    private final String roomId;
    private final ConcurrentHashMap<String, UserSession> participants = new ConcurrentHashMap<>();
    private final long createdAt;

    public Room(String roomId) {
        this.roomId = roomId;
        this.createdAt = System.currentTimeMillis();
    }

    public void addParticipant(UserSession session) {
        UserSession previous = participants.put(session.getUserId(), session);
        if (previous != null && previous != session) {
            log.info("Replaced existing session for user {} in room {}", session.getUserId(), roomId);
            previous.close();
        }
    }

    public UserSession removeParticipant(String userId) {
        return participants.remove(userId);
    }

    public UserSession getParticipant(String userId) {
        return participants.get(userId);
    }

    public Collection<UserSession> getParticipants() {
        return Collections.unmodifiableCollection(participants.values());
    }

    public Set<String> getParticipantUserIds() {
        return Collections.unmodifiableSet(participants.keySet());
    }

    public List<String> getOtherParticipantUserIds(String currentUserId) {
        return participants.keySet().stream()
                .filter(id -> !id.equals(currentUserId))
                .collect(Collectors.toList());
    }

    public void broadcast(SignalingMessage message, String excludeUserId) {
        for (UserSession participant : participants.values()) {
            if (excludeUserId != null && excludeUserId.equals(participant.getUserId())) {
                continue;
            }
            participant.sendMessage(message);
        }
    }

    public void broadcastToAll(SignalingMessage message) {
        broadcast(message, null);
    }

    public boolean isEmpty() {
        return participants.isEmpty();
    }

    public int size() {
        return participants.size();
    }

    public String getRoomId() {
        return roomId;
    }

    public long getCreatedAt() {
        return createdAt;
    }
}
