import { useEffect, useRef, useState } from 'react';
import { Lobby } from './components/Lobby';
import { WaitingRoom } from './components/WaitingRoom';
import { GameRoom } from './components/GameRoom';
import { GameSession } from './game/session';
import type { GameState } from './types';

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<GameSession | null>(null);

  useEffect(() => {
    const session = new GameSession({
      onState: setState,
      onPlayerId: setPlayerId,
      onError: (message) => setError(message),
    });
    sessionRef.current = session;
    return () => {
      session.dispose();
      sessionRef.current = null;
    };
  }, []);

  async function createRoom(name: string) {
    setBusy(true);
    setError(null);
    try {
      await sessionRef.current?.create(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create room');
    } finally {
      setBusy(false);
    }
  }

  async function joinRoom(name: string, code: string) {
    setBusy(true);
    setError(null);
    try {
      await sessionRef.current?.join(name, code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join room');
    } finally {
      setBusy(false);
    }
  }

  function claim(value: number) {
    if (!state || state.boardLocked || state.phase !== 'playing') return;
    sessionRef.current?.claim(value);
  }

  function playAgain() {
    setError(null);
    sessionRef.current?.playAgain();
  }

  const inLobby = !state || !playerId;
  const waiting = state?.phase === 'waiting';

  return (
    <div className="app-shell">
      {inLobby ? (
        <Lobby busy={busy} error={error} onCreate={createRoom} onJoin={joinRoom} />
      ) : waiting ? (
        <WaitingRoom state={state} playerId={playerId} />
      ) : (
        <GameRoom
          state={state}
          playerId={playerId}
          onClaim={claim}
          onPlayAgain={playAgain}
          busy={busy}
        />
      )}
      {!inLobby && error ? <p className="error global-error">{error}</p> : null}
    </div>
  );
}
