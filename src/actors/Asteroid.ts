import { Collidable, CollisionBounds, CollisionContext } from '../interfaces/Collidable';
import { GAME_WIDTH } from '../core/Constants';
import { Bullet } from './Bullet';
import { Ship } from './Ship';
import { ASTEROID_MIN_SPEED, ASTEROID_MAX_SPEED, ASTEROID_SPAWN_Y_MARGIN, ASTEROID_SPAWN_Y_OFFSET, ASTEROID_MIN_VERTICES, ASTEROID_MAX_VERTICES, ASTEROID_RADIUS_MIN_FACTOR, ASTEROID_RADIUS_MAX_FACTOR, ASTEROID_COLOR, PLAY_AREA_HEIGHT, SHAKE_INTENSITY_ASTEROID_HIT, ASTEROID_HIT_FREEZE_DURATION, ASTEROID_LARGE_SIZE, ASTEROID_MEDIUM_SIZE, ASTEROID_SMALL_SIZE, ASTEROID_LARGE_SPLIT_ANGLE_MIN, ASTEROID_LARGE_SPLIT_ANGLE_MAX, ASTEROID_MEDIUM_SPLIT_ANGLE_MIN, ASTEROID_MEDIUM_SPLIT_ANGLE_MAX, ASTEROID_FLASH_INTERVAL, ASTEROID_EXPLOSION_RADIUS_SMALL, ASTEROID_EXPLOSION_RADIUS_MEDIUM, ASTEROID_EXPLOSION_RADIUS_LARGE } from '../states/PlayingState';

export enum AsteroidSize {
    SMALL = 'small',
    MEDIUM = 'medium',
    LARGE = 'large'
}

export class Asteroid implements Collidable {
    x: number;
    y: number;
    size: number;
    speed: number;
    velocityX: number; // Horizontal velocity component
    velocityY: number; // Vertical velocity component
    asteroidSize: AsteroidSize;
    vertices: { x: number; y: number }[] = [];
    active: boolean = true;
    collisionEnabled: boolean = true;
    isExploding: boolean = false; // Whether this asteroid explodes when hit
    private flashTimer: number = 0; // Timer for red flashing effect

    constructor(x?: number, y?: number, sizeType?: AsteroidSize, velocityX?: number, velocityY?: number, largeRatio: number = 0.1, angleOffsetDegrees?: number, isExploding: boolean = false) {
        // Default constructor creates a random size asteroid at spawn position
        if (x === undefined || y === undefined || sizeType === undefined) {
            this.x = GAME_WIDTH;
            this.y = Math.random() * (PLAY_AREA_HEIGHT - ASTEROID_SPAWN_Y_MARGIN) + ASTEROID_SPAWN_Y_OFFSET;
            // Randomly choose between small, medium, and large based on dynamic ratio
            // largeRatio determines the percentage of large asteroids (starts at 10%, goes to 50%)
            // Remaining asteroids maintain the 4:5 ratio between small and medium
            // Start: small=40%, medium=50%, large=10% (4:5:1 ratio)
            // End: small=22.22%, medium=27.78%, large=50% (maintains 4:5 ratio for small:medium)
            const rand = Math.random();
            const remainingRatio = 1.0 - largeRatio;
            const smallMediumRatio = 4.0 / 9.0; // 4/(4+5) = small portion of remaining
            const smallRatio = remainingRatio * smallMediumRatio;
            const mediumRatio = remainingRatio * (1.0 - smallMediumRatio);
            
            if (rand < smallRatio) {
                this.asteroidSize = AsteroidSize.SMALL;
                this.size = ASTEROID_SMALL_SIZE;
            } else if (rand < smallRatio + mediumRatio) {
                this.asteroidSize = AsteroidSize.MEDIUM;
                this.size = ASTEROID_MEDIUM_SIZE;
            } else {
                this.asteroidSize = AsteroidSize.LARGE;
                this.size = ASTEROID_LARGE_SIZE;
            }
            this.speed = Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED) + ASTEROID_MIN_SPEED;
            
            // Apply angle offset if provided (for angled asteroids after 3 minutes)
            if (angleOffsetDegrees !== undefined) {
                const angleRadians = (angleOffsetDegrees * Math.PI) / 180;
                // Base direction is left (180 degrees or π radians)
                const baseAngle = Math.PI;
                const finalAngle = baseAngle + angleRadians;
                this.velocityX = Math.cos(finalAngle) * this.speed;
                this.velocityY = Math.sin(finalAngle) * this.speed;
            } else {
                this.velocityX = -this.speed; // Moving left
                this.velocityY = 0;
            }
        } else {
            // Constructor for split asteroids
            this.x = x;
            this.y = y;
            this.asteroidSize = sizeType;
            if (sizeType === AsteroidSize.LARGE) {
                this.size = ASTEROID_LARGE_SIZE;
            } else if (sizeType === AsteroidSize.MEDIUM) {
                this.size = ASTEROID_MEDIUM_SIZE;
            } else {
                this.size = ASTEROID_SMALL_SIZE;
            }
            this.velocityX = velocityX || 0;
            this.velocityY = velocityY || 0;
            this.speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        }

        this.isExploding = isExploding;
        this.flashTimer = Math.random() * ASTEROID_FLASH_INTERVAL; // Randomize initial flash phase

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
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Update flash timer for exploding asteroids
        if (this.isExploding) {
            this.flashTimer += deltaTime;
            if (this.flashTimer >= ASTEROID_FLASH_INTERVAL * 2) {
                this.flashTimer = 0;
            }
        }
        
