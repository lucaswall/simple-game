import { Collidable, CollisionBounds } from '../interfaces/Collidable';

export class CollisionManager {
    /**
     * Check if two collision bounds intersect
     */
    static checkBounds(a: CollisionBounds, b: CollisionBounds): boolean {
        // Circle-circle collision
        if (a.type === 'circle' && b.type === 'circle') {
            // Validate required properties - return false if missing instead of silent default
            if (a.centerX === undefined || a.centerY === undefined || a.radius === undefined ||
                b.centerX === undefined || b.centerY === undefined || b.radius === undefined) {
                return false;
            }

            const dx = a.centerX - b.centerX;
            const dy = a.centerY - b.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < (a.radius + b.radius);
        }

        // Add other collision types as needed
        return false;
    }

    /**
     * Check collisions between all collidables
     */
    static checkCollisions(
        collidables: Collidable[],
        context: import('../interfaces/Collidable').CollisionContext
    ): void {
        for (let i = 0; i < collidables.length; i++) {
            const source = collidables[i];
            if (!source.collisionEnabled) continue;
            
            for (let j = i + 1; j < collidables.length; j++) {
                const target = collidables[j];
                
                if (source.canCollideWith(target) && 
                    target.canCollideWith(source)) {
                    
                    const boundsA = source.getCollisionBounds();
                    const boundsB = target.getCollisionBounds();
                    
                    if (this.checkBounds(boundsA, boundsB)) {
                        // Notify both actors of the collision
                        source.onCollision(target, context);
                        target.onCollision(source, context);
                    }
                }
            }
        }
    }
}

