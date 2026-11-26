// Scene 13: Separate stable evaluation from a required margin: log-sum-exp stability + margin shift m=1 -> 3.197.
import {
  COSMOS,
  MARGIN_TARGET_90,
  aura,
  circle,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  sampleCurve,
  stablePairLoss,
  txt,
} from '../parts.mjs';

export default function stableLossAndMargins(s, c) {
  const phase = s.value(0);
  const showStable = s.value(0.45);
  const showExtremes = s.value(0);
  const marginShift = s.value(0); // 0 -> 1.0
  const showBoundary = s.value(0);
  const showTarget = s.value(0);

  const bgAura = aura(220, 15, 580, '#a78bfa20', '#5ce1e618');
  const title = heroTitle(['Numerical Stability', '& Rating Margins'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.violet,
    eyebrow: 'SOFTPLUS(-Δ)  ·  MARGIN SHIFT (Δ - m)',
  });

  const eqStable = glowTex(
    String.raw`\operatorname{sp}(-\Delta) = \max(-\Delta, 0) + \log\!\big(1 + e^{-|\Delta|}\big)`,
    { x: 310, y: -365, size: 32, color: COSMOS.cyan },
  );

  // Margin-shifted loss plot on right
  const gx0 = -60;
  const gx1 = 810;
  const gy0 = 250;
  const gy1 = -210;
  const mapD = (d) => gx0 + ((d - -2.0) / 6.5) * (gx1 - gx0);
  const mapL = (l) => gy0 - (Math.min(3.4, l) / 3.4) * (gy0 - gy1);
  const BASE_PTS = sampleCurve((d) => stablePairLoss(d), -2.0, 4.5, mapD, mapL, 84);

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const st = showStable.value;
    const ex = showExtremes.value;
    const m = marginShift.value;
    const bd = showBoundary.value;
    const tg = showTarget.value;
    const pulse = 0.65 + 0.35 * Math.sin(p * 3.4);

    const shiftedPts = sampleCurve((d) => stablePairLoss(d - m), -2.0, 4.5, mapD, mapL, 84);
    const mX = mapD(m);
    const ln2Y = mapL(Math.LN2);
    const t90X = mapD(MARGIN_TARGET_90);
    const t90Y = mapL(stablePairLoss(MARGIN_TARGET_90 - 1));

    const nodes = [
      // Left side: Extreme stability readout (-1000 / +1000)
      txt('EXPONENT ALWAYS ≤ 0', -855, -185, 26, COSMOS.cyan, 'mono', 'left').opacity(
        Math.max(0.5, st),
      ),
      txt('e^(-|Δ|)  ∈  (0, 1]', -855, -135, 34, COSMOS.gold, 'mono', 'left')
        .glow(6, COSMOS.gold)
        .opacity(Math.max(0.5, st)),
      txt('Never overflows or log(0)!', -855, -86, 26, COSMOS.muted, 'sans', 'left').opacity(
        Math.max(0.5, st),
      ),

      // Extreme probe badges (clean floating numbers)
      txt('Δ = -1000', -855, 6, 28, COSMOS.rose, 'mono', 'left').opacity(Math.max(0.45, ex)),
      txt(`L = ${stablePairLoss(-1000).toFixed(0)}`, -645, 6, 36, COSMOS.rose, 'mono', 'left')
        .glow(6, COSMOS.rose)
        .opacity(Math.max(0.45, ex)),
      txt('Δ = +1000', -855, 76, 28, COSMOS.emerald, 'mono', 'left').opacity(Math.max(0.45, ex)),
      txt(`L = ${stablePairLoss(1000).toFixed(0)}`, -645, 76, 36, COSMOS.emerald, 'mono', 'left')
        .glow(6, COSMOS.emerald)
        .opacity(Math.max(0.45, ex)),

      // Rating margin formula & Llama 2 -> Llama 3 note bottom-left
      txt('MARGIN-SHIFTED LOGIT', -855, 195, 26, COSMOS.violet, 'mono', 'left'),
      txt('Δ_eff = Δ - m', -855, 250, 42, COSMOS.violet, 'mono', 'left').glow(7, COSMOS.violet),
      txt(
        tg > 0.4
          ? `m = 1, ρ = 90% → Δ = ${MARGIN_TARGET_90.toFixed(3)}`
          : 'At Δ = m:  p = 0.5,  L = ln 2,  slope = -0.5',
        -855,
        320,
        28,
        tg > 0.4 ? COSMOS.gold : COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        'Llama 2 used preference-strength m · Llama 3 dropped it at scale',
        -855,
        395,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Plot axes on right
      line([gx0, gy0], [gx1, gy0], { stroke: '#455885', width: 2.5 }),
      line([mapD(0), gy0], [mapD(0), gy1], { stroke: '#324269', width: 2.0, dash: [6, 6] }),
      ...[-1, 0, 1, 2, 3, 4].map((v) =>
        group(
          line([mapD(v), gy0 - 5], [mapD(v), gy0 + 7], { stroke: '#5a6f9c', width: 2 }),
          txt(String(v), mapD(v), gy0 + 36, 26, COSMOS.muted, 'mono'),
        ),
      ),
      txt('Score margin Δ', (gx0 + gx1) * 0.5, gy0 + 82, 26, COSMOS.muted, 'sans'),
      txt('Loss', gx0 - 16, gy1 - 24, 26, COSMOS.muted, 'mono', 'right'),

      // Unshifted baseline curve (dimmer cyan reference)
      glowingTrail(BASE_PTS, {
        color: COSMOS.cyan,
        width: 3.4,
        opacity: 0.48,
        glow: 5,
      }),
      // Shifted curve softplus(-(Delta - m))
      glowingTrail(shiftedPts, {
        gradientColors: [COSMOS.rose, COSMOS.violet, COSMOS.gold],
        width: 5.2,
        glow: 12,
      }),
    ];

    // Boundary marker at Delta = m (still slope -0.5!)
    if (bd > 0.05 || m > 0.1) {
      const a = Math.max(bd, m);
      nodes.push(
        line([mX, gy0], [mX, ln2Y], { stroke: COSMOS.violet, width: 2.4, dash: [7, 5] }).opacity(a),
        // Tangent line with slope -0.5 through (m, ln 2)
        glowingTrail(
          [
            [mapD(m - 0.9), mapL(Math.LN2 + 0.45)],
            [mapD(m + 0.9), mapL(Math.LN2 - 0.45)],
          ],
          { color: COSMOS.amber, width: 3.4, opacity: 0.85 * a },
        ),
        glowDot(mX, ln2Y, { radius: 9, color: COSMOS.violet, opacity: a }),
        txt('Δ = m: slope = -½', mX + 18, ln2Y - 30, 26, COSMOS.violet, 'mono', 'left')
          .glow(6, COSMOS.violet)
          .opacity(a),
      );
    }

    // 90% target marker at Delta = 1 + ln(9) = 3.197 (label placed cleanly high above curve)
    if (tg > 0.05) {
      nodes.push(
        line([t90X, gy0], [t90X, t90Y], { stroke: COSMOS.gold, width: 2.6, dash: [7, 5] }).opacity(
          tg,
        ),
        circle(14 + pulse * 6, { fill: null, stroke: COSMOS.gold, width: 2.4 })
          .at(t90X, t90Y)
          .opacity(0.75 * tg)
          .set('blend', 'screen'),
        glowDot(t90X, t90Y, { radius: 10, color: COSMOS.gold, opacity: tg }),
        txt(
          `90% → Δ = ${MARGIN_TARGET_90.toFixed(3)}`,
          t90X - 18,
          gy1 + 22,
          28,
          COSMOS.gold,
          'mono',
          'right',
        )
          .glow(7, COSMOS.gold)
          .opacity(tg),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eqStable, live);
  runPhase(s, c, phase, 14);

  c.on('stable-loss-and-margins-step-1', () => s.play(showStable.to(1, { duration: 0.4 })));
  c.on('stable-extremes', () => s.play(showExtremes.to(1, { duration: 0.45 })));
  c.on('stable-boundary', () => s.play(marginShift.to(1.0, { duration: 0.65 })));
  c.on('stable-loss-and-margins-step-2', () => s.play(showBoundary.to(1, { duration: 0.45 })));
  c.on('stable-loss-and-margins-step-3', () => s.play(showTarget.to(0.65, { duration: 0.35 })));
  c.on('stable-target', () =>
    s.play(showTarget.to(1, { duration: remainDuration(c, 'stable-target', 0.45) })),
  );
}
