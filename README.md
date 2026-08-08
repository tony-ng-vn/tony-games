# Quick Number

A minimal two-player browser reaction game.

Find the target number on a scrambled board of 1–50 before your opponent. First correct click scores a point. After 50, highest score wins.

Multiplayer is peer-to-peer (PeerJS), so the game deploys as a static site on Vercel — no custom game server required.

## Local development

```bash
npm run install:all
npm run dev
```

Open http://127.0.0.1:5173 in two browser windows (or two devices on the same network with a tunnel). Create a room in one, join with the code in the other.

## Deploy to Vercel

### Option A — Vercel dashboard

1. Import `tony-ng-vn/tony-games` in [Vercel](https://vercel.com/new)
2. Framework preset: Vite (auto from `vercel.json`)
3. Deploy

### Option B — CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

`vercel.json` already sets install/build/output for the `client` app.

## How it works

- Player 1 hosts the room (authoritative game state)
- Player 2 joins via room code over a PeerJS data connection
- Board positions, scoring, locks, and target progression stay in sync
- Incorrect clicks do nothing; correct clicks award +1 and briefly lock the board
- Target advances 1 → 50; then win / lose / draw with Play Again
