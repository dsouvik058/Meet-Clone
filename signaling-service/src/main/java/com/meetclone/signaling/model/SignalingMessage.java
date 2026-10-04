package com.meetclone.signaling.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.Collection;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class SignalingMessage {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private SignalingMessageType type;
    private String roomId;
    private String senderUserId;
    private String targetUserId;
    private JsonNode data;

    public SignalingMessage() {
    }

    public SignalingMessage(SignalingMessageType type, String roomId, String senderUserId, String targetUserId, JsonNode data) {
        this.type = type;
        this.roomId = roomId;
        this.senderUserId = senderUserId;
        this.targetUserId = targetUserId;
        this.data = data;
    }

    public static SignalingMessage roomJoined(String roomId, String targetUserId, Collection<String> existingPeers) {
        ObjectNode dataNode = OBJECT_MAPPER.createObjectNode();
        ArrayNode peersArray = dataNode.putArray("existingPeers");
        if (existingPeers != null) {
            existingPeers.forEach(peersArray::add);
        }
        return new SignalingMessage(SignalingMessageType.ROOM_JOINED, roomId, "SERVER", targetUserId, dataNode);
    }

    public static SignalingMessage peerJoined(String roomId, String newUserId, String displayName) {
        ObjectNode dataNode = OBJECT_MAPPER.createObjectNode();
        dataNode.put("newUserId", newUserId);
        if (displayName != null) {
            dataNode.put("displayName", displayName);
        }
        return new SignalingMessage(SignalingMessageType.PEER_JOINED, roomId, newUserId, null, dataNode);
    }

    public static SignalingMessage peerLeft(String roomId, String leftUserId) {
        ObjectNode dataNode = OBJECT_MAPPER.createObjectNode();
        dataNode.put("leftUserId", leftUserId);
        return new SignalingMessage(SignalingMessageType.PEER_LEFT, roomId, leftUserId, null, dataNode);
    }

    public static SignalingMessage error(String roomId, String targetUserId, String code, String message) {
        ObjectNode dataNode = OBJECT_MAPPER.createObjectNode();
        dataNode.put("code", code);
        dataNode.put("message", message);
        return new SignalingMessage(SignalingMessageType.ERROR, roomId, "SERVER", targetUserId, dataNode);
    }

    public SignalingMessageType getType() {
        return type;
    }

    public void setType(SignalingMessageType type) {
        this.type = type;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getSenderUserId() {
        return senderUserId;
    }

    public void setSenderUserId(String senderUserId) {
        this.senderUserId = senderUserId;
    }

    public String getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(String targetUserId) {
        this.targetUserId = targetUserId;
    }

    public JsonNode getData() {
        return data;
    }

    public void setData(JsonNode data) {
        this.data = data;
    }

    @Override
    public String toString() {
        return "SignalingMessage{" +
                "type=" + type +
                ", roomId='" + roomId + '\'' +
                ", senderUserId='" + senderUserId + '\'' +
                ", targetUserId='" + targetUserId + '\'' +
                ", data=" + data +
                '}';
    }
}
