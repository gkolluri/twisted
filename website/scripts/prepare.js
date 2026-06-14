#!/usr/bin/env node
/**
 * Injects the correct site URL for OG tags and canonical links at build time.
 * Vercel sets VERCEL_URL; set SITE_URL=https://twisteddfw.com in Vercel env once the custom domain is live.
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
const files = ['index.html', 'events.html', 'menu.html', 'robots.txt', 'sitemap.xml'];

for (const file of files) {
  const filePath = path.join(root, file);
  let html = fs.readFileSync(filePath, 'utf8');
  html = html.replace(/\{\{SITE_URL\}\}/g, siteUrl);
  fs.writeFileSync(filePath, html);
}

console.log(`SEO URLs set to: ${siteUrl}`);
