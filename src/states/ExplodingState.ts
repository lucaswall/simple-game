
import { GameState } from '../interfaces/GameState';
import { Game } from '../Game';
import { EXPLOSION_DURATION, GAME_HEIGHT, SHIP_COLLISION_X, EXPLOSION_TIME_SCALE } from '../Constants';

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
        // Apply time scale to slow down everything during explosion
        const scaledDeltaTime = deltaTime * EXPLOSION_TIME_SCALE;
        
        this.timer -= scaledDeltaTime;

        // Continue environment movement (slowed down)
        game.starfield.update(scaledDeltaTime);

        // Update existing bullets (slowed down)
        for (let i = game.bullets.length - 1; i >= 0; i--) {
            const b = game.bullets[i];
            b.update(scaledDeltaTime);
            if (!b.active) {
                game.bullets.splice(i, 1);
            }
        }

        // Update existing asteroids (slowed down)
        for (let i = game.asteroids.length - 1; i >= 0; i--) {
            const a = game.asteroids[i];
            a.update(scaledDeltaTime);
            if (!a.active) {
                game.asteroids.splice(i, 1);
            }
        }

        game.particleManager.update(scaledDeltaTime);

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

