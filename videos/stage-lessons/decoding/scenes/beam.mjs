// Scene 4: beam: "Give the decoder a second place"
// Width-2 beam keeps both ran and slept, expands all 5 continuations (withholding products),
// then ranks the 5 products and retains #1 slept soundly (0.360) and #2 ran home (0.210),
// pairing the ranking with the MathJax log-probability sum equation.
import { glowTex, guardedDynamic, heroTitle } from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, glowDogTree, playCue } from '../parts.mjs';

export default function beam(s, c) {
  const title = heroTitle(['Give the decoder', 'a second place'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.valid,
  });

  const keepBoth = s.value(0);
  const expandAll = s.value(0);
  const showProds = s.value(0);
  const showFrontier = s.value(0);
  const stageVis = s.value(1);

  const treeLayer = guardedDynamic(stageVis, (alpha) => {
    const kept = keepBoth.value > 0.4 ? [0, 1] : [];
    const expanded = expandAll.value > 0.4 ? [0, 1, 2, 3, 4] : [];
    const scores = showProds.value > 0.4 ? [0, 1, 2, 3, 4] : [];
    const selected = showFrontier.value > 0.4 ? [3, 1] : [];

    let note = 'Reserve B = 2 beam slots for active prefixes.';
    let noteColor = ROLE.muted;
    if (showFrontier.value > 0.4) {
      note = 'Width-2 frontier keeps #1 slept soundly (0.360) and #2 ran home (0.210)';
      noteColor = ROLE.winner;
    } else if (showProds.value > 0.4) {
      note = 'Compare all 5 products on one shared scale.';
      noteColor = ROLE.active;
    } else if (expandAll.value > 0.4) {
      note = 'Which two paths earn a place on the beam?';
      noteColor = ROLE.winner;
    }

    return [
      glowDogTree({
        values: [0.3, 0.35, 0.35, 0.9, 0.1],
        expanded,
        scores,
        kept,
        selected,
        cover: expandAll.value < 0.4,
        note,
        noteColor,
        alpha,
      }),
    ];
  });

  const logEq = glowTex('\\log P(w_{1:T}) = \\sum_{t=1}^{T} \\log P(w_t \\mid w_{<t})', {
    x: 340,
    y: -395,
    size: 36,
    color: ROLE.active,
  });

  s.add(cinemaAtmosphere(ROLE.valid, ROLE.winner), title, treeLayer);

  playCue(s, c, 'beam-keep', (d) => s.play(keepBoth.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'beam-expand', (d) => s.play(expandAll.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'beam-products', (d) => s.play(showProds.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'beam-frontier', (d) => s.play(showFrontier.to(1, { duration: d })), {
    after: true,
    dur: 0.6,
  });
  c.show('beam-frontier', logEq);
}
