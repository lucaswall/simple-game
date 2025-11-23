import { GameState } from '../interfaces/GameState';
import { Game } from '../Game';
import { Asteroid } from '../Asteroid';
import { ASTEROID_SPAWN_INTERVAL, HIT_FREEZE_DURATION, SHIP_COLLISION_X, SHIP_COLLISION_RADIUS, SHAKE_INTENSITY_SHIP_HIT, SHAKE_INTENSITY_ASTEROID_HIT, ASTEROID_HIT_FREEZE_DURATION, ASTEROID_COLOR } from '../Constants';

export class PlayingState implements GameState {
    enter(game: Game): void {
        game.ship.visible = true;
    }

    update(game: Game, deltaTime: number): void {
        // Skip updates if frozen (Game.update handles freeze timer)
        if (game.freezeTimer > 0) {
            return;
        }

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
                const dx = asteroid.x - SHIP_COLLISION_X;
                const dy = asteroid.y - game.ship.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < asteroid.size + SHIP_COLLISION_RADIUS) {
                    game.shakeIntensity = SHAKE_INTENSITY_SHIP_HIT;
                    game.startFreeze(HIT_FREEZE_DURATION, () => {
                        game.toExploding();
                    });
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
                    game.particleManager.createExplosion(asteroid.x, asteroid.y, ASTEROID_COLOR);
                    game.asteroids.splice(i, 1);
                    game.bullets.splice(j, 1);

                    game.shakeIntensity = SHAKE_INTENSITY_ASTEROID_HIT;
                    game.startFreeze(ASTEROID_HIT_FREEZE_DURATION, () => {
                        // Stay in playing state, freeze just provides visual feedback
                    });
                    break;
                }
            }
        }
    }
}
