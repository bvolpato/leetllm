// Scene 14: How much weight does one token get?: Microbatch gradient normalization beams + prediction withholding.
import {
  COSMOS,
  MICROBATCH_A,
  MICROBATCH_B,
  MICROBATCH_COUNT,
  MICROBATCH_MEAN_OF_MEANS,
  MICROBATCH_SUM_A,
  MICROBATCH_SUM_B,
  MICROBATCH_TOKEN_MEAN,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function batching(s, c) {
  const phase = s.value(0);
  const showA = s.value(0);
  const showB = s.value(0);
  const showTokenMean = s.value(0);
  const showBatchMean = s.value(0);
  const showWindow = s.value(0);

  const bgAura = aura(0, 30, 620, '#6ee7b71a', '#fb923c14');
  const title = heroTitle(['Token-Weighted', 'Accumulation'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.emerald,
    eyebrow: 'GRADIENT NORMALIZATION · EQUAL TOKEN WEIGHT',
  });

  const eqAccum = glowTex(
    String.raw`\mathcal{L}_{\text{step}} = \frac{\sum_k \sum_{t \in B_k} \ell_t}{\sum_k |B_k|}`,
    {
      x: 470,
      y: -365,
      size: 38,
      color: COSMOS.emerald,
    },
  );

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sa = showA.value;
    const sb = showB.value;
    const tm = showTokenMean.value > 0.5;
    const bm = showBatchMean.value > 0.5;
    const sw = showWindow.value > 0.5;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    const nodes = [];

    // Microbatch A: 1 scored token with loss 4
    const yA = -165;
    nodes.push(
      txt('MICROBATCH A', -835, yA - 18, 28, COSMOS.amber, 'mono', 'left').opacity(
        Math.max(0.4, sa),
      ),
      txt('1 active token', -835, yA + 22, 26, COSMOS.muted, 'mono', 'left').opacity(
        Math.max(0.4, sa),
      ),
      glassCell(-420, yA, 108, 92, COSMOS.amber, {
        fill: '#261a10',
        glow: 11 * pulse,
        opacity: Math.max(0.4, sa),
      }),
      txt(String(MICROBATCH_A[0]), -420, yA, 38, COSMOS.amber, 'mono').opacity(Math.max(0.4, sa)),
      // Weight share beam for Microbatch A token
      rect(bm ? 420 : 100, 26, {
        fill: bm ? COSMOS.rose : COSMOS.emerald,
        stroke: null,
        radius: 6,
      })
        .at(bm ? -110 : -270, yA)
        .glow(8, bm ? COSMOS.rose : COSMOS.emerald)
        .opacity(tm || bm ? 0.85 : 0.2),
      txt(`sum = ${MICROBATCH_SUM_A}`, 760, yA, 32, COSMOS.amber, 'mono', 'right').opacity(
        Math.max(0.4, sa),
      ),
    );

    // Microbatch B: 9 scored tokens with loss 1 each
    const yB = -10;
    nodes.push(
      txt('MICROBATCH B', -835, yB - 18, 28, COSMOS.cyan, 'mono', 'left').opacity(
        Math.max(0.4, sb),
      ),
      txt('9 active tokens', -835, yB + 22, 26, COSMOS.muted, 'mono', 'left').opacity(
        Math.max(0.4, sb),
      ),
    );
    MICROBATCH_B.forEach((v, i) => {
      const bx = -420 + i * 114;
      nodes.push(
        glassCell(bx, yB, 94, 84, COSMOS.cyan, {
          fill: '#0e2230',
          glow: 6,
          opacity: Math.max(0.35, sb),
        }),
        txt(String(v), bx, yB, 34, COSMOS.cyan, 'mono').opacity(Math.max(0.35, sb)),
      );
    });
    nodes.push(
      txt(`sum = ${MICROBATCH_SUM_B}`, 760, yB, 32, COSMOS.cyan, 'mono', 'right').opacity(
        Math.max(0.35, sb),
      ),
    );

    // Comparison pair: Equal Tokens (13 / 10 = 1.3) vs Mean of Batch Means (2.5)
    // Strict withholding before batching-b2-2 and batching-b2-3!
    const totalSum = MICROBATCH_SUM_A + MICROBATCH_SUM_B;
    nodes.push(
      glassCell(-425, 195, 790, 146, tm ? COSMOS.emerald : COSMOS.gold, {
        fill: tm ? '#0c2624' : '#181822',
        glow: tm ? 11 * pulse : 7,
      }),
      txt('EQUAL WEIGHT PER TOKEN', -425, 152, 26, tm ? COSMOS.emerald : COSMOS.gold, 'mono'),
      txt(
        tm
          ? `(${MICROBATCH_SUM_A} + ${MICROBATCH_SUM_B}) ÷ ${MICROBATCH_COUNT} = ${MICROBATCH_TOKEN_MEAN.toFixed(1)}`
          : `(${MICROBATCH_SUM_A} + ${MICROBATCH_SUM_B}) ÷ ?`,
        -425,
        214,
        42,
        tm ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).glow(7, tm ? COSMOS.emerald : COSMOS.gold),

      glassCell(425, 195, 790, 146, bm ? COSMOS.rose : '#33446b', {
        fill: bm ? '#24101b' : '#0f1526',
        glow: bm ? 10 : 0,
        opacity: bm ? 1 : 0.72,
      }),
      txt('MEAN OF MICROBATCH MEANS', 425, 152, 26, bm ? COSMOS.rose : COSMOS.muted, 'mono'),
      txt(
        bm
          ? `(4.0 + 1.0) ÷ 2 = ${MICROBATCH_MEAN_OF_MEANS.toFixed(1)}  (9× bias!)`
          : '(mean A + mean B) ÷ 2',
        425,
        214,
        34,
        bm ? COSMOS.rose : COSMOS.dim,
        'mono',
      ),
    );

    // Bottom window-accumulation directive
    const footCol = sw ? COSMOS.emerald : tm ? COSMOS.cyan : COSMOS.gold;
    const footMsg = sw
      ? `Accumulate sums (${totalSum}) & active counts (${MICROBATCH_COUNT}) over full window · Guard 0-count steps`
      : bm
        ? 'Mean-of-means gives the lone token 50% of the gradient (9× each token in B)'
        : tm
          ? 'Dividing combined loss by total active tokens gives all 10 tokens an equal vote'
          : 'To weight every token equally, what divisor belongs under (4 + 9)?';
    nodes.push(
      glassCell(0, 368, 1660, 96, footCol, { fill: '#101829', glow: 8 }),
      txt(footMsg, 0, 368, 27, footCol, 'mono'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eqAccum, live);
  runPhase(s, c, phase, 14);

  c.on('batching-b1-1', () => s.play(showA.to(1, { duration: 0.45 })));
  c.on('batching-b2-1', () => s.play(showB.to(1, { duration: 0.55 })));
  c.after('batching-b2-2', () => s.play(showTokenMean.to(1, { duration: 0.3 })));
  c.after('batching-b2-3', () => s.play(showBatchMean.to(1, { duration: 0.3 })));
  c.on('batching-b3-1', () =>
    s.play(showWindow.to(1, { duration: remainDuration(c, 'batching-b3-1', 0.45) })),
  );
}
