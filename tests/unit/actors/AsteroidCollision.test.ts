import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Asteroid, AsteroidSize } from '../../../src/actors/Asteroid';
import { Ship } from '../../../src/actors/Ship';
import { Bullet } from '../../../src/actors/Bullet';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';
import { ParticleManager } from '../../../src/managers/ParticleManager';
import { CollisionContext } from '../../../src/interfaces/Collidable';
import { SHAKE_INTENSITY_ASTEROID_HIT, ASTEROID_HIT_FREEZE_DURATION, ASTEROID_MEDIUM_SPLIT_ANGLE_MIN, ASTEROID_MEDIUM_SPLIT_ANGLE_MAX, ASTEROID_LARGE_SPLIT_ANGLE_MIN, ASTEROID_LARGE_SPLIT_ANGLE_MAX } from '../../../src/states/PlayingState';

describe('Asteroid Collision', () => {
    let asteroid: Asteroid;
    let mockGame: MockGame;
    let context: CollisionContext;
    let onAsteroidDestroyed: ReturnType<typeof vi.fn>;
    let onAsteroidSplit: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        asteroid = new Asteroid(200, 200, AsteroidSize.MEDIUM, -300, 0);
        mockGame = new MockGame() as any;
        onAsteroidDestroyed = vi.fn();
        onAsteroidSplit = vi.fn();
        
        context = {
            game: mockGame as any,
            particleManager: new ParticleManager(),
            onAsteroidDestroyed: onAsteroidDestroyed,
            onAsteroidSplit: onAsteroidSplit
        };
    });

    describe('getCollisionBounds', () => {
        it('should return correct collision bounds', () => {
            asteroid.x = 200;
            asteroid.y = 150;
            asteroid.size = 25;
            
            const bounds = asteroid.getCollisionBounds();
            
            expect(bounds.type).toBe('circle');
            expect(bounds.centerX).toBe(200);
            expect(bounds.centerY).toBe(150);
            expect(bounds.radius).toBe(25);
        });

    });

    describe('canCollideWith', () => {
        it('should allow collision with ship when active and enabled', () => {
            asteroid.active = true;
            asteroid.collisionEnabled = true;
            const ship = new Ship(new MockInput(), []);
            
            expect(asteroid.canCollideWith(ship)).toBe(true);
        });

        it('should allow collision with bullet when active and enabled', () => {
            asteroid.active = true;
            asteroid.collisionEnabled = true;
            const bullet = new Bullet(100, 100, 800, 5);
            
            expect(asteroid.canCollideWith(bullet)).toBe(true);
        });

        it('should not allow collision when inactive', () => {
            asteroid.active = false;
            asteroid.collisionEnabled = true;
            const bullet = new Bullet(100, 100, 800, 5);
            
            expect(asteroid.canCollideWith(bullet)).toBe(false);
        });

        it('should not allow collision when collision is disabled', () => {
            asteroid.active = true;
            asteroid.collisionEnabled = false;
            const bullet = new Bullet(100, 100, 800, 5);
            
            expect(asteroid.canCollideWith(bullet)).toBe(false);
        });
    });

    describe('onCollision', () => {
        describe('Small asteroid collision', () => {
            beforeEach(() => {
                asteroid = new Asteroid(200, 200, AsteroidSize.SMALL, -300, 0);
            });

            it('should deactivate small asteroid when colliding with bullet', () => {
                asteroid.active = true;
                asteroid.collisionEnabled = true;
                const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
                
                asteroid.onCollision(bullet, context);
                
                expect(asteroid.active).toBe(false);
                expect(asteroid.collisionEnabled).toBe(false);
            });

            it('should call onAsteroidDestroyed for small asteroid', () => {
                asteroid.active = true;
                const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
                
                asteroid.onCollision(bullet, context);
                
                expect(onAsteroidDestroyed).toHaveBeenCalledWith(asteroid);
                expect(onAsteroidSplit).not.toHaveBeenCalled();
            });
        });

        describe('Large asteroid collision', () => {
            beforeEach(() => {
                asteroid = new Asteroid(200, 200, AsteroidSize.LARGE, -300, 0);
            });

            it('should deactivate large asteroid when colliding with bullet', () => {
                asteroid.active = true;
                asteroid.collisionEnabled = true;
                const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
                
                asteroid.onCollision(bullet, context);
                
                expect(asteroid.active).toBe(false);
                expect(asteroid.collisionEnabled).toBe(false);
            });

            it('should call onAsteroidSplit for large asteroid', () => {
                asteroid.active = true;
                const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
                
                asteroid.onCollision(bullet, context);
                
                expect(onAsteroidSplit).toHaveBeenCalled();
                expect(onAsteroidSplit.mock.calls[0][0]).toBe(asteroid);
                expect(onAsteroidSplit.mock.calls[0][1]).toHaveLength(2);
                expect(onAsteroidSplit.mock.calls[0][1][0].asteroidSize).toBe(AsteroidSize.MEDIUM);
                expect(onAsteroidSplit.mock.calls[0][1][1].asteroidSize).toBe(AsteroidSize.MEDIUM);
                expect(onAsteroidDestroyed).not.toHaveBeenCalled();
            });

            it('should create two medium asteroids with split angles', () => {
                asteroid.active = true;
                asteroid.velocityX = -300;
                asteroid.velocityY = 0;
                const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
                
                asteroid.onCollision(bullet, context);
                
                const splitAsteroids = onAsteroidSplit.mock.calls[0][1] as Asteroid[];
                expect(splitAsteroids).toHaveLength(2);
                
                // Both should be medium asteroids
                splitAsteroids.forEach(ast => {
                    expect(ast.asteroidSize).toBe(AsteroidSize.MEDIUM);
                    expect(ast.x).toBe(asteroid.x);
                    expect(ast.y).toBe(asteroid.y);
                });
                
                // They should have different velocities (split angles)
                const angle1 = Math.atan2(splitAsteroids[0].velocityY, splitAsteroids[0].velocityX);
                const angle2 = Math.atan2(splitAsteroids[1].velocityY, splitAsteroids[1].velocityX);
                expect(angle1).not.toBeCloseTo(angle2, 1);
            });

            it('should create split asteroids with angles within 5-10 degree range', () => {
                asteroid.active = true;
                asteroid.velocityX = -300;
                asteroid.velocityY = 0;
                const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
                
                // Calculate parent angle (moving left = π radians)
                const parentAngle = Math.atan2(asteroid.velocityY, asteroid.velocityX);
                
                asteroid.onCollision(bullet, context);
                
                const splitAsteroids = onAsteroidSplit.mock.calls[0][1] as Asteroid[];
                
                // Check each split asteroid's angle relative to parent
                splitAsteroids.forEach(ast => {
                    const splitAngle = Math.atan2(ast.velocityY, ast.velocityX);
                    // Calculate signed angle difference
                    let angleDiff = splitAngle - parentAngle;
                    // Normalize to -π to π range
                    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                    
                    // Convert to degrees
                    const angleDiffDegrees = Math.abs(angleDiff) * (180 / Math.PI);
                    
                    // The split angles should be between min and max degrees from parent
                    expect(angleDiffDegrees).toBeGreaterThanOrEqual(ASTEROID_LARGE_SPLIT_ANGLE_MIN);
                    expect(angleDiffDegrees).toBeLessThanOrEqual(ASTEROID_LARGE_SPLIT_ANGLE_MAX);
                });
            });
        });

        describe('Medium asteroid collision', () => {
            beforeEach(() => {
                asteroid = new Asteroid(200, 200, AsteroidSize.MEDIUM, -300, 0);
            });

            it('should deactivate medium asteroid when colliding with bullet', () => {
                asteroid.active = true;
                asteroid.collisionEnabled = true;
                const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
                
                asteroid.onCollision(bullet, context);
                
                expect(asteroid.active).toBe(false);
                expect(asteroid.collisionEnabled).toBe(false);
            });

            it('should call onAsteroidSplit for medium asteroid', () => {
                asteroid.active = true;
                const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
                
                asteroid.onCollision(bullet, context);
                
                expect(onAsteroidSplit).toHaveBeenCalled();
                expect(onAsteroidSplit.mock.calls[0][0]).toBe(asteroid);
                expect(onAsteroidSplit.mock.calls[0][1]).toHaveLength(2);
                expect(onAsteroidSplit.mock.calls[0][1][0].asteroidSize).toBe(AsteroidSize.SMALL);
                expect(onAsteroidSplit.mock.calls[0][1][1].asteroidSize).toBe(AsteroidSize.SMALL);
                expect(onAsteroidDestroyed).not.toHaveBeenCalled();
            });

            it('should create two small asteroids with split angles', () => {
                asteroid.active = true;
                asteroid.velocityX = -300;
                asteroid.velocityY = 0;
                const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
                
                asteroid.onCollision(bullet, context);
                
                const splitAsteroids = onAsteroidSplit.mock.calls[0][1] as Asteroid[];
                expect(splitAsteroids).toHaveLength(2);
                
                // Both should be small asteroids
                splitAsteroids.forEach(ast => {
                    expect(ast.asteroidSize).toBe(AsteroidSize.SMALL);
                    expect(ast.x).toBe(asteroid.x);
                    expect(ast.y).toBe(asteroid.y);
                });
                
                // They should have different velocities (split angles)
                const angle1 = Math.atan2(splitAsteroids[0].velocityY, splitAsteroids[0].velocityX);
                const angle2 = Math.atan2(splitAsteroids[1].velocityY, splitAsteroids[1].velocityX);
                expect(angle1).not.toBeCloseTo(angle2, 1);
            });

            it('should create split asteroids with angles within 10-30 degree range', () => {
                asteroid.active = true;
                asteroid.velocityX = -300;
                asteroid.velocityY = 0;
                const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
                
                // Calculate parent angle (moving left = π radians)
                const parentAngle = Math.atan2(asteroid.velocityY, asteroid.velocityX);
                
                asteroid.onCollision(bullet, context);
                
                const splitAsteroids = onAsteroidSplit.mock.calls[0][1] as Asteroid[];
                
                // Check each split asteroid's angle relative to parent
                splitAsteroids.forEach(ast => {
                    const splitAngle = Math.atan2(ast.velocityY, ast.velocityX);
                    // Calculate signed angle difference
                    let angleDiff = splitAngle - parentAngle;
                    // Normalize to -π to π range
                    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                    
                    // Convert to degrees
                    const angleDiffDegrees = Math.abs(angleDiff) * (180 / Math.PI);
                    
                    // The split angles should be between min and max degrees from parent
                    expect(angleDiffDegrees).toBeGreaterThanOrEqual(ASTEROID_MEDIUM_SPLIT_ANGLE_MIN);
                    expect(angleDiffDegrees).toBeLessThanOrEqual(ASTEROID_MEDIUM_SPLIT_ANGLE_MAX);
                });
            });
        });

        it('should deactivate bullet when colliding', () => {
            asteroid.active = true;
            const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
            bullet.active = true;
            
            asteroid.onCollision(bullet, context);
            
            expect(bullet.active).toBe(false);
        });

        it('should create explosion effect on collision', () => {
            asteroid.active = true;
            asteroid.x = 200;
            asteroid.y = 150;
            const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
            const initialParticleCount = context.particleManager.particles.length;
            
            asteroid.onCollision(bullet, context);
            
            expect(context.particleManager.particles.length).toBeGreaterThan(initialParticleCount);
        });

        it('should set shake intensity on collision', () => {
            asteroid.active = true;
            const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
            
            asteroid.onCollision(bullet, context);
            
            expect(mockGame.shakeIntensity).toBe(SHAKE_INTENSITY_ASTEROID_HIT);
        });

        it('should trigger freeze on collision', () => {
            asteroid.active = true;
            const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
            
            asteroid.onCollision(bullet, context);
            
            const freezeCallbacks = mockGame.getFreezeCallbacks();
            expect(freezeCallbacks.length).toBeGreaterThan(0);
            expect(freezeCallbacks[0].duration).toBe(ASTEROID_HIT_FREEZE_DURATION);
        });

        it('should not do anything when colliding with ship', () => {
            asteroid.active = true;
            const ship = new Ship(new MockInput(), []);
            const initialActive = asteroid.active;
            
            asteroid.onCollision(ship, context);
            
            // Ship collision is handled by Ship.onCollision
            expect(asteroid.active).toBe(initialActive);
            expect(onAsteroidDestroyed).not.toHaveBeenCalled();
            expect(onAsteroidSplit).not.toHaveBeenCalled();
        });
    });
});

