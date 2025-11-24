import { GameState } from '../interfaces/GameState';
import { Game } from '../core/Game';
import { Ship } from '../actors/Ship';
import { Starfield } from '../core/Starfield';
import { Bullet } from '../actors/Bullet';
import { Input } from '../core/Input';
import { PlayingState } from './PlayingState';
import { SHIP_X_POSITION, UI_HEIGHT } from '../core/Constants';

// Intro-specific constants
const INTRO_CONSTANT_SPEED = 500; // Pixels per second for constant speed entry
const INTRO_DECELERATE_DURATION = 0.5; // Seconds to decelerate linearly to stop at overshoot
const INTRO_START_RETURN_EASE_DURATION = 0.5; // Seconds to ease-in when starting to return (slower)
const INTRO_STOP_FINAL_EASE_DURATION = 0.7; // Seconds to ease-out when stopping at final position (slower)
const INTRO_OVERSHOOT = 200; // Pixels to overshoot beyond normal position
const INTRO_START_X = -100; // Starting x position (off-screen left)

// Context interface for intro phases
interface IntroContext {
    ship: Ship;
    targetX: number;
    overshootX: number;
}

// Base class for intro phases
abstract class IntroPhase {
    protected context: IntroContext;
    protected timer: number = 0;
    protected easeStartX: number = 0;

    constructor(context: IntroContext) {
        this.context = context;
    }

    abstract enter(): void;
    abstract update(deltaTime: number): IntroPhase | null; // Returns next phase or null to stay
    exit(): void { } // Optional exit logic
}

// Phase 1: Constant speed coming in
class ComingInConstantPhase extends IntroPhase {
    enter(): void {
        this.timer = 0;
    }

    update(deltaTime: number): IntroPhase | null {
        // Constant speed coming in
        this.context.ship.x += INTRO_CONSTANT_SPEED * deltaTime;
        
        // When we reach the point where we need to start decelerating to stop at overshoot
        const distanceToOvershoot = this.context.overshootX - this.context.ship.x;
        const distanceNeededToStop = INTRO_CONSTANT_SPEED * INTRO_DECELERATE_DURATION;
        
        if (distanceToOvershoot <= distanceNeededToStop) {
            // Capture actual position when deceleration starts to avoid jumps
            this.easeStartX = this.context.ship.x;
            // Transition to deceleration phase
            return new DeceleratingToOvershootPhase(this.context, this.easeStartX);
        }
        
        return null; // Stay in this phase
    }
}

// Phase 2: Linear deceleration to zero speed at overshoot position
class DeceleratingToOvershootPhase extends IntroPhase {
    constructor(context: IntroContext, easeStartX: number) {
        super(context);
        this.easeStartX = easeStartX;
    }

    enter(): void {
        this.timer = 0;
    }

    update(deltaTime: number): IntroPhase | null {
        this.timer += deltaTime;
        
        if (this.timer >= INTRO_DECELERATE_DURATION) {
            // Reached overshoot position (speed is now zero), immediately start returning
            this.context.ship.x = this.context.overshootX;
            return new StartingReturnPhase(this.context);
        } else {
            // Linear deceleration: speed goes from constant to zero
            // Position: linear interpolation from start position to overshoot
            const t = this.timer / INTRO_DECELERATE_DURATION;
            // Linear interpolation (no easing)
            const remainingDistance = this.context.overshootX - this.easeStartX;
            this.context.ship.x = this.easeStartX + (remainingDistance * t);
        }
        
        return null; // Stay in this phase
    }
}

// Phase 3: Ease-in to start moving back
class StartingReturnPhase extends IntroPhase {
    private easeInDistance: number = 0;

    enter(): void {
        this.timer = 0;
        // Calculate ease-in distance
        const totalReturnDistance = this.context.overshootX - this.context.targetX;
        const totalReturnTime = INTRO_START_RETURN_EASE_DURATION + INTRO_STOP_FINAL_EASE_DURATION;
        const easeInRatio = INTRO_START_RETURN_EASE_DURATION / totalReturnTime;
        this.easeInDistance = totalReturnDistance * easeInRatio;
    }

