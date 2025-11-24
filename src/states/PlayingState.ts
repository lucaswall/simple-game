import { GameState } from '../interfaces/GameState';
import { Game } from '../Game';
import { Asteroid } from '../Asteroid';
import { Ship } from '../Ship';
import { Bullet } from '../Bullet';
import { Starfield } from '../Starfield';
import { ParticleManager } from '../ParticleManager';
import { Input } from '../Input';
import { SHIP_X_POSITION, UI_HEIGHT, GAME_HEIGHT } from '../Constants';
import { GameOverState } from './GameOverState';

// Gameplay-specific constants
const ASTEROID_SPAWN_INTERVAL = 1.5; // Seconds
const HIT_FREEZE_DURATION = 0.1; // Seconds
export const SHIP_COLLISION_X = 75; // X position for collision detection
export const SHIP_COLLISION_RADIUS = 15; // Collision radius
const SHAKE_INTENSITY_SHIP_HIT = 20;
const SHAKE_INTENSITY_ASTEROID_HIT = 10;
const ASTEROID_HIT_FREEZE_DURATION = 0.05; // Seconds
const EXPLOSION_DURATION = 1.0; // Seconds
const EXPLOSION_TIME_SCALE = 1 / 3; // Time scale during explosion (1/3 = slower)

// Asteroid constants (used only in gameplay)
export const ASTEROID_MIN_SPEED = 200;
export const ASTEROID_MAX_SPEED = 400;
export const ASTEROID_SPAWN_Y_MARGIN = 40; // Margin from top/bottom
export const ASTEROID_SPAWN_Y_OFFSET = 20; // Minimum y offset from top
export const ASTEROID_MIN_SIZE = 15;
export const ASTEROID_MAX_SIZE = 30;
export const ASTEROID_MIN_VERTICES = 5;
export const ASTEROID_MAX_VERTICES = 10;
export const ASTEROID_RADIUS_MIN_FACTOR = 0.5; // Minimum radius factor
export const ASTEROID_RADIUS_MAX_FACTOR = 1.0; // Maximum radius factor
export const ASTEROID_COLOR = '#888';

// Particle constants (used only in gameplay)
export const PARTICLE_COUNT_PER_EXPLOSION = 30;
export const PARTICLE_MIN_SPEED = 50;
export const PARTICLE_MAX_SPEED = 250;
export const PARTICLE_MIN_LIFE = 0.5; // Seconds
export const PARTICLE_MAX_LIFE = 1.0; // Seconds
export const PARTICLE_MIN_SIZE = 2;
export const PARTICLE_MAX_SIZE = 6;
export const PARTICLE_HUE_MIN = 10; // HSL hue minimum
export const PARTICLE_HUE_MAX = 70; // HSL hue maximum

// Ship gameplay constants
export const SHIP_SPEED = 400; // Pixels per second
export const SHIP_FIRE_RATE_MS = 250; // Milliseconds between shots

// Bullet gameplay constants
export const BULLET_SPEED = 800; // Pixels per second
export const BULLET_SIZE = 5; // Radius

// Score constants
export const ASTEROID_POINTS = 100; // Points awarded for destroying an asteroid

// Lives constants
export const STARTING_LIVES = 3;
export const INVINCIBILITY_DURATION = 3.0; // Seconds
const BLINK_INTERVAL = 0.1; // Seconds between blinks

// Play area (gameplay area below UI)
export const PLAY_AREA_HEIGHT = GAME_HEIGHT - UI_HEIGHT;

export class PlayingState implements GameState {
    input: Input;
    starfield: Starfield;
    ship: Ship;
    asteroids: Asteroid[] = [];
    bullets: Bullet[] = [];
    particleManager: ParticleManager;
    asteroidTimer: number = 0;
    explosionTimer: number = 0; // Made public for testing
    score: number = 0;
    lives: number = STARTING_LIVES;
    invincibilityTimer: number = 0; // Made public for testing
    private blinkTimer: number = 0;

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
        this.ship.collisionEnabled = true;
        // Reset score and lives when entering playing state
        this.score = 0;
        this.lives = STARTING_LIVES;
        this.invincibilityTimer = 0;
        this.blinkTimer = 0;
        // Reset ship position
        this.ship.x = SHIP_X_POSITION;
        this.ship.y = PLAY_AREA_HEIGHT / 2;
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

