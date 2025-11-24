import { Collidable, CollisionBounds, CollisionContext } from '../interfaces/Collidable';
import { GAME_WIDTH } from '../core/Constants';
import { Bullet } from './Bullet';
import { Ship } from './Ship';
import { ASTEROID_MIN_SPEED, ASTEROID_MAX_SPEED, ASTEROID_SPAWN_Y_MARGIN, ASTEROID_SPAWN_Y_OFFSET, ASTEROID_MIN_SIZE, ASTEROID_MAX_SIZE, ASTEROID_MIN_VERTICES, ASTEROID_MAX_VERTICES, ASTEROID_RADIUS_MIN_FACTOR, ASTEROID_RADIUS_MAX_FACTOR, ASTEROID_COLOR, PLAY_AREA_HEIGHT, SHAKE_INTENSITY_ASTEROID_HIT, ASTEROID_HIT_FREEZE_DURATION } from '../states/PlayingState';

export class Asteroid implements Collidable {
    x: number;
    y: number;
    size: number;
    speed: number;
    vertices: { x: number; y: number }[] = [];
    active: boolean = true;
    collisionEnabled: boolean = true;

    constructor() {
        this.x = GAME_WIDTH;
        this.y = Math.random() * (PLAY_AREA_HEIGHT - ASTEROID_SPAWN_Y_MARGIN) + ASTEROID_SPAWN_Y_OFFSET;
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
               (other instanceof Ship || other instanceof Bullet);
    }

    onCollision(other: Collidable, context: CollisionContext): void {
        if (other instanceof Bullet) {
            // Mark asteroid as inactive
            this.active = false;
            this.collisionEnabled = false;
            
            // Create explosion effect
            context.particleManager.createExplosion(this.x, this.y, ASTEROID_COLOR);
            
            // Mark bullet as inactive (it will be removed by its own logic)
            (other as Bullet).active = false;
            
            // Notify context about asteroid destruction
            if (context.onAsteroidDestroyed) {
                context.onAsteroidDestroyed(this);
            }
            
            // Apply screen shake and freeze
            context.game.shakeIntensity = SHAKE_INTENSITY_ASTEROID_HIT;
            context.game.startFreeze(ASTEROID_HIT_FREEZE_DURATION, () => {
                // Freeze just provides visual feedback
            });
        }
        // Ship collision is handled by Ship.onCollision
    }
}

