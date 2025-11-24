import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlayingState } from '../../../src/states/PlayingState';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';
import { Asteroid, AsteroidSize } from '../../../src/actors/Asteroid';
import { STARTING_LIVES } from '../../../src/states/PlayingState';

describe('Dynamic Spawning System', () => {
    let playingState: PlayingState;
    let input: MockInput;
    let mockGame: MockGame;
    let originalRandom: typeof Math.random;

    beforeEach(() => {
        input = new MockInput();
        playingState = new PlayingState(input);
        mockGame = new MockGame() as any;
        playingState.enter(mockGame as any);
        originalRandom = Math.random;
    });

    afterEach(() => {
        // Always restore Math.random after each test to ensure idempotency
        Math.random = originalRandom;
    });

    it('should track game time during gameplay', () => {
        playingState.update(mockGame as any, 0.5);
        expect(playingState['gameTime']).toBeCloseTo(0.5, 2);
        
        playingState.update(mockGame as any, 1.0);
        expect(playingState['gameTime']).toBeCloseTo(1.5, 2);
    });

    it('should not track game time during explosion', () => {
        playingState.explosionTimer = 1.0;
        const initialTime = playingState['gameTime'];
        
        playingState.update(mockGame as any, 0.5);
        
        expect(playingState['gameTime']).toBe(initialTime);
    });

    it('should calculate spawn interval correctly at start', () => {
        // At start (gameTime = 0), interval should be 3.0
        playingState['gameTime'] = 0;
        playingState['updateAsteroids'](0.1);
        
        // After timer expires, next interval should be 3.0
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        
        expect(playingState['asteroidTimer']).toBeCloseTo(3.0, 1);
    });

    it('should calculate spawn interval correctly at 1 minute', () => {
        // At 1 minute (60 seconds), interval should be 1.0
        playingState['gameTime'] = 60.0;
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        
        expect(playingState['asteroidTimer']).toBeCloseTo(1.0, 1);
    });

    it('should calculate spawn interval correctly at 2 minutes', () => {
        // At 2 minutes (120 seconds), interval should be 0.5
        playingState['gameTime'] = 120.0;
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        
        expect(playingState['asteroidTimer']).toBeCloseTo(0.5, 1);
    });

    it('should calculate spawn interval correctly at 3 minutes', () => {
        // At 3 minutes (180 seconds), interval should be 0.25
        playingState['gameTime'] = 180.0;
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        
        expect(playingState['asteroidTimer']).toBeCloseTo(0.25, 1);
    });

    it('should calculate spawn interval correctly at 1.5 minutes', () => {
        // At 1.5 minutes (90 seconds), interval should be halfway between 1.0 and 0.5: 0.75
        playingState['gameTime'] = 90.0;
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        
        expect(playingState['asteroidTimer']).toBeCloseTo(0.75, 1);
    });

    it('should cap spawn interval at 0.25 seconds after 3 minutes', () => {
        // After 3 minutes, interval should stay at 0.25
        playingState['gameTime'] = 200.0;
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        
        expect(playingState['asteroidTimer']).toBeCloseTo(0.25, 1);
    });

    it('should start with 10% large asteroid ratio', () => {
        // Mock Math.random to ensure deterministic behavior
        // With largeRatio = 0.1, remainingRatio = 0.9
        // smallRatio = 0.9 * (4/9) = 0.4, mediumRatio = 0.9 * (5/9) = 0.5
        // So: small < 0.4, medium < 0.9, large >= 0.9
        let callCount = 0;
        let asteroidIndex = 0;
        Math.random = vi.fn(() => {
            callCount++;
            // Call 1: Y position
            // Call 2: Size determination - alternate to get exactly 10% large
            if (callCount === 2) {
                // Every 10th asteroid should be large (asteroidIndex % 10 === 9)
                // Return 0.95 for large asteroids (>= 0.9), 0.5 for others (< 0.9)
                return (asteroidIndex % 10 === 9) ? 0.95 : 0.5;
            }
            // Call 3+: Speed, vertices, etc.
            return 0.5;
        });
        
        let largeCount = 0;
        const totalSamples = 20; // Reduced since we're testing deterministically
        
        for (let i = 0; i < totalSamples; i++) {
            callCount = 0; // Reset for each asteroid
            asteroidIndex = i;
            const asteroid = new Asteroid(undefined, undefined, undefined, undefined, undefined, 0.1);
            if (asteroid.asteroidSize === AsteroidSize.LARGE) {
                largeCount++;
            }
        }
        
        // With our mock, exactly 10% should be large (2 out of 20)
        const ratio = largeCount / totalSamples;
        expect(ratio).toBe(0.1);
    });

    it('should use 50% large asteroid ratio at 3 minutes', () => {
        // Mock Math.random to ensure deterministic behavior
        // With largeRatio = 0.5, remainingRatio = 0.5
        // smallRatio = 0.5 * (4/9) = 0.222..., mediumRatio = 0.5 * (5/9) = 0.277...
        // So: small < 0.222, medium < 0.5, large >= 0.5
        let callCount = 0;
        let asteroidIndex = 0;
        Math.random = vi.fn(() => {
            callCount++;
            // Call 1: Y position
            // Call 2: Size determination - alternate to get exactly 50% large
            if (callCount === 2) {
                // Alternate between large (>= 0.5) and small/medium (< 0.5)
                return (asteroidIndex % 2 === 0) ? 0.6 : 0.3; // Even = large, odd = small
            }
            // Call 3+: Speed, vertices, etc.
            return 0.5;
        });
        
        let largeCount = 0;
        const totalSamples = 20; // Reduced since we're testing deterministically
        
        for (let i = 0; i < totalSamples; i++) {
            callCount = 0; // Reset for each asteroid
            asteroidIndex = i;
            const asteroid = new Asteroid(undefined, undefined, undefined, undefined, undefined, 0.5);
            if (asteroid.asteroidSize === AsteroidSize.LARGE) {
                largeCount++;
            }
        }
        
        // With our mock, exactly 50% should be large (10 out of 20)
        const ratio = largeCount / totalSamples;
        expect(ratio).toBe(0.5);
    });

    it('should use 30% large asteroid ratio at 1.5 minutes', () => {
        // At 1.5 minutes, ratio should be halfway: 30%
        // (10% + (50% - 10%) * 0.5 = 30%)
        // Mock Math.random to ensure deterministic behavior
        // With largeRatio = 0.3, remainingRatio = 0.7
        // smallRatio = 0.7 * (4/9) = 0.311..., mediumRatio = 0.7 * (5/9) = 0.388...
        // So: small < 0.311, medium < 0.311+0.388=0.699, large >= 0.699
        let callCount = 0;
        Math.random = vi.fn(() => {
            callCount++;
            // Call 1: Y position (line 31)
            // Call 2: Size determination (line 37) - this is what we're testing
            // Call 3+: Speed, flash timer, vertex count, vertex radii
            if (callCount === 2) {
                return 0.7; // Should result in large asteroid (0.7 >= 0.699)
            }
            // For other calls (Y position, speed, vertices), return neutral values
            return 0.5;
        });
        
        let largeCount = 0;
        const totalSamples = 10; // Reduced since we're testing deterministically
        
        for (let i = 0; i < totalSamples; i++) {
            callCount = 0; // Reset for each asteroid
            const asteroid = new Asteroid(undefined, undefined, undefined, undefined, undefined, 0.3);
            if (asteroid.asteroidSize === AsteroidSize.LARGE) {
                largeCount++;
            }
        }
        
        // With our mock, all should be large (since 0.7 >= 0.699)
        expect(largeCount).toBe(totalSamples);
    });

    it('should subtract 1 minute from game time when a life is lost', () => {
        playingState['gameTime'] = 100.0;
        
        // Trigger ship explosion (which decrements lives)
        playingState['startExplosion'](mockGame as any);
        
        expect(playingState['gameTime']).toBe(40.0);
        expect(playingState.lives).toBeLessThan(STARTING_LIVES);
    });

    it('should adjust spawn interval when game time decreases after life loss', () => {
        // Advance game time to increase spawn rate
        playingState['gameTime'] = 90.0; // 1.5 minutes - should be 0.75 seconds
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        const fastInterval = playingState['asteroidTimer'];
        expect(fastInterval).toBeCloseTo(0.75, 1);
        
        // Lose a life - game time decreases by 60 seconds (90 - 60 = 30)
        playingState['startExplosion'](mockGame as any);
        expect(playingState['gameTime']).toBe(30.0);
        
        // Next spawn should use interval for 30 seconds
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        // At 30 seconds: t = 30/60 = 0.5, interval = 3.0 - (3.0 - 1.0) * 0.5 = 2.0
        expect(playingState['asteroidTimer']).toBeCloseTo(2.0, 1);
    });

    it('should sync asteroid timer when significantly out of sync', () => {
        // Set game time to 2 minutes (should have spawn interval ~0.5s)
        playingState['gameTime'] = 120.0;
        // Set asteroid timer to something way out of sync (10 seconds)
        playingState['asteroidTimer'] = 10.0;
        
        playingState['updateAsteroids'](0.1);
        
        // Timer should be reset to current spawn interval (~0.5s)
        expect(playingState['asteroidTimer']).toBeLessThan(1.0);
    });

    it('should handle spawn interval at exact boundary times', () => {
        // Test at exactly 60 seconds
        playingState['gameTime'] = 60.0;
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        expect(playingState['asteroidTimer']).toBeCloseTo(1.0, 1);
        
        // Test at exactly 120 seconds
        playingState['gameTime'] = 120.0;
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        expect(playingState['asteroidTimer']).toBeCloseTo(0.5, 1);
        
        // Test at exactly 180 seconds
        playingState['gameTime'] = 180.0;
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        expect(playingState['asteroidTimer']).toBeCloseTo(0.25, 1);
    });

    it('should handle spawn interval beyond 3 minutes', () => {
        playingState['gameTime'] = 300.0; // 5 minutes
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        
        // Should stay at 0.25 seconds (max spawn rate)
        expect(playingState['asteroidTimer']).toBeCloseTo(0.25, 1);
    });
});

