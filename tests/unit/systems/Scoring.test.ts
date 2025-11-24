import { describe, it, expect, beforeEach } from 'vitest';
import { PlayingState } from '../../../src/states/PlayingState';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';
import { Asteroid } from '../../../src/actors/Asteroid';
import { Bullet } from '../../../src/actors/Bullet';
import { ASTEROID_POINTS } from '../../../src/states/PlayingState';

describe('Scoring System', () => {
    let playingState: PlayingState;
    let input: MockInput;
    let mockGame: MockGame;

    beforeEach(() => {
        input = new MockInput();
        playingState = new PlayingState(input);
        mockGame = new MockGame() as any;
        playingState.enter(mockGame as any);
    });

    it('should start with score of 0', () => {
        expect(playingState.score).toBe(0);
    });

    it('should increment score when asteroid is destroyed', () => {
        const asteroid = new Asteroid();
        const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
        playingState.asteroids.push(asteroid);
        playingState.bullets.push(bullet);
        
        const initialScore = playingState.score;
        playingState['checkCollisions'](mockGame as any);
        
        expect(playingState.score).toBe(initialScore + ASTEROID_POINTS);
    });

    it('should reset score when entering playing state', () => {
        playingState.score = 500;
        playingState.enter(mockGame as any);
        expect(playingState.score).toBe(0);
    });

    it('should accumulate score for multiple asteroids', () => {
        const asteroid1 = new Asteroid();
        const asteroid2 = new Asteroid();
        const bullet1 = new Bullet(asteroid1.x, asteroid1.y, 800, 5);
        const bullet2 = new Bullet(asteroid2.x, asteroid2.y, 800, 5);
        
        playingState.asteroids.push(asteroid1, asteroid2);
        playingState.bullets.push(bullet1, bullet2);
        
        playingState['checkCollisions'](mockGame as any);
        
        expect(playingState.score).toBe(ASTEROID_POINTS * 2);
    });
});

