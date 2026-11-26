// Scene 12: A confident mistake pays more loss: live -log(sigma(Delta)) sweep from +1.1 -> -2 -> +2.
import {
  COSMOS,
  MARGIN_AB,
  aura,
  circle,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  radialDial,
  remainDuration,
  runPhase,
  sampleCurve,
  sigmoid,
  stablePairLoss,
  txt,
} from '../parts.mjs';

export default function pairwiseLikelihood(s, c) {
  const phase = s.value(0);
  const delta = s.value(MARGIN_AB);
  const showWinner = s.value(0.5);
  const showProb = s.value(0.5);

  const bgAura = aura(240, 10, 580, '#ff6b8b20', '#5ce1e616');
  const title = heroTitle(['Confident Mistakes', 'Pay Steep Loss'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.rose,
    eyebrow: 'BINARY CROSS-ENTROPY · LOGIT = r(A) - r(B)',
  });

  const eq = glowTex(
    String.raw`\mathcal{L}(\Delta) = -\log\sigma(\Delta) = \operatorname{softplus}(-\Delta)`,
    { x: 355, y: -365, size: 36, color: COSMOS.gold },
  );

  // Loss curve plot on right
  const gx0 = -60;
  const gx1 = 810;
  const gy0 = 265;
  const gy1 = -220;
  const mapD = (d) => gx0 + ((d - -3.2) / 6.4) * (gx1 - gx0);
  const mapL = (l) => gy0 - (Math.min(3.5, l) / 3.5) * (gy0 - gy1);
  const LOSS_PTS = sampleCurve(stablePairLoss, -3.0, 3.0, mapD, mapL, 90);

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const d = delta.value;
    const prob = sigmoid(d);
    const loss = stablePairLoss(d);
    const pulse = 0.65 + 0.35 * Math.sin(p * 3.5);
    const col = d < 0 ? COSMOS.rose : d > 1.5 ? COSMOS.emerald : COSMOS.cyan;

    const px = mapD(d);
    const py = mapL(loss);
    const zeroX = mapD(0);

    const nodes = [
      // Left fixed label indicator + live margin/prob/loss telemetry
      txt('OBSERVED LABEL (FIXED)', -855, -185, 26, COSMOS.muted, 'mono', 'left'),
      txt('A  ≻  B   (y = 1)', -855, -130, 38, COSMOS.emerald, 'mono', 'left')
        .glow(6, COSMOS.emerald)
        .opacity(showWinner.value),

      // Radial probability dial
      radialDial(-690, 50, 108, prob, {
        color: col,
        width: 11,
        glow: 10,
        opacity: showProb.value,
      }),
      txt('P(A)', -690, 12, 26, COSMOS.muted, 'mono'),
      txt(`${(prob * 100).toFixed(0)}%`, -690, 62, 42, col, 'mono').glow(7, col),

      // Live margin and loss numeric readouts (explicitly left-anchored so zero edge/dial crowding)
      txt('CURRENT MARGIN Δ', -505, -20, 26, COSMOS.muted, 'mono', 'left'),
      txt(d >= 0 ? `+${d.toFixed(2)}` : d.toFixed(2), -505, 36, 48, col, 'mono', 'left').glow(
        7,
        col,
      ),

      txt('NEGATIVE LOG LOSS', -855, 230, 26, COSMOS.muted, 'mono', 'left'),
      txt(loss.toFixed(2), -855, 310, 80, col, 'mono', 'left').glow(10, col),
      txt(
        d < 0
          ? 'Confident wrong ranking → steep penalty'
          : 'Correct ranking → low negative log loss',
        -855,
        395,
        28,
        col,
        'sans',
        'left',
      ),

      // Loss curve axes
      line([gx0, gy0], [gx1, gy0], { stroke: '#455885', width: 2.5 }),
      line([zeroX, gy0], [zeroX, gy1], { stroke: '#324269', width: 2.0, dash: [6, 6] }),
      ...[-2, 0, 2].map((v) =>
        group(
          line([mapD(v), gy0 - 6], [mapD(v), gy0 + 8], { stroke: '#5a6f9c', width: 2 }),
          txt(v > 0 ? `+${v}` : String(v), mapD(v), gy0 + 38, 26, COSMOS.muted, 'mono'),
        ),
      ),
      ...[1, 2, 3].map((v) =>
        group(
          line([gx0, mapL(v)], [gx1, mapL(v)], { stroke: '#1c2642', width: 1.2 }),
          txt(String(v), gx0 - 20, mapL(v), 26, COSMOS.muted, 'mono', 'right'),
        ),
      ),
      txt('Margin Δ = r(A) - r(B)', (gx0 + gx1) * 0.5, gy0 + 84, 26, COSMOS.muted, 'sans'),
      txt('Loss', gx0 - 18, gy1 - 24, 26, COSMOS.muted, 'mono', 'right'),

      // Glowing softplus(-Delta) curve
      glowingTrail(LOSS_PTS, {
        gradientColors: [COSMOS.rose, COSMOS.amber, COSMOS.cyan, COSMOS.emerald],
        width: 5.4,
        glow: 12,
      }),

      // Reference milestones at -2, +1.1, +2
      glowDot(mapD(-2), mapL(stablePairLoss(-2)), { radius: 6, color: COSMOS.rose, opacity: 0.65 }),
      glowDot(mapD(MARGIN_AB), mapL(stablePairLoss(MARGIN_AB)), {
        radius: 6,
        color: COSMOS.cyan,
        opacity: 0.65,
      }),
      glowDot(mapD(2), mapL(stablePairLoss(2)), {
        radius: 6,
        color: COSMOS.emerald,
        opacity: 0.65,
      }),

      // Live operating point with vertical loss bar (fixed unobstructed readout above plot)
      line([px, gy0], [px, py], { stroke: col, width: 3.4, dash: [8, 6] }),
      circle(16 + pulse * 7, { fill: null, stroke: col, width: 2.4 })
        .at(px, py)
        .opacity(0.75)
        .set('blend', 'screen'),
      glowDot(px, py, { radius: 11, color: col }),
      txt(
        `Δ = ${d >= 0 ? '+' : ''}${d.toFixed(1)}   →   L = ${loss.toFixed(2)}`,
        (gx0 + gx1) * 0.5,
        gy1 - 46,
        30,
        col,
        'mono',
      ).glow(7, col),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);
  runPhase(s, c, phase, 14);

  c.on('pairwise-likelihood-b1-1', () => s.play(showWinner.to(1, { duration: 0.35 })));
  c.on('pairwise-likelihood-b1-2', () => s.play(showProb.to(1, { duration: 0.35 })));
  c.on('loss-wrong', () => s.play(delta.to(-2.0, { duration: 0.9 })));
  c.on('loss-correct', () =>
    s.play(delta.to(2.0, { duration: remainDuration(c, 'loss-correct', 1.1) })),
  );
}
