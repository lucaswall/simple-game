import { Input } from '../../src/core/Input';

export class MockInput extends Input {
    constructor() {
        super();
        // Override to prevent actual event listeners
    }

    // Helper methods for test control
    pressKey(key: 'ArrowUp' | 'ArrowDown' | 'Space' | 'Escape'): void {
        this.keys[key] = true;
    }

    releaseKey(key: 'ArrowUp' | 'ArrowDown' | 'Space' | 'Escape'): void {
        this.keys[key] = false;
    }

    pressAllKeys(): void {
        this.keys.ArrowUp = true;
        this.keys.ArrowDown = true;
        this.keys.Space = true;
        this.keys.Escape = true;
    }

    releaseAllKeys(): void {
        this.keys.ArrowUp = false;
        this.keys.ArrowDown = false;
        this.keys.Space = false;
        this.keys.Escape = false;
    }
}

