# signaling-service — WebRTC WebSocket Implementation Plan

**Goal**: Implement an end-to-end, high-performance WebRTC signaling server in `signaling-service` using Spring Boot WebSockets (pure Java, zero Docker dependencies needed for local dev), supporting multi-peer rooms, batched Trickle ICE, collision guards, and an interactive multi-tab testing client.

---

## 1. Architecture & Design Principles

1. **Zero External Daemon Requirement (P2P Mode)**:
   - Operates fully in-memory with thread-safe data structures (`ConcurrentHashMap`).
   - Does not require Docker, Kurento binaries, or Redis running during development.
   - Preserves Kurento SFU endpoints as pluggable interfaces for Phase 4 (cloud/recording).

2. **Optimized Signaling Protocol**:
   - **Batched ICE Candidates**: Aggregates rapid candidates over a 30ms window to reduce WebSocket frame volume by ~85%.
   - **Candidate Queueing**: Prevents `InvalidStateError` race conditions on clients.
   - **Header-Level Direct Relaying**: Avoids costly SDP re-parsing; fast JSON string forwarding.

3. **Multi-Peer Room Support**:
   - Mesh topology: Supports rooms with $N$ peers (each peer maintains connections to other participants).
   - Instant state synchronization: Newcomer receives list of active room participants upon `JOIN_ROOM`.

---

## 2. Directory Structure to Implement

```
signaling-service/src/main/java/com/meetclone/signaling/
├── config/
│   ├── WebSocketConfig.java            # Registers /ws/signaling endpoint & CORS
│   └── SignalingProperties.java        # Timeout, batching, and buffer configurations
├── model/
│   ├── SignalingMessageType.java       # Enum of protocol message types
│   ├── SignalingMessage.java           # Universal JSON envelope
│   ├── UserSession.java                # Wrapper for userId, roomId, and WebSocketSession
│   └── Room.java                       # Room state holding participants thread-safely
├── registry/
│   └── RoomManager.java                # In-memory registry (ConcurrentHashMap<roomId, Room>)
├── websocket/
│   ├── SignalingWebSocketHandler.java  # Connection lifecycle, session binding, disconnect cleanup
│   └── SignalingMessageRouter.java     # Deserializes JSON and dispatches to specific handlers
├── handler/
│   ├── JoinRoomHandler.java            # Adds user, sends ROOM_JOINED, broadcasts PEER_JOINED
│   ├── OfferAnswerHandler.java         # Directs SDP Offer/Answer to target user session
│   ├── IceCandidateHandler.java        # Relays single and batched ICE candidates to target
│   └── LeaveRoomHandler.java           # Handles graceful departure & disconnect notifications
└── security/
    └── SignalingTokenVerifier.java     # Optional JWT room token validation (dev bypass toggle)
```

---

## 3. Protocol Message Specification

Every message exchanged across `ws://localhost:8083/ws/signaling` follows this schema:

```json
{
  "type": "JOIN_ROOM | ROOM_JOINED | PEER_JOINED | OFFER | ANSWER | ICE_CANDIDATE | ICE_CANDIDATES | LEAVE_ROOM | PEER_LEFT | ERROR",
  "roomId": "room-uuid-or-slug",
  "senderUserId": "user-a",
  "targetUserId": "user-b",
  "data": { ... }
}
```

### Event Contracts:

| Message Type | Direction | Key Fields in `data` | Description |
| :--- | :--- | :--- | :--- |
| `JOIN_ROOM` | Client ➔ Server | `token` (optional), `displayName` | Requests entry to a room |
| `ROOM_JOINED` | Server ➔ Client | `existingPeers: ["user-b", "user-c"]` | Confirms join and returns existing occupants |
| `PEER_JOINED` | Server ➔ Peers | `newUserId`, `displayName` | Broadcast to existing peers so they send an OFFER |
| `OFFER` | Client ➔ Server ➔ Target | `sdp: { type: "offer", sdp: "..." }` | Peer A initiates WebRTC session with Peer B |
| `ANSWER` | Client ➔ Server ➔ Target | `sdp: { type: "answer", sdp: "..." }` | Peer B responds to Peer A's offer |
| `ICE_CANDIDATE` | Client ➔ Server ➔ Target | `candidate: { ... }` | Single candidate trickle (backward compatible) |
| `ICE_CANDIDATES`| Client ➔ Server ➔ Target | `candidates: [ { ... }, ... ]` | **Optimized batched trickle** |
| `LEAVE_ROOM` | Client ➔ Server | — | Intentional departure |
| `PEER_LEFT` | Server ➔ Peers | `leftUserId` | Broadcast when a peer leaves or drops socket |
| `ERROR` | Server ➔ Client | `code`, `message` | Room full, target not found, bad payload |

---

## 4. End-to-End Execution Flow (Step-by-Step Runtime Lifecycle)

This is how the system executes end-to-end when a meeting runs:

