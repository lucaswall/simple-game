import { GameState } from './interfaces/GameState';
import { Input } from './Input';
import { Starfield } from './Starfield';
import { Ship } from './Ship';
import { Asteroid } from './Asteroid';
import { Bullet } from './Bullet';
import { ParticleManager } from './ParticleManager';
import { GAME_WIDTH, GAME_HEIGHT, SHAKE_DECAY, EXPLOSION_DURATION, EXPLOSION_TIME_SCALE, SHIP_COLLISION_X } from './Constants';
import { PlayingState } from './states/PlayingState';

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
    explosionTimer: number = 0;
    timeScale: number = 1.0; // Global time scale for rendering/updates

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

    startExplosion() {
        this.particleManager.createExplosion(SHIP_COLLISION_X, this.ship.y);
        this.ship.visible = false;
        this.explosionTimer = EXPLOSION_DURATION;
        this.timeScale = EXPLOSION_TIME_SCALE;
    }

    respawn() {
        this.ship.y = GAME_HEIGHT / 2;
        this.ship.visible = true;
        this.asteroids = [];
        this.asteroidTimer = 0;
        this.timeScale = 1.0;
        this.explosionTimer = 0;
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
            this.starfield.update(scaledDeltaTime);
            this.updateBullets(scaledDeltaTime);
            this.updateAsteroids(scaledDeltaTime);
            this.particleManager.update(scaledDeltaTime);

            // Respawn when timer expires and particles are gone
            if (this.explosionTimer <= 0 && this.particleManager.particles.length === 0) {
                this.respawn();
                this.toPlaying();
            }
            return;
        }

        this.currentState.update(this, deltaTime);
    }

    private updateBullets(deltaTime: number) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(deltaTime);
            if (!b.active) {
                this.bullets.splice(i, 1);
            }
        }
    }

    private updateAsteroids(deltaTime: number) {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const a = this.asteroids[i];
            a.update(deltaTime);
            if (!a.active) {
                this.asteroids.splice(i, 1);
            }
        }
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
