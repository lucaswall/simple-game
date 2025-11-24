import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Asteroid } from '../../../src/Asteroid';
import { Ship } from '../../../src/Ship';
import { Bullet } from '../../../src/Bullet';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';
import { ParticleManager } from '../../../src/ParticleManager';
import { CollisionContext } from '../../../src/interfaces/Collidable';
import { SHAKE_INTENSITY_ASTEROID_HIT, ASTEROID_HIT_FREEZE_DURATION } from '../../../src/states/PlayingState';

describe('Asteroid Collision', () => {
    let asteroid: Asteroid;
    let mockGame: MockGame;
    let context: CollisionContext;
    let onAsteroidDestroyed: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        asteroid = new Asteroid();
        mockGame = new MockGame() as any;
        onAsteroidDestroyed = vi.fn();
        
        context = {
            game: mockGame as any,
            particleManager: new ParticleManager(),
            onAsteroidDestroyed: onAsteroidDestroyed
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

        it('should update bounds when asteroid position changes', () => {
            asteroid.x = 300;
            asteroid.y = 250;
            
            const bounds = asteroid.getCollisionBounds();
            
            expect(bounds.centerX).toBe(300);
            expect(bounds.centerY).toBe(250);
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
        it('should deactivate asteroid when colliding with bullet', () => {
            asteroid.active = true;
            asteroid.collisionEnabled = true;
            const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
            
            asteroid.onCollision(bullet, context);
            
            expect(asteroid.active).toBe(false);
            expect(asteroid.collisionEnabled).toBe(false);
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

        it('should call onAsteroidDestroyed callback', () => {
            asteroid.active = true;
            const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
            
            asteroid.onCollision(bullet, context);
            
            expect(onAsteroidDestroyed).toHaveBeenCalledWith(asteroid);
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
        });
    });
});

