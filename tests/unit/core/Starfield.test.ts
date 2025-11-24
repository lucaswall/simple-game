import { describe, it, expect, beforeEach } from 'vitest';
import { Starfield } from '../../../src/core/Starfield';
import { GAME_WIDTH } from '../../../src/core/Constants';
import { PLAY_AREA_HEIGHT } from '../../../src/states/PlayingState';

describe('Starfield', () => {
    let starfield: Starfield;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
        starfield = new Starfield();
        canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        ctx = canvas.getContext('2d')!;
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
});

