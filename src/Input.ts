export class Input {
    keys: { [key: string]: boolean } = {
        ArrowUp: false,
        ArrowDown: false,
        Space: false
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
}
