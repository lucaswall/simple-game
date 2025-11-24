import { describe, it, expect, beforeEach } from 'vitest';
import { PlayingState } from '../../../src/states/PlayingState';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';

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

    it('should spawn asteroids with straight trajectory before 1 minute', () => {
        playingState['gameTime'] = 59.0; // Just before 1 minute
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

    it('should spawn 50% of asteroids with angles after 1 minute', () => {
        playingState['gameTime'] = 60.0; // At 1 minute
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

    it('should spawn angled asteroids with 0-5 degrees at 1 minute', () => {
        playingState['gameTime'] = 60.0; // At 1 minute
        playingState['asteroidTimer'] = 0;
        
        const samples = 50;
        const angles: number[] = [];
        
        for (let i = 0; i < samples; i++) {
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
        
        angles.forEach(angle => {
            expect(angle).toBeGreaterThanOrEqual(0);
            expect(angle).toBeLessThanOrEqual(5);
        });
    });

    it('should spawn angled asteroids with 0-10 degrees at 2 minutes', () => {
        playingState['gameTime'] = 120.0; // At 2 minutes
        playingState['asteroidTimer'] = 0;
        
        const samples = 50;
        const angles: number[] = [];
        
        for (let i = 0; i < samples; i++) {
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
        
        angles.forEach(angle => {
            expect(angle).toBeGreaterThanOrEqual(0);
            expect(angle).toBeLessThanOrEqual(10);
        });
    });

    it('should spawn angled asteroids with 0-20 degrees at 3 minutes', () => {
        playingState['gameTime'] = 180.0; // At 3 minutes
        playingState['asteroidTimer'] = 0;
        
        const samples = 50;
        const angles: number[] = [];
        
        for (let i = 0; i < samples; i++) {
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
        
        angles.forEach(angle => {
            expect(angle).toBeGreaterThanOrEqual(0);
            expect(angle).toBeLessThanOrEqual(20);
        });
    });

    it('should ramp up max angle linearly between milestones', () => {
        // At 1.5 minutes (90 seconds), max angle should be halfway between 5 and 10: 7.5 degrees
        playingState['gameTime'] = 90.0;
        playingState['asteroidTimer'] = 0;
        
        const samples = 50;
        const angles: number[] = [];
        
        for (let i = 0; i < samples; i++) {
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

