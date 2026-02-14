import { WebSocketServer } from 'ws';
import { wsArcjet } from '../src/arcjet.js';

/**
 * Send a JSON-encoded payload over a WebSocket if the socket is open.
 *
 * If the socket is not in the open state, this function does nothing.
 *
 * @param {import('ws').WebSocket} socket - The WebSocket to send the payload on.
 * @param {*} payload - The value to JSON-serialize and send.
 */
function sendJson(socket, payload) {
  if (socket.readyState !== 1) return; // 1 = OPEN
  socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(message);
    }
  }
}

/**
 * Attach a WebSocket endpoint to the provided HTTP server and expose helpers for broadcasting events.
 *
 * Binds a WebSocket server at path "/ws" and registers handlers for incoming connections, messages, and errors.
 *
 * @param {import('http').Server} server - HTTP server to attach the WebSocket endpoint to.
 * @returns {{ broadcast: (payload: any) => void, broadcastMatchCreated: (match: any) => void, broadcastMatchUpdated: (match: any) => void, broadcastCommentary: (commentary: any) => void }}
 * An object with helper functions:
 * - `broadcast(payload)` — send `payload` to all connected clients.
 * - `broadcastMatchCreated(match)` — broadcast a `match_created` event with `match` as data.
 * - `broadcastMatchUpdated(match)` — broadcast a `match_updated` event with `match` as data.
 * - `broadcastCommentary(commentary)` — broadcast a `commentary_added` event with `commentary` as data.
 */
export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 1024 * 1024 });

  wss.on('connection', async(socket ,req) => {
    if(wsArcjet){
      try{
        const decision = await wsArcjet.protect(req);
        if (decision.isDenied()){
          const code = decision.reason.isRateLimit() ? 1013 :1008;
          const reason = decision.reason.isRateLimit()? 'Rate limit exceeded':'Access denied';

          socket.close(code,reason);
          return;
        }

      }catch (e){
        console.error('WS connection error',e );
        socket.close(1011, 'Server security error');
        return
      }
    }
    console.log('✅ Client connected to WebSocket');
    sendJson(socket, { type: 'welcome', message: 'Connected to Sportz server' });

    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('📨 Received:', message);
        broadcast(wss, { type: 'message', data: message });
      } catch (e) {
        sendJson(socket, { type: 'error', message: 'Invalid JSON' });
      }
    });

    socket.on('close', () => {
      console.log('❌ Client disconnected');
    });

    socket.on('error', console.error);
  });

  function broadcastMatchCreated(match) {
    broadcast(wss, { type: 'match_created', data: match });
  }

  function broadcastMatchUpdated(match) {
    broadcast(wss, { type: 'match_updated', data: match });
  }

  function broadcastCommentary(commentary) {
    broadcast(wss, { type: 'commentary_added', data: commentary });
  }

  return {
    broadcast: (payload) => broadcast(wss, payload),
    broadcastMatchCreated,
    broadcastMatchUpdated,
    broadcastCommentary,
  };
}

