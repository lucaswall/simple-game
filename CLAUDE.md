# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Keep this file updated.** When making changes that affect architecture, commands, conventions, or other documented information, update the relevant sections of this file to stay in sync with the codebase.

## Project Overview

**Simple Space Game** is a TypeScript browser game using Vite, rendered on an HTML canvas with a state machine pattern. The player controls a ship that dodges and shoots asteroids in a side-scrolling space environment.

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

### Directory Structure

```
src/
├── main.ts                    # Entry point: canvas setup, game loop, pause/orientation handling
├── style.css                  # Game styles
├── core/
│   ├── Game.ts                # Central orchestrator: state management, screen shake, time scale
│   ├── Input.ts               # Keyboard/touch input handler (ArrowUp/Down/Space/D/F)
│   ├── Constants.ts           # Global tunable parameters (dimensions, UI, starfield)
│   └── Starfield.ts           # Parallax scrolling background stars
├── interfaces/
│   ├── Actor.ts               # Base interface: update(deltaTime), draw(ctx)
│   ├── GameState.ts           # State interface: enter, update, draw, exit
│   └── Collidable.ts          # Collision interface: bounds, onCollision, canCollideWith
├── actors/
│   ├── Ship.ts                # Player ship: movement, firing, heat system
│   ├── Bullet.ts              # Projectiles moving right
│   └── Asteroid.ts            # Procedural polygon asteroids (small/medium/large, exploding)
├── states/
│   ├── IntroState.ts          # Initial intro screen
│   ├── MainMenuState.ts       # Main menu
│   ├── PlayingState.ts        # Core gameplay (owns entities, collision, scoring)
│   └── GameOverState.ts       # Game over screen with final score
└── managers/
    ├── ParticleManager.ts     # Explosion particle effects
    └── CollisionManager.ts    # Collision detection logic
tests/
├── setup.ts                   # Vitest setup
├── integration/               # Integration tests
├── unit/                      # Unit tests mirroring src/ structure
│   ├── actors/
│   ├── core/
│   ├── managers/
│   ├── states/
│   └── systems/               # Cross-cutting system tests
└── utils/                     # Test utilities
    ├── MockCanvas.ts
    ├── MockGame.ts
    ├── MockInput.ts
    └── TestHelpers.ts         # Factory functions for test entities
```

### Core Flow

1. `src/main.ts` - Entry point; creates canvas, game loop via `requestAnimationFrame`, handles pause on blur/focus, mobile orientation/fullscreen
2. `src/core/Game.ts` - Central orchestrator; manages current state, screen shake, time scale effects (freeze-frame)
3. `src/core/Input.ts` - Keyboard/touch input handler tracking ArrowUp/ArrowDown/Space and debug keys

### State Machine

States implement `GameState` interface:
```typescript
interface GameState {
    enter(game: Game): void;
    update(game: Game, deltaTime: number): void;
    draw(game: Game, ctx: CanvasRenderingContext2D): void;
    exit(game: Game): void;
}
```

State transitions: `IntroState` -> `MainMenuState` -> `PlayingState` <-> `GameOverState`

### Entity System

All game entities implement the `Actor` interface:
```typescript
interface Actor {
    update(deltaTime: number): void;
    draw(ctx: CanvasRenderingContext2D): void;
}
```

Collidable entities extend `Actor` with:
```typescript
interface Collidable extends Actor {
    getCollisionBounds(): CollisionBounds;  // circle, polygon, or point
    onCollision(other: Collidable, context: CollisionContext): void;
    canCollideWith(other: Collidable): boolean;
    collisionEnabled: boolean;
}
```

### Gameplay Mechanics

- **Ship**: Vertical movement (ArrowUp/Down), firing (Space), weapon heat system with overheat/cooldown
- **Asteroids**: Three sizes (small/medium/large) that split on hit; large->2 medium, medium->2 small
- **Exploding Asteroids**: Flash red and explode after delay, damaging ship and other asteroids in radius
- **Scoring**: Points for destroying asteroids (50 small, 100 medium, 200 large)
- **Lives**: 3 starting lives, 2-second invincibility after respawn
- **Difficulty Scaling**: Spawn rate and large asteroid ratio increase over 3 minutes

### Configuration

`src/core/Constants.ts` - Global parameters (dimensions, UI constants, starfield settings)

`src/states/PlayingState.ts` - Gameplay-specific constants (speeds, spawn rates, scoring, particles) defined at file top. Prefer updating values here rather than hardcoding.

## Code Conventions

- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters`
- ES2020 target with ESNext modules (bundler mode)
- Avoid try/catch around imports
- Use type guards (`instanceof`) instead of unsafe type casts
- Validate inputs at system boundaries (e.g., deltaTime validation in Game.ts)
- Prefer feature detection over userAgent sniffing for platform detection

## Testing

Tests are in `tests/` mirroring `src/` structure. Use Vitest with jsdom environment.

### Test Utilities

Located in `tests/utils/`:
- `MockCanvas.ts` - Mock CanvasRenderingContext2D
- `MockGame.ts` - Mock Game class
- `MockInput.ts` - Mock Input class with controllable key states
- `TestHelpers.ts` - Factory functions: `createShipAt()`, `createAsteroidAt()`, `createBulletAt()`

### Test Patterns

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MockInput } from '../../utils/MockInput';
import { createShipAt } from '../../utils/TestHelpers';

describe('Ship', () => {
    let mockInput: MockInput;

    beforeEach(() => {
        mockInput = new MockInput();
    });

    it('should move up when ArrowUp is pressed', () => {
        const ship = createShipAt(100, 300, mockInput);
        mockInput.keys.ArrowUp = true;
        ship.update(0.016);
        expect(ship.y).toBeLessThan(300);
    });
});
```

## Development Approach: TDD

This project follows Test-Driven Development practices:

1. **Write tests first** - Before implementing, write failing tests describing expected behavior
2. **Run tests to verify they fail** - Ensure tests fail for the right reason
3. **Implement minimal code** - Write just enough code to make tests pass
4. **Refactor** - Clean up code while keeping tests green
5. **Repeat** - Continue the cycle for each feature

### TDD Workflow

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
- Run `npm run build` after changes to ensure tests pass and types check

## Debug Mode

During gameplay, press:
- **D** - Toggle debug overlay (shows play time, spawn rate, asteroid size percentages)
- **F** - Fast forward game time by 20 seconds (for testing difficulty scaling)