            // When explosion finishes, respawn or game over
            if (this.explosionTimer <= 0 && this.particleManager.particles.length === 0) {
                // Restore normal time
                game.setTimeScale(1);
                
                if (this.lives > 0) {
                    // Respawn ship
                    this.respawnShip();
                } else {
                    // Game over - transition to game over screen
                    game.changeState(new GameOverState(this.input, this.score));
                }
            }
            return;
        }

        // Update invincibility and blinking
        if (this.invincibilityTimer > 0) {
            this.invincibilityTimer -= deltaTime;
            this.blinkTimer += deltaTime;
            
            // Blink ship visibility
            if (this.blinkTimer >= BLINK_INTERVAL) {
                this.ship.visible = !this.ship.visible;
                this.blinkTimer = 0;
            }
            
            // End invincibility
            if (this.invincibilityTimer <= 0) {
                this.invincibilityTimer = 0;
                this.ship.visible = true;
                this.ship.collisionEnabled = true;
            }
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
        // Draw UI area background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, ctx.canvas.width, UI_HEIGHT);
        
        // Draw score in UI area
        ctx.fillStyle = '#fff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Score: ${this.score}`, 20, 20);
        
        // Draw lives icons in top right
        this.drawLives(ctx);
        
        // Translate to gameplay area
        ctx.save();
        ctx.translate(0, UI_HEIGHT);
        
        // Draw gameplay elements
        this.starfield.draw(ctx);
        this.asteroids.forEach(a => a.draw(ctx));
        this.bullets.forEach(b => b.draw(ctx));
        this.particleManager.draw(ctx);
        this.ship.draw(ctx);
        
        ctx.restore();
    }

    exit(_game: Game): void { }

    private startExplosion(game: Game): void {
        const shipCollisionX = this.ship.x - (SHIP_X_POSITION - SHIP_COLLISION_X);
        this.particleManager.createExplosion(shipCollisionX, this.ship.y);
        this.ship.visible = false;
        this.ship.collisionEnabled = false;
        this.lives--;
        this.explosionTimer = EXPLOSION_DURATION;

        // Enter global slow motion for the duration of the explosion sequence.
        game.setTimeScale(EXPLOSION_TIME_SCALE);
    }

    private respawnShip(): void {
        // Reset ship position
        this.ship.x = SHIP_X_POSITION;
        this.ship.y = PLAY_AREA_HEIGHT / 2;
        this.ship.visible = true;
        this.ship.controllable = true;
        this.ship.collisionEnabled = false; // Disabled during invincibility
        
        // Start invincibility period
        this.invincibilityTimer = INVINCIBILITY_DURATION;
        this.blinkTimer = 0;
    }

    private drawLives(ctx: CanvasRenderingContext2D): void {
        const LIFE_ICON_SIZE = 15;
        const LIFE_SPACING = 25;
        const START_X = ctx.canvas.width - 20;
        const START_Y = 20;
        
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < this.lives; i++) {
            const x = START_X - (i * LIFE_SPACING);
            const y = START_Y;
            
            // Draw small ship icon (triangle pointing up)
            ctx.beginPath();
            ctx.moveTo(x, y); // Top point
            ctx.lineTo(x - LIFE_ICON_SIZE / 2, y + LIFE_ICON_SIZE); // Bottom left
            ctx.lineTo(x + LIFE_ICON_SIZE / 2, y + LIFE_ICON_SIZE); // Bottom right
            ctx.closePath();
            ctx.fill();
        }
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
        // Skip all collision checks if ship collisions are disabled or ship is invincible
        if (!this.ship.collisionEnabled || this.invincibilityTimer > 0) {
            return;
        }

        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];

            // Ship Collision
            if (this.ship.visible) {
                const shipCollisionX = this.ship.x - (SHIP_X_POSITION - SHIP_COLLISION_X);
                const dx = asteroid.x - shipCollisionX;
                const dy = asteroid.y - this.ship.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < asteroid.size + SHIP_COLLISION_RADIUS) {
                    // Disable collisions to prevent repeated collision detection
                    this.ship.collisionEnabled = false;
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
                    
                    // Award points for destroying asteroid
                    this.score += ASTEROID_POINTS;

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
