import { WebSocketServer } from 'ws';
import { wsArcjet } from '../src/arcjet.js';

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


