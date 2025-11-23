
import './style.css'
import { GAME_WIDTH, GAME_HEIGHT, PAUSE_OVERLAY_ALPHA, PAUSE_FONT_SIZE } from './Constants';
import { Game } from './Game';

const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')!;
const ctx = canvas.getContext('2d')!;

// Set logical resolution
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Initialize Game
const game = new Game(ctx);

// Game Loop
let lastTime = 0;
let isPaused = false;

// Pause Handling
window.addEventListener('blur', () => {
    isPaused = true;
});

window.addEventListener('focus', () => {
    isPaused = false;
    lastTime = performance.now();
});

function gameLoop(timestamp: number) {
    if (isPaused) {
        drawPaused();
        requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    game.update(deltaTime);
    game.draw();

    requestAnimationFrame(gameLoop);
}

function drawPaused() {
    ctx.fillStyle = `rgba(0, 0, 0, ${PAUSE_OVERLAY_ALPHA})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = `${PAUSE_FONT_SIZE}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);
}

// Start the loop
requestAnimationFrame(gameLoop);

