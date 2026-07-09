const fs = require('fs');
const path = require('path');

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object') return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length) out[key] = value;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      out[key] = deepMerge(out[key] || {}, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function parseColumnsFromDoc(data) {
  const raw = data.columns || data.column || [];
  return raw.map((col) => {
    const itemsRaw = col.items || col._text || '';
    const items = Array.isArray(col.items)
      ? col.items
      : String(itemsRaw).split('|').map((s) => s.trim()).filter(Boolean);
    return { title: col.title || '', items };
  });
}

function parseMenuSectionFromDoc(data, existing) {
  const section = existing ? deepClone(existing) : {
    id: data.id || 'section',
    title: data.title || '',
    type: data.type || 'grid',
    notes: [],
    items: [],
    columns: [],
  };

  if (data.title) section.title = data.title;
  if (data.type) section.type = data.type;

  const items = data.items || data.item || [];
  if (items.length) {
    section.items = items.map((item) => ({
      title: item.title || '',
      body: item.body || item.description || item._text || '',
    }));
  }

  const columns = parseColumnsFromDoc(data);
  if (columns.length) section.columns = columns;

  const notes = [];
  if (data.note) notes.push({ class: '', text: data.note });
  if (data.note_left) notes.push({ class: 'menu-note--left', text: data.note_left });
  if (data.note_heat) notes.push({ class: 'menu-note--heat', text: data.note_heat });
  if (data.text) notes.push({ class: '', text: data.text });
  if (notes.length) section.notes = notes;

  if (data.dry_rub || data.wet_sauce) {
    section.type = 'wings';
    section.columns = [
      {
        title: 'Dry Rub',
        items: String(data.dry_rub || '').split('|').map((s) => s.trim()).filter(Boolean),
      },
      {
        title: 'Wet Sauce',
        items: String(data.wet_sauce || '').split('|').map((s) => s.trim()).filter(Boolean),
      },
    ].filter((col) => col.items.length);
  }

  return section;
}

function mergeMenuFromSections(sections, menuSeed) {
  const menu = deepClone(menuSeed);

  if (sections.menu) {
    menu.page = deepMerge(menu.page, {
      label: sections.menu.label,
      title: sections.menu.title,
      intro: sections.menu.intro,
      note: sections.menu.note,
      disclaimer: sections.menu.disclaimer,
      hookahNote: sections.menu.hookah_note || sections.menu.hookahnote,
    });
  }

  for (const [key, data] of Object.entries(sections)) {
    if (!key.startsWith('menu.section:')) continue;
    const id = key.slice('menu.section:'.length);
    const idx = menu.sections.findIndex((s) => s.id === id);
    const existing = idx >= 0 ? menu.sections[idx] : null;
    const parsed = parseMenuSectionFromDoc({ ...data, id }, existing);
    if (idx >= 0) menu.sections[idx] = parsed;
    else menu.sections.push(parsed);
  }

  return menu;
}

function parseHighlights(data) {
  return String(data || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

function mergeEventsFromSections(sections, eventsSeed) {
  const events = deepClone(eventsSeed);

  for (const [key, data] of Object.entries(sections)) {
    if (!key.startsWith('event:')) continue;
    const slug = key.slice('event:'.length);
    const idx = events.findIndex((e) => e.slug === slug);
    if (idx < 0) continue;

    const event = events[idx];
    if (data.title) event.title = data.title;
    if (data.page_title) event.pageTitle = data.page_title;
    if (data.badge) event.badge = data.badge;
    if (data.schedule_day) event.scheduleDay = data.schedule_day;
    if (data.presenter) event.presenter = data.presenter;
    if (data.when) event.when = data.when;
    if (data.time) event.time = data.time;
    if (data.time_label) event.timeLabel = data.time_label;
    if (data.tag) event.tag = data.tag;
    if (data.description) event.description = data.description;
    if (data.weekly_blurb) event.weeklyBlurb = data.weekly_blurb;
    if (data.meta_description) event.metaDescription = data.meta_description;
    if (data.image) event.image = data.image;
    if (data.image_alt) event.imageAlt = data.image_alt;
    if (data.highlights) event.highlights = parseHighlights(data.highlights);
    if (data.featured) event.featuredOnListing = ['yes', 'true', '1'].includes(String(data.featured).toLowerCase());
    if (data.hide_weekly) event.hideFromWeeklySchedule = ['yes', 'true', '1'].includes(String(data.hide_weekly).toLowerCase());
    if (data.extra_label && data.extra_value) {
      event.extraDetail = { label: data.extra_label, value: data.extra_value };
    }
  }

  return events;
}

function mergeLinkItems(seedItems, docItems) {
  const seed = seedItems || [];
  const doc = docItems || [];
  const seedMenus = seed.filter((item) => !item.icon);
  const socialByIcon = {};
  for (const item of seed.filter((item) => item.icon)) socialByIcon[item.icon] = item;
  for (const item of doc.filter((item) => item.icon)) socialByIcon[item.icon] = item;
  if (!seedMenus.length && !Object.keys(socialByIcon).length) return doc;
  return [...seedMenus, ...Object.values(socialByIcon)];
}

function extendCmsFromSections(cms, sections) {
  const eventsPage = sections['events.page'] || sections['events-page'] || {};
  cms.events_page = {
    label: eventsPage.label || 'Weekly Schedule',
    title: eventsPage.title || 'Events Every Week',
    body: eventsPage.body || '',
    featuredLabel: eventsPage.featured_label || 'Featured',
    featuredTitle: eventsPage.featured_title || 'Weekly Events',
    scheduleLabel: eventsPage.schedule_label || 'Every Week',
    scheduleTitle: eventsPage.schedule_title || 'Regular Weekly Schedule',
    scheduleNote: eventsPage.schedule_note || 'Happy hour every weekday · 4:00 – 7:00 PM',
    privateTitle: eventsPage.private_title || 'Private Events & Large Parties',
    privateBody: eventsPage.private_body || 'Planning a birthday, corporate event, or large group? Call us and our team will follow up with details.',
  };
  return cms;
}

module.exports = {
  deepMerge,
  mergeLinkItems,
  mergeMenuFromSections,
  mergeEventsFromSections,
  extendCmsFromSections,
};
