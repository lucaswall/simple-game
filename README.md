# Simple Space Game

A lightweight side-scrolling space shooter built with Vanilla JavaScript and TypeScript. The project is tuned for smooth browser play while keeping the code approachable for learning and experimentation.

> **Note:** This project is part of an ongoing assistant tooling evaluation that now includes Google Antigravity, Cursor, Warp, and OpenAI Codex.

## How to Play
- **Move:** Arrow Up / Arrow Down
- **Shoot:** Spacebar
- **Pause/Exit:** Escape
- **Touch input:** Tap or hold the left side to move (above the ship to go up, below to go down) and the right side to fire.

## Features
- Responsive canvas sizing for desktop and mobile devices
- Keyboard and touch controls with input smoothing
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
- Source lives in `src/` with the entrypoint at `src/main.ts`.
- Tests are colocated under `tests/` and use Vitest.
- The game canvas and overlay elements are defined in `index.html` and styled via `src/style.css`.

