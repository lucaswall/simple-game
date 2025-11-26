import { GameState } from '../interfaces/GameState';
import { Game } from '../core/Game';
import { Ship } from '../actors/Ship';
import { Starfield } from '../core/Starfield';
import { Bullet } from '../actors/Bullet';
import { Input } from '../core/Input';
import { PlayingState, PLAY_AREA_HEIGHT } from './PlayingState';
import { GAME_WIDTH, SHIP_X_POSITION, UI_HEIGHT } from '../core/Constants';

const INTRO_START_X = -100;
const INTRO_DELAY = 2; // Seconds before the ship begins its entrance
const INTRO_DURATION = 2.3; // Seconds for the full single-curve animation
const INTRO_SETTLE_PAUSE = 0.25; // Seconds to pause after settling before handing control
const MIN_OVERSHOOT = 170; // Minimum overshoot distance in pixels
const MAX_OVERSHOOT = 340; // Maximum overshoot distance in pixels
const OVERSHOOT_RATIO = 0.18; // Overshoot distance as a fraction of canvas width
const INTRO_STARFIELD_BOOST = 2.2; // Faster parallax while the ship is staged off-screen

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

// Single parametric curve: smooth forward motion with a soft elastic overshoot that damps to 1
function introCurve(t: number, overshootFactor: number): number {
    // Base easing keeps acceleration smooth in and out
    const base = easeOutCubic(t);

    // Overshoot term blooms mid-journey then fades to zero by the end
    const overshoot = Math.sin(Math.PI * t) * (1 - t) * 2; // Peak at t=0.5, zero at ends

    // Blend both for a single continuous motion profile
    return base + overshoot * overshootFactor;
}

export class IntroState implements GameState {
    input: Input;
    starfield: Starfield;
    ship: Ship;
    bullets: Bullet[];

    private timer = 0;
    private settleTimer = 0;
    private introDelayTimer = 0;
    private overshootDistance = MIN_OVERSHOOT;
    private isSettled = false;
    private previousX = INTRO_START_X;

    constructor(input: Input) {
        this.input = input;
        this.starfield = new Starfield();
        this.bullets = [];
        this.ship = new Ship(this.input, this.bullets);
    }

    private resetIntro(ctx?: CanvasRenderingContext2D): void {
        const canvasWidth = ctx?.canvas?.width ?? GAME_WIDTH;

        const dynamicOvershoot = canvasWidth * OVERSHOOT_RATIO;
        this.overshootDistance = Math.min(MAX_OVERSHOOT, Math.max(MIN_OVERSHOOT, dynamicOvershoot));

        this.timer = 0;
        this.settleTimer = 0;
        this.introDelayTimer = 0;
        this.isSettled = false;
        this.previousX = INTRO_START_X;

        this.ship.visible = true;
        this.ship.controllable = false;
        this.ship.x = INTRO_START_X;
        this.ship.y = PLAY_AREA_HEIGHT / 2; // Center vertically in play area
        this.ship.setPropulsionIntensity(1.2);

        this.starfield.setSpeedMultiplier(INTRO_STARFIELD_BOOST);

        // Clear input keys to prevent immediate shooting when Space is used to start the game
        this.input.clearKeys();
    }

    enter(game: Game): void {
        this.resetIntro(game.ctx);
    }

    update(game: Game, deltaTime: number): void {
        this.starfield.update(deltaTime);
        this.ship.update(deltaTime);

        // Advance intro timer until settled
        if (!this.isSettled) {
            if (this.introDelayTimer < INTRO_DELAY) {
                this.introDelayTimer = Math.min(INTRO_DELAY, this.introDelayTimer + deltaTime);
                this.ship.x = INTRO_START_X;
                this.ship.setPropulsionIntensity(1.2);
                this.starfield.setSpeedMultiplier(INTRO_STARFIELD_BOOST);
                return;
            }

            this.timer = Math.min(INTRO_DURATION, this.timer + deltaTime);
            const t = this.timer / INTRO_DURATION;

            const travelDistance = SHIP_X_POSITION - INTRO_START_X;
            const overshootFactor = (this.overshootDistance / Math.max(travelDistance, 1)) * 1.2;
            const curveValue = introCurve(t, overshootFactor);
            const newX = INTRO_START_X + travelDistance * curveValue;

            const velocityX = (newX - this.previousX) / Math.max(deltaTime, 0.0001);
            this.previousX = newX;
            this.ship.x = newX;

            // Boost thruster particles while moving quickly, easing back near settle
            const thrustIntensity = 1 + Math.min(1.2, Math.abs(velocityX) / 280);
            this.ship.setPropulsionIntensity(thrustIntensity);

            // Background parallax speeds up with forward motion and during the overshoot,
            // then eases back to normal as the ship slides into position
            const forwardMomentum = Math.max(0, velocityX);
            const returnMomentum = Math.max(0, -velocityX);
            const parallaxBoost = 1 + Math.min(1.8, forwardMomentum / 200);
            const settleBlend = Math.max(0, 1 - Math.min(1, returnMomentum / 280));
            this.starfield.setSpeedMultiplier(1 + (parallaxBoost - 1) * settleBlend);

            if (this.timer >= INTRO_DURATION) {
                this.isSettled = true;
                this.ship.x = SHIP_X_POSITION;
                this.ship.y = PLAY_AREA_HEIGHT / 2;
                this.ship.setPropulsionIntensity(1);
                this.starfield.setSpeedMultiplier(1);
            }
        } else {
            this.settleTimer += deltaTime;
            // Gentle drift back to normal propulsion
            this.ship.setPropulsionIntensity(1);
            this.starfield.setSpeedMultiplier(1);

            if (this.settleTimer >= INTRO_SETTLE_PAUSE) {
                const playingState = new PlayingState(this.input);
                playingState.ship = this.ship;
                playingState.starfield = this.starfield;
                playingState.bullets = this.bullets;
                playingState.ship.controllable = true;
                game.changeState(playingState);
            }
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
