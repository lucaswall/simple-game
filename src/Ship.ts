import { Actor } from './interfaces/Actor';
import { Input } from './Input';
import { Bullet } from './Bullet';
import { SHIP_SIZE, SHIP_X_POSITION, SHIP_BACK_X_POSITION } from './Constants';
import { SHIP_SPEED, SHIP_FIRE_RATE_MS, BULLET_SPEED, BULLET_SIZE, PLAY_AREA_HEIGHT } from './states/PlayingState';

export class Ship implements Actor {
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
}
