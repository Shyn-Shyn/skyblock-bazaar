import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, allocate, settings } from '../public/market.mjs';
const product = {
  product_id: 'WHEAT',
  sell_summary: [{ pricePerUnit: 4, amount: 50, orders: 2 }],
  buy_summary: [],
  quick_status: { sellVolume: 50, sellMovingWeek: 168050, sellOrders: 2 },
};
test('NPC uses fixed price, no tax or sell tick and requires only buying liquidity', () => {
  const r = analyze(product, { destination: 'npc', tax: 20 }, 'Wheat', 6);
  assert.equal(r.buy, 4.1);
  assert.equal(r.sell, 6);
  assert.ok(Math.abs(r.profit - 1.9) < 1e-10);
  assert.equal(r.quantity, 10);
  assert.equal(r.askQueue, 0);
  assert.equal(r.pressure, .05);
  assert.equal(r.hours, 1);
  assert.equal(r.eligible, true);
  assert.equal(r.destination, 'npc');
});
test('NPC rejects absent, invalid and unprofitable prices', () => {
  for (const price of [undefined, null, 0, -1, NaN, Infinity, 3]) {
    assert.equal(analyze(product, { destination: 'npc' }, 'Wheat', price), null);
  }
  assert.equal(analyze(product, { destination: 'bazaar' }), null);
});
test('NPC queue and flow constrain purchases; portfolio uses same fixed price', () => {
  const r = analyze(product, { destination: 'npc', tick: 0 }, 'Wheat', 6);
  assert.equal(r.bidQueue, 50);
  assert.equal(r.queueHours, .05);
  assert.equal(r.quantity, 9);
  const plan = allocate([r], { budget: 100, destination: 'npc', maxAllocation: 25 });
  assert.equal(plan.positions[0].quantity, 6);
  assert.equal(plan.profit, 12);
  assert.ok(plan.positions[0].hours <= 1);
});
test('destination validates old saved and unexpected settings', () => {
  assert.equal(settings({}).destination, 'bazaar');
  assert.equal(settings({ destination: 'npc' }).destination, 'npc');
  assert.equal(settings({ destination: 'anything' }).destination, 'bazaar');
});
