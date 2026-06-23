import { checkRateLimit } from '@/lib/rateLimit';

// Each test uses a unique key to avoid shared state between tests.
// Keys include the test name to make failures easy to trace.

describe('checkRateLimit', () => {
  it('allows up to maxReqs requests within the window', () => {
    const key = 'rl-allow-5';
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5, 60_000)).toBe(true);
    }
  });

  it('blocks the request that exceeds maxReqs', () => {
    const key = 'rl-block-6th';
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 60_000);
    expect(checkRateLimit(key, 5, 60_000)).toBe(false);
  });

  it('continues to block subsequent requests over the limit', () => {
    const key = 'rl-block-repeated';
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 60_000);
    expect(checkRateLimit(key, 5, 60_000)).toBe(false);
    expect(checkRateLimit(key, 5, 60_000)).toBe(false);
  });

  it('different keys have independent limits', () => {
    const keyA = 'rl-key-a';
    const keyB = 'rl-key-b';
    // Exhaust keyA
    for (let i = 0; i < 5; i++) checkRateLimit(keyA, 5, 60_000);
    expect(checkRateLimit(keyA, 5, 60_000)).toBe(false);
    // keyB is unaffected
    expect(checkRateLimit(keyB, 5, 60_000)).toBe(true);
  });

  it('allows a single request with maxReqs = 1', () => {
    const key = 'rl-max-1-allow';
    expect(checkRateLimit(key, 1, 60_000)).toBe(true);
  });

  it('blocks the second request when maxReqs = 1', () => {
    const key = 'rl-max-1-block';
    checkRateLimit(key, 1, 60_000);
    expect(checkRateLimit(key, 1, 60_000)).toBe(false);
  });

  it('resets the counter after the time window expires', async () => {
    const key = 'rl-window-expire';
    const shortWindow = 50; // 50ms window
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, shortWindow);
    expect(checkRateLimit(key, 3, shortWindow)).toBe(false); // blocked
    await new Promise((r) => setTimeout(r, 70)); // wait for window to expire
    expect(checkRateLimit(key, 3, shortWindow)).toBe(true); // allowed again
  });

  it('starts a fresh window on the first request after expiry', async () => {
    const key = 'rl-fresh-window';
    const shortWindow = 50;
    checkRateLimit(key, 2, shortWindow);
    await new Promise((r) => setTimeout(r, 70));
    // First request in new window
    expect(checkRateLimit(key, 2, shortWindow)).toBe(true);
    expect(checkRateLimit(key, 2, shortWindow)).toBe(true);
    // 3rd request blocked in new window
    expect(checkRateLimit(key, 2, shortWindow)).toBe(false);
  });
});
