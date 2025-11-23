import type { Game } from '../Game';

export interface GameState {
    enter(game: Game): void;
    update(game: Game, deltaTime: number): void;
    draw(game: Game, ctx: CanvasRenderingContext2D): void;
    exit(game: Game): void;
    
    // Optional explosion handling methods
    startExplosion?(): void;
    updateDuringExplosion?(deltaTime: number): void;
    canRespawn?(): boolean;
    respawn?(): void;
}
