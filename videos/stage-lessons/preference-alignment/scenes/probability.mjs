// Scene 13: What chance does the model give the vote? (DPO sigmoid 0 -> 0.5 -> 2.5 vs 3.3% exact generation prob)
import {
  COSMOS,
  DPO_WORKED,
  EXAMPLE,
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
  remainDuration,
  runPhase,
  sampleCurve,
  sigmoid,
  txt,
} from '../parts.mjs';

export default function probability(s, c) {
  const phase = s.value(0);
  const sEven = s.value(0);
  const sWorked = s.value(0);
  const sGen = s.value(0);
  const sGrow = s.value(0);

  const bgAura = aura(340, 10, 560, '#14385c28', '#123e3618');
  const title = heroTitle(['What Chance Does the', 'Model Give the Vote?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'PAIRWISE VOTE PROBABILITY sigma(beta*m) vs EXACT GENERATION CHANCE',
  });

  // Sigmoid plot on right half: z = beta * m in [-1, 3.5]
  const px0 = 20;
  const px1 = 830;
  const pyBot = 215;
  const pyTop = -230;
  const mapX = (z) => px0 + ((z + 1) / 4.5) * (px1 - px0);
  const mapY = (p) => pyBot - p * (pyBot - pyTop);
  const sigPts = sampleCurve((z) => sigmoid(z), [-1, 3.5], [0, 1], px0, px1, pyBot, pyTop, 80);

  const live = guardedDynamic(s.value(1), () => {
    const ph = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(ph * 3.8);
    const ev = Math.max(0.75, sEven.value);
    const wk = sWorked.value;
    const gn = sGen.value;
    const gr = sGrow.value;

    // Margin m moves: 0 -> 1.0 (wk) -> 5.0 (gr)
    const margin = gr > 0.02 ? prefLerp(1.0, 5.0, gr) : prefLerp(0.0, 1.0, wk);
    const z = EXAMPLE.beta * margin;
    const voteProb = sigmoid(z);
    const genProb = Math.exp(EXAMPLE.chosen.policy); // exp(-3.4) ~ 0.0334

    const nodes = [
      // Left: Margin & Beta status
      glassCell(-465, -140, 740, 128, COSMOS.cyan, { fill: '#0f2138', glow: 6, opacity: ev }),
      txt(
        `ROUTE MARGIN m = ${margin.toFixed(2)}    ·    beta = ${EXAMPLE.beta.toFixed(1)}`,
        -465,
        -168,
        28,
        COSMOS.cyan,
        'mono',
      ),
      txt(`SCALED LOGIT   z = beta * m = ${z.toFixed(2)}`, -465, -116, 30, COSMOS.ink, 'mono'),

      // Two distinct probabilities comparison
      glassCell(-465, 22, 740, 134, COSMOS.emerald, {
        fill: '#0e2824',
        glow: wk > 0.3 ? 10 * pulse : 5,
      }),
      txt('1. VOTE PROBABILITY  P(A > B)', -800, -14, 26, COSMOS.emerald, 'mono', 'left'),
      txt(`${(voteProb * 100).toFixed(1)}%`, -130, 22, 50, COSMOS.emerald, 'mono', 'right').glow(
        7,
        COSMOS.emerald,
      ),
      txt('Preference over this exact pair', -800, 44, 26, COSMOS.muted, 'sans', 'left'),

      glassCell(-465, 184, 740, 134, gn > 0.2 ? COSMOS.amber : COSMOS.dim, {
        fill: gn > 0.2 ? '#261a0e' : '#12182b',
        glow: gn > 0.2 ? 9 * pulse : 3,
        opacity: Math.max(0.75, gn),
      }),
      txt('2. EXACT GENERATION  exp(-3.4)', -800, 148, 26, COSMOS.amber, 'mono', 'left'),
      txt(`~${(genProb * 100).toFixed(1)}%`, -130, 184, 50, COSMOS.amber, 'mono', 'right'),
      txt('Chance of writing those exact tokens', -800, 206, 26, COSMOS.muted, 'sans', 'left'),

      // Right plot
      txt('DPO SIGMOID  sigma(beta * m)', 425, -310, 26, COSMOS.gold, 'mono'),
      line([px0, pyBot], [px1, pyBot], { stroke: COSMOS.rule, width: 2.2 }),
      line([mapX(0), pyBot], [mapX(0), pyTop], { stroke: COSMOS.rule, width: 2, dash: [6, 6] }),
      line([px0, mapY(0.5)], [px1, mapY(0.5)], { stroke: COSMOS.dim, width: 2, dash: [8, 6] }),
      txt('50%', px0 + 12, mapY(0.5) - 24, 26, COSMOS.muted, 'mono', 'left'),
      txt('100%', px0 + 12, pyTop + 26, 26, COSMOS.muted, 'mono', 'left'),
      txt('0', mapX(0), pyBot + 40, 26, COSMOS.muted, 'mono'),
      txt('0.5', mapX(0.5), pyBot + 40, 26, COSMOS.cyan, 'mono'),
      txt('2.5', mapX(2.5), pyBot + 40, 26, COSMOS.gold, 'mono'),
      txt('SCALED MARGIN  z = beta * m', 425, pyBot + 94, 26, COSMOS.muted, 'mono'),

      glowingTrail(sigPts, { color: COSMOS.cyan, width: 4.8, glow: 10 }),

      // Active moving point
      line([mapX(z), pyBot], [mapX(z), mapY(voteProb)], {
        stroke: COSMOS.gold,
        width: 2.4,
        dash: [6, 5],
      }),
      glowDot(mapX(z), mapY(voteProb), { radius: 10, color: COSMOS.gold, glow: 15 }),
      txt(
        `${(voteProb * 100).toFixed(1)}%`,
        mapX(z) - 24,
        mapY(voteProb) - 48,
        32,
        COSMOS.gold,
        'mono',
        'right',
      ).glow(6, COSMOS.gold),

      txt(
        gr > 0.5
          ? 'At m = 5 (z = 2.5), sigmoid saturates near 92.4% (flat ceiling)'
          : `At m = 1 (z = 0.5), P(A > B) = ${(DPO_WORKED.probability * 100).toFixed(1)}% vs exact reply ~3.3%`,
        425,
        396,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  const eqProb = glowTex('P(A > B) = \\sigma(\\beta m) \\neq \\pi_\\theta(A \\mid x)', {
    x: -465,
    y: 356,
    size: 34,
    color: COSMOS.gold,
    glow: 6,
  });

  s.add(bgAura, title, live, eqProb);
  runPhase(s, c, phase, 14);

  c.on('sig-even', () => s.play(sEven.to(1, { duration: remainDuration(c, 'sig-even', 0.45) })));
  c.on('sig-worked', () =>
    s.play(sWorked.to(1, { duration: remainDuration(c, 'sig-worked', 0.85) })),
  );
  c.on('sig-generation', () =>
    s.play(sGen.to(1, { duration: remainDuration(c, 'sig-generation', 0.55) })),
  );
  c.on('sig-grow', () => s.play(sGrow.to(1, { duration: remainDuration(c, 'sig-grow', 1.25) })));
}
