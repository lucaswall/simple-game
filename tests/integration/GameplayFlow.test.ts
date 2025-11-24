import { describe, it, expect, beforeEach } from 'vitest';
import { MainMenuState } from '../../src/states/MainMenuState';
import { IntroState } from '../../src/states/IntroState';
import { PlayingState } from '../../src/states/PlayingState';
import { GameOverState } from '../../src/states/GameOverState';
import { MockInput } from '../utils/MockInput';
import { MockGame } from '../utils/MockGame';
import { createCollidingShipAsteroid } from '../utils/TestHelpers';
import { Asteroid } from '../../src/actors/Asteroid';
import { Bullet } from '../../src/actors/Bullet';

describe('Gameplay Flow Integration', () => {
    let input: MockInput;
    let mockGame: MockGame;

    beforeEach(() => {
        input = new MockInput();
        mockGame = new MockGame() as any;
    });

    it('should complete full game flow: MainMenu -> Intro -> Playing -> GameOver -> MainMenu', () => {
        // Start at main menu
        const mainMenu = new MainMenuState(input);
        mockGame.currentState = mainMenu;
        mainMenu.enter(mockGame as any);
        
        // Transition to intro
        input.pressKey('Space');
        mainMenu.update(mockGame as any, 0.1);
        expect(mockGame.getStateTransitions()[0]).toBeInstanceOf(IntroState);
        
        // Fast-forward intro
        const intro = mockGame.currentState as IntroState;
        let introUpdates = 0;
        while (introUpdates < 1000 && mockGame.getStateTransitions().length < 2) {
            intro.update(mockGame as any, 0.1);
            introUpdates++;
        }
        expect(mockGame.getStateTransitions()[1]).toBeInstanceOf(PlayingState);
        
        // Play until game over
        const playing = mockGame.currentState as PlayingState;
        playing.lives = 1;
        const { ship, asteroid } = createCollidingShipAsteroid();
        playing.ship = ship;
        playing.ship.visible = true;
        playing.ship.collisionEnabled = true;
        playing.asteroids.push(asteroid);
        
        playing['checkCollisions'](mockGame as any);
        // Explosion callback is automatically called by MockGame.startFreeze
        // Fast-forward explosion timer
        playing.explosionTimer = 0.05;
        playing.particleManager.particles = [];
        playing.update(mockGame as any, 0.1);
        
        expect(mockGame.getStateTransitions()[2]).toBeInstanceOf(GameOverState);
        
        // Return to main menu
        const gameOver = mockGame.currentState as GameOverState;
        input.pressKey('Escape');
        gameOver.update(mockGame as any, 0.1);
        
        expect(mockGame.getStateTransitions()[3]).toBeInstanceOf(MainMenuState);
    });

    it('should maintain score throughout gameplay', () => {
        const playing = new PlayingState(input);
        mockGame.currentState = playing;
        playing.enter(mockGame as any);
        
        // Destroy an asteroid
        const asteroid = new Asteroid();
        const bullet = new Bullet(asteroid.x, asteroid.y, 800, 5);
        playing.asteroids.push(asteroid);
        playing.bullets.push(bullet);
        
        playing['checkCollisions'](mockGame as any);
        
        expect(playing.score).toBeGreaterThan(0);
    });
});

