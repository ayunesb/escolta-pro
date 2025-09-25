import { describe, it, expect } from 'vitest';
// Import withRetry indirectly via stripe-events (no direct export currently). We'll create a small wrapper.
import { withRetry } from '../server/stripe-events';

describe('withRetry', () => {
  it('aborts when maxElapsedMs exceeded', async () => {
    const start = Date.now();
    const failingOp = () => Promise.reject(new Error('fail'));
    let caught: Error | null = null;
    try {
      await withRetry('test.abort', failingOp, 5, 50, undefined, { maxElapsedMs: 120, jitter: false });
    } catch (err) {
      caught = err as Error;
    }
    const elapsed = Date.now() - start;
    expect(caught).toBeTruthy();
    // Should not exceed ~250ms (conservative upper bound: base 50 + 100 + 200 would exceed maxElapsedMs so should clamp)
    expect(elapsed).toBeLessThan(500);
  });
});
