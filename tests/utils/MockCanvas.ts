import { vi } from 'vitest';

/**
 * Creates a mock canvas element with a mock 2D rendering context.
 * This prevents jsdom warnings about HTMLCanvasElement.prototype.getContext not being implemented.
 */
export function createMockCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    
    // Create a mock context object with all the methods needed for drawing
    const ctx = {
        canvas: canvas,
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        globalAlpha: 1.0,
        font: '',
        textAlign: 'left' as CanvasTextAlign,
        textBaseline: 'top' as CanvasTextBaseline,
        
        // Drawing methods
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        clearRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        setTransform: vi.fn(),
        getImageData: vi.fn(),
        putImageData: vi.fn(),
        createImageData: vi.fn(),
        drawImage: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        createRadialGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
        })),
        createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
        })),
    } as unknown as CanvasRenderingContext2D;
    
    // Mock getContext to return our mock context
    vi.spyOn(canvas, 'getContext').mockReturnValue(ctx);
    
    return { canvas, ctx };
}

