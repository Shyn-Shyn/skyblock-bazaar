import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createItemsCache } from '../items-cache.mjs';
import { createPollGate } from '../polling.mjs';

const hour = 3600000;
const resource = { lastUpdated: 1000, items: [{ id: 'A', name: '§aOfficial Name', npc_sell_price: 6 },
  { id: 'B', name: 'Other', npc_sell_price: 0 }, { id: 'C', npc_sell_price: Infinity }] };

test('resources poll at startup, hourly after completion, single-flight and independent of market gate', async () => {
  let now = 10000, count = 0, resolve;
  const cache = createItemsCache(path => {
    assert.equal(path, 'resources/skyblock/items'); count++;
    return new Promise(done => { resolve = done; });
  }, { now: () => now });
  const first = cache.refresh(), concurrent = cache.refresh();
  assert.equal(first, concurrent);
  await Promise.resolve();
  assert.equal(count, 1);
  const gate = createPollGate(60000, () => now);
  gate.start(); now += 60000;
  assert.equal(gate.ready(), true);
  assert.equal(cache.refresh(), first);
  resolve(resource); await first;
  const initial = cache.snapshot();
  assert.equal(initial.itemsFetchedAt, now);
  assert.equal(initial.itemsLastUpdated, 1000);
  assert.equal(initial.nextItemsRefreshAt, now + hour);
  assert.deepEqual(initial.names, { A: 'Official Name', B: 'Other' });
  assert.deepEqual(initial.npcPrices, { A: 6 });
  now += hour - 1; await cache.refresh(); assert.equal(count, 1);
  now++; const second = cache.refresh(); await Promise.resolve(); assert.equal(count, 2);
  resolve(resource); await second;
  assert.equal(cache.snapshot().itemsFetchedAt, now);
  assert.equal(cache.snapshot().itemsLastUpdated, 1000, 'same source time is valid on a new successful check');
});

test('resource failure preserves valid data, waits one hour or Retry-After and recovers', async () => {
  let now = 10000, failure = false, retryAfter = 0, count = 0;
  const cache = createItemsCache(async () => {
    count++;
    if (failure) throw Object.assign(new Error('Unavailable'), { retryAfter });
    return resource;
  }, { now: () => now });
  await cache.refresh(); const previous = cache.snapshot();
  now += hour; failure = true;
  await cache.refresh();
  assert.deepEqual(cache.snapshot().names, previous.names);
  assert.deepEqual(cache.snapshot().npcPrices, previous.npcPrices);
  assert.equal(cache.snapshot().itemsFetchedAt, previous.itemsFetchedAt);
  assert.ok(cache.snapshot().itemsError);
  assert.equal(cache.snapshot().nextItemsRefreshAt, now + hour);
  now += hour; retryAfter = 3 * hour; await cache.refresh();
  assert.equal(cache.snapshot().nextItemsRefreshAt, now + 3 * hour);
  now += 3 * hour - 1; await cache.refresh(); assert.equal(count, 3);
  now++; failure = false; await cache.refresh();
  assert.equal(cache.snapshot().itemsError, null);
  assert.equal(cache.snapshot().itemsFetchedAt, now);
});

test('invalid resource body cannot replace last valid prices', async () => {
  let now = 10000, data = resource;
  const cache = createItemsCache(async () => data, { now: () => now });
  await cache.refresh();
  for (const items of [null, {}, []]) {
    now += hour; data = { items }; await cache.refresh();
    assert.deepEqual(cache.snapshot().npcPrices, { A: 6 });
    assert.equal(cache.snapshot().itemsFetchedAt, 10000);
    assert.ok(cache.snapshot().itemsError);
  }
});
