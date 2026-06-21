#!/usr/bin/env node
/**
 * Builds static site into public/ with SITE_URL injected.
 * Default public URL: https://twisted-liart.vercel.app (set in vercel.json).
 * When twisteddfw.com is live with SSL, set SITE_URL=https://twisteddfw.com in Vercel Production only.
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_PUBLIC_URL = 'https://twisted-liart.vercel.app';

const trimUrl = (url) => url.replace(/\/$/, '');

const siteUrl = (() => {
  const env = process.env.SITE_URL ? trimUrl(process.env.SITE_URL) : DEFAULT_PUBLIC_URL;
  // Custom domain not live yet — keep all public URLs on the stable Vercel alias.
  if (env.includes('twisteddfw.com')) return DEFAULT_PUBLIC_URL;
  return env;
})();

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public');

const skipDirs = new Set(['public', 'scripts', 'node_modules', '.vercel', 'data']);
const skipFiles = new Set(['package.json', 'vercel.json', 'events-ticketed-section.html', 'events-featured-grid.html', 'events-weekly-schedule.html']);

const gaMeasurementId = (process.env.GA_MEASUREMENT_ID ?? 'G-WXJQXBRBKB').trim();

function analyticsSnippet(measurementId) {
  return `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${measurementId}');
</script>`;
}

function rewriteSocialImageUrls(content) {
  const escapedSiteUrl = siteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return content
    .replace(
      /((?:property="og:image(?::secure_url)?"|name="twitter:image") content=")https:\/\/[^"]*\.vercel\.app(\/images\/[^"]+)(")/gi,
      `$1${siteUrl}$2$3`
    )
    .replace(
      new RegExp(`((?:property="og:image(?::secure_url)?"|name="twitter:image") content=")${escapedSiteUrl}(/images/[^"]+)(")`, 'g'),
      `$1${siteUrl}$2$3`
    );
}

function injectUrls(content) {
  return rewriteSocialImageUrls(content.replace(/\{\{SITE_URL\}\}/g, siteUrl));
}

function processHtml(content) {
  let out = injectUrls(content);
  if (out.includes('{{FEATURED_EVENTS_GRID}}')) {
    const gridPath = path.join(root, 'events-featured-grid.html');
    const grid = fs.existsSync(gridPath) ? fs.readFileSync(gridPath, 'utf8') : '';
    out = out.replace('{{FEATURED_EVENTS_GRID}}', grid);
  }
  if (out.includes('{{WEEKLY_SCHEDULE}}')) {
    const schedulePath = path.join(root, 'events-weekly-schedule.html');
    const schedule = fs.existsSync(schedulePath) ? fs.readFileSync(schedulePath, 'utf8') : '';
    out = out.replace('{{WEEKLY_SCHEDULE}}', schedule);
  }
  if (
    gaMeasurementId &&
    out.includes('</head>') &&
    !out.includes('googletagmanager.com/gtag/js')
  ) {
    out = out.replace('</head>', `${analyticsSnippet(gaMeasurementId)}\n</head>`);
  }
  return out;
}

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
      const raw = fs.readFileSync(srcPath, 'utf8');
      const content = /\.html$/.test(entry.name)
        ? processHtml(raw)
        : injectUrls(raw);
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
console.log(`Built public/ with SITE_URL=${siteUrl} GA4=${gaMeasurementId || 'disabled'}`);
