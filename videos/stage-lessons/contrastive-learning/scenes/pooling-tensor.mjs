// Scene 3: pooling-tensor - "Which tokens enter the mean?"
// Pure Cinema: two luminous 3x2 token-state grids masking padding [99,99], computing masked means,
// normalizing into unit Q and unit P^T, forming the 2x2 InfoNCE score matrix, and revealing exact gradients.
import { arrow, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  comparisonRow,
  finiteUnit,
  glowMatrix,
  guardedDynamic,
  heroTitle,
  maskedMean,
  playAfter,
  playOn,
  rule,
  txt,
  verifyApprox,
} from '../parts.mjs';

export default function poolingTensor(s, c) {
  const states = [
    [
      [1, 0],
      [0, 1],
      [99, 99],
    ],
    [
      [0, 2],
      [0, 0],
      [99, 99],
    ],
  ];
  const masks = [
    [1, 1, 0],
    [1, 0, 0],
  ];
  const means = states.map((v, i) => maskedMean(v, masks[i]));
  const qUnit = means.map(finiteUnit);
  const pT = [
    [1, 0],
    [0, 1],
  ];
  const cosines = qUnit.map((row) => pT.map((_, col) => row[0] * pT[0][col] + row[1] * pT[1][col]));
  const loss = qUnit.reduce((sum, v, i) => sum + comparisonRow(v, 0.2, i).loss, 0) / qUnit.length;
  const deriv = 5 / (4 * Math.sqrt(2));

  verifyApprox(loss, 0.349931, 1e-5, 'pooling-tensor two-row mean loss');
  verifyApprox(deriv, 0.883883, 1e-5, 'pooling-tensor first-token derivative');

  const maskedOn = s.value(0);
  const sumLit = s.value(0);
  const showMean = s.value(0);
  const showNorm = s.value(0);
  const showMat = s.value(0);
  const showLoss = s.value(0);
  const showGrad = s.value(0);

  const title = heroTitle(['Masked mean pooling', 'and the 2 × 2 InfoNCE score grid'], {
    x: -860,
    y: -450,
    size: 44,
    lineHeight: 52,
    accent: ROLE.anchor,
  });

  const stageLayer = guardedDynamic(s.value(1), () => {
    const mk = maskedOn.value;
    const sl = sumLit.value;
    const mn = showMean.value;
    const nm = showNorm.value;
    const mt = showMat.value;
    const ls = showLoss.value;
    const gd = showGrad.value;
    const nodes = [];

    // Top row: Token-state matrices A and B + Masked means readout
    const topY = -175;
    const gridA = glowMatrix({
      cx: -555,
      cy: topY,
      rows: 3,
      cols: 2,
      cellW: 112,
      cellH: 56,
      gap: 10,
      values: states[0].map((r) => r.map((x) => String(x))),
      rowLabels: ['tok 1', 'tok 2', mk > 0.3 ? 'pad (off)' : 'pad'],
      colLabels: ['A: d₁', 'd₂'],
      colors: [
        [ROLE.anchor, ROLE.anchor],
        [ROLE.anchor, ROLE.anchor],
        [ROLE.competitor, ROLE.competitor],
      ],
      highlight: (r) => sl > 0.3 && masks[0][r] === 1,
      dim: (r) => mk > 0.3 && masks[0][r] === 0,
      fontSize: 28,
    });
    const gridB = glowMatrix({
      cx: -105,
      cy: topY,
      rows: 3,
      cols: 2,
      cellW: 112,
      cellH: 56,
      gap: 10,
      values: states[1].map((r) => r.map((x) => String(x))),
      rowLabels: ['tok 1', mk > 0.3 ? 'pad (off)' : 'pad', mk > 0.3 ? 'pad (off)' : 'pad'],
      colLabels: ['B: d₁', 'd₂'],
      colors: [
        [ROLE.violet, ROLE.violet],
        [ROLE.competitor, ROLE.competitor],
        [ROLE.competitor, ROLE.competitor],
      ],
      highlight: (r) => sl > 0.3 && masks[1][r] === 1,
      dim: (r) => mk > 0.3 && masks[1][r] === 0,
      fontSize: 28,
    });
    nodes.push(gridA, gridB);

    // Top-right: Masked means
    const meanX = 240;
    nodes.push(
      arrow([65, topY], [190, topY], { stroke: '#6279ad', width: 3, tip: 12 }),
      txt('MASKED MEANS', meanX, topY - 82, 26, COSMOS.muted, 'mono', 'left'),
    );
    if (mn > 0.05) {
      nodes.push(
        txt('A:  Σ / 2  =  [0.50, 0.50]', meanX, topY - 22, 32, ROLE.anchor, 'mono', 'left')
          .glow(5, ROLE.anchor)
          .opacity(mn),
        txt('B:  Σ / 1  =  [0.00, 2.00]', meanX, topY + 34, 32, ROLE.violet, 'mono', 'left')
          .glow(5, ROLE.violet)
          .opacity(mn),
        txt(
          'padding excluded before sum',
          meanX,
          topY + 86,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(mn),
      );
    } else {
      nodes.push(
        txt('sum valid states ÷ valid count', meanX, topY, 28, COSMOS.dim, 'mono', 'left'),
      );
    }

    // Horizontal hairline separator
    nodes.push(rule(-855, -24, 855, -24, COSMOS.rule, 1.8).opacity(0.6));

    // Bottom row: unit Q  ×  unit P^T  =  2x2 Cosines  ->  Loss & Gradients
    const botY = 175;
    nodes.push(
      glowMatrix({
        cx: -665,
        cy: botY,
        rows: 2,
        cols: 2,
        cellW: 112,
        cellH: 64,
        gap: 10,
        values:
          nm > 0.3
            ? qUnit.map((r) => r.map((v) => v.toFixed(2)))
            : [
                ['?', '?'],
                ['?', '?'],
              ],
        rowLabels: ['qA', 'qB'],
        colLabels: ['unit Q', ''],
        colors: [
          [ROLE.anchor, ROLE.anchor],
          [ROLE.violet, ROLE.violet],
        ],
        highlight: () => nm > 0.3,
        fontSize: 28,
      }),
      txt('×', -490, botY, 42, COSMOS.muted, 'mono', 'center'),
      glowMatrix({
        cx: -315,
        cy: botY,
        rows: 2,
        cols: 2,
        cellW: 112,
        cellH: 64,
        gap: 10,
        values:
          nm > 0.3
            ? pT.map((r) => r.map((v) => v.toFixed(2)))
            : [
                ['?', '?'],
                ['?', '?'],
              ],
        colLabels: ['unit Pᵀ', ''],
        colors: [
          [ROLE.positive, ROLE.unrelated],
          [ROLE.unrelated, ROLE.positive],
        ],
        highlight: (r, k) => nm > 0.3 && r === k,
        fontSize: 28,
      }),
      txt('=', -140, botY, 42, COSMOS.muted, 'mono', 'center'),
      glowMatrix({
        cx: 45,
        cy: botY,
        rows: 2,
        cols: 2,
        cellW: 118,
        cellH: 64,
        gap: 10,
        values:
          mt > 0.3
            ? cosines.map((r) => r.map((v) => v.toFixed(2)))
            : [
                ['·', '·'],
                ['·', '·'],
              ],
        rowLabels: [],
        colLabels: ['pA', 'pB'],
        colors: [
          [ROLE.positive, ROLE.competitor],
          [ROLE.competitor, ROLE.positive],
        ],
        highlight: (r, k) => mt > 0.3 && r === k,
        fontSize: 28,
      }),
    );

    // Bottom-right: InfoNCE Loss & Backpropagated Token Gradients
    const resX = 275;
    nodes.push(txt('INFONCE  (τ = 0.20)', resX, botY - 108, 26, COSMOS.muted, 'mono', 'left'));
    if (ls > 0.05) {
      nodes.push(
        txt(`mean CE = ${loss.toFixed(6)}`, resX, botY - 52, 34, ROLE.focus, 'mono', 'left')
          .glow(7, ROLE.focus)
          .opacity(ls),
      );
    } else {
      nodes.push(
        txt('diagonal targets: (A, pA), (B, pB)', resX, botY - 52, 26, COSMOS.dim, 'mono', 'left'),
      );
    }

    if (gd > 0.05) {
      nodes.push(
        txt(
          `∇ A tok 1:  [-${deriv.toFixed(4)}, +${deriv.toFixed(4)}]`,
          resX,
          botY + 26,
          28,
          ROLE.anchor,
          'mono',
          'left',
        )
          .glow(5, ROLE.anchor)
          .opacity(gd),
        txt(
          '∇ masked padding:  [0.0000, 0.0000]',
          resX,
          botY + 78,
          28,
          ROLE.positive,
          'mono',
          'left',
        )
          .glow(5, ROLE.positive)
          .opacity(gd),
      );
    }

    // Bottom note
    nodes.push(
      txt(
        'Empty mask -> no mean   ·   Zero or nonfinite vector -> no unit direction',
        0,
        395,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.violet), title, stageLayer);

  playOn(s, c, 'cl-pooling-tensor-mask', (d) => maskedOn.to(1, { duration: d }), 0.65);
  playOn(s, c, 'cl-pooling-tensor-sum', (d) => sumLit.to(1, { duration: d }), 0.55);
  playAfter(s, c, 'cl-pooling-tensor-mean', (d) => showMean.to(1, { duration: d }), 0.55);
  playAfter(s, c, 'cl-pooling-tensor-norm', (d) => showNorm.to(1, { duration: d }), 0.55);
  playOn(s, c, 'cl-pooling-tensor-matrix', (d) => showMat.to(1, { duration: d }), 1.2);
  playAfter(s, c, 'cl-pooling-tensor-loss', (d) => showLoss.to(1, { duration: d }), 0.5);
  playAfter(s, c, 'cl-pooling-tensor-gradient', (d) => showGrad.to(1, { duration: d }), 0.55);
}
