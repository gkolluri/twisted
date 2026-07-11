#!/usr/bin/env node
/**
 * Regenerates cms/DOCUMENT.txt from seed files for pasting into Google Docs.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const cms = JSON.parse(fs.readFileSync(path.join(root, 'data', 'cms.seed.json'), 'utf8'));
const menu = JSON.parse(fs.readFileSync(path.join(root, 'data', 'menu.seed.json'), 'utf8'));
const events = JSON.parse(fs.readFileSync(path.join(root, 'data', 'events.seed.json'), 'utf8'));

const lines = [
  'Twisted Bar & Grill — Website CMS',
  'Edit this document to update the website. Redeploy (or run npm run build) to publish changes.',
  '',
  '=== site ===',
  `name: ${cms.site.name}`,
  `phone: ${cms.site.phone}`,
  `phone_tel: ${cms.site.phoneTel}`,
  `email: ${cms.site.email}`,
  `address_line1: ${cms.site.addressLine1}`,
  `address_line2: ${cms.site.addressLine2}`,
  `instagram: ${cms.site.instagram}`,
  `facebook: ${cms.site.facebook}`,
  `google_reviews: ${cms.site.googleReviews}`,
  `hours_weekday: ${cms.site.hoursWeekday}`,
  `hours_weekday_time: ${cms.site.hoursWeekdayTime}`,
  `hours_weekend: ${cms.site.hoursWeekend}`,
  `hours_weekend_time: ${cms.site.hoursWeekendTime}`,
  `hours_note: ${cms.site.hoursNote}`,
  '',
  '=== homepage.hero ===',
  `line1: ${cms.homepage.hero.line1}`,
  `line2: ${cms.homepage.hero.line2}`,
  `tagline: ${cms.homepage.hero.tagline}`,
  `tagline_2: ${cms.homepage.hero.tagline2 || ''}`,
  `description: ${cms.homepage.hero.description}`,
  `cta_primary: ${cms.homepage.hero.ctaPrimary}`,
  `cta_secondary: ${cms.homepage.hero.ctaSecondary}`,
  '',
  '=== homepage.about ===',
  `label: ${cms.homepage.about.label}`,
  `title: ${cms.homepage.about.title}`,
  `subtitle: ${cms.homepage.about.subtitle}`,
  'features:',
];

for (const f of cms.homepage.about.features) {
  lines.push(`- icon: ${f.icon} | title: ${f.title} | body: ${f.body}`);
}

lines.push(
  '',
  '=== homepage.gallery ===',
  `space_label: ${cms.homepage.gallery.spaceLabel}`,
  `space_title: ${cms.homepage.gallery.spaceTitle}`,
  `space_body1: ${cms.homepage.gallery.spaceBody1}`,
  `space_body2: ${cms.homepage.gallery.spaceBody2}`,
  `bar_label: ${cms.homepage.gallery.barLabel}`,
  `bar_title: ${cms.homepage.gallery.barTitle}`,
  `bar_body1: ${cms.homepage.gallery.barBody1}`,
  `bar_body2: ${cms.homepage.gallery.barBody2}`,
  '',
  '=== homepage.events ===',
  `label: ${cms.homepage.events_teaser.label}`,
  `title: ${cms.homepage.events_teaser.title}`,
  `body: ${cms.homepage.events_teaser.body}`,
  `cta: ${cms.homepage.events_teaser.cta}`,
  '',
  '=== homepage.menu_highlights ===',
  'items:'
);
for (const item of cms.homepage.menu_highlights) {
  lines.push(`- title: ${item.title} | body: ${item.body}`);
}

lines.push(
  '',
  '=== homepage.reviews ===',
  `heading: ${cms.homepage.reviews.heading}`,
  `rating: ${cms.homepage.reviews.rating}`,
  `count: ${cms.homepage.reviews.count}`,
  'reviews:'
);
for (const r of cms.homepage.reviews.items) {
  lines.push(`- author: ${r.author} | date: ${r.date} | stars: ${r.stars} | text: ${r.text}`);
}

lines.push(
  '',
  '=== events.page ===',
  `label: ${cms.events_page.label}`,
  `title: ${cms.events_page.title}`,
  `body: ${cms.events_page.body}`,
  `featured_label: ${cms.events_page.featuredLabel}`,
  `featured_title: ${cms.events_page.featuredTitle}`,
  `schedule_label: ${cms.events_page.scheduleLabel}`,
  `schedule_title: ${cms.events_page.scheduleTitle}`,
  `schedule_note: ${cms.events_page.scheduleNote}`,
  `private_title: ${cms.events_page.privateTitle}`,
  `private_body: ${cms.events_page.privateBody}`,
  '',
  '=== menu ===',
  `label: ${menu.page.label}`,
  `title: ${menu.page.title}`,
  `intro: ${menu.page.intro}`,
  `note: ${menu.page.note}`,
  `disclaimer: ${menu.page.disclaimer}`,
  `hookah_note: ${menu.page.hookahNote}`,
);

for (const section of menu.sections) {
  lines.push('', `=== menu.section:${section.id} ===`, `title: ${section.title}`);
  if (section.notes?.length) {
    for (const note of section.notes) {
      if (note.class === 'menu-note--left') lines.push(`note_left: ${note.text}`);
      else if (note.class === 'menu-note--heat') lines.push(`note_heat: ${note.text}`);
      else lines.push(`text: ${note.text}`);
    }
  }
  if (section.items?.length) {
    lines.push('items:');
    for (const item of section.items) {
      lines.push(`- title: ${item.title} | body: ${item.body}`);
    }
  }
  if (section.columns?.length) {
    lines.push('columns:');
    for (const col of section.columns) {
      lines.push(`- title: ${col.title} | items: ${col.items.join(' | ')}`);
    }
  }
}

lines.push(
  '',
  '=== links ===',
  `tagline: ${cms.links.tagline}`,
  `footer_website_url: ${cms.links.footerWebsiteUrl || 'https://twisteddfw.com'}`,
  `footer_website_display: ${cms.links.footerWebsiteDisplay || cms.links.footerWebsiteLabel || 'twisteddfw.com'}`,
  'links:',
);
for (const link of cms.links.items || []) {
  const parts = [
    `label: ${link.label}`,
    `url: ${link.url}`,
    link.style ? `style: ${link.style}` : null,
    link.hint ? `hint: ${link.hint}` : null,
    link.icon ? `icon: ${link.icon}` : null,
  ].filter(Boolean);
  lines.push(`- ${parts.join(' | ')}`);
}

lines.push('', '# Weekly events — edit fields per event slug');

for (const event of events) {
  lines.push(
    '',
    `=== event:${event.slug} ===`,
    `title: ${event.title}`,
    `schedule_day: ${event.scheduleDay}`,
    `time: ${event.time}`,
    `description: ${event.description}`,
    `weekly_blurb: ${event.weeklyBlurb}`,
    `highlights: ${(event.highlights || []).join(' | ')}`,
    `featured: ${event.featuredOnListing ? 'yes' : 'no'}`,
  );
}

const out = `${lines.join('\n')}\n`;
fs.writeFileSync(path.join(root, 'cms', 'DOCUMENT.txt'), out);
console.log(`Exported cms/DOCUMENT.txt (${lines.length} lines)`);
