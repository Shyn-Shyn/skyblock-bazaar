import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allocate } from '../public/market.mjs';
const row = (id, values = {}) => ({ id, eligible: true, buy: 10, profit: 2, roi: 20,
  quantity: 100, pressure: 0, hours: 1, queueHours: 0, ...values });

test('Bazaar objective makes budget versus net profit tradeoff explicit', () => {
  const rows = [row('A', { buy: 100, quantity: 5, profit: 50 }), row('B')];
  const budget = allocate(rows, { budget: 1000, maxPositions: 1, allocationGoal: 'budget' });
  const profit = allocate(rows, { budget: 1000, maxPositions: 1, allocationGoal: 'profit' });
  assert.equal(budget.positions[0].id, 'B');
  assert.equal(budget.invested, 1000);
  assert.equal(budget.profit, 200);
  assert.equal(profit.positions[0].id, 'A');
  assert.equal(profit.invested, 500);
  assert.equal(profit.profit, 250);
  assert.equal(profit.objectiveLeavesCapital, true);
  assert.equal(budget.objectiveLeavesCapital, false);
});
test('budget objective fills free slots under explicit item and position caps', () => {
  const plan = allocate(['a', 'b', 'c', 'd', 'e'].map(id => row(id)), {
    budget: 1000, allocationGoal: 'budget', maxAllocation: 25, maxPositions: 4 });
  assert.equal(plan.invested, 1000);
  assert.equal(plan.profit, 200);
  assert.deepEqual(plan.positions.map(p => p.quantity), [25, 25, 25, 25]);
});
test('NPC total quantity cap is shared across positions and objectives', () => {
  for (const npcPreference of ['compact', 'profit']) {
    const p = allocate([row('A'), row('B')], { budget: 1000, destination: 'npc',
      maxNpcItems: 30, maxAllocation: 20, npcPreference });
    assert.equal(p.quantity, 30);
    assert.equal(p.positions.length, 2);
    assert.equal(p.invested, 300);
    assert.equal(p.profit, 60);
    assert.equal(p.remaining, 700);
  }
  const one = allocate([row('A'), row('B')], { destination: 'npc', maxNpcItems: 1 });
  assert.equal(one.quantity, 1);
  assert.equal(allocate([row('A')], { budget: 1000, maxNpcItems: 1 }).quantity, 100);
});
test('NPC compact preference chooses actual smaller quantity without relabeling utility as profit', () => {
  const rows = [row('compact', { buy: 100, quantity: 10, profit: 20 }),
    row('mass', { buy: 1, quantity: 1000, profit: .3 })];
  const s = { budget: 1000, maxPositions: 1, destination: 'npc', maxNpcItems: 2048 };
  const compact = allocate(rows, s);
  const profit = allocate(rows, { ...s, npcPreference: 'profit' });
  assert.equal(compact.positions[0].id, 'compact');
  assert.equal(compact.quantity, 10);
  assert.equal(compact.profit, 200);
  assert.equal(profit.positions[0].id, 'mass');
  assert.equal(profit.quantity, 1000);
  assert.equal(profit.profit, 300);
});
test('NPC compact keeps a useful prefix when bulk additions reduce utility', () => {
  const p = allocate([row('compact', { buy: 100, quantity: 5, profit: 20 }),
    row('mass', { buy: 1, quantity: 1000, profit: .01 })], {
    budget: 1000, destination: 'npc', maxNpcItems: 2048 });
  assert.equal(p.positions.length, 1);
  assert.equal(p.quantity, 5);
  assert.equal(p.profit, 100);
  assert.equal(p.remaining, 500);
  assert.equal(p.objectiveLeavesCapital, true);
});
test('new objectives preserve integer, budget, liquidity and identity constraints', () => {
  const rows = [row('a', { buy: .333, quantity: 10 }), row('a'),
    row('invalid', { quantity: Infinity }), row('illiquid', { quantity: 0 }),
    row('expensive', { buy: 1000 }), row('loss', { profit: -1 })];
  for (const destination of ['bazaar', 'npc']) for (const allocationGoal of ['budget', 'profit']) {
    const p = allocate(rows, { budget: 3, destination, allocationGoal, maxNpcItems: 5 });
    assert.equal(p.positions.length, 1);
    assert.ok(p.invested <= 3);
    assert.ok(p.positions.every(r => Number.isInteger(r.quantity) && r.quantity > 0 && r.quantity <= r.capacity));
    if (destination === 'npc') assert.ok(p.quantity <= 5);
  }
  assert.equal(allocate([], { destination: 'npc' }).quantity, 0);
});
