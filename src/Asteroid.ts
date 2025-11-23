import { Actor } from './interfaces/Actor';
import { GAME_WIDTH, GAME_HEIGHT } from './Constants';
import { ASTEROID_MIN_SPEED, ASTEROID_MAX_SPEED, ASTEROID_SPAWN_Y_MARGIN, ASTEROID_SPAWN_Y_OFFSET, ASTEROID_MIN_SIZE, ASTEROID_MAX_SIZE, ASTEROID_MIN_VERTICES, ASTEROID_MAX_VERTICES, ASTEROID_RADIUS_MIN_FACTOR, ASTEROID_RADIUS_MAX_FACTOR, ASTEROID_COLOR } from './states/PlayingState';

export class Asteroid implements Actor {
    x: number;
    y: number;
    size: number;
    speed: number;
    vertices: { x: number; y: number }[] = [];
    active: boolean = true;
    hasCollidedWithShip: boolean = false;

    constructor() {
        this.x = GAME_WIDTH;
        this.y = Math.random() * (GAME_HEIGHT - ASTEROID_SPAWN_Y_MARGIN) + ASTEROID_SPAWN_Y_OFFSET;
        this.size = Math.random() * (ASTEROID_MAX_SIZE - ASTEROID_MIN_SIZE) + ASTEROID_MIN_SIZE;
        this.speed = Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED) + ASTEROID_MIN_SPEED;

        const vertexCount = Math.floor(Math.random() * (ASTEROID_MAX_VERTICES - ASTEROID_MIN_VERTICES)) + ASTEROID_MIN_VERTICES;
        for (let i = 0; i < vertexCount; i++) {
            const angle = (i / vertexCount) * Math.PI * 2;
            const radius = this.size * (ASTEROID_RADIUS_MIN_FACTOR + Math.random() * (ASTEROID_RADIUS_MAX_FACTOR - ASTEROID_RADIUS_MIN_FACTOR));
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
        ctx.fillStyle = ASTEROID_COLOR;
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
