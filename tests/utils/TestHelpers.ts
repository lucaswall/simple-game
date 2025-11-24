import { Ship } from '../../src/actors/Ship';
import { Asteroid } from '../../src/actors/Asteroid';
import { Bullet } from '../../src/actors/Bullet';
import { MockInput } from './MockInput';
import { SHIP_X_POSITION } from '../../src/core/Constants';
import { PLAY_AREA_HEIGHT } from '../../src/states/PlayingState';

export function createShipAt(x: number, y: number, input?: MockInput): Ship {
    const mockInput = input || new MockInput();
    const bullets: Bullet[] = [];
    const ship = new Ship(mockInput, bullets);
    ship.x = x;
    ship.y = y;
    return ship;
}

export function createAsteroidAt(x: number, y: number, size: number = 20): Asteroid {
    const asteroid = new Asteroid();
    asteroid.x = x;
    asteroid.y = y;
    asteroid.size = size;
    return asteroid;
}

export function createBulletAt(x: number, y: number): Bullet {
    return new Bullet(x, y, 800, 5);
}

export function createCollidingShipAsteroid(): { ship: Ship; asteroid: Asteroid } {
    const ship = createShipAt(SHIP_X_POSITION, PLAY_AREA_HEIGHT / 2);
    // Position asteroid at ship's collision point (SHIP_COLLISION_X = 75, so collision point is SHIP_X_POSITION - (SHIP_X_POSITION - 75) = 75)
    // For collision, place asteroid at x=75, y=same as ship
    const asteroid = createAsteroidAt(75, PLAY_AREA_HEIGHT / 2, 20);
    return { ship, asteroid };
}

export function createCollidingBulletAsteroid(): { bullet: Bullet; asteroid: Asteroid } {
    const bullet = createBulletAt(200, 300);
    const asteroid = createAsteroidAt(200, 300, 20);
    return { bullet, asteroid };
}

