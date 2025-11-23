import { GameState } from './interfaces/GameState';
import { Input } from './Input';
import { Starfield } from './Starfield';
import { Ship } from './Ship';
import { Asteroid } from './Asteroid';
import { Bullet } from './Bullet';
import { ParticleManager } from './ParticleManager';
import { GAME_WIDTH, GAME_HEIGHT, SHAKE_DECAY } from './Constants';
import { PlayingState } from './states/PlayingState';
import { ExplodingState } from './states/ExplodingState';

export class Game {
    ctx: CanvasRenderingContext2D;
    input: Input;
    starfield: Starfield;
    ship: Ship;
    asteroids: Asteroid[] = [];
    bullets: Bullet[] = [];
    particleManager: ParticleManager;

    currentState: GameState;
    shakeIntensity: number = 0;
    asteroidTimer: number = 0;
    freezeTimer: number = 0;
    freezeCallback: (() => void) | null = null;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
        this.input = new Input();
        this.starfield = new Starfield();
        this.bullets = [];
        this.ship = new Ship(this.input, this.bullets);
        this.particleManager = new ParticleManager();

        // Initial State
        this.currentState = new PlayingState();
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
        this.changeState(new PlayingState());
    }

    startFreeze(duration: number, callback: () => void) {
        this.freezeTimer = duration;
        this.freezeCallback = callback;
    }

    toExploding() {
        this.changeState(new ExplodingState());
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

        // Draw current state (will draw frozen frame if freezeTimer > 0)
        this.currentState.draw(this, this.ctx);

        this.ctx.restore();
    }
}
