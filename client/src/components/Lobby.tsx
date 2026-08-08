import { useState, type FormEvent } from 'react';

type Props = {
  busy: boolean;
  error: string | null;
  onCreate: (name: string) => void;
  onJoin: (name: string, code: string) => void;
};

export function Lobby({ busy, error, onCreate, onJoin }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    onCreate(name.trim() || 'Player 1');
  }

  function handleJoin(event: FormEvent) {
    event.preventDefault();
    onJoin(name.trim() || 'Player 2', code.trim().toUpperCase());
  }

  return (
    <div className="lobby">
      <div className="lobby-card">
        <p className="brand">Quick Number</p>
        <h1>Find it first</h1>
        <p className="lobby-lead">
          Two players. Numbers 1–50. Tap the target before your opponent.
        </p>

        <form onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              name="name"
              autoComplete="nickname"
              maxLength={20}
              placeholder="Player"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="lobby-actions">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Create room
            </button>
          </div>
        </form>

        <div className="divider">or join</div>

        <form onSubmit={handleJoin}>
          <div className="field">
            <label htmlFor="code">Room code</label>
            <input
              id="code"
              name="code"
              autoComplete="off"
              maxLength={6}
              placeholder="ABCD"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={busy}
            />
          </div>
          <div className="lobby-actions">
            <button className="btn" type="submit" disabled={busy || code.trim().length < 4}>
              Join room
            </button>
          </div>
        </form>

        {error ? <p className="error">{error}</p> : null}
      </div>
    </div>
  );
}
