import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Duplex } from 'node:stream';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { serveStatic } from '../http-assets.mjs';

// Exercise real Node HTTP serialization without a listener or network access.
async function request(path, method = 'GET') {
  const chunks = [];
  const socket = new Duplex({ read() {}, write(chunk, encoding, done) { chunks.push(Buffer.from(chunk)); done(); } });
  const req = new IncomingMessage(socket);
  Object.assign(req, { method, url: path, httpVersion: '1.0', httpVersionMajor: 1, httpVersionMinor: 0 });
  const res = new ServerResponse(req);
  res.assignSocket(socket);
  const finished = once(res, 'finish');
  const handled = await serveStatic(req, res);
  if (!handled) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(method === 'HEAD' ? undefined : JSON.stringify({ injectedApi: true }));
  }
  await finished;
  socket.destroy();
  req.destroy();
  const raw = Buffer.concat(chunks);
  const boundary = raw.indexOf('\r\n\r\n');
  const lines = raw.subarray(0, boundary).toString().split('\r\n');
  return { handled, status: Number(lines[0].split(' ')[1]),
    headers: Object.fromEntries(lines.slice(1).map(line => {
      const colon = line.indexOf(':');
      return [line.slice(0, colon).toLowerCase(), line.slice(colon + 1).trim()];
    })), body: raw.subarray(boundary + 4) };
}

function security(response) {
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['referrer-policy'], 'no-referrer');
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['content-security-policy'], "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
}
const publicDir = new URL('../public/', import.meta.url);

test('production HTML and recursively discovered browser module graph have GET/HEAD, exact files and JS MIME', async () => {
  const html = await request('/');
  assert.equal(html.status, 200);
  assert.match(html.headers['content-type'], /^text\/html/);
  assert.deepEqual(html.body, await readFile(new URL('index.html', publicDir)));
  security(html);
  const pending = [...html.body.toString().matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(match => match[1]);
  assert.ok(pending.length > 0, 'HTML must reference an entry module');
  const visited = new Set();
  while (pending.length) {
    const path = pending.pop();
    if (visited.has(path)) continue;
    visited.add(path);
    const response = await request(path);
    assert.equal(response.status, 200, `module GET ${path}`);
    assert.match(response.headers['content-type'], /^text\/javascript(?:;|$)/, path);
    security(response);
    const expected = await readFile(new URL('.' + path, publicDir));
    assert.deepEqual(response.body, expected, `module content ${path}`);
    const head = await request(path, 'HEAD');
    assert.equal(head.status, 200, `module HEAD ${path}`);
    assert.equal(head.headers['content-type'], response.headers['content-type']);
    assert.equal(head.body.length, 0);
    security(head);
    const source = response.body.toString();
    const imports = [
      ...source.matchAll(/\b(?:import|export)\s+(?:[^'";]*?\bfrom\s*)?['"]([^'"]+)['"]/g),
      ...source.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
    ];
    for (const [, specifier] of imports) {
      if (!specifier.startsWith('.') && !specifier.startsWith('/')) continue;
      pending.push(new URL(specifier, 'http://fixture' + path).pathname);
    }
  }
  for (const path of ['/app.mjs', '/market.mjs', '/profiles.mjs', '/detail-context.mjs']) assert.ok(visited.has(path), `${path} covered transitively`);
});

test('production HTML, CSS, icon and healthz preserve GET/HEAD and content types', async () => {
  for (const [path, file, mime] of [
    ['/', 'index.html', 'text/html; charset=utf-8'],
    ['/style.css', 'style.css', 'text/css; charset=utf-8'],
    ['/theme.css', 'theme.css', 'text/css; charset=utf-8'],
    ['/app-icon.png', 'app-icon.png', 'image/png'],
    ['/healthz', null, 'application/json; charset=utf-8'],
  ]) {
    const get = await request(path);
    assert.equal(get.status, 200);
    assert.equal(get.headers['content-type'], mime);
    security(get);
    if (file) assert.deepEqual(get.body, await readFile(new URL(file, publicDir)));
    else assert.deepEqual(JSON.parse(get.body), { status: 'ok' });
    const head = await request(path, 'HEAD');
    assert.equal(head.status, 200);
    assert.equal(head.headers['content-type'], mime);
    assert.equal(head.body.length, 0);
    security(head);
  }
});

test('explicit production allowlist rejects unknown, repository, dot and traversal paths', async () => {
  for (const path of ['/missing.mjs', '/server.mjs', '/http-assets.mjs', '/package.json',
    '/.git/config', '/.env', '/test/market.test.mjs', '/test-support/setup.html',
    '/../server.mjs', '/%2e%2e/server.mjs', '/%2e%2e%2fserver.mjs', '/..%5cserver.mjs',
    '/public/app.mjs', '/__setup']) {
    const get = await request(path);
    assert.equal(get.status, 404, path);
    assert.deepEqual(JSON.parse(get.body), { error: 'Nicht gefunden' });
    assert.match(get.headers['content-type'], /^application\/json/);
    security(get);
    const head = await request(path, 'HEAD');
    assert.equal(head.status, 404);
    assert.equal(head.body.length, 0);
  }
});

test('production method guard and API delegation preserve HTTP boundaries', async () => {
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) for (const path of ['/', '/app.mjs', '/missing', '/api/bazaar']) {
    const response = await request(path, method);
    assert.equal(response.status, 405);
    assert.equal(response.headers.allow, 'GET, HEAD');
    assert.equal(response.body.length, 0);
    assert.equal(response.handled, true);
    security(response);
  }
  for (const method of ['GET', 'HEAD']) {
    const response = await request('/api/bazaar?refresh=1', method);
    assert.equal(response.handled, false);
    assert.equal(response.status, 200);
    security(response);
    if (method === 'GET') assert.deepEqual(JSON.parse(response.body), { injectedApi: true });
    else assert.equal(response.body.length, 0);
  }
});
