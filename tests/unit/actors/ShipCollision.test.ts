import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ship } from '../../../src/actors/Ship';
import { Asteroid } from '../../../src/actors/Asteroid';
import { Bullet } from '../../../src/actors/Bullet';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';
import { ParticleManager } from '../../../src/managers/ParticleManager';
import { CollisionContext } from '../../../src/interfaces/Collidable';
import { SHIP_X_POSITION } from '../../../src/core/Constants';
import { SHIP_COLLISION_X, SHIP_COLLISION_RADIUS, HIT_FREEZE_DURATION, SHAKE_INTENSITY_SHIP_HIT } from '../../../src/states/PlayingState';

describe('Ship Collision', () => {
    let ship: Ship;
    let input: MockInput;
    let mockGame: MockGame;
    let context: CollisionContext;

    beforeEach(() => {
        input = new MockInput();
        ship = new Ship(input, []);
        mockGame = new MockGame() as any;
        
        context = {
            game: mockGame as any,
            particleManager: new ParticleManager(),
            onShipDestroyed: vi.fn()
        };
    });

    describe('getCollisionBounds', () => {
        it('should return correct collision bounds', () => {
            ship.x = SHIP_X_POSITION;
            ship.y = 100;
            
            const bounds = ship.getCollisionBounds();
            
            expect(bounds.type).toBe('circle');
            expect(bounds.centerX).toBe(SHIP_X_POSITION - (SHIP_X_POSITION - SHIP_COLLISION_X));
            expect(bounds.centerY).toBe(100);
            expect(bounds.radius).toBe(SHIP_COLLISION_RADIUS);
        });
    });

    describe('canCollideWith', () => {
        it('should allow collision with asteroid when enabled and visible', () => {
            ship.collisionEnabled = true;
            ship.visible = true;
            const asteroid = new Asteroid();
            
            expect(ship.canCollideWith(asteroid)).toBe(true);
        });

        it('should not allow collision when collision is disabled', () => {
            ship.collisionEnabled = false;
            ship.visible = true;
            const asteroid = new Asteroid();
            
            expect(ship.canCollideWith(asteroid)).toBe(false);
        });

        it('should not allow collision when ship is not visible', () => {
            ship.collisionEnabled = true;
            ship.visible = false;
            const asteroid = new Asteroid();
            
            expect(ship.canCollideWith(asteroid)).toBe(false);
        });

        it('should not allow collision with bullet', () => {
            ship.collisionEnabled = true;
            ship.visible = true;
            const bullet = new Bullet(100, 100, 800, 5);
            
            expect(ship.canCollideWith(bullet)).toBe(false);
        });
    });

    describe('onCollision', () => {
        it('should disable collisions when colliding with asteroid', () => {
            ship.collisionEnabled = true;
            const asteroid = new Asteroid();
            
            ship.onCollision(asteroid, context);
            
            expect(ship.collisionEnabled).toBe(false);
        });

        it('should set shake intensity on collision', () => {
            ship.collisionEnabled = true;
            const asteroid = new Asteroid();
            
            ship.onCollision(asteroid, context);
            
            expect(mockGame.shakeIntensity).toBe(SHAKE_INTENSITY_SHIP_HIT);
        });

        it('should trigger freeze on collision', () => {
            ship.collisionEnabled = true;
            const asteroid = new Asteroid();
            
            ship.onCollision(asteroid, context);
            
            const freezeCallbacks = mockGame.getFreezeCallbacks();
            expect(freezeCallbacks.length).toBeGreaterThan(0);
            expect(freezeCallbacks[0].duration).toBe(HIT_FREEZE_DURATION);
        });

        it('should call onShipDestroyed callback after freeze', () => {
            ship.collisionEnabled = true;
            const asteroid = new Asteroid();
            
            ship.onCollision(asteroid, context);
            
            const freezeCallbacks = mockGame.getFreezeCallbacks();
            if (freezeCallbacks.length > 0 && freezeCallbacks[0].callback) {
                freezeCallbacks[0].callback!();
            }
            
            expect(context.onShipDestroyed).toHaveBeenCalled();
        });

        it('should not do anything when colliding with non-asteroid', () => {
            ship.collisionEnabled = true;
            const bullet = new Bullet(100, 100, 800, 5);
            const initialShake = mockGame.shakeIntensity;
            
            ship.onCollision(bullet, context);
            
            expect(mockGame.shakeIntensity).toBe(initialShake);
            expect(ship.collisionEnabled).toBe(true);
        });
    });
});