    update(deltaTime: number): IntroPhase | null {
        this.timer += deltaTime;
        
        if (this.timer >= INTRO_START_RETURN_EASE_DURATION) {
            // Finished easing in, now start easing out to final position
            this.context.ship.x = this.context.overshootX - this.easeInDistance;
            return new StoppingAtFinalPhase(this.context, this.easeInDistance);
        } else {
            // Ease-in to start moving back: speed goes from zero to some speed
            // Position: ease from overshoot position
            const t = this.timer / INTRO_START_RETURN_EASE_DURATION;
            const eased = t * t * t; // Ease-in curve (t^3)
            const distanceMoved = this.easeInDistance * eased;
            this.context.ship.x = this.context.overshootX - distanceMoved;
        }
        
        return null; // Stay in this phase
    }
}

// Phase 4: Ease-out to stop at final position
class StoppingAtFinalPhase extends IntroPhase {
    private easeOutDistance: number;
    private startFinalX: number;

    constructor(context: IntroContext, easeInDistance: number) {
        super(context);
        const totalReturnDistance = context.overshootX - context.targetX;
        this.easeOutDistance = totalReturnDistance - easeInDistance;
        this.startFinalX = context.overshootX - easeInDistance;
    }

    enter(): void {
        this.timer = 0;
    }

    update(deltaTime: number): IntroPhase | null {
        this.timer += deltaTime;
        
        if (this.timer >= INTRO_STOP_FINAL_EASE_DURATION) {
            // Stopped at final position (speed is now zero)
            this.context.ship.x = this.context.targetX;
            return new CompletePhase(this.context);
        } else {
            // Ease-out to stop: speed goes from some speed to zero
            // Position: ease from startFinalX to targetX
            const t = this.timer / INTRO_STOP_FINAL_EASE_DURATION;
            const eased = 1 - Math.pow(1 - t, 3); // Ease-out curve
            this.context.ship.x = this.startFinalX - (this.easeOutDistance * eased);
        }
        
        return null; // Stay in this phase
    }
}

// Phase 5: Intro complete
class CompletePhase extends IntroPhase {
    enter(): void {
        // Intro is complete, this phase just marks completion
    }

    update(_deltaTime: number): IntroPhase | null {
        // This phase never transitions, IntroState handles completion
        return null;
    }
}

export class IntroState implements GameState {
    input: Input;
    starfield: Starfield;
    ship: Ship;
    bullets: Bullet[];
    private currentPhase: IntroPhase;
    private context: IntroContext;

    constructor(input: Input) {
        this.input = input;
        this.starfield = new Starfield();
        this.bullets = [];
        this.ship = new Ship(this.input, this.bullets);
        
        // Create context for phases
        this.context = {
            ship: this.ship,
            targetX: SHIP_X_POSITION,
            overshootX: SHIP_X_POSITION + INTRO_OVERSHOOT
        };
        
        // Start with first phase
        this.currentPhase = new ComingInConstantPhase(this.context);
    }

    enter(_game: Game): void {
        this.ship.visible = true;
        this.ship.controllable = false;
        this.ship.x = INTRO_START_X; // Start off-screen to the left
        
        // Reset to first phase
        this.currentPhase = new ComingInConstantPhase(this.context);
        this.currentPhase.enter();
        
        // Clear input keys to prevent immediate shooting when Space is used to start the game
        this.input.clearKeys();
    }

    update(game: Game, deltaTime: number): void {
        this.starfield.update(deltaTime);
        this.ship.update(deltaTime);

        // Update current phase
        const nextPhase = this.currentPhase.update(deltaTime);
        
        if (nextPhase !== null) {
            // Transition to next phase
            this.currentPhase.exit();
            this.currentPhase = nextPhase;
            this.currentPhase.enter();
        }

        // Check if intro is complete
        if (this.currentPhase instanceof CompletePhase) {
            // Intro complete, transition to PlayingState
            const playingState = new PlayingState(this.input);
            // Transfer entities to playing state
            playingState.ship = this.ship;
            playingState.starfield = this.starfield;
            playingState.bullets = this.bullets;
            playingState.ship.controllable = true;
            // Start asteroid timer (PlayingState will set it in enter())
            game.changeState(playingState);
        }
    }

    draw(_game: Game, ctx: CanvasRenderingContext2D): void {
        // Draw UI area background (same as gameplay)
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, ctx.canvas.width, UI_HEIGHT);
        
        // Translate to gameplay area (same as gameplay)
        ctx.save();
        ctx.translate(0, UI_HEIGHT);
        
        // Draw gameplay elements
        this.starfield.draw(ctx);
        this.bullets.forEach(b => b.draw(ctx));
        this.ship.draw(ctx);
        
        ctx.restore();
    }

    exit(_game: Game): void { }
}
