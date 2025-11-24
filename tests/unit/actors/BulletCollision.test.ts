import { describe, it, expect, beforeEach } from 'vitest';
import { Bullet } from '../../../src/actors/Bullet';
import { Asteroid } from '../../../src/actors/Asteroid';
import { Ship } from '../../../src/actors/Ship';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';
import { ParticleManager } from '../../../src/managers/ParticleManager';
import { CollisionContext } from '../../../src/interfaces/Collidable';

describe('Bullet Collision', () => {
    let bullet: Bullet;
    let context: CollisionContext;

    beforeEach(() => {
        bullet = new Bullet(100, 100, 800, 5);
        context = {
            game: new MockGame() as any,
            particleManager: new ParticleManager()
        };
    });

    describe('getCollisionBounds', () => {
        it('should return correct collision bounds', () => {
            bullet.x = 200;
            bullet.y = 150;
            bullet.size = 5;
            
            const bounds = bullet.getCollisionBounds();
            
            expect(bounds.type).toBe('circle');
            expect(bounds.centerX).toBe(200);
            expect(bounds.centerY).toBe(150);
            expect(bounds.radius).toBe(5);
        });

    });

    describe('canCollideWith', () => {
        it('should allow collision with asteroid when active and enabled', () => {
            bullet.active = true;
            bullet.collisionEnabled = true;
            const asteroid = new Asteroid();
            
            expect(bullet.canCollideWith(asteroid)).toBe(true);
        });

        it('should not allow collision when inactive', () => {
            bullet.active = false;
            bullet.collisionEnabled = true;
            const asteroid = new Asteroid();
            
            expect(bullet.canCollideWith(asteroid)).toBe(false);
        });

        it('should not allow collision when collision is disabled', () => {
            bullet.active = true;
            bullet.collisionEnabled = false;
            const asteroid = new Asteroid();
            
            expect(bullet.canCollideWith(asteroid)).toBe(false);
        });

        it('should not allow collision with ship', () => {
            bullet.active = true;
            bullet.collisionEnabled = true;
            const ship = new Ship(new MockInput(), []);
            
            expect(bullet.canCollideWith(ship)).toBe(false);
        });
    });

    describe('onCollision', () => {
        it('should deactivate bullet when colliding with asteroid', () => {
            bullet.active = true;
            const asteroid = new Asteroid();
            
            bullet.onCollision(asteroid, context);
            
            expect(bullet.active).toBe(false);
        });

        it('should not do anything when colliding with non-asteroid', () => {
            bullet.active = true;
            const ship = new Ship(new MockInput(), []);
            
            bullet.onCollision(ship, context);
            
            // Bullet collision is handled by Asteroid.onCollision
            expect(bullet.active).toBe(true);
        });
    });
});

