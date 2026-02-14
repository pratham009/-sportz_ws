import express from 'express';
import http from 'http';
import { matchRouter } from "./routes/matches.js"
import { attachWebSocketServer } from '../ws/server.js';
import { commentaryRouter } from './routes/commentary.js';

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || 'localhost';

const app = express();
const server = http.createServer(app);

// Middleware for JSON
app.use(express.json());

// Root GET route
app.get('/', (req, res) => {
  res.send({ message: 'Welcome to the Sportz Server!' });
});

app.use('/matches', matchRouter);
app.use('/matches/:matchId/commentary', commentaryRouter);

// Attach WebSocket server
const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

// Start the server
server.listen(PORT, HOST, () => {
  console.log(`🚀 Server is running at http://${HOST}:${PORT}`);
  console.log(`📡 WebSocket available at ws://${HOST}:${PORT}/ws`);
});
