# idfkit.com

Landing page for the [idfkit](https://github.com/idfkit) ecosystem — modern tools for EnergyPlus building energy simulation.

## Stack

- Static HTML / CSS / vanilla JavaScript
- [Three.js](https://threejs.org/) for the hero 3D visualization
- Hosted on GitHub Pages

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
index.html    — page markup
css/style.css — styles
js/main.js    — 3D animation & UI interactions
```

## Analytics

The site uses privacy-first, cookieless, free
[GoatCounter](https://www.goatcounter.com) analytics. See
[docs/analytics.md](docs/analytics.md) for details.

## License

MIT
