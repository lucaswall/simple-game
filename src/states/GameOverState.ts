import { GameState } from '../interfaces/GameState';
import { Game } from '../Game';
import { Starfield } from '../Starfield';
import { Input } from '../Input';
import { MainMenuState } from './MainMenuState';
import { GAME_WIDTH, GAME_HEIGHT, MENU_TITLE_FONT_SIZE, MENU_SUBTITLE_FONT_SIZE } from '../Constants';

export class GameOverState implements GameState {
    starfield: Starfield;
    input: Input;
    finalScore: number;

    constructor(input: Input, finalScore: number) {
        this.input = input;
        this.starfield = new Starfield();
        this.finalScore = finalScore;
    }

    enter(_game: Game): void {
        // Clear input keys to ensure clean state
        this.input.clearKeys();
    }

    update(game: Game, deltaTime: number): void {
        this.starfield.update(deltaTime);

        // Check for Escape key to return to main menu
        if (this.input.keys.Escape) {
            const mainMenuState = new MainMenuState(this.input);
            game.changeState(mainMenuState);
        }
    }

    draw(_game: Game, ctx: CanvasRenderingContext2D): void {
        // Draw starfield background
        this.starfield.draw(ctx);

        // Draw title
        ctx.fillStyle = '#fff';
        ctx.font = `${MENU_TITLE_FONT_SIZE}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Game Over', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80);

        // Draw final score
        ctx.font = `${MENU_SUBTITLE_FONT_SIZE}px sans-serif`;
        ctx.fillText(`Final Score: ${this.finalScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);

        // Draw subtitle
        ctx.font = `${MENU_SUBTITLE_FONT_SIZE}px sans-serif`;
        ctx.fillText('Press ESC to continue', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
    }

    exit(_game: Game): void { }
}

