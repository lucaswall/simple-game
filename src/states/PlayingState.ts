import { GameState } from '../interfaces/GameState';
import { Game } from '../Game';
import { Asteroid } from '../Asteroid';
import { Ship } from '../Ship';
import { Bullet } from '../Bullet';
import { Starfield } from '../Starfield';
import { ParticleManager } from '../ParticleManager';
import { Input } from '../Input';
import { ASTEROID_SPAWN_INTERVAL, HIT_FREEZE_DURATION, SHIP_COLLISION_X, SHIP_COLLISION_RADIUS, SHAKE_INTENSITY_SHIP_HIT, SHAKE_INTENSITY_ASTEROID_HIT, ASTEROID_HIT_FREEZE_DURATION, ASTEROID_COLOR, EXPLOSION_DURATION, EXPLOSION_TIME_SCALE, SHIP_X_POSITION, SHIP_INTRO_CONSTANT_SPEED, SHIP_INTRO_DECELERATE_DURATION, SHIP_INTRO_START_RETURN_EASE_DURATION, SHIP_INTRO_STOP_FINAL_EASE_DURATION, SHIP_INTRO_OVERSHOOT, SHIP_INTRO_START_X } from '../Constants';
import { MainMenuState } from './MainMenuState';

enum IntroState {
    ComingInConstant,      // Constant speed coming in
    DeceleratingToOvershoot,  // Linear deceleration to zero speed at overshoot position
    StartingReturn,        // Ease-in to start moving back
    StoppingAtFinal,       // Ease-out to stop at final position
    Complete
}

export class PlayingState implements GameState {
    input: Input;
    starfield: Starfield;
    ship: Ship;
    asteroids: Asteroid[] = [];
    bullets: Bullet[] = [];
    particleManager: ParticleManager;
    asteroidTimer: number = 0;
    private explosionTimer: number = 0;
    private introState: IntroState = IntroState.ComingInConstant;
    private introTimer: number = 0; // Timer for intro animation phases
    private easeStartX: number = 0; // Actual position when easing starts

    constructor(input: Input) {
        this.input = input;
        this.starfield = new Starfield();
        this.bullets = [];
        this.ship = new Ship(this.input, this.bullets);
        this.particleManager = new ParticleManager();
    }

