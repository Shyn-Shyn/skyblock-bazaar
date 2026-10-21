// Offline API fixtures with the actual production static dispatch; no upstream requests.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { serveStatic } from '../http-assets.mjs';

const port = Number(process.env.FIXTURE_PORT || 4183);
let mode = 'all', itemsAge = 0;
let apiMode = 'success', lastSnapshot = null;
let marketAge = 0, refreshSeconds = 60, nextSeconds = 60, frozenAt = null, itemsMode = 'success';
const product = (buy, sell, buyRate, sellRate = buyRate) => ({
  sell_summary: [{ pricePerUnit: buy - .1, amount: 1, orders: 3 }],
  buy_summary: [{ pricePerUnit: sell + .1, amount: 1, orders: 3 }],
  quick_status: { sellVolume: 1, buyVolume: 1, sellMovingWeek: buyRate * 168 + 1,
    buyMovingWeek: sellRate * 168 + 1, sellOrders: 3, buyOrders: 3 },
});
const products = {
  TEST_ITEM: product(100.1, 119.9, 1000, 2000),
  COMPACT: product(100, 150 / .9875, 7000 / 168),
  BUDGET: product(10, 12 / .9875, 140000 / 168),
  MASS: product(1, 1.3 / .9875, 700000 / 168),
  LIMIT_A: product(10, 12 / .9875, 70000 / 168),
  LIMIT_B: product(10, 12 / .9875, 70000 / 168),
  SHARD_SKELETON: product(100.1, 119.9, 1000, 2000),
  SHARD_CARROT_KING: product(100.1, 119.9, 1000, 2000),
  OFFICIAL_SHARD: product(100.1, 119.9, 1000, 2000),
  QUALITY_FAST: product(10000, 11000 / .9875, 20000, 20000),
  QUALITY_SLOW_BUY: product(12000, 13200 / .9875, 2000, 20000),
  QUALITY_SLOW_SELL: product(12000, 13200 / .9875, 20000, 2000),
  QUALITY_TINY: product(10, 11 / .9875, 840, 840),
  QUALITY_FIRST: product(100000, 103000 / .9875, 825, 825),
  QUALITY_REST: product(1000, 1020 / .9875, 84000, 84000),
  QUALITY_PARTIAL: {
    sell_summary: [{ pricePerUnit: 100, amount: 2500, orders: 3 }],
    buy_summary: [{ pricePerUnit: 120, amount: 2500, orders: 3 }],
    quick_status: { sellVolume: 2500, buyVolume: 2500, sellMovingWeek: 422500,
      buyMovingWeek: 422500, sellOrders: 3, buyOrders: 3 },
  },
};
const names = { TEST_ITEM: 'Test Kapazität', COMPACT: 'Kompakte Position', BUDGET: 'Budget Position', MASS: 'Massen Position', LIMIT_A: 'NPC Limit A', LIMIT_B: 'NPC Limit B', OFFICIAL_SHARD: '§aOfficial Skeleton Shards' };
const npcPrices = { TEST_ITEM: 120, COMPACT: 120, BUDGET: 12, MASS: 1.3, LIMIT_A: 12, LIMIT_B: 12,
  SHARD_SKELETON: 120, SHARD_CARROT_KING: 120, OFFICIAL_SHARD: 120 };
Object.assign(names, { QUALITY_FAST: 'Zügiger Umlauf', QUALITY_SLOW_BUY: 'Langsamer Einkauf',
  QUALITY_SLOW_SELL: 'Langsamer Verkauf', QUALITY_TINY: 'Bagatelle',
  QUALITY_FIRST: 'Große Hauptposition', QUALITY_REST: 'Zu kleiner Rest', QUALITY_PARTIAL: 'Teilmenge mit Warteschlange' });
