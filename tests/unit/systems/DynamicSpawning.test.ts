import { describe, it, expect, beforeEach } from 'vitest';
import { PlayingState } from '../../../src/states/PlayingState';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';
import { Asteroid, AsteroidSize } from '../../../src/actors/Asteroid';
import { STARTING_LIVES } from '../../../src/states/PlayingState';

describe('Dynamic Spawning System', () => {
    let playingState: PlayingState;
    let input: MockInput;
    let mockGame: MockGame;

    beforeEach(() => {
        input = new MockInput();
        playingState = new PlayingState(input);
        mockGame = new MockGame() as any;
        playingState.enter(mockGame as any);
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

    it('should calculate spawn interval correctly at 3 minutes', () => {
        // At 3 minutes (180 seconds), interval should be 1.0
        playingState['gameTime'] = 180.0;
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        
        expect(playingState['asteroidTimer']).toBeCloseTo(1.0, 1);
    });

    it('should calculate spawn interval correctly at 1.5 minutes', () => {
        // At 1.5 minutes (90 seconds), interval should be halfway: 2.0
        playingState['gameTime'] = 90.0;
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        
        expect(playingState['asteroidTimer']).toBeCloseTo(2.0, 1);
    });

    it('should cap spawn interval at 1 second after 3 minutes', () => {
        // After 3 minutes, interval should stay at 1.0
        playingState['gameTime'] = 200.0;
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        
        expect(playingState['asteroidTimer']).toBeCloseTo(1.0, 1);
    });

    it('should start with 10% large asteroid ratio', () => {
        // Create many asteroids and count large ones
        let largeCount = 0;
        const totalSamples = 1000;
        
        for (let i = 0; i < totalSamples; i++) {
            const asteroid = new Asteroid(undefined, undefined, undefined, undefined, undefined, 0.1);
            if (asteroid.asteroidSize === AsteroidSize.LARGE) {
                largeCount++;
            }
        }
        
        // Should be approximately 10% (allow some variance for randomness)
        const ratio = largeCount / totalSamples;
        expect(ratio).toBeGreaterThan(0.08);
        expect(ratio).toBeLessThan(0.12);
    });

    it('should use 50% large asteroid ratio at 3 minutes', () => {
        // Create many asteroids with 50% large ratio and count large ones
        let largeCount = 0;
        const totalSamples = 1000;
        
        for (let i = 0; i < totalSamples; i++) {
            const asteroid = new Asteroid(undefined, undefined, undefined, undefined, undefined, 0.5);
            if (asteroid.asteroidSize === AsteroidSize.LARGE) {
                largeCount++;
            }
        }
        
        // Should be approximately 50% (allow some variance for randomness)
        const ratio = largeCount / totalSamples;
        expect(ratio).toBeGreaterThan(0.45);
        expect(ratio).toBeLessThan(0.55);
    });

    it('should use 30% large asteroid ratio at 1.5 minutes', () => {
        // At 1.5 minutes, ratio should be halfway: 30%
        // (10% + (50% - 10%) * 0.5 = 30%)
        let largeCount = 0;
        const totalSamples = 1000;
        
        for (let i = 0; i < totalSamples; i++) {
            const asteroid = new Asteroid(undefined, undefined, undefined, undefined, undefined, 0.3);
            if (asteroid.asteroidSize === AsteroidSize.LARGE) {
                largeCount++;
            }
        }
        
        // Should be approximately 30% (allow some variance for randomness)
        const ratio = largeCount / totalSamples;
        expect(ratio).toBeGreaterThan(0.25);
        expect(ratio).toBeLessThan(0.35);
    });

    it('should reset game time when a life is lost', () => {
        playingState['gameTime'] = 100.0;
        
        // Trigger ship explosion (which decrements lives)
        playingState['startExplosion'](mockGame as any);
        
        expect(playingState['gameTime']).toBe(0);
        expect(playingState.lives).toBeLessThan(STARTING_LIVES);
    });

    it('should reset spawn interval after game time resets', () => {
        // Advance game time to increase spawn rate
        playingState['gameTime'] = 90.0; // 1.5 minutes
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        const fastInterval = playingState['asteroidTimer'];
        expect(fastInterval).toBeCloseTo(2.0, 1);
        
        // Reset game time (simulating life loss)
        playingState['gameTime'] = 0;
        
        // Next spawn should use initial slow interval
        playingState['asteroidTimer'] = 0;
        playingState['updateAsteroids'](0.1);
        expect(playingState['asteroidTimer']).toBeCloseTo(3.0, 1);
    });

    it('should reset large asteroid ratio after game time resets', () => {
        // Advance game time to increase large asteroid ratio
        playingState['gameTime'] = 90.0; // 1.5 minutes - should be ~30% large
        playingState['asteroidTimer'] = 0;
        
        // Count large asteroids spawned at this time
        let largeCount = 0;
        const samples = 100;
        for (let i = 0; i < samples; i++) {
            playingState['asteroidTimer'] = 0;
            playingState['updateAsteroids'](0.1);
            const lastAsteroid = playingState.asteroids[playingState.asteroids.length - 1];
            if (lastAsteroid && lastAsteroid.asteroidSize === AsteroidSize.LARGE) {
                largeCount++;
            }
            playingState.asteroids.pop(); // Remove for next test
        }
        
        const ratioAt90s = largeCount / samples;
        expect(ratioAt90s).toBeGreaterThan(0.2); // Should be around 30%
        
        // Reset game time
        playingState['gameTime'] = 0;
        playingState['asteroidTimer'] = 0;
        
        // Count large asteroids spawned after reset
        largeCount = 0;
        for (let i = 0; i < samples; i++) {
            playingState['asteroidTimer'] = 0;
            playingState['updateAsteroids'](0.1);
            const lastAsteroid = playingState.asteroids[playingState.asteroids.length - 1];
            if (lastAsteroid && lastAsteroid.asteroidSize === AsteroidSize.LARGE) {
                largeCount++;
            }
            playingState.asteroids.pop(); // Remove for next test
        }
        
        const ratioAfterReset = largeCount / samples;
        expect(ratioAfterReset).toBeLessThan(0.15); // Should be around 10%
        expect(ratioAfterReset).toBeLessThan(ratioAt90s); // Should be less than before reset
    });
});

