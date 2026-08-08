import Peer, { type DataConnection } from 'peerjs';
import { createRoomCode, peerIdForCode, Room } from './room';
import type { GameState } from '../types';

type WireMessage =
  | { type: 'hello'; name: string }
  | { type: 'welcome'; playerId: string; state: GameState }
  | { type: 'state'; state: GameState }
  | { type: 'claim'; value: number }
  | { type: 'playAgain' }
  | { type: 'error'; error: string };

export type SessionHandlers = {
  onState: (state: GameState) => void;
  onPlayerId: (playerId: string) => void;
  onError: (error: string) => void;
};

function openPeer(id?: string): Promise<Peer> {
  return new Promise((resolve, reject) => {
    const peer = id
      ? new Peer(id, { debug: 0 })
      : new Peer({ debug: 0 });

    const onOpen = () => {
      cleanup();
      resolve(peer);
    };
    const onError = (err: Error) => {
      cleanup();
      peer.destroy();
      reject(err);
    };
    const cleanup = () => {
      peer.off('open', onOpen);
      peer.off('error', onError);
    };

    peer.on('open', onOpen);
    peer.on('error', onError);
  });
}

export class GameSession {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private room: Room | null = null;
  private role: 'host' | 'guest' | null = null;
  private localPlayerId: string | null = null;
  private handlers: SessionHandlers;
  private disposed = false;

  constructor(handlers: SessionHandlers) {
    this.handlers = handlers;
  }

  async create(name: string): Promise<void> {
    this.disposeInternal();
    this.disposed = false;

    let code = createRoomCode();
    let peer: Peer | null = null;
    let lastError: unknown;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        peer = await openPeer(peerIdForCode(code));
        break;
      } catch (err) {
        lastError = err;
        code = createRoomCode();
      }
    }

    if (!peer) {
      throw lastError instanceof Error ? lastError : new Error('Could not create room');
    }

    this.peer = peer;
    this.role = 'host';
    this.localPlayerId = peer.id;
    this.room = new Room(code);

    const added = this.room.addPlayer(peer.id, name);
    if (!added.ok) {
      this.disposeInternal();
      throw new Error(added.error);
    }

    this.handlers.onPlayerId(peer.id);
    this.emitState();

    peer.on('connection', (conn) => {
      if (this.disposed || !this.room) return;

      if (this.conn || this.room.players.size >= 2) {
        conn.on('open', () => {
          this.send(conn, { type: 'error', error: 'Room is full' });
          conn.close();
        });
        return;
      }

      this.attachHostConnection(conn);
    });

    peer.on('disconnected', () => {
      if (!this.disposed) peer.reconnect();
    });

    peer.on('error', (err) => {
      this.handlers.onError(err.message || 'Connection error');
    });
  }

  async join(name: string, code: string): Promise<void> {
    this.disposeInternal();
    this.disposed = false;

    const normalized = code.trim().toUpperCase();
    if (normalized.length < 4) {
      throw new Error('Enter a valid room code');
    }

    const peer = await openPeer();
    this.peer = peer;
    this.role = 'guest';
    this.localPlayerId = peer.id;
    this.handlers.onPlayerId(peer.id);

    const conn = peer.connect(peerIdForCode(normalized), { reliable: true });
    this.conn = conn;

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Could not reach room. Check the code and try again.'));
      }, 12000);

      const onOpen = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error('Could not join room'));
      };
      const cleanup = () => {
        clearTimeout(timer);
        conn.off('open', onOpen);
        conn.off('error', onError);
      };

      conn.on('open', onOpen);
      conn.on('error', onError);
    });

    conn.on('data', (raw) => {
      this.onGuestMessage(raw);
    });

    conn.on('close', () => {
      if (!this.disposed) {
        this.handlers.onError('Disconnected from host');
      }
    });

    this.send(conn, { type: 'hello', name });
  }

  claim(value: number) {
    if (this.role === 'host' && this.room && this.localPlayerId) {
      const result = this.room.claim(this.localPlayerId, value);
      if (!result.ok) return;
      this.emitState();
      this.room.scheduleNextRound((state) => this.broadcastState(state));
      return;
    }

    if (this.role === 'guest' && this.conn?.open) {
      this.send(this.conn, { type: 'claim', value });
    }
  }

  playAgain() {
    if (this.role === 'host' && this.room) {
      if (!this.room.playAgain()) {
        this.handlers.onError('Need 2 players to play again');
        return;
      }
      this.emitState();
      return;
    }

    if (this.role === 'guest' && this.conn?.open) {
      this.send(this.conn, { type: 'playAgain' });
    }
  }

  dispose() {
    this.disposed = true;
    this.disposeInternal();
  }

  private attachHostConnection(conn: DataConnection) {
    this.conn = conn;

    conn.on('open', () => {
      // wait for hello
    });

    conn.on('data', (raw) => {
      this.onHostMessage(conn, raw);
    });

    conn.on('close', () => {
      if (!this.room || this.disposed) return;
      if (this.localPlayerId) {
        // guest left — remove non-host player
        for (const player of this.room.players.values()) {
          if (player.id !== this.localPlayerId) {
            this.room.removePlayer(player.id);
          }
        }
      }
      this.conn = null;
      this.emitState();
    });
  }

  private onHostMessage(conn: DataConnection, raw: unknown) {
    if (!this.room || !this.localPlayerId) return;
    const msg = raw as WireMessage;

    switch (msg.type) {
      case 'hello': {
        if (this.room.players.size >= 2) {
          this.send(conn, { type: 'error', error: 'Room is full' });
          conn.close();
          return;
        }
        const guestId = conn.peer;
        const added = this.room.addPlayer(guestId, msg.name);
        if (!added.ok) {
          this.send(conn, { type: 'error', error: added.error });
          conn.close();
          return;
        }
        if (this.room.bothReady()) {
          this.room.startGame();
        }
        this.send(conn, {
          type: 'welcome',
          playerId: guestId,
          state: this.room.toState(),
        });
        this.emitState();
        return;
      }
      case 'claim': {
        const result = this.room.claim(conn.peer, Number(msg.value));
        if (!result.ok) return;
        this.emitState();
        this.room.scheduleNextRound((state) => this.broadcastState(state));
        return;
      }
      case 'playAgain': {
        if (this.room.playAgain()) {
          this.emitState();
        }
        return;
      }
      case 'welcome':
      case 'state':
      case 'error':
        return;
      default: {
        const _exhaustive: never = msg;
        return _exhaustive;
      }
    }
  }

  private onGuestMessage(raw: unknown) {
    const msg = raw as WireMessage;

    switch (msg.type) {
      case 'welcome':
        this.localPlayerId = msg.playerId;
        this.handlers.onPlayerId(msg.playerId);
        this.handlers.onState(msg.state);
        return;
      case 'state':
        this.handlers.onState(msg.state);
        return;
      case 'error':
        this.handlers.onError(msg.error);
        return;
      case 'hello':
      case 'claim':
      case 'playAgain':
        return;
      default: {
        const _exhaustive: never = msg;
        return _exhaustive;
      }
    }
  }

  private emitState() {
    if (!this.room) return;
    this.broadcastState(this.room.toState());
  }

  private broadcastState(state: GameState) {
    this.handlers.onState(state);
    if (this.conn?.open) {
      this.send(this.conn, { type: 'state', state });
    }
  }

  private send(conn: DataConnection, message: WireMessage) {
    try {
      conn.send(message);
    } catch {
      // ignore send failures on closing connections
    }
  }

  private disposeInternal() {
    this.room?.destroy();
    this.room = null;
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.role = null;
    this.localPlayerId = null;
  }
}
