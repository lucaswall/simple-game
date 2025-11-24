import { Actor } from './Actor';
import { Game } from '../core/Game';
import { ParticleManager } from '../managers/ParticleManager';

export interface CollisionBounds {
    type: 'circle' | 'polygon' | 'point';
    // For circle
    centerX?: number;
    centerY?: number;
    radius?: number;
    // For polygon
    vertices?: { x: number; y: number }[];
    // For point
    x?: number;
    y?: number;
}

export interface CollisionContext {
    game: Game;
    particleManager: ParticleManager;
    onAsteroidDestroyed?: (asteroid: Actor) => void;
    onShipDestroyed?: () => void;
}

export interface Collidable extends Actor {
    getCollisionBounds(): CollisionBounds;
    onCollision(other: Collidable, context: CollisionContext): void;
    canCollideWith(other: Collidable): boolean;
    collisionEnabled: boolean;
}

