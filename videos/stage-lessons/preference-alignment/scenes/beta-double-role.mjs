// Scene 18: Initial gradient scale differs from the ideal drift tradeoff (Dual role of beta + 3D beta-KL surface)
import {
  COSMOS,
  aura,
  buildBetaKlSurface3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  sigmoid,
  txt,
} from '../parts.mjs';

export default function betaDoubleRole(s, c) {
  const phase = s.value(0);
  const sGradEq = s.value(0);
  const sInitSlope = s.value(0);
  const sStepReplay = s.value(0);
  const sPop = s.value(0);
  const sTargets = s.value(0);
  const sTradeoff = s.value(0);

  const bgAura = aura(430, 20, 560, '#14385c28', '#2e1a4a18');
  const beta3d = buildBetaKlSurface3d(phase, { x: 455, y: 20 });

  const title = heroTitle(['Initial Gradient Scale Differs', 'From the Ideal Drift Tradeoff'], {
    x: -855,
    y: -415,
    size: 50,
    lineHeight: 60,
    accent: COSMOS.gold,
    eyebrow: 'THE DUAL ROLE OF BETA · STEP-0 SLOPE (-beta/2) vs OPTIMUM sigma(ln 3 / beta)',
  });

  const betas = [
    { val: 0.1, col: COSMOS.rose, pTxt: '99.998%' },
    { val: 0.5, col: COSMOS.cyan, pTxt: '90.0%' },
    { val: 1.0, col: COSMOS.emerald, pTxt: '75.0%' },
  ];

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const inS = Math.max(0.75, sInitSlope.value);
    const rp = sStepReplay.value;
    const tg = sTargets.value;
    const tr = sTradeoff.value;

    const nodes = [
      txt('STEP-0 SLOPE (-beta/2)', -855, -214, 26, COSMOS.cyan, 'mono', 'left'),
      txt('IDEAL P*(A) AT 75% VOTE', -390, -214, 26, COSMOS.gold, 'mono', 'left'),
    ];

    betas.forEach((b, i) => {
      const cy = -124 + i * 124;
      const slope = -b.val / 2;
      const idealP = sigmoid(Math.log(3) / b.val);
      const slopeBarW = Math.abs(slope) * 280; // 0.5 -> 140px
      const probBarW = idealP * 210;

      nodes.push(
        // Left cell: initial slope
        glassCell(-645, cy, 420, 102, b.col, {
          fill: '#101a2e',
          glow: b.val === 0.5 && rp > 0.2 ? 10 * pulse : 4,
          opacity: inS,
        }),
        txt(`beta = ${b.val.toFixed(1)}`, -825, cy - 20, 26, b.col, 'mono', 'left'),
        txt(`dL/dm = ${slope.toFixed(2)}`, -825, cy + 20, 26, COSMOS.ink, 'mono', 'left'),
        rect(slopeBarW, 24, { fill: b.col, stroke: null, radius: 5 })
          .at(-600 + slopeBarW * 0.5, cy + 20)
          .opacity(0.85),

        // Right cell: ideal population policy P*(A)
        glassCell(-175, cy, 440, 102, b.col, {
          fill: '#12182b',
          glow: tg > 0.3 ? 9 * pulse : 4,
          opacity: Math.max(0.75, sPop.value),
        }),
        txt(
          tg > 0.2 ? `P*(A) = ${b.pTxt}` : `m* = ln(3)/${b.val.toFixed(1)}`,
          -365,
          cy - 20,
          26,
          b.col,
          'mono',
          'left',
        ),
        rect(probBarW, 24, { fill: b.col, stroke: null, radius: 5 })
          .at(-365 + probBarW * 0.5, cy + 20)
          .opacity(0.85),
      );
    });

    nodes.push(
      glassCell(-410, 256, 890, 110, tr > 0.2 ? COSMOS.gold : COSMOS.cyan, {
        fill: tr > 0.2 ? '#221c0e' : '#101d34',
        glow: tr > 0.2 ? 9 * pulse : 4,
      }),
      txt(
        tr > 0.2
          ? 'Larger beta: steeper initial gradient, closer optimum to ref'
          : rp > 0.2 && tg < 0.2
            ? 'At beta = 0.5, m = 0: grad = [-0.25, +0.25] -> logits +/-0.10'
            : 'At m = 0, L = ln 2 (0.693) for all beta; slope = -beta/2',
        -410,
        258,
        26,
        tr > 0.2 ? COSMOS.gold : COSMOS.ink,
        'sans',
      ),

      // Right 3D captions
      txt('3D BETA-KL OPTIMUM LANDSCAPE', 455, -365, 26, COSMOS.gold, 'mono'),
      txt('Higher beta bends the crest closer to 50% ref', 455, 396, 26, COSMOS.muted, 'sans'),
    );

    return group(...nodes);
  });

  const eqBeta = glowTex(
    '\\left.\\frac{\\partial L}{\\partial m}\\right|_{0} = -\\frac{\\beta}{2}, \\qquad P^*(A) = \\sigma\\!\\left(\\frac{\\ln 3}{\\beta}\\right)',
    {
      x: -410,
      y: 374,
      size: 32,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, beta3d, title, live, eqBeta);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, beta3d, { theta: -0.22, phi: 0.92 });

  c.on('beta-double-role-b0', () =>
    s.play(sGradEq.to(1, { duration: remainDuration(c, 'beta-double-role-b0', 0.45) })),
  );
  c.on('pa-beta-initial', () =>
    s.play(sInitSlope.to(1, { duration: remainDuration(c, 'pa-beta-initial', 0.5) })),
  );
  c.on('beta-double-role-b1', () =>
    s.play(sStepReplay.to(1, { duration: remainDuration(c, 'beta-double-role-b1', 0.65) })),
  );
  c.on('beta-double-role-b2', () =>
    s.play(sPop.to(1, { duration: remainDuration(c, 'beta-double-role-b2', 0.5) })),
  );
  c.on('pa-beta-target', () =>
    s.play(sTargets.to(1, { duration: remainDuration(c, 'pa-beta-target', 0.55) })),
  );
  c.on('beta-double-role-b3', () =>
    s.play(sTradeoff.to(1, { duration: remainDuration(c, 'beta-double-role-b3', 0.55) })),
  );
}
