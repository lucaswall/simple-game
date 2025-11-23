import { GameState } from '../interfaces/GameState';
import { Game } from '../Game';
import { Ship } from '../Ship';
import { Starfield } from '../Starfield';
import { Bullet } from '../Bullet';
import { Input } from '../Input';
import { PlayingState } from './PlayingState';
import { SHIP_X_POSITION, SHIP_INTRO_CONSTANT_SPEED, SHIP_INTRO_DECELERATE_DURATION, SHIP_INTRO_START_RETURN_EASE_DURATION, SHIP_INTRO_STOP_FINAL_EASE_DURATION, SHIP_INTRO_OVERSHOOT, SHIP_INTRO_START_X, ASTEROID_SPAWN_INTERVAL } from '../Constants';

enum IntroPhase {
    ComingInConstant,      // Constant speed coming in
    DeceleratingToOvershoot,  // Linear deceleration to zero speed at overshoot position
    StartingReturn,        // Ease-in to start moving back
    StoppingAtFinal,       // Ease-out to stop at final position
    Complete
}

export class IntroState implements GameState {
    input: Input;
    starfield: Starfield;
    ship: Ship;
    bullets: Bullet[];
    private phase: IntroPhase = IntroPhase.ComingInConstant;
    private timer: number = 0;
    private easeStartX: number = 0;

    constructor(input: Input) {
        this.input = input;
        this.starfield = new Starfield();
        this.bullets = [];
        this.ship = new Ship(this.input, this.bullets);
    }

    enter(_game: Game): void {
        this.ship.visible = true;
        this.ship.controllable = false;
        this.ship.x = SHIP_INTRO_START_X; // Start off-screen to the left
        this.phase = IntroPhase.ComingInConstant;
        this.timer = 0;
        // Clear input keys to prevent immediate shooting when Space is used to start the game
        this.input.clearKeys();
    }

    update(game: Game, deltaTime: number): void {
        this.starfield.update(deltaTime);
        this.ship.update(deltaTime);

        // Update intro animation
        if (this.phase !== IntroPhase.Complete) {
            this.updateIntro(deltaTime);
        } else {
            // Intro complete, transition to PlayingState
            const playingState = new PlayingState(this.input);
            // Transfer entities to playing state
            playingState.ship = this.ship;
            playingState.starfield = this.starfield;
            playingState.bullets = this.bullets;
            playingState.ship.controllable = true;
            // Start asteroid timer
            playingState.asteroidTimer = ASTEROID_SPAWN_INTERVAL;
            game.changeState(playingState);
        }
    }

    draw(_game: Game, ctx: CanvasRenderingContext2D): void {
        this.starfield.draw(ctx);
        this.bullets.forEach(b => b.draw(ctx));
        this.ship.draw(ctx);
    }

    exit(_game: Game): void { }

    private updateIntro(deltaTime: number): void {
        const targetX = SHIP_X_POSITION;
        const overshootX = targetX + SHIP_INTRO_OVERSHOOT;

        switch (this.phase) {
            case IntroPhase.ComingInConstant:
                // Constant speed coming in
                this.ship.x += SHIP_INTRO_CONSTANT_SPEED * deltaTime;
                
                // When we reach the point where we need to start decelerating to stop at overshoot
                const distanceToOvershoot = overshootX - this.ship.x;
                const distanceNeededToStop = SHIP_INTRO_CONSTANT_SPEED * SHIP_INTRO_DECELERATE_DURATION;
                
                if (distanceToOvershoot <= distanceNeededToStop) {
                    // Capture actual position when deceleration starts to avoid jumps
                    this.easeStartX = this.ship.x;
                    // Start linear deceleration to stop at overshoot
                    this.phase = IntroPhase.DeceleratingToOvershoot;
                    this.timer = 0;
                }
                break;

            case IntroPhase.DeceleratingToOvershoot:
                this.timer += deltaTime;
                
                if (this.timer >= SHIP_INTRO_DECELERATE_DURATION) {
                    // Reached overshoot position (speed is now zero), immediately start returning
                    this.ship.x = overshootX;
                    this.phase = IntroPhase.StartingReturn;
                    this.timer = 0;
                } else {
                    // Linear deceleration: speed goes from constant to zero
                    // Position: linear interpolation from start position to overshoot
                    const t = this.timer / SHIP_INTRO_DECELERATE_DURATION;
                    // Linear interpolation (no easing)
                    const remainingDistance = overshootX - this.easeStartX;
                    this.ship.x = this.easeStartX + (remainingDistance * t);
                }
                break;

            case IntroPhase.StartingReturn:
                this.timer += deltaTime;
                
                if (this.timer >= SHIP_INTRO_START_RETURN_EASE_DURATION) {
                    // Finished easing in, now start easing out to final position
                    // Calculate how far we moved during ease-in
                    const totalReturnDistance = overshootX - targetX;
                    // During ease-in, we cover distance proportional to the duration ratio
                    const totalReturnTime = SHIP_INTRO_START_RETURN_EASE_DURATION + SHIP_INTRO_STOP_FINAL_EASE_DURATION;
                    const easeInRatio = SHIP_INTRO_START_RETURN_EASE_DURATION / totalReturnTime;
                    const easeInDistance = totalReturnDistance * easeInRatio;
                    this.ship.x = overshootX - easeInDistance;
                    this.phase = IntroPhase.StoppingAtFinal;
                    this.timer = 0;
                } else {
                    // Ease-in to start moving back: speed goes from zero to some speed
                    // Position: ease from overshoot position
                    const t = this.timer / SHIP_INTRO_START_RETURN_EASE_DURATION;
                    const eased = t * t * t; // Ease-in curve (t^3)
                    const totalReturnDistance = overshootX - targetX;
                    const totalReturnTime = SHIP_INTRO_START_RETURN_EASE_DURATION + SHIP_INTRO_STOP_FINAL_EASE_DURATION;
                    const easeInRatio = SHIP_INTRO_START_RETURN_EASE_DURATION / totalReturnTime;
                    const easeInDistance = totalReturnDistance * easeInRatio;
                    const distanceMoved = easeInDistance * eased;
                    this.ship.x = overshootX - distanceMoved;
                }
                break;

            case IntroPhase.StoppingAtFinal:
                this.timer += deltaTime;
                
                const totalReturnDistance = overshootX - targetX;
                const totalReturnTime = SHIP_INTRO_START_RETURN_EASE_DURATION + SHIP_INTRO_STOP_FINAL_EASE_DURATION;
                const easeInRatio = SHIP_INTRO_START_RETURN_EASE_DURATION / totalReturnTime;
                const easeInDistance = totalReturnDistance * easeInRatio;
                const easeOutDistance = totalReturnDistance - easeInDistance;
                const startFinalX = overshootX - easeInDistance;
                
                if (this.timer >= SHIP_INTRO_STOP_FINAL_EASE_DURATION) {
                    // Stopped at final position (speed is now zero)
                    this.ship.x = targetX;
                    this.phase = IntroPhase.Complete;
                } else {
                    // Ease-out to stop: speed goes from some speed to zero
                    // Position: ease from startFinalX to targetX
                    const t = this.timer / SHIP_INTRO_STOP_FINAL_EASE_DURATION;
                    const eased = 1 - Math.pow(1 - t, 3); // Ease-out curve
                    this.ship.x = startFinalX - (easeOutDistance * eased);
                }
                break;
        }
    }
}

