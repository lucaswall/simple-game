export class Input {
    keys: { [key: string]: boolean } = {
        ArrowUp: false,
        ArrowDown: false,
        Space: false,
        Escape: false,
        KeyD: false,
        KeyF: false
    };

    private canvas: HTMLCanvasElement | null = null;
    private activeTouches: Map<number, { x: number; y: number }> = new Map();
    private referenceY: number = 0; // Ship Y position for relative touch detection

    constructor(canvas?: HTMLCanvasElement) {
        this.canvas = canvas || null;

        // Keyboard events
        window.addEventListener('keydown', (e) => {
            if (e.code in this.keys) {
                this.keys[e.code] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code in this.keys) {
                this.keys[e.code] = false;
            }
        });

        // Touch events on window (works outside canvas)
        this.setupTouchEvents();
    }

    setCanvas(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
    }

    setReferenceY(y: number): void {
        this.referenceY = y;
    }

    private setupTouchEvents(): void {
        // Prevent default touch behaviors (scrolling, zooming) on the entire window
        const preventDefault = (e: TouchEvent) => {
            e.preventDefault();
        };

        window.addEventListener('touchstart', (e) => {
            preventDefault(e);
            this.handleTouchStart(e);
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            preventDefault(e);
            this.handleTouchMove(e);
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            preventDefault(e);
            this.handleTouchEnd(e);
        }, { passive: false });

        window.addEventListener('touchcancel', (e) => {
            preventDefault(e);
            this.handleTouchEnd(e);
        }, { passive: false });
    }

    private getTouchPosition(touch: Touch): { x: number; y: number } | null {
        if (!this.canvas) return null;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        // Convert screen coordinates to canvas coordinates
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    }

    private handleTouchStart(e: TouchEvent): void {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const pos = this.getTouchPosition(touch);
            
            if (pos) {
                this.activeTouches.set(touch.identifier, pos);
                this.processTouchZone(pos.x, pos.y, true);
            }
        }
    }

    private handleTouchMove(e: TouchEvent): void {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const pos = this.getTouchPosition(touch);
            
            if (pos) {
                this.activeTouches.set(touch.identifier, pos);
                this.processTouchZone(pos.x, pos.y, true);
            }
        }
    }

    private handleTouchEnd(e: TouchEvent): void {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const pos = this.activeTouches.get(touch.identifier);
            
            if (pos) {
                this.processTouchZone(pos.x, pos.y, false);
                this.activeTouches.delete(touch.identifier);
            }
        }
    }

    private processTouchZone(x: number, y: number, isActive: boolean): void {
        if (!this.canvas) return;

        const canvasWidth = this.canvas.width;
        const midX = canvasWidth / 2;

        // Right side: shooting
        if (x >= midX) {
            this.keys.Space = isActive;
        }
        // Left side: movement based on ship Y position
        else {
            // Compare touch Y with ship Y (referenceY)
            if (y < this.referenceY) {
                // Touch is above ship: move up
                this.keys.ArrowUp = isActive;
                this.keys.ArrowDown = false;
            } else {
                // Touch is below ship: move down
                this.keys.ArrowDown = isActive;
                this.keys.ArrowUp = false;
            }
        }
    }

    clearKeys(): void {
        this.keys.ArrowUp = false;
        this.keys.ArrowDown = false;
        this.keys.Space = false;
        this.keys.Escape = false;
        this.activeTouches.clear();
    }
}

