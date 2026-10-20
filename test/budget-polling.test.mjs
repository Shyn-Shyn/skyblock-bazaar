import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBudget, settings } from '../public/market.mjs';
import { createPollGate, retryDelay } from '../polling.mjs';
test('budget abbreviations and German formatted numbers', () => {
  for (const [input, value] of [['1M', 1e6], ['10M', 1e7], ['1,5m', 1.5e6], ['1.5M', 1.5e6],
    ['500k', 500000], [' 10 m ', 1e7], ['10.000.000', 1e7], ['1.000.000,50', 1000000.5], ['10000000', 1e7]]) {
    assert.equal(parseBudget(input), value, input);
  }
  assert.equal(settings({ budget: '10M' }).budget, 1e7);
  for (const input of ['', 'xyz', '1MM', '-1M', '1e6', '1,2,3', 'Infinity']) assert.ok(Number.isNaN(parseBudget(input)));
});
test('poll gate enforces one minute and extends waits on errors and Retry-After', () => {
  let now = 100000;
  const gate = createPollGate(60000, () => now);
  assert.equal(gate.ready(), true);
  gate.start(); assert.equal(gate.ready(), false);
  now += 59999; assert.equal(gate.ready(), false);
  now++; assert.equal(gate.ready(), true);
  gate.failure(); assert.equal(gate.next, now + 120000);
  gate.failure(3600000); assert.equal(gate.next, now + 3600000);
  gate.success(); assert.equal(gate.next, now + 60000);
  gate.failure(); assert.equal(gate.next, now + 120000);
});
test('Retry-After accepts seconds, dates and malformed header safely', () => {
  assert.equal(retryDelay('120'), 120000);
  assert.equal(retryDelay('Thu, 01 Jan 1970 00:02:00 GMT', 60000), 60000);
  assert.equal(retryDelay('invalid'), 0);
  assert.equal(retryDelay(null), 0);
  assert.equal(retryDelay('-2'), 0);
});
