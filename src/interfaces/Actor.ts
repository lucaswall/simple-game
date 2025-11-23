export interface Actor {
    update(deltaTime: number): void;
    draw(ctx: CanvasRenderingContext2D): void;
}
