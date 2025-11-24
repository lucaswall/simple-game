import { Game } from '../../src/core/Game';
import { GameState } from '../../src/interfaces/GameState';

export class MockGame implements Partial<Game> {
    currentState: GameState | undefined = undefined;
    shakeIntensity: number = 0;
    timeScale: number = 1;
    private stateTransitions: GameState[] = [];
    private timeScaleHistory: number[] = [];
    private freezeCallbacks: Array<{ duration: number; callback?: () => void }> = [];

    changeState(newState: GameState): void {
        if (this.currentState) {
            this.currentState.exit(this as any);
        }
        this.currentState = newState;
        this.currentState.enter(this as any);
        this.stateTransitions.push(newState);
    }

    setTimeScale(scale: number): void {
        this.timeScale = scale;
        this.timeScaleHistory.push(scale);
    }

    startFreeze(duration: number, callback?: () => void): void {
        this.setTimeScale(0);
        this.freezeCallbacks.push({ duration, callback });
        // Immediately execute callback for testing
        if (callback) {
            callback();
        }
    }

    // Test helpers
    getStateTransitions(): GameState[] {
        return [...this.stateTransitions];
    }

    getTimeScaleHistory(): number[] {
        return [...this.timeScaleHistory];
    }

    getFreezeCallbacks(): Array<{ duration: number; callback?: () => void }> {
        return [...this.freezeCallbacks];
    }

    reset(): void {
        this.currentState = undefined;
        this.shakeIntensity = 0;
        this.timeScale = 1;
        this.stateTransitions = [];
        this.timeScaleHistory = [];
        this.freezeCallbacks = [];
    }
}

