export function retryDelay(header, now = Date.now()) {
  if (!header) return 0;
  const seconds = Number(header);
  const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - now;
  return Number.isFinite(delay) ? Math.max(0, delay) : 0;
}

export function createPollGate(interval, now = Date.now) {
  let next = 0;
  let failures = 0;
  return {
    get next() { return next; },
    ready() { return now() >= next; },
    start() { next = now() + interval; },
    success() { failures = 0; next = now() + interval; },
    failure(wait = 0) {
      failures++;
      next = now() + Math.max(interval, Math.min(15 * 60000, interval * 2 ** Math.min(failures, 10)), wait);
    },
  };
}
