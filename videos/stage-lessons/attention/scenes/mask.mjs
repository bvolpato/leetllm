// Scene 7: mask: "Masks: the future and the padding"
// Crimson causal curtain sweeping across the score matrix (-inf -> 0.00 before softmax vs broken share bar),
// 5x5 lower-triangular visibility geometry with floating legend, and left-padding all-masked row
// rendered with visual softmax output meters (NaN vs [-1e9,-1e9,-1e9] -> [0.33,0.33,0.33] uniform tie).
import { arrow, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  rule,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  SCALED,
  WEIGHTS,
  cinemaAtmosphere,
  fmt,
  glowMatrix,
  lumBar,
  playCue,
  shareRibbon,
  swapVis,
} from '../parts.mjs';

export default function mask(s, c) {
  const title = heroTitle(['Masks: the future', 'and the padding'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.mask,
  });

  // Three crisp sequential views: 2x2 causal mask, 5x5 triangle, 3x3 left-padding visual meters
  const vCausal = s.value(1);
  const vTriangle = s.value(0);
  const vPadding = s.value(0);

  // Reactive states
  const maskCurtain = s.value(0);
  const afterSoftmaxErr = s.value(0);
  const birdsAloneHi = s.value(0);
  const triReveal = s.value(0);
  const padStep = s.value(0);

  // View 1: 2x2 Causal Mask Curtain + Visual Broken-Budget Share Bar (no prose cards)
  const causalLayer = guardedDynamic(vCausal, (alpha) => {
    const mc = maskCurtain.value;
    const err = afterSoftmaxErr.value;
    const ba = birdsAloneHi.value;
    const nodes = [];

    const scoreVals = [
      [fmt(SCALED[0][0], 2), mc > 0.45 ? '-∞' : fmt(SCALED[0][1], 2)],
      [fmt(SCALED[1][0], 2), fmt(SCALED[1][1], 2)],
    ];
    const scoreCols = [
      [ROLE.birds, mc > 0.45 ? ROLE.mask : ROLE.sing],
      [ROLE.birds, ROLE.sing],
    ];

    const w00 = mc > 0.45 ? '1.00' : fmt(WEIGHTS[0][0], 2);
    const w01 = mc > 0.45 ? '0.00' : fmt(WEIGHTS[0][1], 2);
    const weightVals = [
      [w00, w01],
      [fmt(WEIGHTS[1][0], 2), fmt(WEIGHTS[1][1], 2)],
    ];
    const weightCols = [
      [ROLE.value, mc > 0.45 ? ROLE.mask : ROLE.sing],
      [ROLE.birds, ROLE.sing],
    ];

    nodes.push(
      txt('Scaled scores  +  mask', -430, -175, 32, ROLE.query, 'mono', 'center').opacity(alpha),
      glowMatrix({
        cx: -430,
        cy: 30,
        cellW: 165,
        cellH: 88,
        values: scoreVals,
        rowLabels: ['Birds', 'sing'],
        colLabels: ['Birds', 'sing'],
        colors: scoreCols,
        highlight: (r, k) => (r === 0 && k === 1 && mc > 0.45) || (r === 0 && k === 0 && ba > 0.5),
      }).opacity(alpha),
      arrow([-165, 30], [15, 30], { stroke: ROLE.sing, width: 4.5, tip: 16 }).opacity(alpha),
      txt('softmax', -75, -18, 28, ROLE.sing, 'mono', 'center').opacity(alpha),
      txt('Attention shares', 350, -175, 32, ROLE.value, 'mono', 'center').opacity(alpha),
      glowMatrix({
        cx: 350,
        cy: 30,
        cellW: 165,
        cellH: 88,
        values: weightVals,
        rowLabels: ['Birds', 'sing'],
        colLabels: ['Birds', 'sing'],
        colors: weightCols,
        highlight: (r, k) => r === 0 && k === 0 && (mc > 0.45 || ba > 0.5),
      }).opacity(alpha),
    );

    const row0Sum =
      mc > 0.45
        ? 'Birds row: 1.00 + 0.00 = 1.00 (keeps own value)'
        : 'Unmasked: Birds peeks at future word "sing"';
    const row0Col = mc > 0.45 ? ROLE.value : ROLE.mask;
    nodes.push(txt(row0Sum, 0, 215, 32, row0Col, 'sans', 'center').glow(6, row0Col).opacity(alpha));

    // Visual broken share meter when zeroing after softmax (53% filled + 47% missing budget!)
    if (err > 0.05) {
      const barW = 760;
      const barL = -380;
      const fillW = barW * 0.53;
      nodes.push(
        lumBar(barL + fillW / 2, 320, fillW, 42, {
          color: ROLE.mask,
          fillOpacity: 0.42,
          strokeWidth: 2.5,
          glow: 9,
          opacity: err * alpha,
        }),
        rect(barW - fillW, 42, {
          fill: null,
          stroke: ROLE.dim,
          width: 2,
          dash: [6, 6],
          radius: 6,
        })
          .at(barL + fillW + (barW - fillW) / 2, 320)
          .opacity(err * alpha),
        txt(
          'Zeroed after softmax: sum = 0.53 ≠ 1.00 (47% mass lost!)',
          0,
          385,
          28,
          ROLE.mask,
          'mono',
          'center',
        ).opacity(err * alpha),
      );
    }

    return nodes;
  });

  // View 2: 5x5 Lower-Triangular Causal Visibility Geometry + Floating Legend (no prose box)
  const words5 = ['Birds', 'in', 'the', 'garden', 'sing'];
  const triangleLayer = guardedDynamic(vTriangle, (alpha) => {
    const tr = triReveal.value;
    const nodes = [];
    const cell = 108;
    const gap = 12;
    const gridW = 5 * cell + 4 * gap;
    const startX = -220 - gridW / 2 + cell / 2;
    const startY = -105;

    nodes.push(
      txt(
        'Causal lower triangle: j ≤ i allowed, j > i masked (-∞)',
        120,
        -280,
        30,
        ROLE.query,
        'mono',
        'center',
      )
        .glow(6, ROLE.query)
        .opacity(alpha),
    );

    words5.forEach((w, k) => {
      nodes.push(
        txt(w, startX + k * (cell + gap), startY - 84, 28, COSMOS.muted, 'sans', 'center').opacity(
          alpha,
        ),
      );
    });

    for (let r = 0; r < 5; r++) {
      const cy = startY + r * (cell + gap);
      nodes.push(txt(words5[r], startX - 96, cy, 28, COSMOS.ink, 'sans', 'right').opacity(alpha));
      for (let k = 0; k < 5; k++) {
        const cx = startX + k * (cell + gap);
        const allowed = k <= r;
        const col = allowed ? ROLE.sing : ROLE.mask;
        const fillOp = allowed ? 0.42 : 0.24 * Math.max(0.5, tr);
        nodes.push(
          lumBar(cx, cy, cell, cell, {
            color: col,
            fillOpacity: fillOp,
            strokeWidth: allowed ? 2.6 : 1.8,
            glow: allowed ? 9 : 5,
            radius: 10,
            opacity: alpha,
          }),
          txt(
            allowed ? '✓' : '-∞',
            cx,
            cy,
            32,
            allowed ? ROLE.value : ROLE.mask,
            'mono',
            'center',
          ).opacity((allowed ? 1 : Math.max(0.45, tr)) * alpha),
        );
      }
    }

    // Floating editorial typography + glowing legend markers (zero rectangular card chrome!)
    nodes.push(
      txt('Each token reads', 465, -20, 38, ROLE.value, 'serif', 'center').opacity(alpha),
      txt('itself and the past', 465, 36, 38, ROLE.value, 'serif', 'center').opacity(alpha),
      rule(285, 92, 645, 92, COSMOS.rule, 1.8).opacity(0.7 * alpha),
      txt('j ≤ i  →  allowed', 465, 145, 28, ROLE.sing, 'mono', 'center').opacity(alpha),
      txt('j > i  →  -∞  →  weight 0', 465, 200, 28, ROLE.mask, 'mono', 'center')
        .glow(6, ROLE.mask)
        .opacity(alpha),
    );
    return nodes;
  });

  // View 3: Left-Padding + Causal Mask Collision with Visual Softmax Output Meters (ZERO prose cards!)
  const padWords = ['[PAD]', 'Birds', 'sing'];
  const paddingLayer = guardedDynamic(vPadding, (alpha) => {
    const ps = padStep.value;
    const nodes = [];
    const cell = 128;
    const gap = 16;
    const startX = -595;
    const startY = -65;

    nodes.push(
      txt('Left padding + causal mask', -445, -225, 32, ROLE.query, 'mono', 'center').opacity(
        alpha,
      ),
    );

    padWords.forEach((w, k) => {
      const col = k === 0 ? ROLE.mask : COSMOS.muted;
      nodes.push(
        txt(w, startX + k * (cell + gap), startY - 94, 28, col, 'mono', 'center').opacity(alpha),
      );
    });

    for (let r = 0; r < 3; r++) {
      const cy = startY + r * (cell + gap);
      const rCol = r === 0 ? ROLE.mask : COSMOS.ink;
      nodes.push(txt(padWords[r], startX - 94, cy, 28, rCol, 'mono', 'right').opacity(alpha));
      for (let k = 0; k < 3; k++) {
        const cx = startX + k * (cell + gap);
        const padBlocked = k === 0;
        const causalBlocked = k > r;
        const blocked = padBlocked || causalBlocked;
        const col = blocked ? ROLE.mask : ROLE.value;
        const label = padBlocked ? 'PAD' : causalBlocked ? '-∞' : 'OK';
        nodes.push(
          lumBar(cx, cy, cell, cell, {
            color: col,
            fillOpacity: blocked ? 0.22 : 0.34,
            strokeWidth: r === 0 && ps >= 1.5 ? 3 : 2,
            glow: r === 0 && ps >= 1.5 ? 10 : 5,
            opacity: alpha,
          }),
          txt(label, cx, cy, 28, col, 'mono', 'center').opacity(alpha),
        );
      }
    }

    // Visual arrow from Row 0 ([PAD]) to the 3 live softmax output meters on the right
    const rx = 435;
    const op1 = (ps >= 1 ? 1 : 0.6) * alpha;
    const op2 = (ps >= 2 ? 1 : 0.45) * alpha;
    const op3 = (ps >= 3 ? 1 : 0.45) * alpha;
    const op4 = (ps >= 4 ? 1 : 0.45) * alpha;

    nodes.push(
      arrow([-225, startY], [-30, startY], { stroke: ROLE.mask, width: 3.5, tip: 14 })
        .glow(ps >= 1 ? 8 : 2, ROLE.mask)
        .opacity(op1),
      txt('Row 0 ([PAD]): 0 legal keys', rx, -225, 30, ROLE.mask, 'mono', 'center')
        .glow(ps >= 1 ? 6 : 0, ROLE.mask)
        .opacity(op1),

      // Meter 1: [-∞, -∞, -∞] -> NaN (or kernel [0, 0, 0])
      txt('softmax([-∞, -∞, -∞])  →  NaN', rx, -135, 30, ROLE.mask, 'mono', 'center')
        .glow(ps >= 2 ? 8 : 0, ROLE.mask)
        .opacity(op2),
      txt(
        '(fast kernels often return [0, 0, 0])',
        rx,
        -86,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(op2),

      // Meter 2: [-1e9, -1e9, -1e9] -> visual 3-way uniform tie bar [0.33, 0.33, 0.33]!
      txt(
        'Trap: softmax([-1e9, -1e9, -1e9]) ties!',
        rx,
        8,
        28,
        ROLE.amber,
        'mono',
        'center',
      ).opacity(op3),
      shareRibbon({
        x: rx,
        y: 112,
        width: 720,
        height: 46,
        shares: [1 / 3, 1 / 3, 1 / 3],
        colors: [ROLE.amber, ROLE.amber, ROLE.amber],
        labels: ['PAD', 'Birds', 'sing'],
        opacity: op3,
      }),
      txt(
        'Uniform [0.33, 0.33, 0.33] over blocked keys!',
        rx,
        168,
        26,
        ROLE.amber,
        'sans',
        'center',
      ).opacity(op3),

      // Meter 3: Clean emerald rule (floating typography + hairline rule, zero box)
      rule(55, 228, 815, 228, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      txt('Fix: keep ≥ 1 legal key for real queries', rx, 275, 28, ROLE.value, 'sans', 'center')
        .glow(ps >= 4 ? 6 : 0, ROLE.value)
        .opacity(op4),
      txt(
        'and zero padded query outputs explicitly',
        rx,
        326,
        28,
        ROLE.value,
        'sans',
        'center',
      ).opacity(op4),
    );

    return nodes;
  });

  const subEq = glowTex('\\text{scores} = \\frac{Q K^{\\top}}{\\sqrt{d_k}} + M', {
    x: 420,
    y: -365,
    size: 42,
    color: ROLE.mask,
  });

  s.add(
    cinemaAtmosphere(ROLE.mask, ROLE.sing),
    title,
    subEq,
    causalLayer,
    triangleLayer,
    paddingLayer,
  );

  // Beat 0: Scores = relevance, mask = permission, training leak
  playCue(s, c, 'relevant', (d) => s.play(maskCurtain.to(0.15, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'allowed', (d) => s.play(maskCurtain.to(0.3, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'not-yet', (d) => s.play(maskCurtain.to(0.25, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'in-training', (d) => s.play(maskCurtain.to(0.1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'answer', (d) => s.play(maskCurtain.to(0.0, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'loss', (d) => s.play(maskCurtain.to(0.2, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'fails', (d) => s.play(maskCurtain.to(0.35, { duration: d })), { dur: 0.35 });

  // Beat 1: After scaling & before softmax, set blocked to -inf -> 0.00 -> vs broken after-softmax
  playCue(s, c, 'after-scaling', (d) => s.play(maskCurtain.to(0.6, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'negative-infinity', (d) => s.play(maskCurtain.to(1, { duration: d })), {
    dur: 0.55,
  });
  playCue(s, c, 'exactly-zero', (d) => s.play(birdsAloneHi.to(0.5, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'budget', (d) => s.play(birdsAloneHi.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'zero-after', (d) => s.play(afterSoftmaxErr.to(1, { duration: d })), { dur: 0.55 });

  // Beat 2: Birds reads itself alone -> 5x5 lower triangle
  playCue(s, c, 'birds-alone', (d) => s.play(afterSoftmaxErr.to(0, { duration: d })), { dur: 0.4 });
  playCue(
    s,
    c,
    'triangle',
    (d) => s.play(swapVis(vCausal, vTriangle, d), triReveal.to(1, { duration: d })),
    { dur: 0.8 },
  );

  // Beat 3: Padding + left padding all-masked row
  playCue(s, c, 'padding', (d) => s.play(swapVis(vTriangle, vPadding, d)), { dur: 0.7 });
  playCue(s, c, 'fake', (d) => s.play(padStep.to(0.5, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'pad-mask', (d) => s.play(padStep.to(0.8, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'as-query', (d) => s.play(padStep.to(1.1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'left-pad', (d) => s.play(padStep.to(1.4, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'both-masks', (d) => s.play(padStep.to(1.7, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'no-key', (d) => s.play(padStep.to(1.9, { duration: d })), { dur: 0.35 });

  // Beat 4: NaN, kernels, -1e9 uniform tie bug, real-query fix
  playCue(s, c, 'no-answer', (d) => s.play(padStep.to(2.1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'nan', (d) => s.play(padStep.to(2.4, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'kernels', (d) => s.play(padStep.to(2.7, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'overwrite', (d) => s.play(padStep.to(3.1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'even-split', (d) => s.play(padStep.to(3.6, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'real-query', (d) => s.play(padStep.to(4.2, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'zero-out', (d) => s.play(padStep.to(4.8, { duration: d })), { dur: 0.4 });

  void line;
  void glowingTrail;
}
