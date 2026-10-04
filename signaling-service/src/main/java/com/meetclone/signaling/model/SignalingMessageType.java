package com.meetclone.signaling.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum SignalingMessageType {
    JOIN_ROOM("JOIN_ROOM"),
    ROOM_JOINED("ROOM_JOINED"),
    PEER_JOINED("PEER_JOINED"),
    OFFER("OFFER"),
    ANSWER("ANSWER"),
    ICE_CANDIDATE("ICE_CANDIDATE"),
    ICE_CANDIDATES("ICE_CANDIDATES"),
    LEAVE_ROOM("LEAVE_ROOM"),
    PEER_LEFT("PEER_LEFT"),
    ERROR("ERROR");

    private final String value;

    SignalingMessageType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static SignalingMessageType fromValue(String value) {
        if (value == null) {
            return null;
        }
        for (SignalingMessageType type : values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown signaling message type: " + value);
    }
}
