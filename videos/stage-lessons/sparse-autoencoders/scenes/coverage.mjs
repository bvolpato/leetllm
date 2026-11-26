// Scene 11: coverage - "What does an exact reconstruction tell us?"
// Beat 0: Feature absorption on glowing 2D plane ([1, 1] = bird + sparrow absorbed by single cyan
//         diagonal sparrow slot while dashed bird detector z_g = max(0, x1 - x2) = 0 stays blind).
// Beat 1: Glowing loss ruler (clean 2, rebuilt 2.4, ablated 6 -> 10) proving damage stays 0.4 while
//         Loss Recovered climbs 90% -> 95%.
// Beat 2: Return to password request [2.3, 0.6] with glowing 4-node orbital stage tracker
//         (rebuild -> predict -> edit -> controls), subtracting credential arrow so x1 drops 2.30 -> 0.80
//         while x2 control stays 0.60 -> 0.60.
import { arrow, dynamic, fade } from 'vizmatic/stage';
import { coverageFixture } from '../../../films/sparse-autoencoders/model.mjs';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  cinemaPlane,
  cinemaRebuild,
  code,
  glowDot,
  glowLossRuler,
  glowReadoutBars,
  glowRing,
  glowTex,
  heroTitle,
  playCue,
  target,
  txt,
  vec,
} from '../parts.mjs';

const LOSS = { clean: 2, rebuilt: 2.4, ablated: 6, later: 10, max: 11 };
const DETECTOR = [1, -1];

