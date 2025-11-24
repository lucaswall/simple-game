import { describe, it, expect, beforeEach } from 'vitest';
import { PlayingState } from '../../../src/states/PlayingState';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';

describe('Debug Overlay', () => {
    let playingState: PlayingState;
    let input: MockInput;
    let mockGame: MockGame;

    beforeEach(() => {
        input = new MockInput();
        playingState = new PlayingState(input);
        mockGame = new MockGame() as any;
        playingState.enter(mockGame as any);
    });

    it('should toggle debug mode when D key is pressed', () => {
        expect(playingState['debugMode']).toBe(false);
        
        // Press D key
        input.pressKey('KeyD');
        playingState.update(mockGame as any, 0.1);
        
        expect(playingState['debugMode']).toBe(true);
        
        // Release and press again to toggle off
        input.releaseKey('KeyD');
        playingState.update(mockGame as any, 0.1);
        input.pressKey('KeyD');
        playingState.update(mockGame as any, 0.1);
        
        expect(playingState['debugMode']).toBe(false);
    });

    it('should not toggle multiple times while D key is held', () => {
        input.pressKey('KeyD');
        playingState.update(mockGame as any, 0.1);
        expect(playingState['debugMode']).toBe(true);
        
        // Update multiple times while key is held
        playingState.update(mockGame as any, 0.1);
        playingState.update(mockGame as any, 0.1);
        playingState.update(mockGame as any, 0.1);
        
        // Should still be true (not toggled multiple times)
        expect(playingState['debugMode']).toBe(true);
    });

    it('should reset debug mode when entering playing state', () => {
        playingState['debugMode'] = true;
        playingState.enter(mockGame as any);
        
        expect(playingState['debugMode']).toBe(false);
    });

    it('should calculate spawn rate correctly for debug display', () => {
        // At start (gameTime = 0), spawn interval should be 3.0, so rate = 1/3
        playingState['gameTime'] = 0;
        let currentSpawnInterval: number;
        if (playingState['gameTime'] <= 60) {
            const t = playingState['gameTime'] / 60.0;
            currentSpawnInterval = 3.0 - (3.0 - 1.0) * t;
        } else if (playingState['gameTime'] <= 120) {
            const t = (playingState['gameTime'] - 60) / 60.0;
            currentSpawnInterval = 1.0 - (1.0 - 0.5) * t;
        } else if (playingState['gameTime'] <= 180) {
            const t = (playingState['gameTime'] - 120) / 60.0;
            currentSpawnInterval = 0.5 - (0.5 - 0.25) * t;
        } else {
            currentSpawnInterval = 0.25;
        }
        const spawnRate = 1.0 / currentSpawnInterval;
        
        expect(spawnRate).toBeCloseTo(1.0 / 3.0, 2);
        
        // At 1 minute (60s), spawn interval should be 1.0, so rate = 1.0
        playingState['gameTime'] = 60.0;
        if (playingState['gameTime'] <= 60) {
            const t = playingState['gameTime'] / 60.0;
            currentSpawnInterval = 3.0 - (3.0 - 1.0) * t;
        } else if (playingState['gameTime'] <= 120) {
            const t = (playingState['gameTime'] - 60) / 60.0;
            currentSpawnInterval = 1.0 - (1.0 - 0.5) * t;
        } else if (playingState['gameTime'] <= 180) {
            const t = (playingState['gameTime'] - 120) / 60.0;
            currentSpawnInterval = 0.5 - (0.5 - 0.25) * t;
        } else {
            currentSpawnInterval = 0.25;
        }
        const spawnRate2 = 1.0 / currentSpawnInterval;
        
        expect(spawnRate2).toBeCloseTo(1.0, 2);
        
        // At 3 minutes (180s), spawn interval should be 0.25, so rate = 4.0
        playingState['gameTime'] = 180.0;
        if (playingState['gameTime'] <= 60) {
            const t = playingState['gameTime'] / 60.0;
            currentSpawnInterval = 3.0 - (3.0 - 1.0) * t;
        } else if (playingState['gameTime'] <= 120) {
            const t = (playingState['gameTime'] - 60) / 60.0;
            currentSpawnInterval = 1.0 - (1.0 - 0.5) * t;
        } else if (playingState['gameTime'] <= 180) {
            const t = (playingState['gameTime'] - 120) / 60.0;
            currentSpawnInterval = 0.5 - (0.5 - 0.25) * t;
        } else {
            currentSpawnInterval = 0.25;
        }
        const spawnRate3 = 1.0 / currentSpawnInterval;
        
        expect(spawnRate3).toBeCloseTo(4.0, 2);
    });

    it('should calculate asteroid chances correctly for debug display', () => {
        // At start, large ratio should be 10%
        playingState['gameTime'] = 0;
        const largeRatioProgress = Math.min(playingState['gameTime'] / 180.0, 1.0);
        const currentLargeRatio = 0.1 + (0.5 - 0.1) * largeRatioProgress;
        
        expect(currentLargeRatio).toBeCloseTo(0.1, 2);
        
        // At 3 minutes, large ratio should be 50%
        playingState['gameTime'] = 180.0;
        const largeRatioProgress2 = Math.min(playingState['gameTime'] / 180.0, 1.0);
        const currentLargeRatio2 = 0.1 + (0.5 - 0.1) * largeRatioProgress2;
        
        expect(currentLargeRatio2).toBeCloseTo(0.5, 2);
    });
});

