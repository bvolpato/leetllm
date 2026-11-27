// Scene 06: Row shards produce contributions that must sum. Partial vectors [1,2,0,1] + [0,2,6,4] -> [1,4,6,5], then ReLU non-linearity proof.
import {
  COSMOS,
  ROLE,
  SHARDS,
  W,
  X,
  aura,
  glassCell,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainBeatDuration,
  remainDuration,
  swapViews,
  txt,
} from '../parts.mjs';

export default function row(s, c) {
  const showPartials = s.value(1);
  const showRelu = s.value(0);
  const pSplit = s.value(0);
  const pInc = s.value(0);
  const pSum = s.value(0);
  const pAR = s.value(0);
  const pGoodRelu = s.value(0);
  const pBadRelu = s.value(0);

  const partials = W.map((rowVals, i) => rowVals.map((v) => v * X[0][i]));

  const bgAura = aura(0, 20, 620, '#a78bfa1c', '#6ee7b716');
  const title = heroTitle(['Row Shards Produce', 'Partials That Must Sum'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.expert,
    eyebrow: 'MEGATRON ROW-PARALLEL · COLLECTIVE REDUCTION',
  });

  const eqGood = glowTex('\\operatorname{ReLU}([3,-2]+[-1,4]) = [2,\\, 2]', {
    x: 0,
    y: -40,
    size: 46,
    color: ROLE.good,
  });
  const eqBad = glowTex('\\operatorname{ReLU}([3,-2]) + \\operatorname{ReLU}([-1,4]) = [3,\\, 4]', {
    x: 0,
    y: 170,
    size: 46,
    color: ROLE.bad,
  });

  const partialsView = guardedDynamic(showPartials, (a) => {
    const inc = pInc.value > 0.5;
    const sumProg = pSum.value;
    const ar = pAR.value > 0.5;
    const activeCoord = Math.min(3, Math.floor(sumProg * 4));

    const nodes = [
      txt('GPU 0  ·  x1 × row 1 (incomplete)', -430, -185, 28, ROLE.gpu0, 'mono').opacity(a),
      txt('GPU 1  ·  x2 × row 2 (incomplete)', 430, -185, 28, ROLE.gpu1, 'mono').opacity(a),
    ];

    [0, 1].forEach((rk) => {
      const cx0 = rk === 0 ? -625 : 235;
      const col = rk === 0 ? ROLE.gpu0 : ROLE.gpu1;
      partials[rk].forEach((v, j) => {
        const cx = cx0 + j * 130;
        const hi = sumProg > 0.05 && j === activeCoord;
        nodes.push(
          rect(112, 86, {
            fill: hi ? '#2b220f' : '#0f1c33',
            stroke: hi ? COSMOS.gold : inc ? ROLE.warn : col,
            width: hi ? 3.2 : 2.2,
            radius: 10,
          })
            .at(cx, -90)
            .glow(hi ? 10 : 5, hi ? COSMOS.gold : col)
            .opacity(a),
          txt(String(v), cx, -90, 38, hi ? COSMOS.gold : COSMOS.ink, 'mono').opacity(a),
        );
      });
    });

    if (sumProg > 0.04) {
      nodes.push(
        glowingArc([-430, -44], [-180, 62], 24, { color: ROLE.gpu0, width: 3.4, opacity: a }),
        glowingArc([430, -44], [180, 62], 24, { color: ROLE.gpu1, width: 3.4, opacity: a }),
        glassCell(0, 72, 540, 88, COSMOS.gold, { fill: '#221c0e', glow: 10, opacity: a }),
        txt(
          `${partials[0][activeCoord]} + ${partials[1][activeCoord]} = ${SHARDS.y[activeCoord]}   (coord ${activeCoord + 1})`,
          0,
          72,
          32,
          COSMOS.gold,
          'mono',
        ).opacity(a),
      );
    }

    if (ar) {
      nodes.push(
        glassCell(-430, 235, 560, 84, ROLE.good, { fill: '#0d2924', glow: 9, opacity: a }),
        txt(`GPU 0 sum: [${SHARDS.y.join(', ')}]`, -430, 235, 32, ROLE.good, 'mono').opacity(a),
        glassCell(430, 235, 560, 84, ROLE.good, { fill: '#0d2924', glow: 9, opacity: a }),
        txt(`GPU 1 sum: [${SHARDS.y.join(', ')}]`, 430, 235, 32, ROLE.good, 'mono').opacity(a),
      );
    }

    const foot = ar
      ? 'All-reduce delivers the full sum to both GPUs · reduce-scatter shards it'
      : 'Each local row product is partial until peer contributions arrive';
    nodes.push(txt(foot, 0, 355, 28, ar ? ROLE.good : COSMOS.muted, 'sans').opacity(a));

    return group(...nodes);
  });

  const reluView = guardedDynamic(showRelu, (a) => {
    const g = pGoodRelu.value;
    const b = pBadRelu.value;
    const nodes = [
      txt(
        'SUM FIRST BEFORE NONLINEAR ACTIVATION (3 + (−1) = 2)',
        0,
        -185,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      glassCell(0, -40, 1240, 138, ROLE.good, {
        fill: '#0d2622',
        glow: g > 0.5 ? 10 : 4,
        opacity: a,
      }),
      txt('SUM THEN ReLU (EXACT)', -575, -135, 26, ROLE.good, 'mono', 'left').opacity(a),
      glassCell(0, 170, 1240, 138, b > 0.5 ? ROLE.bad : COSMOS.dim, {
        fill: b > 0.5 ? '#2c1220' : '#0d1424',
        glow: b > 0.5 ? 10 : 2,
        opacity: a,
      }),
      txt(
        'ReLU BEFORE SUM (WRONG!)',
        -575,
        75,
        26,
        b > 0.5 ? ROLE.bad : COSMOS.dim,
        'mono',
        'left',
      ).opacity(a),
      txt(
        b > 0.5
          ? 'Clamping -1 to 0 early turns 2 into 3 and corrupts the next layer'
          : 'Complete the linear sum across ranks before applying ReLU',
        0,
        340,
        28,
        b > 0.5 ? ROLE.bad : ROLE.good,
        'sans',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, partialsView, reluView);

  c.on('row-split', () => s.play(pSplit.to(1, { duration: remainDuration(c, 'row-split', 0.4) })));
  c.on('incomplete-output', () =>
    s.play(pInc.to(1, { duration: remainDuration(c, 'incomplete-output', 0.4) })),
  );
  c.on('sum-contributions', () =>
    s.play(pSum.to(1, { duration: remainDuration(c, 'sum-contributions', 1.1) })),
  );
  c.on('all-reduce-result', () =>
    s.play(pAR.to(1, { duration: remainDuration(c, 'all-reduce-result', 0.45) })),
  );
  c.onBeat(2, () => {
    const d = Math.min(0.16, remainBeatDuration(c, 2, 0.16));
    swapViews(s, showPartials, showRelu, d, d);
  });
  c.on('complete-relu', () =>
    s.play(pGoodRelu.to(1, { duration: remainDuration(c, 'complete-relu', 0.4) })),
  );
  c.show('complete-relu', [eqGood]);
  c.on('sum-before-relu', () =>
    s.play(pBadRelu.to(1, { duration: remainDuration(c, 'sum-before-relu', 0.45) })),
  );
  c.show('sum-before-relu', [eqBad]);
}
