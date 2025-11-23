import { GameState } from '../interfaces/GameState';
import { Game } from '../Game';
import { Asteroid } from '../Asteroid';
import { Ship } from '../Ship';
import { Bullet } from '../Bullet';
import { Starfield } from '../Starfield';
import { ParticleManager } from '../ParticleManager';
import { Input } from '../Input';
import { ASTEROID_SPAWN_INTERVAL, HIT_FREEZE_DURATION, SHIP_COLLISION_X, SHIP_COLLISION_RADIUS, SHAKE_INTENSITY_SHIP_HIT, SHAKE_INTENSITY_ASTEROID_HIT, ASTEROID_HIT_FREEZE_DURATION, ASTEROID_COLOR, EXPLOSION_DURATION, EXPLOSION_TIME_SCALE, SHIP_X_POSITION } from '../Constants';
import { MainMenuState } from './MainMenuState';

export class PlayingState implements GameState {
    input: Input;
    starfield: Starfield;
    ship: Ship;
    asteroids: Asteroid[] = [];
    bullets: Bullet[] = [];
    particleManager: ParticleManager;
    asteroidTimer: number = 0;
    private explosionTimer: number = 0;

    constructor(input: Input) {
        this.input = input;
        this.starfield = new Starfield();
        this.bullets = [];
        this.ship = new Ship(this.input, this.bullets);
        this.particleManager = new ParticleManager();
    }

    enter(_game: Game): void {
        // Entities are either initialized in constructor or transferred from IntroState
        this.ship.visible = true;
        this.ship.controllable = true;
        // Start asteroid timer
        this.asteroidTimer = ASTEROID_SPAWN_INTERVAL;
    }

    update(game: Game, deltaTime: number): void {
        // Handle explosion state
        if (this.explosionTimer > 0) {
            // `deltaTime` is already scaled by Game.timeScale (slow motion during explosion).
            this.explosionTimer -= deltaTime;

            // Update environment during explosion (with scaled time)
            this.starfield.update(deltaTime);
            this.updateBullets(deltaTime);
            this.updateAsteroids(deltaTime);
            this.particleManager.update(deltaTime);

            // Transition to main menu when timer expires and particles are gone
            if (this.explosionTimer <= 0 && this.particleManager.particles.length === 0) {
                // Restore normal time before leaving the state.
                game.setTimeScale(1);
                game.changeState(new MainMenuState(this.input));
            }
            return;
        }

        // Normal gameplay updates (time may be slowed/frozen via Game.timeScale)
        this.starfield.update(deltaTime);
        this.ship.update(deltaTime);
        this.updateBullets(deltaTime);
        this.updateAsteroids(deltaTime);
        this.particleManager.update(deltaTime);
        this.checkCollisions(game);
    }

    draw(_game: Game, ctx: CanvasRenderingContext2D): void {
        this.starfield.draw(ctx);
        this.asteroids.forEach(a => a.draw(ctx));
        this.bullets.forEach(b => b.draw(ctx));
        this.particleManager.draw(ctx);
        this.ship.draw(ctx);
    }

    exit(_game: Game): void { }

    private startExplosion(game: Game): void {
        const shipCollisionX = this.ship.x - (SHIP_X_POSITION - SHIP_COLLISION_X);
        this.particleManager.createExplosion(shipCollisionX, this.ship.y);
        this.ship.visible = false;
        this.explosionTimer = EXPLOSION_DURATION;

        // Enter global slow motion for the duration of the explosion sequence.
        game.setTimeScale(EXPLOSION_TIME_SCALE);
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
        // Spawn asteroids
        this.asteroidTimer -= deltaTime;
        if (this.asteroidTimer <= 0) {
            this.asteroids.push(new Asteroid());
            this.asteroidTimer = ASTEROID_SPAWN_INTERVAL;
        }

        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const a = this.asteroids[i];
            a.update(deltaTime);
            if (!a.active) {
                this.asteroids.splice(i, 1);
            }
        }
    }

    private checkCollisions(game: Game) {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];

            // Ship Collision
            if (this.ship.visible) {
                const shipCollisionX = this.ship.x - (SHIP_X_POSITION - SHIP_COLLISION_X);
                const dx = asteroid.x - shipCollisionX;
                const dy = asteroid.y - this.ship.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < asteroid.size + SHIP_COLLISION_RADIUS) {
                    game.shakeIntensity = SHAKE_INTENSITY_SHIP_HIT;
                    game.startFreeze(HIT_FREEZE_DURATION, () => {
                        this.startExplosion(game);
                    });
                    return;
                }
            }

            // Bullet Collision
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const bullet = this.bullets[j];
                const dx = asteroid.x - bullet.x;
                const dy = asteroid.y - bullet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < asteroid.size + bullet.size) {
                    this.particleManager.createExplosion(asteroid.x, asteroid.y, ASTEROID_COLOR);
                    this.asteroids.splice(i, 1);
                    this.bullets.splice(j, 1);

                    game.shakeIntensity = SHAKE_INTENSITY_ASTEROID_HIT;
                    game.startFreeze(ASTEROID_HIT_FREEZE_DURATION, () => {
                        // Stay in playing state, freeze just provides visual feedback
                    });
                    break;
                }
            }
        }
    }
}
