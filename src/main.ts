import './style.css'

const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')!;
const ctx = canvas.getContext('2d')!;

// Game Constants
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const SHIP_SPEED = 400; // Pixels per second
const SHIP_SIZE = 30;
const STAR_COUNT = 150;
const STAR_MIN_SPEED = 50;
const STAR_MAX_SPEED = 200;
const ASTEROID_MIN_SPEED = 200;
const ASTEROID_MAX_SPEED = 400;
const ASTEROID_SPAWN_INTERVAL = 1.5; // Seconds

interface Star {
    x: number;
    y: number;
    size: number;
    speed: number;
    brightness: number;
}

interface Asteroid {
    x: number;
    y: number;
    size: number;
    speed: number;
    vertices: { x: number; y: number }[];
}

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

const stars: Star[] = [];
const asteroids: Asteroid[] = [];
let asteroidTimer = 0;

// Initialize Stars
for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: Math.random() * 2 + 1, // 1 to 3 pixels
        speed: Math.random() * (STAR_MAX_SPEED - STAR_MIN_SPEED) + STAR_MIN_SPEED,
        brightness: Math.random()
    });
}

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

    // Update Stars
    stars.forEach(star => {
        star.x -= star.speed * deltaTime;
        if (star.x < 0) {
            star.x = GAME_WIDTH;
            star.y = Math.random() * GAME_HEIGHT;
        }
    });

    // Update Asteroids
    asteroidTimer -= deltaTime;
    if (asteroidTimer <= 0) {
        const size = Math.random() * 15 + 15; // 15 to 30 pixels (smaller)
        const vertexCount = Math.floor(Math.random() * 5) + 5; // 5 to 9 vertices
        const vertices = [];

        for (let i = 0; i < vertexCount; i++) {
            const angle = (i / vertexCount) * Math.PI * 2;
            const radius = size * (0.5 + Math.random() * 0.5); // Vary radius for jaggedness
            vertices.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }

        asteroids.push({
            x: GAME_WIDTH,
            y: Math.random() * (GAME_HEIGHT - 40) + 20,
            size: size,
            speed: Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED) + ASTEROID_MIN_SPEED,
            vertices: vertices
        });
        asteroidTimer = ASTEROID_SPAWN_INTERVAL;
    }

    asteroids.forEach((asteroid, index) => {
        asteroid.x -= asteroid.speed * deltaTime;
        // Remove if off screen
        if (asteroid.x + asteroid.size < 0) {
            asteroids.splice(index, 1);
        }
    });
}

function draw() {
    // Clear screen
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Stars
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Draw Asteroids
    ctx.fillStyle = '#888';
    asteroids.forEach(asteroid => {
        ctx.beginPath();
        // Draw polygon based on vertices relative to asteroid center
        if (asteroid.vertices.length > 0) {
            ctx.moveTo(asteroid.x + asteroid.vertices[0].x, asteroid.y + asteroid.vertices[0].y);
            for (let i = 1; i < asteroid.vertices.length; i++) {
                ctx.lineTo(asteroid.x + asteroid.vertices[i].x, asteroid.y + asteroid.vertices[i].y);
            }
        }
        ctx.closePath();
        ctx.fill();
    });

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
