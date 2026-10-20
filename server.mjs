import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createPollGate, retryDelay } from './polling.mjs';

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const refreshMs = Math.max(60, Number(process.env.REFRESH_SECONDS) || 60) * 1000;
const pollGate = createPollGate(refreshMs);
const publicDir = new URL('./public/', import.meta.url);
let snapshot = null;
let names = {};
let npcPrices = {};
let itemsFetchedAt = null;
let itemsError = null;
let lastError = null;
let pending = null;
let nextNames = 0;

async function getJson(path) {
  const response = await fetch(`https://api.hypixel.net/v2/${path}`, {
    signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': 'SkyblockBazaarFlipper/1.0', Accept: 'application/json' },
  });
  if (!response.ok) {
    const error = new Error(`Hypixel antwortet mit HTTP ${response.status}`);
    error.retryAfter = retryDelay(response.headers.get('retry-after'));
    throw error;
  }
  const body = await response.json();
  if (body.success !== true) throw new Error('Hypixel meldet keine erfolgreichen Daten');
  return body;
}

async function refresh() {
  if (pending) return pending;
  if (!pollGate.ready()) return;
  pollGate.start();
  pending = (async () => {
    try {
      const body = await getJson('skyblock/bazaar');
      if (!body.products || typeof body.products !== 'object' || Array.isArray(body.products) ||
          !Object.keys(body.products).length || !Number.isFinite(body.lastUpdated) ||
          body.lastUpdated <= 0 || body.lastUpdated > Date.now() + 60000) throw new Error('Ungültige Bazaar-Daten');
      if (snapshot && body.lastUpdated < snapshot.lastUpdated) throw new Error('Hypixel liefert einen älteren Datenstand');
      snapshot = { products: body.products, lastUpdated: body.lastUpdated, fetchedAt: Date.now() };
      lastError = null;
      pollGate.success();
    } catch (error) {
      lastError = error.name === 'TimeoutError' ? 'Hypixel-Anfrage hat zu lange gedauert' : error.message;
      pollGate.failure(error.retryAfter || 0);
      console.error(lastError);
    } finally {
      pending = null;
    }
  })();
  return pending;
}

async function refreshNames() {
  if (Date.now() < nextNames) return;
  nextNames = Date.now() + 3600000;
  try {
    const data = await getJson('resources/skyblock/items');
    if (!Array.isArray(data.items) || !data.items.length) throw new Error('Ungültige Itemdaten');
    names = Object.fromEntries(data.items.filter(i => typeof i.id === 'string' && typeof i.name === 'string')
      .map(i => [i.id, i.name.replace(/§./g, '')]));
    npcPrices = Object.fromEntries(data.items.filter(i => typeof i.id === 'string' &&
      Number.isFinite(i.npc_sell_price) && i.npc_sell_price > 0).map(i => [i.id, i.npc_sell_price]));
    itemsFetchedAt = Date.now();
    itemsError = null;
    nextNames = Date.now() + 86400000;
  } catch (error) {
    itemsError = 'NPC-Preise konnten nicht aktualisiert werden';
    nextNames = Date.now() + Math.max(3600000, error.retryAfter || 0);
  }
}

const assets = {
  '/app-icon.png': ['app-icon.png', 'image/png'],
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/theme.css': ['theme.css', 'text/css; charset=utf-8'],
  '/app.mjs': ['app.mjs', 'text/javascript; charset=utf-8'],
  '/market.mjs': ['market.mjs', 'text/javascript; charset=utf-8'],
};
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end();
  }
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    let body;
    let type = 'application/json; charset=utf-8';
    let status = 200;
    if (pathname === '/healthz') {
      body = JSON.stringify({ status: 'ok' });
    } else if (pathname === '/api/bazaar') {
      await refresh();
      const stale = !snapshot || Date.now() - snapshot.lastUpdated > Math.max(180000, refreshMs * 3);
      status = snapshot ? 200 : 503;
      body = JSON.stringify({ ...snapshot, names, npcPrices, itemsFetchedAt, itemsError,
        stale, error: lastError, refreshSeconds: refreshMs / 1000, nextRefreshAt: pollGate.next });
    } else if (Object.hasOwn(assets, pathname)) {
      const [file, mime] = assets[pathname];
      body = await readFile(new URL(file, publicDir));
      type = mime;
    } else {
      status = 404; body = JSON.stringify({ error: 'Nicht gefunden' });
    }
    res.writeHead(status, { 'Content-Type': type });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Interner Serverfehler' }));
  }
});
server.listen(port, host, () => {
  console.log(`Bazaar Flipper: http://localhost:${port}`);
  void refresh();
  void refreshNames();
});
const timer = setInterval(() => { void refresh(); void refreshNames(); }, 1000);
function shutdown() { clearInterval(timer); server.close(); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
