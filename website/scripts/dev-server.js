#!/usr/bin/env node
/**
 * Local dev server with Vercel-style clean URLs (/events, /menu).
 * Serves the built public/ directory.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const port = Number(process.env.PORT) || 8765;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

const htmlRedirects = {
  '/index.html': '/',
  '/menu.html': '/menu',
  '/events.html': '/events',
};

function resolveFile(urlPath) {
  const normalized = urlPath.replace(/\/+$/, '') || '/';

  if (normalized === '/') {
    return path.join(publicDir, 'index.html');
  }

  const asFile = path.join(publicDir, normalized);
  if (fs.existsSync(asFile) && fs.statSync(asFile).isFile()) {
    return asFile;
  }

  const asHtml = path.join(publicDir, `${normalized}.html`);
  if (fs.existsSync(asHtml) && fs.statSync(asHtml).isFile()) {
    return asHtml;
  }

  const asIndex = path.join(publicDir, normalized, 'index.html');
  if (fs.existsSync(asIndex) && fs.statSync(asIndex).isFile()) {
    return asIndex;
  }

  const notFound = path.join(publicDir, '404.html');
  if (fs.existsSync(notFound)) {
    return notFound;
  }

  return null;
}

function runBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'build'], {
      cwd: root,
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`build failed (${code})`))));
  });
}

function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const redirect = htmlRedirects[url.pathname];
    if (redirect) {
      res.writeHead(301, { Location: redirect });
      res.end();
      return;
    }

    const filePath = resolveFile(url.pathname);
    if (!filePath) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const is404 = path.basename(filePath) === '404.html' && !fs.existsSync(path.join(publicDir, url.pathname.replace(/^\//, '')));

    res.writeHead(is404 ? 404 : 200, { 'Content-Type': type });
    fs.createReadStream(filePath).pipe(res);
  });

  server.listen(port, () => {
    console.log(`Dev server: http://localhost:${port}`);
    console.log('Clean URLs: /menu, /events (matches Vercel)');
  });
}

runBuild()
  .then(startServer)
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
