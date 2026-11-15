# NOTICE — provenance, credits and licensing

Adam AI is an independent redevelopment and maintained implementation by
**Mohammed Unais**, published at <https://github.com/PyDeV1OpEr/AdamAI> and
<https://pydev1oper.github.io/AdamAI/>.

The simulation core derives from an earlier project. It is reused and developed
further with the express permission of its authors, who granted Mohammed Unais
the right to reuse and redistribute the work under the **MIT License** (see
[LICENSE](LICENSE)). The original copyright notices are retained below and in
the licence.

## Original implementation

| | |
|---|---|
| Repository | <https://github.com/gazijarin/AdamAI> |
| Authors | Gazi Jarin ([@gazijarin](https://github.com/gazijarin)), Raiyan Rahman ([@RaiyanRahman](https://github.com/RaiyanRahman)) |
| Published | 31 December 2018 |
| Permission | Reuse and modification granted to Mohammed Unais under the MIT License |
| Lineage | the genetic-algorithm structure follows [Code Bullet](https://github.com/Code-Bullet)'s work, as credited upstream |

This repository is a genuine GitHub fork of that project, so the original
commit history and authorship are preserved alongside the rebuild commit.

## Inherited files

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

## Modifications to inherited files

`sketch.js`

- Canvas offset changed so the 22×10-tile maze is no longer clipped at the right
  edge (the original board overflowed the 1200 px canvas by ~45 px).
- Control panel markup moved into the page's own panel and its labels rewritten;
  each button writes to the same global the simulation already read.
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

No fitness, selection, mutation or genome behaviour was altered, so results
remain comparable with the original.

## Original to this repository

Created by Mohammed Unais:

```
index.html                     page markup, content and documentation
assets/css/style.css           design system and responsive layout
js/site/main.js                live instrumentation, fitness chart, UI controls
.github/workflows/deploy.yml   validation and GitHub Pages deployment
README.md, NOTICE.md, LICENSE
docs/screenshots/**            captured from the running build
```

The instrumentation is read-only with respect to the genetic algorithm: it
samples fitness after evaluation and never alters selection, mutation or the
fitness function.

## Third-party libraries

`libraries/p5.js` (v0.5.8) and `libraries/p5.dom.js` (v0.3.2) are part of
[p5.js](https://p5js.org), © p5.js contributors, licensed **LGPL-2.1**. The
vendored bundles also inline third-party code under its own licences (for
example es6-promise, MIT). See [libraries/README.md](libraries/README.md).

`libraries/p5.sound.js` ships with the tree for fidelity to the original project
but is not loaded by `index.html` and is not used by the simulation.
