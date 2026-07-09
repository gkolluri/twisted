#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { parseDocument, sectionsToCms, isDocumentPopulated } = require('./lib/cms-parser');
const {
  deepMerge,
  mergeLinkItems,
  mergeMenuFromSections,
  mergeEventsFromSections,
  extendCmsFromSections,
} = require('./lib/cms-merge');

const root = path.join(__dirname, '..');
const seedPath = path.join(root, 'data', 'cms.seed.json');
const menuSeedPath = path.join(root, 'data', 'menu.seed.json');
const eventsSeedPath = path.join(root, 'data', 'events.seed.json');
const outPath = path.join(root, 'data', 'cms.json');
const menuOutPath = path.join(root, 'data', 'menu.json');
const eventsOutPath = path.join(root, 'data', 'events.json');

const DEFAULT_DOC_ID = '1Xv98qwrWbPNbITAR8pOItIAXsMW-Ugo1IztD6qUeS48';
const docId = (process.env.GOOGLE_DOC_ID || DEFAULT_DOC_ID).trim();

function loadJson(file, fallbackFile) {
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  if (fallbackFile && fs.existsSync(fallbackFile)) return JSON.parse(fs.readFileSync(fallbackFile, 'utf8'));
  throw new Error(`Missing JSON: ${file}`);
}

async function fetchDocText() {
  const url = `https://docs.google.com/document/d/${docId}/export?format=txt`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Google Doc fetch failed (${res.status})`);
  return res.text();
}

async function main() {
  const cmsSeed = loadJson(seedPath);
  const menuSeed = loadJson(menuSeedPath);
  const eventsSeed = loadJson(eventsSeedPath, path.join(root, 'data', 'events.json'));

  let cms = cmsSeed;
  let menu = menuSeed;
  let events = eventsSeed;
  let source = 'seed';

  try {
    const text = await fetchDocText();
    const sections = parseDocument(text);
    if (isDocumentPopulated(sections)) {
      const parsed = sectionsToCms(sections);
      cms = deepMerge(cmsSeed, parsed);
      cms = extendCmsFromSections(cms, sections);
      if (cms.links) {
        cms.links.items = mergeLinkItems(cmsSeed.links?.items, cms.links.items);
        if (cmsSeed.links?.footerWebsiteUrl) cms.links.footerWebsiteUrl = cmsSeed.links.footerWebsiteUrl;
        if (cmsSeed.links?.footerWebsiteDisplay) cms.links.footerWebsiteDisplay = cmsSeed.links.footerWebsiteDisplay;
      }
      menu = mergeMenuFromSections(sections, menuSeed);
      events = mergeEventsFromSections(sections, eventsSeed);
      source = `google-doc:${docId}`;
    } else {
      console.warn('CMS: Google Doc has no CMS sections yet — using seed content.');
    }
  } catch (err) {
    console.warn(`CMS: Could not fetch Google Doc (${err.message}) — using seed content.`);
  }

  if (!cms.events_page) cms = extendCmsFromSections(cms, {});

  fs.writeFileSync(outPath, `${JSON.stringify(cms, null, 2)}\n`);
  fs.writeFileSync(menuOutPath, `${JSON.stringify(menu, null, 2)}\n`);
  fs.writeFileSync(eventsOutPath, `${JSON.stringify(events, null, 2)}\n`);
  console.log(`CMS: wrote data/cms.json, menu.json, events.json (source: ${source})`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
