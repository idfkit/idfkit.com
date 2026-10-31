<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/idfkit/idfkit-brand/identity-2026.3/marks/mark-on-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/idfkit/idfkit-brand/identity-2026.3/marks/mark-on-light.svg">
    <img alt="idfkit" width="72" src="https://raw.githubusercontent.com/idfkit/idfkit-brand/identity-2026.3/marks/tile.png">
  </picture>
</p>

# idfkit.com

The idfkit website: the front door to the toolkit, the editor, the server and the documentation.

[idfkit](https://idfkit.com) · [Developers](https://developers.idfkit.com) · [EnergyPlus docs](https://docs.idfkit.com) · [Envelop](https://app.idfkit.com) · [MCP](https://mcp.idfkit.com) · [Shoebox](https://shoebox.idfkit.com) · [GitHub](https://github.com/idfkit)

[![Identity](https://github.com/idfkit/idfkit.com/actions/workflows/check-identity.yml/badge.svg)](https://github.com/idfkit/idfkit.com/actions/workflows/check-identity.yml) [![License](https://img.shields.io/github/license/idfkit/idfkit.com)](https://github.com/idfkit/idfkit.com#license)

## Stack

- Static HTML / CSS / vanilla JavaScript
- [Three.js](https://threejs.org/) for the hero 3D visualization
- Hosted on GitHub Pages

## Visual identity

The site renders the idfkit visual identity standard,
[idfkit-brand](https://github.com/idfkit/idfkit-brand), at the tag declared in
`brand/identity.json`. Everything under `brand/` except that declaration is a
derived file copied from the tag's build:

```
brand/identity.json        the declared tag (the only hand-written file under brand/)
brand/css/                 tokens, self-hosted fonts, motion and forced-colours rules
brand/hero/                the hero scene's palette, by role, per theme
brand/hosts/idfkit.com/    favicons, the social image, the manifest and head.html
brand/brand-page/          the brand page and its images
brand/index.html           a copy of brand/brand-page/index.html, so that /brand/ resolves
```

Rules that follow from the standard:

1. Edit nothing under `brand/`. A vendored file is served as the tag's build
   wrote it; `.github/workflows/check-identity.yml` compares every file against
   the tag and fails on a byte that differs.
2. `css/style.css`, `js/main.js` and `index.html` declare no colour, font family
   or easing literal. They read `--idfkit-*` properties from `brand/css/tokens.css`
   and, for the hero scene, the roles exported by `brand/hero/hero-palette.js`.
   The check scans these files for stray literals.
3. The mark is inlined in `currentColor` beside the wordmark. There is no
   stand-in glyph.
4. Both themes come from the derivation: the media query decides, and a
   `data-theme` attribute on `<html>` overrides it.
5. `index.html` pastes `brand/hosts/idfkit.com/head.html` into its head, since a
   static site has no include. Its paths carry the `/brand/hosts/idfkit.com/`
   prefix because the directory is served there rather than at the root.

Moving to a new tag is the `identity-adopt` skill in idfkit-brand: it replaces
the vendored directories, rewrites `brand/identity.json` and the workflow's ref,
and runs the check.

## The in-browser simulation demo

The "In the browser" section embeds
[shoebox.idfkit.com](https://shoebox.idfkit.com), which runs the simulation
engine as WebAssembly on the visitor's machine. That costs about 10 MB on a
cold visit, so the iframe is **never** created on page load: the poster is a
static SVG, and `js/main.js` only appends the iframe when the Run button is
pressed. Keep it that way.

The poster is drawn from one measured row of the shoebox's own results (Denver,
summer design day, 20% south WWR, free-running), so if those numbers change the
drawing has to change with them. It is one SVG `<defs>` block instantiated
twice with `<use>` -- side by side above 720 px, stacked below it, because the
wide layout letters at four pixels on a phone.

## Development

No build tools required. Edit the files and push to deploy.

```
index.html    page markup
css/style.css styles, reading the identity tokens
js/main.js    3D animation (an ES module) and UI interactions
brand/        the vendored identity derivation; see Visual identity above
```

## Analytics

The site uses privacy-first, cookieless, free
[GoatCounter](https://www.goatcounter.com) analytics. See
[docs/analytics.md](docs/analytics.md) for details.

## License

MIT
