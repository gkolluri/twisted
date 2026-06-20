#!/usr/bin/env node
/**
 * Generates SEO event detail pages from data/events.json
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const events = JSON.parse(fs.readFileSync(path.join(root, 'data/events.json'), 'utf8'));
const outDir = path.join(root, 'events');

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function imageBlock(event) {
  if (event.image) {
    return `<div class="event-showcase-image">
            <img src="/${event.image}" alt="${esc(event.imageAlt || event.title)}" width="1024" height="1024">
          </div>`;
  }
  return `<div class="event-showcase-image event-showcase-placeholder">
            <div class="event-showcase-placeholder-inner">
              <span class="event-showcase-placeholder-day">${esc(event.scheduleDay)}</span>
              <span class="event-showcase-placeholder-label">${esc(event.title)}</span>
            </div>
          </div>`;
}

function ogImage(event) {
  if (event.image) return `{{SITE_URL}}/${event.image}`;
  return '{{SITE_URL}}/images/og-image.jpg';
}

function detailsList(event) {
  const items = [
    `<li><strong>When</strong>${esc(event.when)}</li>`,
    `<li><strong>${esc(event.timeLabel)}</strong>${esc(event.time)}</li>`,
  ];
  if (event.extraDetail) {
    items.push(`<li><strong>${esc(event.extraDetail.label)}</strong>${esc(event.extraDetail.value)}</li>`);
  }
  return items.join('\n              ');
}

function highlightsBlock(event) {
  if (!event.highlights?.length) return '';
  const tags = event.highlights
    .map((h) => `<span class="event-highlight-tag">${esc(h)}</span>`)
    .join('\n              ');
  return `<div class="event-showcase-highlights">
              ${tags}
            </div>`;
}

function landingFeaturesTitle(event) {
  if (event.scheduleDay) return `Your ${event.scheduleDay} at Twisted`;
  return 'What Makes This Event Special';
}

function featuresFromEvent(event) {
  return event.landingFeatures || [];
}

function scheduleFromEvent(event) {
  if (event.scheduleSteps?.length) return event.scheduleSteps;

  const steps = [];
  if (event.extraDetail) {
    steps.push({
      time: event.extraDetail.value,
      label: event.extraDetail.label,
      detail: '',
    });
  }
  steps.push({
    time: event.time,
    label: event.timeLabel || 'Event',
    detail: event.presenter,
  });
  return steps;
}

function introSection(event) {
  if (!event.landingIntro || event.landingIntro === event.description) return '';

  return `<section class="event-landing-intro">
    <div class="container">
      <p class="event-landing-intro-text">${esc(event.landingIntro)}</p>
    </div>
  </section>`;
}

function featuresSection(event) {
  const features = featuresFromEvent(event);
  if (!features.length) return '';

  const cards = features
    .map((feature) => {
      const copy = feature.description
        ? `<p>${esc(feature.description)}</p>`
        : '';
      return `<div class="event-landing-feature">
            <h3>${esc(feature.title)}</h3>
            ${copy}
          </div>`;
    })
    .join('\n          ');

  return `<section class="event-landing-section event-landing-section--alt">
    <div class="container">
      <p class="section-label">What to Expect</p>
      <h2 class="section-title">${esc(landingFeaturesTitle(event))}</h2>
      <div class="event-landing-features">
          ${cards}
      </div>
    </div>
  </section>`;
}

function scheduleSection(event) {
  const steps = scheduleFromEvent(event);
  if (!steps.length) return '';

  const items = steps
    .map(
      (step) => `<div class="event-landing-step">
            <div class="event-landing-step-time">${esc(step.time)}</div>
            <div class="event-landing-step-body">
              <strong>${esc(step.label)}</strong>
              ${step.detail ? `<p>${esc(step.detail)}</p>` : ''}
            </div>
          </div>`
    )
    .join('\n          ');

  return `<section class="event-landing-section">
    <div class="container">
      <p class="section-label">Schedule</p>
      <h2 class="section-title">Plan Your ${esc(event.scheduleDay || 'Visit')}</h2>
      <div class="event-landing-schedule">
          ${items}
      </div>
    </div>
  </section>`;
}

function relatedEventsSection(event) {
  const related = events.filter(
    (item) => item.slug !== event.slug && !item.hideFromWeeklySchedule
  );
  if (!related.length) return '';

  const items = related
    .map(
      (item) =>
        `<li><a href="/events/${item.slug}"><span class="event-day">${esc(item.scheduleDay.slice(0, 3))}</span> ${esc(item.pageTitle)}</a></li>`
    )
    .join('\n            ');

  return `<section class="event-landing-related">
    <div class="container event-related">
      <p class="section-label">More Weekly Events</p>
      <h2 class="section-title">Something Else This Week</h2>
      <ul class="event-related-list">
            ${items}
      </ul>
    </div>
  </section>`;
}

function ctaSection(event) {
  return `<section class="event-landing-cta">
    <div class="container event-landing-cta-inner">
      <div>
        <h2 class="section-title">Ready for ${esc(event.title)}?</h2>
        <p class="event-landing-cta-desc">${esc(event.weeklyBlurb || event.description)}</p>
      </div>
      <div class="event-landing-cta-actions">
        <a href="tel:+12144077587" class="btn btn-primary">Call to Reserve</a>
        <a href="/events" class="btn btn-outline">All Weekly Events</a>
      </div>
    </div>
  </section>`;
}

function renderTeaserMain(event) {
  const tagline = event.heroTagline
    ? `<p class="event-teaser-tagline">${esc(event.heroTagline)}</p>`
    : `<p class="event-teaser-subtitle">${esc(event.presenter)}</p>`;
  const posterClass = event.image ? ' event-teaser-showcase--poster' : '';

  return `<section class="events-hero event-landing-header">
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

  <section class="event-teaser-wrap">
    <div class="container">
      <article class="event-showcase event-teaser-showcase${posterClass}">
        ${imageBlock(event)}
        <div class="event-showcase-body">
          <span class="event-showcase-badge">${esc(event.badge)}</span>
          <h1>${esc(event.title)}</h1>
          ${tagline}
          <ul class="event-showcase-details">
              ${detailsList(event)}
            </ul>
          ${highlightsBlock(event)}
          <p class="event-detail-desc">${esc(event.description)}</p>
          <div class="event-detail-actions event-detail-actions--compact">
            <a href="tel:+12144077587" class="btn btn-primary">Call to Reserve</a>
            <a href="/events" class="btn btn-outline">All Weekly Events</a>
          </div>
        </div>
      </article>
    </div>
  </section>
  ${introSection(event)}
  ${featuresSection(event)}
  ${scheduleSection(event)}
  ${relatedEventsSection(event)}
  ${ctaSection(event)}`;
}

function renderListingCard(event) {
  const tagline = event.heroTagline
    ? `<p class="event-teaser-tagline">${esc(event.heroTagline)}</p>`
    : `<p class="event-teaser-subtitle">${esc(event.presenter)}</p>`;

  return `<article class="event-showcase event-teaser-showcase">
          ${imageBlock(event)}
          <div class="event-showcase-body">
            <span class="event-showcase-badge">${esc(event.badge)}</span>
            <h2><a href="/events/${event.slug}" class="event-title-link">${esc(event.title)}</a></h2>
            ${tagline}
            <p class="event-teaser-summary">${esc(event.when)} · ${esc(event.time)}</p>
            <div class="event-showcase-actions event-detail-actions">
              <a href="/events/${event.slug}" class="btn btn-primary">Event Details</a>
              <a href="tel:+12144077587" class="btn btn-outline">Call Us</a>
            </div>
          </div>
        </article>`;
}

function renderWeeklyCard(event) {
  const blurb = event.weeklyBlurb || event.presenter;

  return `<div class="event-card">
          <div class="event-card-day">
            <div class="day-name">${esc(event.scheduleDay)}</div>
          </div>
          <div class="event-card-body">
            <h3><a href="/events/${event.slug}" class="event-card-title-link">${esc(event.title)}</a></h3>
            <p>${esc(blurb)}</p>
          </div>
          <div class="event-card-meta">
            <div class="time">${esc(event.time)}</div>
            <span class="tag">${esc(event.tag)}</span>
          </div>
        </div>`;
}

function renderWeeklySchedule() {
  return events
    .filter((event) => !event.hideFromWeeklySchedule)
    .map(renderWeeklyCard)
    .join('\n\n        ');
}

function renderFeaturedGrid() {
  const featured = events.filter((event) => event.featuredOnListing);
  return featured.map(renderListingCard).join('\n\n        ');
}

function renderPage(event) {
  const url = `{{SITE_URL}}/events/${event.slug}`;
  const mainContent = renderTeaserMain(event);

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
<body class="event-teaser-page">

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

  ${mainContent}

  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <p>&copy; 2026 Twisted Bar & Grill · The Colony, TX · <a href="https://twisteddfw.com">twisteddfw.com</a></p>
      <div class="footer-social">
        <div class="social-links">
          <a href="https://www.instagram.com/twistedbarandgrill.dfw/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
          <a href="https://www.facebook.com/twistedbandg/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
        </div>
        <ul class="footer-links">
          <li><a href="/">Home</a></li>
          <li><a href="/menu">Menu</a></li>
          <li><a href="tel:+12144077587">Call Us</a></li>
          <li><a href="mailto:info@twisteddfw.com">Email Us</a></li>
        </ul>
      </div>
    </div>
  </footer>

  <script src="/js/main.js"></script>
</body>
</html>
`;
}

if (fs.existsSync(outDir)) {
  for (const file of fs.readdirSync(outDir)) {
    if (file.endsWith('.html')) fs.unlinkSync(path.join(outDir, file));
  }
} else {
  fs.mkdirSync(outDir, { recursive: true });
}

for (const event of events) {
  fs.writeFileSync(path.join(outDir, `${event.slug}.html`), renderPage(event));
}

fs.writeFileSync(
  path.join(root, 'events-featured-grid.html'),
  renderFeaturedGrid()
);

fs.writeFileSync(
  path.join(root, 'events-weekly-schedule.html'),
  renderWeeklySchedule()
);

console.log(`Generated ${events.length} event detail pages in events/`);
