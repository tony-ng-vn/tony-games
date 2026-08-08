import { Link } from 'react-router-dom';
import { games } from '../games/catalog';

export function HomePage() {
  return (
    <div className="hub">
      <header className="hub-header">
        <p className="hub-kicker">Inhavens</p>
        <h1 className="hub-brand">Play</h1>
        <p className="hub-lead">Small competitive browser games. No accounts. Just a room code.</p>
      </header>

      <section className="hub-games" aria-label="Games">
        {games.map((game) => {
          const isLive = game.status === 'live';
          const body = (
            <>
              <div className="hub-game-top">
                <h2>{game.name}</h2>
                <span className="hub-game-meta">{game.players}</span>
              </div>
              <p>{game.blurb}</p>
              <span className="hub-game-cta">{isLive ? 'Play' : 'Soon'}</span>
            </>
          );

          if (!isLive) {
            return (
              <div key={game.slug} className="hub-game is-soon" aria-disabled="true">
                {body}
              </div>
            );
          }

          return (
            <Link key={game.slug} className="hub-game" to={`/${game.slug}`}>
              {body}
            </Link>
          );
        })}
      </section>

      <footer className="hub-footer">
        <a href="https://inhavens.com" rel="noreferrer">
          inhavens.com
        </a>
      </footer>
    </div>
  );
}
