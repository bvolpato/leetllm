// Scene 3: counting-contract: "What gets counted twice?"
// Top: Luminous dense matrix contraction X (2x3) * W (3x2) = Y (2x2) with 6 stored weights.
// Bottom (2-act swapVis):
//   Act 1 (Beat 0): 4 stored source positions seen twice -> 8 token presentations.
//   Act 2 (Beats 1-2): 3 dense contractions (6ND) -> +1 recomputed forward pass (8ND) + 1.2e20 FLOPs.
import { COSMOS, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, lumBar, playCue, swapVis } from '../parts.mjs';

const MAT_X = [
  [1, 2, 1],
  [0, 1, 2],
];
const MAT_W = [
  [1, 0],
  [0, 2],
  [1, 1],
];
const MAT_Y = [
  [2, 5],
  [2, 4],
];

export default function countingContract(s, c) {
  const title = heroTitle(['What gets', 'counted twice?'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.tokens,
  });

  const exposureProg = s.value(0); // Beat 0: 0 -> 8 presentations
  const act1Vis = s.value(1);
  const act2Vis = s.value(0);
  const termProg = s.value(0); // Beat 1: 0 -> 3 contractions
  const recomputeVis = s.value(0); // Beat 2: adds 4th recomputed forward -> 8ND

  // Top persistent matrix contraction layer
  const matLayer = guardedDynamic(s.value(1), (alpha) => {
    const nodes = [];
    const cellW = 74;
    const cellH = 62;
    const gap = 8;

    const drawMat = (mat, cx, cy, col, labelText) => {
      const rows = mat.length;
      const cols = mat[0].length;
      const totW = cols * cellW + (cols - 1) * gap;
      const totH = rows * cellH + (rows - 1) * gap;
      const left = cx - totW / 2;
      const top = cy - totH / 2;
      nodes.push(
        txt(labelText, cx, top - 34, 28, col, 'mono', 'center')
          .glow(5, col)
          .opacity(alpha),
      );
      for (let r = 0; r < rows; r++) {
        for (let k = 0; k < cols; k++) {
          const rx = left + k * (cellW + gap) + cellW / 2;
          const ry = top + r * (cellH + gap) + cellH / 2;
          nodes.push(
            lumBar(rx, ry, cellW, cellH, {
              color: col,
              fillOpacity: 0.22,
              strokeWidth: 2,
              glow: 6,
              radius: 6,
              opacity: alpha,
            }),
            txt(String(mat[r][k]), rx, ry, 30, COSMOS.ink, 'mono', 'center').opacity(alpha),
          );
        }
      }
    };

    drawMat(MAT_X, -420, -140, ROLE.params, 'X · 2 token rows');
    nodes.push(txt('×', -220, -140, 44, COSMOS.muted, 'mono', 'center').opacity(alpha));
    drawMat(MAT_W, -40, -140, ROLE.tokens, 'W · 6 stored weights');
    nodes.push(txt('=', 135, -140, 44, COSMOS.muted, 'mono', 'center').opacity(alpha));
    drawMat(MAT_Y, 310, -140, ROLE.compute, 'Y = XW');

    // Floating scale reference on far right
    nodes.push(
      txt('1B × 20B tokens', 665, -195, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('1.2 × 10²⁰', 665, -130, 42, ROLE.compute, 'mono', 'center')
        .glow(8, ROLE.compute)
        .opacity(alpha),
      txt('dense FLOPs (6ND)', 665, -75, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
    );

    return nodes;
  });

  // Act 1 (Bottom): 4 unique positions seen twice = 8 presentations
  const act1Layer = guardedDynamic(act1Vis, (alpha) => {
    const nodes = [];
    const count = Math.max(1, Math.min(8, Math.round(exposureProg.value * 8)));
    const slotW = 165;
    const gap = 26;
    const totalW = 8 * slotW + 7 * gap;
    const startX = -totalW / 2 + slotW / 2;
    const rowY = 175;

    nodes.push(
      txt(
        '4 stored positions  ×  2 epochs  =  8 token presentations (D)',
        0,
        72,
        32,
        ROLE.tokens,
        'sans',
        'center',
      )
        .glow(6, ROLE.tokens)
        .opacity(alpha),
    );

    for (let i = 0; i < 8; i++) {
      const lit = i < count;
      const sx = startX + i * (slotW + gap);
      const isEpoch2 = i >= 4;
      const col = isEpoch2 ? ROLE.compute : ROLE.tokens;
      nodes.push(
        lumBar(sx, rowY, slotW, 74, {
          color: lit ? col : COSMOS.dim,
          fillOpacity: lit ? 0.36 : 0.08,
          strokeWidth: lit ? 2.6 : 1.4,
          glow: lit ? 10 : 0,
          radius: 8,
          opacity: (lit ? 1 : 0.5) * alpha,
        }),
        txt(
          lit ? `P${(i % 4) + 1}` : '·',
          sx,
          rowY,
          34,
          lit ? COSMOS.ink : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    nodes.push(
      txt(
        'Epoch 1 (unique)',
        startX + 1.5 * (slotW + gap),
        252,
        26,
        ROLE.tokens,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'Epoch 2 (revisited)',
        startX + 5.5 * (slotW + gap),
        252,
        26,
        ROLE.compute,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'Tied input/output weights share storage, yet projection still costs arithmetic',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // Act 2 (Bottom): 3 contractions (6ND) -> +1 recomputed forward (8ND)
  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const tp = termProg.value;
    const rec = recomputeVis.value;

    const terms = [
      { title: 'Forward XW', cost: '2ND', col: ROLE.params, fill: Math.min(1, tp * 3) },
      {
        title: 'Input dY Wᵀ',
        cost: '2ND',
        col: ROLE.tokens,
        fill: Math.max(0, Math.min(1, tp * 3 - 1)),
      },
      {
        title: 'Weight Xᵀ dY',
        cost: '2ND',
        col: ROLE.surface,
        fill: Math.max(0, Math.min(1, tp * 3 - 2)),
      },
      { title: 'Recompute XW', cost: '+2ND', col: ROLE.amber, fill: rec },
    ];

    const showCount = rec > 0.04 ? 4 : 3;
    const boxW = showCount === 4 ? 375 : 480;
    const gap = 36;
    const totalW = showCount * boxW + (showCount - 1) * gap;
    const startX = -totalW / 2 + boxW / 2;
    const yPos = 155;

    for (let i = 0; i < showCount; i++) {
      const tm = terms[i];
      const cx = startX + i * (boxW + gap);
      const visA = i === 3 ? rec * alpha : alpha;
      nodes.push(
        lumBar(cx, yPos, boxW, 88, {
          color: tm.col,
          fillOpacity: 0.14 + 0.26 * tm.fill,
          strokeWidth: 2.4,
          glow: tm.fill > 0.5 ? 10 : 3,
          radius: 8,
          opacity: visA,
        }),
        txt(tm.title, cx, yPos - 10, 28, COSMOS.ink, 'mono', 'center').opacity(visA),
        txt(tm.cost, cx, yPos + 24, 28, tm.col, 'mono', 'center')
          .glow(6, tm.col)
          .opacity(Math.max(0.25, tm.fill) * visA),
      );
    }

    const totalText =
      rec > 0.5
        ? 'Full activation recomputation:  6ND + 2ND = 8ND   ·   Inference: 2N / tok'
        : 'Three dense contractions across D presentations = 6ND';
    const totalCol = rec > 0.5 ? ROLE.amber : ROLE.optimal;

    nodes.push(
      txt(totalText, 0, 295, 32, totalCol, 'mono', 'center').glow(7, totalCol).opacity(alpha),
    );

    return nodes;
  });

  const eqScale = glowTex(
    '6ND \\;\\longrightarrow\\; 8ND \\quad (\\text{recompute}) \\qquad 2N \\;(\\text{infer})',
    {
      x: 0,
      y: 410,
      size: 34,
      color: ROLE.compute,
    },
  );

  s.add(cinemaAtmosphere(ROLE.tokens, ROLE.amber), title, matLayer, act1Layer, act2Layer);

  playCue(s, c, 'sl-counting-contract-0', (d) => s.play(exposureProg.to(1, { duration: d })), {
    dur: 1.5,
  });
  playCue(
    s,
    c,
    'sl-counting-contract-1',
    (d) => s.play(swapVis(act1Vis, act2Vis, Math.min(0.6, d)), termProg.to(1, { duration: d })),
    { dur: 1.8 },
  );
  c.show('sl-counting-contract-2', eqScale);
  playCue(s, c, 'sl-counting-contract-2', (d) => s.play(recomputeVis.to(1, { duration: d })), {
    dur: 1.1,
  });
}
