/**
 * Parses Twisted CMS Google Doc text format into structured JSON.
 *
 * Format:
 *   === section-id ===
 *   key: value
 *   list:
 *   - field: value | field: value
 */
function parseDocument(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const sections = {};
  let current = null;
  let buffer = [];

  const flush = () => {
    if (!current) return;
    sections[current] = parseSection(buffer);
    buffer = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    const match = line.match(/^===\s*(.+?)\s*===$/);
    if (match) {
      flush();
      current = match[1].trim().toLowerCase();
      continue;
    }
    if (!current) continue;
    buffer.push(raw);
  }
  flush();
  return sections;
}

function parseSection(lines) {
  const data = {};
  const lists = {};
  let currentList = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const listItem = line.match(/^-\s+(.+)$/);
    if (listItem) {
      const item = parsePipeFields(listItem[1]);
      if (!lists[currentList]) lists[currentList] = [];
      lists[currentList].push(item);
      continue;
    }

    const kv = line.match(/^([a-z0-9_]+):\s*(.*)$/i);
    if (kv) {
      const key = kv[1].toLowerCase();
      const value = kv[2].trim();
      if (value === '' || value === '-') {
        currentList = key;
        lists[currentList] = lists[currentList] || [];
        continue;
      }
      data[key] = value;
      currentList = null;
      continue;
    }

    if (currentList && lists[currentList]) {
      const last = lists[currentList].length - 1;
      if (last >= 0) {
        const prev = lists[currentList][last];
        const textKey = prev._text ? '_text' : 'body';
        prev[textKey] = (prev[textKey] || '') + (prev[textKey] ? ' ' : '') + line;
      }
    } else if (data._paragraph) {
      data._paragraph += ` ${line}`;
    } else if (Object.keys(data).length) {
      const lastKey = Object.keys(data).pop();
      data[lastKey] += ` ${line}`;
    }
  }

  for (const [key, value] of Object.entries(lists)) {
    data[key] = value;
  }
  return data;
}

function parsePipeFields(text) {
  const item = {};
  for (const part of text.split('|')) {
    const seg = part.trim();
    const m = seg.match(/^([a-z0-9_]+):\s*(.+)$/i);
    if (m) item[m[1].toLowerCase()] = m[2].trim();
  }
  if (!Object.keys(item).length) item._text = text.trim();
  return item;
}

function sectionsToCms(sections) {
  const cms = {
    site: {},
    homepage: { hero: {}, about: {}, gallery: {}, events_teaser: {}, reviews: {} },
    links: {},
  };

  if (sections.site) {
    cms.site = {
      name: sections.site.name || 'Twisted Bar & Grill',
      phone: sections.site.phone || '',
      phoneTel: sections.site.phone_tel || sections.site.phonetel || '',
      email: sections.site.email || '',
      addressLine1: sections.site.address_line1 || sections.site.address || '',
      addressLine2: sections.site.address_line2 || '',
      instagram: sections.site.instagram || '',
      facebook: sections.site.facebook || '',
      googleReviews: sections.site.google_reviews || sections.site.googlereviews || '',
      hoursWeekday: sections.site.hours_weekday || '',
      hoursWeekdayTime: sections.site.hours_weekday_time || '',
      hoursWeekend: sections.site.hours_weekend || '',
      hoursWeekendTime: sections.site.hours_weekend_time || '',
      hoursNote: sections.site.hours_note || '',
    };
  }

  const hero = sections['homepage.hero'] || sections['homepage-hero'] || {};
  cms.homepage.hero = {
    line1: hero.line1 || hero.title_line1 || '',
    line2: hero.line2 || hero.title_line2 || '',
    tagline: hero.tagline || '',
    description: hero.description || '',
    ctaPrimary: hero.cta_primary || 'See Weekly Events',
    ctaSecondary: hero.cta_secondary || 'Call Us',
  };

  const about = sections['homepage.about'] || sections['homepage-about'] || {};
  cms.homepage.about = {
    label: about.label || 'About Us',
    title: about.title || '',
    subtitle: about.subtitle || '',
    features: (about.features || about.feature || []).map(normalizeFeature),
  };

  const gallery = sections['homepage.gallery'] || sections['homepage-gallery'] || {};
  cms.homepage.gallery = {
    spaceLabel: gallery.space_label || 'Our Space',
    spaceTitle: gallery.space_title || '',
    spaceBody1: gallery.space_body1 || gallery.space_body || '',
    spaceBody2: gallery.space_body2 || '',
    barLabel: gallery.bar_label || 'Full Bar',
    barTitle: gallery.bar_title || '',
    barBody1: gallery.bar_body1 || gallery.bar_body || '',
    barBody2: gallery.bar_body2 || '',
  };

  const eventsTeaser = sections['homepage.events'] || sections['homepage-events'] || {};
  cms.homepage.events_teaser = {
    label: eventsTeaser.label || 'Events',
    title: eventsTeaser.title || '',
    body: eventsTeaser.body || '',
    cta: eventsTeaser.cta || 'See Weekly Events',
  };

  const highlights = sections['homepage.menu_highlights'] || sections['homepage-menu-highlights'] || {};
  cms.homepage.menu_highlights = (highlights.item || highlights.items || []).map((item) => ({
    title: item.title || '',
    body: item.body || item.description || item._text || '',
  }));

  const reviews = sections['homepage.reviews'] || sections['homepage-reviews'] || {};
  cms.homepage.reviews = {
    heading: reviews.heading || 'What Our Customers Say',
    rating: parseFloat(reviews.rating) || 4.3,
    count: reviews.count || '750+',
    items: (reviews.review || reviews.reviews || []).map(normalizeReview),
  };

  if (sections.links) {
    cms.links = {
      tagline: sections.links.tagline || '',
      foodMenuLabel: sections.links.food_menu_label || 'Food & Drinks Menu',
      hookahMenuLabel: sections.links.hookah_menu_label || 'Hookah Menu',
    };
  }

  return cms;
}

function normalizeFeature(item) {
  return {
    icon: item.icon || '✨',
    title: item.title || '',
    body: item.body || item.description || item._text || '',
  };
}

function normalizeReview(item) {
  if (typeof item === 'string') {
    const parts = item.split('|').map((s) => s.trim());
    return { author: parts[0], date: parts[1], stars: Number(parts[2]) || 5, text: parts.slice(3).join('|').trim() };
  }
  return {
    author: item.author || '',
    date: item.date || '',
    stars: Number(item.stars) || 5,
    text: item.text || item.body || item._text || '',
    color: item.color || '',
  };
}

function isDocumentPopulated(sections) {
  const keys = Object.keys(sections);
  if (keys.length === 0) return false;
  if (keys.length === 1 && keys[0] === 'twisted') return false;
  return keys.some((k) => k !== 'twisted');
}

module.exports = { parseDocument, sectionsToCms, isDocumentPopulated };