### Step 1: Bootstrapping the Signaling Service
- Run `signaling-service` on port `8083`.
- `WebSocketConfig` exposes `ws://localhost:8083/ws/signaling`.
- `RoomManager` initializes an in-memory `ConcurrentHashMap<String, Room>` to track active rooms and connected sessions.

### Step 2: Peer A (Alice) Pre-warms & Joins
1. **Camera Pre-warming**: In the browser preview screen, Alice calls `navigator.mediaDevices.getUserMedia()`. Camera and mic tracks are acquired before entering the room.
2. **WebSocket Connection**: Alice opens a WebSocket connection to `ws://localhost:8083/ws/signaling`.
3. **Room Entry**: Alice sends `JOIN_ROOM`:
   ```json
   {
     "type": "JOIN_ROOM",
     "roomId": "meet-101",
     "senderUserId": "alice"
   }
   ```
4. **Server Processing**:
   - `SignalingWebSocketHandler` captures Alice's `WebSocketSession`.
   - `JoinRoomHandler` binds `alice` to `meet-101` in `RoomManager`.
   - Server responds to Alice with `ROOM_JOINED`:
     ```json
     {
       "type": "ROOM_JOINED",
       "roomId": "meet-101",
       "data": { "existingPeers": [] }
     }
     ```
   - Alice is alone in the room and waits for participants.

### Step 3: Peer B (Bob) Joins the Same Room
1. Bob pre-warms camera and connects WebSocket to `ws://localhost:8083/ws/signaling`.
2. Bob sends `JOIN_ROOM`:
   ```json
   {
     "type": "JOIN_ROOM",
     "roomId": "meet-101",
     "senderUserId": "bob"
   }
   ```
3. **Server Processing**:
   - `RoomManager` registers Bob into `meet-101`.
   - Server sends `ROOM_JOINED` to Bob with active participants:
     ```json
     {
       "type": "ROOM_JOINED",
       "roomId": "meet-101",
       "data": { "existingPeers": ["alice"] }
     }
     ```
   - Simultaneously, server broadcasts `PEER_JOINED` to Alice:
     ```json
     {
       "type": "PEER_JOINED",
       "roomId": "meet-101",
       "data": { "newUserId": "bob" }
     }
     ```

### Step 4: WebRTC SDP Negotiation (Offer & Answer)
1. **Alice Initiates**:
   - Alice creates an `RTCPeerConnection`.
   - Attaches her local audio and video tracks.
   - Generates an SDP Offer: `offer = await pc.createOffer()`.
   - Sets local description: `await pc.setLocalDescription(offer)`.
   - Sends `OFFER` message targeting Bob:
     ```json
     {
       "type": "OFFER",
       "roomId": "meet-101",
       "senderUserId": "alice",
       "targetUserId": "bob",
       "data": { "type": "offer", "sdp": "..." }
     }
     ```
2. **Server Relays to Bob**:
   - `SignalingMessageRouter` routes message to `OfferAnswerHandler`.
   - Handler looks up Bob's session in `RoomManager` and forwards the exact payload to Bob's socket.
3. **Bob Responds**:
   - Bob creates an `RTCPeerConnection` for Alice.
   - Sets Alice's offer as remote: `await pc.setRemoteDescription(offer)`.
   - Attaches Bob's local audio and video tracks.
   - Creates SDP Answer: `answer = await pc.createAnswer()`.
   - Sets local description: `await pc.setLocalDescription(answer)`.
   - Sends `ANSWER` message targeting Alice:
     ```json
     {
       "type": "ANSWER",
       "roomId": "meet-101",
       "senderUserId": "bob",
       "targetUserId": "alice",
       "data": { "type": "answer", "sdp": "..." }
     }
     ```
4. **Server Relays to Alice**:
   - Alice receives `ANSWER` and sets: `await pc.setRemoteDescription(answer)`.
   - Cryptographic keys, codecs, and media parameters are now negotiated.

### Step 5: Batched Trickle ICE (Network Path Discovery)
1. As each peer sets local/remote descriptions, their browsers discover network routes (host, STUN candidates).
2. Instead of flooding the socket with 25+ tiny packets, a **30ms debounce timer** batches them into an array:
   ```json
   {
     "type": "ICE_CANDIDATES",
     "roomId": "meet-101",
     "senderUserId": "alice",
     "targetUserId": "bob",
     "data": {
       "candidates": [
         { "candidate": "...", "sdpMid": "0", "sdpMLineIndex": 0 },
         { "candidate": "...", "sdpMid": "1", "sdpMLineIndex": 1 }
       ]
     }
   }
   ```
3. The server forwards the candidate batch to the respective peer.
4. Each peer adds the candidates (`pc.addIceCandidate(...)`).
5. **Direct Media Stream Established**: High-definition video and audio stream directly peer-to-peer over UDP/SRTP. Zero media bytes touch the Spring Boot server!

