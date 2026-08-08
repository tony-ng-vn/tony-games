import type { GameState } from '../types';
import { GameBoard } from './GameBoard';
import { GameOver } from './GameOver';
import { PlayerPanel } from './PlayerPanel';

type Props = {
  state: GameState;
  playerId: string;
  onClaim: (value: number) => void;
  onPlayAgain: () => void;
  busy: boolean;
};

export function GameRoom({ state, playerId, onClaim, onPlayAgain, busy }: Props) {
  const p1 = state.players.find((p) => p.slot === 0);
  const p2 = state.players.find((p) => p.slot === 1);
  const showFeedback = state.phase === 'round_feedback' && state.lastWinner;

  return (
    <>
      <div className="room-meta">ROOM {state.roomCode}</div>
      <div className="game">
        <PlayerPanel
          side="left"
          player={p1}
          isYou={p1?.id === playerId}
          scored={showFeedback ? state.lastWinner?.slot === 0 : false}
          fallbackLabel="Player 1"
        />

        <div className="target-wrap">
          <p className="target-label">Find</p>
          <p
            className="target-number"
            key={state.target}
            aria-live="polite"
            aria-atomic="true"
          >
            {state.target}
          </p>
        </div>

        <PlayerPanel
          side="right"
          player={p2}
          isYou={p2?.id === playerId}
          scored={showFeedback ? state.lastWinner?.slot === 1 : false}
          fallbackLabel="Player 2"
        />

        <GameBoard
          board={state.board}
          claimed={state.claimed}
          locked={state.boardLocked || state.phase !== 'playing'}
          onClaim={onClaim}
        />

        <div className="feedback" aria-live="polite">
          {showFeedback && state.lastWinner ? (
            <span className="feedback-pill" key={`${state.lastWinner.target}-${state.lastWinner.playerId}`}>
              {state.lastWinner.playerName} +1
            </span>
          ) : null}
        </div>
      </div>

      {state.phase === 'finished' ? (
        <GameOver state={state} onPlayAgain={onPlayAgain} busy={busy} />
      ) : null}
    </>
  );
}
