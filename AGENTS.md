# AGENTS.md — Visualization Audio Tools (Telegram Bot + Visualizer API)

This file gives AI coding agents the context, conventions, and rules needed to
work safely and effectively in this repository.

## Project Overview

`visualization-audio-tools` is a **Telegram bot** that turns an audio file sent
by a user into a **waveform visualization video**, delivered back through
Telegram.

It is a monorepo-like TypeScript project made of **two independent services**:

| Service | Purpose | Port | PM2 name |
|---------|---------|------|----------|
| **Telegram bot** (`src/index.ts`) | Express webhook server. Receives Telegram updates, handles `/start`, `/help`, audio uploads. | `3000` (default) | `vant-bot` |
| **Visualizer API** (`src/visualizer-api.ts`) | Express server. `POST /generate` downloads an audio URL, renders a waveform `.mp4` with `ffmpeg`, streams it back. | `8080` | `vant-visualizer` |

Both run as separate processes (PM2). They are deployed either inside a
Termux `proot-distro` (Android) or on a production server. See the
[project plan](./TELEGRAM_BOT_PLAN.md) for the original design docs.

```
telegram (webhook, HTTPS VPS)
   --> vant-bot (src/index.ts) -- ACK 200 immediately, process async -->
        audio.ts POST http://<HOST>:8080/generate { audioUrl, chatId }
        --> vant-visualizer (src/visualizer-api.ts) -->
             download audio -> ffmpeg render -> stream video/mp4
        <-- stream -->
   --> sendVideo (multipart, must be < 50 MB)
```

## Commands

```bash
pnpm install           # install dependencies
pnpm dev               # run the bot (tsx watch)
pnpm start             # run the bot (tsx)
pnpm visualizer        # run the visualizer API (tsx)
npx tsc                # type-check + build to dist/
npx tsc --noEmit       # type-check only
```

**Always build with `npx tsc` before deploying.** PM2 runs the compiled
`dist/` output, not the `src/` TypeScript source.

### PM2 (how these run in production)

```bash
pm2 ls
pm2 logs vant-bot
pm2 logs vant-visualizer
pm2 restart vant-bot
pm2 restart vant-visualizer --update-env   # pick up .env changes
pm2 save                                    # persist for resurrect on reboot
```

- `vant-bot` runs `dist/index.js`
- `vant-visualizer` runs `dist/visualizer-api.js`

After editing source: `npx tsc && pm2 restart <name>`.

## Environment Variables

See `.env.example`. `.env` is git-ignored — never commit it.

| Variable | Used by | Notes |
|----------|---------|-------|
| `BOT_TOKEN` | bot | Telegram bot token |
| `WEBHOOK_SECRET` | bot | Validates `X-Telegram-Bot-Api-Secret-Token` |
| `PORT` | bot | Bot Express port (default `3000`) |
| `VISUALIZER_HOST` | visualizer | **Must be `0.0.0.0`** (see Networking rule) |
| `VISUALIZER_PORT` | visualizer | Default `8080` |
| `TELEGRAM_API_PROXY` | bot | Optional; overrides `api.telegram.org` |

## Code Conventions

- **Language/Runtime:** TypeScript, ESM (`"type": "module"`), NodeNext module
  resolution. Imports use the `file.js` extension (e.g.
  `import { handleAudio } from '../handlers/audio.js';`).
- **Style:** Follow existing files. No added code comments unless it conveys
  non-obvious intent. Existing explaining comments are fine to keep.
- **Build:** The `bot/telegram` branch tracks `origin/bot/telegram`. Work on a
  feature branch, build, and open a PR to the relevant tracking branch.

## Rules an AI Agent MUST Follow

### 1. Networking — always bind to `0.0.0.0`, never `localhost`
Inside `proot-distro`, loopback binding can resolve to unexpected IPv4/IPv6
addresses, causing `ECONNREFUSED`. **Every HTTP server must listen on
`0.0.0.0`**:

```ts
app.listen(PORT, HOST); // HOST must be '0.0.0.0'
```

Do not hardcode `127.0.0.1` as a bind address. This was the root cause of the
original `ECONNREFUSED 127.0.0.1:8080` connection failure.

2. **Express 5 has no single-`*` wildcard route.** Express 5 uses
   `path-to-regexp` v8; `app.post('*', ...)` throws. Use an array of paths
   (`app.post(['/','/telegram'], ...)`) or a RegExp. See
   `.agents/skills/express5-route-asterisk-error/SKILL.md`.

3. **Respect Telegram's 50 MB upload limit.** `sendVideo` via multipart rejects
   files > 50 MB with `413 Request Entity Too Large`. The visualizer keeps files
   under the limit with **adaptive budget encoding**:
   - Probes audio duration with `ffprobe`, then sizes the video resolution/bit
     rate so the total stays under `MAX_FILE_BYTES` (43 MB target).
   - Short clips → up to 1920×1080 @ 30fps; normal songs → 720p @ 30fps; only
     very long audio downscales.
   - Reject output > 48 MB with a clear `413` JSON error (see handler).

4. **The bot must not block the Telegram webhook.** `src/index.ts` should ACK
   (`res.sendStatus(200)`) immediately and do heavy work (calling the
   visualizer, uploading) asynchronously so Telegram does not retry/timeout.

5. **Compiled output reflects reality.** Prefer to verify with `npx tsc` and
   live `curl` against the running services after changing encoder/protocol
   logic. Do not assume `tsx watch` picks up changes in PM2 processes.

6. **Never log or commit secrets.** `BOT_TOKEN`, `WEBHOOK_SECRET`, and any
   `TELEGRAM_API_PROXY` credentials must stay out of logs and git.

7. **Don't modify `prisma` PA nor hit `src/generated/prisma` directly.** That
   directory is gitignored and regenerated (`npx prisma`). Change the schema in
   `prisma/schema.prisma` instead.

8. **`dist/` is gitignored build output.** `/dist` is in `.gitignore` — never
   hand-edit compiled files; always edit `src/` and rebuild.

## Technical Notes / Gotchas

- **Two HTTP clients:** the bot (`src/api.ts`) talks to Telegram; the bot also
  calls the visualizer with `axios`. The visualizer streams `video/mp4` with a
  real `Content-Length`, and the bot sends it onward via multipart
  `sendVideo`/`sendVideoStream`.
- **Encode cost:** higher res + 30fps costs CPU per request. On a small/Android
  host this is slow; on a production server it's fine (quality was raised
  intentionally for a server environment). If it ever becomes a bottleneck, the
  first lever is framerate (30 → 20).
- **`ffmpeg` is external:** located via `FFMPEG_PATH`/`FFPROBE_PATH` (defaults
  `/usr/bin/ffmpeg`, `/usr/bin/ffprobe`). The visualizer shells out with
  `child_process.spawn`.
- **SQLite via Prisma** backs the user-quota system (`services/index.ts`).