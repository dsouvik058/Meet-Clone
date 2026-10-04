package com.meetclone.signaling.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meetclone.signaling.handler.IceCandidateHandler;
import com.meetclone.signaling.handler.JoinRoomHandler;
import com.meetclone.signaling.handler.LeaveRoomHandler;
import com.meetclone.signaling.handler.OfferAnswerHandler;
import com.meetclone.signaling.model.SignalingMessage;
import com.meetclone.signaling.model.UserSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

@Component
public class SignalingMessageRouter {

    private static final Logger log = LoggerFactory.getLogger(SignalingMessageRouter.class);

    private final ObjectMapper objectMapper;
    private final JoinRoomHandler joinRoomHandler;
    private final OfferAnswerHandler offerAnswerHandler;
    private final IceCandidateHandler iceCandidateHandler;
    private final LeaveRoomHandler leaveRoomHandler;

    public SignalingMessageRouter(ObjectMapper objectMapper,
                                  JoinRoomHandler joinRoomHandler,
                                  OfferAnswerHandler offerAnswerHandler,
                                  IceCandidateHandler iceCandidateHandler,
                                  LeaveRoomHandler leaveRoomHandler) {
        this.objectMapper = objectMapper;
        this.joinRoomHandler = joinRoomHandler;
        this.offerAnswerHandler = offerAnswerHandler;
        this.iceCandidateHandler = iceCandidateHandler;
        this.leaveRoomHandler = leaveRoomHandler;
    }

    public void routeMessage(WebSocketSession session, TextMessage textMessage) {
        String payload = textMessage.getPayload();
        SignalingMessage message;

        try {
            message = objectMapper.readValue(payload, SignalingMessage.class);
        } catch (JsonProcessingException e) {
            log.error("Malformed JSON payload received from wsSession [{}]: {}", session.getId(), e.getMessage());
            sendError(session, "PARSE_ERROR", "Invalid JSON format: " + e.getOriginalMessage());
            return;
        }

        if (message == null || message.getType() == null) {
            log.warn("Received signaling frame without 'type' from wsSession [{}]", session.getId());
            sendError(session, "MISSING_TYPE", "Signaling message must contain a valid 'type'");
            return;
        }

        log.debug("Routing frame [type={}] for room [{}] from sender [{}]",
                message.getType(), message.getRoomId(), message.getSenderUserId());

        switch (message.getType()) {
            case JOIN_ROOM -> joinRoomHandler.handle(message, session);
            case OFFER, ANSWER -> offerAnswerHandler.handle(message, session);
            case ICE_CANDIDATE, ICE_CANDIDATES -> iceCandidateHandler.handle(message, session);
            case LEAVE_ROOM -> leaveRoomHandler.handle(message, session);
            default -> {
                log.warn("Unhandled message type: {}", message.getType());
                sendError(session, "UNSUPPORTED_TYPE", "Unsupported signaling type: " + message.getType());
            }
        }
    }

    private void sendError(WebSocketSession session, String code, String message) {
        UserSession ephemeralSession = new UserSession("anonymous", "unknown", "unknown", session);
        ephemeralSession.sendMessage(SignalingMessage.error(null, null, code, message));
    }
}
