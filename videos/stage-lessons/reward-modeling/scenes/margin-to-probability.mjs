// Scene 11: Turn a score gap into a forecast: live Bradley-Terry sigmoid curve, exp strengths, equal-score dip.
import {
  COSMOS,
  EXP_A,
  EXP_B,
  MARGIN_AB,
  PROB_AB,
  SCORE_A,
  SCORE_B,
  afterDuration,
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
  rect,
  remainDuration,
  runPhase,
  sampleCurve,
  sigmoid,
  txt,
} from '../parts.mjs';

export default function marginToProbability(s, c) {
  const phase = s.value(0);
  const delta = s.value(MARGIN_AB);
  const showChosen = s.value(0.45);
  const showSub = s.value(0);
  const showMargin = s.value(0);
  const showExp = s.value(0);
  const showShare = s.value(0);
  const showSig = s.value(0.35);
  const showVotes = s.value(0);

  const bgAura = aura(240, 20, 580, '#5ce1e622', '#ffd1661a');
  const title = heroTitle(['Bradley-Terry', 'Sigmoid'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.cyan,
    eyebrow: 'SCORE MARGIN Δ  →  WIN PROBABILITY σ(Δ)',
  });

  const eq = glowTex(
    String.raw`P(A \succ B) = \frac{e^{r_A}}{e^{r_A} + e^{r_B}} = \sigma(r_A - r_B)`,
    { x: 350, y: -365, size: 36, color: COSMOS.gold },
  );

  // Sigmoid plot coordinates (right half)
  const gx0 = -60;
  const gx1 = 810;
  const gy0 = 260;
  const gy1 = -215;
  const mapD = (d) => gx0 + ((d - -3.5) / 7.0) * (gx1 - gx0);
  const mapP = (p) => gy0 - p * (gy0 - gy1);
  const SIG_PTS = sampleCurve(sigmoid, -3.5, 3.5, mapD, mapP, 90);

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const d = delta.value;
    const prob = sigmoid(d);
    const curRA = SCORE_B + d;
    const expA = Math.exp(curRA);
    const expB = EXP_B;
    const pulse = 0.65 + 0.35 * Math.sin(p * 3.4);

    const px = mapD(d);
    const py = mapP(prob);
    const zeroX = mapD(0);
    const halfY = mapP(0.5);

    const nodes = [
      // Left side: Score markers & live subtraction
      txt('SCORE DIFFERENCE', -855, -185, 26, COSMOS.muted, 'mono', 'left'),
      txt(`r(A) = ${curRA.toFixed(1)}`, -855, -130, 36, COSMOS.emerald, 'mono', 'left')
        .glow(6, COSMOS.emerald)
        .opacity(Math.max(0.5, showChosen.value)),
      txt(`r(B) = ${SCORE_B.toFixed(1)}`, -520, -130, 36, COSMOS.rose, 'mono', 'left')
        .glow(6, COSMOS.rose)
        .opacity(Math.max(0.45, showSub.value)),
      txt(`Δ = ${d.toFixed(2)}`, -855, -62, 46, COSMOS.gold, 'mono', 'left')
        .glow(8, COSMOS.gold)
        .opacity(Math.max(0.45, showMargin.value)),

      // Exponential strength bars on left
      txt('POSITIVE STRENGTHS  e^r', -855, 28, 26, COSMOS.muted, 'mono', 'left').opacity(
        Math.max(0.4, showExp.value),
      ),
      rect(Math.max(24, (expA / 7.5) * 440), 42, { fill: COSMOS.emerald, stroke: null, radius: 6 })
        .at(-855 + Math.max(24, (expA / 7.5) * 440) * 0.5, 86)
        .glow(7, COSMOS.emerald)
        .opacity(Math.max(0.4, showExp.value)),
      txt(
        `e^${curRA.toFixed(1)} = ${expA.toFixed(2)}`,
        -855 + Math.max(24, (expA / 7.5) * 440) + 18,
        86,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(Math.max(0.4, showExp.value)),

      rect((expB / 7.5) * 440, 42, { fill: COSMOS.rose, stroke: null, radius: 6 })
        .at(-855 + (expB / 7.5) * 440 * 0.5, 146)
        .glow(6, COSMOS.rose)
        .opacity(Math.max(0.4, showExp.value)),
      txt(
        `e^${SCORE_B.toFixed(1)} = ${expB.toFixed(2)}`,
        -855 + (expB / 7.5) * 440 + 18,
        146,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ).opacity(Math.max(0.4, showExp.value)),

      // Radial live probability dial bottom-left
      radialDial(-690, 315, 96, prob, {
        color: Math.abs(d) < 0.05 ? COSMOS.gold : COSMOS.cyan,
        width: 11,
        glow: 10,
        opacity: Math.max(0.55, showShare.value),
      }),
      txt(`${(prob * 100).toFixed(0)}%`, -690, 318, 38, COSMOS.cyan, 'mono').glow(7, COSMOS.cyan),
      txt('P(A ≻ B)', -690, 434, 26, COSMOS.muted, 'mono'),

      // Sigmoid coordinate plane on right
      line([gx0, gy0], [gx1, gy0], { stroke: '#455885', width: 2.4 }),
      line([zeroX, gy0], [zeroX, gy1], { stroke: '#324269', width: 2.0, dash: [6, 6] }),
      line([gx0, halfY], [gx1, halfY], { stroke: '#29375a', width: 1.6, dash: [6, 6] }),
      txt('0.5', gx0 - 22, halfY, 26, COSMOS.muted, 'mono', 'right'),
      txt('1.0', gx0 - 22, gy1 + 8, 26, COSMOS.muted, 'mono', 'right'),
      txt('0.0', gx0 - 22, gy0 - 4, 26, COSMOS.muted, 'mono', 'right'),
      txt('Δ = 0', zeroX, gy0 + 36, 26, COSMOS.muted, 'mono'),
      txt('Score margin Δ = r(A) - r(B)', (gx0 + gx1) * 0.5, gy0 + 84, 26, COSMOS.muted, 'sans'),

      // Glowing Bradley-Terry sigmoid curve
      glowingTrail(SIG_PTS, {
        gradientColors: [COSMOS.rose, COSMOS.violet, COSMOS.cyan, COSMOS.emerald],
        width: 5.2,
        glow: 12,
        opacity: Math.max(0.5, showSig.value),
      }),

      // Live operating point on sigmoid (fixed unobstructed coordinate readout above plot)
      line([px, gy0], [px, py], { stroke: COSMOS.gold, width: 2.2, dash: [7, 6] }),
      line([gx0, py], [px, py], { stroke: COSMOS.cyan, width: 2.2, dash: [7, 6] }),
      circle(16 + pulse * 6, { fill: null, stroke: COSMOS.gold, width: 2.2 })
        .at(px, py)
        .opacity(0.65)
        .set('blend', 'screen'),
      glowDot(px, py, { radius: 10, color: COSMOS.gold }),
      txt(
        `Δ = ${d.toFixed(2)}   →   σ(Δ) = ${prob.toFixed(2)}`,
        (gx0 + gx1) * 0.5,
        gy1 - 46,
        30,
        COSMOS.gold,
        'mono',
      ).glow(6, COSMOS.gold),
    ];

    // 4 reviewer votes (3 A, 1 B) matching 75% forecast
    if (showVotes.value > 0.05) {
      const sv = showVotes.value;
      const vx0 = -490;
      const vy = 315;
      nodes.push(
        txt('4 FIXED-ORDER VOTES', vx0, vy - 56, 26, COSMOS.emerald, 'mono', 'left').opacity(sv),
      );
      ['A', 'A', 'A', 'B'].forEach((v, i) => {
        const col = v === 'A' ? COSMOS.emerald : COSMOS.rose;
        nodes.push(
          circle(28, { fill: '#101b2c', stroke: col, width: 3 })
            .at(vx0 + 30 + i * 74, vy + 8)
            .glow(7, col)
            .opacity(sv),
          txt(v, vx0 + 30 + i * 74, vy + 10, 28, col, 'mono').opacity(sv),
        );
      });
      nodes.push(
        txt('3/4 = 75% (small sample)', vx0, vy + 66, 26, COSMOS.muted, 'mono', 'left').opacity(sv),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);
  runPhase(s, c, phase, 14);

  c.on('margin-to-probability-b1-1', () => s.play(showChosen.to(1, { duration: 0.35 })));
  c.on('subtract-rejected-score', () => s.play(showSub.to(1, { duration: 0.4 })));
  c.on('score-margin-result', () => s.play(showMargin.to(1, { duration: 0.4 })));
  c.on('exponential-strengths', () => s.play(showExp.to(1, { duration: 0.45 })));
  c.on('chosen-strength-share', () => s.play(showShare.to(1, { duration: 0.45 })));
  c.on('sigmoid-mapping', () => s.play(showSig.to(1, { duration: 0.45 })));
  c.on('equal-score-chance', () =>
    s.play(delta.to(0, { duration: remainDuration(c, 'equal-score-chance', 0.35) })),
  );
  c.after('restore-score', () =>
    s.play(delta.to(MARGIN_AB, { duration: afterDuration(c, 'restore-score', 0.35) })),
  );
  c.on('check-human-judgments', () =>
    s.play(showVotes.to(1, { duration: remainDuration(c, 'check-human-judgments', 0.5) })),
  );
}
