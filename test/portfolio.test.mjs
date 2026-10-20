import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allocate } from '../public/market.mjs';

const row = (id, values = {}) => ({
  id, eligible: true, buy: 10, sell: 12, profit: 2, roi: 20, quantity: 100,
  pressure: 0, hours: 1, queueHours: 0, ...values,
});
test('allocates entire shared budget without reserve and respects explicit per-item caps', () => {
  const plan = allocate(['a', 'b', 'c', 'd', 'e'].map(id => row(id)), { budget: 1000, maxAllocation: 25 });
  assert.equal(plan.invested, 1000);
  assert.equal(plan.remaining, 0);
  assert.deepEqual(plan.positions.map(p => p.quantity), [25, 25, 25, 25]);
  assert.equal(plan.profit, 200);
  assert.equal(plan.positions[0].hours, .25);
});
test('throughput, item count and expensive indivisible items leave money free', () => {
  const plan = allocate([row('a', { buy: 300 }), row('b', { quantity: 2 }), row('c', { eligible: false })],
    { budget: 1000, maxPositions: 1, maxAllocation: 25 });
  assert.equal(plan.positions[0].id, 'b');
  assert.equal(plan.positions[0].quantity, 2);
  assert.equal(plan.remaining, 980);
});
test('ranking prefers ROI adjusted for order pressure', () => {
  const plan = allocate([row('thin', { profit: 3, pressure: 100 }), row('liquid')], { budget: 100, maxPositions: 1 });
  assert.equal(plan.positions[0].id, 'liquid');
});
test('small high-margin trades do not crowd out full budget allocation', () => {
  const plan = allocate([row('tiny', { quantity: 1, profit: 9 }), row('large', { quantity: 100 })],
    { budget: 1000, maxPositions: 1 });
  assert.equal(plan.positions[0].id, 'large');
  assert.equal(plan.invested, 1000);
  assert.equal(plan.remaining, 0);
});
test('profit beats capital utilization and a mix can beat a full-budget position', () => {
  const rows = [row('bulk', { profit: 1 }), row('first', { quantity: 40, profit: 5 }),
    row('second', { quantity: 60, profit: 3 })];
  const plan = allocate(rows, { budget: 1000, maxPositions: 2 });
  assert.equal(plan.profit, 380);
  assert.equal(plan.invested, 1000);
  assert.deepEqual(new Set(plan.positions.map(r => r.id)), new Set(['first', 'second']));
});
test('one high-profit position can receive all the budget', () => {
  const plan = allocate([row('best', { profit: 5 }), row('other')], { budget: 1000 });
  assert.equal(plan.positions.length, 1);
  assert.equal(plan.positions[0].id, 'best');
  assert.equal(plan.profit, 500);
});
test('default limits plan to six liquid positions', () => {
  const plan = allocate(Array.from({ length: 12 }, (_, i) => row(String(i), { quantity: 1 })), { budget: 1000 });
  assert.equal(plan.positions.length, 6);
  assert.equal(plan.invested, 60);
});
test('excludes ineligible and duplicate products and ignores legacy reserve settings', () => {
  const rows = [row('a'), row('a'), row('b', { eligible: false })];
  assert.equal(allocate(rows, { budget: 1000 }).positions.length, 1);
  assert.equal(allocate(rows, { budget: 1000, reserve: 100 }).invested, 1000);
  assert.equal(allocate([], { budget: 1000 }).remaining, 1000);
});
test('decimal purchase prices never exceed shared budget or caps', () => {
  for (let budget = 1; budget < 200; budget++) {
    const rows = Array.from({ length: 20 }, (_, i) => row(String(i), { buy: .1 + i * .17, quantity: 10000 }));
    const plan = allocate(rows, { budget, reserve: 13, maxAllocation: 21, maxPositions: 7 });
    assert.ok(plan.invested <= budget + 1e-10);
    assert.ok(plan.remaining >= 0);
    assert.ok(plan.positions.length <= 7);
    for (const p of plan.positions) {
      assert.ok(Number.isInteger(p.quantity) && p.quantity > 0);
      assert.ok(p.capital <= budget * .21 + 1e-10);
      assert.ok(p.quantity <= p.capacity);
    }
  }
});
