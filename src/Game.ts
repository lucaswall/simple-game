import { GameState } from './interfaces/GameState';
import { GAME_WIDTH, GAME_HEIGHT, SHAKE_DECAY } from './Constants';

export class Game {
    ctx: CanvasRenderingContext2D;
    currentState: GameState;
    shakeIntensity: number = 0;
    freezeTimer: number = 0;
    freezeCallback: (() => void) | null = null;

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

    startFreeze(duration: number, callback: () => void) {
        this.freezeTimer = duration;
        this.freezeCallback = callback;
    }

    update(deltaTime: number) {
        // Update Shake
        if (this.shakeIntensity > 0) {
            this.shakeIntensity -= SHAKE_DECAY * deltaTime;
            if (this.shakeIntensity < 0) this.shakeIntensity = 0;
        }

        // Handle freeze timer
        if (this.freezeTimer > 0) {
            this.freezeTimer -= deltaTime;
            if (this.freezeTimer <= 0) {
                this.freezeTimer = 0;
                if (this.freezeCallback) {
                    const callback = this.freezeCallback;
                    this.freezeCallback = null;
                    callback();
                }
            }
            // Don't update game state when frozen
            return;
        }

        this.currentState.update(this, deltaTime);
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
