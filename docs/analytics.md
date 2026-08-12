# Analytics

idfkit.com uses [Plausible Analytics](https://plausible.io) — a lightweight,
privacy-first, cookieless web analytics service — to understand how the site is
used.

## Why Plausible

- **Privacy-first** — no cookies, no persistent identifiers, no cross-site
  tracking. Nothing that requires a cookie consent banner under GDPR/CCPA.
- **Lightweight** — the tracking script is < 1 KB and loads with `defer`, so it
  has negligible impact on page load.
- **Simple** — a single hosted dashboard with the metrics we actually care
  about, nothing more.

## What we can see

- Page views (per page, with daily / weekly / monthly breakdowns)
- Unique visitor counts
- Top pages
- Top referrers / traffic sources
- Basic geography, device, and browser breakdowns

No personal data about individual visitors is collected.

## How it's integrated

A single script tag lives in the `<head>` of `index.html`:

```html
<script defer data-domain="idfkit.com" src="https://plausible.io/js/script.js"></script>
```

The `data-domain` attribute tells Plausible which site the pageview belongs to.
Because Plausible only records events whose `data-domain` matches a site
configured in the dashboard, running the page locally or on a staging host does
**not** pollute production stats — those hits are simply ignored. There is no
build step and no environment variable to manage; the same static `index.html`
is served everywhere (GitHub Pages).

## Setup / access

1. A Plausible account owns the `idfkit.com` site
   (dashboard: <https://plausible.io/idfkit.com>).
2. The tracking snippet above is already present in `index.html`.
3. To verify tracking after a deploy:
   - Open <https://idfkit.com/> in a browser.
   - Confirm a request to `https://plausible.io/api/event` fires (Network tab).
   - The visit should appear in the Plausible dashboard within a few seconds
     under "Realtime".

## Notes

- If the dashboard should be public, enable a shared/public link in the
  Plausible site settings.
- To disable analytics, remove the script tag from `index.html`.
