import { describe, it, expect } from 'vitest';
import { Asteroid } from '../../../src/Asteroid';
import { GAME_WIDTH } from '../../../src/Constants';
import { ASTEROID_MIN_SIZE, ASTEROID_MAX_SIZE, ASTEROID_MIN_SPEED, ASTEROID_MAX_SPEED } from '../../../src/states/PlayingState';

describe('Asteroid', () => {
    describe('Initialization', () => {
        it('should spawn at right edge of screen', () => {
            const asteroid = new Asteroid();
            expect(asteroid.x).toBe(GAME_WIDTH);
        });

        it('should have size within valid range', () => {
            const asteroid = new Asteroid();
            expect(asteroid.size).toBeGreaterThanOrEqual(ASTEROID_MIN_SIZE);
            expect(asteroid.size).toBeLessThanOrEqual(ASTEROID_MAX_SIZE);
        });

        it('should have speed within valid range', () => {
            const asteroid = new Asteroid();
            expect(asteroid.speed).toBeGreaterThanOrEqual(ASTEROID_MIN_SPEED);
            expect(asteroid.speed).toBeLessThanOrEqual(ASTEROID_MAX_SPEED);
        });

        it('should be active by default', () => {
            const asteroid = new Asteroid();
            expect(asteroid.active).toBe(true);
        });

        it('should have vertices', () => {
            const asteroid = new Asteroid();
            expect(asteroid.vertices.length).toBeGreaterThan(0);
        });
    });

    describe('Movement', () => {
        it('should move left over time', () => {
            const asteroid = new Asteroid();
            const initialX = asteroid.x;
            asteroid.update(0.1);
            expect(asteroid.x).toBeLessThan(initialX);
        });

        it('should deactivate when off-screen', () => {
            const asteroid = new Asteroid();
            asteroid.x = -asteroid.size - 1;
            asteroid.update(0.1);
            expect(asteroid.active).toBe(false);
        });

        it('should remain active when on screen', () => {
            const asteroid = new Asteroid();
            asteroid.x = 100;
            asteroid.update(0.1);
            expect(asteroid.active).toBe(true);
        });
    });
});

