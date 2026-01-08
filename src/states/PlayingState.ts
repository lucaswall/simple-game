import { GameState } from '../interfaces/GameState';
import { Game } from '../core/Game';
import { Asteroid, AsteroidSize } from '../actors/Asteroid';
import { Ship } from '../actors/Ship';
import { Bullet } from '../actors/Bullet';
import { Starfield } from '../core/Starfield';
import { ParticleManager } from '../managers/ParticleManager';
import { Input } from '../core/Input';
import { SHIP_X_POSITION, UI_HEIGHT, GAME_HEIGHT } from '../core/Constants';
import { GameOverState } from './GameOverState';
import { CollisionManager } from '../managers/CollisionManager';
import { CollisionContext, Collidable } from '../interfaces/Collidable';

// Gameplay-specific constants
const ASTEROID_SPAWN_INTERVAL_START = 3.0; // Seconds - starting spawn interval
const ASTEROID_SPAWN_INTERVAL_1MIN = 1.0; // Seconds - spawn interval at 1 minute
const ASTEROID_SPAWN_INTERVAL_2MIN = 0.5; // Seconds - spawn interval at 2 minutes
const ASTEROID_SPAWN_INTERVAL_3MIN = 0.25; // Seconds - spawn interval at 3 minutes
const ASTEROID_SPAWN_RAMP_TIME = 180.0; // Seconds - time to reach max spawn rate (3 minutes)
const ASTEROID_LARGE_RATIO_START = 0.1; // Starting large asteroid ratio (10%)
const ASTEROID_LARGE_RATIO_END = 0.5; // Large asteroid ratio at 3 minutes (50%)
export const HIT_FREEZE_DURATION = 0.1; // Seconds
export const SHIP_COLLISION_X = 75; // X position for collision detection
export const SHIP_COLLISION_RADIUS = 15; // Collision radius
export const SHAKE_INTENSITY_SHIP_HIT = 20;
export const SHAKE_INTENSITY_ASTEROID_HIT = 10;
export const ASTEROID_HIT_FREEZE_DURATION = 0.05; // Seconds
const EXPLOSION_DURATION = 1.0; // Seconds
const EXPLOSION_TIME_SCALE = 1 / 3; // Time scale during explosion (1/3 = slower)

// Asteroid constants (used only in gameplay)
export const ASTEROID_MIN_SPEED = 200;
export const ASTEROID_MAX_SPEED = 400;
export const ASTEROID_SPAWN_Y_MARGIN = 40; // Margin from top/bottom
export const ASTEROID_SPAWN_Y_OFFSET = 20; // Minimum y offset from top
export const ASTEROID_MIN_SIZE = 15;
export const ASTEROID_MAX_SIZE = 30;
export const ASTEROID_LARGE_SIZE = 35; // Size for large asteroids
export const ASTEROID_MEDIUM_SIZE = 25; // Size for medium asteroids
export const ASTEROID_SMALL_SIZE = 15; // Size for small asteroids
export const ASTEROID_MIN_VERTICES = 5;
export const ASTEROID_MAX_VERTICES = 10;
export const ASTEROID_RADIUS_MIN_FACTOR = 0.5; // Minimum radius factor
export const ASTEROID_RADIUS_MAX_FACTOR = 1.0; // Maximum radius factor
export const ASTEROID_COLOR = '#888';
export const ASTEROID_LARGE_SPLIT_ANGLE_MIN = 5; // Minimum split angle for large->medium in degrees
export const ASTEROID_LARGE_SPLIT_ANGLE_MAX = 10; // Maximum split angle for large->medium in degrees
export const ASTEROID_MEDIUM_SPLIT_ANGLE_MIN = 10; // Minimum split angle for medium->small in degrees
export const ASTEROID_MEDIUM_SPLIT_ANGLE_MAX = 30; // Maximum split angle for medium->small in degrees

