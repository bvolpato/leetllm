// Scene 15: Push the pair in opposite directions (Two-logit DPO gradient steps + shrinking gradient trajectory)
import {
  COSMOS,
  LOGIT_TRACE,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  prefLerp,
  rect,
  remainDuration,
  runPhase,
  twoLogitState,
  txt,
} from '../parts.mjs';

export default function update(s, c) {
  const phase = s.value(0);
  const sSoft = s.value(0);
  const sGrad = s.value(0);
  const sStep = s.value(0);
  const sShared = s.value(0);

  const bgAura = aura(320, 20, 560, '#123e3628', '#3c1b2a18');
  const title = heroTitle(['Push the Pair in', 'Opposite Directions'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'DPO GRADIENT DESCENT · TWO-LOGIT MODEL (beta = 0.5, lr = 0.4)',
  });

  // Precompute trajectory curves across 6 updates on right plot
  const px0 = 40;
  const px1 = 830;
  const pyBot = 210;
  const pyTop = -215;
  const mapX = (step) => px0 + (step / 6) * (px1 - px0);
  const mapY = (val) => pyBot - (val / 1.2) * (pyBot - pyTop); // range [0, 1.2]

  const marginPts = LOGIT_TRACE.map((st, idx) => [mapX(idx), mapY(st.margin)]);
  const gradMagPts = LOGIT_TRACE.map((st, idx) => [mapX(idx), mapY(Math.abs(st.gradient[0]) * 3)]);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sf = Math.max(0.75, sSoft.value);
    const gr = sGrad.value;
    const st = sStep.value; // 0 -> 6 updates
    const sh = sShared.value;

    // Interpolate current logit along exact LOGIT_TRACE
    const k = Math.min(5, Math.floor(st));
    const frac = st - k;
    const zA = prefLerp(LOGIT_TRACE[k].logits[0], LOGIT_TRACE[k + 1].logits[0], frac);
    const zB = prefLerp(LOGIT_TRACE[k].logits[1], LOGIT_TRACE[k + 1].logits[1], frac);
    const cur = twoLogitState([zA, zB], 0.5);

    const barY = 148;
    const barScale = 185;
    const hA = cur.probabilities[0] * barScale;
    const hB = cur.probabilities[1] * barScale;

    const nodes = [
      // Left: Chosen vs Rejected logits, gradients, and softmax bars
      txt(
        `STEP ${st.toFixed(1)}  ·  MARGIN = ${cur.margin.toFixed(3)}`,
        -855,
        -228,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      glassCell(-645, -124, 360, 146, COSMOS.emerald, {
        fill: '#0e2824',
        glow: gr > 0.2 ? 9 * pulse : 5,
      }),
      txt('CHOSEN LOGIT z_A', -645, -162, 26, COSMOS.emerald, 'mono'),
      txt(
        `z = ${cur.logits[0] >= 0 ? '+' : ''}${cur.logits[0].toFixed(3)}`,
        -645,
        -122,
        30,
        COSMOS.ink,
        'mono',
      ),
      txt(`grad = ${cur.gradient[0].toFixed(3)}`, -645, -82, 26, COSMOS.gold, 'mono'),

      glassCell(-265, -124, 360, 146, COSMOS.rose, {
        fill: '#28101a',
        glow: gr > 0.2 ? 9 * pulse : 5,
      }),
      txt('REJECTED LOGIT z_B', -265, -162, 26, COSMOS.rose, 'mono'),
      txt(
        `z = ${cur.logits[1] >= 0 ? '+' : ''}${cur.logits[1].toFixed(3)}`,
        -265,
        -122,
        30,
        COSMOS.ink,
        'mono',
      ),
      txt(`grad = +${cur.gradient[1].toFixed(3)}`, -265, -82, 26, COSMOS.gold, 'mono'),

      // Softmax distribution bars
      line([-825, barY], [-85, barY], { stroke: COSMOS.rule, width: 2.2 }),
      rect(180, hA, { fill: '#103b33', stroke: COSMOS.emerald, width: 2.4, radius: 7 })
        .at(-645, barY - hA * 0.5)
        .opacity(sf),
      txt(
        `${(cur.probabilities[0] * 100).toFixed(1)}%`,
        -645,
        barY - hA - 28,
        28,
        COSMOS.emerald,
        'mono',
      ),
      txt('SOFTMAX P(A)', -645, barY + 38, 26, COSMOS.emerald, 'mono'),

      rect(180, hB, { fill: '#29101a', stroke: COSMOS.rose, width: 2.4, radius: 7 })
        .at(-265, barY - hB * 0.5)
        .opacity(sf),
      txt(
        `${(cur.probabilities[1] * 100).toFixed(1)}%`,
        -265,
        barY - hB - 28,
        28,
        COSMOS.rose,
        'mono',
      ),
      txt('SOFTMAX P(B)', -265, barY + 38, 26, COSMOS.rose, 'mono'),

      // Right plot: Margin climbs while |grad| shrinks
      txt('6 DPO UPDATES: MARGIN CLIMBS, PULL SHRINKS', 435, -295, 26, COSMOS.gold, 'mono'),
      line([px0, pyBot], [px1, pyBot], { stroke: COSMOS.rule, width: 2.2 }),
      line([px0, pyBot], [px0, pyTop], { stroke: COSMOS.rule, width: 2.2 }),
      ...[0, 2, 4, 6].map((step) =>
        txt(`t=${step}`, mapX(step), pyBot + 38, 26, COSMOS.muted, 'mono'),
      ),

      glowingTrail(marginPts, { color: COSMOS.emerald, width: 4.5, glow: 9 }),
      glowingTrail(gradMagPts, { color: COSMOS.gold, width: 4.2, glow: 9 }),

      glowDot(mapX(st), mapY(cur.margin), { radius: 9, color: COSMOS.emerald, glow: 14 }),
      glowDot(mapX(st), mapY(Math.abs(cur.gradient[0]) * 3), {
        radius: 9,
        color: COSMOS.gold,
        glow: 14,
      }),

      txt('MARGIN (GROWS)', 710, mapY(LOGIT_TRACE[6].margin) - 28, 26, COSMOS.emerald, 'mono'),
      txt(
        '3x |GRAD| (SHRINKS)',
        670,
        mapY(Math.abs(LOGIT_TRACE[6].gradient[0]) * 3) + 34,
        26,
        COSMOS.gold,
        'mono',
      ),

      // Bottom shared-parameter note
      glassCell(0, 352, 1680, 102, sh > 0.3 ? COSMOS.amber : COSMOS.dim, {
        fill: sh > 0.3 ? '#241a0f' : '#12182b',
        glow: sh > 0.3 ? 8 * pulse : 3,
      }),
      txt(
        sh > 0.3
          ? 'SHARED TRANSFORMER WEIGHTS: pushing this pair shifts other sequences too -> evaluate whole-model outputs'
          : 'At m = 0, grad = [-0.25, +0.25]; as chosen pulls ahead, (1 - sigma(beta m)) shrinks each next step',
        0,
        354,
        26,
        sh > 0.3 ? COSMOS.amber : COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  const eqGrad = glowTex(
    '\\frac{\\partial \\mathcal{L}}{\\partial z_w} = -\\beta(1 - \\sigma(\\beta m))',
    {
      x: -455,
      y: 238,
      size: 32,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, title, live, eqGrad);
  runPhase(s, c, phase, 14);

  c.on('update-b1-1', () =>
    s.play(sSoft.to(1, { duration: remainDuration(c, 'update-b1-1', 0.45) })),
  );
  c.on('update-b2-1', () =>
    s.play(sGrad.to(1, { duration: remainDuration(c, 'update-b2-1', 0.55) })),
  );
  c.on('update-b2-2', () =>
    s.play(sStep.to(6, { duration: remainDuration(c, 'update-b2-2', 2.1) })),
  );
  c.on('update-b3-1', () =>
    s.play(sShared.to(1, { duration: remainDuration(c, 'update-b3-1', 0.55) })),
  );
}
