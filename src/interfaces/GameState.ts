import type { Game } from '../core/Game';

export interface GameState {
    enter(game: Game): void;
    update(game: Game, deltaTime: number): void;
    draw(game: Game, ctx: CanvasRenderingContext2D): void;
    exit(game: Game): void;
}
