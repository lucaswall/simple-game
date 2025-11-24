import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Input } from '../../../src/core/Input';
import { GAME_WIDTH, GAME_HEIGHT } from '../../../src/core/Constants';

describe('Input', () => {
    let input: Input;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        // Create a mock canvas element
        mockCanvas = document.createElement('canvas');
        mockCanvas.width = GAME_WIDTH;
        mockCanvas.height = GAME_HEIGHT;
        input = new Input(mockCanvas);
    });

    describe('Keyboard Input', () => {
        it('should initialize with all keys as false', () => {
            expect(input.keys.ArrowUp).toBe(false);
            expect(input.keys.ArrowDown).toBe(false);
            expect(input.keys.Space).toBe(false);
            expect(input.keys.Escape).toBe(false);
        });

        it('should set ArrowUp to true on keydown', () => {
            const event = new KeyboardEvent('keydown', { code: 'ArrowUp' });
            window.dispatchEvent(event);
            expect(input.keys.ArrowUp).toBe(true);
        });

        it('should set ArrowUp to false on keyup', () => {
            input.keys.ArrowUp = true;
            const event = new KeyboardEvent('keyup', { code: 'ArrowUp' });
            window.dispatchEvent(event);
            expect(input.keys.ArrowUp).toBe(false);
        });

        it('should handle Space key', () => {
            const downEvent = new KeyboardEvent('keydown', { code: 'Space' });
            window.dispatchEvent(downEvent);
            expect(input.keys.Space).toBe(true);

            const upEvent = new KeyboardEvent('keyup', { code: 'Space' });
            window.dispatchEvent(upEvent);
            expect(input.keys.Space).toBe(false);
        });

        it('should clear all keys', () => {
            input.keys.ArrowUp = true;
            input.keys.ArrowDown = true;
            input.keys.Space = true;
            input.keys.Escape = true;

            input.clearKeys();

            expect(input.keys.ArrowUp).toBe(false);
            expect(input.keys.ArrowDown).toBe(false);
            expect(input.keys.Space).toBe(false);
            expect(input.keys.Escape).toBe(false);
        });
    });

    describe('Touch Input', () => {
        beforeEach(() => {
            // Mock getBoundingClientRect for consistent testing
            vi.spyOn(mockCanvas, 'getBoundingClientRect').mockReturnValue({
                left: 0,
                top: 0,
                right: GAME_WIDTH,
                bottom: GAME_HEIGHT,
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                x: 0,
                y: 0,
                toJSON: () => {}
            } as DOMRect);
            // Set reference Y for touch zone detection
            input.setReferenceY(GAME_HEIGHT / 2);
        });

        it('should handle touch above ship Y position (ArrowUp)', () => {
            // Set reference Y to middle of screen
            input.setReferenceY(GAME_HEIGHT / 2);
            
            // Create a mock touch object above ship Y
            const touch = {
                identifier: 1,
                clientX: GAME_WIDTH * 0.25,
                clientY: GAME_HEIGHT * 0.25, // Above ship Y (which is at GAME_HEIGHT / 2)
                target: mockCanvas,
                screenX: GAME_WIDTH * 0.25,
                screenY: GAME_HEIGHT * 0.25,
                pageX: GAME_WIDTH * 0.25,
                pageY: GAME_HEIGHT * 0.25,
                radiusX: 0,
                radiusY: 0,
                rotationAngle: 0,
                force: 0
            } as Touch;

            const touchEvent = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [touch],
                changedTouches: [touch],
                targetTouches: [touch]
            });

            window.dispatchEvent(touchEvent);
            expect(input.keys.ArrowUp).toBe(true);
            expect(input.keys.ArrowDown).toBe(false);
        });

        it('should handle touch below ship Y position (ArrowDown)', () => {
            // Set reference Y to middle of screen
            input.setReferenceY(GAME_HEIGHT / 2);
            
            const touch = {
                identifier: 1,
                clientX: GAME_WIDTH * 0.25,
                clientY: GAME_HEIGHT * 0.75, // Below ship Y (which is at GAME_HEIGHT / 2)
                target: mockCanvas,
                screenX: GAME_WIDTH * 0.25,
                screenY: GAME_HEIGHT * 0.75,
                pageX: GAME_WIDTH * 0.25,
                pageY: GAME_HEIGHT * 0.75,
                radiusX: 0,
                radiusY: 0,
                rotationAngle: 0,
                force: 0
            } as Touch;

            const touchEvent = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [touch],
                changedTouches: [touch],
                targetTouches: [touch]
            });

            window.dispatchEvent(touchEvent);
            expect(input.keys.ArrowDown).toBe(true);
            expect(input.keys.ArrowUp).toBe(false);
        });

        it('should handle touch in right side (Space)', () => {
            const touch = {
                identifier: 1,
                clientX: GAME_WIDTH * 0.75,
                clientY: GAME_HEIGHT * 0.5,
                target: mockCanvas,
                screenX: GAME_WIDTH * 0.75,
                screenY: GAME_HEIGHT * 0.5,
                pageX: GAME_WIDTH * 0.75,
                pageY: GAME_HEIGHT * 0.5,
                radiusX: 0,
                radiusY: 0,
                rotationAngle: 0,
                force: 0
            } as Touch;

            const touchEvent = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [touch],
                changedTouches: [touch],
                targetTouches: [touch]
            });

            window.dispatchEvent(touchEvent);
            expect(input.keys.Space).toBe(true);
        });

        it('should release keys on touch end', () => {
            input.setReferenceY(GAME_HEIGHT / 2);
            
            // Start touch
            const touch = {
                identifier: 1,
                clientX: GAME_WIDTH * 0.25,
                clientY: GAME_HEIGHT * 0.25,
                target: mockCanvas,
                screenX: GAME_WIDTH * 0.25,
                screenY: GAME_HEIGHT * 0.25,
                pageX: GAME_WIDTH * 0.25,
                pageY: GAME_HEIGHT * 0.25,
                radiusX: 0,
                radiusY: 0,
                rotationAngle: 0,
                force: 0
            } as Touch;

            const startEvent = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [touch],
                changedTouches: [touch],
                targetTouches: [touch]
            });
            window.dispatchEvent(startEvent);
            expect(input.keys.ArrowUp).toBe(true);

            // End touch
            const endEvent = new TouchEvent('touchend', {
                bubbles: true,
                cancelable: true,
                touches: [],
                changedTouches: [touch],
                targetTouches: []
            });
            window.dispatchEvent(endEvent);
            expect(input.keys.ArrowUp).toBe(false);
        });

        it('should handle multiple simultaneous touches', () => {
            input.setReferenceY(GAME_HEIGHT / 2);
            
            const touch1 = {
                identifier: 1,
                clientX: GAME_WIDTH * 0.25,
                clientY: GAME_HEIGHT * 0.25, // Above ship Y
                target: mockCanvas,
                screenX: GAME_WIDTH * 0.25,
                screenY: GAME_HEIGHT * 0.25,
                pageX: GAME_WIDTH * 0.25,
                pageY: GAME_HEIGHT * 0.25,
                radiusX: 0,
                radiusY: 0,
                rotationAngle: 0,
                force: 0
            } as Touch;

            const touch2 = {
                identifier: 2,
                clientX: GAME_WIDTH * 0.75, // Right side for shooting
                clientY: GAME_HEIGHT * 0.5,
                target: mockCanvas,
                screenX: GAME_WIDTH * 0.75,
                screenY: GAME_HEIGHT * 0.5,
                pageX: GAME_WIDTH * 0.75,
                pageY: GAME_HEIGHT * 0.5,
                radiusX: 0,
                radiusY: 0,
                rotationAngle: 0,
                force: 0
            } as Touch;

            const touchEvent = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [touch1, touch2],
                changedTouches: [touch1, touch2],
                targetTouches: [touch1, touch2]
            });

            window.dispatchEvent(touchEvent);
            expect(input.keys.ArrowUp).toBe(true);
            expect(input.keys.Space).toBe(true);
        });
    });

});

