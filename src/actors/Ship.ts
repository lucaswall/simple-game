import { Collidable, CollisionBounds, CollisionContext } from '../interfaces/Collidable';
import { Input } from '../core/Input';
import { Bullet } from './Bullet';
import { Asteroid } from './Asteroid';
import { SHIP_SIZE, SHIP_X_POSITION, SHIP_BACK_X_POSITION } from '../core/Constants';
import { SHIP_SPEED, SHIP_FIRE_RATE_MS, BULLET_SPEED, BULLET_SIZE, PLAY_AREA_HEIGHT, SHIP_COLLISION_X, SHIP_COLLISION_RADIUS, HIT_FREEZE_DURATION, SHAKE_INTENSITY_SHIP_HIT } from '../states/PlayingState';

export class Ship implements Collidable {
    x: number = SHIP_X_POSITION;
    y: number = PLAY_AREA_HEIGHT / 2;
    private input: Input;
    private bullets: Bullet[];
    private lastShotTime: number = 0;
    visible: boolean = true;
    controllable: boolean = true;
    collisionEnabled: boolean = true;

    constructor(input: Input, bullets: Bullet[]) {
        this.input = input;
        this.bullets = bullets;
    }

    update(deltaTime: number): void {
        if (!this.visible) return;

        if (this.controllable) {
            if (this.input.keys.ArrowUp) {
                this.y -= SHIP_SPEED * deltaTime;
            }
            if (this.input.keys.ArrowDown) {
                this.y += SHIP_SPEED * deltaTime;
            }

            // Clamp position to gameplay area
            this.y = Math.max(SHIP_SIZE, Math.min(PLAY_AREA_HEIGHT - SHIP_SIZE, this.y));

            // Shooting
            if (this.input.keys.Space) {
                const now = performance.now();
                if (now - this.lastShotTime > SHIP_FIRE_RATE_MS) {
                    this.bullets.push(new Bullet(this.x, this.y, BULLET_SPEED, BULLET_SIZE));
                    this.lastShotTime = now;
                }
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (!this.visible) return;

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y); // Nose
        ctx.lineTo(this.x - (SHIP_X_POSITION - SHIP_BACK_X_POSITION), this.y - SHIP_SIZE / 2); // Top back
        ctx.lineTo(this.x - (SHIP_X_POSITION - SHIP_BACK_X_POSITION), this.y + SHIP_SIZE / 2); // Bottom back
        ctx.closePath();
        ctx.fill();
    }

    getCollisionBounds(): CollisionBounds {
        return {
            type: 'circle',
            centerX: this.x - (SHIP_X_POSITION - SHIP_COLLISION_X),
            centerY: this.y,
            radius: SHIP_COLLISION_RADIUS
        };
    }

    canCollideWith(other: Collidable): boolean {
        return this.collisionEnabled && 
               this.visible && 
               other instanceof Asteroid;
    }

    onCollision(other: Collidable, context: CollisionContext): void {
        if (other instanceof Asteroid) {
            // Disable collisions to prevent repeated collision detection
            this.collisionEnabled = false;
            context.game.shakeIntensity = SHAKE_INTENSITY_SHIP_HIT;
            context.game.startFreeze(HIT_FREEZE_DURATION, () => {
                if (context.onShipDestroyed) {
                    context.onShipDestroyed();
                }
            });
        }
    }
}

