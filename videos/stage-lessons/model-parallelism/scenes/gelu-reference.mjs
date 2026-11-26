// Scene 08: Check the layer against a dense multiply. x=[1,2], GeLU(xA)B + b -> strict hold on -1 sign weight -> compare Dense vs Sum vs Mean vs 2xBias.
import {
  COSMOS,
  DENSE_REF,
  MP_DUP_BIAS,
  MP_MEAN,
  ROLE,
  aura,
  fmtFixed,
  fmtVec,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  mpReference,
  rect,
  remainAfterDuration,
  remainBeatDuration,
  remainDuration,
  runPhase,
  swapViews,
  txt,
} from '../parts.mjs';

export default function geluReference(s, c) {
  const phase = s.value(0);
  const showMat = s.value(1);
  const showRows = s.value(0);
  const showCheck = s.value(0);

  const pCols = s.value(0);
  const pExp = s.value(0);
  const pAct = s.value(0);
  const pProj = s.value(0);
  const pSigned = s.value(0);
  const pBias = s.value(0);
  const pOut = s.value(0);
  const pMean = s.value(0);
  const pDup = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#6ee7b716');
  const title = heroTitle(['Check the Layer Against', 'a Dense Multiply'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'FLOAT64 REFERENCE · GeLU(xA)B + b',
  });

  const matView = guardedDynamic(showMat, (a) => {
    const proj = pProj.value > 0.5;
    const exp = pExp.value > 0.5;
    const act = pAct.value > 0.5;
    const cols = pCols.value > 0.3;

    const nodes = [
      txt(
        proj
          ? 'EACH GPU KEEPS ITS GeLU FEATURES · MULTIPLY BY MATCHING ROWS OF B'
          : 'REPLICATED INPUT x = [1, 2] · COLUMN SHARDS OF A',
        0,
        -205,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    [0, 1].forEach((rank) => {
      const cx = rank === 0 ? -430 : 430;
      const col = rank === 0 ? ROLE.gpu0 : ROLE.gpu1;
      const start = rank * 2;
      const mat = proj
        ? mpReference.B.slice(start, start + 2)
        : mpReference.A.map((r) => r.slice(start, start + 2));

      nodes.push(
        txt(
          `GPU ${rank}  ·  ${proj ? 'Rows of B' : 'Columns of A'}`,
          cx,
          -130,
          28,
          col,
          'mono',
        ).opacity(a),
        glassCell(cx, -10, 320, 185, cols ? col : COSMOS.dim, {
          fill: rank === 0 ? '#10213d' : '#0e2b38',
          glow: 7,
          opacity: a,
        }),
      );
      mat.forEach((rowVals, r) => {
        rowVals.forEach((v, j) => {
          const rx = cx - 64 + j * 128;
          const ry = -50 + r * 84;
          nodes.push(
            rect(98, 66, { fill: '#0b1426', stroke: col, width: 2.0, radius: 8 })
              .at(rx, ry)
              .opacity(a),
            txt(String(v).replace('-', '−'), rx, ry, 34, COSMOS.ink, 'mono').opacity(a),
          );
        });
      });

      const xSlice = mpReference.expansion.slice(start, start + 2);
      const hSlice = mpReference.hidden.slice(start, start + 2);
      nodes.push(
        txt(
          exp ? `xA${rank} = ${fmtVec(xSlice, 0)}` : `xA${rank} = [ · , · ]`,
          cx,
          142,
          30,
          exp ? col : COSMOS.dim,
          'mono',
        ).opacity(a),
        txt(
          act ? `GeLU ≈ ${fmtVec(hSlice, 2)}` : 'GeLU = [ · , · ]',
          cx,
          210,
          30,
          act ? ROLE.good : COSMOS.dim,
          'mono',
        ).opacity(a),
      );
    });

    nodes.push(
      txt(
        proj
          ? 'Predict: which weight in B1 gives GPU 1 output 1 its sign?'
          : 'Elementwise GeLU runs locally on complete column outputs',
        0,
        325,
        28,
        proj ? COSMOS.gold : COSMOS.muted,
        'sans',
      ).opacity(a),
      glowDot(-740 + ((phase.value * 0.55) % 1) * 1480, 415, {
        radius: 6,
        color: ROLE.gpu1,
        opacity: a,
      }),
    );
    return group(...nodes);
  });

  const rowsView = guardedDynamic(showRows, (a) => {
    const sg = pSigned.value > 0.5;
    const bs = pBias.value > 0.5;
    const ot = pOut.value > 0.5;
    const rowsData = [
      { label: 'GPU 0 partial (h0 B0)', vals: mpReference.partials[0], vis: true, col: ROLE.gpu0 },
      {
        label: 'GPU 1 partial (weight −1)',
        vals: mpReference.partials[1],
        vis: sg,
        col: ROLE.gpu1,
      },
      { label: 'Output bias b (added once)', vals: mpReference.bias, vis: bs, col: COSMOS.gold },
      { label: 'Sharded sum + one bias', vals: mpReference.output, vis: ot, col: ROLE.good },
    ];

    const nodes = [
      txt('OUTPUT 1', 160, -195, 28, COSMOS.ink, 'mono').opacity(a),
      txt('OUTPUT 2', 560, -195, 28, COSMOS.ink, 'mono').opacity(a),
    ];

    rowsData.forEach((rw, i) => {
      const y = -95 + i * 112;
      nodes.push(
        glassCell(0, y, 1580, 88, rw.vis ? rw.col : COSMOS.dim, {
          fill: rw.vis ? '#0f1c32' : '#0b1020',
          glow: rw.vis ? 7 : 2,
          opacity: a,
        }),
        txt(rw.label, -740, y, 30, rw.vis ? rw.col : COSMOS.dim, 'sans', 'left').opacity(a),
        txt(
          rw.vis ? fmtFixed(rw.vals[0], 4) : '?',
          160,
          y,
          38,
          rw.vis ? rw.col : COSMOS.dim,
          'mono',
        ).opacity(a),
        txt(
          rw.vis ? fmtFixed(rw.vals[1], 4) : '?',
          560,
          y,
          38,
          rw.vis ? rw.col : COSMOS.dim,
          'mono',
        ).opacity(a),
      );
    });

    nodes.push(
      txt(
        'Values shown rounded to 4 decimal places · float64 precision underneath',
        0,
        355,
        26,
        COSMOS.muted,
        'mono',
      ).opacity(a),
    );
    return group(...nodes);
  });

  const checkView = guardedDynamic(showCheck, (a) => {
    const mn = pMean.value > 0.5;
    const dp = pDup.value > 0.5;
    const rowsData = [
      { label: 'Dense float64 reference', vals: DENSE_REF, vis: true, col: COSMOS.ink, tag: 'REF' },
      {
        label: 'Sharded sum + one bias',
        vals: mpReference.output,
        vis: true,
        col: ROLE.good,
        tag: 'MATCH',
      },
      {
        label: 'Faulty: mean + one bias',
        vals: MP_MEAN.output,
        vis: mn,
        col: ROLE.bad,
        tag: 'HALVED',
      },
      {
        label: 'Faulty: sum + two biases',
        vals: MP_DUP_BIAS.output,
        vis: dp,
        col: ROLE.bad,
        tag: '±0.5 ERR',
      },
    ];

    const nodes = [
      txt('OUTPUT 1', 80, -195, 28, COSMOS.ink, 'mono').opacity(a),
      txt('OUTPUT 2', 420, -195, 28, COSMOS.ink, 'mono').opacity(a),
      txt('CHECK', 690, -195, 28, COSMOS.ink, 'mono').opacity(a),
    ];

    rowsData.forEach((rw, i) => {
      const y = -95 + i * 112;
      nodes.push(
        glassCell(0, y, 1620, 88, rw.vis ? rw.col : COSMOS.dim, {
          fill: rw.vis ? (rw.col === ROLE.bad ? '#2a111f' : '#0f1c32') : '#0b1020',
          glow: rw.vis ? 8 : 2,
          opacity: a,
        }),
        txt(rw.label, -765, y, 28, rw.vis ? rw.col : COSMOS.dim, 'sans', 'left').opacity(a),
        txt(
          rw.vis ? fmtFixed(rw.vals[0], 4) : '?',
          80,
          y,
          36,
          rw.vis ? rw.col : COSMOS.dim,
          'mono',
        ).opacity(a),
        txt(
          rw.vis ? fmtFixed(rw.vals[1], 4) : '?',
          420,
          y,
          36,
          rw.vis ? rw.col : COSMOS.dim,
          'mono',
        ).opacity(a),
        txt(rw.vis ? rw.tag : '·', 690, y, 28, rw.vis ? rw.col : COSMOS.dim, 'mono').opacity(a),
      );
    });

    nodes.push(
      txt(
        'Validate rank count, hidden dimension match, sum reduction, and single bias',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
      glowDot(-740 + ((phase.value * 0.55) % 1) * 1480, 415, {
        radius: 6,
        color: ROLE.good,
        opacity: a,
      }),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, matView, rowsView, checkView);
  runPhase(s, c, phase, 14);

  c.on('expansion-columns', () =>
    s.play(pCols.to(1, { duration: remainDuration(c, 'expansion-columns', 0.4) })),
  );
  c.after('expanded', () =>
    s.play(pExp.to(1, { duration: remainAfterDuration(c, 'expanded', 0.4) })),
  );
  c.after('activated', () =>
    s.play(pAct.to(1, { duration: remainAfterDuration(c, 'activated', 0.4) })),
  );
  c.on('projection-rows', () =>
    s.play(pProj.to(1, { duration: remainDuration(c, 'projection-rows', 0.45) })),
  );
  c.onBeat(2, () => {
    const d = Math.min(0.16, remainBeatDuration(c, 2, 0.16));
    swapViews(s, showMat, showRows, d, d);
  });
  c.after('signed-partial', () =>
    s.play(pSigned.to(1, { duration: remainAfterDuration(c, 'signed-partial', 0.4) })),
  );
  c.on('add-bias', () => s.play(pBias.to(1, { duration: remainDuration(c, 'add-bias', 0.4) })));
  c.after('gelu-output', () =>
    s.play(pOut.to(1, { duration: remainAfterDuration(c, 'gelu-output', 0.4) })),
  );
  c.onBeat(3, () => {
    const d = Math.min(0.16, remainBeatDuration(c, 3, 0.16));
    swapViews(s, showRows, showCheck, d, d);
  });
  c.after('test-mean', () =>
    s.play(pMean.to(1, { duration: remainAfterDuration(c, 'test-mean', 0.4) })),
  );
  c.after('test-bias', () =>
    s.play(pDup.to(1, { duration: remainAfterDuration(c, 'test-bias', 0.4) })),
  );
}
