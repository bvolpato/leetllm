// Scene 30: Give each output row its own magnitude: DoRA W = m * V/||V|| on [3,4] + rectangular 4x6 (+20%) & 4096x4096 (+3.125%) parameter overhead.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  arrow,
  aura,
  doraRow,
  fmtNum,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  matrixGrid,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

const RECT_W = [
  [1, 0, 0, 0, 0, 0],
  [0, 2, 0, 0, 0, 0],
  [0, 0, 3, 0, 0, 0],
  [0, 0, 0, 4, 1, 1],
];

export default function doraForward(s, c) {
  const phase = s.value(0);
  const showVec = s.value(1);
  const showStep2 = s.value(0);
  const showInitId = s.value(0);
  const dirChange = s.value(0);
  const magChange = s.value(0);
  const showRectCount = s.value(0);
  const showFourM = s.value(0);
  const showTwentyPct = s.value(0);
  const showSquarePct = s.value(0);

  const bgAura = aura(100, 10, 620, '#6ee7b71e', '#ffd16618');
  const title = heroTitle(['DoRA: Separate Direction', 'and Row Magnitude'], {
    x: -855,
    y: -420,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.emerald,
    eyebrow: 'WEIGHT-DECOMPOSED LOW-RANK ADAPTATION',
  });

  const eq = glowTex(
    String.raw`V = W_0 + \frac{\alpha}{r}BA, \qquad W_{\text{DoRA}} = m \odot \frac{V}{\|V\|_{\text{row}}}`,
    {
      x: 345,
      y: -365,
      size: 32,
      color: COSMOS.emerald,
    },
  );

  // Part 1: [3,4] vector direction vs magnitude decomposition
  const ox = -690;
  const oy = 335;
  const unit = 86;
  const pt = (vx, vy) => [ox + vx * unit, oy - vy * unit];

  const partVec = guardedDynamic(showVec, (a) => {
    const dp = dirChange.value;
    const mp = magChange.value;
    const idOk = showInitId.value > 0.3;

    const v = [3 + 1.2 * dp, 4 - 0.5 * dp];
    const m = 5 + 1.4 * mp;
    const row = doraRow(v, m, [1, 0]);
    const uVec = [v[0] / row.norm, v[1] / row.norm];

    const nodes = [
      // Coordinate axes on left
      line(pt(-0.6, 0), pt(6.6, 0), { stroke: '#3a4c78', width: 2.5 }).opacity(a),
      line(pt(0, -0.6), pt(0, 6.2), { stroke: '#3a4c78', width: 2.5 }).opacity(a),
      txt('W_0 = [3, 4]  (||W_0|| = 5)', ox + 260, -210, 26, COSMOS.blue, 'mono').opacity(a),

      // Original W_0 = [3,4]
      arrow(pt(0, 0), pt(3, 4), { stroke: COSMOS.blue, width: 4, tip: 12 }).opacity(0.75 * a),
      // Directional V = W_0 + (a/r)BA
      arrow(pt(0, 0), pt(v[0], v[1]), { stroke: COSMOS.gold, width: 5.5, tip: 15 })
        .glow(10, COSMOS.gold)
        .opacity(a),
      // Unit direction V/||V||
      arrow(pt(0, 0), pt(uVec[0] * 1.4, uVec[1] * 1.4), { stroke: COSMOS.cyan, width: 6, tip: 13 })
        .glow(11, COSMOS.cyan)
        .opacity(a),
      // Final DoRA effective row m * V/||V||
      arrow(pt(0, 0), pt(row.weight[0], row.weight[1]), {
        stroke: COSMOS.emerald,
        width: 5,
        tip: 15,
      })
        .glow(10, COSMOS.emerald)
        .opacity(a),
      glowDot(pt(row.weight[0], row.weight[1])[0], pt(row.weight[0], row.weight[1])[1], {
        radius: 8,
        color: COSMOS.emerald,
        opacity: a,
      }),

      // Right readouts
      glassCell(425, -110, 770, 144, COSMOS.gold, {
        fill: '#221c10',
        glow: dp > 0.2 ? 10 : 5,
        opacity: a,
      }),
      txt('DIRECTIONAL ROW  V = W_0 + sBA', 75, -148, 26, COSMOS.gold, 'mono', 'left').opacity(a),
      txt(
        `V = [${fmtNum(v[0], 2)}, ${fmtNum(v[1], 2)}]   ·   ||V|| = ${row.norm.toFixed(3)}`,
        75,
        -88,
        32,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(a),

      glassCell(425, 68, 770, 144, COSMOS.emerald, {
        fill: '#0e2528',
        glow: mp > 0.2 ? 10 : 5,
        opacity: a,
      }),
      txt('LEARNED ROW MAGNITUDE  m', 75, 30, 26, COSMOS.emerald, 'mono', 'left').opacity(a),
      txt(
        `m = ${fmtNum(m, 2)}   ·   W = [${fmtNum(row.weight[0], 2)}, ${fmtNum(row.weight[1], 2)}]`,
        75,
        90,
        32,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(a),

      glassCell(425, 258, 770, 168, idOk ? COSMOS.cyan : '#334268', {
        fill: '#101d35',
        glow: showStep2.value > 0.2 ? 8 : 3,
        opacity: a,
      }),
      txt('STEP-0 IDENTITY & MERGEABILITY', 75, 212, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt(
        dp > 0.2 || mp > 0.2
          ? 'Direction (BA) & magnitude (m) move independently'
          : 'B = 0, m = ||W_0|| reconstructs W_0 exactly',
        75,
        266,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(a),
      txt(
        'Merges final normalized rows back into a dense matrix',
        75,
        308,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  // Part 2: Rectangular 4x6 rank-2 (+20%) vs Square 4096x4096 rank-16 (+3.125%)
  const partRect = guardedDynamic(showRectCount, (a) => {
    const fm = showFourM.value;
    const tp = showTwentyPct.value;
    const sp = showSquarePct.value;

    const x0 = -740;
    const uPx = 48; // 24 params = 1152 px

    const nodes = [
      txt(
        'RECTANGULAR 4 × 6 WEIGHT (4 OUTPUT ROWS, 6 INPUTS, r = 2)',
        -855,
        -220,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      matrixGrid(RECT_W, -460, -10, {
        cellW: 78,
        cellH: 64,
        color: COSMOS.blue,
        opacity: a,
        fontSize: 26,
      }),

      glassCell(365, -10, 910, 310, COSMOS.emerald, { fill: '#101c34', glow: 8, opacity: a }),
      txt(
        'ONE MAGNITUDE PER OUTPUT ROW (d_out = 4)',
        -55,
        -118,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(a),
      txt('A : 2 × 6 = 12 params', -55, -52, 30, COSMOS.gold, 'mono', 'left').opacity(a),
      txt('B : 4 × 2 = 8 params   (LoRA = 20)', -55, 6, 30, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt(
        fm > 0.3 ? 'm : 4 magnitudes   (+4 / 20 = +20% extra)' : 'm : one scalar per output row',
        -55,
        72,
        30,
        COSMOS.emerald,
        'mono',
        'left',
      )
        .glow(fm > 0.3 ? 6 : 0, COSMOS.emerald)
        .opacity(a),

      // Visual stacked parameter strip (12 + 8 + 4)
      rect(12 * uPx, 48, { fill: COSMOS.gold, radius: 5 })
        .at(x0 + 6 * uPx, 232)
        .opacity(Math.max(0.4, tp) * a),
      txt('A (12)', x0 + 6 * uPx, 232, 26, '#070910', 'mono').opacity(Math.max(0.4, tp) * a),
      rect(8 * uPx, 48, { fill: COSMOS.cyan, radius: 5 })
        .at(x0 + 16 * uPx, 232)
        .opacity(Math.max(0.4, tp) * a),
      txt('B (8)', x0 + 16 * uPx, 232, 26, '#070910', 'mono').opacity(Math.max(0.4, tp) * a),
      rect(4 * uPx, 48, { fill: COSMOS.emerald, radius: 5 })
        .at(x0 + 22 * uPx, 232)
        .glow(10, COSMOS.emerald)
        .opacity(Math.max(0.3, fm) * a),
      txt('m (4)', x0 + 22 * uPx, 232, 26, '#070910', 'mono').opacity(Math.max(0.3, fm) * a),
      txt(
        tp > 0.3 ? '24 total (+20%)' : '20 + 4',
        x0 + 24 * uPx + 24,
        232,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(a),

      // Square 4096x4096 r=16 callout
      glassCell(0, 362, 1660, 120, sp > 0.3 ? COSMOS.gold : '#334268', {
        fill: '#121a30',
        glow: sp > 0.3 ? 9 : 3,
        opacity: a,
      }),
      txt(
        sp > 0.3
          ? 'Square 4096×4096 (r=16): +4,096 / 131,072 = +3.125% extra · output-row axis sets count'
          : 'Rectangular layers expose the output-row axis (a square matrix hides axis mistakes)',
        0,
        362,
        26,
        sp > 0.3 ? COSMOS.gold : COSMOS.muted,
        'mono',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, partVec, partRect);
  runPhase(s, c, phase, 14);

  c.on('dora-forward-1', () => s.play(showVec.to(1, { duration: 0.2 })));
  c.on('dora-forward-2', () => s.play(showStep2.to(1, { duration: 0.35 })));
  c.on('dora-initial-identity', () => s.play(showInitId.to(1, { duration: 0.4 })));
  c.on('dora-direction-change', () => s.play(dirChange.to(1, { duration: 0.6 })));
  c.on('dora-magnitude-change', () => s.play(magChange.to(1, { duration: 0.6 })));
  c.on('dora-forward-3', () => {
    s.play(
      par(showVec.to(0, { duration: 0.16 }), delay(showRectCount.to(1, { duration: 0.2 }), 0.16)),
    );
  });
  c.on('dora-four-magnitudes', () => s.play(showFourM.to(1, { duration: 0.4 })));
  c.on('dora-twenty-percent', () => s.play(showTwentyPct.to(1, { duration: 0.4 })));
  c.on('dora-square-count', () =>
    s.play(showSquarePct.to(1, { duration: remainDuration(c, 'dora-square-count', 0.45) })),
  );
}
