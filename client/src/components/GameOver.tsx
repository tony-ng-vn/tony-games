import type { GameState } from '../types';

type Props = {
  state: GameState;
  onPlayAgain: () => void;
  busy: boolean;
};

function winnerTitle(state: GameState): string {
  if (state.winnerSlot === -1) return 'Draw';
  const winner = state.players.find((p) => p.slot === state.winnerSlot);
  if (!winner) return 'Game over';
  return `${winner.name} Wins`;
}

export function GameOver({ state, onPlayAgain, busy }: Props) {
  const sorted = [...state.players].sort((a, b) => a.slot - b.slot);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
      <div className="overlay-card">
        <h2 id="game-over-title">{winnerTitle(state)}</h2>
        <div className="final-scores">
          {sorted.map((player) => (
            <div key={player.id}>
              <span>{player.name}</span>
              <strong>{player.score}</strong>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" type="button" onClick={onPlayAgain} disabled={busy}>
          Play Again
        </button>
      </div>
    </div>
  );
}
