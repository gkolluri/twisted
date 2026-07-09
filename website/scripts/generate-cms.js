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

function buildReplacements(cms, menu) {
  const { site, homepage, links, events_page: eventsPage = {} } = cms;
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
    CMS_LINKS_FOOD_LABEL: links.foodMenuLabel,
    CMS_LINKS_HOOKAH_LABEL: links.hookahMenuLabel,
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
