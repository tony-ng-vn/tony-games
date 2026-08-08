import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Room, createRoomCode } from './room.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: isProd ? false : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
  },
});

/** @type {Map<string, Room>} */
const rooms = new Map();

/** @type {Map<string, string>} socketId -> roomCode */
const socketRoom = new Map();

function getUniqueRoomCode() {
  for (let i = 0; i < 20; i += 1) {
    const code = createRoomCode();
    if (!rooms.has(code)) return code;
  }
  return createRoomCode(6);
}

/**
 * @param {Room} room
 */
function emitRoom(room) {
  io.to(room.code).emit('game:state', room.toState());
}

io.on('connection', (socket) => {
  socket.on('room:create', ({ name }, ack) => {
    const code = getUniqueRoomCode();
    const room = new Room(code);
    const result = room.addPlayer(socket.id, name || 'Player 1');
    if (!result.ok) {
      ack?.({ ok: false, error: result.error });
      return;
    }

    rooms.set(code, room);
    socketRoom.set(socket.id, code);
    socket.join(code);
    const state = room.toState();
    ack?.({ ok: true, playerId: socket.id, state });
    socket.emit('game:state', state);
  });

  socket.on('room:join', ({ code, name }, ack) => {
    const normalized = String(code || '')
      .trim()
      .toUpperCase();
    const room = rooms.get(normalized);
    if (!room) {
      ack?.({ ok: false, error: 'Room not found' });
      return;
    }

    const result = room.addPlayer(socket.id, name || 'Player 2');
    if (!result.ok) {
      ack?.({ ok: false, error: result.error });
      return;
    }

    socketRoom.set(socket.id, room.code);
    socket.join(room.code);

    if (room.bothReady()) {
      room.startGame();
    }

    const state = room.toState();
    ack?.({ ok: true, playerId: socket.id, state });
    emitRoom(room);
  });

  socket.on('game:claim', ({ value }, ack) => {
    const code = socketRoom.get(socket.id);
    if (!code) {
      ack?.({ ok: false, error: 'Not in a room' });
      return;
    }

    const room = rooms.get(code);
    if (!room) {
      ack?.({ ok: false, error: 'Room not found' });
      return;
    }

    const result = room.claim(socket.id, Number(value));
    if (!result.ok) {
      ack?.({ ok: false, error: result.error });
      return;
    }

    ack?.({ ok: true });
    emitRoom(room);
    room.scheduleNextRound((state) => {
      io.to(room.code).emit('game:state', state);
    });
  });

  socket.on('game:playAgain', (_payload, ack) => {
    const respond = typeof _payload === 'function' ? _payload : ack;
    const code = socketRoom.get(socket.id);
    if (!code) {
      respond?.({ ok: false, error: 'Not in a room' });
      return;
    }

    const room = rooms.get(code);
    if (!room) {
      respond?.({ ok: false, error: 'Room not found' });
      return;
    }

    if (room.phase !== 'finished') {
      respond?.({ ok: false, error: 'Game not finished' });
      return;
    }

    if (room.players.size < 2) {
      respond?.({ ok: false, error: 'Need 2 players' });
      return;
    }

    room.playAgain();
    respond?.({ ok: true });
    emitRoom(room);
  });

  socket.on('disconnect', () => {
    const code = socketRoom.get(socket.id);
    socketRoom.delete(socket.id);
    if (!code) return;

    const room = rooms.get(code);
    if (!room) return;

    room.removePlayer(socket.id);

    if (room.players.size === 0) {
      if (room.roundTimer) clearTimeout(room.roundTimer);
      rooms.delete(code);
      return;
    }

    emitRoom(room);
  });
});

if (isProd) {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });
}

httpServer.listen(PORT, () => {
  console.log(`Quick Number server on http://localhost:${PORT}`);
});
