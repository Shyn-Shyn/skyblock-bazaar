import { test } from 'node:test';
import assert from 'node:assert/strict';
import { npcDataAvailable, metadataStatus, nextLoadDelay, mergeApiData } from '../public/data-status.mjs';
import { analyze, itemName } from '../public/market.mjs';

test('NPC eligibility uses successful check age, including exact 48 hour boundary, not source age', () => {
  const now = 200000000, boundary = now - 48 * 3600000;
  assert.equal(npcDataAvailable(null, now), false);
  assert.equal(npcDataAvailable({ itemsFetchedAt: boundary }, now), false);
  assert.equal(npcDataAvailable({ itemsFetchedAt: boundary + 1 }, now), true);
  assert.equal(npcDataAvailable({ itemsFetchedAt: now, itemsLastUpdated: 1 }, now), true);
  assert.equal(npcDataAvailable({ itemsFetchedAt: now + 1 }, now), false);
  const product = { product_id: 'SHARD_SKELETON', sell_summary: [{ pricePerUnit: 4, amount: 1, orders: 1 }],
    quick_status: { sellVolume: 1, sellMovingWeek: 168001, sellOrders: 1 } };
  assert.equal(analyze(product, { destination: 'npc' }, undefined, undefined), null);
  const r = analyze(product, { destination: 'npc' }, undefined, 6);
  assert.ok(Math.abs(r.profit - 1.9) < 1e-9);
  assert.equal(r.quantity, 10);
  assert.ok(Math.abs(r.total - 19) < 1e-9);
});

test('next automatic load honors configured cadence and server backoff even without initial snapshot', () => {
  assert.equal(nextLoadDelay(null, 1000), 60000);
  assert.equal(nextLoadDelay({ refreshSeconds: 180 }, 1000), 180000);
  assert.equal(nextLoadDelay({ nextRefreshAt: 601000, refreshSeconds: 60 }, 1000), 601500);
  assert.equal(nextLoadDelay({ nextRefreshAt: 1001 }, 1000), 2000);
});

test('metadata copy distinguishes successful checks, source timestamp, next check and failure', () => {
  const now = 200000000;
  const data = { itemsFetchedAt: now, itemsLastUpdated: 1000, nextItemsRefreshAt: now + 3600000 };
  const text = metadataStatus(data, now);
  assert.match(text, /Letzte erfolgreiche Prüfung/);
  assert.match(text, /Nächste Prüfung/);
  assert.match(text, /60 Min/);
  assert.match(text, /Hypixel-Quellstand/);
  assert.match(metadataStatus({ ...data, itemsError: 'Fehler' }, now), /Fehler. Letzte bekannte Preise/);
  assert.match(metadataStatus(null, now), /Noch keine erfolgreiche Prüfung/);
  assert.match(metadataStatus(null, now), /deaktiviert/);
});

test('BUG-001 initial market 503 retains valid resource status without inventing a market snapshot', () => {
  const now = 1792572764991;
  const unavailable = { error: 'Marktdaten fehlen', itemsFetchedAt: now,
    itemsLastUpdated: 1791967964991, nextItemsRefreshAt: now + 3600000, itemsError: null,
    names: { SHARD_SKELETON: 'Skeleton Shards' }, npcPrices: { SHARD_SKELETON: 6 },
    nextRefreshAt: now + 120000 };
  const initial = mergeApiData({ market: null, items: null }, unavailable, false);
  assert.equal(initial.market, null, 'resource success must not permit flip analysis without products');
  assert.equal(npcDataAvailable(initial.items, now), true);
  const text = metadataStatus(initial.items, now);
  assert.match(text, /Letzte erfolgreiche Prüfung/);
  assert.match(text, /Nächste Prüfung/);
  assert.match(text, /Hypixel-Quellstand/);
  assert.doesNotMatch(text, /Noch keine erfolgreiche Prüfung|steht aus|fehlen oder sind veraltet/);
  assert.equal(nextLoadDelay(unavailable, now), 121500, 'market retry still honors server backoff');

  const success = { ...unavailable, products: { SHARD_SKELETON: {} }, lastUpdated: now + 120000,
    error: null, itemsFetchedAt: now + 120000 };
  const recovered = mergeApiData(initial, success, true);
  assert.equal(recovered.market, success);
  assert.equal(recovered.items.itemsFetchedAt, now + 120000);

  const failed = mergeApiData(recovered, { ...unavailable, itemsFetchedAt: now + 3600000,
    itemsError: 'Ressourcenprüfung fehlgeschlagen', npcPrices: { SHARD_SKELETON: 7 } }, false);
  assert.equal(failed.market, success, 'follow-up market failure preserves the last market snapshot');
  assert.equal(failed.items.itemsFetchedAt, now + 3600000);
  assert.equal(failed.items.npcPrices.SHARD_SKELETON, 7, 'resource updates remain independent');
  assert.match(metadataStatus(failed.items, now + 3600000), /Ressourcenprüfung fehlgeschlagen/);
  assert.deepEqual(mergeApiData(failed, { error: 'Interner Serverfehler' }, false), failed,
    'an error without resource fields retains the previous resource state');
});

test('official names win; shard fallbacks reorder only this ID family', () => {
  assert.equal(itemName('SHARD_SKELETON', '§a§lSkeleton Shards'), 'Skeleton Shards');
  assert.equal(itemName('SHARD_SKELETON'), 'Skeleton Shard');
  assert.equal(itemName('SHARD_CARROT_KING', '§f'), 'Carrot King Shard');
  assert.equal(itemName('SHARD_OF_THE_SHREDDED', 'Shredded Sinew'), 'Shredded Sinew');
  assert.equal(itemName('UNKNOWN_OTHER_ITEM'), 'Unknown Other Item');
});
