// Scene 23: nested-loss - "Train the selected prefixes rather than merely cutting them"
// Pure Cinema: View 1 shows 6-d Q & D embeddings; View 2 fans them into 3 nested Matryoshka lanes
// (widths 2, 4, 6) computing separate L2 norms, 2x2 cosine matrices, and losses (0.0088 / 0.0147 / 0.0225);
// View 3 compares 10M float32 payload (2.56 GB vs 30.72 GB) above a visual shortlist gate.
import { arrow } from 'vizmatic/stage';
import {
  COSMOS,
  NESTED_D,
  NESTED_Q,
  ROLE,
  cinemaAtmosphere,
  finiteUnit,
  glowMatrix,
  guardedDynamic,
  heroTitle,
  lumBar,
  nestedLoss,
  playAfter,
  playOn,
  rule,
  swapVis,
  txt,
  verifyApprox,
} from '../parts.mjs';

export default function nestedLossScene(s, c) {
  const widths = [2, 4, 6];
  const losses = widths.map(nestedLoss);
  const meanLoss = losses.reduce((a, b) => a + b, 0) / losses.length;

  const laneData = widths.map((w, idx) => {
    const q = NESTED_Q.map((r) => r.slice(0, w));
    const d = NESTED_D.map((r) => r.slice(0, w));
    const qn = q.map(finiteUnit);
    const dn = d.map(finiteUnit);
    const cos = qn.map((v) => dn.map((u) => v.reduce((acc, x, j) => acc + x * u[j], 0)));
    return {
      width: w,
      qNorms: q.map((v) => Math.hypot(...v).toFixed(2)),
      dNorms: d.map((v) => Math.hypot(...v).toFixed(2)),
      cos,
      loss: losses[idx],
    };
  });

  verifyApprox(meanLoss, 0.0153, 0.0002, 'Matryoshka mean loss ~0.0153');

  const vRaw = s.value(1);
  const vLanes = s.value(0);
  const vSearch = s.value(0);
  const showNorm = s.value(0);
  const showCos = s.value(0);
  const showL2 = s.value(0);
  const showL4 = s.value(0);
  const showL6 = s.value(0);
  const showMean = s.value(0);
  const showBytes = s.value(0);
  const showMissing = s.value(0);

  const title = heroTitle(['Matryoshka training:', 'supervise every nested prefix'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.anchor,
  });

  // View 1: Full 6-coordinate Q and D embeddings before slicing
  const rawLayer = guardedDynamic(vRaw, (alpha) => [
    txt(
      'FULL 6-DIMENSIONAL EMBEDDINGS  (Q & D)',
      0,
      -245,
      30,
      ROLE.anchor,
      'mono',
      'center',
    ).opacity(alpha),
    glowMatrix({
      cx: -435,
      cy: 20,
      rows: 2,
      cols: 6,
      cellW: 112,
      cellH: 92,
      gap: 10,
      values: NESTED_Q.map((r) => r.map((v) => v.toFixed(2))),
      rowLabels: ['qA', 'qB'],
      colLabels: ['1', '2', '3', '4', '5', '6'],
      colors: NESTED_Q.map(() => [
        ROLE.anchor,
        ROLE.anchor,
        ROLE.unrelated,
        ROLE.unrelated,
        ROLE.violet,
        ROLE.violet,
      ]),
      fontSize: 28,
      opacity: alpha,
    }),
    glowMatrix({
      cx: 455,
      cy: 20,
      rows: 2,
      cols: 6,
      cellW: 112,
      cellH: 92,
      gap: 10,
      values: NESTED_D.map((r) => r.map((v) => v.toFixed(2))),
      rowLabels: ['dA', 'dB'],
      colLabels: ['1', '2', '3', '4', '5', '6'],
      colors: NESTED_D.map(() => [
        ROLE.positive,
        ROLE.positive,
        ROLE.unrelated,
        ROLE.unrelated,
        ROLE.violet,
        ROLE.violet,
      ]),
      fontSize: 28,
      opacity: alpha,
    }),
    txt(
      'Color bands mark nested prefix widths:  d = 2 (front)  ⊂  d = 4  ⊂  d = 6 (full)',
      0,
      290,
      30,
      COSMOS.muted,
      'sans',
      'center',
    ).opacity(alpha),
  ]);

  // View 2: 3 Parallel Matryoshka Prefix Lanes (width 2, 4, 6)
  const lanesLayer = guardedDynamic(vLanes, (alpha) => {
    const sn = showNorm.value;
    const sc = showCos.value;
    const lsVals = [showL2.value, showL4.value, showL6.value];
    const sm = showMean.value;
    const nodes = [];
    const ys = [-210, 0, 210];
    const cols = [ROLE.anchor, ROLE.unrelated, ROLE.violet];

    laneData.forEach((ld, i) => {
      const y = ys[i];
      const col = cols[i];
      nodes.push(
        lumBar(-745, y, 185, 72, {
          color: col,
          fillAlpha: 0.24,
          glow: 8,
          radius: 10,
          opacity: alpha,
        }),
        txt(`width ${ld.width}`, -745, y, 30, col, 'mono', 'center').opacity(alpha),
        arrow([-640, y], [-545, y], { stroke: '#6279ad', width: 2.8, tip: 10 }).opacity(alpha),
      );

      // Prefix L2 normalization column
      if (sn > 0.05) {
        nodes.push(
          txt(
            `q ÷ [${ld.qNorms.join(', ')}]`,
            -310,
            y - 22,
            28,
            ROLE.anchor,
            'mono',
            'center',
          ).opacity(sn * alpha),
          txt(
            `d ÷ [${ld.dNorms.join(', ')}]`,
            -310,
            y + 22,
            28,
            ROLE.positive,
            'mono',
            'center',
          ).opacity(sn * alpha),
        );
      } else {
        nodes.push(
          txt('normalize prefix', -310, y, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
        );
      }

      nodes.push(
        arrow([-95, y], [10, y], { stroke: '#6279ad', width: 2.8, tip: 10 }).opacity(alpha),
      );

      // 2x2 Cosine matrix
      nodes.push(
        glowMatrix({
          cx: 215,
          cy: y,
          rows: 2,
          cols: 2,
          cellW: 118,
          cellH: 52,
          gap: 10,
          values:
            sc > 0.3
              ? ld.cos.map((r) => r.map((v) => v.toFixed(3)))
              : [
                  ['·', '·'],
                  ['·', '·'],
                ],
          colors: [
            [ROLE.positive, ROLE.competitor],
            [ROLE.competitor, ROLE.positive],
          ],
          highlight: (r, k) => sc > 0.3 && r === k,
          fontSize: 26,
          opacity: alpha,
        }),
        arrow([380, y], [490, y], { stroke: '#6279ad', width: 2.8, tip: 10 }).opacity(alpha),
        txt(`L_${ld.width}`, 570, y - 24, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      );

      if (lsVals[i] > 0.05) {
        nodes.push(
          txt(ld.loss.toFixed(4), 680, y + 18, 36, ROLE.focus, 'mono', 'left')
            .glow(7, ROLE.focus)
            .opacity(lsVals[i] * alpha),
        );
      }
    });

    nodes.push(rule(-850, 320, 850, 320, COSMOS.rule, 1.6).opacity(0.55 * alpha));
    if (sm > 0.05) {
      nodes.push(
        txt(
          `Equal-weighted Matryoshka loss:  (L₂ + L₄ + L₆) / 3  =  ${meanLoss.toFixed(4)}`,
          0,
          380,
          36,
          ROLE.focus,
          'mono',
          'center',
        )
          .glow(8, ROLE.focus)
          .opacity(sm * alpha),
      );
    } else {
      nodes.push(
        txt(
          'Each prefix width computes its own normalized InfoNCE loss (τ = 0.20)',
          0,
          380,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }
    return nodes;
  });

  // View 3: 10M Float32 Storage Bars + Hierarchical Shortlist Gate
  const searchLayer = guardedDynamic(vSearch, (alpha) => {
    const sb = showBytes.value;
    const sm = showMissing.value;
    const barLeft = -780;
    const fullW = 1140;
    const narrowW = (64 / 768) * fullW;
    const nodes = [
      txt(
        '10M FLOAT32 VECTORS: RAW PAYLOAD (WIDTH 64 vs 768)',
        0,
        -290,
        28,
        ROLE.anchor,
        'mono',
        'center',
      ).opacity(alpha),
      // Narrow 64-d track & bar
      lumBar(barLeft + fullW / 2, -185, fullW, 48, {
        color: '#33456e',
        fillAlpha: 0.14,
        strokeWidth: 1.4,
        glow: 0,
        opacity: alpha,
      }),
      lumBar(barLeft + fullW / 2, -65, fullW, 48, {
        color: '#33456e',
        fillAlpha: 0.14,
        strokeWidth: 1.4,
        glow: 0,
        opacity: alpha,
      }),
    ];

    if (sb > 0.05) {
      nodes.push(
        lumBar(barLeft + (narrowW * sb) / 2, -185, Math.max(8, narrowW * sb), 48, {
          color: ROLE.anchor,
          fillAlpha: 0.55,
          glow: 9,
          opacity: sb * alpha,
        }),
        txt('64-d:  2.56 GB raw', barLeft + narrowW + 26, -185, 32, ROLE.anchor, 'mono', 'left')
          .glow(5, ROLE.anchor)
          .opacity(sb * alpha),
        lumBar(barLeft + (fullW * sb) / 2, -65, Math.max(8, fullW * sb), 48, {
          color: ROLE.unrelated,
          fillAlpha: 0.45,
          glow: 8,
          opacity: sb * alpha,
        }),
        txt(
          '768-d:  30.72 GB raw',
          barLeft + fullW + 26,
          -65,
          32,
          ROLE.unrelated,
          'mono',
          'left',
        ).opacity(sb * alpha),
      );
    }

    // Hierarchical shortlist gate below
    nodes.push(
      rule(-850, 22, 850, 22, COSMOS.rule, 1.6).opacity(0.55 * alpha),
      lumBar(-380, 175, 760, 185, {
        color: ROLE.focus,
        fillAlpha: 0.1,
        strokeWidth: 2.8,
        glow: 8,
        radius: 14,
        opacity: alpha,
      }),
      txt(
        'SHORT-PREFIX SHORTLIST  (RESCORED AT 768-d)',
        -380,
        125,
        26,
        ROLE.focus,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'd₁,  d₂   ->   full-width rescoring',
        -380,
        195,
        34,
        ROLE.positive,
        'mono',
        'center',
      ).opacity(alpha),
      txt('OUTSIDE SHORTLIST', 430, 125, 26, ROLE.competitor, 'mono', 'center').opacity(alpha),
      txt('required d₃ stays omitted', 430, 195, 34, ROLE.competitor, 'sans', 'center')
        .glow(sm > 0.3 ? 8 : 0, ROLE.competitor)
        .opacity(alpha),
    );

    if (sm > 0.05) {
      nodes.push(
        txt(
          'Full-width rescoring cannot rescue an omitted passage · IDs, graph links, and full vectors add storage',
          0,
          365,
          28,
          ROLE.competitor,
          'sans',
          'center',
        ).opacity(sm * alpha),
      );
    }
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.violet), title, rawLayer, lanesLayer, searchLayer);

  playOn(s, c, 'cl-nested-loss-slice', (d) => swapVis(vRaw, vLanes, d), 0.65);
  playAfter(s, c, 'repair-nested-normalize', (d) => showNorm.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'cl-nested-loss-loss', (d) => showCos.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'cl-nested-loss-two', (d) => showL2.to(1, { duration: d }), 0.35);
  playAfter(s, c, 'cl-nested-loss-four', (d) => showL4.to(1, { duration: d }), 0.35);
  playAfter(s, c, 'cl-nested-loss-six', (d) => showL6.to(1, { duration: d }), 0.35);
  playAfter(s, c, 'cl-nested-loss-mean', (d) => showMean.to(1, { duration: d }), 0.45);

  playOn(s, c, 'repair-nested-search', (d) => swapVis(vLanes, vSearch, d), 0.7);
  playAfter(s, c, 'cl-nested-loss-bytes', (d) => showBytes.to(1, { duration: d }), 0.65);
  playOn(s, c, 'cl-nested-loss-missing', (d) => showMissing.to(1, { duration: d }), 0.5);
}
