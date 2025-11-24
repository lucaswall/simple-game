import { describe, it, expect, beforeEach } from 'vitest';
import { GameOverState } from '../../../src/states/GameOverState';
import { MainMenuState } from '../../../src/states/MainMenuState';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';

describe('GameOverState', () => {
    let gameOver: GameOverState;
    let input: MockInput;
    let mockGame: MockGame;

    beforeEach(() => {
        input = new MockInput();
        gameOver = new GameOverState(input, 5000);
        mockGame = new MockGame() as any;
    });

    it('should clear keys on enter', () => {
        input.pressAllKeys();
        gameOver.enter(mockGame as any);
        
        expect(input.keys.Escape).toBe(false);
    });

    it('should transition to MainMenuState when Escape is pressed', () => {
        gameOver.enter(mockGame as any);
        input.pressKey('Escape');
        gameOver.update(mockGame as any, 0.1);
        
        const transitions = mockGame.getStateTransitions();
        expect(transitions.length).toBe(1);
        expect(transitions[0]).toBeInstanceOf(MainMenuState);
    });

});

