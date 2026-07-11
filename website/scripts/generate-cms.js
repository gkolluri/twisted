#!/usr/bin/env node
/**
 * Generates CMS HTML fragments and scalar replacements from data/cms.json.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const cmsPath = path.join(root, 'data', 'cms.json');
const seedPath = path.join(root, 'data', 'cms.seed.json');
const menuPath = path.join(root, 'data', 'menu.json');
const menuSeedPath = path.join(root, 'data', 'menu.seed.json');

const AVATAR_COLORS = ['#5b8def', '#e85d26', '#34a853', '#9333ea', '#0ea5e9', '#f59e0b'];

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadCms() {
  const file = fs.existsSync(cmsPath) ? cmsPath : seedPath;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function starPartialPercent(rating) {
  const fraction = Math.max(0, Math.min(1, rating % 1));
  return Math.round(fraction * 100);
}

function renderStars(count, small = false) {
  const cls = small ? 'reviews-star reviews-star--sm' : 'reviews-star';
  const full = Math.floor(count);
  const partial = count - full;
  let html = '';
  for (let i = 0; i < full && i < 5; i++) {
    html += `<span class="${cls} reviews-star--full"></span>`;
  }
  if (full < 5 && partial > 0) {
    html += `<span class="${cls} reviews-star--partial" style="--fill: ${starPartialPercent(count)}%"></span>`;
    for (let i = full + 1; i < 5; i++) {
      html += `<span class="${cls} reviews-star--empty"></span>`;
    }
  } else {
    for (let i = full; i < 5; i++) {
      html += `<span class="${cls} reviews-star--empty"></span>`;
    }
  }
  return html;
}

function renderFeatures(features) {
  return features.map((f) => `        <div class="feature-card">
          <div class="feature-icon">${esc(f.icon)}</div>
          <h3>${esc(f.title)}</h3>
          <p>${esc(f.body)}</p>
        </div>`).join('\n');
}

function renderMenuHighlights(items) {
  return items.map((item) => `        <div class="menu-item">
          <div class="menu-item-info">
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.body)}</p>
          </div>
        </div>`).join('\n');
}

function renderReviewCards(items) {
  return items.map((review, i) => {
    const color = review.color || AVATAR_COLORS[i % AVATAR_COLORS.length];
    const initial = esc((review.author || '?').charAt(0).toUpperCase());
    const stars = Number(review.stars) || 5;
    return `          <article class="review-card">
            <div class="review-card-header">
              <div class="review-avatar" style="--avatar-color: ${esc(color)}">${initial}</div>
              <div>
                <p class="review-author">${esc(review.author)}</p>
                <p class="review-meta"><span class="review-google-g" aria-hidden="true">G</span> ${esc(review.date)}</p>
              </div>
            </div>
            <div class="review-stars" aria-hidden="true">
              ${renderStars(stars, true)}
            </div>
            <p class="review-text">${esc(review.text)}</p>
          </article>`;
  }).join('\n\n');
}

function renderReviewsSummary(reviews, googleReviewsUrl) {
  const rating = Number(reviews.rating) || 4.3;
  return `      <div class="reviews-summary">
        <div class="reviews-summary-brand">
          <div class="reviews-google-logo" aria-hidden="true">
            <span class="reviews-google-word">
              <span class="g-blue">G</span><span class="g-red">o</span><span class="g-yellow">o</span><span class="g-blue">g</span><span class="g-green">l</span><span class="g-red">e</span>
            </span>
            <span>Reviews</span>
          </div>
          <div class="reviews-rating-row">
            <span class="reviews-score">${rating.toFixed(1)}</span>
            <div class="reviews-stars" aria-label="${rating.toFixed(1)} out of 5 stars">
              ${renderStars(rating)}
            </div>
            <span class="reviews-count">(${esc(reviews.count)})</span>
          </div>
        </div>
        <a class="reviews-cta" href="${esc(googleReviewsUrl)}" target="_blank" rel="noopener noreferrer">Review us on Google</a>
      </div>`;
}

function loadMenu() {
  const file = fs.existsSync(menuPath) ? menuPath : menuSeedPath;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function renderMenuItem(item) {
  return `<div class="menu-item"><div class="menu-item-info"><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p></div></div>`;
}

function renderListGrid(columns) {
  let html = '        <div class="menu-list-grid">\n';
  for (const col of columns) {
    html += `          <div>\n            <h3>${esc(col.title)}</h3>\n            <ul>\n`;
    for (const li of col.items || []) html += `              <li>${esc(li)}</li>\n`;
    html += '            </ul>\n          </div>\n';
  }
  html += '        </div>\n';
  return html;
}

function renderMenuNotes(notes, classes = null) {
  return (notes || [])
    .filter((n) => (classes ? classes.includes(n.class) : !n.class))
    .map((n) => {
      const cls = n.class ? `menu-note ${n.class}` : 'menu-note';
      return `        <p class="${cls}">${esc(n.text)}</p>\n`;
    })
    .join('');
}

function renderMenuSection(section, hookahNote) {
  const idAttr = section.id === 'hookah' ? ' id="hookah"' : '';
  let html = `      <div class="menu-category"${idAttr}>\n        <h2>${esc(section.title)}</h2>\n`;

  html += renderMenuNotes(section.notes, ['menu-note--left']);

  if (section.items?.length) {
    html += '        <div class="menu-grid">\n';
    for (const item of section.items) html += `          ${renderMenuItem(item)}\n`;
    html += '        </div>\n';
  }

  html += renderMenuNotes(section.notes, ['', 'menu-note--heat']);

  if (section.columns?.length && section.type !== 'text') {
    html += renderListGrid(section.columns);
  }

  if (section.type === 'hookah') {
    html += `        <p class="menu-note menu-note--left">${esc(hookahNote)}</p>\n`;
    html += `        <figure class="menu-hookah-figure">
          <img src="/images/hookah-menu.png" alt="Twisted Bar and Grill hookah menu with premium flavors" width="1080" height="1350" loading="lazy">
        </figure>\n`;
  }

  if (section.type === 'text' && section.notes?.length) {
    // text-only sections render notes above (already handled)
  }

  html += '      </div>\n\n';
  return html;
}

function renderMenuBody(menu) {
  const { page, sections } = menu;
  let html = '';
  for (const section of sections) html += renderMenuSection(section, page.hookahNote);
  html += `      <p class="menu-disclaimer">${esc(page.disclaimer)}</p>\n\n`;
  html += `      <div style="margin-top: 2rem; text-align: center; padding-bottom: 2rem;">
        <a href="tel:{{CMS_PHONE_TEL}}" class="btn btn-primary">Call {{CMS_PHONE}}</a>
      </div>\n`;
  return html;
}

function buildLegacyLinkItems(links, site) {
  const items = [];
  if (links.foodMenuLabel) {
    items.push({ label: links.foodMenuLabel, url: links.foodMenuUrl || '/menu/food.pdf', style: 'primary', hint: 'PDF' });
  }
  if (links.drinksMenuLabel) {
    items.push({ label: links.drinksMenuLabel, url: links.drinksMenuUrl || '/menu/drinks.pdf', style: 'primary', hint: 'PDF' });
  }
  if (links.hookahMenuLabel) {
    items.push({ label: links.hookahMenuLabel, url: links.hookahMenuUrl || '/menu/hookah.pdf', style: 'primary', hint: 'PDF' });
  }
  if (links.eventsLabel) {
    items.push({ label: links.eventsLabel, url: links.eventsUrl || '/events', style: 'primary' });
  }
  if (site.instagram) items.push({ label: 'Instagram', url: site.instagram, icon: 'instagram' });
  if (site.facebook) items.push({ label: 'Facebook', url: site.facebook, icon: 'facebook' });
  if (site.googleReviews) items.push({ label: 'Google Reviews', url: site.googleReviews, icon: 'google' });
  return items;
}

const LINK_ICONS = {
  instagram: '<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  google: '<svg viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>',
};

function renderLinksStack(items) {
  return items.map((item) => {
    const isPrimary = item.style === 'primary';
    const classes = `links-btn${isPrimary ? ' links-btn--primary' : ''}`;
    const external = item.url.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
    const icon = item.icon && LINK_ICONS[item.icon]
      ? `<span class="links-btn-icon" aria-hidden="true">${LINK_ICONS[item.icon]}</span>`
      : '';
    const hint = item.hint
      ? `<span class="links-btn-hint">${esc(item.hint)}</span>`
      : '';
    return `        <a class="${classes}" href="${esc(item.url)}"${external}>
          ${icon}<span class="links-btn-label">${esc(item.label)}</span>${hint ? `\n          ${hint}` : ''}
        </a>`;
  }).join('\n');
}

function buildReplacements(cms, menu) {
  const { site, homepage, links, events_page: eventsPage = {} } = cms;
  const linkItems = (links.items && links.items.length)
    ? links.items
    : buildLegacyLinkItems(links, site);
  const hero = homepage.hero || {};
  const about = homepage.about || {};
  const gallery = homepage.gallery || {};
  const events = homepage.events_teaser || {};
  const reviews = homepage.reviews || {};
  const addressQuery = encodeURIComponent(`${site.addressLine1}, ${site.addressLine2}`);
  const reviewCountSchema = String(reviews.count || '').replace(/\+$/, '');

  return {
    CMS_PHONE: site.phone,
    CMS_PHONE_TEL: site.phoneTel,
    CMS_PHONE_SCHEMA: site.phoneTel.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '+1-$1-$2-$3'),
    CMS_EMAIL: site.email,
    CMS_ADDRESS_LINE1: site.addressLine1,
    CMS_ADDRESS_LINE2: site.addressLine2,
    CMS_ADDRESS_QUERY: addressQuery,
    CMS_INSTAGRAM: site.instagram,
    CMS_FACEBOOK: site.facebook,
    CMS_GOOGLE_REVIEWS: site.googleReviews,
    CMS_HOURS_WEEKDAY: site.hoursWeekday,
    CMS_HOURS_WEEKDAY_TIME: site.hoursWeekdayTime,
    CMS_HOURS_WEEKEND: site.hoursWeekend,
    CMS_HOURS_WEEKEND_TIME: site.hoursWeekendTime,
    CMS_HOURS_NOTE: site.hoursNote,
    CMS_HERO_LINE1: hero.line1,
    CMS_HERO_LINE2: hero.line2,
    CMS_HERO_TAGLINE: hero.tagline,
    CMS_HERO_TAGLINE2: hero.tagline2 || '',
    CMS_HERO_DESC: hero.description,
    CMS_HERO_CTA_PRIMARY: hero.ctaPrimary,
    CMS_HERO_CTA_SECONDARY: hero.ctaSecondary,
    CMS_ABOUT_LABEL: about.label,
    CMS_ABOUT_TITLE: about.title,
    CMS_ABOUT_SUBTITLE: about.subtitle,
    CMS_GALLERY_SPACE_LABEL: gallery.spaceLabel,
    CMS_GALLERY_SPACE_TITLE: gallery.spaceTitle,
    CMS_GALLERY_SPACE_BODY1: gallery.spaceBody1,
    CMS_GALLERY_SPACE_BODY2: gallery.spaceBody2,
    CMS_GALLERY_BAR_LABEL: gallery.barLabel,
    CMS_GALLERY_BAR_TITLE: gallery.barTitle,
    CMS_GALLERY_BAR_BODY1: gallery.barBody1,
    CMS_GALLERY_BAR_BODY2: gallery.barBody2,
    CMS_EVENTS_LABEL: events.label,
    CMS_EVENTS_TITLE: events.title,
    CMS_EVENTS_BODY: events.body,
    CMS_EVENTS_CTA: events.cta,
    CMS_REVIEWS_HEADING: reviews.heading,
    CMS_REVIEWS_RATING: String(reviews.rating),
    CMS_REVIEWS_COUNT: reviews.count,
    CMS_REVIEWS_COUNT_SCHEMA: reviewCountSchema,
    CMS_LINKS_TAGLINE: links.tagline,
    CMS_LINKS_STACK: renderLinksStack(linkItems),
    CMS_LINKS_FOOTER_WEBSITE_URL: links.footerWebsiteUrl || 'https://twisteddfw.com',
    CMS_LINKS_FOOTER_WEBSITE_DISPLAY: links.footerWebsiteDisplay || links.footerWebsiteLabel || 'twisteddfw.com',
    CMS_MENU_LABEL: menu.page.label,
    CMS_MENU_TITLE: menu.page.title,
    CMS_MENU_INTRO: menu.page.intro,
    CMS_MENU_NOTE: menu.page.note,
    CMS_MENU_BODY: renderMenuBody(menu),
    CMS_EVENTS_PAGE_LABEL: eventsPage.label,
    CMS_EVENTS_PAGE_TITLE: eventsPage.title,
    CMS_EVENTS_PAGE_BODY: eventsPage.body,
    CMS_EVENTS_FEATURED_LABEL: eventsPage.featuredLabel,
    CMS_EVENTS_FEATURED_TITLE: eventsPage.featuredTitle,
    CMS_EVENTS_SCHEDULE_LABEL: eventsPage.scheduleLabel,
    CMS_EVENTS_SCHEDULE_TITLE: eventsPage.scheduleTitle,
    CMS_EVENTS_SCHEDULE_NOTE: eventsPage.scheduleNote,
    CMS_EVENTS_PRIVATE_TITLE: eventsPage.privateTitle,
    CMS_EVENTS_PRIVATE_BODY: eventsPage.privateBody,
    CMS_FEATURES_GRID: renderFeatures(about.features || []),
    CMS_MENU_HIGHLIGHTS: renderMenuHighlights(homepage.menu_highlights || []),
    CMS_REVIEWS_SUMMARY: renderReviewsSummary(reviews, site.googleReviews),
    CMS_REVIEWS_CAROUSEL: renderReviewCards(reviews.items || []),
  };
}

function main() {
  const cms = loadCms();
  const menu = loadMenu();
  const replacements = buildReplacements(cms, menu);
  const outPath = path.join(root, 'data', 'cms-replacements.json');
  fs.writeFileSync(outPath, `${JSON.stringify(replacements, null, 2)}\n`);
  console.log('CMS: generated data/cms-replacements.json');
}

main();
