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
        
        // Update with time scale 0.5
        game.setTimeScale(0.5);
        game.update(1.0);
        
        // Game time should only advance by 0.5 (half speed)
        expect(playingState['gameTime']).toBeCloseTo(0.5, 2);
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
        
        game.startFreeze(0.5);
        expect(game.timeScale).toBe(0);
        
        // Update past freeze duration
        game.update(0.6);
        
        expect(game.timeScale).toBe(1);
    });

    it('should call callback after freeze completes', () => {
        let callbackCalled = false;
        game.startFreeze(0.5, () => {
            callbackCalled = true;
        });
        
        game.update(0.6);
        
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
        
        game.startFreeze(0.3);
        expect(game.timeScale).toBe(0);
        
        // Start another freeze before first completes
        game.update(0.1);
        game.startFreeze(0.5);
        
        // Should still be frozen
        expect(game.timeScale).toBe(0);
        
        // Complete both freezes
        game.update(0.6);
        expect(game.timeScale).toBe(1);
    });

    it('should handle time scale changes correctly', () => {
        const playingState = new PlayingState(input);
        game.changeState(playingState);
        playingState['gameTime'] = 0;
        
        game.setTimeScale(0.25);
        game.update(1.0);
        
        // Game time should advance by 0.25 (quarter speed)
        expect(playingState['gameTime']).toBeCloseTo(0.25, 2);
        
        game.setTimeScale(2.0);
        game.update(1.0);
        
        // Game time should advance by 2.0 (double speed)
        expect(playingState['gameTime']).toBeCloseTo(2.25, 2);
    });
});

