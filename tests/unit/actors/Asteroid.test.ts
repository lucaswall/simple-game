import { describe, it, expect } from 'vitest';
import { Asteroid, AsteroidSize } from '../../../src/actors/Asteroid';
import { GAME_WIDTH } from '../../../src/core/Constants';
import { ASTEROID_LARGE_SIZE, ASTEROID_MEDIUM_SIZE, ASTEROID_SMALL_SIZE, ASTEROID_MIN_SPEED, ASTEROID_MAX_SPEED, PLAY_AREA_HEIGHT } from '../../../src/states/PlayingState';

describe('Asteroid', () => {
    describe('Initialization', () => {
        it('should spawn asteroid at right edge of screen by default', () => {
            const asteroid = new Asteroid();
            expect(asteroid.x).toBe(GAME_WIDTH);
            // Asteroid size should be small, medium, or large
            expect([AsteroidSize.SMALL, AsteroidSize.MEDIUM, AsteroidSize.LARGE]).toContain(asteroid.asteroidSize);
            if (asteroid.asteroidSize === AsteroidSize.LARGE) {
                expect(asteroid.size).toBe(ASTEROID_LARGE_SIZE);
            } else if (asteroid.asteroidSize === AsteroidSize.MEDIUM) {
                expect(asteroid.size).toBe(ASTEROID_MEDIUM_SIZE);
            } else {
                expect(asteroid.size).toBe(ASTEROID_SMALL_SIZE);
            }
        });

        it('should create medium asteroid with correct size', () => {
            const asteroid = new Asteroid(200, 200, AsteroidSize.MEDIUM, -300, 0);
            expect(asteroid.asteroidSize).toBe(AsteroidSize.MEDIUM);
            expect(asteroid.size).toBe(ASTEROID_MEDIUM_SIZE);
        });

        it('should create small asteroid with correct size', () => {
            const asteroid = new Asteroid(200, 200, AsteroidSize.SMALL, -300, 0);
            expect(asteroid.asteroidSize).toBe(AsteroidSize.SMALL);
            expect(asteroid.size).toBe(ASTEROID_SMALL_SIZE);
        });

        it('should create large asteroid with correct size', () => {
            const asteroid = new Asteroid(200, 200, AsteroidSize.LARGE, -300, 0);
            expect(asteroid.asteroidSize).toBe(AsteroidSize.LARGE);
            expect(asteroid.size).toBe(ASTEROID_LARGE_SIZE);
        });

        it('should have speed within valid range for default asteroid', () => {
            const asteroid = new Asteroid();
            expect(asteroid.speed).toBeGreaterThanOrEqual(ASTEROID_MIN_SPEED);
            expect(asteroid.speed).toBeLessThanOrEqual(ASTEROID_MAX_SPEED);
        });

        it('should calculate speed from velocity components', () => {
            const asteroid = new Asteroid(200, 200, AsteroidSize.SMALL, -300, 400);
            expect(asteroid.speed).toBeCloseTo(Math.sqrt(300 * 300 + 400 * 400), 1);
        });

        it('should have velocity components', () => {
            const asteroid = new Asteroid(200, 200, AsteroidSize.SMALL, -300, 100);
            expect(asteroid.velocityX).toBe(-300);
            expect(asteroid.velocityY).toBe(100);
        });
    });

    describe('Movement', () => {
        it('should move left over time for default asteroid', () => {
            const asteroid = new Asteroid();
            const initialX = asteroid.x;
            asteroid.update(0.1);
            expect(asteroid.x).toBeLessThan(initialX);
        });

        it('should move according to velocity components', () => {
            const asteroid = new Asteroid(200, 200, AsteroidSize.SMALL, -300, 100);
            const initialX = asteroid.x;
            const initialY = asteroid.y;
            asteroid.update(0.1);
            expect(asteroid.x).toBeCloseTo(initialX - 30, 1); // -300 * 0.1
            expect(asteroid.y).toBeCloseTo(initialY + 10, 1); // 100 * 0.1
        });

        it('should deactivate when off-screen left', () => {
            const asteroid = new Asteroid(-100, 200, AsteroidSize.SMALL, -300, 0);
            asteroid.x = -asteroid.size - 1;
            asteroid.update(0.1);
            expect(asteroid.active).toBe(false);
        });

        it('should deactivate when off-screen right', () => {
            const asteroid = new Asteroid(GAME_WIDTH + 100, 200, AsteroidSize.SMALL, 300, 0);
            asteroid.update(0.1);
            expect(asteroid.active).toBe(false);
        });

        it('should deactivate when off-screen top', () => {
            const asteroid = new Asteroid(200, -100, AsteroidSize.SMALL, 0, -300);
            asteroid.update(0.1);
            expect(asteroid.active).toBe(false);
        });

        it('should deactivate when off-screen bottom', () => {
            const asteroid = new Asteroid(200, PLAY_AREA_HEIGHT + 100, AsteroidSize.SMALL, 0, 300);
            asteroid.update(0.1);
            expect(asteroid.active).toBe(false);
        });

        it('should remain active when on screen', () => {
            const asteroid = new Asteroid(200, 200, AsteroidSize.SMALL, -300, 0);
            asteroid.update(0.1);
            expect(asteroid.active).toBe(true);
        });
    });
});

