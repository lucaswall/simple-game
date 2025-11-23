import { GameState } from '../interfaces/GameState';
import { Game } from '../Game';
import { Starfield } from '../Starfield';
import { Input } from '../Input';
import { IntroState } from './IntroState';
import { GAME_WIDTH, GAME_HEIGHT, MENU_TITLE_FONT_SIZE, MENU_SUBTITLE_FONT_SIZE } from '../Constants';

export class MainMenuState implements GameState {
    starfield: Starfield;
    input: Input;

    constructor(input: Input) {
        this.input = input;
        this.starfield = new Starfield();
    }

    enter(_game: Game): void {
        // Clear input keys to ensure clean state
        this.input.clearKeys();
    }

    update(game: Game, deltaTime: number): void {
        this.starfield.update(deltaTime);

        // Check for Space key to start the game
        if (this.input.keys.Space) {
            const introState = new IntroState(this.input);
            game.changeState(introState);
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
        ctx.fillText('Space Game', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);

        // Draw subtitle
        ctx.font = `${MENU_SUBTITLE_FONT_SIZE}px sans-serif`;
        ctx.fillText('Press Space to start', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    }

    exit(_game: Game): void { }
}

