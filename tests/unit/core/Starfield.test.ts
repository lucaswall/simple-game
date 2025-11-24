import { describe, it, expect, beforeEach } from 'vitest';
import { Starfield } from '../../../src/core/Starfield';
import { GAME_WIDTH } from '../../../src/core/Constants';

describe('Starfield', () => {
    let starfield: Starfield;

    beforeEach(() => {
        starfield = new Starfield();
    });

    it('should move stars left over time', () => {
        const initialX = starfield['stars'][0].x;
        starfield.update(0.1);
        
        expect(starfield['stars'][0].x).toBeLessThan(initialX);
    });

    it('should wrap stars to right side when they go off-screen left', () => {
        const star = starfield['stars'][0];
        star.x = -10;
        
        starfield.update(0.1);
        
        expect(star.x).toBeGreaterThanOrEqual(0);
        expect(star.x).toBeLessThanOrEqual(GAME_WIDTH);
    });

    it('should update all stars', () => {
        const initialPositions = starfield['stars'].map(s => ({ x: s.x, y: s.y }));
        
        starfield.update(0.1);
        
        // All stars should have moved (either left or wrapped around)
        starfield['stars'].forEach((star, i) => {
            // Star either moved left OR wrapped around (x reset to GAME_WIDTH)
            const movedLeft = star.x < initialPositions[i].x;
            const wrappedAround = star.x >= GAME_WIDTH - 10; // Close to right edge after wrap
            expect(movedLeft || wrappedAround).toBe(true);
        });
    });

    it('should handle multiple wraps correctly', () => {
        const star = starfield['stars'][0];
        star.x = -100; // Way off screen
        
        starfield.update(0.1);
        
        // Should wrap to right side
        expect(star.x).toBeGreaterThanOrEqual(0);
        expect(star.x).toBeLessThanOrEqual(GAME_WIDTH);
    });

    it('should maintain star count after wrapping', () => {
        const initialStarCount = starfield['stars'].length;
        
        // Force all stars to wrap
        starfield['stars'].forEach(star => {
            star.x = -10;
        });
        
        starfield.update(0.1);
        
        expect(starfield['stars'].length).toBe(initialStarCount);
    });
});

