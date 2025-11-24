import { vi } from 'vitest';

// Mock performance.now() for consistent timing in tests
let mockTime = 1000; // Start at 1000ms to allow for fire rate checks
(globalThis as any).performance = {
  ...(globalThis as any).performance,
  now: vi.fn(() => mockTime),
} as any;

export function setMockTime(time: number) {
  mockTime = time;
}

export function advanceMockTime(delta: number) {
  mockTime += delta;
}

