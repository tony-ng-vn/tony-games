import { BOARD_SIZE, generateBoard, type NumberPos } from './board';
import type { GamePhase, GameState, Player, RoundFeedback } from '../types';

const ROUND_LOCK_MS = 900;
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createRoomCode(length = 4): string {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export function peerIdForCode(code: string): string {
  return `qn-${code.toUpperCase()}`;
}

export class Room {
  code: string;
  players = new Map<string, Player>();
  phase: GamePhase = 'waiting';
  target = 1;
  board: NumberPos[] = generateBoard();
  claimed: number[] = [];
  lastWinner: RoundFeedback | null = null;
  winnerSlot: number | null = null;
  boardLocked = false;
  private roundTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(code: string) {
    this.code = code.toUpperCase();
  }

  addPlayer(id: string, name: string): { ok: true } | { ok: false; error: string } {
    if (this.players.size >= 2) {
      return { ok: false, error: 'Room is full' };
    }
    if (this.phase !== 'waiting') {
      return { ok: false, error: 'Game already started' };
    }

    const slot = this.players.size;
    const trimmed = name.trim().slice(0, 20) || `Player ${slot + 1}`;
    this.players.set(id, {
      id,
      name: trimmed,
      score: 0,
      slot,
    });

    return { ok: true };
  }

  removePlayer(id: string) {
    if (!this.players.delete(id)) return;

    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }

    if (this.phase === 'waiting') {
      const remaining = [...this.players.values()];
      this.players.clear();
      remaining.forEach((p, index) => {
        this.players.set(p.id, { ...p, slot: index });
      });
      return;
    }

    if (this.phase === 'playing' || this.phase === 'round_feedback') {
      const remaining = [...this.players.values()];
      if (remaining.length === 1) {
        this.phase = 'finished';
        this.boardLocked = true;
        this.winnerSlot = remaining[0].slot;
        this.lastWinner = null;
      } else if (remaining.length === 0) {
        this.phase = 'finished';
        this.boardLocked = true;
        this.winnerSlot = null;
      }
    }
  }

  bothReady() {
    return this.players.size === 2 && this.phase === 'waiting';
  }

  startGame() {
    if (this.players.size !== 2) return;

    this.phase = 'playing';
    this.target = 1;
    this.board = generateBoard();
    this.claimed = [];
    this.lastWinner = null;
    this.winnerSlot = null;
    this.boardLocked = false;
    for (const player of this.players.values()) {
      player.score = 0;
    }
  }

  claim(playerId: string, value: number): { ok: true; finishedTarget: number } | { ok: false; error: string } {
    if (this.phase !== 'playing' || this.boardLocked) {
      return { ok: false, error: 'Board locked' };
    }

    const player = this.players.get(playerId);
    if (!player) {
      return { ok: false, error: 'Not in room' };
    }

    if (value !== this.target) {
      return { ok: false, error: 'Wrong number' };
    }

    if (this.claimed.includes(value)) {
      return { ok: false, error: 'Already claimed' };
    }

    player.score += 1;
    this.claimed.push(value);
    this.lastWinner = {
      playerId: player.id,
      playerName: player.name,
      slot: player.slot,
      target: value,
    };
    this.boardLocked = true;
    this.phase = 'round_feedback';

    return { ok: true, finishedTarget: value };
  }

  scheduleNextRound(emit: (state: GameState) => void) {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
    }

    this.roundTimer = setTimeout(() => {
      this.roundTimer = null;

      if (this.target >= BOARD_SIZE) {
        this.finishGame();
        emit(this.toState());
        return;
      }

      this.target += 1;
      this.boardLocked = false;
      this.phase = 'playing';
      this.lastWinner = null;
      emit(this.toState());
    }, ROUND_LOCK_MS);
  }

  finishGame() {
    this.phase = 'finished';
    this.boardLocked = true;

    const list = [...this.players.values()].sort((a, b) => a.slot - b.slot);
    if (list.length < 2) {
      this.winnerSlot = list[0]?.slot ?? null;
      return;
    }

    if (list[0].score === list[1].score) {
      this.winnerSlot = -1;
    } else if (list[0].score > list[1].score) {
      this.winnerSlot = 0;
    } else {
      this.winnerSlot = 1;
    }
  }

  playAgain() {
    if (this.players.size !== 2) return false;
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
    this.startGame();
    return true;
  }

  destroy() {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
  }

  toState(): GameState {
    const players = [...this.players.values()]
      .sort((a, b) => a.slot - b.slot)
      .map((p) => ({ ...p }));

    return {
      roomCode: this.code,
      phase: this.phase,
      players,
      target: this.target,
      board: this.board,
      claimed: [...this.claimed],
      lastWinner: this.lastWinner,
      winnerSlot: this.winnerSlot,
      boardLocked: this.boardLocked,
    };
  }
}
