import { describe, it, expect } from 'vitest';
import { CollisionManager } from '../../../src/managers/CollisionManager';
import { CollisionBounds } from '../../../src/interfaces/Collidable';

describe('CollisionManager', () => {
    describe('checkBounds', () => {
        it('should detect collision between two circles', () => {
            const boundsA: CollisionBounds = {
                type: 'circle',
                centerX: 100,
                centerY: 100,
                radius: 20
            };
            const boundsB: CollisionBounds = {
                type: 'circle',
                centerX: 110,
                centerY: 100,
                radius: 15
            };
            
            expect(CollisionManager.checkBounds(boundsA, boundsB)).toBe(true);
        });

        it('should not detect collision when circles are far apart', () => {
            const boundsA: CollisionBounds = {
                type: 'circle',
                centerX: 100,
                centerY: 100,
                radius: 20
            };
            const boundsB: CollisionBounds = {
                type: 'circle',
                centerX: 200,
                centerY: 200,
                radius: 15
            };
            
            expect(CollisionManager.checkBounds(boundsA, boundsB)).toBe(false);
        });

        it('should detect collision at exact boundary', () => {
            const boundsA: CollisionBounds = {
                type: 'circle',
                centerX: 100,
                centerY: 100,
                radius: 20
            };
            const boundsB: CollisionBounds = {
                type: 'circle',
                centerX: 100 + 20 + 20 - 0.1, // Just touching
                centerY: 100,
                radius: 20
            };
            
            expect(CollisionManager.checkBounds(boundsA, boundsB)).toBe(true);
        });

        it('should not detect collision when circles are just separated', () => {
            const boundsA: CollisionBounds = {
                type: 'circle',
                centerX: 100,
                centerY: 100,
                radius: 20
            };
            const boundsB: CollisionBounds = {
                type: 'circle',
                centerX: 100 + 20 + 20 + 0.1, // Just separated
                centerY: 100,
                radius: 20
            };

            expect(CollisionManager.checkBounds(boundsA, boundsB)).toBe(false);
        });

        it('should return false when first circle is missing centerX', () => {
            const boundsA: CollisionBounds = {
                type: 'circle',
                centerY: 100,
                radius: 20
            };
            const boundsB: CollisionBounds = {
                type: 'circle',
                centerX: 100,
                centerY: 100,
                radius: 20
            };

            expect(CollisionManager.checkBounds(boundsA, boundsB)).toBe(false);
        });

        it('should return false when circle is missing centerY', () => {
            const boundsA: CollisionBounds = {
                type: 'circle',
                centerX: 100,
                radius: 20
            };
            const boundsB: CollisionBounds = {
                type: 'circle',
                centerX: 100,
                centerY: 100,
                radius: 20
            };

            expect(CollisionManager.checkBounds(boundsA, boundsB)).toBe(false);
        });

        it('should return false when circle is missing radius', () => {
            const boundsA: CollisionBounds = {
                type: 'circle',
                centerX: 100,
                centerY: 100
            };
            const boundsB: CollisionBounds = {
                type: 'circle',
                centerX: 100,
                centerY: 100,
                radius: 20
            };

            expect(CollisionManager.checkBounds(boundsA, boundsB)).toBe(false);
        });
    });
});

