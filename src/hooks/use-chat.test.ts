import { describe, it, expect } from 'vitest';
import { sendMessage } from './use-chat';

// Minimal unit test: ensure sendMessage rejects when no client provided
describe('use-chat helpers', () => {
  it('sendMessage throws without client', async () => {
    let threw = false;
    try {
      // @ts-ignore
      await sendMessage(null, 'bid', 'hi');
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
