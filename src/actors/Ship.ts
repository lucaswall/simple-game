import { Collidable, CollisionBounds, CollisionContext } from '../interfaces/Collidable';
import { Input } from '../core/Input';
import { Bullet } from './Bullet';
import { Asteroid } from './Asteroid';
import { SHIP_SIZE, SHIP_X_POSITION, SHIP_BACK_X_POSITION } from '../core/Constants';
import { SHIP_SPEED, SHIP_FIRE_RATE_MS, BULLET_SPEED, BULLET_SIZE, PLAY_AREA_HEIGHT, SHIP_COLLISION_X, SHIP_COLLISION_RADIUS, HIT_FREEZE_DURATION, SHAKE_INTENSITY_SHIP_HIT } from '../states/PlayingState';

interface PropulsionParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
}

export class Ship implements Collidable {
    x: number = SHIP_X_POSITION;
    y: number = PLAY_AREA_HEIGHT / 2;
    private input: Input;
    private bullets: Bullet[];
    private lastShotTime: number = 0;
    visible: boolean = true;
    controllable: boolean = true;
    collisionEnabled: boolean = true;
    private propulsionParticles: PropulsionParticle[] = [];
    private particleSpawnTimer: number = 0;

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

        // Update propulsion particles
        this.updatePropulsionParticles(deltaTime);
    }

    private updatePropulsionParticles(deltaTime: number): void {
        const backX = this.x - (SHIP_X_POSITION - SHIP_BACK_X_POSITION);
        const quarterSize = SHIP_SIZE / 4;
        const wingLength = SHIP_SIZE * 0.6;
        const engineX = backX - wingLength * 0.5;
        const engineY1 = this.y - quarterSize * 0.8;
        const engineY2 = this.y + quarterSize * 0.8;

        // Spawn new particles
        this.particleSpawnTimer += deltaTime;
        const spawnRate = 0.02; // Spawn a particle every 0.02 seconds (50 particles per second)
        while (this.particleSpawnTimer >= spawnRate) {
            this.particleSpawnTimer -= spawnRate;
            
            // Spawn particles for both engines
            this.createPropulsionParticle(engineX, engineY1);
            this.createPropulsionParticle(engineX, engineY2);
        }

        // Update existing particles
        for (let i = this.propulsionParticles.length - 1; i >= 0; i--) {
            const p = this.propulsionParticles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;
            
            if (p.life <= 0) {
                this.propulsionParticles.splice(i, 1);
            }
        }
    }

    private createPropulsionParticle(x: number, y: number): void {
        // Particles move backward (to the left) with some randomness
        const baseSpeed = 150; // Base speed backward
        const speedVariation = 50; // Random speed variation
        const angleVariation = 0.3; // Random angle variation in radians
        
        const angle = Math.PI + (Math.random() - 0.5) * angleVariation; // Mostly backward with slight variation
        const speed = baseSpeed + Math.random() * speedVariation;
        
        this.propulsionParticles.push({
            x: x,
            y: y + (Math.random() - 0.5) * 3, // Slight vertical offset
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.3 + Math.random() * 0.2, // 0.3 to 0.5 seconds
            maxLife: 0.5,
            size: 2 + Math.random() * 3 // 2 to 5 pixels
        });
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (!this.visible) return;

        // Draw propulsion particles first (behind the ship)
        this.drawPropulsionParticles(ctx);

        const noseX = this.x;
        const centerY = this.y;
        const backX = this.x - (SHIP_X_POSITION - SHIP_BACK_X_POSITION);
        const halfSize = SHIP_SIZE / 2;
        const quarterSize = SHIP_SIZE / 4;
        const wingLength = SHIP_SIZE * 0.6;
        const wingWidth = SHIP_SIZE * 0.15;

        ctx.save();

        // Main body (white)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(noseX, centerY); // Nose point
        ctx.lineTo(backX + quarterSize, centerY - halfSize * 0.7); // Top body
        ctx.lineTo(backX, centerY - quarterSize); // Top back
        ctx.lineTo(backX - wingWidth, centerY - quarterSize); // Wing top inner
        ctx.lineTo(backX - wingLength, centerY - halfSize * 0.5); // Wing top outer
        ctx.lineTo(backX - wingLength * 0.7, centerY); // Wing tip
        ctx.lineTo(backX - wingLength, centerY + halfSize * 0.5); // Wing bottom outer
        ctx.lineTo(backX - wingWidth, centerY + quarterSize); // Wing bottom inner
        ctx.lineTo(backX, centerY + quarterSize); // Bottom back
        ctx.lineTo(backX + quarterSize, centerY + halfSize * 0.7); // Bottom body
        ctx.closePath();
        ctx.fill();

        // Cockpit window (cyan)
        ctx.fillStyle = '#0ff';
        ctx.beginPath();
        ctx.arc(noseX - SHIP_SIZE * 0.3, centerY, quarterSize * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Engine glow (orange/yellow)
        const engineY1 = centerY - quarterSize * 0.8;
        const engineY2 = centerY + quarterSize * 0.8;
        const engineX = backX - wingLength * 0.5;

        // Left engine
        const gradient1 = ctx.createRadialGradient(engineX, engineY1, 0, engineX, engineY1, wingWidth * 1.5);
        gradient1.addColorStop(0, '#ff0');
        gradient1.addColorStop(0.5, '#f80');
        gradient1.addColorStop(1, 'rgba(255, 136, 0, 0)');
        ctx.fillStyle = gradient1;
        ctx.beginPath();
        ctx.arc(engineX, engineY1, wingWidth * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Right engine
        const gradient2 = ctx.createRadialGradient(engineX, engineY2, 0, engineX, engineY2, wingWidth * 1.5);
        gradient2.addColorStop(0, '#ff0');
        gradient2.addColorStop(0.5, '#f80');
        gradient2.addColorStop(1, 'rgba(255, 136, 0, 0)');
        ctx.fillStyle = gradient2;
        ctx.beginPath();
        ctx.arc(engineX, engineY2, wingWidth * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Wing details (subtle lines)
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Top wing line
        ctx.moveTo(backX - wingWidth, centerY - quarterSize);
        ctx.lineTo(backX - wingLength * 0.8, centerY - halfSize * 0.4);
        // Bottom wing line
        ctx.moveTo(backX - wingWidth, centerY + quarterSize);
        ctx.lineTo(backX - wingLength * 0.8, centerY + halfSize * 0.4);
        ctx.stroke();

        ctx.restore();
    }

    private drawPropulsionParticles(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        
        this.propulsionParticles.forEach(p => {
            const alpha = p.life / p.maxLife;
            
            // Create gradient from bright yellow/orange to transparent
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            const hue = 30 + Math.random() * 20; // Orange to yellow range
            gradient.addColorStop(0, `hsla(${hue}, 100%, 60%, ${alpha})`);
            gradient.addColorStop(0.5, `hsla(${hue}, 100%, 50%, ${alpha * 0.7})`);
            gradient.addColorStop(1, `hsla(${hue}, 100%, 40%, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
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

