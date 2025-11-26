# Simple Space Game

Simple Space Game is a lightweight side-scrolling shooter built with TypeScript and vanilla JavaScript. The project aims to keep controls responsive in the browser while staying small enough for learners to explore.

> **Note:** This project is part of an assistant-tooling evaluation. Vibe coding with Cursor, Warp, Google Antigravity, and OpenAI Codex to support development on this repo.

## How to Play
- **Move:** Arrow Up / Arrow Down
- **Shoot:** Spacebar
- **Pause/Exit:** Escape
- **Touch:** Tap or hold the left side to move the ship (above the ship to go up, below to go down) and tap the right side to fire.

## Features
- Responsive canvas sizing for desktop and mobile
- Keyboard and touch controls with smoothing for steady movement
- Orientation guard that prompts mobile players to rotate to landscape
- Lightweight build pipeline powered by Vite

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server with hot module replacement:
   ```bash
   npm run dev
   ```
3. Create a production build (outputs to `dist/`):
   ```bash
   npm run build
   ```
4. Preview the built bundle locally:
   ```bash
   npm run preview
   ```

## Project Notes
- Source files live in `src/` with the entrypoint at `src/main.ts`.
- Tests are colocated under `tests/` and run through Vitest.
- The game canvas and overlay elements are defined in `index.html` and styled in `src/style.css`.
