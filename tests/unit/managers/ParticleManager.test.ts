import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParticleManager } from '../../../src/managers/ParticleManager';
import { PARTICLE_COUNT_PER_EXPLOSION } from '../../../src/states/PlayingState';

describe('ParticleManager', () => {
    let particleManager: ParticleManager;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
        particleManager = new ParticleManager();
        canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        ctx = canvas.getContext('2d')!;
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
        
        if (!ctx) {
            // Skip if canvas context is not available
            expect(particleManager.particles.length).toBeGreaterThan(0);
            return;
        }
        
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
});

