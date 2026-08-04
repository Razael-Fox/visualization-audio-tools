# Telegram Bot VANT Integration Plan

## Overview
This document outlines the architecture and implementation plan for building a Telegram bot version of the VANT (Visualization Audio Tools) application. The bot will interface with the VANT core functionalities and deliver an interactive experience directly within Telegram.

## Tech Stack
- **Language**: TypeScript
- **Package Manager**: PNPM
- **Telegram Integration**: Official Telegram Bot API (Raw HTTP requests using native `fetch`)
- **Database**: SQLite (via Prisma ORM) for user quota management
- **Deployment & Architecture**: Webhooks (No polling)
- **Framework/Runtime**: Standalone Node.js server using Express

## Architecture

### 1. Webhook Mechanism
Instead of relying on long-polling, the bot will use webhooks to receive updates efficiently.
- **Endpoint Setup**: The webhook server is already set up at `https://webhook.purplefoxbot.xyz/telegram`.
- **Security**: Validate the `X-Telegram-Bot-Api-Secret-Token` header to ensure incoming requests are genuinely from Telegram.
- **Webhook Registration**: Ensure Telegram is pointed to `https://webhook.purplefoxbot.xyz/telegram` using the `setWebhook` API.

### 2. Project Structure
The bot codebase will be a standalone Node.js service without any website integration.
Proposed structure:
```
├── prisma/
│   └── schema.prisma                  # Database models (User quotas, state, etc.)
├── src/
│   ├── index.ts                       # Server entry point (Express)
│   ├── api.ts                         # Telegram API client (fetch wrappers)
│   ├── router.ts                      # Webhook event dispatcher
│   ├── handlers/                      # Command & action handlers
│   │   ├── start.ts                   # /start command
│   │   ├── audio.ts                   # Audio processing commands
│   │   └── help.ts                    # /help command
│   └── services/                      # Core logic & Database access (Prisma client)
```

### 3. Core Features
- **Audio Uploads**: Users can send audio files directly to the bot.
- **Visualization Generation**: The bot processes the audio and returns visual assets (video/images).
- **Inline Keyboards**: Provide a smooth UI experience inside Telegram (e.g., selecting visualization styles, color palettes).
- **Quota System**: Track user usage using SQLite/Prisma to prevent server overload and protect 3rd-party API capacity.

## Implementation Phases

### Phase 1: Setup & Webhook Integration
1. Initialize the bot structure within the project.
2. Initialize Prisma (`npx prisma init --datasource-provider sqlite`) and design the `User` schema with quota tracking.
3. Obtain a Bot Token from `@BotFather`.
4. Set up an Express server to parse incoming JSON payloads for the `webhook.purplefoxbot.xyz/telegram` endpoint.
5. Implement basic type definitions for Telegram API payloads (or use `@types/node-telegram-bot-api` just for types).
6. Verify that the `setWebhook` Telegram API endpoint points to `https://webhook.purplefoxbot.xyz/telegram`.

### Phase 2: Basic Handlers
1. Implement the `/start` command with a welcome message and inline keyboard menu.
2. Implement basic file handling (downloading audio files sent by users).
3. Connect the bot handlers to the core VANT audio/visualization logic.

### Phase 3: Interactive Workflows & Processing
1. Add state management (if needed) for multi-step interactions (e.g., uploading an audio file -> choosing a visualizer style -> rendering).
2. Send progress updates to the user while visualizations are rendering.
3. Send the final visualization back to the user as a Video or Document.

## Commands
- `/start` - Initialize bot and show main menu.
- `/help` - Show instructions on how to use VANT features via Telegram.
- `/settings` - Configure default visualization options.

## Deployment Notes
- Ensure the production server has a valid HTTPS certificate (required for Telegram webhooks).
- Ensure the SQLite database file is stored in a persistent volume or directory so user quota data is not lost across deployments.
- **Environment Variables**:
  - `.env`: Used for production credentials and configuration (do not commit).
  - `.env.local`: Used for local development overrides (do not commit).
  - `.env.example`: Template showing required variables without secrets (commit to repository).
