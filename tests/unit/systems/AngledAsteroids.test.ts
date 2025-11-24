import { describe, it, expect, beforeEach } from 'vitest';
import { PlayingState } from '../../../src/states/PlayingState';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';
import { Asteroid } from '../../../src/actors/Asteroid';

describe('Angled Asteroids', () => {
    let playingState: PlayingState;
    let input: MockInput;
    let mockGame: MockGame;

    beforeEach(() => {
        input = new MockInput();
        playingState = new PlayingState(input);
        mockGame = new MockGame() as any;
        playingState.enter(mockGame as any);
    });

    it('should spawn asteroids with straight trajectory before 3 minutes', () => {
        playingState['gameTime'] = 179.0; // Just before 3 minutes
        playingState['asteroidTimer'] = 0;
        
        // Spawn multiple asteroids and check they all have velocityY = 0
        for (let i = 0; i < 10; i++) {
            playingState['asteroidTimer'] = 0;
            playingState['updateAsteroids'](0.1);
            const lastAsteroid = playingState.asteroids[playingState.asteroids.length - 1];
            expect(lastAsteroid.velocityY).toBe(0);
            expect(lastAsteroid.velocityX).toBeLessThan(0); // Moving left
            playingState.asteroids.pop(); // Remove for next iteration
        }
    });

    it('should spawn 50% of asteroids with angles after 3 minutes', () => {
        playingState['gameTime'] = 180.0; // At 3 minutes
        playingState['asteroidTimer'] = 0;
        
        let angledCount = 0;
        let straightCount = 0;
        const samples = 100;
        
        for (let i = 0; i < samples; i++) {
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
        
        // Should be approximately 50% angled (allow some variance for randomness)
        const angledRatio = angledCount / samples;
        expect(angledRatio).toBeGreaterThan(0.4);
        expect(angledRatio).toBeLessThan(0.6);
    });

    it('should spawn angled asteroids with angles between 0 and 10 degrees', () => {
        playingState['gameTime'] = 180.0; // At 3 minutes
        playingState['asteroidTimer'] = 0;
        
        const samples = 50;
        const angles: number[] = [];
        
        for (let i = 0; i < samples; i++) {
            playingState['asteroidTimer'] = 0;
            playingState['updateAsteroids'](0.1);
            const lastAsteroid = playingState.asteroids[playingState.asteroids.length - 1];
            
            if (Math.abs(lastAsteroid.velocityY) > 0.001) {
                // Calculate angle from velocity vector
                // Base direction is left (180 degrees or π radians), so angle offset is relative to that
                const angleRadians = Math.atan2(lastAsteroid.velocityY, lastAsteroid.velocityX);
                const baseAngleRadians = Math.PI; // 180 degrees
                let angleOffsetRadians = angleRadians - baseAngleRadians;
                
                // Normalize to -π to π range
                while (angleOffsetRadians > Math.PI) angleOffsetRadians -= 2 * Math.PI;
                while (angleOffsetRadians < -Math.PI) angleOffsetRadians += 2 * Math.PI;
                
                const angleOffsetDegrees = Math.abs(angleOffsetRadians * (180 / Math.PI));
                angles.push(angleOffsetDegrees);
            }
            playingState.asteroids.pop(); // Remove for next iteration
        }
        
        // Check that all angles are between 0 and 10 degrees
        angles.forEach(angle => {
            expect(angle).toBeGreaterThanOrEqual(0);
            expect(angle).toBeLessThanOrEqual(10);
        });
    });

    it('should maintain asteroid speed when applying angle', () => {
        playingState['gameTime'] = 180.0; // At 3 minutes
        playingState['asteroidTimer'] = 0;
        
        // Spawn multiple asteroids and verify speed is maintained
        for (let i = 0; i < 20; i++) {
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

