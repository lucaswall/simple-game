import { GameState } from '../interfaces/GameState';
import { Game } from '../Game';
import { Asteroid } from '../Asteroid';
import { Ship } from '../Ship';
import { Bullet } from '../Bullet';
import { Starfield } from '../Starfield';
import { ParticleManager } from '../ParticleManager';
import { Input } from '../Input';
import { ASTEROID_SPAWN_INTERVAL, HIT_FREEZE_DURATION, SHIP_COLLISION_X, SHIP_COLLISION_RADIUS, SHAKE_INTENSITY_SHIP_HIT, SHAKE_INTENSITY_ASTEROID_HIT, ASTEROID_HIT_FREEZE_DURATION, ASTEROID_COLOR, EXPLOSION_DURATION, EXPLOSION_TIME_SCALE } from '../Constants';
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
    private timeScale: number = 1.0;

    constructor(input: Input) {
        this.input = input;
        this.starfield = new Starfield();
        this.bullets = [];
        this.ship = new Ship(this.input, this.bullets);
        this.particleManager = new ParticleManager();
    }

    enter(_game: Game): void {
        this.ship.visible = true;
        // Clear input keys to prevent immediate shooting when Space is used to start the game
        this.input.clearKeys();
    }

    update(game: Game, deltaTime: number): void {
        // Skip updates if frozen (Game.update handles freeze timer)
        if (game.freezeTimer > 0) {
            return;
        }

        // Handle explosion state
        if (this.explosionTimer > 0) {
            const scaledDeltaTime = deltaTime * this.timeScale;
            this.explosionTimer -= scaledDeltaTime;
            
            // Update environment during explosion (with time scale)
            this.starfield.update(scaledDeltaTime);
            this.updateBullets(scaledDeltaTime);
            this.updateAsteroids(scaledDeltaTime);
            this.particleManager.update(scaledDeltaTime);

            // Transition to main menu when timer expires and particles are gone
            if (this.explosionTimer <= 0 && this.particleManager.particles.length === 0) {
                game.changeState(new MainMenuState(this.input));
            }
            return;
        }

        // Normal gameplay updates
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

    private startExplosion(): void {
        this.particleManager.createExplosion(SHIP_COLLISION_X, this.ship.y);
        this.ship.visible = false;
        this.explosionTimer = EXPLOSION_DURATION;
        this.timeScale = EXPLOSION_TIME_SCALE;
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
                const dx = asteroid.x - SHIP_COLLISION_X;
                const dy = asteroid.y - this.ship.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < asteroid.size + SHIP_COLLISION_RADIUS) {
                    game.shakeIntensity = SHAKE_INTENSITY_SHIP_HIT;
                    game.startFreeze(HIT_FREEZE_DURATION, () => {
                        this.startExplosion();
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
