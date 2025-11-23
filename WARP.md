# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Install dependencies

- `npm install`

### Run the development server

- `npm run dev`
  - Starts the Vite dev server and serves `index.html` with hot module replacement.

### Build for production

- `npm run build`
  - Runs TypeScript type-checking via `tsc` and then `vite build`.
  - Outputs the production bundle to the `dist/` directory.

### Preview the production build

- `npm run preview`
  - Serves the built assets from `dist/` locally for validation.
  - Run `npm run build` first if `dist/` is out of date or missing.

### Tests and linting

- There are currently no npm scripts configured for tests or linting in `package.json`. If you add them (e.g., Jest/Vitest/ESLint), also document the commands here for future agents.

## Project structure and architecture

### Tooling and entry points

- This is a small browser game built with TypeScript and Vite in ESM mode.
- `index.html` defines the root DOM structure, including the `#gameCanvas` element, and loads `/src/main.ts` as a module script.
- `tsconfig.json` enables strict type-checking (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) and uses bundler-style module resolution with `noEmit`, relying on Vite for actual bundling.

### Game loop and rendering pipeline

- `src/main.ts`
  - Locates the `<canvas id="gameCanvas">` element and sets its logical resolution using `GAME_WIDTH` and `GAME_HEIGHT` from `Constants.ts`.
  - Creates a single `Input` instance and the initial `MainMenuState`, then passes that into a new `Game` instance.
  - Implements the main game loop with `requestAnimationFrame`, computing `deltaTime` from the current timestamp and `lastTime`.
  - Handles global pause on window `blur`/`focus` events. When paused, it renders a semi-transparent overlay with a `PAUSED` label using `PAUSE_OVERLAY_ALPHA` and `PAUSE_FONT_SIZE` from `Constants.ts`.

- `src/Game.ts`
  - Central orchestrator that holds the current `GameState`, the canvas rendering context, and camera/temporal effects.
  - Exposes `changeState(newState)` to swap between states, calling `exit` on the old state and `enter` on the new one.
  - Manages screen-shake via a `shakeIntensity` value, which decays over time using `SHAKE_DECAY` from `Constants.ts`. During `draw()`, it applies a random translation before delegating rendering to the current state.
  - Implements a freeze-timer mechanism via `startFreeze(duration, callback)`. While `freezeTimer > 0`, `update()` decrements the timer and early-returns without updating the active state; when the timer elapses, it runs the stored callback once. This is used to create impactful hit-stop effects.

### State machine

- `src/interfaces/GameState.ts`
  - Defines the state interface: `enter(game)`, `update(game, deltaTime)`, `draw(game, ctx)`, and `exit(game)`.

- `src/states/MainMenuState.ts`
  - Implements the main menu state, which owns a `Starfield` instance and shares the global `Input` instance.
  - On `enter`, it calls `input.clearKeys()` to avoid carrying over key presses from prior states.
  - In `update`, it advances the starfield and listens for the `Space` key; when pressed, it creates a `PlayingState` and transitions via `game.changeState(...)`.
  - In `draw`, it renders the starfield, then draws the title and subtitle centered on the screen using `MENU_TITLE_FONT_SIZE` and `MENU_SUBTITLE_FONT_SIZE`.

- `src/states/PlayingState.ts`
  - Implements the main gameplay state and owns the active game entities:
    - `Starfield` background
    - Player `Ship`
    - Arrays of `Asteroid` and `Bullet` instances
    - A `ParticleManager` to render explosions
  - Uses an `asteroidTimer` to spawn new asteroids at `ASTEROID_SPAWN_INTERVAL` intervals.
  - Maintains an `explosionTimer` and `timeScale` to create a slow-motion sequence after the ship is destroyed, during which the environment continues to update at a reduced speed.
  - `update(game, deltaTime)` has three main modes:
    - If `game.freezeTimer > 0`, it returns early because `Game.update` is handling the freeze; no entity state is advanced.
    - If an explosion is in progress (`explosionTimer > 0`), it updates the starfield, bullets, asteroids, and particles using a scaled `deltaTime` and, once the timer has elapsed and there are no remaining particles, transitions back to `MainMenuState`.
    - Otherwise, it performs the normal gameplay loop: updating the starfield, ship, bullets, asteroids, and particles, then running collision checks.
  - Collision handling (`checkCollisions`):
    - Ship vs. asteroid: uses `SHIP_COLLISION_X` and `SHIP_COLLISION_RADIUS` to approximate the ship as a circle; on hit, sets `game.shakeIntensity` to `SHAKE_INTENSITY_SHIP_HIT` and calls `game.startFreeze(HIT_FREEZE_DURATION, () => this.startExplosion())`.
    - Bullet vs. asteroid: computes distance between bullet and asteroid; on hit, spawns an explosion via `ParticleManager.createExplosion`, removes the asteroid and bullet, and triggers a brief freeze and lower-intensity shake using `ASTEROID_HIT_FREEZE_DURATION` and `SHAKE_INTENSITY_ASTEROID_HIT`.

