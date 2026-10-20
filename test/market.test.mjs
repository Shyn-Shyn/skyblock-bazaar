import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, settings } from '../public/market.mjs';

const fixture = () => ({
  product_id: 'TEST_ITEM',
  sell_summary: [{ pricePerUnit: 99, amount: 100, orders: 3 }, { pricePerUnit: 100, amount: 200, orders: 2 }],
  buy_summary: [{ pricePerUnit: 125, amount: 100, orders: 3 }, { pricePerUnit: 120, amount: 300, orders: 2 }],
  quick_status: { sellVolume: 300, buyVolume: 400, sellMovingWeek: 168300, buyMovingWeek: 336400, sellOrders: 5, buyOrders: 5 },
});
test('uses correct sides and best levels rather than quick_status prices', () => {
  const r = analyze(fixture());
  assert.equal(r.buy, 100.1); assert.equal(r.sell, 119.9);
  assert.ok(Math.abs(r.profit - 18.30125) < 1e-8);
  assert.ok(Math.abs(r.roi - r.profit / 100.1 * 100) < 1e-8);
});
test('removes live volume, accounts for sequential legs and market share', () => {
  const r = analyze(fixture());
  assert.equal(r.buyWeekly, 168000); assert.equal(r.sellWeekly, 336000);
  assert.equal(r.quantity, 6); assert.equal(r.bidQueue, 0); assert.equal(r.askQueue, 0);
  assert.ok(r.hours <= 1); assert.equal(r.total, r.profit * r.quantity);
});
test('budget and max quantity independently cap a position', () => {
  assert.equal(analyze(fixture(), { budget: 201 }).quantity, 2);
  assert.equal(analyze(fixture(), { maxQuantity: 1 }).quantity, 1);
  assert.equal(analyze(fixture(), { budget: 50 }).eligible, false);
});
test('equal-price orders include existing queue', () => {
  const r = analyze(fixture(), { tick: 0 });
  assert.equal(r.bidQueue, 200); assert.equal(r.askQueue, 300);
  assert.equal(r.queueHours, .35); assert.equal(r.quantity, 4);
});
test('empty, invalid and crossed markets are not recommended', () => {
  let p = fixture(); p.buy_summary = []; assert.equal(analyze(p), null);
  p = fixture(); p.sell_summary[1].pricePerUnit = 130; assert.equal(analyze(p), null);
  p = fixture(); p.quick_status.sellVolume = NaN; assert.equal(analyze(p), null);
  p = fixture(); p.quick_status.sellMovingWeek = 0; assert.equal(analyze(p).eligible, false);
});
test('negative net profit, suspicious ROI and order pressure are filtered', () => {
  assert.equal(analyze(fixture(), { tax: 20 }).eligible, false);
  assert.equal(analyze(fixture(), { maxRoi: 5 }).eligible, false);
  assert.equal(analyze(fixture(), { maxQueue: .1 }).eligible, false);
});
test('settings clamp malformed external or saved input', () => {
  const s = settings({ budget: -1, tax: Infinity, share: 10000, horizon: '' });
  assert.equal(s.budget, 1); assert.equal(s.tax, 1.25); assert.equal(s.share, 100); assert.equal(s.horizon, 1);
});
