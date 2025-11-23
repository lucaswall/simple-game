
import { GameState } from '../interfaces/GameState';
import { Game } from '../Game';

export class HitFreezeState implements GameState {
    private timer: number;

    constructor(duration: number) {
        this.timer = duration;
    }

    enter(_game: Game): void { }

    update(game: Game, deltaTime: number): void {
        this.timer -= deltaTime;
        if (this.timer <= 0) {
            game.toExploding();
        }
    }

    draw(game: Game, ctx: CanvasRenderingContext2D): void {
        // Draw everything as is (frozen)
        game.starfield.draw(ctx);
        game.asteroids.forEach(a => a.draw(ctx));
        game.bullets.forEach(b => b.draw(ctx));
        game.particleManager.draw(ctx);
        game.ship.draw(ctx);
    }

    exit(_game: Game): void { }
}

