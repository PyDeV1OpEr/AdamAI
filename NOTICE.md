# NOTICE — attribution, provenance and licensing

Adam AI is a derivative rebuild, published as a genuine GitHub fork of an
earlier project. This file records exactly what came from where, so that no
reader has to guess and no contributor's work is presented as someone else's.

## Upstream project

| | |
|---|---|
| Repository | https://github.com/gazijarin/AdamAI |
| Authors | Gazi Jarin ([@gazijarin](https://github.com/gazijarin)), Raiyan Rahman ([@RaiyanRahman](https://github.com/RaiyanRahman)) |
| Published | 31 December 2018 |
| Licence | **None published.** `license: null` on the repository; no `LICENSE` file in the tree |
| Upstream demo | https://gazijarin.github.io/AdamAI/ |

The upstream README describes the project as "jointly created with a very nice
human, @RaiyanRahman" and credits [Code Bullet](https://github.com/Code-Bullet)
as the basis for the genetic-algorithm structure.

## What is inherited

The simulation is the original work of the upstream authors. These files are
their code, with the specific modifications listed in the next section:

```
js/simulation/Brain.js          genome storage, random genes, mutation, cloning
js/simulation/Node.js           checkpoint graph, distance-to-finish
js/simulation/Player.js         movement, collisions, fitness function
js/simulation/Population.js     generation loop, selection, mutation pass
js/simulation/Dot.js            patrolling guards
js/simulation/Coin.js           collectible checkpoints
js/simulation/Solid.js          axis-separated wall collision
js/simulation/Tile.js           grid cell rendering
js/simulation/setting_level.js  maze geometry, guards, solids
js/simulation/sketch.js         p5 sketch, generation loop, controls
```

Because upstream published no licence, **no licence is granted here for these
files.** They remain under their authors' copyright. This repository does not
relicense them, does not sell them, and makes no authorship claim over them.

### Modifications made to inherited files

`sketch.js`

- Canvas offset changed so the 22×10-tile maze is no longer clipped at the right
  edge (the original board overflowed the 1200 px canvas by ~45 px).
- Control panel markup moved into the page's own panel and its labels rewritten;
  each button now writes to the same global the simulation already read.
- Added a pause flag, an explicit restart, and named mode-switch helpers
  (`toggleReplay`, `toggleHumanMode`, `restartRun`) shared by the keyboard and
  the page buttons.
- Added a read-only analytics hook after `calculateFitness()`.
- Replaced the runtime hotlink to an imgur GIF (used for the human-win
  celebration) with a locally drawn banner, removing a third-party network
  dependency from a public demo.
- Fixed the "Evolution Player Speed" label mismatch, an off-by-one in the
  move-budget and interval controls (which allowed a 0-move budget), and
  lowercase `wasd`/`p`/`g` key handling.
- Removed leftover debug logging.

`Population.js`, `setting_level.js`

- Removed debug `print()`/`console.log()` calls. No algorithmic change.

## What is original to this repository

Created by Mohammed Unais:

```
index.html                 page markup and content
assets/css/style.css       design system
js/site/main.js            instrumented dashboard, chart, UI controls
.github/workflows/deploy.yml  GitHub Pages CI
README.md, NOTICE.md, LICENSE
LICENSES/MIT.txt          the MIT text, scoped to the files above
docs/screenshots/**        captured from the running build
```

These files are MIT licensed (`LICENSES/MIT.txt`; scope recorded in `LICENSE`). The instrumentation is read-only
with respect to the genetic algorithm: it samples fitness after evaluation and
never alters selection, mutation or the fitness function.

## Third-party libraries

`libraries/p5.js` (v0.5.8) and `libraries/p5.dom.js` (v0.3.2) are part of
[p5.js](https://p5js.org), © p5.js contributors, licensed **LGPL-2.1**. The
vendored bundles also inline third-party code under its own licences (for
example es6-promise, MIT). See `libraries/README.md`.

`libraries/p5.sound.js` ships with the tree for fidelity to the original
project but is not loaded by `index.html` and is not used by the simulation.

## Publishing status and what that means

This repository is a **genuine GitHub fork** (`fork: true`, parent
`gazijarin/AdamAI`) created with GitHub's fork feature, so it carries the
upstream commit history intact. That matters legally as well as historically:
forking is the mechanism GitHub's Terms of Service describe for reusing public
repositories on GitHub, and this project relies on it rather than on any
implied permission to redistribute.

It does **not** grant a licence over the inherited code. The upstream
repository publishes none, so:

- GitHub reports this fork as having **no licence** (`license: null`), which is
  the accurate answer for the inherited simulation.
- The MIT grant lives in `LICENSES/MIT.txt`, not in the root `LICENSE`, so that
  GitHub cannot label the whole repository MIT. Read the scope in `LICENSE`
  before reusing anything.
- Serving this fork's own GitHub Pages site is a use within GitHub's
  functionality. It is not permission to mirror, repackage or redistribute the
  simulation somewhere else.

If you want to reuse the simulation — for a course, a product, an article, a
different host — ask the upstream authors for an explicit licence (for example
MIT). If they grant one, replace this notice with the real terms and delete
this caveat.

## Removing this project's attribution

Please don't. If you fork this project, keep this file and the upstream credit in
the README intact.
