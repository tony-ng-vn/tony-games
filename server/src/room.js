import { BOARD_SIZE, generateBoard } from './board.js';

const ROUND_LOCK_MS = 900;
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * @param {number} length
 */
export function createRoomCode(length = 4) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export class Room {
  /**
   * @param {string} code
   */
  constructor(code) {
    this.code = code;
    /** @type {Map<string, { id: string, name: string, score: number, slot: number }>} */
    this.players = new Map();
    /** @type {'waiting' | 'playing' | 'round_feedback' | 'finished'} */
    this.phase = 'waiting';
    this.target = 1;
    this.board = generateBoard();
    /** @type {number[]} */
    this.claimed = [];
    /** @type {{ playerId: string, playerName: string, slot: number, target: number } | null} */
    this.lastWinner = null;
    /** @type {number | null} */
    this.winnerSlot = null;
    this.boardLocked = false;
    /** @type {ReturnType<typeof setTimeout> | null} */
    this.roundTimer = null;
  }

  /**
   * @param {string} id
   * @param {string} name
   */
  addPlayer(id, name) {
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

  /**
   * @param {string} id
   */
  removePlayer(id) {
    const existed = this.players.delete(id);
    if (!existed) return;

    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }

    if (this.phase === 'waiting') {
      // Re-slot remaining player to 0
      const remaining = [...this.players.values()];
      this.players.clear();
      remaining.forEach((p, index) => {
        this.players.set(p.id, { ...p, slot: index });
      });
      return;
    }

    // Mid-game disconnect: end the game for the remaining player
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

  /**
   * @param {string} playerId
   * @param {number} value
   */
  claim(playerId, value) {
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

  /**
   * Advance to next target or finish the game.
   * @param {(state: ReturnType<Room['toState']>) => void} emit
   */
  scheduleNextRound(emit) {
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

  toState() {
    const players = [...this.players.values()]
      .sort((a, b) => a.slot - b.slot)
      .map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        slot: p.slot,
      }));

    return {
      roomCode: this.code,
      phase: this.phase,
      players,
      target: this.target,
      board: this.board,
      claimed: this.claimed,
      lastWinner: this.lastWinner,
      winnerSlot: this.winnerSlot,
      boardLocked: this.boardLocked,
    };
  }
}
