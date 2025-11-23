import './style.css'

const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')!;
const ctx = canvas.getContext('2d')!;

// Game Constants
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const SHIP_SPEED = 400; // Pixels per second
const SHIP_SIZE = 30;

// Set logical resolution
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Game State
let lastTime = 0;
let shipY = GAME_HEIGHT / 2;
const keys = {
    ArrowUp: false,
    ArrowDown: false
};

// Input Handling
window.addEventListener('keydown', (e) => {
    if (e.code in keys) {
        keys[e.code as keyof typeof keys] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code in keys) {
        keys[e.code as keyof typeof keys] = false;
    }
});

// Game Loop
function gameLoop(timestamp: number) {
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

function update(deltaTime: number) {
    if (keys.ArrowUp) {
        shipY -= SHIP_SPEED * deltaTime;
    }
    if (keys.ArrowDown) {
        shipY += SHIP_SPEED * deltaTime;
    }

    // Clamp ship position
    shipY = Math.max(SHIP_SIZE, Math.min(GAME_HEIGHT - SHIP_SIZE, shipY));
}

function draw() {
    // Clear screen
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Ship (Triangle)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(100, shipY); // Nose
    ctx.lineTo(50, shipY - SHIP_SIZE / 2); // Top back
    ctx.lineTo(50, shipY + SHIP_SIZE / 2); // Bottom back
    ctx.closePath();
    ctx.fill();
}

// Start the loop
requestAnimationFrame(gameLoop);
