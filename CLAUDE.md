# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server with HMR
npm run build        # Run tests, type-check, then build to dist/
npm run preview      # Serve production build locally
npm test             # Run test suite (vitest run)
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Run tests with Vitest UI
```

To run a single test file:
```bash
npx vitest run tests/unit/actors/Ship.test.ts
```

## Architecture

This is a TypeScript browser game using Vite. The game renders on an HTML canvas with a state machine pattern.

### Core Flow
- `src/main.ts` - Entry point; creates canvas, game loop via `requestAnimationFrame`, handles pause on blur/focus
- `src/core/Game.ts` - Central orchestrator; manages current state, screen shake, and freeze-frame effects
- `src/core/Input.ts` - Keyboard input handler tracking ArrowUp/ArrowDown/Space

### State Machine
States implement `GameState` interface (`enter`, `update`, `draw`, `exit`):
- `src/states/IntroState.ts` - Initial intro screen
- `src/states/MainMenuState.ts` - Main menu
- `src/states/PlayingState.ts` - Core gameplay; owns Ship, Asteroids, Bullets, ParticleManager
- `src/states/GameOverState.ts` - Game over screen

### Entities
All implement `Actor` interface (`update(deltaTime)`, `draw(ctx)`):
- `src/actors/Ship.ts` - Player ship with vertical movement and firing
- `src/actors/Bullet.ts` - Projectiles moving right
- `src/actors/Asteroid.ts` - Procedurally-generated polygon asteroids moving left
- `src/core/Starfield.ts` - Parallax scrolling background stars

### Managers
- `src/managers/ParticleManager.ts` - Explosion particle effects
- `src/managers/CollisionManager.ts` - Collision detection logic

### Configuration
- `src/core/Constants.ts` - All tunable game parameters (dimensions, speeds, spawn rates, colors, effects). Prefer changing values here rather than hardcoding numbers elsewhere.

## Code Conventions

- TypeScript strict mode enabled with `noUnusedLocals` and `noUnusedParameters`
- Avoid try/catch around imports
- Tests are colocated under `tests/` mirroring src structure
- Test utilities in `tests/utils/` (MockCanvas, MockGame, MockInput, TestHelpers)
- Run tests and build after changes to ensure everything passes
