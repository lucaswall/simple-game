import { describe, it, expect, beforeEach } from 'vitest';
import { IntroState } from '../../../src/states/IntroState';
import { PlayingState } from '../../../src/states/PlayingState';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';

describe('IntroState', () => {
    let intro: IntroState;
    let input: MockInput;
    let mockGame: MockGame;

    beforeEach(() => {
        input = new MockInput();
        intro = new IntroState(input);
        mockGame = new MockGame() as any;
    });

    it('should make ship visible and controllable after intro', () => {
        intro.enter(mockGame as any);
        
        // Fast-forward through intro
        let updates = 0;
        while (updates < 1000 && mockGame.getStateTransitions().length === 0) {
            intro.update(mockGame as any, 0.1);
            updates++;
        }
        
        // Ship should be visible and controllable
        expect(intro['ship'].visible).toBe(true);
        expect(intro['ship'].controllable).toBe(true);
    });

    it('should transition to PlayingState when intro completes', () => {
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

    it('should transfer ship and bullets to PlayingState', () => {
        intro.enter(mockGame as any);
        
        // Fast-forward through intro
        let updates = 0;
        while (updates < 1000 && mockGame.getStateTransitions().length === 0) {
            intro.update(mockGame as any, 0.1);
            updates++;
        }
        
        const playingState = mockGame.getStateTransitions()[0] as PlayingState;
        expect(playingState.ship).toBe(intro['ship']);
        expect(playingState.bullets).toBe(intro['bullets']);
    });
});