        // Check if asteroid is off screen
        if (this.x + this.size < 0 || this.x - this.size > GAME_WIDTH ||
            this.y + this.size < 0 || this.y - this.size > PLAY_AREA_HEIGHT) {
            this.active = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        // Flash red for exploding asteroids
        if (this.isExploding && this.flashTimer < ASTEROID_FLASH_INTERVAL) {
            ctx.fillStyle = '#f00'; // Red flash
        } else {
            ctx.fillStyle = ASTEROID_COLOR;
        }
        
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
            // Mark bullet as inactive (it will be removed by its own logic)
            (other as Bullet).active = false;
            
            // If this is an exploding asteroid, trigger explosion
            if (this.isExploding) {
                this.triggerExplosion(context);
                return;
            }
            
            // Create explosion effect
            context.particleManager.createExplosion(this.x, this.y, ASTEROID_COLOR);
            
            // Handle splitting or destruction based on size
            if (this.asteroidSize === AsteroidSize.LARGE) {
                // Large asteroid splits into 2 medium asteroids
                const splitAsteroids = this.createSplitAsteroids(AsteroidSize.MEDIUM, ASTEROID_LARGE_SPLIT_ANGLE_MIN, ASTEROID_LARGE_SPLIT_ANGLE_MAX);
                
                // Mark this asteroid as inactive
                this.active = false;
                this.collisionEnabled = false;
                
                // Notify context about asteroid split
                if (context.onAsteroidSplit) {
                    context.onAsteroidSplit(this, splitAsteroids);
                }
            } else if (this.asteroidSize === AsteroidSize.MEDIUM) {
                // Medium asteroid splits into 2 small asteroids
                const splitAsteroids = this.createSplitAsteroids(AsteroidSize.SMALL, ASTEROID_MEDIUM_SPLIT_ANGLE_MIN, ASTEROID_MEDIUM_SPLIT_ANGLE_MAX);
                
                // Mark this asteroid as inactive
                this.active = false;
                this.collisionEnabled = false;
                
                // Notify context about asteroid split
                if (context.onAsteroidSplit) {
                    context.onAsteroidSplit(this, splitAsteroids);
                }
            } else {
                // Small asteroid - just destroy it
                this.active = false;
                this.collisionEnabled = false;
                
                // Notify context about asteroid destruction
                if (context.onAsteroidDestroyed) {
                    context.onAsteroidDestroyed(this);
                }
            }
            
            // Apply screen shake and freeze
            context.game.shakeIntensity = SHAKE_INTENSITY_ASTEROID_HIT;
            context.game.startFreeze(ASTEROID_HIT_FREEZE_DURATION, () => {
                // Freeze just provides visual feedback
            });
        }
        // Ship collision is handled by Ship.onCollision
    }

    private triggerExplosion(context: CollisionContext): void {
        // Determine explosion radius based on size
        let explosionRadius: number;
        if (this.asteroidSize === AsteroidSize.LARGE) {
            explosionRadius = ASTEROID_EXPLOSION_RADIUS_LARGE;
        } else if (this.asteroidSize === AsteroidSize.MEDIUM) {
            explosionRadius = ASTEROID_EXPLOSION_RADIUS_MEDIUM;
        } else {
            explosionRadius = ASTEROID_EXPLOSION_RADIUS_SMALL;
        }
        
        // Create large explosion effect
        context.particleManager.createExplosion(this.x, this.y, '#f00');
        
        // Create explosion visual (translucent red circle)
        context.particleManager.createExplosionVisual(this.x, this.y, explosionRadius, 0.5);
        
        // Mark this asteroid as inactive
        this.active = false;
        this.collisionEnabled = false;
        
        // Notify context about asteroid destruction (exploding asteroids don't split)
        if (context.onAsteroidDestroyed) {
            context.onAsteroidDestroyed(this);
        }
        
        // Check for asteroids and ship in explosion radius
        if (context.onExplosion) {
            context.onExplosion(this.x, this.y, explosionRadius);
        }
        
        // Apply screen shake and freeze
        context.game.shakeIntensity = SHAKE_INTENSITY_ASTEROID_HIT * 2; // Stronger shake for explosions
        context.game.startFreeze(ASTEROID_HIT_FREEZE_DURATION * 2, () => {
            // Freeze just provides visual feedback
        });
    }

    private createSplitAsteroids(targetSize: AsteroidSize, angleMin: number, angleMax: number): Asteroid[] {
        // Calculate the angle of the current velocity
        const currentAngle = Math.atan2(this.velocityY, this.velocityX);
        
        // Generate random split angles
        const angle1 = currentAngle + (Math.random() * (angleMax - angleMin) + angleMin) * (Math.PI / 180);
        const angle2 = currentAngle - (Math.random() * (angleMax - angleMin) + angleMin) * (Math.PI / 180);
        
        // Calculate new velocities (maintain similar speed)
        const newSpeed = this.speed * 0.8; // Slightly slower for smaller asteroids
        const velocityX1 = Math.cos(angle1) * newSpeed;
        const velocityY1 = Math.sin(angle1) * newSpeed;
        const velocityX2 = Math.cos(angle2) * newSpeed;
        const velocityY2 = Math.sin(angle2) * newSpeed;
        
        // Create two asteroids of the target size (split asteroids are never exploding)
        const asteroid1 = new Asteroid(this.x, this.y, targetSize, velocityX1, velocityY1, 0.1, undefined, false);
        const asteroid2 = new Asteroid(this.x, this.y, targetSize, velocityX2, velocityY2, 0.1, undefined, false);
        
        return [asteroid1, asteroid2];
    }
}

