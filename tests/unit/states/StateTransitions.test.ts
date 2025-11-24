import { describe, it, expect, beforeEach } from 'vitest';
import { MainMenuState } from '../../../src/states/MainMenuState';
import { IntroState } from '../../../src/states/IntroState';
import { PlayingState } from '../../../src/states/PlayingState';
import { GameOverState } from '../../../src/states/GameOverState';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';

describe('State Transitions', () => {
    let input: MockInput;
    let mockGame: MockGame;

    beforeEach(() => {
        input = new MockInput();
        mockGame = new MockGame() as any;
    });

    describe('MainMenuState', () => {
        it('should transition to IntroState when Space is pressed', () => {
            const mainMenu = new MainMenuState(input);
            mockGame.currentState = mainMenu;
            mainMenu.enter(mockGame as any);
            
            input.pressKey('Space');
            mainMenu.update(mockGame as any, 0.1);
            
            const transitions = mockGame.getStateTransitions();
            expect(transitions.length).toBe(1);
            expect(transitions[0]).toBeInstanceOf(IntroState);
        });
    });

    describe('IntroState', () => {
        it('should transition to PlayingState when intro completes', () => {
            const intro = new IntroState(input);
            mockGame.currentState = intro;
            intro.enter(mockGame as any);
            
            // Fast-forward through intro phases
            let updates = 0;
            while (updates < 1000 && mockGame.getStateTransitions().length === 0) {
                intro.update(mockGame as any, 0.1);
                updates++;
            }
            
            const transitions = mockGame.getStateTransitions();
            expect(transitions.length).toBeGreaterThan(0);
            expect(transitions[0]).toBeInstanceOf(PlayingState);
        });
    });

    describe('PlayingState', () => {
        it('should transition to GameOverState when lives reach 0', () => {
            const playing = new PlayingState(input);
            mockGame.currentState = playing;
            playing.enter(mockGame as any);
            
            // Set lives to 1, trigger explosion (which decrements to 0)
            playing.lives = 1;
            playing['startExplosion'](mockGame as any);
            // Fast-forward explosion timer to trigger game over
            playing.explosionTimer = 0.05;
            playing.particleManager.particles = [];
            
            playing.update(mockGame as any, 0.1);
            
            const transitions = mockGame.getStateTransitions();
            expect(transitions.length).toBeGreaterThan(0);
            expect(transitions[0]).toBeInstanceOf(GameOverState);
        });
    });

    describe('GameOverState', () => {
        it('should transition to MainMenuState when Escape is pressed', () => {
            const gameOver = new GameOverState(input, 1000);
            mockGame.currentState = gameOver;
            gameOver.enter(mockGame as any);
            
            input.pressKey('Escape');
            gameOver.update(mockGame as any, 0.1);
            
            const transitions = mockGame.getStateTransitions();
            expect(transitions.length).toBe(1);
            expect(transitions[0]).toBeInstanceOf(MainMenuState);
        });
    });
});

