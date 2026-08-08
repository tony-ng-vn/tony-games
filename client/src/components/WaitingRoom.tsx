import type { GameState } from '../types';

type Props = {
  state: GameState;
  playerId: string;
};

export function WaitingRoom({ state, playerId }: Props) {
  const me = state.players.find((p) => p.id === playerId);
  const other = state.players.find((p) => p.id !== playerId);

  return (
    <div className="waiting">
      <p className="brand">Quick Number</p>
      <h1>Room code</h1>
      <div className="room-code" aria-live="polite">
        {state.roomCode}
      </div>
      <p>Share this code with Player 2. The game starts automatically.</p>
      <div className="waiting-players">
        <span>
          {me?.name ?? 'You'} joined
          {me?.slot === 0 ? ' · Player 1' : ' · Player 2'}
        </span>
        <span>{other ? `${other.name} joined` : 'Waiting for Player 2…'}</span>
      </div>
    </div>
  );
}
