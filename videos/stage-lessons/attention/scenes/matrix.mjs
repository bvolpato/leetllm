// Scene 6: matrix: "One line for every word"
// Live MathJax assembly of Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V,
// computed 2x2 matrices for both rows, shape compatibility flow (and transpose bug),
// and row-wise vs column-wise softmax contrast.
import { arrow, seq } from 'vizmatic/stage';
import { COSMOS, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  COLUMN_SUMS,
  K,
  OUTPUT,
  Q,
  ROLE,
  V,
  WEIGHTS,
  cinemaAtmosphere,
  fmt,
  glowMatrix,
  lumBar,
  playCue,
  swapVis,
} from '../parts.mjs';

export default function matrix(s, c) {
  const title = heroTitle(['One line for', 'every word at once'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.sing,
  });

  // Top-right glowing MathJax formula stages (progressively swapped via phase)
  const eqStage = s.value(0); // 0=QKV, 1=QK^T, 2=/sqrt(d), 3=softmax, 4=*V
  const mainView = s.value(0); // 0=matrices, 1=both rows, 2=shapes, 3=axes, 4=multiply V

  // Matrix data formatted cleanly from model.mjs
  const qRows = Q.map((r) => r.map((x) => fmt(x, 1)));
  const kRows = K.map((r) => r.map((x) => fmt(x, 1)));
  const vRows = V.map((r) => r.map((x) => fmt(x, 0)));
  const wRows = WEIGHTS.map((r) => r.map((x) => fmt(x, 2)));
  const oRows = OUTPUT.map((r) => r.map((x) => fmt(x, 2)));

  // Phase 0/1: Q, K, V matrices + computed weights & output
  const eq1 = glowTex('Q K^{\\top}', { x: 260, y: -355, size: 54, color: ROLE.query });
  const eq2 = glowTex('\\frac{Q K^{\\top}}{\\sqrt{d_k}}', {
    x: 260,
    y: -355,
    size: 54,
    color: ROLE.query,
  });
  const eq3 = glowTex('\\operatorname{softmax}\\!\\left(\\frac{Q K^{\\top}}{\\sqrt{d_k}}\\right)', {
    x: 260,
    y: -355,
    size: 50,
    color: ROLE.sing,
  });
  const eq4 = glowTex(
    '\\operatorname{Attention}(Q,K,V)=\\operatorname{softmax}\\!\\left(\\frac{Q K^{\\top}}{\\sqrt{d_k}}\\right)V',
    { x: 185, y: -355, size: 42, color: ROLE.value },
  );

  // Dynamic lower canvas switching smoothly across the 4 structural views of this scene
  const stackVis = s.value(1);
  const bothVis = s.value(0);
  const shapeVis = s.value(0);
  const axisVis = s.value(0);
  const birdsRowHi = s.value(0);
  const singRowHi = s.value(0);
  const shapeStep = s.value(0); // 0..6 progressive shape cues
  const wrongAxisHi = s.value(0);
  const colSumHi = s.value(0);
  const vOutHi = s.value(0);

  // View A: Stacked Q, K, V matrices
  const viewStack = guardedDynamic(stackVis, (alpha) => [
    txt('Q  (queries)', -540, -145, 30, ROLE.query, 'mono', 'center').opacity(alpha),
    glowMatrix({
      cx: -540,
      cy: 35,
      values: qRows,
      rowLabels: ['Birds', 'sing'],
      colors: [
        [ROLE.query, ROLE.query],
        [ROLE.query, ROLE.query],
      ],
    }).opacity(alpha),

    txt('K  (keys)', 40, -145, 30, ROLE.birds, 'mono', 'center').opacity(alpha),
    glowMatrix({
      cx: 40,
      cy: 35,
      values: kRows,
      rowLabels: ['Birds', 'sing'],
      colors: [
        [ROLE.birds, ROLE.birds],
        [ROLE.sing, ROLE.sing],
      ],
    }).opacity(alpha),

    txt('V  (values)', 600, -145, 30, ROLE.value, 'mono', 'center').opacity(alpha),
    glowMatrix({
      cx: 600,
      cy: 35,
      values: vRows,
      rowLabels: ['Birds', 'sing'],
      colors: [
        [ROLE.value, ROLE.value],
        [ROLE.value, ROLE.value],
      ],
    }).opacity(alpha),

    txt('2 tokens × width 2', 40, 235, 30, COSMOS.muted, 'mono', 'center').opacity(alpha),
  ]);

  // View B: Both rows computed: Weights (2x2) -> Output (2x2)
  const viewBoth = guardedDynamic(bothVis, (alpha) => {
    const bHi = birdsRowHi.value > 0.5;
    const sHi = singRowHi.value > 0.5;
    return [
      txt('Attention weights A', -380, -145, 32, ROLE.sing, 'mono', 'center').opacity(alpha),
      glowMatrix({
        cx: -380,
        cy: 55,
        cellW: 155,
        cellH: 84,
        values: wRows,
        rowLabels: ['Birds', 'sing'],
        colLabels: ['Birds', 'sing'],
        colors: [
          [ROLE.birds, ROLE.sing],
          [ROLE.birds, ROLE.sing],
        ],
        highlight: (r) => (r === 0 && bHi) || (r === 1 && sHi),
        dim: (r) => (bHi && !sHi && r === 1) || (sHi && !bHi && r === 0),
      }).opacity(alpha),

      arrow([-120, 55], [40, 55], { stroke: ROLE.query, width: 4, tip: 16 }).opacity(alpha),
      txt('× V', -40, 10, 30, ROLE.value, 'mono', 'center').opacity(alpha),

      txt('Output rows O', 390, -145, 32, ROLE.query, 'mono', 'center').opacity(alpha),
      glowMatrix({
        cx: 390,
        cy: 55,
        cellW: 155,
        cellH: 84,
        values: oRows,
        rowLabels: ['Birds', 'sing'],
        colLabels: ['x₁', 'x₂'],
        colors: [
          [ROLE.query, ROLE.query],
          [ROLE.query, ROLE.query],
        ],
        highlight: (r) => (r === 0 && bHi) || (r === 1 && sHi),
        dim: (r) => (bHi && !sHi && r === 1) || (sHi && !bHi && r === 0),
      }).opacity(alpha),

      txt(
        'Birds: [0.53, 0.47] · V = [1.53, 1.47]    |    sing: [0.42, 0.58] · V = [1.42, 1.58]',
        0,
        320,
        30,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    ];
  });

  // View C: Shape compatibility pipeline (T_q × d_k) × (d_k × T_k) -> (T_q × T_k) × (T_k × d_v) -> (T_q × d_v)
  const viewShapes = guardedDynamic(shapeVis, (alpha) => {
    const st = shapeStep.value;
    const nodes = [];
    const blocks = [
      { x: -660, title: 'Q', shape: 'T_q × d_k', col: ROLE.query, on: st >= 0.5 },
      { x: -300, title: 'Kᵀ', shape: 'd_k × T_k', col: ROLE.birds, on: st >= 1.5 },
      { x: 60, title: 'Scores', shape: 'T_q × T_k', col: ROLE.sing, on: st >= 2.5 },
      { x: 420, title: 'V', shape: 'T_k × d_v', col: ROLE.value, on: st >= 5.5 },
      { x: 750, title: 'Output', shape: 'T_q × d_v', col: ROLE.query, on: st >= 5.5 },
    ];
    blocks.forEach((b) => {
      const op = (b.on ? 1 : 0.62) * alpha;
      nodes.push(
        lumBar(b.x, -10, 230, 146, {
          color: b.col,
          fillOpacity: b.on ? 0.3 : 0.16,
          strokeWidth: b.on ? 3 : 2,
          glow: b.on ? 10 : 5,
          opacity: op,
        }),
        txt(b.title, b.x, -38, 36, b.col, 'mono', 'center').opacity(op),
        txt(b.shape, b.x, 18, 28, COSMOS.ink, 'mono', 'center').opacity(op),
      );
    });
    // Connectors between blocks
    [
      [-530, -430, '×'],
      [-170, -70, '='],
      [190, 290, '×'],
      [550, 620, '='],
    ].forEach(([x1, x2, sym]) => {
      nodes.push(txt(sym, (x1 + x2) / 2, -10, 36, COSMOS.muted, 'mono', 'center').opacity(alpha));
    });

    // Bug warning when forgetting transpose (st >= 3.5 and st < 5.5)
    if (st >= 3.5 && st < 5.5) {
      nodes.push(
        lumBar(-120, 235, 1220, 134, {
          color: ROLE.mask,
          fillOpacity: 0.2,
          strokeWidth: 2.6,
          glow: 9,
          opacity: alpha,
        }),
        txt(
          'Missing transpose: (T_q × d_k) × (T_k × d_k) crashes unless T_k = d_k',
          -120,
          208,
          28,
          ROLE.mask,
          'sans',
          'center',
        ).opacity(alpha),
        txt(
          'Test with unequal T_q, T_k, d_k, d_v',
          -120,
          262,
          28,
          ROLE.query,
          'mono',
          'center',
        ).opacity(st >= 4.5 ? alpha : 0),
      );
    }

    // Value width note when multiplying by V (st >= 5.5)
    if (st >= 5.5) {
      nodes.push(
        txt(
          'd_v can differ from d_k  ·  one output row per query',
          120,
          235,
          32,
          ROLE.value,
          'mono',
          'center',
        )
          .glow(6, ROLE.value)
          .opacity(alpha),
      );
    }

    return nodes;
  });

  // View D: Softmax across rows (keys) vs columns (queries)
  const viewAxes = guardedDynamic(axisVis, (alpha) => {
    const wa = wrongAxisHi.value;
    const cs = colSumHi.value;
    const nodes = [
      txt(
        'Softmax across each row (over keys)',
        -180,
        -145,
        32,
        ROLE.value,
        'sans',
        'center',
      ).opacity(alpha),
      glowMatrix({
        cx: -180,
        cy: 55,
        cellW: 165,
        cellH: 84,
        values: wRows,
        rowLabels: ['Birds', 'sing'],
        colLabels: ['Birds', 'sing'],
        colors: [
          [ROLE.birds, ROLE.sing],
          [ROLE.birds, ROLE.sing],
        ],
        highlight: () => true,
      }).opacity(alpha),
      txt('row sum = 1.00', 140, 10, 30, ROLE.value, 'mono', 'left')
        .glow(6, ROLE.value)
        .opacity(alpha),
      txt('row sum = 1.00', 140, 105, 30, ROLE.value, 'mono', 'left')
        .glow(6, ROLE.value)
        .opacity(alpha),
    ];

    if (wa > 0.05) {
      nodes.push(
        txt(
          '✗ Softmax over queries silently computes the wrong op',
          430,
          275,
          28,
          ROLE.mask,
          'sans',
          'center',
        ).opacity(wa * alpha),
      );
    }
    if (cs > 0.05) {
      nodes.push(
        txt(
          `col sums: ${fmt(COLUMN_SUMS[0], 2)}   ${fmt(COLUMN_SUMS[1], 2)}   (need not equal 1)`,
          -180,
          250,
          30,
          ROLE.query,
          'mono',
          'center',
        )
          .glow(6, ROLE.query)
          .opacity(cs * alpha),
      );
    }
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.sing, ROLE.value), title, viewStack, viewBoth, viewShapes, viewAxes);

  // Beat 0: Stack vectors into Q, K, V
  playCue(s, c, 'stack', (d) => s.play(stackVis.to(1, { duration: d })), { dur: 0.4 });

  // Beat 1: Assemble the equation term by term
  c.show('qk', eq1);
  c.swap('root-d', eq1, eq2);
  c.swap('softmax-rows', eq2, eq3);
  c.swap('times-v', eq3, eq4);
  playCue(s, c, 'one-line', (d) => s.play(eqStage.to(4, { duration: d })), { dur: 0.35 });

  // Beat 2: Run both rows through Attention(Q, K, V)
  playCue(s, c, 'both-rows', (d) => s.play(swapVis(stackVis, bothVis, d)), { dur: 0.7 });
  playCue(s, c, 'birds-row', (d) => s.play(birdsRowHi.to(1, { duration: d })), { dur: 0.5 });
  playCue(
    s,
    c,
    'sing-row',
    (d) => s.play(birdsRowHi.to(0, { duration: d * 0.4 }), singRowHi.to(1, { duration: d * 0.6 })),
    { dur: 0.55 },
  );

  // Beat 3: Shapes & transpose trap
  playCue(s, c, 'shapes', (d) => s.play(swapVis(bothVis, shapeVis, d)), { dur: 0.65 });
  playCue(s, c, 'q-rows', (d) => s.play(shapeStep.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'k-rows', (d) => s.play(shapeStep.to(1.4, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'widths', (d) => s.play(shapeStep.to(1.7, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'transpose', (d) => s.play(shapeStep.to(2.0, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'rows-cols', (d) => s.play(shapeStep.to(2.3, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'every-key', (d) => s.play(shapeStep.to(2.7, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'score-grid', (d) => s.play(shapeStep.to(3.1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'crash', (d) => s.play(shapeStep.to(3.8, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'same-size', (d) => s.play(shapeStep.to(4.2, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'unequal', (d) => s.play(shapeStep.to(4.8, { duration: d })), { dur: 0.35 });

  // Beat 4: Softmax across rows vs queries + column sums
  playCue(s, c, 'across', (d) => s.play(swapVis(shapeVis, axisVis, d)), { dur: 0.6 });
  playCue(s, c, 'wrong-axis', (d) => s.play(wrongAxisHi.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'rows-one', (d) => s.play(wrongAxisHi.to(0.5, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'columns', (d) => s.play(colSumHi.to(1, { duration: d })), { dur: 0.55 });

  // Beat 5: Multiply by V -> (T_q x d_v)
  playCue(
    s,
    c,
    'multiply-v',
    (d) =>
      s.play(
        seq(
          axisVis.to(0, { duration: d * 0.42 }),
          shapeStep.to(6, { duration: 0.02 }),
          shapeVis.to(1, { duration: d * 0.54 }),
        ),
      ),
    { dur: 0.65 },
  );
  playCue(s, c, 'one-output', (d) => s.play(vOutHi.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'width-note', (d) => s.play(mainView.to(4, { duration: d })), { dur: 0.4 });
}
