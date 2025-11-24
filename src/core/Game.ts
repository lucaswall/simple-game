import { GameState } from '../interfaces/GameState';
import { GAME_WIDTH, GAME_HEIGHT, SHAKE_DECAY } from './Constants';

export class Game {
    ctx: CanvasRenderingContext2D;
    currentState: GameState;
    shakeIntensity: number = 0;

    // Global time scale applied to all game updates (1 = normal speed).
    timeScale: number = 1;

    // Optional timed time-scale effect (e.g., hit-stop/freeze).
    private timeScaleTimer: number = 0;
    private timeScaleCallback: (() => void) | null = null;

    constructor(ctx: CanvasRenderingContext2D, initialState: GameState) {
        this.ctx = ctx;
        this.currentState = initialState;
        this.currentState.enter(this);
    }

    changeState(newState: GameState) {
        if (this.currentState) {
            this.currentState.exit(this);
        }
        this.currentState = newState;
        this.currentState.enter(this);
    }

    /**
     * Set the global time scale immediately (1 = normal speed, 0 = frozen).
     */
    setTimeScale(scale: number) {
        this.timeScale = scale;
    }

    /**
     * Apply a time scale for a fixed duration, then restore to normal and run an optional callback.
     * Used to implement hit-stop style freezes.
     */
    private setTimedTimeScale(scale: number, duration: number, callback?: () => void) {
        this.timeScale = scale;
        this.timeScaleTimer = duration;
        this.timeScaleCallback = callback ?? null;
    }

    /**
     * Hit-stop style freeze: timeScale = 0 for `duration`, then optional callback.
     */
    startFreeze(duration: number, callback?: () => void) {
        this.setTimedTimeScale(0, duration, callback);
    }

    update(deltaTime: number) {
        // Update Shake
        if (this.shakeIntensity > 0) {
            this.shakeIntensity -= SHAKE_DECAY * deltaTime;
            if (this.shakeIntensity < 0) this.shakeIntensity = 0;
        }

        // Handle any active timed time-scale effect (e.g., hit-stop).
        if (this.timeScaleTimer > 0) {
            this.timeScaleTimer -= deltaTime;
            if (this.timeScaleTimer <= 0) {
                this.timeScaleTimer = 0;

                // Restore normal time scale before invoking callback.
                this.timeScale = 1;

                if (this.timeScaleCallback) {
                    const callback = this.timeScaleCallback;
                    this.timeScaleCallback = null;
                    callback();
                }
            }
        }

        const scaledDeltaTime = deltaTime * this.timeScale;
        this.currentState.update(this, scaledDeltaTime);
    }

    draw() {
        // Clear screen
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        this.ctx.save();

        // Apply Camera Shake
        if (this.shakeIntensity > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(dx, dy);
        }

        // Draw current state
        this.currentState.draw(this, this.ctx);

        this.ctx.restore();
    }
}

