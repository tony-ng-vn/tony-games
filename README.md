# Inhavens Play

Small competitive browser games under the Inhavens brand.

**Keep Haven at `inhavens.com`.** Games live on a subdomain so the main product stays untouched.

## URL plan

| URL | What |
| --- | --- |
| [inhavens.com](https://inhavens.com) | Haven (existing product — do not replace) |
| **play.inhavens.com** | Games hub / catalog |
| **play.inhavens.com/quick-number** | Quick Number |

Later games just add another route, e.g. `/some-new-game`.

## Local development

```bash
npm run install:all
npm run dev
```

- Hub: http://127.0.0.1:5173/
- Quick Number: http://127.0.0.1:5173/quick-number

## Deploy on Vercel + attach domain

1. Deploy this repo with **Root Directory = `client`**
2. Vercel project → **Settings → Domains** → add `play.inhavens.com`
3. DNS for `inhavens.com` already uses Vercel (`vercel-dns`), so the subdomain should verify automatically
4. Do **not** point `inhavens.com` itself at this project — that would take down Haven

### Redeploy notes

If you see `404 NOT_FOUND`, confirm Root Directory is `client`, then redeploy.

## Quick Number

Two-player reaction game: find targets 1–50 on a scrambled board. First correct click scores. PeerJS multiplayer — no custom game server.
