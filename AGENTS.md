# Guidance for Contributors and Assistants

This repository hosts **Simple Space Game**, a Vite-powered TypeScript browser game rendered on an HTML canvas.
Use this file as the primary reference for conventions and project habits.

## Technology Overview
- **Language:** TypeScript targeting ES2020 (see `tsconfig.json`).
- **Runtime/build tools:** Vite for dev/build, npm scripts for orchestration.
- **Testing:** Vitest (with jsdom) under `tests/`.
- **Entry points:** `src/main.ts` bootstraps the game and canvas; assets and styles live alongside code in `src/` (`style.css`).
- **Key structure hints:**
  - `src/core/` contains engine primitives (game loop, constants, input handling).
  - `src/states/` holds game-state implementations (e.g., menus, gameplay).
  - `src/actors/` and `src/managers/` provide gameplay entities and orchestration helpers.
  - `index.html` declares the canvas/overlay shell used by Vite.

## How to Develop
- Install dependencies once with `npm install`.
- Run a hot-reloading dev server via `npm run dev` (served by Vite).
- Keep TypeScript strict-mode errors at zero; the compiler is configured with `strict` and no-unused checks.
- Avoid adding try/catch around imports (per repo-wide convention).

## Tests and Checks
- Execute the headless test suite with `npm test` (alias for `vitest run`).
- For iterative work, use `npm run test:watch`; for the interactive UI runner, use `npm run test:ui`.
- After making code changes, update, add, or remove tests as needed to cover the new behavior, and run the relevant test commands before sending changes for review.

## Building and Previewing
- Create a production bundle with `npm run build` (runs tests, then `tsc`, then `vite build`) after implementing changes to ensure the build remains healthy.
- Preview a built bundle locally using `npm run preview` after building.

## Miscellaneous
- The project is private (`package.json` sets `"private": true`); keep artifacts minimal.
- When modifying browser-facing behavior, confirm canvas sizing and mobile orientation handling remain intact (`src/main.ts`).
