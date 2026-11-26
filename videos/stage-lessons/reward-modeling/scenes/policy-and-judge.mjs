// Scene 04: One writer, one shared scorer: autoregressive policy vs shared scalar judge r(x, y).
import {
  COSMOS,
  SCORE_A,
  SCORE_B,
  aura,
  circle,
  glowDot,
  glowTex,
  glowingArc,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  tokenCell,
  txt,
} from '../parts.mjs';

export default function policyAndJudge(s, c) {
  const phase = s.value(0);
  const tokenFlow = s.value(0.2);
  const scoredA = s.value(0);
  const scoredB = s.value(0);

  const bgAura = aura(120, 10, 560, '#5ce1e622', '#ffd16618');
  const title = heroTitle(['One Writer,', 'One Shared Scorer'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'POLICY π(y|x)  VS  SCALAR REWARD r(x, y)',
  });

  const eq = glowTex(String.raw`r_\theta(x, y) \in \mathbb{R}`, {
    x: 470,
    y: -365,
    size: 46,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const tf = tokenFlow.value;
    const sa = scoredA.value;
    const sb = scoredB.value;
    const pulse = 0.65 + 0.35 * Math.sin(p * 3.6);

    // Number line for scalar rewards at bottom right
    const axisX0 = 260;
    const axisX1 = 820;
    const axisY = 235;
    const mapR = (r) => axisX0 + ((r - 0) / 2.2) * (axisX1 - axisX0);
    const xA = mapR(SCORE_A);
    const xB = mapR(SCORE_B);

    const nodes = [
      // Left: Policy writer streaming tokens
      tokenCell(-680, -35, 310, 148, COSMOS.cyan, { fill: '#0e1d30', glow: 8 }),
      txt('POLICY π', -680, -74, 30, COSMOS.cyan, 'mono').glow(6, COSMOS.cyan),
      txt('Writes 1 token', -680, -24, 28, COSMOS.ink, 'sans'),
      txt('at a time', -680, 14, 28, COSMOS.muted, 'sans'),

      // Token ribbons streaming to A and B
      glowingArc([-520, -60], [-195, -135], -35, {
        color: COSMOS.emerald,
        width: 3.4,
        opacity: 0.85,
      }),
      glowingArc([-520, -10], [-195, 135], 35, { color: COSMOS.rose, width: 3.4, opacity: 0.85 }),

      // Completed sequences (x, A) and (x, B)
      tokenCell(-15, -135, 355, 112, COSMOS.emerald, {
        fill: '#0d2224',
        glow: sa > 0.5 ? 9 : 4,
        opacity: Math.max(0.55, tf),
      }),
      txt('(x, Reply A)', -15, -162, 28, COSMOS.emerald, 'mono'),
      txt('Prompt + wait for review', -15, -112, 26, COSMOS.ink, 'sans'),

      tokenCell(-15, 135, 355, 112, COSMOS.rose, {
        fill: '#201020',
        glow: sb > 0.5 ? 9 : 4,
        opacity: Math.max(0.55, sb + 0.35),
      }),
      txt('(x, Reply B)', -15, 108, 28, COSMOS.rose, 'mono'),
      txt('Prompt + access enabled', -15, 158, 26, COSMOS.ink, 'sans'),

      // Center-right shared reward model core (single circle scorer)
      circle(102, { fill: '#171530', stroke: COSMOS.violet, width: 3.6 })
        .at(380, 0)
        .glow(12 * pulse, COSMOS.violet),
      txt('SHARED', 380, -40, 26, COSMOS.violet, 'mono'),
      txt('SCORER', 380, 0, 32, COSMOS.gold, 'mono').glow(6, COSMOS.gold),
      txt('same θ', 380, 42, 26, COSMOS.muted, 'mono'),

      // Conduits from A and B into the shared scorer
      glowingArc([165, -135], [285, -35], -25, {
        color: COSMOS.emerald,
        width: 3.4,
        opacity: Math.max(0.45, sa),
      }),
      glowingArc([165, 135], [285, 35], 25, {
        color: COSMOS.rose,
        width: 3.4,
        opacity: Math.max(0.45, sb),
      }),

      // Scalar output readouts on far right
      glowingArc([482, -28], [625, -135], -20, {
        color: COSMOS.emerald,
        width: 3.5,
        opacity: Math.max(0.35, sa),
      }),
      txt('r(x, A)', 735, -172, 26, COSMOS.muted, 'mono').opacity(Math.max(0.45, sa)),
      txt(sa > 0.4 ? SCORE_A.toFixed(1) : '...', 735, -112, 54, COSMOS.emerald, 'mono')
        .glow(8, COSMOS.emerald)
        .opacity(Math.max(0.45, sa)),

      glowingArc([482, 28], [625, 105], 20, {
        color: COSMOS.rose,
        width: 3.5,
        opacity: Math.max(0.35, sb),
      }),
      txt('r(x, B)', 735, 68, 26, COSMOS.muted, 'mono').opacity(Math.max(0.45, sb)),
      txt(sb > 0.4 ? SCORE_B.toFixed(1) : '...', 735, 128, 54, COSMOS.rose, 'mono')
        .glow(8, COSMOS.rose)
        .opacity(Math.max(0.45, sb)),

      // Bottom-left token-stream indicator
      txt('TOKEN-BY-TOKEN GENERATION', -855, 290, 26, COSMOS.cyan, 'mono', 'left'),
      line([-855, 345], [-210, 345], { stroke: '#253458', width: 3 }),
      ...['Request', 'a', 'review', 'ticket', '.'].map((tok, i) => {
        const tx = -790 + i * 130;
        const lit = tf * 5 > i;
        return group(
          circle(8, { fill: lit ? COSMOS.cyan : '#314066', stroke: null }).at(tx, 345),
          txt(tok, tx, 392, 26, lit ? COSMOS.ink : COSMOS.dim, 'mono'),
        );
      }),

      // Bottom-right dimensionless scalar axis
      txt('DIMENSIONLESS RANKING AXIS', axisX0, axisY + 95, 26, COSMOS.muted, 'mono', 'left'),
      line([axisX0, axisY + 150], [axisX1, axisY + 150], { stroke: '#45598a', width: 3 }),
      txt('0.0', axisX0, axisY + 190, 26, COSMOS.dim, 'mono'),
      txt('2.0', mapR(2.0), axisY + 190, 26, COSMOS.dim, 'mono'),
    ];

    // Live photon traveling into scorer
    const u = (p * 0.55) % 1;
    nodes.push(
      glowDot(-520 + u * 320, -60 - u * 75, { radius: 6, color: COSMOS.cyan }),
      glowDot(165 + u * 115, (sb > 0.5 ? 135 : -135) * (1 - u), {
        radius: 6,
        color: sb > 0.5 ? COSMOS.rose : COSMOS.emerald,
      }),
    );

    if (sa > 0.1) {
      nodes.push(
        glowDot(xA, axisY + 150, { radius: 10, color: COSMOS.emerald, opacity: sa }),
        txt(`A: ${SCORE_A.toFixed(1)}`, xA, axisY + 112, 26, COSMOS.emerald, 'mono').opacity(sa),
      );
    }
    if (sb > 0.1) {
      nodes.push(
        glowDot(xB, axisY + 150, { radius: 10, color: COSMOS.rose, opacity: sb }),
        txt(`B: ${SCORE_B.toFixed(1)}`, xB, axisY + 112, 26, COSMOS.rose, 'mono').opacity(sb),
        glowingTrail(
          [
            [xB, axisY + 150],
            [xA, axisY + 150],
          ],
          { gradientColors: [COSMOS.rose, COSMOS.gold, COSMOS.emerald], width: 5, opacity: sb },
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);
  runPhase(s, c, phase, 14);

  c.on('policy-write', () => s.play(tokenFlow.to(1, { duration: 0.65 })));
  c.on('score-answer-a', () => s.play(scoredA.to(1, { duration: 0.55 })));
  c.on('score-answer-b', () =>
    s.play(scoredB.to(1, { duration: remainDuration(c, 'score-answer-b', 0.65) })),
  );
}
