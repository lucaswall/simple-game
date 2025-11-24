import { describe, it, expect, beforeEach } from 'vitest';
import { PlayingState } from '../../../src/states/PlayingState';
import { MockInput } from '../../utils/MockInput';
import { MockGame } from '../../utils/MockGame';
import { Asteroid, AsteroidSize } from '../../../src/actors/Asteroid';
import { Bullet } from '../../../src/actors/Bullet';
import { ASTEROID_SMALL_POINTS, ASTEROID_MEDIUM_POINTS, ASTEROID_LARGE_POINTS } from '../../../src/states/PlayingState';

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

    it('should increment score when small asteroid is destroyed', () => {
        const asteroid = new Asteroid(200, 200, AsteroidSize.SMALL, -300, 0);
        const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
        playingState.asteroids.push(asteroid);
        playingState.bullets.push(bullet);
        
        const initialScore = playingState.score;
        playingState['checkCollisions'](mockGame as any);
        
        expect(playingState.score).toBe(initialScore + ASTEROID_SMALL_POINTS);
    });

    it('should increment score when medium asteroid is split', () => {
        const asteroid = new Asteroid(200, 200, AsteroidSize.MEDIUM, -300, 0);
        const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
        playingState.asteroids.push(asteroid);
        playingState.bullets.push(bullet);
        
        const initialScore = playingState.score;
        playingState['checkCollisions'](mockGame as any);
        
        expect(playingState.score).toBe(initialScore + ASTEROID_MEDIUM_POINTS);
    });

    it('should reset score when entering playing state', () => {
        playingState.score = 500;
        playingState.enter(mockGame as any);
        expect(playingState.score).toBe(0);
    });

    it('should accumulate score for multiple small asteroids', () => {
        const asteroid1 = new Asteroid(200, 200, AsteroidSize.SMALL, -300, 0);
        const asteroid2 = new Asteroid(300, 300, AsteroidSize.SMALL, -300, 0);
        const bullet1 = new Bullet(asteroid1.x, asteroid1.y, 800, 5);
        const bullet2 = new Bullet(asteroid2.x, asteroid2.y, 800, 5);
        
        playingState.asteroids.push(asteroid1, asteroid2);
        playingState.bullets.push(bullet1, bullet2);
        
        playingState['checkCollisions'](mockGame as any);
        
        expect(playingState.score).toBe(ASTEROID_SMALL_POINTS * 2);
    });

    it('should increment score when large asteroid is split', () => {
        const asteroid = new Asteroid(200, 200, AsteroidSize.LARGE, -300, 0);
        const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
        playingState.asteroids.push(asteroid);
        playingState.bullets.push(bullet);
        
        const initialScore = playingState.score;
        playingState['checkCollisions'](mockGame as any);
        
        expect(playingState.score).toBe(initialScore + ASTEROID_LARGE_POINTS);
    });

    it('should create two medium asteroids when large asteroid is split', () => {
        const asteroid = new Asteroid(200, 200, AsteroidSize.LARGE, -300, 0);
        const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
        playingState.asteroids.push(asteroid);
        playingState.bullets.push(bullet);
        
        const initialAsteroidCount = playingState.asteroids.length;
        playingState['checkCollisions'](mockGame as any);
        
        // Large asteroid should be removed, 2 medium asteroids should be added
        expect(playingState.asteroids.length).toBe(initialAsteroidCount + 1); // -1 + 2 = +1
        expect(playingState.asteroids.every(a => a.asteroidSize === AsteroidSize.MEDIUM)).toBe(true);
    });

    it('should create two small asteroids when medium asteroid is split', () => {
        const asteroid = new Asteroid(200, 200, AsteroidSize.MEDIUM, -300, 0);
        const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
        playingState.asteroids.push(asteroid);
        playingState.bullets.push(bullet);
        
        const initialAsteroidCount = playingState.asteroids.length;
        playingState['checkCollisions'](mockGame as any);
        
        // Medium asteroid should be removed, 2 small asteroids should be added
        expect(playingState.asteroids.length).toBe(initialAsteroidCount + 1); // -1 + 2 = +1
        expect(playingState.asteroids.every(a => a.asteroidSize === AsteroidSize.SMALL)).toBe(true);
    });
});

