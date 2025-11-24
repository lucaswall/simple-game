import { Collidable, CollisionBounds } from '../interfaces/Collidable';

export class CollisionManager {
    /**
     * Check if two collision bounds intersect
     */
    static checkBounds(a: CollisionBounds, b: CollisionBounds): boolean {
        // Circle-circle collision
        if (a.type === 'circle' && b.type === 'circle') {
            const dx = (a.centerX ?? 0) - (b.centerX ?? 0);
            const dy = (a.centerY ?? 0) - (b.centerY ?? 0);
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < ((a.radius ?? 0) + (b.radius ?? 0));
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

