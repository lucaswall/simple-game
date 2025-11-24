import { describe, it, expect } from 'vitest';
import { Bullet } from '../../../src/actors/Bullet';
import { GAME_WIDTH } from '../../../src/core/Constants';
import { BULLET_SPEED } from '../../../src/states/PlayingState';

describe('Bullet', () => {
    describe('Movement', () => {
        it('should move right over time', () => {
            const bullet = new Bullet(100, 200, BULLET_SPEED, 5);
            const initialX = bullet.x;
            bullet.update(0.1);
            expect(bullet.x).toBeGreaterThan(initialX);
            expect(bullet.x).toBe(initialX + BULLET_SPEED * 0.1);
        });

        it('should deactivate when off-screen', () => {
            const bullet = new Bullet(GAME_WIDTH + 1, 200, BULLET_SPEED, 5);
            bullet.update(0.1);
            expect(bullet.active).toBe(false);
        });

        it('should remain active when on screen', () => {
            const bullet = new Bullet(100, 200, BULLET_SPEED, 5);
            bullet.update(0.1);
            expect(bullet.active).toBe(true);
        });
    });
});

