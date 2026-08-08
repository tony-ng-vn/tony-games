import type { NumberPos } from '../types';

type Props = {
  board: NumberPos[];
  claimed: number[];
  locked: boolean;
  onClaim: (value: number) => void;
};

export function GameBoard({ board, claimed, locked, onClaim }: Props) {
  const claimedSet = new Set(claimed);

  return (
    <div className="board-wrap">
      <div
        className={`board${locked ? ' locked' : ''}`}
        role="group"
        aria-label="Number board"
      >
        {board.map((item) => {
          const isClaimed = claimedSet.has(item.value);
          return (
            <button
              key={item.value}
              type="button"
              className={`board-number${isClaimed ? ' claimed' : ''}`}
              style={{ left: `${item.x}%`, top: `${item.y}%` }}
              disabled={locked || isClaimed}
              onClick={() => onClaim(item.value)}
              aria-label={`Number ${item.value}`}
            >
              {item.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
