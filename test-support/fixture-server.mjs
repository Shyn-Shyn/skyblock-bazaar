// Offline UI fixture server: no imports from server.mjs and no outgoing requests.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const port = Number(process.env.FIXTURE_PORT || 4183);
let mode = 'all', itemsAge = 0;
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
};
const names = { TEST_ITEM: 'Test Kapazität', COMPACT: 'Kompakte Position', BUDGET: 'Budget Position', MASS: 'Massen Position', LIMIT_A: 'NPC Limit A', LIMIT_B: 'NPC Limit B' };
const npcPrices = { TEST_ITEM: 120, COMPACT: 120, BUDGET: 12, MASS: 1.3, LIMIT_A: 12, LIMIT_B: 12 };
const modes = { all: Object.keys(products), capacity: ['TEST_ITEM'], goals: ['COMPACT', 'BUDGET'], npc: ['COMPACT', 'MASS'], npclimit: ['LIMIT_A', 'LIMIT_B'] };
const json = (res, value) => { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };

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
    json(res, { mode, itemsAge }); return;
  }
  if (url.pathname === '/api/bazaar') {
    const now = Date.now();
    json(res, { products: Object.fromEntries(modes[mode].map(id => [id, products[id]])), names, npcPrices,
      lastUpdated: now, itemsFetchedAt: now - itemsAge * 3600000, fetchedAt: now,
      refreshSeconds: 60, nextRefreshAt: now + 60000, fixture: true }); return;
  }
  try {
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!path.startsWith(resolve(root) + sep)) { res.writeHead(403); res.end(); return; }
    const body = await readFile(path);
    const type = { '.mjs': 'text/javascript', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.png': 'image/png' }[extname(path)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Offline fixtures: http://127.0.0.1:${port} (mode=${mode})`));