    enter(_game: Game): void {
        this.ship.visible = true;
        this.ship.controllable = false;
        this.ship.x = SHIP_INTRO_START_X; // Start off-screen to the left
        this.introState = IntroState.ComingInConstant;
        this.introTimer = 0;
        // Clear input keys to prevent immediate shooting when Space is used to start the game
        this.input.clearKeys();
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

        // Handle intro sequence
        if (this.introState !== IntroState.Complete) {
            this.updateIntro(deltaTime);
            this.starfield.update(deltaTime);
            this.ship.update(deltaTime);
            this.updateBullets(deltaTime);
            // Don't spawn asteroids during intro
            this.updateAsteroids(deltaTime); // Still update existing asteroids
            this.particleManager.update(deltaTime);
            return; // Skip collisions during intro
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

    private updateIntro(deltaTime: number): void {
        const targetX = SHIP_X_POSITION;
        const overshootX = targetX + SHIP_INTRO_OVERSHOOT;

        switch (this.introState) {
            case IntroState.ComingInConstant:
                // Constant speed coming in
                this.ship.x += SHIP_INTRO_CONSTANT_SPEED * deltaTime;
                
                // When we reach the point where we need to start decelerating to stop at overshoot
                const distanceToOvershoot = overshootX - this.ship.x;
                const distanceNeededToStop = SHIP_INTRO_CONSTANT_SPEED * SHIP_INTRO_DECELERATE_DURATION;
                
                if (distanceToOvershoot <= distanceNeededToStop) {
                    // Capture actual position when deceleration starts to avoid jumps
                    this.easeStartX = this.ship.x;
                    // Start linear deceleration to stop at overshoot
                    this.introState = IntroState.DeceleratingToOvershoot;
                    this.introTimer = 0;
                }
                break;

            case IntroState.DeceleratingToOvershoot:
                this.introTimer += deltaTime;
                
                if (this.introTimer >= SHIP_INTRO_DECELERATE_DURATION) {
                    // Reached overshoot position (speed is now zero), immediately start returning
                    this.ship.x = overshootX;
                    this.introState = IntroState.StartingReturn;
                    this.introTimer = 0;
                } else {
                    // Linear deceleration: speed goes from constant to zero
                    // Position: linear interpolation from start position to overshoot
                    const t = this.introTimer / SHIP_INTRO_DECELERATE_DURATION;
                    // Linear interpolation (no easing)
                    const remainingDistance = overshootX - this.easeStartX;
                    this.ship.x = this.easeStartX + (remainingDistance * t);
                }
                break;

            case IntroState.StartingReturn:
                this.introTimer += deltaTime;
                
                if (this.introTimer >= SHIP_INTRO_START_RETURN_EASE_DURATION) {
                    // Finished easing in, now start easing out to final position
                    // Calculate how far we moved during ease-in
                    const totalReturnDistance = overshootX - targetX;
                    // During ease-in, we cover distance proportional to the duration ratio
                    const totalReturnTime = SHIP_INTRO_START_RETURN_EASE_DURATION + SHIP_INTRO_STOP_FINAL_EASE_DURATION;
                    const easeInRatio = SHIP_INTRO_START_RETURN_EASE_DURATION / totalReturnTime;
                    const easeInDistance = totalReturnDistance * easeInRatio;
                    this.ship.x = overshootX - easeInDistance;
                    this.introState = IntroState.StoppingAtFinal;
                    this.introTimer = 0;
                } else {
                    // Ease-in to start moving back: speed goes from zero to some speed
                    // Position: ease from overshoot position
                    const t = this.introTimer / SHIP_INTRO_START_RETURN_EASE_DURATION;
                    const eased = t * t * t; // Ease-in curve (t^3)
                    const totalReturnDistance = overshootX - targetX;
                    const totalReturnTime = SHIP_INTRO_START_RETURN_EASE_DURATION + SHIP_INTRO_STOP_FINAL_EASE_DURATION;
                    const easeInRatio = SHIP_INTRO_START_RETURN_EASE_DURATION / totalReturnTime;
                    const easeInDistance = totalReturnDistance * easeInRatio;
                    const distanceMoved = easeInDistance * eased;
                    this.ship.x = overshootX - distanceMoved;
                }
                break;

            case IntroState.StoppingAtFinal:
                this.introTimer += deltaTime;
                
                const totalReturnDistance = overshootX - targetX;
                const totalReturnTime = SHIP_INTRO_START_RETURN_EASE_DURATION + SHIP_INTRO_STOP_FINAL_EASE_DURATION;
                const easeInRatio = SHIP_INTRO_START_RETURN_EASE_DURATION / totalReturnTime;
                const easeInDistance = totalReturnDistance * easeInRatio;
                const easeOutDistance = totalReturnDistance - easeInDistance;
                const startFinalX = overshootX - easeInDistance;
                
                if (this.introTimer >= SHIP_INTRO_STOP_FINAL_EASE_DURATION) {
                    // Stopped at final position (speed is now zero)
                    this.ship.x = targetX;
                    this.introState = IntroState.Complete;
                    this.ship.controllable = true;
                    // Start asteroid timer when intro completes
                    this.asteroidTimer = ASTEROID_SPAWN_INTERVAL;
                } else {
                    // Ease-out to stop: speed goes from some speed to zero
                    // Position: ease from startFinalX to targetX
                    const t = this.introTimer / SHIP_INTRO_STOP_FINAL_EASE_DURATION;
                    const eased = 1 - Math.pow(1 - t, 3); // Ease-out curve
                    this.ship.x = startFinalX - (easeOutDistance * eased);
                }
                break;
        }
    }

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
        // Only spawn asteroids after intro is complete
        if (this.introState === IntroState.Complete) {
            this.asteroidTimer -= deltaTime;
            if (this.asteroidTimer <= 0) {
                this.asteroids.push(new Asteroid());
                this.asteroidTimer = ASTEROID_SPAWN_INTERVAL;
            }
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
