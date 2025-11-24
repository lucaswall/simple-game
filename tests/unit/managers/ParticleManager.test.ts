import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParticleManager } from '../../../src/managers/ParticleManager';
import { PARTICLE_COUNT_PER_EXPLOSION } from '../../../src/states/PlayingState';
import { createMockCanvas } from '../../utils/MockCanvas';

describe('ParticleManager', () => {
    let particleManager: ParticleManager;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
        particleManager = new ParticleManager();
        const mockCanvas = createMockCanvas();
        ctx = mockCanvas.ctx;
    });

    it('should create correct number of particles on explosion', () => {
        particleManager.createExplosion(100, 200);
        
        expect(particleManager.particles).toHaveLength(PARTICLE_COUNT_PER_EXPLOSION);
    });

    it('should create particles at specified position', () => {
        const x = 150;
        const y = 250;
        particleManager.createExplosion(x, y);
        
        particleManager.particles.forEach(particle => {
            expect(particle.x).toBe(x);
            expect(particle.y).toBe(y);
        });
    });

    it('should move particles over time', () => {
        particleManager.createExplosion(100, 200);
        const particle = particleManager.particles[0];
        const initialX = particle.x;
        const initialY = particle.y;
        
        particleManager.update(0.1);
        
        expect(particle.x).not.toBe(initialX);
        expect(particle.y).not.toBe(initialY);
    });

    it('should decrease particle life over time', () => {
        particleManager.createExplosion(100, 200);
        const particle = particleManager.particles[0];
        const initialLife = particle.life;
        
        particleManager.update(0.1);
        
        expect(particle.life).toBeLessThan(initialLife);
    });

    it('should remove particles when life reaches 0', () => {
        particleManager.createExplosion(100, 200);
        const initialCount = particleManager.particles.length;
        
        // Set all particles to very low life
        particleManager.particles.forEach(p => {
            p.life = 0.05;
        });
        
        particleManager.update(0.1);
        
        expect(particleManager.particles.length).toBeLessThan(initialCount);
    });

    it('should use custom color when provided', () => {
        const customColor = '#ff0000';
        particleManager.createExplosion(100, 200, customColor);
        
        particleManager.particles.forEach(particle => {
            expect(particle.color).toBe(customColor);
        });
    });

        it('should draw particles', () => {
            particleManager.createExplosion(100, 200);
            
            const beginPathSpy = vi.spyOn(ctx, 'beginPath');
            const arcSpy = vi.spyOn(ctx, 'arc');
            const fillSpy = vi.spyOn(ctx, 'fill');
            
            particleManager.draw(ctx);
            
            expect(beginPathSpy).toHaveBeenCalledTimes(particleManager.particles.length);
            expect(arcSpy).toHaveBeenCalledTimes(particleManager.particles.length);
            expect(fillSpy).toHaveBeenCalledTimes(particleManager.particles.length);
        });

    it('should handle multiple explosions', () => {
        particleManager.createExplosion(100, 200);
        particleManager.createExplosion(300, 400);
        
        expect(particleManager.particles).toHaveLength(PARTICLE_COUNT_PER_EXPLOSION * 2);
    });

    describe('Explosion Visuals', () => {
        it('should create explosion visual with correct properties', () => {
            const x = 200;
            const y = 300;
            const maxRadius = 150;
            const duration = 0.5;
            
            particleManager.createExplosionVisual(x, y, maxRadius, duration);
            
            expect(particleManager.explosionVisuals).toHaveLength(1);
            const visual = particleManager.explosionVisuals[0];
            expect(visual.x).toBe(x);
            expect(visual.y).toBe(y);
            expect(visual.maxRadius).toBe(maxRadius);
            expect(visual.duration).toBe(duration);
            expect(visual.timer).toBe(0);
        });

        it('should update explosion visual timer', () => {
            particleManager.createExplosionVisual(100, 200, 100, 0.5);
            const visual = particleManager.explosionVisuals[0];
            const initialTimer = visual.timer;
            
            particleManager.update(0.1);
            
            expect(visual.timer).toBe(initialTimer + 0.1);
        });

        it('should remove explosion visual when duration expires', () => {
            particleManager.createExplosionVisual(100, 200, 100, 0.3);
            
            particleManager.update(0.3);
            
            expect(particleManager.explosionVisuals).toHaveLength(0);
        });

        it('should handle multiple explosion visuals', () => {
            particleManager.createExplosionVisual(100, 200, 100, 0.5);
            particleManager.createExplosionVisual(300, 400, 150, 0.6);
            
            expect(particleManager.explosionVisuals).toHaveLength(2);
            
            particleManager.update(0.5);
            
            // First should be removed, second should remain
            expect(particleManager.explosionVisuals).toHaveLength(1);
            expect(particleManager.explosionVisuals[0].maxRadius).toBe(150);
        });

        it('should draw explosion visuals', () => {
            particleManager.createExplosionVisual(200, 300, 100, 0.5);
            
            const arcSpy = vi.spyOn(ctx, 'arc');
            const strokeSpy = vi.spyOn(ctx, 'stroke');
            
            particleManager.draw(ctx);
            
            // Should draw explosion visual (arc and stroke)
            expect(arcSpy).toHaveBeenCalled();
            expect(strokeSpy).toHaveBeenCalled();
        });
    });
});

