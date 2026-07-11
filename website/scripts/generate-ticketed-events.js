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
<body data-page="events">

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
        <li><a href="/our-space">Our Space</a></li>
        <li><a href="/events">Events</a></li>
        <li><a href="/contact">Contact Us</a></li>
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

{{SITE_FOOTER}}

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
