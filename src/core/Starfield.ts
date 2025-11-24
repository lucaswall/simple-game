import { Actor } from '../interfaces/Actor';
import { GAME_WIDTH, STAR_COUNT, STAR_MIN_SPEED, STAR_MAX_SPEED } from './Constants';
import { PLAY_AREA_HEIGHT } from '../states/PlayingState';

interface Star {
    x: number;
    y: number;
    size: number;
    speed: number;
    brightness: number;
}

export class Starfield implements Actor {
    private stars: Star[] = [];

    constructor() {
        for (let i = 0; i < STAR_COUNT; i++) {
            this.stars.push({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * PLAY_AREA_HEIGHT,
                size: Math.random() * 2 + 1,
                speed: Math.random() * (STAR_MAX_SPEED - STAR_MIN_SPEED) + STAR_MIN_SPEED,
                brightness: Math.random()
            });
        }
    }

    update(deltaTime: number): void {
        this.stars.forEach(star => {
            star.x -= star.speed * deltaTime;
            if (star.x < 0) {
                star.x = GAME_WIDTH;
                star.y = Math.random() * PLAY_AREA_HEIGHT;
            }
        });
    }

    draw(ctx: CanvasRenderingContext2D): void {
        this.stars.forEach(star => {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }
}

