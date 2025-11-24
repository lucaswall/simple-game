import { describe, it, expect } from 'vitest';
import { createCollidingShipAsteroid, createCollidingBulletAsteroid } from '../../utils/TestHelpers';
import { SHIP_COLLISION_X, SHIP_COLLISION_RADIUS } from '../../../src/states/PlayingState';
import { SHIP_X_POSITION } from '../../../src/Constants';

describe('Collision Detection', () => {
    describe('Ship-Asteroid Collision', () => {
        it('should detect collision when ship and asteroid overlap', () => {
            const { ship, asteroid } = createCollidingShipAsteroid();
            const shipCollisionX = ship.x - (SHIP_X_POSITION - SHIP_COLLISION_X);
            const dx = asteroid.x - shipCollisionX;
            const dy = asteroid.y - ship.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const collisionRadius = asteroid.size + SHIP_COLLISION_RADIUS;
            
            expect(distance).toBeLessThan(collisionRadius);
        });

        it('should not detect collision when ship and asteroid are far apart', () => {
            const ship = createCollidingShipAsteroid().ship;
            const asteroid = createCollidingShipAsteroid().asteroid;
            asteroid.x = 0;
            asteroid.y = 0;
            
            const shipCollisionX = ship.x - (SHIP_X_POSITION - SHIP_COLLISION_X);
            const dx = asteroid.x - shipCollisionX;
            const dy = asteroid.y - ship.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const collisionRadius = asteroid.size + SHIP_COLLISION_RADIUS;
            
            expect(distance).toBeGreaterThan(collisionRadius);
        });

        it('should detect collision at exact boundary', () => {
            const ship = createCollidingShipAsteroid().ship;
            const asteroid = createCollidingShipAsteroid().asteroid;
            asteroid.size = 10;
            
            const shipCollisionX = ship.x - (SHIP_X_POSITION - SHIP_COLLISION_X);
            asteroid.x = shipCollisionX + SHIP_COLLISION_RADIUS + asteroid.size - 0.1;
            asteroid.y = ship.y;
            
            const dx = asteroid.x - shipCollisionX;
            const dy = asteroid.y - ship.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const collisionRadius = asteroid.size + SHIP_COLLISION_RADIUS;
            
            expect(distance).toBeLessThan(collisionRadius);
        });
    });

    describe('Bullet-Asteroid Collision', () => {
        it('should detect collision when bullet and asteroid overlap', () => {
            const { bullet, asteroid } = createCollidingBulletAsteroid();
            const dx = asteroid.x - bullet.x;
            const dy = asteroid.y - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const collisionRadius = asteroid.size + bullet.size;
            
            expect(distance).toBeLessThan(collisionRadius);
        });

        it('should not detect collision when bullet and asteroid are far apart', () => {
            const bullet = createCollidingBulletAsteroid().bullet;
            const asteroid = createCollidingBulletAsteroid().asteroid;
            asteroid.x = 0;
            asteroid.y = 0;
            
            const dx = asteroid.x - bullet.x;
            const dy = asteroid.y - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const collisionRadius = asteroid.size + bullet.size;
            
            expect(distance).toBeGreaterThan(collisionRadius);
        });
    });
});

