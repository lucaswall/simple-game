import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Asteroid, AsteroidSize } from '../../../src/actors/Asteroid';
import { GAME_WIDTH } from '../../../src/core/Constants';
import { ASTEROID_LARGE_SIZE, ASTEROID_MEDIUM_SIZE, ASTEROID_SMALL_SIZE, ASTEROID_MIN_SPEED, ASTEROID_MAX_SPEED, PLAY_AREA_HEIGHT } from '../../../src/states/PlayingState';

describe('Asteroid', () => {
    let originalRandom: typeof Math.random;

    beforeEach(() => {
        originalRandom = Math.random;
    });

    afterEach(() => {
        // Always restore Math.random after each test to ensure idempotency
        Math.random = originalRandom;
    });
    describe('Initialization', () => {
        it('should spawn asteroid at right edge of screen by default', () => {
            // Mock Math.random to ensure deterministic behavior
            // With largeRatio = 0.1, remainingRatio = 0.9
            // smallRatio = 0.9 * (4/9) = 0.4, mediumRatio = 0.9 * (5/9) = 0.5
            // So: small < 0.4, medium < 0.9, large >= 0.9
            let callCount = 0;
            Math.random = vi.fn(() => {
                callCount++;
                // Call 1: Y position
                // Call 2: Size determination - return 0.3 to get small asteroid
                if (callCount === 2) {
                    return 0.3; // < 0.4, so small asteroid
                }
                // Call 3+: Speed, vertices, etc.
                return 0.5;
            });
            
            const asteroid = new Asteroid();
            expect(asteroid.x).toBe(GAME_WIDTH);
            // With our mock, should be small asteroid
            expect(asteroid.asteroidSize).toBe(AsteroidSize.SMALL);
            expect(asteroid.size).toBe(ASTEROID_SMALL_SIZE);
        });

        it('should create asteroids with correct sizes for each type', () => {
            const mediumAsteroid = new Asteroid(200, 200, AsteroidSize.MEDIUM, -300, 0);
            expect(mediumAsteroid.asteroidSize).toBe(AsteroidSize.MEDIUM);
            expect(mediumAsteroid.size).toBe(ASTEROID_MEDIUM_SIZE);
            
            const smallAsteroid = new Asteroid(200, 200, AsteroidSize.SMALL, -300, 0);
            expect(smallAsteroid.asteroidSize).toBe(AsteroidSize.SMALL);
            expect(smallAsteroid.size).toBe(ASTEROID_SMALL_SIZE);
            
            const largeAsteroid = new Asteroid(200, 200, AsteroidSize.LARGE, -300, 0);
            expect(largeAsteroid.asteroidSize).toBe(AsteroidSize.LARGE);
            expect(largeAsteroid.size).toBe(ASTEROID_LARGE_SIZE);
        });

        it('should have speed within valid range for default asteroid', () => {
            // Mock Math.random to ensure deterministic behavior
            let callCount = 0;
            Math.random = vi.fn(() => {
                callCount++;
                // Call 1: Y position
                // Call 2: Size determination
                // Call 3: Speed - return 0.5 to get middle speed
                if (callCount === 3) {
                    return 0.5; // Results in middle speed
                }
                // Call 4+: Vertices, etc.
                return 0.5;
            });
            
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

    describe('Exploding Asteroids', () => {
        it('should initialize flash timer for exploding asteroids', () => {
            // Mock Math.random to ensure deterministic flash timer
            Math.random = vi.fn(() => {
                return 0.1; // Results in flash timer = 0.1 * 0.2 = 0.02
            });
            
            const asteroid = new Asteroid(200, 200, AsteroidSize.SMALL, -300, 0, 0.1, undefined, true);
            expect(asteroid.isExploding).toBe(true);
            expect(asteroid['flashTimer']).toBeGreaterThanOrEqual(0);
            expect(asteroid['flashTimer']).toBeLessThan(0.2); // Should be less than flash interval
        });

        it('should not initialize flash timer for non-exploding asteroids', () => {
            const asteroid = new Asteroid(200, 200, AsteroidSize.SMALL, -300, 0, 0.1, undefined, false);
            expect(asteroid.isExploding).toBe(false);
            // Flash timer is only initialized for exploding asteroids, so it should be 0
            // But we need to check the actual implementation - if it's not initialized, it's 0
            expect(asteroid['flashTimer']).toBe(0);
        });

        it('should update flash timer for exploding asteroids', () => {
            const asteroid = new Asteroid(200, 200, AsteroidSize.MEDIUM, -300, 0, 0.1, undefined, true);
            const initialFlashTimer = asteroid['flashTimer'];
            
            asteroid.update(0.1);
            
            expect(asteroid['flashTimer']).toBeGreaterThan(initialFlashTimer);
        });

        it('should wrap flash timer when it exceeds interval', () => {
            const asteroid = new Asteroid(200, 200, AsteroidSize.LARGE, -300, 0, 0.1, undefined, true);
            asteroid['flashTimer'] = 0.39; // Close to wrap threshold (0.2 * 2 = 0.4)
            
            asteroid.update(0.05); // Should wrap (0.39 + 0.05 = 0.44, wraps to 0)
            
            // Flash timer wraps when >= 0.4 (ASTEROID_FLASH_INTERVAL * 2)
            expect(asteroid['flashTimer']).toBeLessThan(0.4);
        });
    });
});

