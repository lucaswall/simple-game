export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Ship constants
export const SHIP_SPEED = 400; // Pixels per second
export const SHIP_SIZE = 30;
export const SHIP_X_POSITION = 100; // Nose x position
export const SHIP_BACK_X_POSITION = 50; // Back x position
export const SHIP_FIRE_RATE_MS = 250; // Milliseconds between shots
export const SHIP_COLLISION_X = 75; // X position for collision detection
export const SHIP_COLLISION_RADIUS = 15; // Collision radius

// Bullet constants
export const BULLET_SPEED = 800; // Pixels per second
export const BULLET_SIZE = 5; // Radius

// Asteroid constants
export const ASTEROID_MIN_SPEED = 200;
export const ASTEROID_MAX_SPEED = 400;
export const ASTEROID_SPAWN_INTERVAL = 1.5; // Seconds
export const ASTEROID_SPAWN_Y_MARGIN = 40; // Margin from top/bottom
export const ASTEROID_SPAWN_Y_OFFSET = 20; // Minimum y offset from top
export const ASTEROID_MIN_SIZE = 15;
export const ASTEROID_MAX_SIZE = 30;
export const ASTEROID_MIN_VERTICES = 5;
export const ASTEROID_MAX_VERTICES = 10;
export const ASTEROID_RADIUS_MIN_FACTOR = 0.5; // Minimum radius factor
export const ASTEROID_RADIUS_MAX_FACTOR = 1.0; // Maximum radius factor
export const ASTEROID_COLOR = '#888';

// Starfield constants
export const STAR_COUNT = 150;
export const STAR_MIN_SPEED = 50;
export const STAR_MAX_SPEED = 200;

// Particle constants
export const PARTICLE_COUNT_PER_EXPLOSION = 30;
export const PARTICLE_MIN_SPEED = 50;
export const PARTICLE_MAX_SPEED = 250; // 200 + 50
export const PARTICLE_MIN_LIFE = 0.5; // Seconds
export const PARTICLE_MAX_LIFE = 1.0; // Seconds
export const PARTICLE_MIN_SIZE = 2;
export const PARTICLE_MAX_SIZE = 6; // 4 + 2
export const PARTICLE_HUE_MIN = 10; // HSL hue minimum
export const PARTICLE_HUE_MAX = 70; // HSL hue maximum (60 + 10)

// Shake constants
export const SHAKE_DECAY = 500; // Pixels per second decay
export const SHAKE_INTENSITY_SHIP_HIT = 20;
export const SHAKE_INTENSITY_ASTEROID_HIT = 10;

// State duration constants
export const HIT_FREEZE_DURATION = 0.1; // Seconds
export const EXPLOSION_DURATION = 1.0; // Seconds
export const ASTEROID_HIT_FREEZE_DURATION = 0.05; // Seconds
export const EXPLOSION_TIME_SCALE = 1 / 3; // Time scale during explosion (1/3 = slower)

// UI constants
export const PAUSE_OVERLAY_ALPHA = 0.5;
export const PAUSE_FONT_SIZE = 48;
