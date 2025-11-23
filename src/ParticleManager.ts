import { Actor } from './interfaces/Actor';
import { PARTICLE_COUNT_PER_EXPLOSION, PARTICLE_MIN_SPEED, PARTICLE_MAX_SPEED, PARTICLE_MIN_LIFE, PARTICLE_MAX_LIFE, PARTICLE_MIN_SIZE, PARTICLE_MAX_SIZE, PARTICLE_HUE_MIN, PARTICLE_HUE_MAX } from './states/PlayingState';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

export class ParticleManager implements Actor {
    particles: Particle[] = [];

    createExplosion(x: number, y: number, color: string = `hsl(${Math.random() * (PARTICLE_HUE_MAX - PARTICLE_HUE_MIN) + PARTICLE_HUE_MIN}, 100%, 50%)`) {
        for (let i = 0; i < PARTICLE_COUNT_PER_EXPLOSION; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * (PARTICLE_MAX_SPEED - PARTICLE_MIN_SPEED) + PARTICLE_MIN_SPEED;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Math.random() * (PARTICLE_MAX_LIFE - PARTICLE_MIN_LIFE) + PARTICLE_MIN_LIFE,
                maxLife: PARTICLE_MAX_LIFE,
                color: color,
                size: Math.random() * (PARTICLE_MAX_SIZE - PARTICLE_MIN_SIZE) + PARTICLE_MIN_SIZE
            });
        }
    }

    update(deltaTime: number): void {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });
    }
}
