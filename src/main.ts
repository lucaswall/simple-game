
import './style.css'
import { GAME_WIDTH, GAME_HEIGHT, PAUSE_OVERLAY_ALPHA, PAUSE_FONT_SIZE, LINK_ROW_ALLOWANCE } from './core/Constants';
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

// Fullscreen handling - prefer feature detection over userAgent sniffing
function isMobileDevice(): boolean {
    // Primary: Check for touch capability (most reliable)
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        return true;
    }
    // Secondary: Check for hover capability (no hover = likely mobile)
    if (window.matchMedia && window.matchMedia('(hover: none)').matches) {
        return true;
    }
    // Tertiary: Check viewport width
    if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) {
        return true;
    }
    // Fallback: userAgent as last resort (least reliable)
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function getFullscreenElement(): Element | null {
    return document.fullscreenElement ||
           (document as any).webkitFullscreenElement ||
           (document as any).mozFullScreenElement ||
           (document as any).msFullscreenElement ||
           null;
}

function requestFullscreen(element: HTMLElement): Promise<void> {
    if (element.requestFullscreen) {
        return element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
        return (element as any).webkitRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
        return (element as any).mozRequestFullScreen();
    } else if ((element as any).msRequestFullscreen) {
        return (element as any).msRequestFullscreen();
    }
    return Promise.reject(new Error('Fullscreen API not supported'));
}


function handleFullscreenChange() {
    const isFullscreen = getFullscreenElement() !== null;
    // Update UI if needed when fullscreen changes
    if (isFullscreen) {
        document.body.classList.add('fullscreen');
    } else {
        document.body.classList.remove('fullscreen');
    }
}

// Set up fullscreen change listeners
const fullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
fullscreenEvents.forEach(event => {
    document.addEventListener(event, handleFullscreenChange);
});

// Auto-request fullscreen on mobile after user interaction
function attemptFullscreen() {
    if (isMobileDevice() && !getFullscreenElement()) {
        // Request fullscreen on the document body or app container
        const appElement = document.getElementById('app') || document.documentElement;
        requestFullscreen(appElement as HTMLElement).catch((error) => {
            // Fullscreen request failed (user denied or not supported)
            console.log('Fullscreen request failed:', error);
        });
    }
}

// Request fullscreen after first user interaction (required by browsers)
let fullscreenRequested = false;
function requestFullscreenOnInteraction() {
    if (!fullscreenRequested && isMobileDevice()) {
        fullscreenRequested = true;
        attemptFullscreen();
    }
}

// Listen for user interactions to trigger fullscreen
['touchstart', 'click', 'keydown'].forEach(event => {
    document.addEventListener(event, requestFullscreenOnInteraction, { once: true, passive: true });
});

// Attempt fullscreen when rotating to landscape
function attemptFullscreenOnLandscape() {
    const isPortrait = window.innerHeight > window.innerWidth;
    if (!isPortrait && isMobileDevice() && !getFullscreenElement()) {
        // Small delay to ensure orientation change is complete
        setTimeout(() => {
            attemptFullscreen();
        }, 200);
    }
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
        // Attempt fullscreen when rotating to landscape
        attemptFullscreenOnLandscape();
    }
}

// Make canvas responsive for mobile
function resizeCanvas() {
    // Use window dimensions to account for address bar
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;

    // Leave room for the repo link row so it stays visible on all screens
    const linkAllowance = LINK_ROW_ALLOWANCE;
    
    // Maintain aspect ratio
    const aspectRatio = GAME_WIDTH / GAME_HEIGHT;
    let displayWidth = containerWidth;
    let displayHeight = containerWidth / aspectRatio;
    
    const maxHeight = Math.max(containerHeight - linkAllowance, 0);
    if (displayHeight > maxHeight) {
        displayHeight = maxHeight;
        displayWidth = maxHeight * aspectRatio;
    }
    
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    
    // Ensure canvas stays centered
    canvas.style.margin = '0 auto';
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

// Listen for orientation changes and viewport changes
function handleResize() {
    checkOrientation();
    resizeCanvas();
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        handleResize();
    }, 100);
});

// Handle mobile browser address bar show/hide
let lastHeight = window.innerHeight;
window.addEventListener('resize', () => {
    const currentHeight = window.innerHeight;
    // If height changed significantly, address bar likely appeared/disappeared
    if (Math.abs(currentHeight - lastHeight) > 50) {
        setTimeout(() => {
            handleResize();
            lastHeight = window.innerHeight;
        }, 100);
    }
});

// Listen for screen orientation API changes if available
if ('orientation' in screen) {
    screen.orientation.addEventListener('change', () => {
        checkOrientation();
        resizeCanvas();
        // Also attempt fullscreen on orientation change to landscape
        attemptFullscreenOnLandscape();
    });
}

// Create initial state (Main Menu)
const input = new Input(canvas);
input.setCanvas(canvas); // Ensure canvas is set for coordinate conversion
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

