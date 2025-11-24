import { describe, it, expect } from 'vitest';
import { CollisionManager } from '../../../src/managers/CollisionManager';
import { createCollidingShipAsteroid, createCollidingBulletAsteroid } from '../../utils/TestHelpers';
import { SHIP_COLLISION_X, SHIP_COLLISION_RADIUS } from '../../../src/states/PlayingState';
import { SHIP_X_POSITION } from '../../../src/core/Constants';

describe('Collision Detection', () => {
    describe('Ship-Asteroid Collision Bounds', () => {
        it('should detect collision when ship and asteroid overlap', () => {
            const { ship, asteroid } = createCollidingShipAsteroid();
            const shipBounds = ship.getCollisionBounds();
            const asteroidBounds = asteroid.getCollisionBounds();
            
            expect(CollisionManager.checkBounds(shipBounds, asteroidBounds)).toBe(true);
        });

        it('should not detect collision when ship and asteroid are far apart', () => {
            const ship = createCollidingShipAsteroid().ship;
            const asteroid = createCollidingShipAsteroid().asteroid;
            asteroid.x = 0;
            asteroid.y = 0;
            
            const shipBounds = ship.getCollisionBounds();
            const asteroidBounds = asteroid.getCollisionBounds();
            
            expect(CollisionManager.checkBounds(shipBounds, asteroidBounds)).toBe(false);
        });

        it('should detect collision at exact boundary', () => {
            const ship = createCollidingShipAsteroid().ship;
            const asteroid = createCollidingShipAsteroid().asteroid;
            asteroid.size = 10;
            
            const shipCollisionX = ship.x - (SHIP_X_POSITION - SHIP_COLLISION_X);
            asteroid.x = shipCollisionX + SHIP_COLLISION_RADIUS + asteroid.size - 0.1;
            asteroid.y = ship.y;
            
            const shipBounds = ship.getCollisionBounds();
            const asteroidBounds = asteroid.getCollisionBounds();
            
            expect(CollisionManager.checkBounds(shipBounds, asteroidBounds)).toBe(true);
        });
    });

    describe('Bullet-Asteroid Collision Bounds', () => {
        it('should detect collision when bullet and asteroid overlap', () => {
            const { bullet, asteroid } = createCollidingBulletAsteroid();
            const bulletBounds = bullet.getCollisionBounds();
            const asteroidBounds = asteroid.getCollisionBounds();
            
            expect(CollisionManager.checkBounds(bulletBounds, asteroidBounds)).toBe(true);
        });

        it('should not detect collision when bullet and asteroid are far apart', () => {
            const bullet = createCollidingBulletAsteroid().bullet;
            const asteroid = createCollidingBulletAsteroid().asteroid;
            asteroid.x = 0;
            asteroid.y = 0;
            
            const bulletBounds = bullet.getCollisionBounds();
            const asteroidBounds = asteroid.getCollisionBounds();
            
            expect(CollisionManager.checkBounds(bulletBounds, asteroidBounds)).toBe(false);
        });
    });
});

