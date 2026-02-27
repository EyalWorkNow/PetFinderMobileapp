export class SlidingWindowRateLimiter {
  private readonly events = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  allow(key: string, nowMs = Date.now()): boolean {
    const list = this.events.get(key) ?? [];
    const threshold = nowMs - this.windowMs;
    const updated = list.filter((timestamp) => timestamp > threshold);

    if (updated.length >= this.limit) {
      this.events.set(key, updated);
      return false;
    }

    updated.push(nowMs);
    this.events.set(key, updated);
    return true;
  }
}