// Exploding asteroid constants
export const ASTEROID_EXPLOSION_RADIUS_SMALL = 100; // Explosion radius for small exploding asteroids
export const ASTEROID_EXPLOSION_RADIUS_MEDIUM = 150; // Explosion radius for medium exploding asteroids
export const ASTEROID_EXPLOSION_RADIUS_LARGE = 200; // Explosion radius for large exploding asteroids
export const ASTEROID_FLASH_INTERVAL = 0.2; // Seconds between red flashes
export const ASTEROID_EXPLODING_CHANCE_START = 0.1; // 1 in 10 chance at 1 minute
export const ASTEROID_EXPLODING_CHANCE_END = 0.2; // 2 in 10 chance at 3 minutes
export const ASTEROID_EXPLODING_START_TIME = 60; // Seconds - when exploding asteroids start appearing
export const ASTEROID_EXPLODING_RAMP_TIME = 180; // Seconds - time to reach max chance (3 minutes)
export const ASTEROID_AUTO_EXPLODE_DELAY_LARGE_MIN = 1.0; // Minimum delay before auto-explosion for large asteroids (seconds)
export const ASTEROID_AUTO_EXPLODE_DELAY_LARGE_MAX = 1.3; // Maximum delay before auto-explosion for large asteroids (seconds)
export const ASTEROID_AUTO_EXPLODE_DELAY_MEDIUM_MIN = 1.3; // Minimum delay before auto-explosion for medium asteroids (seconds)
export const ASTEROID_AUTO_EXPLODE_DELAY_MEDIUM_MAX = 1.7; // Maximum delay before auto-explosion for medium asteroids (seconds)
export const ASTEROID_AUTO_EXPLODE_DELAY_SMALL_MIN = 1.7; // Minimum delay before auto-explosion for small asteroids (seconds)
export const ASTEROID_AUTO_EXPLODE_DELAY_SMALL_MAX = 2.0; // Maximum delay before auto-explosion for small asteroids (seconds)

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
export const ASTEROID_SMALL_POINTS = 50; // Points awarded for destroying a small asteroid
export const ASTEROID_MEDIUM_POINTS = 100; // Points awarded for splitting a medium asteroid
export const ASTEROID_LARGE_POINTS = 200; // Points awarded for splitting a large asteroid

