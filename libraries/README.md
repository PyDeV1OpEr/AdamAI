# Vendored libraries

These files are committed so the site runs with **no install step and no CDN
dependency**. They are third-party code and are not covered by this
repository's MIT licence.

| File | Version | Purpose | Licence |
|---|---|---|---|
| `p5.js` | 0.5.8 (2017-03-25) | canvas renderer, maths, `createVector`, `dist`, `random` | LGPL-2.1 |
| `p5.dom.js` | 0.3.2 (2017-03-25) | `createDiv` / `createButton` / `createSpan` used by the control panel | LGPL-2.1 |
| `p5.sound.js` | 0.3.x | not loaded by `index.html`; kept for fidelity to the upstream tree | LGPL-2.1 |

p5.js is © the p5.js contributors and is distributed under the GNU Lesser
General Public License, version 2.1. The full text is available at:

- https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
- https://github.com/processing/p5.js/blob/main/license.txt

The minified bundles inline portions of third-party projects under their own
permissive licences (for example `es6-promise`, MIT, © Yehuda Katz, Tom Dale,
Stefan Penner and contributors). Those notices are retained inside the bundles.

## Upgrading

p5.js 0.5.8 is from 2017 and is kept deliberately: the simulation was written
against its global-mode API. A newer p5 release would need the sketch retested,
particularly `p5.Element.parent()` and `createCanvas` parent handling.
