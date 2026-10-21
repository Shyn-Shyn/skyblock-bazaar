import http from 'node:http';
import { createPollGate, retryDelay } from './polling.mjs';
import { serveStatic } from './http-assets.mjs';
import { createItemsCache } from './items-cache.mjs';

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const refreshMs = Math.max(60, Number(process.env.REFRESH_SECONDS) || 60) * 1000;
const pollGate = createPollGate(refreshMs);
let snapshot = null;
const itemsCache = createItemsCache(getJson);
let lastError = null;
let pending = null;

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

const server = http.createServer(async (req, res) => {
  if (await serveStatic(req, res)) return;
  try {
    await refresh();
    const stale = !snapshot || Date.now() - snapshot.lastUpdated > Math.max(180000, refreshMs * 3);
    const status = snapshot ? 200 : 503;
    const body = JSON.stringify({ ...snapshot, ...itemsCache.snapshot(),
      stale, error: lastError, refreshSeconds: refreshMs / 1000, nextRefreshAt: pollGate.next });
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ error: 'Interner Serverfehler' }));
  }
});
server.listen(port, host, () => {
  console.log(`Bazaar Flipper: http://localhost:${port}`);
  void refresh();
  void itemsCache.refresh();
});
const timer = setInterval(() => { void refresh(); void itemsCache.refresh(); }, 1000);
function shutdown() { clearInterval(timer); server.close(); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
