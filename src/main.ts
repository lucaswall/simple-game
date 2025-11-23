


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

// Visual Effects Constants
const HIT_FREEZE_DURATION = 0.1; // Seconds
const EXPLOSION_DURATION = 1.0; // Seconds
const SHAKE_DECAY = 500; // Pixels per second decay

enum GameState {
    PLAYING,
    HIT_FREEZE,
    EXPLODING,
    ASTEROID_HIT_FREEZE
}

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

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

interface Bullet {
    x: number;
    y: number;
    speed: number;
    size: number;
}

// Set logical resolution
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Game State
let lastTime = 0;
let gameState: GameState = GameState.PLAYING;
let stateTimer = 0;
let shakeIntensity = 0;
let isPaused = false;

let shipY = GAME_HEIGHT / 2;
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    Space: false
};

const stars: Star[] = [];
let asteroids: Asteroid[] = [];
let particles: Particle[] = [];
let bullets: Bullet[] = [];
let asteroidTimer = 0;
let lastShotTime = 0;

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

// Pause Handling
window.addEventListener('blur', () => {
    isPaused = true;
});

window.addEventListener('focus', () => {
    isPaused = false;
    lastTime = performance.now();
});

// Game Loop
function gameLoop(timestamp: number) {
    if (isPaused) {
        // Draw Paused Text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = '#fff';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

function createExplosion(x: number, y: number, color: string = `hsl(${Math.random() * 60 + 10}, 100%, 50%)`) {
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 200 + 50;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: Math.random() * 0.5 + 0.5,
            maxLife: 1.0,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

function update(deltaTime: number) {
    // Update Shake
    if (shakeIntensity > 0) {
        shakeIntensity -= SHAKE_DECAY * deltaTime;
        if (shakeIntensity < 0) shakeIntensity = 0;
    }

    // State Machine
    switch (gameState) {
        case GameState.PLAYING:
            updateShip(deltaTime);
            updateBullets(deltaTime);
            updateEnvironment(deltaTime);
            updateParticles(deltaTime);
            checkCollisions();
            break;
        case GameState.HIT_FREEZE:
        case GameState.ASTEROID_HIT_FREEZE:
            stateTimer -= deltaTime;
            if (stateTimer <= 0) {
                if (gameState === GameState.HIT_FREEZE) {
                    gameState = GameState.EXPLODING;
                    stateTimer = EXPLOSION_DURATION;
                    createExplosion(75, shipY); // Ship is at x=75 roughly
                    shipY = -1000; // Hide ship
                } else {
                    gameState = GameState.PLAYING;
                }
            }
            break;
        case GameState.EXPLODING:
            stateTimer -= deltaTime;
            updateEnvironment(deltaTime); // Keep environment moving!
            updateBullets(deltaTime); // Keep bullets moving!
            updateParticles(deltaTime);
            if (stateTimer <= 0 && particles.length === 0) {
                // Respawn
                gameState = GameState.PLAYING;
                shipY = GAME_HEIGHT / 2;
                asteroids = []; // Clear board
                asteroidTimer = 0;
            }
            break;
    }
}

function updateShip(deltaTime: number) {
    if (keys.ArrowUp) {
        shipY -= SHIP_SPEED * deltaTime;
    }
    if (keys.ArrowDown) {
        shipY += SHIP_SPEED * deltaTime;
    }

    // Clamp ship position
    shipY = Math.max(SHIP_SIZE, Math.min(GAME_HEIGHT - SHIP_SIZE, shipY));

    // Shooting
    if (keys.Space) {
        const now = performance.now();
        if (now - lastShotTime > 250) { // 0.25s cooldown
            bullets.push({
                x: 100, // Ship nose
                y: shipY,
                speed: 800,
                size: 5
            });
            lastShotTime = now;
        }
    }
}

function updateBullets(deltaTime: number) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.speed * deltaTime;
        if (b.x > GAME_WIDTH) {
            bullets.splice(i, 1);
        }
    }
}

function updateEnvironment(deltaTime: number) {
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
        const size = Math.random() * 15 + 15;
        const vertexCount = Math.floor(Math.random() * 5) + 5;
        const vertices = [];

        for (let i = 0; i < vertexCount; i++) {
            const angle = (i / vertexCount) * Math.PI * 2;
            const radius = size * (0.5 + Math.random() * 0.5);
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

function checkCollisions() {
    asteroids.forEach((asteroid, aIndex) => {
        // Collision Detection (Ship)
        const dx = asteroid.x - 75;
        const dy = asteroid.y - shipY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < asteroid.size + 15) {
            // Hit!
            gameState = GameState.HIT_FREEZE;
            stateTimer = HIT_FREEZE_DURATION;
            shakeIntensity = 20; // Shake screen
        }

        // Collision Detection (Bullets)
        for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
            const b = bullets[bIndex];
            const bdx = asteroid.x - b.x;
            const bdy = asteroid.y - b.y;
            const bDist = Math.sqrt(bdx * bdx + bdy * bdy);

            if (bDist < asteroid.size + b.size) {
                // Bullet Hit!
                createExplosion(asteroid.x, asteroid.y, '#888'); // Grey explosion
                asteroids.splice(aIndex, 1);
                bullets.splice(bIndex, 1);

                gameState = GameState.ASTEROID_HIT_FREEZE;
                stateTimer = 0.05; // Short freeze
                shakeIntensity = 10; // Small shake
                break; // Asteroid gone, stop checking bullets for this asteroid
            }
        }
    });
}

function updateParticles(deltaTime: number) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.life -= deltaTime;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function draw() {
    // Clear screen
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.save();

    // Apply Camera Shake
    if (shakeIntensity > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
    }

    // Draw Stars
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Draw Asteroids
    ctx.fillStyle = '#888';
    asteroids.forEach(asteroid => {
        ctx.beginPath();
        if (asteroid.vertices.length > 0) {
            ctx.moveTo(asteroid.x + asteroid.vertices[0].x, asteroid.y + asteroid.vertices[0].y);
            for (let i = 1; i < asteroid.vertices.length; i++) {
                ctx.lineTo(asteroid.x + asteroid.vertices[i].x, asteroid.y + asteroid.vertices[i].y);
            }
        }
        ctx.closePath();
        ctx.fill();
    });

    // Draw Bullets
    ctx.fillStyle = '#ff0';
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    // Draw Ship (only if not exploding/hidden)
    if (gameState !== GameState.EXPLODING) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(100, shipY); // Nose
        ctx.lineTo(50, shipY - SHIP_SIZE / 2); // Top back
        ctx.lineTo(50, shipY + SHIP_SIZE / 2); // Bottom back
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

// Start the loop
requestAnimationFrame(gameLoop);
