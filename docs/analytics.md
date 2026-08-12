# Analytics

idfkit.com uses [GoatCounter](https://www.goatcounter.com) — a lightweight,
privacy-first, cookieless, and **free** web analytics service — to understand
how the site is used.

## Why GoatCounter

- **Free** — free for non-commercial / open-source use on the hosted service
  (`*.goatcounter.com`), and open source if you ever want to self-host.
- **Privacy-first** — no cookies, no persistent identifiers, no cross-site
  tracking. Nothing that requires a cookie consent banner under GDPR/CCPA.
- **Lightweight** — the tracking script is small and loads with `async`, so it
  has negligible impact on page load.
- **Simple** — a single hosted dashboard with the metrics we actually care
  about, nothing more.

## What we can see

- Page views (per page, with daily / weekly / monthly breakdowns)
- Unique visitor counts (via a privacy-preserving daily hash, no cookies)
- Top pages
- Top referrers / traffic sources
- Basic geography, device, and browser breakdowns

No personal data about individual visitors is collected.

## How it's integrated

A single script tag lives in the `<head>` of `index.html`:

```html
<script data-goatcounter="https://idfkit.goatcounter.com/count"
        async src="//gc.zgo.at/count.js"></script>
```

The `data-goatcounter` attribute points at the site's GoatCounter endpoint
(`idfkit.goatcounter.com`). There is no build step and no environment variable
to manage; the same static `index.html` is served everywhere (GitHub Pages).

### Keeping local/staging hits out of production stats

Unlike Plausible, GoatCounter counts every hit that reaches the endpoint,
including from `localhost`. If local development ends up polluting the stats,
gate the script on hostname, e.g.:

```html
<script>
  if (location.hostname === 'idfkit.com') {
    var s = document.createElement('script');
    s.async = true;
    s.src = '//gc.zgo.at/count.js';
    s.setAttribute('data-goatcounter', 'https://idfkit.goatcounter.com/count');
    document.head.appendChild(s);
  }
</script>
```

In practice the plain tag is fine for a simple landing page — GoatCounter also
ignores hits from `localhost` by default.

## Setup / access

1. Create a free account at <https://www.goatcounter.com> and register the site
   code `idfkit` (this yields the dashboard at
   <https://idfkit.goatcounter.com>). If a different code is chosen, update the
   `data-goatcounter` URL in `index.html` to match.
2. The tracking snippet above is already present in `index.html`.
3. To verify tracking after a deploy:
   - Open <https://idfkit.com/> in a browser.
   - Confirm a request to `https://idfkit.goatcounter.com/count` fires
     (Network tab).
   - The visit should appear in the GoatCounter dashboard within a few seconds.

## Notes

- The dashboard can be made public in GoatCounter's site settings
  (Settings → "Data sharing / public").
- To disable analytics, remove the script tag from `index.html`.
