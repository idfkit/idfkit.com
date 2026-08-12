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

The tracking script lives in the `<head>` of `index.html`. It points at the
site's GoatCounter endpoint (`idfkit.goatcounter.com`). There is no build step
and no environment variable to manage; the same static `index.html` is served
everywhere (GitHub Pages).

### Keeping local/staging hits out of production stats

GoatCounter counts every hit that reaches the endpoint, so the script is loaded
only when the page is served from the production host. Visits from `localhost`,
a staging preview, or anywhere other than `idfkit.com` never load the tracker
and are therefore never counted:

```html
<script>
  // Only count hits on the production host so local/staging visits don't pollute stats.
  if (location.hostname === 'idfkit.com') {
    var gc = document.createElement('script');
    gc.async = true;
    gc.src = '//gc.zgo.at/count.js';
    gc.setAttribute('data-goatcounter', 'https://idfkit.goatcounter.com/count');
    document.head.appendChild(gc);
  }
</script>
```
