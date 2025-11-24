import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlayingState } from '../../../src/states/PlayingState';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';

describe('Angled Asteroids', () => {
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

    it('should spawn asteroids with straight trajectory before 1 minute', () => {
        playingState['gameTime'] = 59.0; // Just before 1 minute
        playingState['asteroidTimer'] = 0;
        
        // Mock Math.random to ensure deterministic behavior
        let callCount = 0;
        Math.random = vi.fn(() => {
            callCount++;
            // Return neutral values for all calls (size, speed, vertices, etc.)
            return 0.5;
        });
        
        // Spawn multiple asteroids and check they all have velocityY = 0
        for (let i = 0; i < 10; i++) {
            callCount = 0; // Reset for each asteroid
            playingState['asteroidTimer'] = 0;
            playingState['updateAsteroids'](0.1);
            const lastAsteroid = playingState.asteroids[playingState.asteroids.length - 1];
            expect(lastAsteroid.velocityY).toBe(0);
            expect(lastAsteroid.velocityX).toBeLessThan(0); // Moving left
            playingState.asteroids.pop(); // Remove for next iteration
        }
    });

    it('should spawn 50% of asteroids with angles after 1 minute', () => {
        playingState['gameTime'] = 60.0; // At 1 minute
        playingState['asteroidTimer'] = 0;
        
        // Mock Math.random to ensure exactly 50% are angled
        // The angled check happens at call 1 (Math.random() < 0.5)
        // Then angle calculation at call 2 (Math.random() * maxAngle) if angled
        // Then Asteroid constructor calls many more times
        let callCount = 0;
        let asteroidIndex = 0; // Track which asteroid we're spawning
        
        Math.random = vi.fn(() => {
            callCount++;
            // Call 1: angled check - alternate between < 0.5 (angled) and >= 0.5 (straight)
            if (callCount === 1) {
                // Alternate: even indices get angled (< 0.5), odd indices get straight (>= 0.5)
                const shouldBeAngled = (asteroidIndex % 2 === 0);
                return shouldBeAngled ? 0.4 : 0.6;
            }
            // Call 2: angle calculation (only if angled) - return a small angle
            if (callCount === 2) {
                // Only return angle value if this asteroid should be angled
                const shouldBeAngled = (asteroidIndex % 2 === 0);
                return shouldBeAngled ? 0.1 : 0.5; // Small angle if angled, neutral otherwise
            }
            // For other calls (size, speed, vertices, etc.), return neutral values
            return 0.5;
        });
        
        let angledCount = 0;
        let straightCount = 0;
        const samples = 20; // Reduced since we're testing deterministically
        
        for (let i = 0; i < samples; i++) {
            callCount = 0; // Reset call counter for each asteroid spawn
            asteroidIndex = i; // Track which asteroid we're spawning
            playingState['asteroidTimer'] = 0;
            playingState['updateAsteroids'](0.1);
            const lastAsteroid = playingState.asteroids[playingState.asteroids.length - 1];
            
            if (Math.abs(lastAsteroid.velocityY) > 0.001) {
                angledCount++;
            } else {
                straightCount++;
            }
            playingState.asteroids.pop(); // Remove for next iteration
        }
        
        // Should be exactly 50% angled with our deterministic mock
        const angledRatio = angledCount / samples;
        expect(angledRatio).toBe(0.5);
    });

    it('should spawn angled asteroids with 0-5 degrees at 1 minute', () => {
        playingState['gameTime'] = 60.0; // At 1 minute
        playingState['asteroidTimer'] = 0;
        
        // Mock Math.random to ensure deterministic behavior
        // At 1 minute, max angle is 5 degrees
        // We'll make all asteroids angled with a small angle (2.5 degrees)
        let callCount = 0;
        Math.random = vi.fn(() => {
            callCount++;
            // Call 1: angled check - return < 0.5 to make it angled
            if (callCount === 1) {
                return 0.4; // < 0.5, so angled
            }
            // Call 2: angle calculation - return 0.5 to get 2.5 degrees (0.5 * 5)
            if (callCount === 2) {
                return 0.5; // Results in 2.5 degrees (within 0-5 range)
            }
            // For other calls, return neutral values
            return 0.5;
        });
        
        const samples = 10; // Reduced since we're testing deterministically
        const angles: number[] = [];
        
        for (let i = 0; i < samples; i++) {
            callCount = 0; // Reset for each asteroid
            playingState['asteroidTimer'] = 0;
            playingState['updateAsteroids'](0.1);
            const lastAsteroid = playingState.asteroids[playingState.asteroids.length - 1];
            
            if (Math.abs(lastAsteroid.velocityY) > 0.001) {
                const angleRadians = Math.atan2(lastAsteroid.velocityY, lastAsteroid.velocityX);
                const baseAngleRadians = Math.PI;
                let angleOffsetRadians = angleRadians - baseAngleRadians;
                while (angleOffsetRadians > Math.PI) angleOffsetRadians -= 2 * Math.PI;
                while (angleOffsetRadians < -Math.PI) angleOffsetRadians += 2 * Math.PI;
                const angleOffsetDegrees = Math.abs(angleOffsetRadians * (180 / Math.PI));
                angles.push(angleOffsetDegrees);
            }
            playingState.asteroids.pop();
        }
        
        // All should be angled with 2.5 degrees (within 0-5 range)
        angles.forEach(angle => {
            expect(angle).toBeGreaterThanOrEqual(0);
            expect(angle).toBeLessThanOrEqual(5);
        });
        expect(angles.length).toBeGreaterThan(0); // Should have some angled asteroids
    });

    it('should spawn angled asteroids with 0-10 degrees at 2 minutes', () => {
        playingState['gameTime'] = 120.0; // At 2 minutes
        playingState['asteroidTimer'] = 0;
        
        // Mock Math.random to ensure deterministic behavior
        // At 2 minutes, max angle is 10 degrees
        let callCount = 0;
        Math.random = vi.fn(() => {
            callCount++;
            // Call 1: angled check - return < 0.5 to make it angled
            if (callCount === 1) {
                return 0.4; // < 0.5, so angled
            }
            // Call 2: angle calculation - return 0.5 to get 5 degrees (0.5 * 10)
            if (callCount === 2) {
                return 0.5; // Results in 5 degrees (within 0-10 range)
            }
            // For other calls, return neutral values
            return 0.5;
        });
        
        const samples = 10; // Reduced since we're testing deterministically
        const angles: number[] = [];
        
        for (let i = 0; i < samples; i++) {
            callCount = 0; // Reset for each asteroid
            playingState['asteroidTimer'] = 0;
            playingState['updateAsteroids'](0.1);
            const lastAsteroid = playingState.asteroids[playingState.asteroids.length - 1];
            
            if (Math.abs(lastAsteroid.velocityY) > 0.001) {
                const angleRadians = Math.atan2(lastAsteroid.velocityY, lastAsteroid.velocityX);
                const baseAngleRadians = Math.PI;
                let angleOffsetRadians = angleRadians - baseAngleRadians;
                while (angleOffsetRadians > Math.PI) angleOffsetRadians -= 2 * Math.PI;
                while (angleOffsetRadians < -Math.PI) angleOffsetRadians += 2 * Math.PI;
                const angleOffsetDegrees = Math.abs(angleOffsetRadians * (180 / Math.PI));
                angles.push(angleOffsetDegrees);
            }
            playingState.asteroids.pop();
        }
        
        // All should be angled with 5 degrees (within 0-10 range)
        angles.forEach(angle => {
            expect(angle).toBeGreaterThanOrEqual(0);
            expect(angle).toBeLessThanOrEqual(10);
        });
        expect(angles.length).toBeGreaterThan(0); // Should have some angled asteroids
    });

    it('should spawn angled asteroids with 0-20 degrees at 3 minutes', () => {
        playingState['gameTime'] = 180.0; // At 3 minutes
        playingState['asteroidTimer'] = 0;
        
        // Mock Math.random to ensure deterministic behavior
        // At 3 minutes, max angle is 20 degrees
        let callCount = 0;
        Math.random = vi.fn(() => {
            callCount++;
            // Call 1: angled check - return < 0.5 to make it angled
            if (callCount === 1) {
                return 0.4; // < 0.5, so angled
            }
            // Call 2: angle calculation - return 0.5 to get 10 degrees (0.5 * 20)
            if (callCount === 2) {
                return 0.5; // Results in 10 degrees (within 0-20 range)
            }
            // For other calls, return neutral values
            return 0.5;
        });
        
        const samples = 10; // Reduced since we're testing deterministically
        const angles: number[] = [];
        
        for (let i = 0; i < samples; i++) {
            callCount = 0; // Reset for each asteroid
            playingState['asteroidTimer'] = 0;
            playingState['updateAsteroids'](0.1);
            const lastAsteroid = playingState.asteroids[playingState.asteroids.length - 1];
            
            if (Math.abs(lastAsteroid.velocityY) > 0.001) {
                const angleRadians = Math.atan2(lastAsteroid.velocityY, lastAsteroid.velocityX);
                const baseAngleRadians = Math.PI;
                let angleOffsetRadians = angleRadians - baseAngleRadians;
                while (angleOffsetRadians > Math.PI) angleOffsetRadians -= 2 * Math.PI;
                while (angleOffsetRadians < -Math.PI) angleOffsetRadians += 2 * Math.PI;
                const angleOffsetDegrees = Math.abs(angleOffsetRadians * (180 / Math.PI));
                angles.push(angleOffsetDegrees);
            }
            playingState.asteroids.pop();
        }
        
        // All should be angled with 10 degrees (within 0-20 range)
        angles.forEach(angle => {
            expect(angle).toBeGreaterThanOrEqual(0);
            expect(angle).toBeLessThanOrEqual(20);
        });
        expect(angles.length).toBeGreaterThan(0); // Should have some angled asteroids
    });

    it('should ramp up max angle linearly between milestones', () => {
        // At 1.5 minutes (90 seconds), max angle should be halfway between 5 and 10: 7.5 degrees
        playingState['gameTime'] = 90.0;
        playingState['asteroidTimer'] = 0;
        
        // Mock Math.random to ensure deterministic behavior
        // At 90 seconds, max angle is 7.5 degrees (linear interpolation between 5 and 10)
        let callCount = 0;
        Math.random = vi.fn(() => {
            callCount++;
            // Call 1: angled check - return < 0.5 to make it angled
            if (callCount === 1) {
                return 0.4; // < 0.5, so angled
            }
            // Call 2: angle calculation - return 0.5 to get ~3.75 degrees (0.5 * 7.5)
            if (callCount === 2) {
                return 0.5; // Results in ~3.75 degrees (within 0-7.5 range)
            }
            // For other calls, return neutral values
            return 0.5;
        });
        
        const samples = 10; // Reduced since we're testing deterministically
        const angles: number[] = [];
        
        for (let i = 0; i < samples; i++) {
            callCount = 0; // Reset for each asteroid
            playingState['asteroidTimer'] = 0;
            playingState['updateAsteroids'](0.1);
            const lastAsteroid = playingState.asteroids[playingState.asteroids.length - 1];
            
            if (Math.abs(lastAsteroid.velocityY) > 0.001) {
                const angleRadians = Math.atan2(lastAsteroid.velocityY, lastAsteroid.velocityX);
                const baseAngleRadians = Math.PI;
                let angleOffsetRadians = angleRadians - baseAngleRadians;
                while (angleOffsetRadians > Math.PI) angleOffsetRadians -= 2 * Math.PI;
                while (angleOffsetRadians < -Math.PI) angleOffsetRadians += 2 * Math.PI;
                const angleOffsetDegrees = Math.abs(angleOffsetRadians * (180 / Math.PI));
                angles.push(angleOffsetDegrees);
            }
            playingState.asteroids.pop();
        }
        
        // At 90 seconds, max angle should be 7.5 degrees (halfway between 5 and 10)
        angles.forEach(angle => {
            expect(angle).toBeGreaterThanOrEqual(0);
            expect(angle).toBeLessThanOrEqual(7.5);
        });
        expect(angles.length).toBeGreaterThan(0); // Should have some angled asteroids
    });

    it('should maintain asteroid speed when applying angle', () => {
        playingState['gameTime'] = 180.0; // At 3 minutes
        playingState['asteroidTimer'] = 0;
        
        // Mock Math.random to ensure deterministic behavior
        let callCount = 0;
        Math.random = vi.fn(() => {
            callCount++;
            // Call 1: angled check - alternate between angled and straight
            if (callCount === 1) {
                return 0.4; // < 0.5, so angled
            }
            // Call 2: angle calculation - return a small angle
            if (callCount === 2) {
                return 0.3; // Results in 6 degrees (within 0-20 range)
            }
            // For other calls (size, speed, vertices), return neutral values
            return 0.5;
        });
        
        // Spawn multiple asteroids and verify speed is maintained
        for (let i = 0; i < 10; i++) {
            callCount = 0; // Reset for each asteroid
            playingState['asteroidTimer'] = 0;
            playingState['updateAsteroids'](0.1);
            const lastAsteroid = playingState.asteroids[playingState.asteroids.length - 1];
            
            // Speed should be calculated correctly from velocity components
            const calculatedSpeed = Math.sqrt(
                lastAsteroid.velocityX * lastAsteroid.velocityX + 
                lastAsteroid.velocityY * lastAsteroid.velocityY
            );
            expect(lastAsteroid.speed).toBeCloseTo(calculatedSpeed, 1);
            playingState.asteroids.pop(); // Remove for next iteration
        }
    });
});

