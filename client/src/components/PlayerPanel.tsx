import type { Player } from '../types';

type Props = {
  side: 'left' | 'right';
  player: Player | undefined;
  isYou: boolean;
  scored: boolean;
  fallbackLabel: string;
};

export function PlayerPanel({ side, player, isYou, scored, fallbackLabel }: Props) {
  return (
    <aside
      className={`player-panel ${side}${isYou ? ' is-you' : ''}${scored ? ' scored' : ''}`}
    >
      {player ? (
        <>
          <p className="player-name">{player.name}</p>
          <p className="player-score" aria-label={`${player.name} score`}>
            {player.score}
          </p>
        </>
      ) : (
        <p className="player-empty">{fallbackLabel}</p>
      )}
    </aside>
  );
}
