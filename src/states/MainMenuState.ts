import { GameState } from '../interfaces/GameState';
import { Game } from '../Game';
import { Starfield } from '../Starfield';
import { Input } from '../Input';
import { PlayingState } from './PlayingState';
import { GAME_WIDTH, GAME_HEIGHT, MENU_TITLE_FONT_SIZE, MENU_SUBTITLE_FONT_SIZE } from '../Constants';

export class MainMenuState implements GameState {
    starfield: Starfield;
    input: Input;
    private keyHandler: ((e: KeyboardEvent) => void) | null = null;

    constructor(input: Input) {
        this.input = input;
        this.starfield = new Starfield();
    }

    enter(_game: Game): void {
        // Set up key listener for any key press
        this.keyHandler = (e: KeyboardEvent) => {
            // Any key press starts the game
            const playingState = new PlayingState(this.input);
            _game.changeState(playingState);
        };
        window.addEventListener('keydown', this.keyHandler);
    }

    update(game: Game, deltaTime: number): void {
        this.starfield.update(deltaTime);
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
        ctx.fillText('Press any key to start', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    }

    exit(_game: Game): void {
        // Clean up key listener
        if (this.keyHandler) {
            window.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
    }
}

