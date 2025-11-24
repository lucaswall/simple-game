export class Input {
    keys: { [key: string]: boolean } = {
        ArrowUp: false,
        ArrowDown: false,
        Space: false,
        Escape: false
    };

    private canvas: HTMLCanvasElement | null = null;
    private activeTouches: Map<number, { x: number; y: number }> = new Map();

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

        // Touch events
        if (this.canvas) {
            this.setupTouchEvents();
        }
    }

    setCanvas(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        this.setupTouchEvents();
    }

    private setupTouchEvents(): void {
        if (!this.canvas) return;

        // Prevent default touch behaviors (scrolling, zooming)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });

        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });
    }

    private getTouchPosition(touch: Touch): { x: number; y: number } | null {
        if (!this.canvas) return null;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

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
        const canvasHeight = this.canvas.height;
        const midX = canvasWidth / 2;
        const midY = canvasHeight / 2;

        // Left side: movement controls
        if (x < midX) {
            if (y < midY) {
                // Upper left: move up
                this.keys.ArrowUp = isActive;
            } else {
                // Lower left: move down
                this.keys.ArrowDown = isActive;
            }
        }
        // Right side: shooting
        else {
            this.keys.Space = isActive;
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

