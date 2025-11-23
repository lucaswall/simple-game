
import { GameState } from '../interfaces/GameState';
import { Game } from '../Game';
import { EXPLOSION_DURATION, GAME_HEIGHT, SHIP_COLLISION_X } from '../Constants';

export class ExplodingState implements GameState {
    private timer: number;

    constructor() {
        this.timer = EXPLOSION_DURATION;
    }

    enter(game: Game): void {
        game.particleManager.createExplosion(SHIP_COLLISION_X, game.ship.y);
        game.ship.visible = false;
    }

    update(game: Game, deltaTime: number): void {
        this.timer -= deltaTime;

        // Continue environment movement
        game.starfield.update(deltaTime);

        // Update existing bullets
        for (let i = game.bullets.length - 1; i >= 0; i--) {
            const b = game.bullets[i];
            b.update(deltaTime);
            if (!b.active) {
                game.bullets.splice(i, 1);
            }
        }

        // Update existing asteroids
        for (let i = game.asteroids.length - 1; i >= 0; i--) {
            const a = game.asteroids[i];
            a.update(deltaTime);
            if (!a.active) {
                game.asteroids.splice(i, 1);
            }
        }

        game.particleManager.update(deltaTime);

        if (this.timer <= 0 && game.particleManager.particles.length === 0) {
            // Respawn
            game.ship.y = GAME_HEIGHT / 2;
            game.asteroids = [];
            game.asteroidTimer = 0;
            game.toPlaying();
        }
    }

    draw(game: Game, ctx: CanvasRenderingContext2D): void {
        game.starfield.draw(ctx);
        game.asteroids.forEach(a => a.draw(ctx));
        game.bullets.forEach(b => b.draw(ctx));
        game.particleManager.draw(ctx);
        // Ship is hidden
    }

    exit(_game: Game): void { }
}

