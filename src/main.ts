
import './style.css'
import { GAME_WIDTH, GAME_HEIGHT, PAUSE_OVERLAY_ALPHA, PAUSE_FONT_SIZE } from './core/Constants';
import { Game } from './core/Game';
import { MainMenuState } from './states/MainMenuState';
import { Input } from './core/Input';

const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')!;
const ctx = canvas.getContext('2d')!;

// Set logical resolution
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Orientation handling
const orientationMessage = document.getElementById('orientation-message')!;
let isPortraitMode = false;
let orientationLockAttempted = false;
let orientationLockSupported = false;

// Check if orientation lock is supported
if ('orientation' in screen && 'lock' in screen.orientation) {
    orientationLockSupported = true;
}

async function attemptOrientationLock() {
    if (!orientationLockSupported || orientationLockAttempted) {
        return false;
    }

    try {
        await (screen.orientation as any).lock('landscape');
        orientationLockAttempted = true;
        return true;
    } catch (error) {
        // Lock failed or not allowed
        orientationLockAttempted = true;
        return false;
    }
}

function checkOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;
    
    // Only pause and show message if orientation lock failed or is not supported
    if (isPortrait && orientationLockAttempted && !orientationLockSupported) {
        isPortraitMode = true;
        orientationMessage.classList.add('show');
    } else if (isPortrait && orientationLockAttempted) {
        // Lock was attempted but may have failed - check if we're still in portrait
        // This handles the case where lock() was called but device is still rotating
        isPortraitMode = true;
        orientationMessage.classList.add('show');
    } else if (isPortrait && !orientationLockAttempted) {
        // First time in portrait - try to lock
        attemptOrientationLock().then((locked) => {
            if (!locked) {
                // Lock failed, show message
                isPortraitMode = true;
                orientationMessage.classList.add('show');
            } else {
                // Lock succeeded, wait a moment for device to rotate
                setTimeout(() => {
                    checkOrientation();
                }, 500);
            }
        });
    } else {
        // Landscape mode
        isPortraitMode = false;
        orientationMessage.classList.remove('show');
    }
}

// Make canvas responsive for mobile
function resizeCanvas() {
    const container = canvas.parentElement!;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Maintain aspect ratio
    const aspectRatio = GAME_WIDTH / GAME_HEIGHT;
    let displayWidth = containerWidth;
    let displayHeight = containerWidth / aspectRatio;
    
    if (displayHeight > containerHeight) {
        displayHeight = containerHeight;
        displayWidth = containerHeight * aspectRatio;
    }
    
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
}

// Try to lock orientation on load (if supported)
if (orientationLockSupported) {
    attemptOrientationLock().catch(() => {
        // Lock failed, will fall back to message on portrait
    });
}

// Initial orientation check
checkOrientation();

// Initial resize
resizeCanvas();

// Listen for orientation changes
window.addEventListener('resize', () => {
    checkOrientation();
    resizeCanvas();
});

window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        checkOrientation();
        resizeCanvas();
    }, 100);
});

// Listen for screen orientation API changes if available
if ('orientation' in screen) {
    screen.orientation.addEventListener('change', () => {
        checkOrientation();
        resizeCanvas();
    });
}

// Create initial state (Main Menu)
const input = new Input(canvas);
const initialState = new MainMenuState(input);

// Initialize Game with initial state
const game = new Game(ctx, initialState);

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
    // Pause if in portrait mode or window is blurred
    if (isPaused || isPortraitMode) {
        if (isPortraitMode) {
            // Don't draw paused overlay in portrait - orientation message is shown instead
        } else {
            drawPaused();
        }
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