// Lives constants
export const STARTING_LIVES = 3;
export const INVINCIBILITY_DURATION = 2.0; // Seconds
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
    private heatBarBlinkTimer: number = 0; // Timer for heat bar blinking when overheated
    private gameTime: number = 0; // Total game time in seconds
    private debugMode: boolean = false;
    private debugKeyPressed: boolean = false; // Track if D key was pressed to toggle on keydown
    private fastForwardKeyPressed: boolean = false; // Track if F key was pressed to advance time
    private currentGame: Game | null = null;

    constructor(input: Input) {
        this.input = input;
        this.starfield = new Starfield();
        this.bullets = [];
        this.ship = new Ship(this.input, this.bullets);
        this.particleManager = new ParticleManager();
    }

    enter(_game: Game): void {
        this.currentGame = _game;
        // Entities are either initialized in constructor or transferred from IntroState
        this.ship.visible = true;
        this.ship.controllable = true;
        this.ship.collisionEnabled = true;
        // Reset score and lives when entering playing state
        this.score = 0;
        this.lives = STARTING_LIVES;
        this.invincibilityTimer = 0;
        this.blinkTimer = 0;
        this.heatBarBlinkTimer = 0;
        this.gameTime = 0;
        this.debugMode = false;
        this.debugKeyPressed = false;
        this.fastForwardKeyPressed = false;
        // Reset ship position
        this.ship.x = SHIP_X_POSITION;
        this.ship.y = PLAY_AREA_HEIGHT / 2;
        // Reset weapon heat
        this.ship.resetOverheat();
        // Start asteroid timer with initial spawn interval
        this.asteroidTimer = ASTEROID_SPAWN_INTERVAL_START;
    }

    update(game: Game, deltaTime: number): void {
        // Update game time (only when not in explosion state)
        if (this.explosionTimer <= 0) {
            this.gameTime += deltaTime;
        }
        
        // Handle explosion state
        if (this.explosionTimer > 0) {
            // `deltaTime` is already scaled by Game.timeScale (slow motion during explosion).
            this.explosionTimer -= deltaTime;

            // Update environment during explosion (with scaled time)
            this.starfield.update(deltaTime);
            this.updateBullets(deltaTime);
            this.updateAsteroids(game, deltaTime);
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

        // Handle debug toggle
        if (this.input.keys.KeyD && !this.debugKeyPressed) {
            this.debugMode = !this.debugMode;
            this.debugKeyPressed = true;
        } else if (!this.input.keys.KeyD) {
            this.debugKeyPressed = false;
        }

        // Handle fast forward (advance game time by 20 seconds)
        if (this.input.keys.KeyF && !this.fastForwardKeyPressed) {
            this.gameTime += 20;
            this.fastForwardKeyPressed = true;
        } else if (!this.input.keys.KeyF) {
            this.fastForwardKeyPressed = false;
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

        // Update heat bar blink timer
        if (this.ship.isOverheated()) {
            // Weapon is jammed - blink the heat bar
            this.heatBarBlinkTimer += deltaTime;
        } else {
            // Reset blink timer when not overheated
            this.heatBarBlinkTimer = 0;
        }

        // Normal gameplay updates (time may be slowed/frozen via Game.timeScale)
        this.starfield.update(deltaTime);
        this.ship.update(deltaTime);
        this.updateBullets(deltaTime);
        this.updateAsteroids(game, deltaTime);
        this.particleManager.update(deltaTime);
        this.checkCollisions(game);
    }

    private checkCollisions(game: Game): void {
        // Skip all collision checks if ship collisions are disabled or ship is invincible
        if (!this.ship.collisionEnabled || this.invincibilityTimer > 0) {
            return;
        }

        // Build list of collidables
        const collidables: Collidable[] = [];
        if (this.ship.visible && this.ship.collisionEnabled) {
            collidables.push(this.ship);
        }
        collidables.push(...this.asteroids.filter(a => a.active && a.collisionEnabled));
        collidables.push(...this.bullets.filter(b => b.active && b.collisionEnabled));

        // Create collision context using helper method
        const context = this.createCollisionContext(game, {
            onShipDestroyed: () => this.startExplosion(game),
            onExplosion: (x, y, radius) => this.handleExplosion(x, y, radius, game)
        });

        // Check collisions
        CollisionManager.checkCollisions(collidables, context);
    }

    private handleExplosion(explosionX: number, explosionY: number, radius: number, game?: Game): void {
        const activeGame = game ?? this.currentGame;
        if (!activeGame) {
            return;
        }
        // Check if ship is in explosion radius
        const shipBounds = this.ship.getCollisionBounds();
        const shipCenterX = shipBounds.centerX ?? 0;
        const shipCenterY = shipBounds.centerY ?? 0;
        const shipRadius = shipBounds.radius ?? 0;
        
        const dx = explosionX - shipCenterX;
        const dy = explosionY - shipCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < radius + shipRadius && this.ship.collisionEnabled && this.invincibilityTimer <= 0) {
            // Ship is in explosion radius - destroy it
            this.ship.collisionEnabled = false;
            this.startExplosion(activeGame);
        }
        
        // Check all asteroids in explosion radius
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            if (!asteroid.active || !asteroid.collisionEnabled) continue;
            
            const asteroidBounds = asteroid.getCollisionBounds();
            const asteroidCenterX = asteroidBounds.centerX ?? 0;
            const asteroidCenterY = asteroidBounds.centerY ?? 0;
            const asteroidRadius = asteroidBounds.radius ?? 0;
            
            const astDx = explosionX - asteroidCenterX;
            const astDy = explosionY - asteroidCenterY;
            const astDistance = Math.sqrt(astDx * astDx + astDy * astDy);
            
            if (astDistance < radius + asteroidRadius) {
                // Asteroid is in explosion radius - destroy it as if hit by bullet
                // Create a real bullet instance for collision (position doesn't matter, just needs to be instanceof Bullet)
                const fakeBullet = new Bullet(asteroid.x, asteroid.y, 0, 0);
                const context = this.createCollisionContext(activeGame);
                asteroid.onCollision(fakeBullet, context);
            }
        }
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
        
        // Draw weapon heat bar at top center
        this.drawHeatBar(ctx);
        
        // Draw lives icons in top right
        this.drawLives(ctx);
        
        // Draw debug overlay if enabled
        if (this.debugMode) {
            this.drawDebugOverlay(ctx);
        }
        
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

    exit(_game: Game): void { this.currentGame = null; }

    /**
     * Create a collision context with standard asteroid handling callbacks.
     * Reduces code duplication across collision handling methods.
     */
    private createCollisionContext(game: Game, options?: {
        onShipDestroyed?: () => void;
        onExplosion?: (x: number, y: number, radius: number) => void;
    }): CollisionContext {
        return {
            game: game,
            particleManager: this.particleManager,
            onAsteroidDestroyed: (asteroid: import('../interfaces/Actor').Actor) => {
                // Type guard - ensure we're working with an Asteroid
                if (!(asteroid instanceof Asteroid)) return;

                // Award points for destroying small asteroid
                if (asteroid.asteroidSize === AsteroidSize.SMALL) {
                    this.score += ASTEROID_SMALL_POINTS;
                }
                // Remove asteroid from array
                const index = this.asteroids.indexOf(asteroid);
                if (index !== -1) {
                    this.asteroids.splice(index, 1);
                }
            },
            onAsteroidSplit: (parentAsteroid: import('../interfaces/Actor').Actor, newAsteroids: import('../interfaces/Actor').Actor[]) => {
                // Type guard - ensure we're working with an Asteroid
                if (!(parentAsteroid instanceof Asteroid)) return;

                // Award points for splitting asteroid
                if (parentAsteroid.asteroidSize === AsteroidSize.LARGE) {
                    this.score += ASTEROID_LARGE_POINTS;
                } else if (parentAsteroid.asteroidSize === AsteroidSize.MEDIUM) {
                    this.score += ASTEROID_MEDIUM_POINTS;
                }
                // Remove parent asteroid from array
                const index = this.asteroids.indexOf(parentAsteroid);
                if (index !== -1) {
                    this.asteroids.splice(index, 1);
                }
                // Add new asteroids to array (filter to ensure only valid Asteroids)
                const validAsteroids = newAsteroids.filter((a): a is Asteroid => a instanceof Asteroid);
                this.asteroids.push(...validAsteroids);
            },
            onShipDestroyed: options?.onShipDestroyed,
            onExplosion: options?.onExplosion
        };
    }

    private startExplosion(game?: Game): void {
        const activeGame = game ?? this.currentGame;
        if (!activeGame) {
            return;
        }
        const shipCollisionX = this.ship.x - (SHIP_X_POSITION - SHIP_COLLISION_X);
        this.particleManager.createExplosion(shipCollisionX, this.ship.y);
        this.ship.visible = false;
        this.ship.collisionEnabled = false;
        this.lives--;
        // Subtract 1 minute from game time when a life is lost (minimum 0)
        this.gameTime = Math.max(0, this.gameTime - 60);
        this.explosionTimer = EXPLOSION_DURATION;

        // Enter global slow motion for the duration of the explosion sequence.
        activeGame.setTimeScale(EXPLOSION_TIME_SCALE);
    }

    private respawnShip(): void {
        // Reset ship position
        this.ship.x = SHIP_X_POSITION;
        this.ship.y = PLAY_AREA_HEIGHT / 2;
        this.ship.visible = true;
        this.ship.controllable = true;
        this.ship.collisionEnabled = false; // Disabled during invincibility
        
        // Reset weapon heat on respawn
        this.ship.resetOverheat();
        
        // Start invincibility period
        this.invincibilityTimer = INVINCIBILITY_DURATION;
        this.blinkTimer = 0;
        
        // Reset debug key states
        this.fastForwardKeyPressed = false;
        this.debugKeyPressed = false;
    }

    private drawHeatBar(ctx: CanvasRenderingContext2D): void {
        const BAR_WIDTH = 200;
        const BAR_HEIGHT = 20;
        const BAR_X = (ctx.canvas.width - BAR_WIDTH) / 2;
        const BAR_Y = 20;
        const BLINK_INTERVAL = 0.15; // Blink every 0.15 seconds
        
        // Check if weapon is jammed (overheated and in cooldown)
        const isJammed = this.ship.isOverheated();
        const shouldBlink = isJammed && Math.floor(this.heatBarBlinkTimer / BLINK_INTERVAL) % 2 === 0;
        
        // Draw background
        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.fillRect(BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT);
        
        // Draw heat segments (1-10)
        const segmentWidth = BAR_WIDTH / 10;
        const heat = Math.floor(this.ship.heat);
        
        // If jammed and blinking, hide the bar
        if (!shouldBlink || !isJammed) {
            for (let i = 0; i < 10; i++) {
                const segmentX = BAR_X + i * segmentWidth;
                
                if (i < heat) {
                    // Filled segments - color changes based on heat level
                    if (heat >= 10) {
                        ctx.fillStyle = '#f00'; // Red when overheated
                    } else if (heat >= 7) {
                        ctx.fillStyle = '#f80'; // Orange when high
                    } else {
                        ctx.fillStyle = '#ff0'; // Yellow when moderate
                    }
                } else {
                    // Empty segments
                    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
                }
                
                ctx.fillRect(segmentX + 1, BAR_Y + 1, segmentWidth - 2, BAR_HEIGHT - 2);
            }
        }
        
        // Draw border (blink border when jammed)
        if (isJammed && shouldBlink) {
            ctx.strokeStyle = '#f00';
        } else {
            ctx.strokeStyle = '#fff';
        }
        ctx.lineWidth = 2;
        ctx.strokeRect(BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT);
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

    private updateAsteroids(game: Game, deltaTime: number): void;
    private updateAsteroids(deltaTime: number): void;
    private updateAsteroids(gameOrDelta: Game | number, deltaTime?: number) {
        const activeGame = typeof gameOrDelta === 'number' ? this.currentGame : gameOrDelta;
        const resolvedDeltaTime = typeof gameOrDelta === 'number' ? gameOrDelta : deltaTime ?? 0;

        if (resolvedDeltaTime === undefined) {
            return;
        }

        // Calculate dynamic spawn interval based on game time (piecewise linear)
        let currentSpawnInterval: number;
        if (this.gameTime <= 60) {
            // From 0 to 60 seconds: linear from 3.0 to 1.0
            const t = this.gameTime / 60.0;
            currentSpawnInterval = ASTEROID_SPAWN_INTERVAL_START - 
                (ASTEROID_SPAWN_INTERVAL_START - ASTEROID_SPAWN_INTERVAL_1MIN) * t;
        } else if (this.gameTime <= 120) {
            // From 60 to 120 seconds: linear from 1.0 to 0.5
            const t = (this.gameTime - 60) / 60.0;
            currentSpawnInterval = ASTEROID_SPAWN_INTERVAL_1MIN - 
                (ASTEROID_SPAWN_INTERVAL_1MIN - ASTEROID_SPAWN_INTERVAL_2MIN) * t;
        } else if (this.gameTime <= 180) {
            // From 120 to 180 seconds: linear from 0.5 to 0.25
            const t = (this.gameTime - 120) / 60.0;
            currentSpawnInterval = ASTEROID_SPAWN_INTERVAL_2MIN - 
                (ASTEROID_SPAWN_INTERVAL_2MIN - ASTEROID_SPAWN_INTERVAL_3MIN) * t;
        } else {
            // After 180 seconds: stay at 0.25
            currentSpawnInterval = ASTEROID_SPAWN_INTERVAL_3MIN;
        }
        
        // If asteroidTimer is significantly out of sync with current spawn interval (more than 2x),
        // reset it to prevent desync after fast forward or time changes
        if (this.asteroidTimer > currentSpawnInterval * 2) {
            this.asteroidTimer = currentSpawnInterval;
        }
        
        // Calculate dynamic large asteroid ratio based on game time
        const largeRatioProgress = Math.min(this.gameTime / ASTEROID_SPAWN_RAMP_TIME, 1.0);
        const currentLargeRatio = ASTEROID_LARGE_RATIO_START + 
            (ASTEROID_LARGE_RATIO_END - ASTEROID_LARGE_RATIO_START) * largeRatioProgress;
        
        // Spawn asteroids
        this.asteroidTimer -= resolvedDeltaTime;
        if (this.asteroidTimer <= 0) {
            // Ramp up angled asteroids: 0-5° at 1min, 0-10° at 2min, 0-20° at 3min
            let angleOffset: number | undefined = undefined;
            if (this.gameTime >= 60) {
                if (Math.random() < 0.5) {
                    let maxAngle: number;
                    if (this.gameTime <= 120) {
                        // From 60 to 120 seconds: linear ramp from 5 to 10 degrees max
                        const t = (this.gameTime - 60) / 60.0;
                        maxAngle = 5 + (10 - 5) * t;
                    } else if (this.gameTime <= 180) {
                        // From 120 to 180 seconds: linear ramp from 10 to 20 degrees max
                        const t = (this.gameTime - 120) / 60.0;
                        maxAngle = 10 + (20 - 10) * t;
                    } else {
                        // After 180 seconds: stay at 20 degrees max
                        maxAngle = 20;
                    }
                    // Random angle between 0 and maxAngle degrees (always starts from 0)
                    angleOffset = Math.random() * maxAngle;
                }
            }
            
            // Determine if this asteroid should be exploding
            let isExploding = false;
            if (this.gameTime >= ASTEROID_EXPLODING_START_TIME) {
                // Calculate exploding asteroid chance (linear from 10% at 1min to 20% at 3min)
                const explodingProgress = Math.min((this.gameTime - ASTEROID_EXPLODING_START_TIME) / (ASTEROID_EXPLODING_RAMP_TIME - ASTEROID_EXPLODING_START_TIME), 1.0);
                const explodingChance = ASTEROID_EXPLODING_CHANCE_START + 
                    (ASTEROID_EXPLODING_CHANCE_END - ASTEROID_EXPLODING_CHANCE_START) * explodingProgress;
                isExploding = Math.random() < explodingChance;
            }
            
            this.asteroids.push(new Asteroid(undefined, undefined, undefined, undefined, undefined, currentLargeRatio, angleOffset, isExploding));
            this.asteroidTimer = currentSpawnInterval;
        }

        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const a = this.asteroids[i];
            a.update(resolvedDeltaTime);

            // Check if exploding asteroid should auto-explode
            if (a.shouldAutoExplode() && activeGame) {
                const context = this.createCollisionContext(activeGame, {
                    onExplosion: (x, y, radius) => this.handleExplosion(x, y, radius, activeGame)
                });
                a.triggerExplosion(context);
            }
            
            if (!a.active) {
                this.asteroids.splice(i, 1);
            }
        }
    }

    private drawDebugOverlay(ctx: CanvasRenderingContext2D): void {
        // Calculate current spawn rate and asteroid chances
        // Use same piecewise linear calculation as updateAsteroids
        let currentSpawnInterval: number;
        if (this.gameTime <= 60) {
            const t = this.gameTime / 60.0;
            currentSpawnInterval = ASTEROID_SPAWN_INTERVAL_START - 
                (ASTEROID_SPAWN_INTERVAL_START - ASTEROID_SPAWN_INTERVAL_1MIN) * t;
        } else if (this.gameTime <= 120) {
            const t = (this.gameTime - 60) / 60.0;
            currentSpawnInterval = ASTEROID_SPAWN_INTERVAL_1MIN - 
                (ASTEROID_SPAWN_INTERVAL_1MIN - ASTEROID_SPAWN_INTERVAL_2MIN) * t;
        } else if (this.gameTime <= 180) {
            const t = (this.gameTime - 120) / 60.0;
            currentSpawnInterval = ASTEROID_SPAWN_INTERVAL_2MIN - 
                (ASTEROID_SPAWN_INTERVAL_2MIN - ASTEROID_SPAWN_INTERVAL_3MIN) * t;
        } else {
            currentSpawnInterval = ASTEROID_SPAWN_INTERVAL_3MIN;
        }
        const spawnRate = 1.0 / currentSpawnInterval; // Asteroids per second
        
        const largeRatioProgress = Math.min(this.gameTime / ASTEROID_SPAWN_RAMP_TIME, 1.0);
        const currentLargeRatio = ASTEROID_LARGE_RATIO_START + 
            (ASTEROID_LARGE_RATIO_END - ASTEROID_LARGE_RATIO_START) * largeRatioProgress;
        
        const remainingRatio = 1.0 - currentLargeRatio;
        const smallMediumRatio = 4.0 / 9.0; // 4/(4+5) = small portion of remaining
        const smallChance = remainingRatio * smallMediumRatio;
        const mediumChance = remainingRatio * (1.0 - smallMediumRatio);
        const largeChance = currentLargeRatio;
        
        // Format time
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Draw debug panel background - positioned at bottom right
        const padding = 10;
        const lineHeight = 20;
        const panelWidth = 250;
        const panelHeight = 100;
        const x = ctx.canvas.width - panelWidth - padding;
        const y = ctx.canvas.height - panelHeight - padding;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, panelWidth, panelHeight);
        
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, panelWidth, panelHeight);
        
        // Draw debug text
        ctx.fillStyle = '#0f0';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        let textY = y + 5;
        ctx.fillText(`Play Time: ${timeString}`, x + 5, textY);
        textY += lineHeight;
        ctx.fillText(`Spawn Rate: ${spawnRate.toFixed(2)}/s`, x + 5, textY);
        textY += lineHeight;
        ctx.fillText(`Small: ${(smallChance * 100).toFixed(1)}%`, x + 5, textY);
        textY += lineHeight;
        ctx.fillText(`Medium: ${(mediumChance * 100).toFixed(1)}%`, x + 5, textY);
        textY += lineHeight;
        ctx.fillText(`Large: ${(largeChance * 100).toFixed(1)}%`, x + 5, textY);
    }

}
