import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allocate, analyze } from '../public/market.mjs';
import { restoreProfiles } from '../public/profiles.mjs';

const row = (id, values = {}) => ({ id, eligible: true, buy: 10, profit: 2, roi: 20,
  quantity: 100, pressure: 0, hours: 1, queueHours: 0, ...values });
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const goals = ['budget', 'profit'];
const product = (id, buyHourly, sellHourly) => ({ product_id: id,
  sell_summary: [{ pricePerUnit: 999.9, amount: 1, orders: 3 }],
  buy_summary: [{ pricePerUnit: 1100 / .9875 + .1, amount: 1, orders: 3 }],
  quick_status: { sellVolume: 1, buyVolume: 1, sellMovingWeek: 168 * buyHourly + 1,
    buyMovingWeek: 168 * sellHourly + 1, sellOrders: 3, buyOrders: 3 } });

test('AC-01/03 position floor scales with total budget without rounding or a fixed coin minimum', () => {
  for (const budget of [1, 1000, 1e6, 10e6, 40e6]) for (const allocationGoal of goals) {
    const threshold = budget * .0005;
    const input = { budget, allocationGoal };
    for (const [factor, expected] of [[.999, 0], [1, 1], [1.001, 1]]) {
      const p = allocate([row('boundary', { buy: budget, quantity: 1, profit: threshold * factor })], input);
      assert.equal(p.minimumPositionProfit, threshold);
      assert.equal(p.positions.length, expected, `${budget}/${allocationGoal}/${factor}`);
      assert.equal(p.remaining, expected ? 0 : budget);
      assert.ok([p.invested, p.profit, p.roi, p.quantity, p.remaining].every(Number.isFinite));
    }
    assert.equal(allocate([], input).remaining, budget);
    if (budget >= 10e6) {
      assert.equal(allocate([row('100coins', { profit: 1 })], input).positions.length, 0);
    }
  }
});

test('AC-02 recomputes the minimum after remaining budget and each quantity cap', () => {
  const p = allocate([
    row('first', { buy: 100000, profit: 3000, quantity: 99, hours: 1 }),
    row('rest', { buy: 1000, profit: 20, quantity: 10000, hours: 1 }),
  ], { budget: 10e6, allocationGoal: 'profit' });
  assert.deepEqual(p.positions.map(r => r.id), ['first']);
  assert.equal(p.invested, 9900000);
  assert.equal(p.profit, 297000);
  assert.equal(p.remaining, 100000); // 100 remaining units * 20 = 2,000 < 5,000.
  for (const cap of [{ maxAllocation: 1 }, { maxQuantity: 100 }]) {
    assert.equal(allocate([row('limited', { buy: 1000, profit: 20, quantity: 10000 })],
      { budget: 10e6, ...cap }).positions.length, 0);
  }
});

test('AC-04 both objectives choose a genuinely faster cycle over more raw capital and profit', () => {
  const fast = row('FAST', { buy: 10000, quantity: 100, profit: 1000, hours: 1 });
  const slow = row('SLOW', { buy: 10000, quantity: 120, profit: 1000, hours: 12 });
  // Independent utility: FAST profit 100,000 * 6/7 = 85,714.2857; SLOW 120,000 / 3 = 40,000.
  // Capital utility: FAST 1,000,000 * 6/7 = 857,142.8571; SLOW 1,200,000 / 3 = 400,000.
  for (const allocationGoal of goals) {
    const p = allocate([slow, fast], { budget: 2e6, maxPositions: 1, allocationGoal });
    assert.deepEqual(p.positions.map(r => r.id), ['FAST']);
    assert.equal(p.invested, 1e6);
    assert.equal(p.profit, 100000);
    assert.equal(p.positions[0].hours, 1);
    assert.equal(p.objectiveLeavesCapital, true);
  }
});

test('AC-05 real analysis penalizes a slow buy OR sell leg, not just their faster side', () => {
  const input = { budget: 1e6, horizon: 24, maxQuantity: 100, maxPositions: 1, share: 1 };
  const fast = analyze(product('Z_FAST', 20000, 20000), input);
  const slowBuy = analyze(product('A_SLOW_BUY', 2000, 20000), input);
  const slowSell = analyze(product('A_SLOW_SELL', 20000, 2000), input);
  assert.equal(fast.hours, 1); // 100/200 + 100/200.
  for (const slow of [slowBuy, slowSell]) {
    close(slow.hours, 5.5); // 100/20 + 100/200, either order.
    for (const allocationGoal of goals) {
      assert.equal(allocate([slow, fast], { ...input, allocationGoal }).positions[0].id, 'Z_FAST');
    }
  }
  for (const rates of [[0, 20000], [20000, 0]]) {
    const noFlow = analyze(product('NO_FLOW', ...rates), input);
    assert.equal(noFlow.eligible, false);
    assert.equal(allocate([noFlow], input).positions.length, 0);
  }
  const missing = product('MISSING', 20000, 20000);
  missing.buy_summary = [];
  assert.equal(analyze(missing, input), null);
});

