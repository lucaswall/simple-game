import { Actor } from './interfaces/Actor';
import { GAME_WIDTH, GAME_HEIGHT, ASTEROID_MIN_SPEED, ASTEROID_MAX_SPEED } from './Constants';

export class Asteroid implements Actor {
    x: number;
    y: number;
    size: number;
    speed: number;
    vertices: { x: number; y: number }[] = [];
    active: boolean = true;

    constructor() {
        this.x = GAME_WIDTH;
        this.y = Math.random() * (GAME_HEIGHT - 40) + 20;
        this.size = Math.random() * 15 + 15;
        this.speed = Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED) + ASTEROID_MIN_SPEED;

        const vertexCount = Math.floor(Math.random() * 5) + 5;
        for (let i = 0; i < vertexCount; i++) {
            const angle = (i / vertexCount) * Math.PI * 2;
            const radius = this.size * (0.5 + Math.random() * 0.5);
            this.vertices.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
    }

    update(deltaTime: number): void {
        this.x -= this.speed * deltaTime;
        if (this.x + this.size < 0) {
            this.active = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#888';
        ctx.beginPath();
        if (this.vertices.length > 0) {
            ctx.moveTo(this.x + this.vertices[0].x, this.y + this.vertices[0].y);
            for (let i = 1; i < this.vertices.length; i++) {
                ctx.lineTo(this.x + this.vertices[i].x, this.y + this.vertices[i].y);
            }
        }
        ctx.closePath();
        ctx.fill();
    }
}
