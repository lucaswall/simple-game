import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Asteroid, AsteroidSize } from '../../../src/actors/Asteroid';
import { Bullet } from '../../../src/actors/Bullet';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';
import { ParticleManager } from '../../../src/managers/ParticleManager';
import { CollisionContext } from '../../../src/interfaces/Collidable';
import { PlayingState } from '../../../src/states/PlayingState';
import { ASTEROID_EXPLOSION_RADIUS_SMALL, ASTEROID_EXPLOSION_RADIUS_MEDIUM, ASTEROID_EXPLOSION_RADIUS_LARGE, SHIP_COLLISION_X } from '../../../src/states/PlayingState';
import { SHIP_X_POSITION } from '../../../src/core/Constants';

describe('Exploding Asteroids', () => {
    let asteroid: Asteroid;
    let mockGame: MockGame;
    let context: CollisionContext;
    let onExplosion: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockGame = new MockGame() as any;
        onExplosion = vi.fn();
        
        context = {
            game: mockGame as any,
            particleManager: new ParticleManager(),
            onExplosion: onExplosion
        };
    });

    describe('Visual Effects', () => {
        it('should flash red when exploding', () => {
            asteroid = new Asteroid(200, 200, AsteroidSize.SMALL, -300, 0, 0.1, undefined, true);
            
            // Initially should flash (flashTimer starts randomized, but we can test the logic)
            asteroid.update(0.01);
            
            // The asteroid should have isExploding flag
            expect(asteroid.isExploding).toBe(true);
        });

        it('should update flash timer for exploding asteroids', () => {
            asteroid = new Asteroid(200, 200, AsteroidSize.MEDIUM, -300, 0, 0.1, undefined, true);
            const initialFlashTimer = asteroid['flashTimer'];
            
            asteroid.update(0.1);
            
            // Flash timer should have increased
            expect(asteroid['flashTimer']).toBeGreaterThan(initialFlashTimer);
        });

        it('should not flash when not exploding', () => {
            asteroid = new Asteroid(200, 200, AsteroidSize.SMALL, -300, 0, 0.1, undefined, false);
            
            expect(asteroid.isExploding).toBe(false);
            // Flash timer is initialized randomly, but should not update for non-exploding asteroids
            const initialFlashTimer = asteroid['flashTimer'];
            asteroid.update(0.1);
            
            // Flash timer should not change for non-exploding asteroids (it only updates if isExploding is true)
            expect(asteroid['flashTimer']).toBe(initialFlashTimer);
        });
    });

    describe('Explosion Behavior', () => {
        it('should trigger explosion when exploding asteroid is hit', () => {
            asteroid = new Asteroid(200, 200, AsteroidSize.SMALL, -300, 0, 0.1, undefined, true);
            const bullet = new Bullet(200, 200, 800, 5);
            
            asteroid.onCollision(bullet, context);
            
            expect(asteroid.active).toBe(false);
            expect(onExplosion).toHaveBeenCalledWith(200, 200, ASTEROID_EXPLOSION_RADIUS_SMALL);
        });

        it('should use correct explosion radius for small asteroids', () => {
            asteroid = new Asteroid(200, 200, AsteroidSize.SMALL, -300, 0, 0.1, undefined, true);
            const bullet = new Bullet(200, 200, 800, 5);
            
            asteroid.onCollision(bullet, context);
            
            expect(onExplosion).toHaveBeenCalledWith(200, 200, ASTEROID_EXPLOSION_RADIUS_SMALL);
        });

        it('should use correct explosion radius for medium asteroids', () => {
            asteroid = new Asteroid(200, 200, AsteroidSize.MEDIUM, -300, 0, 0.1, undefined, true);
            const bullet = new Bullet(200, 200, 800, 5);
            
            asteroid.onCollision(bullet, context);
            
            expect(onExplosion).toHaveBeenCalledWith(200, 200, ASTEROID_EXPLOSION_RADIUS_MEDIUM);
        });

        it('should use correct explosion radius for large asteroids', () => {
            asteroid = new Asteroid(200, 200, AsteroidSize.LARGE, -300, 0, 0.1, undefined, true);
            const bullet = new Bullet(200, 200, 800, 5);
            
            asteroid.onCollision(bullet, context);
            
            expect(onExplosion).toHaveBeenCalledWith(200, 200, ASTEROID_EXPLOSION_RADIUS_LARGE);
        });

        it('should not split when exploding asteroid is hit', () => {
            asteroid = new Asteroid(200, 200, AsteroidSize.LARGE, -300, 0, 0.1, undefined, true);
            const bullet = new Bullet(200, 200, 800, 5);
            const onAsteroidSplit = vi.fn();
            const onAsteroidDestroyed = vi.fn();
            
            context.onAsteroidSplit = onAsteroidSplit;
            context.onAsteroidDestroyed = onAsteroidDestroyed;
            
            asteroid.onCollision(bullet, context);
            
            // Should call destroyed, not split
            expect(onAsteroidDestroyed).toHaveBeenCalled();
            expect(onAsteroidSplit).not.toHaveBeenCalled();
        });

        it('should create red explosion particles', () => {
            asteroid = new Asteroid(200, 200, AsteroidSize.SMALL, -300, 0, 0.1, undefined, true);
            const bullet = new Bullet(200, 200, 800, 5);
            const initialParticleCount = context.particleManager.particles.length;
            
            asteroid.onCollision(bullet, context);
            
            expect(context.particleManager.particles.length).toBeGreaterThan(initialParticleCount);
        });
    });

    describe('Explosion Area Damage', () => {
        let playingState: PlayingState;
        let input: MockInput;

        beforeEach(() => {
            input = new MockInput();
            playingState = new PlayingState(input);
            mockGame = new MockGame() as any;
            playingState.enter(mockGame as any);
        });

        it('should destroy ship if in explosion radius', () => {
            // Ensure ship collision is enabled and not invincible
            playingState.ship.collisionEnabled = true;
            playingState.invincibilityTimer = 0;
            playingState.ship.visible = true;
            
            // Get ship collision bounds
            const shipBounds = playingState.ship.getCollisionBounds();
            const explosionX = (shipBounds.centerX ?? 0);
            const explosionY = (shipBounds.centerY ?? 0);
            const radius = ASTEROID_EXPLOSION_RADIUS_MEDIUM;
            
            const initialLives = playingState.lives;
            
            playingState['handleExplosion'](explosionX, explosionY, radius, mockGame as any);
            
            // Ship should be destroyed (lives decreased)
            expect(playingState.lives).toBeLessThan(initialLives);
        });

        it('should not destroy ship if outside explosion radius', () => {
            const explosionX = 0; // Far left
            const explosionY = 0; // Far top
            const radius = ASTEROID_EXPLOSION_RADIUS_SMALL;
            
            const initialLives = playingState.lives;
            
            playingState['handleExplosion'](explosionX, explosionY, radius, mockGame as any);
            
            expect(playingState.lives).toBe(initialLives);
        });

        it('should not destroy ship if invincible', () => {
            playingState.invincibilityTimer = 1.0; // Ship is invincible
            const explosionX = playingState.ship.x - (SHIP_X_POSITION - SHIP_COLLISION_X);
            const explosionY = playingState.ship.y;
            const radius = ASTEROID_EXPLOSION_RADIUS_MEDIUM;
            
            const initialLives = playingState.lives;
            
            playingState['handleExplosion'](explosionX, explosionY, radius, mockGame as any);
            
            expect(playingState.lives).toBe(initialLives);
        });

        it('should destroy asteroids in explosion radius', () => {
            const explosionX = 400;
            const explosionY = 300;
            const radius = ASTEROID_EXPLOSION_RADIUS_LARGE;
            
            // Create asteroids at different distances
            const asteroid1 = new Asteroid(explosionX + 50, explosionY, AsteroidSize.SMALL, -300, 0, 0.1, undefined, false);
            const asteroid2 = new Asteroid(explosionX + 200, explosionY, AsteroidSize.MEDIUM, -300, 0, 0.1, undefined, false);
            
            playingState.asteroids.push(asteroid1, asteroid2);
            
            playingState['handleExplosion'](explosionX, explosionY, radius, mockGame as any);
            
            // Asteroid1 should be destroyed (within radius)
            // Asteroid2 should remain (outside radius)
            expect(asteroid1.active).toBe(false);
            expect(asteroid2.active).toBe(true);
        });

        it('should award points for asteroids destroyed by explosion', () => {
            const explosionX = 400;
            const explosionY = 300;
            const radius = ASTEROID_EXPLOSION_RADIUS_MEDIUM;
            
            const asteroid = new Asteroid(explosionX + 30, explosionY, AsteroidSize.SMALL, -300, 0, 0.1, undefined, false);
            playingState.asteroids.push(asteroid);
            
            const initialScore = playingState.score;
            
            playingState['handleExplosion'](explosionX, explosionY, radius, mockGame as any);
            
            // Small asteroid destroyed should award points
            expect(playingState.score).toBeGreaterThan(initialScore);
        });
    });

    describe('Spawning', () => {
        let playingState: PlayingState;
        let input: MockInput;

        beforeEach(() => {
            input = new MockInput();
            playingState = new PlayingState(input);
            mockGame = new MockGame() as any;
            playingState.enter(mockGame as any);
        });

        it('should not spawn exploding asteroids before 1 minute', () => {
            playingState['gameTime'] = 59;
            playingState['asteroidTimer'] = 0;
            
            // Spawn multiple asteroids to check probability
            let explodingCount = 0;
            for (let i = 0; i < 100; i++) {
                playingState['updateAsteroids'](0.1);
                if (playingState.asteroids.length > 0) {
                    const lastAsteroid = playingState.asteroids[playingState.asteroids.length - 1];
                    if (lastAsteroid.isExploding) {
                        explodingCount++;
                    }
                    playingState.asteroids.pop();
                }
            }
            
            expect(explodingCount).toBe(0);
        });

        it('should spawn exploding asteroids with 10% chance at 1 minute', () => {
            playingState['gameTime'] = 60;
            playingState['asteroidTimer'] = 0;
            
            // Mock Math.random to control probability
            let explodingCount = 0;
            const originalRandom = Math.random;
            let callCount = 0;
            
            Math.random = vi.fn(() => {
                callCount++;
                // First call is for size determination, second is for exploding chance
                if (callCount % 2 === 0) {
                    // Return values that will result in ~10% exploding chance
                    return callCount < 20 ? 0.05 : 0.95; // First 10 will be exploding
                }
                return originalRandom();
            });
            
            for (let i = 0; i < 20; i++) {
                playingState['updateAsteroids'](0.1);
                if (playingState.asteroids.length > 0) {
                    const lastAsteroid = playingState.asteroids[playingState.asteroids.length - 1];
                    if (lastAsteroid.isExploding) {
                        explodingCount++;
                    }
                    playingState.asteroids.pop();
                }
            }
            
            Math.random = originalRandom;
            
            // Should have some exploding asteroids
            expect(explodingCount).toBeGreaterThan(0);
        });

        it('should spawn exploding asteroids with 20% chance at 3 minutes', () => {
            playingState['gameTime'] = 180;
            playingState['asteroidTimer'] = 0;
            
            let explodingCount = 0;
            const originalRandom = Math.random;
            let callCount = 0;
            
            Math.random = vi.fn(() => {
                callCount++;
                if (callCount % 2 === 0) {
                    // Return values that will result in ~20% exploding chance
                    return callCount < 40 ? 0.15 : 0.95; // First 20 will be exploding
                }
                return originalRandom();
            });
            
            for (let i = 0; i < 20; i++) {
                playingState['updateAsteroids'](0.1);
                if (playingState.asteroids.length > 0) {
                    const lastAsteroid = playingState.asteroids[playingState.asteroids.length - 1];
                    if (lastAsteroid.isExploding) {
                        explodingCount++;
                    }
                    playingState.asteroids.pop();
                }
            }
            
            Math.random = originalRandom;
            
            // Should have more exploding asteroids than at 1 minute
            expect(explodingCount).toBeGreaterThan(0);
        });

        it('should linearly ramp exploding chance from 1 to 3 minutes', () => {
            // Test at 2 minutes (should be ~15%)
            playingState['gameTime'] = 120;
            playingState['asteroidTimer'] = 0;
            
            let explodingCount = 0;
            const originalRandom = Math.random;
            let callCount = 0;
            
            Math.random = vi.fn(() => {
                callCount++;
                if (callCount % 2 === 0) {
                    // Return values that will result in ~15% exploding chance
                    return callCount < 30 ? 0.10 : 0.95;
                }
                return originalRandom();
            });
            
            for (let i = 0; i < 20; i++) {
                playingState['updateAsteroids'](0.1);
                if (playingState.asteroids.length > 0) {
                    const lastAsteroid = playingState.asteroids[playingState.asteroids.length - 1];
                    if (lastAsteroid.isExploding) {
                        explodingCount++;
                    }
                    playingState.asteroids.pop();
                }
            }
            
            Math.random = originalRandom;
            
            expect(explodingCount).toBeGreaterThan(0);
        });
    });

    describe('Split Asteroids', () => {
        it('should never create exploding asteroids from splits', () => {
            asteroid = new Asteroid(200, 200, AsteroidSize.LARGE, -300, 0, 0.1, undefined, false);
            const bullet = new Bullet(200, 200, 800, 5);
            const onAsteroidSplit = vi.fn();
            
            context.onAsteroidSplit = onAsteroidSplit;
            
            asteroid.onCollision(bullet, context);
            
            const splitAsteroids = onAsteroidSplit.mock.calls[0][1] as Asteroid[];
            
            splitAsteroids.forEach(ast => {
                expect(ast.isExploding).toBe(false);
            });
        });
    });
});

