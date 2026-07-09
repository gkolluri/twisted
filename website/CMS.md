# Twisted Website CMS (Google Docs)

The Twisted website uses a **Google Doc as a simple CMS**. Edit the doc, redeploy, and the site updates.

**CMS Document:** [Twisted Google Doc](https://docs.google.com/document/d/1Xv98qwrWbPNbITAR8pOItIAXsMW-Ugo1IztD6qUeS48/edit)

---

## First-time setup

1. Open the Google Doc above.
2. **Share → General access → Anyone with the link → Viewer** (required for builds to read it).
3. Replace the doc contents with `cms/DOCUMENT.txt` (run `npm run cms:export` to regenerate).
4. Edit text using the format below.
5. Redeploy on Vercel (or run `npm run build` locally).

---

## What the CMS controls (all sections)

| Section | What updates |
|---------|----------------|
| `site` | Phone, email, address, hours, social links, Google reviews URL — **all pages** |
| `homepage.hero` | Hero headline, tagline, description |
| `homepage.about` | About copy + feature cards |
| `homepage.gallery` | Gallery / bar copy |
| `homepage.events` | Events teaser on homepage |
| `homepage.menu_highlights` | Menu highlight cards on homepage |
| `homepage.reviews` | Google rating, count, review carousel |
| `events.page` | Events page hero, schedule labels, private events CTA |
| `event:slug` | Weekly event title, time, description, highlights (e.g. `event:karaoke-night`) |
| `menu` | Menu page header, intro, disclaimer |
| `menu.section:id` | Full menu categories (appetizers, wings, cocktails, etc.) |
| `links` | `/links` page — full button list (label, URL, order, icons) |

**Not in CMS:** Images, PDFs (`/menu/*.pdf`), page layout/CSS.

---

## How it works

```
Google Doc → fetch-cms.js → cms.json + menu.json + events.json
                                    ↓
                            generate-cms.js → HTML fragments
                                    ↓
                            prepare.js → public/
```

If the doc is empty or unreachable, the build falls back to `data/*.seed.json`.

---

## Document format

### Links page (`/links`)

```
=== links ===
tagline: Sports Bar & Grill · The Colony, TX
footer_website_url: https://twisteddfw.com
footer_website_display: twisteddfw.com
links:
- label: Food Menu | url: /menu/food.pdf | style: primary | hint: PDF
- label: Drinks Menu | url: /menu/drinks.pdf | style: primary | hint: PDF
- label: Hookah Menu | url: /menu/hookah.pdf | style: primary | hint: PDF
- label: Events | url: /events | style: primary
- label: Instagram | url: https://instagram.com/... | icon: instagram
- label: Our Menu | url: /menu | style: primary
```

**Fields per link:** `label`, `url`, optional `style: primary`, `hint: PDF`, `icon: instagram|facebook|google`

Add, remove, or reorder lines to change the NFC/QR links page.

### General format

```
=== site ===
phone: (214) 407-7587

=== homepage.hero ===
line1: Eat. Drink.

=== menu.section:appetizers ===
title: Appetizers
items:
- title: Twisted Potato | body: Ribbon crispy potato...

=== event:karaoke-night ===
title: Karaoke Night
time: 9:00 PM – 2:00 AM
highlights: Music & karaoke | Food & drinks | Hookah
```

### Lists

```
features:
- icon: 🍸 | title: Handcrafted Cocktails | body: Signature cocktails...
```

### Menu columns (wings, wines, bottle service)

```
columns:
- title: Dry Rub | items: Cajun | Blackened | Lemon Pepper
- title: Wet Sauce | items: Nashville | 65 Sauce | BBQ
```

---

## Commands

```bash
cd website

npm run cms:export   # Regenerate cms/DOCUMENT.txt from seeds
npm run cms:fetch    # Pull Google Doc → cms.json, menu.json, events.json
npm run build        # Full site build
npm run dev          # Local preview at http://localhost:8765
```

---

## Updating the live site

1. Edit the Google Doc
2. Push to git or trigger a Vercel redeploy
3. Build fetches the latest doc automatically

---

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `GOOGLE_DOC_ID` | `1Xv98qwrWbPNbITAR8pOItIAXsMW-Ugo1IztD6qUeS48` | Google Doc to fetch |
| `SITE_URL` | `https://twisted-liart.vercel.app` | Canonical site URL |
| `GA_MEASUREMENT_ID` | `G-WXJQXBRBKB` | Google Analytics |
