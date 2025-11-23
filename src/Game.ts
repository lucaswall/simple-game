import { GameState } from './interfaces/GameState';
import { Input } from './Input';
import { GAME_WIDTH, GAME_HEIGHT, SHAKE_DECAY, EXPLOSION_DURATION, EXPLOSION_TIME_SCALE } from './Constants';
import { PlayingState } from './states/PlayingState';

export class Game {
    ctx: CanvasRenderingContext2D;
    input: Input;
    currentState: GameState;
    shakeIntensity: number = 0;
    freezeTimer: number = 0;
    freezeCallback: (() => void) | null = null;
    explosionTimer: number = 0;
    timeScale: number = 1.0; // Global time scale for rendering/updates

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
        this.input = new Input();

        // Initial State
        this.currentState = new PlayingState(this.input);
        this.currentState.enter(this);
    }

    changeState(newState: GameState) {
        if (this.currentState) {
            this.currentState.exit(this);
        }
        this.currentState = newState;
        this.currentState.enter(this);
    }

    toPlaying() {
        this.changeState(new PlayingState(this.input));
    }

    startFreeze(duration: number, callback: () => void) {
        this.freezeTimer = duration;
        this.freezeCallback = callback;
    }

    startExplosion() {
        if (this.currentState.startExplosion) {
            this.currentState.startExplosion();
            this.explosionTimer = EXPLOSION_DURATION;
            this.timeScale = EXPLOSION_TIME_SCALE;
        }
    }

    respawn() {
        if (this.currentState.respawn) {
            this.currentState.respawn();
            this.timeScale = 1.0;
            this.explosionTimer = 0;
        }
    }

    update(deltaTime: number) {
        // Apply time scale to deltaTime
        const scaledDeltaTime = deltaTime * this.timeScale;

        // Update Shake
        if (this.shakeIntensity > 0) {
            this.shakeIntensity -= SHAKE_DECAY * deltaTime; // Shake uses real time, not scaled
            if (this.shakeIntensity < 0) this.shakeIntensity = 0;
        }

        // Handle freeze timer
        if (this.freezeTimer > 0) {
            this.freezeTimer -= deltaTime; // Freeze uses real time
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

        // Handle explosion timer
        if (this.explosionTimer > 0) {
            this.explosionTimer -= scaledDeltaTime;
            
            // Update environment during explosion (with time scale)
            if (this.currentState.updateDuringExplosion) {
                this.currentState.updateDuringExplosion(scaledDeltaTime);
            }

            // Respawn when timer expires and state indicates it can respawn
            if (this.explosionTimer <= 0 && this.currentState.canRespawn && this.currentState.canRespawn()) {
                this.respawn();
                this.toPlaying();
            }
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
        // During explosion, ship is hidden and environment continues with time scale
        this.currentState.draw(this, this.ctx);

        this.ctx.restore();
    }
}
