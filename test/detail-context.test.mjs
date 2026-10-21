import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detailContext } from '../public/detail-context.mjs';

test('BUG-001 refreshed plan details keep plan context when allocation drops the item', () => {
  const candidate = { id: 'TEST_ITEM', quantity: 160, capital: 16016, total: 2928.2 };
  const position = { ...candidate, quantity: 10, capital: 1001, total: 183.0125 };
  const before = detailContext('plan', candidate, position);
  assert.equal(before.displayed.quantity, 10);
  assert.equal(before.quantityLabel, 'Geplante Kaufmenge');
  const after = detailContext('plan', candidate, undefined);
  assert.equal(after.displayed.quantity, 160);
  assert.equal(after.missingFromPlan, true);
  assert.equal(after.planned, false);
  assert.match(after.note, /nicht mehr im aktuellen Investitionsplan/);
  assert.match(after.note, /Planprofil/);
  assert.match(after.note, /keine aktuelle Kaufempfehlung/);
  assert.doesNotMatch(after.note, /Scanner|Alle Flips/);
  for (const label of [after.quantityLabel, after.capitalLabel, after.profitLabel]) assert.match(label, /Kapazitätsalternative/);
});

test('scanner details remain an independent alternative even when item is planned', () => {
  const candidate = { quantity: 6, capital: 600.6 };
  const context = detailContext('scanner', candidate, { quantity: 100 });
  assert.equal(context.displayed, candidate);
  assert.equal(context.planned, false);
  assert.match(context.note, /Referenzbudget/);
  assert.doesNotMatch(context.note, /Scannerfilter|Scannerbudget/);
});
