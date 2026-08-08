import { io, Socket } from 'socket.io-client';
import type { GameState } from './types';

export type ServerToClientEvents = {
  'game:state': (state: GameState) => void;
};

export type ClientToServerEvents = {
  'room:create': (
    payload: { name: string },
    ack?: (res: { ok: boolean; error?: string; playerId?: string; state?: GameState }) => void,
  ) => void;
  'room:join': (
    payload: { code: string; name: string },
    ack?: (res: { ok: boolean; error?: string; playerId?: string; state?: GameState }) => void,
  ) => void;
  'game:claim': (
    payload: { value: number },
    ack?: (res: { ok: boolean; error?: string }) => void,
  ) => void;
  'game:playAgain': (
    payload: Record<string, never>,
    ack?: (res: { ok: boolean; error?: string }) => void,
  ) => void;
};

const url = import.meta.env.VITE_SOCKET_URL as string | undefined;

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  url || undefined,
  {
    autoConnect: true,
    transports: ['websocket', 'polling'],
  },
);
