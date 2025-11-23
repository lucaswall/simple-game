import { Actor } from './interfaces/Actor';
import { Input } from './Input';
import { Bullet } from './Bullet';
import { GAME_HEIGHT, SHIP_SPEED, SHIP_SIZE } from './Constants';

export class Ship implements Actor {
    y: number = GAME_HEIGHT / 2;
    private input: Input;
    private bullets: Bullet[];
    private lastShotTime: number = 0;
    visible: boolean = true;

    constructor(input: Input, bullets: Bullet[]) {
        this.input = input;
        this.bullets = bullets;
    }

    update(deltaTime: number): void {
        if (!this.visible) return;

        if (this.input.keys.ArrowUp) {
            this.y -= SHIP_SPEED * deltaTime;
        }
        if (this.input.keys.ArrowDown) {
            this.y += SHIP_SPEED * deltaTime;
        }

        // Clamp position
        this.y = Math.max(SHIP_SIZE, Math.min(GAME_HEIGHT - SHIP_SIZE, this.y));

        // Shooting
        if (this.input.keys.Space) {
            const now = performance.now();
            if (now - this.lastShotTime > 250) {
                this.bullets.push(new Bullet(100, this.y, 800, 5));
                this.lastShotTime = now;
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (!this.visible) return;

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(100, this.y); // Nose
        ctx.lineTo(50, this.y - SHIP_SIZE / 2); // Top back
        ctx.lineTo(50, this.y + SHIP_SIZE / 2); // Bottom back
        ctx.closePath();
        ctx.fill();
    }
}