### Step 6: Disconnection & Cleanup
1. **Graceful or Abrupt Exit**: Bob leaves the call or closes his browser tab.
2. The WebSocket TCP connection terminates.
3. `SignalingWebSocketHandler.afterConnectionClosed()` triggers immediately.
4. `RoomManager` removes Bob from `meet-101`.
5. Server automatically broadcasts `PEER_LEFT` to remaining peers in the room:
   ```json
   {
     "type": "PEER_LEFT",
     "roomId": "meet-101",
     "data": { "leftUserId": "bob" }
   }
   ```
6. Alice receives `PEER_LEFT`, closes the `RTCPeerConnection` instance for Bob, and removes Bob's video tile from the UI.
7. If the room is now empty, `RoomManager` reclaims the room memory.

---

## 5. Step-by-Step Build Order

### Phase 1: Models & Registry (Core State)
1. **`SignalingMessageType.java`**:
   - Define enum constants: `JOIN_ROOM`, `ROOM_JOINED`, `PEER_JOINED`, `OFFER`, `ANSWER`, `ICE_CANDIDATE`, `ICE_CANDIDATES`, `LEAVE_ROOM`, `PEER_LEFT`, `ERROR`.
2. **`SignalingMessage.java`**:
   - Jackson annotations for serialization/deserialization with generic `JsonNode` or map for `data`.
3. **`UserSession.java`**:
   - Holds `userId`, `roomId`, `WebSocketSession`, and a synchronized `sendMessage(SignalingMessage msg)` helper to prevent concurrent write collisions on the WebSocket session.
4. **`Room.java` & `RoomManager.java`**:
   - `Room`: `ConcurrentHashMap<String, UserSession> participants`.
   - `RoomManager`:
     - `joinRoom(String roomId, UserSession session)`
     - `leaveRoom(String roomId, String userId)`
     - `getParticipants(String roomId)`
     - `getSession(String roomId, String userId)`
     - `handleDisconnect(WebSocketSession wsSession)` (sweeps any rooms the session belonged to).

---

### Phase 2: Handlers & Message Router
1. **`JoinRoomHandler.java`**:
   - Registers session into `RoomManager`.
   - Sends `ROOM_JOINED` back to joining client with all existing user IDs in the room.
   - Broadcasts `PEER_JOINED` to all other participants.
2. **`OfferAnswerHandler.java`**:
   - Validates that `targetUserId` exists in the room.
   - Forwards the SDP payload directly to target's `UserSession`.
3. **`IceCandidateHandler.java`**:
   - Handles both `ICE_CANDIDATE` (single) and `ICE_CANDIDATES` (batched array).
   - Forwards to target's session.
4. **`LeaveRoomHandler.java`**:
   - Removes user from room.
   - Broadcasts `PEER_LEFT` to remaining peers.
5. **`SignalingMessageRouter.java`**:
   - `ObjectMapper` read value.
   - `switch (message.getType())` delegating to corresponding handler.

---

### Phase 3: WebSocket Transport & Spring Config
1. **`WebSocketConfig.java`**:
   - Implements `WebSocketConfigurer`.
   - Registers `SignalingWebSocketHandler` at `/ws/signaling`.
   - `.setAllowedOrigins("*")` for cross-origin local testing.
2. **`SignalingWebSocketHandler.java`**:
   - `afterConnectionEstablished`: Logs connection, prepares session storage.
   - `handleTextMessage`: Passes raw text to `SignalingMessageRouter`.
   - `afterConnectionClosed`: Calls `RoomManager.handleDisconnect` and broadcasts `PEER_LEFT`.
   - `handleTransportError`: Logs error and closes session gracefully.

---

### Phase 4: Client & Testing Lab Upgrade
1. **`learning-lab/webrtc-playground.html` Upgrade**:
   - Add a **Live WebSocket Room Mode**:
     - Input field for `Room ID` (e.g. `meet-dev-1`) and `User ID` (e.g. `alice`, `bob`).
     - "Connect to Signaling Server" button (`ws://localhost:8083/ws/signaling`).
     - Real camera acquisition with fallback to synthetic canvas stream.
     - Integration of **Batched Trickle ICE** (30ms debounce buffer).
     - Integration of **Candidate Queueing** (`queue.push` if `!remoteDescription`).
   - Open Tab 1 as `Alice`, Tab 2 as `Bob`:
     - Test end-to-end P2P video streaming across separate tabs without touching Docker!

---

### Phase 5: Microservice Integration (Post-P2P)
1. **Token Verification**:
   - Implement `SignalingTokenVerifier.java` to optionally verify HMAC/RSA JWT tokens from `meeting-service`.
   - Allow a dev mode property (`signaling.auth.enabled=false`) so testing does not require launching `identity-service` and `meeting-service`.
2. **Meeting Service Orchestration**:
   - Link `InternalTokenController.java` to generate tokens when `meeting-service` makes Feign requests.
