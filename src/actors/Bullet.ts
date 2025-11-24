import { Collidable, CollisionBounds, CollisionContext } from '../interfaces/Collidable';
import { Asteroid } from './Asteroid';
import { GAME_WIDTH } from '../core/Constants';

export class Bullet implements Collidable {
    x: number;
    y: number;
    speed: number;
    size: number;
    active: boolean = true;
    collisionEnabled: boolean = true;

    constructor(x: number, y: number, speed: number, size: number) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.size = size;
    }

    update(deltaTime: number): void {
        this.x += this.speed * deltaTime;
        if (this.x > GAME_WIDTH) {
            this.active = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    getCollisionBounds(): CollisionBounds {
        return {
            type: 'circle',
            centerX: this.x,
            centerY: this.y,
            radius: this.size
        };
    }

    canCollideWith(other: Collidable): boolean {
        return this.active && 
               this.collisionEnabled && 
               other instanceof Asteroid;
    }

    onCollision(other: Collidable, _context: CollisionContext): void {
        if (other instanceof Asteroid) {
            // Bullet collision is handled by Asteroid.onCollision
            // Just mark bullet as inactive
            this.active = false;
        }
    }
}

