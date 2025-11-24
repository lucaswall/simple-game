import { describe, it, expect, beforeEach } from 'vitest';
import { PlayingState } from '../../../src/states/PlayingState';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';
import { createCollidingShipAsteroid } from '../../utils/TestHelpers';
import { STARTING_LIVES, INVINCIBILITY_DURATION } from '../../../src/states/PlayingState';
import { SHIP_X_POSITION } from '../../../src/core/Constants';
import { PLAY_AREA_HEIGHT } from '../../../src/states/PlayingState';

describe('Lives System', () => {
    let playingState: PlayingState;
    let input: MockInput;
    let mockGame: MockGame;

    beforeEach(() => {
        input = new MockInput();
        playingState = new PlayingState(input);
        mockGame = new MockGame() as any;
        playingState.enter(mockGame as any);
    });

    it('should start with correct number of lives', () => {
        expect(playingState.lives).toBe(STARTING_LIVES);
    });

    it('should decrement lives when ship collides with asteroid', () => {
        const { ship, asteroid } = createCollidingShipAsteroid();
        playingState.ship = ship;
        playingState.asteroids.push(asteroid);
        
        const initialLives = playingState.lives;
        playingState['checkCollisions'](mockGame as any);
        
        expect(playingState.lives).toBe(initialLives - 1);
    });

    it('should disable collisions when ship is hit', () => {
        const { ship, asteroid } = createCollidingShipAsteroid();
        playingState.ship = ship;
        playingState.asteroids.push(asteroid);
        
        playingState['checkCollisions'](mockGame as any);
        
        // Collision should disable collisions immediately
        expect(playingState.ship.collisionEnabled).toBe(false);
    });

    it('should respawn ship when lives > 0', () => {
        playingState.lives = 2;
        playingState['startExplosion'](mockGame as any);
        // Fast-forward explosion timer to trigger respawn
        // Set explosion timer to just above 0, then update to trigger respawn
        playingState.explosionTimer = 0.05;
        playingState.particleManager.particles = [];
        
        // Update to decrement explosion timer and trigger respawn
        playingState.update(mockGame as any, 0.1);
        
        // After explosion completes, ship should be respawned
        expect(playingState.ship.x).toBe(SHIP_X_POSITION);
        expect(playingState.ship.y).toBe(PLAY_AREA_HEIGHT / 2);
        expect(playingState.ship.visible).toBe(true);
        expect(playingState.ship.controllable).toBe(true);
    });

    it('should start invincibility period after respawn', () => {
        playingState.lives = 2;
        playingState['startExplosion'](mockGame as any);
        // Fast-forward explosion timer to trigger respawn
        playingState.explosionTimer = 0.05;
        playingState.particleManager.particles = [];
        
        // Update to trigger respawn
        playingState.update(mockGame as any, 0.1);
        
        // After respawn, invincibility should be active
        expect(playingState['invincibilityTimer']).toBe(INVINCIBILITY_DURATION);
        expect(playingState.ship.collisionEnabled).toBe(false);
    });

    it('should transition to game over when lives reach 0', () => {
        playingState.lives = 1;
        const { ship, asteroid } = createCollidingShipAsteroid();
        playingState.ship = ship;
        playingState.ship.visible = true;
        playingState.ship.collisionEnabled = true;
        playingState.asteroids.push(asteroid);
        
        playingState['checkCollisions'](mockGame as any);
        // Trigger explosion callback (startExplosion decrements lives to 0)
        const freezeCallbacks = mockGame.getFreezeCallbacks();
        if (freezeCallbacks.length > 0 && freezeCallbacks[0].callback) {
            freezeCallbacks[0].callback!();
        }
        // Fast-forward explosion timer to trigger game over
        playingState.explosionTimer = 0.05;
        playingState.particleManager.particles = [];
        
        // Update to trigger game over transition
        playingState.update(mockGame as any, 0.1);
        
        expect(mockGame.getStateTransitions().length).toBeGreaterThan(0);
    });

    it('should reset lives when entering playing state', () => {
        playingState.lives = 0;
        playingState.enter(mockGame as any);
        expect(playingState.lives).toBe(STARTING_LIVES);
    });

    it('should reset game time when a life is lost', () => {
        playingState['gameTime'] = 100.0;
        playingState['startExplosion'](mockGame as any);
        
        expect(playingState['gameTime']).toBe(0);
    });

    it('should reset spawn interval when game time resets after life loss', () => {
        // Advance game time to increase spawn rate
        playingState['gameTime'] = 90.0; // 1.5 minutes - spawn interval should be 0.75
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        expect(playingState['asteroidTimer']).toBeCloseTo(0.75, 1);
        
        // Lose a life - game time should reset
        playingState['startExplosion'](mockGame as any);
        expect(playingState['gameTime']).toBe(0);
        
        // Next spawn should use initial interval (3.0)
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        expect(playingState['asteroidTimer']).toBeCloseTo(3.0, 1);
    });
});

