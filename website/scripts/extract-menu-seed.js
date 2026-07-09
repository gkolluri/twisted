#!/usr/bin/env node
/**
 * One-time helper: extracts menu structure from menu.html into data/menu.seed.json
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'menu.html'), 'utf8');

const headerMatch = html.match(/<section class="page-header">([\s\S]*?)<\/section>/);
const headerBlock = headerMatch ? headerMatch[1] : '';

const page = {
  label: (headerBlock.match(/<p class="section-label">([^<]*)<\/p>/) || [])[1] || 'Eat & Drink',
  title: (headerBlock.match(/<h1>([^<]*)<\/h1>/) || [])[1] || 'Our Menu',
  intro: (headerBlock.match(/<h1>[^<]*<\/h1>\s*<p>([^<]*)<\/p>/) || [])[1] || '',
  note: (headerBlock.match(/menu-note[^>]*>([^<]*)<\/p>/) || [])[1] || '',
  disclaimer: (html.match(/class="menu-disclaimer">([^<]*)</) || [])[1] || '',
  hookahNote: (html.match(/id="hookah"[\s\S]*?menu-note[^>]*>([^<]*)</) || [])[1] || '',
};

function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();
}

function parseItems(block) {
  const items = [];
  const re = /<h3>([^<]*)<\/h3><p>([^<]*)<\/p>/g;
  let m;
  while ((m = re.exec(block))) {
    items.push({ title: decode(m[1]), body: decode(m[2]) });
  }
  return items;
}

function parseListItems(block) {
  return [...block.matchAll(/<li>([^<]*)<\/li>/g)].map((m) => decode(m[1]));
}

const sections = [];
const categoryRe = /<div class="menu-category"([^>]*)>([\s\S]*?)<\/div>\s*(?=<div class="menu-category"|<p class="menu-disclaimer")/g;
let cm;
while ((cm = categoryRe.exec(html))) {
  const attrs = cm[1];
  const block = cm[2];
  const title = decode((block.match(/<h2>([^<]*)<\/h2>/) || [])[1] || '');
  const id = (attrs.match(/id="([^"]+)"/) || [])[1] || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const notes = [...block.matchAll(/<p class="menu-note([^"]*)">([^<]*)<\/p>/g)].map((m) => ({
    class: m[1].trim(),
    text: decode(m[2]),
  }));

  if (block.includes('menu-list-grid') && !block.includes('menu-grid')) {
    const columns = [];
    const colRe = /<div>\s*<h3>([^<]*)<\/h3>\s*<ul>([\s\S]*?)<\/ul>\s*<\/div>/g;
    let col;
    while ((col = colRe.exec(block))) {
      columns.push({ title: decode(col[1]), items: parseListItems(col[2]) });
    }
    sections.push({ id, title, type: 'list_grid', notes, columns });
    continue;
  }

  if (block.includes('menu-list-grid') && block.includes('menu-grid')) {
    const items = parseItems(block);
    const columns = [];
    const listBlock = block.match(/<div class="menu-list-grid">([\s\S]*?)<\/div>/)?.[1] || '';
    const colRe = /<div>\s*<h3>([^<]*)<\/h3>\s*<ul>([\s\S]*?)<\/ul>\s*<\/div>/g;
    let col;
    while ((col = colRe.exec(listBlock))) {
      columns.push({ title: decode(col[1]), items: parseListItems(col[2]) });
    }
    sections.push({ id, title, type: 'wings', notes, items, columns });
    continue;
  }

  if (attrs.includes('id="hookah"')) {
    sections.push({ id, title, type: 'hookah', notes });
    continue;
  }

  const items = parseItems(block);
  if (items.length) {
    sections.push({ id, title, type: 'grid', notes, items });
  } else if (notes.length) {
    sections.push({ id, title, type: 'text', notes });
  }
}

const out = { page, sections };
fs.writeFileSync(path.join(root, 'data', 'menu.seed.json'), `${JSON.stringify(out, null, 2)}\n`);
console.log(`Wrote menu.seed.json with ${sections.length} sections`);
