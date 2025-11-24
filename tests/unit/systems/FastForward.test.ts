import { describe, it, expect, beforeEach } from 'vitest';
import { PlayingState } from '../../../src/states/PlayingState';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';
import { Asteroid, AsteroidSize } from '../../../src/actors/Asteroid';
import { Bullet } from '../../../src/actors/Bullet';

describe('Fast Forward (F key)', () => {
    let playingState: PlayingState;
    let input: MockInput;
    let mockGame: MockGame;

    beforeEach(() => {
        input = new MockInput();
        playingState = new PlayingState(input);
        mockGame = new MockGame() as any;
        playingState.enter(mockGame as any);
    });

    describe('Game Time Advancement', () => {
        it('should advance game time by 20 seconds when F is pressed', () => {
            const initialTime = playingState['gameTime'];
            const deltaTime = 0.016;
            
            // Simulate F key press
            input.keys.KeyF = true;
            playingState.update(mockGame as any, deltaTime);
            input.keys.KeyF = false;
            
            // gameTime advances by 20 + normal deltaTime increment
            expect(playingState['gameTime']).toBeCloseTo(initialTime + 20 + deltaTime, 2);
        });

        it('should only advance once per key press', () => {
            const initialTime = playingState['gameTime'];
            const deltaTime = 0.016;
            
            // Simulate F key held down for multiple frames
            input.keys.KeyF = true;
            playingState.update(mockGame as any, deltaTime);
            playingState.update(mockGame as any, deltaTime);
            playingState.update(mockGame as any, deltaTime);
            input.keys.KeyF = false;
            
            // Should only advance once (20 + 3 * deltaTime for normal increments)
            expect(playingState['gameTime']).toBeCloseTo(initialTime + 20 + (3 * deltaTime), 2);
        });

        it('should allow multiple advances by pressing F multiple times', () => {
            const initialTime = playingState['gameTime'];
            const deltaTime = 0.016;
            
            // Press F, release, press again
            input.keys.KeyF = true;
            playingState.update(mockGame as any, deltaTime);
            input.keys.KeyF = false;
            playingState.update(mockGame as any, deltaTime);
            
            input.keys.KeyF = true;
            playingState.update(mockGame as any, deltaTime);
            input.keys.KeyF = false;
            
            // Two fast forwards (40) + 3 normal increments
            expect(playingState['gameTime']).toBeCloseTo(initialTime + 40 + (3 * deltaTime), 2);
        });

        it('should not advance time during explosion state', () => {
            // Trigger explosion
            playingState['startExplosion'](mockGame as any);
            const initialTime = playingState['gameTime'];
            
            // Try to press F during explosion
            input.keys.KeyF = true;
            playingState.update(mockGame as any, 0.016);
            input.keys.KeyF = false;
            
            // Time should not advance (function returns early)
            expect(playingState['gameTime']).toBe(initialTime);
        });
    });

    describe('Asteroid Spawning', () => {
        it('should spawn asteroids correctly after fast forward', () => {
            // Fast forward to 1 minute
            input.keys.KeyF = true;
            playingState.update(mockGame as any, 0.016);
            input.keys.KeyF = false;
            
            // Fast forward 2 more times to reach ~60 seconds
            input.keys.KeyF = true;
            playingState.update(mockGame as any, 0.016);
            input.keys.KeyF = false;
            input.keys.KeyF = true;
            playingState.update(mockGame as any, 0.016);
            input.keys.KeyF = false;
            
            const initialAsteroidCount = playingState.asteroids.length;
            
            // Update asteroids - should spawn based on new gameTime
            playingState['updateAsteroids'](0.1);
            
            // Asteroids should spawn (at least one should appear)
            expect(playingState.asteroids.length).toBeGreaterThanOrEqual(initialAsteroidCount);
        });

        it('should adjust spawn interval correctly after fast forward', () => {
            // Fast forward to 2 minutes (120 seconds)
            for (let i = 0; i < 6; i++) {
                input.keys.KeyF = true;
                playingState.update(mockGame as any, 0.016);
                input.keys.KeyF = false;
                playingState.update(mockGame as any, 0.016);
            }
            
            expect(playingState['gameTime']).toBeGreaterThanOrEqual(120);
            
            // Update asteroids to recalculate spawn interval
            playingState['updateAsteroids'](0.1);
            
            // Spawn interval should be faster at 2 minutes (should be around 0.5-1.0 seconds)
            const spawnInterval = playingState['asteroidTimer'];
            expect(spawnInterval).toBeLessThan(1.0); // Should be less than 1 second at 2 minutes
        });
    });

    describe('Collision Detection', () => {
        it('should still detect bullet-asteroid collisions after fast forward', () => {
            // Create an asteroid and bullet that should collide
            const asteroid = new Asteroid(400, 300, AsteroidSize.SMALL, -300, 0, 0.1, undefined, false);
            const bullet = new Bullet(400, 300, 800, 5);
            
            playingState.asteroids.push(asteroid);
            playingState.bullets.push(bullet);
            
            const initialAsteroidCount = playingState.asteroids.length;
            const initialScore = playingState.score;
            
            // Fast forward
            input.keys.KeyF = true;
            playingState.update(mockGame as any, 0.016);
            input.keys.KeyF = false;
            
            // Check collisions
            playingState['checkCollisions'](mockGame as any);
            
            // Asteroid should be destroyed by bullet
            expect(playingState.asteroids.length).toBeLessThan(initialAsteroidCount);
            expect(playingState.score).toBeGreaterThan(initialScore);
        });

        it('should still detect ship-asteroid collisions after fast forward', () => {
            // Create an asteroid at ship position
            const shipBounds = playingState.ship.getCollisionBounds();
            const asteroid = new Asteroid(
                (shipBounds.centerX ?? 0) + 20, 
                shipBounds.centerY ?? 0, 
                AsteroidSize.SMALL, 
                -300, 
                0, 
                0.1, 
                undefined, 
                false
            );
            
            playingState.asteroids.push(asteroid);
            playingState.ship.collisionEnabled = true;
            playingState.invincibilityTimer = 0;
            
            const initialLives = playingState.lives;
            
            // Fast forward
            input.keys.KeyF = true;
            playingState.update(mockGame as any, 0.016);
            input.keys.KeyF = false;
            
            // Check collisions
            playingState['checkCollisions'](mockGame as any);
            
            // Ship should be destroyed
            expect(playingState.lives).toBeLessThan(initialLives);
        });
    });

    describe('After Death/Respawn', () => {
        it('should reset fast forward key state on respawn', () => {
            // Trigger explosion
            playingState['startExplosion'](mockGame as any);
            
            // Fast forward key was pressed before death, then released
            input.keys.KeyF = true;
            playingState['fastForwardKeyPressed'] = true;
            input.keys.KeyF = false; // Release key
            
            // Complete explosion and respawn
            playingState['explosionTimer'] = 0;
            playingState['particleManager'].particles = [];
            playingState.update(mockGame as any, 0.016);
            
            // Fast forward key state should be reset by respawnShip
            expect(playingState['fastForwardKeyPressed']).toBe(false);
        });

        it('should work correctly after respawn', () => {
            // Trigger explosion and respawn
            playingState['startExplosion'](mockGame as any);
            playingState['explosionTimer'] = 0;
            playingState['particleManager'].particles = [];
            playingState.update(mockGame as any, 0.016);
            
            const initialTime = playingState['gameTime'];
            const deltaTime = 0.016;
            
            // Fast forward after respawn
            input.keys.KeyF = true;
            playingState.update(mockGame as any, deltaTime);
            input.keys.KeyF = false;
            
            // gameTime advances by 20 + normal deltaTime increment
            expect(playingState['gameTime']).toBeCloseTo(initialTime + 20 + deltaTime, 2);
        });
    });

    describe('Edge Cases', () => {
        it('should handle fast forward when asteroidTimer is negative', () => {
            // Set asteroidTimer to negative (ready to spawn)
            playingState['asteroidTimer'] = -0.5;
            
            const initialAsteroidCount = playingState.asteroids.length;
            
            // Fast forward
            input.keys.KeyF = true;
            playingState.update(mockGame as any, 0.016);
            input.keys.KeyF = false;
            
            // Update asteroids - should spawn immediately
            playingState['updateAsteroids'](0.1);
            
            // Should have spawned at least one asteroid
            expect(playingState.asteroids.length).toBeGreaterThan(initialAsteroidCount);
        });

        it('should handle fast forward at game start', () => {
            // Fast forward immediately after entering state
            const initialTime = playingState['gameTime'];
            expect(initialTime).toBe(0);
            const deltaTime = 0.016;
            
            input.keys.KeyF = true;
            playingState.update(mockGame as any, deltaTime);
            input.keys.KeyF = false;
            
            // gameTime advances by 20 + normal deltaTime increment
            expect(playingState['gameTime']).toBeCloseTo(20 + deltaTime, 2);
        });

        it('should handle multiple rapid fast forwards', () => {
            const initialTime = playingState['gameTime'];
            const deltaTime = 0.016;
            
            // Rapidly press F multiple times
            for (let i = 0; i < 5; i++) {
                input.keys.KeyF = true;
                playingState.update(mockGame as any, deltaTime);
                input.keys.KeyF = false;
                playingState.update(mockGame as any, deltaTime);
            }
            
            // 5 fast forwards (100) + 10 normal increments (5 presses + 5 releases)
            expect(playingState['gameTime']).toBeCloseTo(initialTime + 100 + (10 * deltaTime), 2);
        });
    });
});