### Entities, input, and effects layer

- `src/interfaces/Actor.ts`
  - Simple `update(deltaTime)` / `draw(ctx)` interface implemented by world objects (`Ship`, `Asteroid`, `Bullet`, `ParticleManager`, `Starfield`). This provides a consistent contract for time-stepping and rendering.

- `src/Input.ts`
  - Centralizes keyboard input using `window` `keydown`/`keyup` listeners.
  - Tracks a small set of keys (`ArrowUp`, `ArrowDown`, `Space`) in a `keys` dictionary keyed by `e.code`.
  - Provides `clearKeys()` to reset all tracked keys, used when entering new states to avoid unintended actions from carried-over key presses.
  - Any future input (e.g., additional keys or mouse controls) should be integrated here so that states and entities can remain decoupled from DOM event wiring.

- `src/Ship.ts`
  - Implements the player ship, which moves vertically in response to `ArrowUp` / `ArrowDown` while clamping its position within the visible `GAME_HEIGHT` using `SHIP_SIZE`.
  - Fires bullets when `Space` is held, pushing new `Bullet` instances into a shared `bullets` array, rate-limited by `SHIP_FIRE_RATE_MS` using `performance.now()`.
  - Uses `SHIP_X_POSITION` and `SHIP_BACK_X_POSITION` to draw a simple triangular ship and to position bullets at the ship’s nose.
  - Uses a `visible` flag to hide the ship during the death/explosion sequence.

- `src/Bullet.ts`
  - Represents a forward-moving projectile with `x`, `y`, `speed`, and `size` fields and an `active` flag.
  - Moves to the right each frame by `speed * deltaTime` and marks itself inactive once it passes beyond `GAME_WIDTH` so the owning state can remove it.

- `src/Asteroid.ts`
  - Represents an irregularly shaped asteroid polygon.
  - Spawns at the right edge of the screen (`GAME_WIDTH`), with a random `y` position constrained by `ASTEROID_SPAWN_Y_MARGIN` and `ASTEROID_SPAWN_Y_OFFSET`.
  - Picks a random size, speed, and vertex count between the configured min/max constants, and builds a jagged outline by assigning each vertex a randomized radius between `ASTEROID_RADIUS_MIN_FACTOR` and `ASTEROID_RADIUS_MAX_FACTOR` of the base size.
  - Moves left by `speed * deltaTime` and sets `active` to `false` once fully off-screen so the owning state can remove it.

- `src/Starfield.ts`
  - Manages a collection of background stars, each with its own position, size, speed, and brightness.
  - Stars drift left at their own speeds and wrap back to the right side when they leave the screen, creating a continuous scrolling background used in both menu and gameplay states.

- `src/ParticleManager.ts`
  - Manages explosion particles via an internal `particles` array.
  - `createExplosion(x, y, color?)` creates `PARTICLE_COUNT_PER_EXPLOSION` particles with random directions, speeds, lifetimes, sizes, and colors.
    - If `color` is not provided, each explosion uses an HSL color chosen randomly between `PARTICLE_HUE_MIN` and `PARTICLE_HUE_MAX`.
  - `update(deltaTime)` advances particle positions and lifetimes, removing dead particles.
  - `draw(ctx)` renders each particle as a small circle with alpha scaled by remaining life, producing a fade-out effect.

### Shared configuration and styling

- `src/Constants.ts`
  - Central location for tunable game parameters:
    - Game dimensions (`GAME_WIDTH`, `GAME_HEIGHT`).
    - Ship movement, size, firing rate, and collision behavior.
    - Bullet speed and size.
    - Asteroid spawn timing, speed range, size/shape parameters, and color.
    - Starfield density and speed range.
    - Particle system counts, speed/lifetime/size ranges, and color hue range.
    - Camera shake intensities and decay, freeze durations, and explosion time-scale.
    - UI and menu visuals (overlay alpha and font sizes).
  - When adjusting gameplay feel or visuals, prefer changing values here rather than scattering magic numbers through the code.

- `index.html` and `src/style.css`
  - `index.html` defines the `#app` container and `#gameCanvas` and sets the page title.
  - `src/style.css` sets up a full-viewport flex layout that centers the canvas on a black background, constrains the canvas to the viewport with `max-width`/`max-height`, and enforces a 16:9 aspect ratio to match the logical game resolution.
