import { readFile } from 'node:fs/promises';

const publicDir = new URL('./public/', import.meta.url);
const assets = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/app-icon.png': ['app-icon.png', 'image/png'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/theme.css': ['theme.css', 'text/css; charset=utf-8'],
  '/app.mjs': ['app.mjs', 'text/javascript; charset=utf-8'],
  '/market.mjs': ['market.mjs', 'text/javascript; charset=utf-8'],
  '/profiles.mjs': ['profiles.mjs', 'text/javascript; charset=utf-8'],
  '/detail-context.mjs': ['detail-context.mjs', 'text/javascript; charset=utf-8'],
};

// Shared production dispatch. Only /api/bazaar is delegated to the caller.
// Importing this module starts no listener, timer or upstream request.
export async function serveStatic(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return true;
  }
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/api/bazaar') return false;
    let status = 200, type = 'application/json; charset=utf-8', body;
    if (pathname === '/healthz') body = JSON.stringify({ status: 'ok' });
    else if (Object.hasOwn(assets, pathname)) {
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
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ error: 'Interner Serverfehler' }));
  }
  return true;
}