const many = Array.from({ length: 60 }, (_, index) => {
  const id = `PAGINATION_${String(index + 1).padStart(2, '0')}`;
  products[id] = product(100.1, 119.9, 1000, 2000);
  names[id] = `Test Item ${index + 1}`;
  npcPrices[id] = 120;
  return id;
});
const modes = { all: ['TEST_ITEM', 'COMPACT', 'BUDGET', 'MASS', 'LIMIT_A', 'LIMIT_B'], capacity: ['TEST_ITEM'],
  goals: ['COMPACT', 'BUDGET'], npc: ['COMPACT', 'MASS'], npclimit: ['LIMIT_A', 'LIMIT_B'],
  names: ['SHARD_SKELETON', 'SHARD_CARROT_KING', 'OFFICIAL_SHARD'], many,
  quality: ['QUALITY_FAST', 'QUALITY_SLOW_BUY', 'QUALITY_SLOW_SELL', 'QUALITY_TINY'],
  qualitybuy: ['QUALITY_FAST', 'QUALITY_SLOW_BUY', 'QUALITY_TINY'],
  qualitysell: ['QUALITY_FAST', 'QUALITY_SLOW_SELL', 'QUALITY_TINY'],
  qualitytiny: ['QUALITY_TINY'], qualityrest: ['QUALITY_FIRST', 'QUALITY_REST'],
  qualitypartial: ['QUALITY_PARTIAL'] };
const json = (req, res, value, status = 200) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(req.method === 'HEAD' ? undefined : JSON.stringify(value));
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  if (url.pathname === '/__setup' || url.pathname === '/__setup.mjs') {
    const script = url.pathname.endsWith('.mjs');
    const body = await readFile(new URL(script ? './setup.mjs' : './setup.html', import.meta.url));
    res.writeHead(200, { 'Content-Type': script ? 'text/javascript' : 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(body); return;
  }
  if (url.pathname === '/__fixture') {
    if (url.searchParams.has('mode') && modes[url.searchParams.get('mode')]) mode = url.searchParams.get('mode');
    if (url.searchParams.has('itemsAge')) itemsAge = Math.max(0, Number(url.searchParams.get('itemsAge')) || 0);
    if (['success', 'unavailable', 'snapshot-error'].includes(url.searchParams.get('apiMode'))) apiMode = url.searchParams.get('apiMode');
    if (['success', 'error', 'missing'].includes(url.searchParams.get('itemsMode'))) itemsMode = url.searchParams.get('itemsMode');
    for (const [key, set] of [['marketAge', v => marketAge = v], ['refreshSeconds', v => refreshSeconds = Math.max(60, v)], ['nextSeconds', v => nextSeconds = v]]) {
      if (url.searchParams.has(key)) set(Math.max(0, Number(url.searchParams.get(key)) || 0));
    }
    if (url.searchParams.has('freeze')) frozenAt = url.searchParams.get('freeze') === 'true' ? Date.now() : null;
    if (url.searchParams.get('clearSnapshot') === 'true') lastSnapshot = null;
    json(req, res, { mode, itemsAge, apiMode, itemsMode, marketAge, refreshSeconds, nextSeconds, frozenAt, hasSnapshot: Boolean(lastSnapshot) }); return;
  }
  // Every application route (HTML, module graph, styles, icon, healthz,
  // unknown paths and method handling) goes through production code.
  if (await serveStatic(req, res)) return;
  if (url.pathname === '/api/bazaar') {
    const now = Date.now();
    const status = { names, npcPrices: itemsMode === 'missing' ? {} : npcPrices,
      itemsFetchedAt: itemsMode === 'missing' ? null : now - itemsAge * 3600000,
      itemsLastUpdated: now - 7 * 86400000, nextItemsRefreshAt: now + 3600000,
      itemsError: itemsMode === 'error' ? 'Offline-Test: Itemdaten-Prüfung fehlgeschlagen' : null,
      refreshSeconds, nextRefreshAt: now + nextSeconds * 1000 };
    if (apiMode === 'unavailable' || (apiMode === 'snapshot-error' && !lastSnapshot)) {
      json(req, res, { error: 'Offline-Test: Marktdaten vorübergehend nicht verfügbar',
        ...status, stale: true }, 503); return;
    }
    if (apiMode === 'snapshot-error') {
      json(req, res, { ...lastSnapshot, error: 'Offline-Test: Aktualisierung fehlgeschlagen',
        ...status }); return;
    }
    lastSnapshot = { products: Object.fromEntries(modes[mode].map(id => [id, products[id]])), ...status,
      lastUpdated: (frozenAt || now) - marketAge * 1000, fetchedAt: now, fixture: true };
    json(req, res, lastSnapshot); return;
  }
}).listen(port, '127.0.0.1', () => console.log(`Offline fixtures: http://127.0.0.1:${port} (mode=${mode})`));
