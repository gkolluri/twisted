#!/usr/bin/env node
/**
 * Builds static site into public/ with SITE_URL injected.
 * Vercel sets VERCEL_URL; set SITE_URL=https://twisteddfw.com once the custom domain is live.
 */
const fs = require('fs');
const path = require('path');

const siteUrl = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://twisteddfw.com')
).replace(/\/$/, '');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public');

const skipDirs = new Set(['public', 'scripts', 'node_modules', '.vercel']);
const skipFiles = new Set(['package.json', 'vercel.json']);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      copyDir(srcPath, destPath);
      continue;
    }

    if (skipFiles.has(entry.name)) continue;

    if (/\.(html|xml|txt)$/.test(entry.name)) {
      const content = fs.readFileSync(srcPath, 'utf8').replace(/\{\{SITE_URL\}\}/g, siteUrl);
      fs.writeFileSync(destPath, content);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}

copyDir(root, outDir);
console.log(`Built public/ with SITE_URL=${siteUrl}`);
