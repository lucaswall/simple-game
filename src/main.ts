
import './style.css'
import { GAME_WIDTH, GAME_HEIGHT, ASTEROID_SPAWN_INTERVAL, HIT_FREEZE_DURATION, EXPLOSION_DURATION, SHAKE_DECAY } from './Constants';
import { Input } from './Input';
import { Starfield } from './Starfield';
import { Ship } from './Ship';
import { Asteroid } from './Asteroid';
import { Bullet } from './Bullet';
import { ParticleManager } from './ParticleManager';

const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')!;
const ctx = canvas.getContext('2d')!;

// Set logical resolution
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

enum GameState {
    PLAYING,
    HIT_FREEZE,
    EXPLODING,
    ASTEROID_HIT_FREEZE
}

// Game State
let lastTime = 0;
let gameState: GameState = GameState.PLAYING;
let stateTimer = 0;
let shakeIntensity = 0;
let isPaused = false;
let asteroidTimer = 0;

// Actors
const input = new Input();
const starfield = new Starfield();
const bullets: Bullet[] = [];
const ship = new Ship(input, bullets);
const particleManager = new ParticleManager();
let asteroids: Asteroid[] = [];

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
        drawPaused();
        requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
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
            starfield.update(deltaTime);
            ship.update(deltaTime);
            updateBullets(deltaTime);
            updateAsteroids(deltaTime);
            particleManager.update(deltaTime);
            checkCollisions();
            break;

        case GameState.HIT_FREEZE:
        case GameState.ASTEROID_HIT_FREEZE:
            stateTimer -= deltaTime;
            if (stateTimer <= 0) {
                if (gameState === GameState.HIT_FREEZE) {
                    gameState = GameState.EXPLODING;
                    stateTimer = EXPLOSION_DURATION;
                    particleManager.createExplosion(75, ship.y);
                    ship.visible = false;
                } else {
                    gameState = GameState.PLAYING;
                }
            }
            break;

        case GameState.EXPLODING:
            stateTimer -= deltaTime;
            starfield.update(deltaTime);
            updateBullets(deltaTime);
            updateAsteroids(deltaTime);
            particleManager.update(deltaTime);

            if (stateTimer <= 0 && particleManager.particles.length === 0) {
                // Respawn
                gameState = GameState.PLAYING;
                ship.y = GAME_HEIGHT / 2;
                ship.visible = true;
                asteroids = [];
                asteroidTimer = 0;
            }
            break;
    }
}

function updateBullets(deltaTime: number) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.update(deltaTime);
        if (!b.active) {
            bullets.splice(i, 1);
        }
    }
}

function updateAsteroids(deltaTime: number) {
    asteroidTimer -= deltaTime;
    if (asteroidTimer <= 0) {
        asteroids.push(new Asteroid());
        asteroidTimer = ASTEROID_SPAWN_INTERVAL;
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
        const a = asteroids[i];
        a.update(deltaTime);
        if (!a.active) {
            asteroids.splice(i, 1);
        }
    }
}

function checkCollisions() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];

        // Ship Collision
        if (ship.visible) {
            const dx = asteroid.x - 75; // Approximate ship center X
            const dy = asteroid.y - ship.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < asteroid.size + 15) {
                gameState = GameState.HIT_FREEZE;
                stateTimer = HIT_FREEZE_DURATION;
                shakeIntensity = 20;
                return; // Stop checking other collisions this frame
            }
        }

        // Bullet Collision
        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];
            const dx = asteroid.x - bullet.x;
            const dy = asteroid.y - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < asteroid.size + bullet.size) {
                // Hit!
                particleManager.createExplosion(asteroid.x, asteroid.y, '#888');
                asteroids.splice(i, 1);
                bullets.splice(j, 1);

                gameState = GameState.ASTEROID_HIT_FREEZE;
                stateTimer = 0.05;
                shakeIntensity = 10;
                break; // Asteroid destroyed, move to next asteroid
            }
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

    starfield.draw(ctx);

    asteroids.forEach(a => a.draw(ctx));
    bullets.forEach(b => b.draw(ctx));
    particleManager.draw(ctx);
    ship.draw(ctx);

    ctx.restore();
}

function drawPaused() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);
}

// Start the loop
requestAnimationFrame(gameLoop);

