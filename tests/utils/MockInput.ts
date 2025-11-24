import { Input } from '../../src/core/Input';

export class MockInput extends Input {
    constructor() {
        super(undefined); // Pass undefined for canvas to prevent touch event setup
        // Override to prevent actual event listeners
    }

    // Helper methods for test control
    pressKey(key: 'ArrowUp' | 'ArrowDown' | 'Space' | 'Escape' | 'KeyD'): void {
        this.keys[key] = true;
    }

    releaseKey(key: 'ArrowUp' | 'ArrowDown' | 'Space' | 'Escape' | 'KeyD'): void {
        this.keys[key] = false;
    }

    pressAllKeys(): void {
        this.keys.ArrowUp = true;
        this.keys.ArrowDown = true;
        this.keys.Space = true;
        this.keys.Escape = true;
        this.keys.KeyD = true;
    }

    releaseAllKeys(): void {
        this.keys.ArrowUp = false;
        this.keys.ArrowDown = false;
        this.keys.Space = false;
        this.keys.Escape = false;
        this.keys.KeyD = false;
    }
}

