# Quick Number

A minimal two-player browser reaction game.

Find the target number on a scrambled board of 1–50 before your opponent. First correct click scores a point. After 50, highest score wins.

## Play

```bash
npm run install:all
npm run dev
```

- Client: http://127.0.0.1:5173  
- Server: port 3001 (Socket.io)

1. Open two browser windows.  
2. One player creates a room and shares the code.  
3. The other joins with the code.  
4. The game starts automatically when both are connected.

## Production

```bash
npm run install:all
npm run build
NODE_ENV=production npm start
```

Serves the built client from the Node server on port 3001.

## How it works

- Shared Socket.io room for exactly 2 players  
- Server owns board positions, target progression, scoring, and locks  
- Incorrect clicks do nothing; correct clicks award +1 and briefly lock the board  
- Target advances 1 → 50; then win / lose / draw with Play Again
