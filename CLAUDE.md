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

## Development Approach: TDD

This project follows Test-Driven Development (TDD) practices:

1. **Write tests first** - Before implementing a new feature or fix, write failing tests that describe the expected behavior
2. **Run tests to verify they fail** - Ensure tests fail for the right reason before implementing
3. **Implement the minimal code** - Write just enough code to make the tests pass
4. **Refactor** - Clean up the code while keeping tests green
5. **Repeat** - Continue the cycle for each new feature or fix

### TDD Workflow Example

```bash
# 1. Write test first in tests/unit/...
# 2. Run tests to see them fail
npm test

# 3. Implement the feature/fix
# 4. Run tests again to verify they pass
npm test

# 5. Run full build to ensure no regressions
npm run build
```

### Best Practices

- Use `describe` blocks to group related tests
- Use `beforeEach` for common setup
- Test edge cases (null, undefined, boundary values)
- Use type guards (`instanceof`) instead of unsafe type casts
- Validate inputs at system boundaries (e.g., deltaTime validation in Game.ts)
- Prefer feature detection over userAgent sniffing for platform detection