test('AC-05/06 excludes invalid times, accepts zero, and only scales filling time', () => {
  for (const times of [{ hours: null }, { hours: undefined }, { hours: NaN }, { hours: Infinity },
    { hours: -1 }, { queueHours: null }, { queueHours: undefined }, { queueHours: -1 },
    { queueHours: Infinity }, { queueHours: NaN }, { hours: 1, queueHours: 2 }]) {
    assert.equal(allocate([row('invalid', times)], { budget: 1000 }).positions.length, 0);
  }
  assert.equal(allocate([row('zero', { hours: 0 })], { budget: 1000 }).positions[0].hours, 0);
  const rows = [row('partial', { buy: 100, profit: 20, quantity: 100, hours: 10, queueHours: 2 })];
  const input = { budget: 2500, horizon: 24 };
  const p = allocate(rows, input);
  assert.equal(p.positions[0].quantity, 25);
  assert.equal(p.positions[0].hours, 4); // 2 + (10 - 2) * 25/100; weight 6/10 = .6.
  assert.equal(p.profit, 500);
  assert.deepEqual(allocate(rows, { ...input, horizon: 168 }), p);
});

test('AC-06 variants compare sums of individually weighted positions', () => {
  // MIX: 1,000 gain at 1h plus 1,000 at 12h -> 857.142857 + 333.333333 = 1,190.47619.
  // SINGLE: 2,100 at 6h -> 1,050. Dividing MIX by its max time would incorrectly choose SINGLE.
  const rows = [row('FAST', { buy: 10, quantity: 100, profit: 10, hours: 1 }),
    row('SLOW', { buy: 10, quantity: 100, profit: 10, hours: 12 }),
    row('SINGLE', { buy: 2000, quantity: 1, profit: 2100, hours: 6 })];
  for (const allocationGoal of goals) {
    const p = allocate(rows, { budget: 2000, maxPositions: 2, allocationGoal });
    assert.deepEqual(new Set(p.positions.map(r => r.id)), new Set(['FAST', 'SLOW']));
    assert.equal(p.profit, 2000);
    assert.equal(p.invested, 2000);
  }
});

test('AC-07 preserves sequential net tax model, rounded costs and constraints', () => {
  const market = product('TAX', 20000, 20000);
  market.sell_summary[0].pricePerUnit = 100;
  market.buy_summary[0].pricePerUnit = 120;
  close(analyze(market).profit, 18.30125);
  for (const allocationGoal of goals) {
    const p = allocate([row('a', { buy: .333, quantity: 1000 }),
      row('b', { buy: .777, quantity: 1000 }), row('pressure', { pressure: 7 }),
      row('loss', { profit: -1 }), row('a')],
    { budget: 10, maxAllocation: 60, maxPositions: 2, maxQuantity: 10, allocationGoal });
    assert.ok(p.invested <= 10 && p.positions.length <= 2);
    assert.equal(new Set(p.positions.map(r => r.id)).size, p.positions.length);
    for (const r of p.positions) {
      assert.ok(Number.isInteger(r.quantity) && r.quantity <= 10 && r.quantity <= r.capacity);
      assert.ok(r.capital <= 6 && r.total > 0 && r.pressure <= 6);
    }
    assert.ok(p.positions.reduce((sum, r) => sum + Math.ceil(r.buy * 100) * r.quantity, 0) <= 1000);
  }
});

test('AC-08 old stored goals adopt Bazaar quality while overview and NPC remain unchanged', () => {
  for (const allocationGoal of goals) {
    const p = restoreProfiles({ version: 2, scanner: { destination: 'bazaar' }, plan: {
      allocationGoal, budget: 10e6, tax: 2, horizon: 48, share: 2, maxPositions: 3,
    } });
    assert.equal(p.plan.allocationGoal, allocationGoal);
    assert.equal(p.plan.tax, 2);
    assert.equal(p.plan.horizon, 48);
    assert.equal(p.plan.share, 2);
    assert.equal(p.plan.maxPositions, 3);
    assert.equal(allocate([row('tiny', { profit: 1 })], p.plan).positions.length, 0);
    assert.equal(analyze(product('OVERVIEW', 20000, 20000), p.scanner).eligible, true);
    const npc = allocate([row('tiny', { profit: 1, hours: null })], { ...p.plan, destination: 'npc' });
    assert.equal(npc.profit, 100); // No floor or new time validation/weighting in NPC mode.
    assert.equal(npc.minimumPositionProfit, 0);
  }
});
