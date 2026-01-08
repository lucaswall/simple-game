import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../../../src/core/Game';
import { MainMenuState } from '../../../src/states/MainMenuState';
import { PlayingState } from '../../../src/states/PlayingState';
import { MockInput } from '../../utils/MockInput';
import { createMockCanvas } from '../../utils/MockCanvas';

describe('Game', () => {
    let ctx: CanvasRenderingContext2D;
    let input: MockInput;
    let game: Game;

    beforeEach(() => {
        const mockCanvas = createMockCanvas();
        ctx = mockCanvas.ctx;
        input = new MockInput();
        const initialState = new MainMenuState(input);
        game = new Game(ctx, initialState);
    });

    it('should decay shake intensity over time', () => {
        game.shakeIntensity = 100;
        game.update(0.1);
        
        expect(game.shakeIntensity).toBeLessThan(100);
        expect(game.shakeIntensity).toBeGreaterThanOrEqual(0);
    });

    it('should not allow shake intensity to go below 0', () => {
        game.shakeIntensity = 10;
        game.update(1.0); // Enough time to decay past 0
        
        expect(game.shakeIntensity).toBe(0);
    });

    it('should apply time scale to state updates', () => {
        const playingState = new PlayingState(input);
        game.changeState(playingState);
        playingState['gameTime'] = 0;

        // Update with time scale 0.5 (use small deltaTime to avoid capping)
        game.setTimeScale(0.5);
        game.update(0.1);

        // Game time should only advance by 0.05 (half of 0.1)
        expect(playingState['gameTime']).toBeCloseTo(0.05, 2);
    });

    it('should freeze time when startFreeze is called', () => {
        const playingState = new PlayingState(input);
        game.changeState(playingState);
        playingState['gameTime'] = 0;
        
        game.startFreeze(0.5);
        expect(game.timeScale).toBe(0);
        
        // Update - time should be frozen
        game.update(0.3);
        expect(playingState['gameTime']).toBe(0);
    });

    it('should restore time scale after freeze duration', () => {
        const playingState = new PlayingState(input);
        game.changeState(playingState);

        game.startFreeze(0.15);
        expect(game.timeScale).toBe(0);

        // Update past freeze duration (use multiple small updates due to deltaTime cap)
        game.update(0.1);
        game.update(0.1);

        expect(game.timeScale).toBe(1);
    });

    it('should call callback after freeze completes', () => {
        let callbackCalled = false;
        game.startFreeze(0.15, () => {
            callbackCalled = true;
        });

        // Multiple updates to exceed freeze duration (due to deltaTime cap)
        game.update(0.1);
        game.update(0.1);

        expect(callbackCalled).toBe(true);
    });

    it('should call exit on old state when changing states', () => {
        const oldState = game.currentState;
        const newState = new PlayingState(input);
        
        const exitSpy = vi.spyOn(oldState, 'exit');
        game.changeState(newState);
        
        expect(exitSpy).toHaveBeenCalledWith(game);
    });

    it('should call enter on new state when changing states', () => {
        const newState = new PlayingState(input);
        const enterSpy = vi.spyOn(newState, 'enter');
        
        game.changeState(newState);
        
        expect(enterSpy).toHaveBeenCalledWith(game);
    });

    it('should handle shake intensity decay rate correctly', () => {
        game.shakeIntensity = 100;
        const initialIntensity = game.shakeIntensity;
        
        game.update(0.1);
        const afterUpdate = game.shakeIntensity;
        
        // Should decay, but not instantly
        expect(afterUpdate).toBeLessThan(initialIntensity);
        expect(afterUpdate).toBeGreaterThan(0);
    });

    it('should handle multiple freeze calls correctly', () => {
        const playingState = new PlayingState(input);
        game.changeState(playingState);

        game.startFreeze(0.15);
        expect(game.timeScale).toBe(0);

        // Start another freeze before first completes
        game.update(0.05);
        game.startFreeze(0.2);

        // Should still be frozen
        expect(game.timeScale).toBe(0);

        // Complete both freezes (multiple updates due to deltaTime cap)
        game.update(0.1);
        game.update(0.1);
        game.update(0.1);
        expect(game.timeScale).toBe(1);
    });

    it('should handle time scale changes correctly', () => {
        const playingState = new PlayingState(input);
        game.changeState(playingState);
        playingState['gameTime'] = 0;

        // Use small deltaTime to avoid capping
        game.setTimeScale(0.25);
        game.update(0.1);

        // Game time should advance by 0.025 (quarter of 0.1)
        expect(playingState['gameTime']).toBeCloseTo(0.025, 3);

        game.setTimeScale(2.0);
        game.update(0.1);

        // Game time should advance by 0.2 (double of 0.1), total 0.225
        expect(playingState['gameTime']).toBeCloseTo(0.225, 3);
    });

    describe('deltaTime validation', () => {
        it('should skip update when deltaTime is NaN', () => {
            const playingState = new PlayingState(input);
            game.changeState(playingState);
            playingState['gameTime'] = 0;

            game.update(NaN);

            // Game time should not advance
            expect(playingState['gameTime']).toBe(0);
        });

        it('should skip update when deltaTime is Infinity', () => {
            const playingState = new PlayingState(input);
            game.changeState(playingState);
            playingState['gameTime'] = 0;

            game.update(Infinity);

            // Game time should not advance
            expect(playingState['gameTime']).toBe(0);
        });

        it('should skip update when deltaTime is negative', () => {
            const playingState = new PlayingState(input);
            game.changeState(playingState);
            playingState['gameTime'] = 0;

            game.update(-0.1);

            // Game time should not advance
            expect(playingState['gameTime']).toBe(0);
        });

        it('should cap deltaTime at maximum value to prevent large jumps', () => {
            const playingState = new PlayingState(input);
            game.changeState(playingState);
            playingState['gameTime'] = 0;

            // Update with a very large deltaTime (e.g., after tab was inactive)
            game.update(5.0);

            // Game time should be capped at MAX_DELTA_TIME (0.1 seconds)
            expect(playingState['gameTime']).toBeLessThanOrEqual(0.1);
        });
    });
});

