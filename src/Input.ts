export class Input {
    keys: { [key: string]: boolean } = {
        ArrowUp: false,
        ArrowDown: false,
        Space: false,
        Escape: false
    };

    constructor() {
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
    }

    clearKeys(): void {
        this.keys.ArrowUp = false;
        this.keys.ArrowDown = false;
        this.keys.Space = false;
        this.keys.Escape = false;
    }
}