export default function coverage(s, c) {
  const fixture = coverageFixture();

  const atmo = cinemaAtmosphere(ROLE.other, ROLE.residual);
  const title = heroTitle(['What does an exact', 'reconstruction tell us?'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.other,
  });

  const b = cinemaPlane(s, {
    cx: -365,
    cy: 95,
    width: 960,
    height: 700,
    x: [-1.3, 2.9],
    y: [-1.4, 1.8],
  });

  const rx = 515;

  // --- Beat 0: Feature absorption (bird + sparrow -> 1 diagonal slot, bird detector silent) ---
  const x = fixture.activation; // [1, 1]
  const genVec = [x[0], 0];
  const absorbed = s.value(0);
  const dotX = b.dotOf(x, ROLE.activation, 11, 14);
  const genArrow = b.arrowOf([0, 0], genVec, ROLE.first, { width: 7.5 });
  const specArrow = b.arrowOf(genVec, x, ROLE.second, { width: 7.5 });
  const combArrow = b.arrowOf(
    [0, 0],
    () => vec.scale(fixture.combinedDirection, fixture.combined * absorbed.value),
    ROLE.other,
    { width: 8.5 },
  );
  const genTag = b.tagOf([0.5, 0], 'bird', ROLE.first, [0, -38], { font: 'sans', size: 32 });
  const specTag = b.tagOf([1, 0.5], 'sparrow', ROLE.second, [24, 0], {
    font: 'sans',
    size: 32,
    anchor: 'left',
  });

  s.add(atmo, title, b.node, dotX, genArrow, specArrow);
  c.show('cov-absorb', [genTag, specTag]);

  const entries = glowReadoutBars({
    left: 205,
    top: -115,
    width: 610,
    rowGap: 118,
    items: [
      { name: 'Bird detector  (x₁ − x₂)', color: ROLE.first, read: () => fixture.general },
      { name: 'Sparrow slot', color: ROLE.other, read: () => fixture.combined * absorbed.value },
    ],
    max: 2,
  });

  c.show('cov-combined', [combArrow, entries.names[1], entries.bars]);
  c.on('cov-combined', () => {
    s.play(absorbed.to(1, { duration: 1.5 }));
    s.play(...[genArrow, specArrow, genTag, specTag].map((node) => fade(node, 0.28)), {
      duration: 0.45,
    });
  });

  const exactRing = b.ringOf(x, ROLE.activation, 22, 4);
  const exactNote = txt(
    'Exact rebuild with 1 active slot',
    rx,
    240,
    32,
    COSMOS.ink,
    'sans',
    'center',
  );
  c.show('coverage-b1-1', [exactRing, exactNote], { after: true });

  const detectorRuler = [
    b.rulerOf(DETECTOR, ROLE.first, -1.3, 1.3, { width: 3.5, dash: [13, 9] }),
    b.shadowOf(x, DETECTOR, ROLE.wrong, 10),
  ];
  const silentEq = glowTex('z_g = \\max(0,\\ x_1 - x_2) = 0', {
    x: rx,
    y: -255,
    size: 40,
    color: COSMOS.ink,
    glow: 5,
  });
  silentEq.part('= 0').forEach((g) => g.color(ROLE.wrong));
  const recallNote = txt(
    'Feature absorption: bird detector misses this sparrow',
    rx,
    310,
    26,
    ROLE.wrong,
    'sans',
    'center',
  ).glow(6, ROLE.wrong);

  c.show('coverage-general-silent', [...detectorRuler, entries.names[0], silentEq]);
  c.show('cov-recall', recallNote);

  // --- Beat 1: Loss Recovered ruler (90% -> 95% for constant 0.4 damage) ---
  const ruler = glowLossRuler(s, { left: 200, right: 830, y: 15, ...LOSS });
  const rawHead = txt(
    'Keep all three raw losses in view',
    rx,
    -235,
    34,
    ROLE.mark,
    'serif',
    'center',
  ).glow(6, ROLE.mark);
  const alsoChecks = [
    txt('Also evaluate:', rx, 255, 26, COSMOS.muted, 'sans', 'center'),
    txt('support counts  ·  missed cases', rx, 305, 28, ROLE.other, 'mono', 'center'),
    txt('matched controls  ·  hook edits', rx, 352, 28, ROLE.other, 'mono', 'center'),
  ];

  c.swap(
    'cov-loss',
    [silentEq, ...entries.names, entries.bars, exactNote, recallNote, ...detectorRuler],
    [...ruler.axis, ruler.parts, ruler.share],
  );
  playCue(s, c, 'coverage-b2-1', (d) => s.play(ruler.baseline.to(LOSS.later, { duration: d })), {
    dur: 2.0,
  });
  c.show('cov-same', ruler.damage);
  c.show('coverage-b2-2', rawHead);
  c.show('cov-combine', alsoChecks);

  // --- Beat 2: Password request again with glowing 4-stage causal check ---
  const a1 = s.value(code[0]);
  const first = cinemaRebuild(b, () => [a1.value, code[1]]);
  const editedDot = b.dotOf(first.tip, ROLE.activation, 11, 14);
  const origRing = b.ringOf(target, ROLE.dim, 15, 3);

  const stageStep = s.value(0);
  const stageLabels = ['1. Rebuild', '2. Predict', '3. Edit', '4. Check controls'];
  const stagePipeline = dynamic(() => {
    const cur = stageStep.value;
    const out = [];
    const nx = 300;
    const y0 = -220;
    const gap = 112;
    stageLabels.forEach((lbl, i) => {
      const sy = y0 + i * gap;
      const done = cur >= i - 0.1;
      const active = Math.abs(cur - i) < 0.45;
      const col = active ? ROLE.mark : done ? ROLE.residual : '#435275';
      out.push(
        glowRing(nx, sy, 22, col, { width: active ? 3.5 : 2.2, glow: active ? 10 : 3 }),
        glowDot(nx, sy, { radius: 6, color: col, glow: active ? 10 : 0 }),
        txt(
          lbl,
          nx + 44,
          sy,
          32,
          active ? ROLE.mark : done ? COSMOS.ink : COSMOS.dim,
          'sans',
          'left',
        ),
      );
      if (i < stageLabels.length - 1) {
        out.push(
          arrow([nx, sy + 28], [nx, sy + gap - 28], { stroke: col, width: 2.5, tip: 10 }).opacity(
            done ? 0.9 : 0.35,
          ),
        );
      }
    });
    return out;
  });

  const predShadow = b.shadowOf(first.tip, [1, 0], ROLE.mark, 10);
  const ctrlShadow = b.shadowOf(first.tip, [0, 1], ROLE.first, 10);
  const predNote = txt('Horizontal:  2.30 → 0.80', rx, 275, 36, ROLE.mark, 'mono', 'center').glow(
    7,
    ROLE.mark,
  );
  const ctrlNote = txt('Vertical:    0.60 → 0.60', rx, 340, 36, ROLE.first, 'mono', 'center').glow(
    7,
    ROLE.first,
  );

  c.swap(
    'cov-separate',
    [
      dotX,
      genArrow,
      specArrow,
      combArrow,
      genTag,
      specTag,
      exactRing,
      ...ruler.axis,
      ruler.parts,
      ruler.share,
      ruler.damage,
      rawHead,
      ...alsoChecks,
    ],
    [origRing, first.blue, first.pink, editedDot],
  );
  c.show('cov-stage', stagePipeline);
  playCue(s, c, 'cov-stage', (d) => s.play(stageStep.to(1, { duration: d })), {
    offset: 0.4,
    dur: 0.5,
  });
  playCue(s, c, 'cov-edit', (d) => s.play(stageStep.to(2, { duration: d })), { dur: 0.5 });
  c.show('cov-edit', [predShadow, ctrlShadow]);
  playCue(s, c, 'coverage-b3-1', (d) => s.play(a1.to(0, { duration: d })), { dur: 1.35 });
  c.show('coverage-b3-1', predNote, { after: true });
  playCue(s, c, 'cov-controls', (d) => s.play(stageStep.to(3, { duration: d })), {
    offset: 0.4,
    dur: 0.5,
  });
  c.show('cov-controls', ctrlNote);
}
