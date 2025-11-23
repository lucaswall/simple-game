import { GameState } from '../interfaces/GameState';
import { Game } from '../Game';
import { Asteroid } from '../Asteroid';
import { ASTEROID_SPAWN_INTERVAL, HIT_FREEZE_DURATION } from '../Constants';

export class PlayingState implements GameState {
    enter(game: Game): void {
        game.ship.visible = true;
    }

    update(game: Game, deltaTime: number): void {
        game.starfield.update(deltaTime);
        game.ship.update(deltaTime);
        this.updateBullets(game, deltaTime);
        this.updateAsteroids(game, deltaTime);
        game.particleManager.update(deltaTime);
        this.checkCollisions(game);
    }

    draw(game: Game, ctx: CanvasRenderingContext2D): void {
        game.starfield.draw(ctx);
        game.asteroids.forEach(a => a.draw(ctx));
        game.bullets.forEach(b => b.draw(ctx));
        game.particleManager.draw(ctx);
        game.ship.draw(ctx);
    }

    exit(_game: Game): void { }

    private updateBullets(game: Game, deltaTime: number) {
        for (let i = game.bullets.length - 1; i >= 0; i--) {
            const b = game.bullets[i];
            b.update(deltaTime);
            if (!b.active) {
                game.bullets.splice(i, 1);
            }
        }
    }

    private updateAsteroids(game: Game, deltaTime: number) {
        game.asteroidTimer -= deltaTime;
        if (game.asteroidTimer <= 0) {
            game.asteroids.push(new Asteroid());
            game.asteroidTimer = ASTEROID_SPAWN_INTERVAL;
        }

        for (let i = game.asteroids.length - 1; i >= 0; i--) {
            const a = game.asteroids[i];
            a.update(deltaTime);
            if (!a.active) {
                game.asteroids.splice(i, 1);
            }
        }
    }

    private checkCollisions(game: Game) {
        for (let i = game.asteroids.length - 1; i >= 0; i--) {
            const asteroid = game.asteroids[i];

            // Ship Collision
            if (game.ship.visible) {
                const dx = asteroid.x - 75;
                const dy = asteroid.y - game.ship.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < asteroid.size + 15) {
                    game.shakeIntensity = 20;
                    game.toHitFreeze(HIT_FREEZE_DURATION);
                    return;
                }
            }

            // Bullet Collision
            for (let j = game.bullets.length - 1; j >= 0; j--) {
                const bullet = game.bullets[j];
                const dx = asteroid.x - bullet.x;
                const dy = asteroid.y - bullet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < asteroid.size + bullet.size) {
                    game.particleManager.createExplosion(asteroid.x, asteroid.y, '#888');
                    game.asteroids.splice(i, 1);
                    game.bullets.splice(j, 1);

                    game.shakeIntensity = 10;
                    game.toAsteroidHitFreeze(0.05);
                    break;
                }
            }
        }
    }
}
