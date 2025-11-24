import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ship } from '../../../src/actors/Ship';
import { MockInput } from '../../utils/MockInput';
import { Bullet } from '../../../src/actors/Bullet';
import { SHIP_SIZE } from '../../../src/core/Constants';
import { PLAY_AREA_HEIGHT, SHIP_SPEED } from '../../../src/states/PlayingState';

describe('Ship', () => {
    let ship: Ship;
    let input: MockInput;
    let bullets: Bullet[];

    beforeEach(() => {
        input = new MockInput();
        bullets = [];
        ship = new Ship(input, bullets);
    });

    describe('Movement', () => {
        it('should move up when ArrowUp is pressed', () => {
            const initialY = ship.y;
            input.pressKey('ArrowUp');
            ship.update(0.1);
            expect(ship.y).toBeLessThan(initialY);
            expect(ship.y).toBe(initialY - SHIP_SPEED * 0.1);
        });

        it('should move down when ArrowDown is pressed', () => {
            const initialY = ship.y;
            input.pressKey('ArrowDown');
            ship.update(0.1);
            expect(ship.y).toBeGreaterThan(initialY);
            expect(ship.y).toBe(initialY + SHIP_SPEED * 0.1);
        });

        it('should not move when no keys are pressed', () => {
            const initialY = ship.y;
            ship.update(0.1);
            expect(ship.y).toBe(initialY);
        });

        it('should clamp position to top boundary', () => {
            ship.y = SHIP_SIZE;
            input.pressKey('ArrowUp');
            ship.update(0.1);
            expect(ship.y).toBe(SHIP_SIZE);
        });

        it('should clamp position to bottom boundary', () => {
            ship.y = PLAY_AREA_HEIGHT - SHIP_SIZE;
            input.pressKey('ArrowDown');
            ship.update(0.1);
            expect(ship.y).toBe(PLAY_AREA_HEIGHT - SHIP_SIZE);
        });

        it('should not move when not controllable', () => {
            ship.controllable = false;
            const initialY = ship.y;
            input.pressKey('ArrowUp');
            ship.update(0.1);
            expect(ship.y).toBe(initialY);
        });

        it('should not move when not visible', () => {
            ship.visible = false;
            const initialY = ship.y;
            input.pressKey('ArrowUp');
            ship.update(0.1);
            expect(ship.y).toBe(initialY);
        });
    });

    describe('Shooting', () => {
        it('should create bullet when Space is pressed', () => {
            const initialBulletCount = bullets.length;
            // Mock performance.now() to return a time that allows shooting
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(1000);
            input.pressKey('Space');
            ship.update(0.001);
            expect(bullets.length).toBe(initialBulletCount + 1);
            vi.restoreAllMocks();
        });

        it('should not shoot when fire rate limit is not met', () => {
            input.pressKey('Space');
            ship.update(0.001);
            const bulletCount = bullets.length;
            ship.update(0.001);
            expect(bullets.length).toBe(bulletCount);
        });

        it('should not shoot when not controllable', () => {
            ship.controllable = false;
            const initialBulletCount = bullets.length;
            input.pressKey('Space');
            ship.update(0.001);
            expect(bullets.length).toBe(initialBulletCount);
        });
    });
});

