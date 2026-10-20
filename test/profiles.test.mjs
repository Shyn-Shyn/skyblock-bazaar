import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restoreProfiles, saveProfiles } from '../public/profiles.mjs';
import { analyze, settings, planDefaults } from '../public/market.mjs';

test('legacy settings migrate once with separate scanner and planner defaults', () => {
  const legacy = { budget: 1234567, tax: 1.8, destination: 'npc', horizon: 3, minRoi: 7 };
  const p = restoreProfiles(null, legacy);
  assert.equal(p.scanner.horizon, 3);
  assert.equal(p.scanner.minRoi, 7);
  assert.equal(p.plan.horizon, 24);
  assert.equal(p.plan.minRoi, 2);
  assert.equal(p.plan.maxPositions, 12);
  assert.equal(p.plan.allocationGoal, 'budget');
  for (const key of ['budget', 'tax', 'destination']) assert.equal(p.plan[key], legacy[key]);
  p.plan.budget = 2000;
  assert.equal(p.scanner.budget, 1234567);
  assert.deepEqual(restoreProfiles(saveProfiles(p), { budget: 1 }), p);
});
test('missing and malformed profiles normalize independently and limits are whole', () => {
  const p = restoreProfiles({ scanner: { budget: 1000, horizon: 2 }, plan: null }, null);
  assert.equal(p.scanner.horizon, 2);
  assert.equal(p.plan.horizon, 24);
  assert.equal(p.plan.maxPositions, 12);
  assert.equal(restoreProfiles([], null).scanner.budget, 1e6);
  assert.equal(restoreProfiles(null, null).scanner.horizon, 1);
  const s = settings({ maxNpcItems: 30.9, maxPositions: 2.9, maxQuantity: 8.7,
    allocationGoal: 'bad', npcPreference: 'bad' }, planDefaults);
  assert.equal(s.maxNpcItems, 30);
  assert.equal(s.maxPositions, 2);
  assert.equal(s.maxQuantity, 8);
  assert.equal(s.allocationGoal, 'budget');
  assert.equal(s.npcPreference, 'compact');
  assert.equal(settings({ maxNpcItems: '' }).maxNpcItems, 2048);
  assert.equal(settings({ maxNpcItems: -1 }).maxNpcItems, 1);
});
test('24 hour planner expands sequential capacity without increasing market share', () => {
  const product = { product_id: 'TEST_ITEM',
    sell_summary: [{ pricePerUnit: 100, amount: 200, orders: 2 }],
    buy_summary: [{ pricePerUnit: 120, amount: 300, orders: 2 }],
    quick_status: { sellVolume: 300, buyVolume: 400, sellMovingWeek: 168300,
      buyMovingWeek: 336400, sellOrders: 5, buyOrders: 5 } };
  const profiles = restoreProfiles(null, null);
  assert.equal(analyze(product, profiles.scanner).quantity, 6);
  const r = analyze(product, profiles.plan);
  assert.equal(r.quantity, 160);
  assert.equal(r.capital, 16016);
  assert.ok(Math.abs(r.profit - 18.30125) < 1e-9);
  assert.ok(Math.abs(r.total - 2928.2) < 1e-8);
});
