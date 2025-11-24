import { describe, it, expect, beforeEach } from 'vitest';
import { MainMenuState } from '../../../src/states/MainMenuState';
import { IntroState } from '../../../src/states/IntroState';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';

describe('MainMenuState', () => {
    let mainMenu: MainMenuState;
    let input: MockInput;
    let mockGame: MockGame;

    beforeEach(() => {
        input = new MockInput();
        mainMenu = new MainMenuState(input);
        mockGame = new MockGame() as any;
    });

    it('should clear keys on enter', () => {
        input.pressAllKeys();
        mainMenu.enter(mockGame as any);
        
        expect(input.keys.Space).toBe(false);
    });

    it('should transition to IntroState when Space is pressed', () => {
        mainMenu.enter(mockGame as any);
        input.pressKey('Space');
        mainMenu.update(mockGame as any, 0.1);
        
        const transitions = mockGame.getStateTransitions();
        expect(transitions.length).toBe(1);
        expect(transitions[0]).toBeInstanceOf(IntroState);
    });

});

