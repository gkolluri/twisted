#!/usr/bin/env node
/**
 * Generates SEO detail pages and events listing snippet from data/ticketed-events.json
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ticketedEvents = JSON.parse(
  fs.readFileSync(path.join(root, 'data/ticketed-events.json'), 'utf8')
);
const weeklyEvents = JSON.parse(
  fs.readFileSync(path.join(root, 'data/events.json'), 'utf8')
);
const outDir = path.join(root, 'events');

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ogImage(event) {
  if (event.image) return `{{SITE_URL}}/${event.image}`;
  return '{{SITE_URL}}/images/hero-patio.png';
}

function imageBlock(event) {
  if (event.image) {
    return `<div class="event-showcase-image">
            <img src="/${event.image}" alt="${esc(event.imageAlt || event.title)}" width="1024" height="1024">
          </div>`;
  }
  return `<div class="event-showcase-image event-showcase-placeholder">
            <div class="event-showcase-placeholder-inner">
              <span class="event-showcase-placeholder-label">${esc(event.title)}</span>
              <span class="event-showcase-placeholder-day">Live Show</span>
            </div>
          </div>`;
}

function detailsList(event) {
  const items = [
    `<li><strong>When</strong>${esc(event.when)}</li>`,
    `<li><strong>${esc(event.timeLabel || 'Time')}</strong>${esc(event.time)}</li>`,
  ];
  if (event.extraDetail) {
    items.push(
      `<li><strong>${esc(event.extraDetail.label)}</strong>${esc(event.extraDetail.value)}</li>`
    );
  }
  return items.join('\n              ');
}

function detailActions() {
  return `<div class="event-detail-actions">
            <a href="tel:+12144077587" class="btn btn-primary">Call to Reserve a Table</a>
            <a href="/events" class="btn btn-outline">All Events</a>
          </div>`;
}

function eventDatesSchema(event) {
  const lines = [];
  if (event.startDate) lines.push(`    "startDate": "${esc(event.startDate)}",`);
  if (event.endDate) lines.push(`    "endDate": "${esc(event.endDate)}",`);
  return lines.join('\n');
}

function relatedWeekly() {
  return weeklyEvents
    .slice(0, 6)
    .map(
      (e) =>
        `<li><a href="/events/${e.slug}"><span class="event-day">${esc(e.scheduleDay.slice(0, 3))}</span> ${esc(e.pageTitle)}</a></li>`
    )
    .join('\n            ');
}

function renderPage(event) {
  const url = `{{SITE_URL}}/events/${event.slug}`;
  const highlights = event.highlights
    .map((h) => `<span class="event-highlight-tag">${esc(h)}</span>`)
    .join('\n              ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(event.pageTitle)} | Twisted Bar & Grill | The Colony, TX</title>
  <meta name="description" content="${esc(event.metaDescription)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#111114">
  <link rel="canonical" href="${url}">
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">
  <link rel="icon" href="/images/logo-mark.png" type="image/png">
  <link rel="apple-touch-icon" href="/images/logo-mark.png">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Twisted Bar & Grill">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(event.pageTitle)} | Twisted Bar & Grill">
  <meta property="og:description" content="${esc(event.metaDescription)}">
  <meta property="og:image" content="${ogImage(event)}">
  <meta property="og:locale" content="en_US">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(event.pageTitle)} | Twisted Bar & Grill">
  <meta name="twitter:description" content="${esc(event.metaDescription)}">
  <meta name="twitter:image" content="${ogImage(event)}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/styles.css">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "${esc(event.title)}",
    "description": "${esc(event.description)}",
    "url": "${url}",
${eventDatesSchema(event)}
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    "location": {
      "@type": "BarOrPub",
      "name": "Twisted Bar & Grill",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "6520 Cascades Court #200",
        "addressLocality": "The Colony",
        "addressRegion": "TX",
        "postalCode": "75056",
        "addressCountry": "US"
      }
    },
    "organizer": { "@id": "{{SITE_URL}}/#restaurant" },
    "isAccessibleForFree": true
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "{{SITE_URL}}/" },
      { "@type": "ListItem", "position": 2, "name": "Events", "item": "{{SITE_URL}}/events" },
      { "@type": "ListItem", "position": 3, "name": "${esc(event.pageTitle)}", "item": "${url}" }
    ]
  }
  </script>
</head>
<body>

  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="logo" aria-label="Twisted Bar & Grill">
        <img src="/images/logo-header.png" alt="Twisted Bar & Grill" class="logo-img">
      </a>
      <nav aria-label="Main navigation">
      <button class="nav-toggle" aria-label="Toggle navigation">
        <span></span><span></span><span></span>
      </button>
      <ul class="nav-links">
        <li><a href="/">Home</a></li>
        <li><a href="/menu">Menu</a></li>
        <li><a href="/events" class="active">Events</a></li>
        <li><a href="/#visit">Visit</a></li>
      </ul>
      </nav>
    </div>
  </header>

  <main id="main-content">

  <section class="events-hero">
    <div class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span aria-hidden="true">/</span>
        <a href="/events">Events</a>
        <span aria-hidden="true">/</span>
        <span>${esc(event.pageTitle)}</span>
      </nav>
    </div>
  </section>

  <section style="padding-top: 0;">
    <div class="container">
      <article class="event-showcase event-detail-showcase">
        ${imageBlock(event)}
        <div class="event-showcase-body">
          <span class="event-showcase-badge">${esc(event.badge)}</span>
          <h1>${esc(event.title)}</h1>
          <p class="event-showcase-presenter">${esc(event.presenter)}</p>
          <ul class="event-showcase-details">
              ${detailsList(event)}
          </ul>
          <div class="event-showcase-highlights">
              ${highlights}
          </div>
          <p class="event-detail-desc">${esc(event.description)}</p>
          ${detailActions()}
        </div>
      </article>

      <div class="event-related">
        <p class="section-label">Weekly Schedule</p>
        <h2 class="section-title">Other Events This Week</h2>
        <ul class="event-related-list">
            ${relatedWeekly()}
        </ul>
      </div>
    </div>
  </section>

  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <p>&copy; 2026 Twisted Bar & Grill · The Colony, TX · <a href="https://twisteddfw.com">twisteddfw.com</a></p>
      <div class="footer-social">
        <div class="social-links">
          <a href="{{CMS_INSTAGRAM}}" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
          <a href="{{CMS_FACEBOOK}}" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
        </div>
        <ul class="footer-links">
          <li><a href="/">Home</a></li>
          <li><a href="/menu">Menu</a></li>
          <li><a href="tel:{{CMS_PHONE_TEL}}">Call Us</a></li>
          <li><a href="mailto:{{CMS_EMAIL}}">Email Us</a></li>
        </ul>
      </div>
    </div>
  </footer>

  <script src="/js/main.js"></script>
</body>
</html>
`;
}

function renderListingCard(event) {
  return `<article class="event-showcase">
          ${imageBlock(event).replace(/^\s+/gm, '')}
          <div class="event-showcase-body">
            <span class="event-showcase-badge">${esc(event.badge)}</span>
            <h2><a href="/events/${esc(event.slug)}" class="event-title-link">${esc(event.title)}</a></h2>
            <p class="event-showcase-presenter">${esc(event.presenter)}</p>
            <ul class="event-showcase-details">
              <li><strong>When</strong>${esc(event.when)}</li>
              <li><strong>${esc(event.timeLabel || 'Time')}</strong>${esc(event.time)}</li>
            </ul>
            <p class="event-listing-teaser">${esc(event.description)}</p>
            <a href="/events/${esc(event.slug)}" class="btn btn-primary">View Event Details</a>
          </div>
        </article>`;
}

function renderListingSection() {
  if (ticketedEvents.length === 0) return '';

  const cards = ticketedEvents.map(renderListingCard).join('\n\n        ');
  return `<div class="featured-events-grid ticketed-events-grid">
        ${cards}
      </div>`;
}

function updateSitemap() {
  const sitemapPath = path.join(root, 'sitemap.xml');
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const start = '  <!-- ticketed-events:start -->';
  const end = '  <!-- ticketed-events:end -->';
  const entries = ticketedEvents
    .map(
      (e) => `  <url>
    <loc>{{SITE_URL}}/events/${e.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>`
    )
    .join('\n');

  const block = `${start}\n${entries}\n  ${end}`;
  const pattern = /  <!-- ticketed-events:start -->[\s\S]*?<!-- ticketed-events:end -->/;

  if (pattern.test(sitemap)) {
    sitemap = sitemap.replace(pattern, block.trimEnd());
  } else {
    sitemap = sitemap.replace('</urlset>', `${block}\n</urlset>`);
  }

  fs.writeFileSync(sitemapPath, sitemap);
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

for (const event of ticketedEvents) {
  fs.writeFileSync(path.join(outDir, `${event.slug}.html`), renderPage(event));
}

fs.writeFileSync(path.join(root, 'events-ticketed-section.html'), renderListingSection());
updateSitemap();

console.log(`Generated ${ticketedEvents.length} ticketed event pages in events/`);
