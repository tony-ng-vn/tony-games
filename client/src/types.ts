export type GamePhase = 'waiting' | 'playing' | 'round_feedback' | 'finished';

export type Player = {
  id: string;
  name: string;
  score: number;
  slot: number;
};

export type NumberPos = {
  value: number;
  x: number;
  y: number;
};

export type RoundFeedback = {
  playerId: string;
  playerName: string;
  slot: number;
  target: number;
};

export type GameState = {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  target: number;
  board: NumberPos[];
  claimed: number[];
  lastWinner: RoundFeedback | null;
  winnerSlot: number | null;
  boardLocked: boolean;
};
