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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/import?s=https://github.com/tony-ng-vn/tony-games)

### Important: Root Directory

In the Vercel project go to **Settings → General → Root Directory**, set it to:

```text
client
```

Save, then **Deployments → … → Redeploy**.

If Root Directory stays at the repo root, the root `vercel.json` builds `client/dist` instead. Either approach works; `client` as Root Directory is simplest.

### Fresh import

1. Open [vercel.com/new](https://vercel.com/new) and import `tony-ng-vn/tony-games`
2. Set **Root Directory** to `client`
3. Deploy — no env vars needed

### CLI

```bash
npm i -g vercel
vercel login
cd client && vercel --prod
```

## How it works

- Player 1 hosts the room (authoritative game state)
- Player 2 joins via room code over a PeerJS data connection
- Board positions, scoring, locks, and target progression stay in sync
- Incorrect clicks do nothing; correct clicks award +1 and briefly lock the board
- Target advances 1 → 50; then win / lose / draw with Play Again
