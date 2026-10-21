import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restoreProfiles, saveProfiles, overviewSettings } from '../public/profiles.mjs';
import { analyze, settings, planDefaults } from '../public/market.mjs';

test('legacy settings migrate once to the plan while overview uses fixed references', () => {
  const legacy = { budget: 1234567, tax: 1.8, destination: 'npc', horizon: 3, minRoi: 7 };
  const p = restoreProfiles(null, legacy);
  assert.equal(p.scanner.horizon, 1);
  assert.equal(p.scanner.minRoi, 2);
  assert.equal(p.scanner.tax, 1.25);
  assert.equal(p.scanner.destination, 'npc');
  assert.equal(p.plan.horizon, 24);
  assert.equal(p.plan.minRoi, 2);
  assert.equal(p.plan.maxPositions, 12);
  assert.equal(p.plan.allocationGoal, 'budget');
  for (const key of ['budget', 'tax', 'destination']) assert.equal(p.plan[key], legacy[key]);
  p.plan.budget = 2000;
  assert.equal(p.scanner.budget, 1000000);
  assert.deepEqual(restoreProfiles(saveProfiles(p), { budget: 1 }), p);
});
test('missing and malformed profiles normalize independently and limits are whole', () => {
  const p = restoreProfiles({ scanner: { budget: 1000, horizon: 2 }, plan: null }, null);
  assert.equal(p.scanner.horizon, 1);
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

test('old scanner filters cannot change the overview; all valid plan parameters survive', () => {
  const plan = settings({ budget: 10e6, tax: 3, minRoi: 8, horizon: 48, destination: 'npc',
    maxNpcItems: 99, maxPositions: 4, maxAllocation: 30, npcPreference: 'profit' }, planDefaults);
  const restored = restoreProfiles({ version: 1, scanner: { budget: 1, horizon: 168, tax: 20,
    minRoi: 9999, share: 100, destination: 'bazaar' }, plan }, { budget: 7 });
  assert.deepEqual(restored.scanner, overviewSettings());
  assert.deepEqual(restored.plan, plan);
  const saved = saveProfiles(restored);
  assert.deepEqual(saved.scanner, { destination: 'bazaar' });
  assert.deepEqual(restoreProfiles(saved, { budget: 1 }), restored);
  assert.deepEqual(overviewSettings({ budget: 1, minRoi: 999, destination: 'npc' }),
    { ...overviewSettings(), destination: 'npc' });
});

test('missing plan profile still migrates only budget, tax and destination', () => {
  const restored = restoreProfiles({ scanner: { budget: 3000, tax: 2, destination: 'npc', horizon: 9 } }, null);
  assert.equal(restored.plan.budget, 3000);
  assert.equal(restored.plan.tax, 2);
  assert.equal(restored.plan.destination, 'npc');
  assert.equal(restored.plan.horizon, 24);
});
test('24 hour planner expands sequential capacity without increasing market share', () => {
  const product = { product_id: 'TEST_ITEM',
    sell_summary: [{ pricePerUnit: 100, amount: 200, orders: 2 }],
    buy_summary: [{ pricePerUnit: 120, amount: 300, orders: 2 }],
    quick_status: { sellVolume: 300, buyVolume: 400, sellMovingWeek: 168300,
      buyMovingWeek: 336400, sellOrders: 5, buyOrders: 5 } };
  const profiles = restoreProfiles(null, null);
  assert.equal(analyze(product, profiles.scanner).quantity, 6);
  const overview = analyze(product, profiles.scanner);
  assert.ok(Math.abs(overview.capital - 600.6) < 1e-9);
  assert.ok(Math.abs(overview.total - 109.8075) < 1e-9);
  profiles.plan.budget = 10e6;
  profiles.plan.tax = 20;
  assert.deepEqual(analyze(product, profiles.scanner), overview);
  profiles.plan = { ...planDefaults };
  const r = analyze(product, profiles.plan);
  assert.equal(r.quantity, 160);
  assert.equal(r.capital, 16016);
  assert.ok(Math.abs(r.profit - 18.30125) < 1e-9);
  assert.ok(Math.abs(r.total - 2928.2) < 1e-8);
});
