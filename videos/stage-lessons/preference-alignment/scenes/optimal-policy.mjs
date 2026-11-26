// Scene 10: The reference distribution is tilted and renormalized (Boltzmann optimal policy + 3D beta-KL landscape)
import {
  COSMOS,
  TILT_WORKED,
  aura,
  buildBetaKlSurface3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  prefLerp,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function optimalPolicy(s, c) {
  const phase = s.value(0);
  const sForm = s.value(0);
  const sSetup = s.value(0);
  const sMass = s.value(0);
  const sNorm = s.value(0);
  const sKl = s.value(0);

  const bgAura = aura(425, 20, 560, '#14385c28', '#2f1a4d18');
  const beta3d = buildBetaKlSurface3d(phase, { x: 440, y: 15 });

  const title = heroTitle(['The Reference Distribution', 'Is Tilted & Renormalized'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'CLOSED-FORM RLHF OPTIMUM · BOLTZMANN TILT & PARTITION Z(x)',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const ms = sMass.value;
    const nm = sNorm.value;
    const kl = sKl.value;

    // Bar heights animate: Ref [0.5, 0.5] -> Tilted [1.5, 0.5] -> Normalized [0.75, 0.25]
    const vA = nm > 0.05 ? prefLerp(1.5, TILT_WORKED.probabilities[0], nm) : prefLerp(0.5, 1.5, ms);
    const vB = nm > 0.05 ? prefLerp(0.5, TILT_WORKED.probabilities[1], nm) : prefLerp(0.5, 0.5, ms);

    const baseY = 92;
    const scaleH = 142; // 1.5 -> 213px
    const hA = vA * scaleH;
    const hB = vB * scaleH;

    const stageLabel =
      nm > 0.4
        ? 'RENORMALIZED  pi* = [0.75, 0.25]  (Z = 2.0)'
        : ms > 0.4
          ? 'UNNORMALIZED MASSES  [1.50, 0.50]  (SUM Z = 2.0)'
          : 'REF [0.50, 0.50]  ·  r = [ln 3, 0], beta = 1';

    const nodes = [
      txt(stageLabel, -855, -208, 26, COSMOS.cyan, 'mono', 'left'),

      // Bar plot baseline
      line([-840, baseY], [-90, baseY], { stroke: COSMOS.rule, width: 2.4 }),

      // Bar A (r = ln 3 -> e^r = 3)
      rect(180, hA, { fill: '#103b33', stroke: COSMOS.emerald, width: 2.6, radius: 8 })
        .at(-625, baseY - hA * 0.5)
        .glow(8 * pulse, COSMOS.emerald),
      txt(vA.toFixed(2), -625, baseY - hA - 30, 34, COSMOS.emerald, 'mono').glow(6, COSMOS.emerald),
      txt('ANSWER A (r = ln 3)', -625, baseY + 38, 26, COSMOS.emerald, 'mono'),

      // Bar B (r = 0 -> e^r = 1)
      rect(180, hB, { fill: '#102138', stroke: COSMOS.cyan, width: 2.6, radius: 8 })
        .at(-305, baseY - hB * 0.5)
        .glow(5, COSMOS.cyan),
      txt(vB.toFixed(2), -305, baseY - hB - 30, 34, COSMOS.cyan, 'mono'),
      txt('ANSWER B (r = 0)', -305, baseY + 38, 26, COSMOS.cyan, 'mono'),

      // Floating KL optimality caption
      txt(
        kl > 0.2
          ? 'J(pi) = -beta KL(pi || pi*) + beta ln Z(x)'
          : 'Requires beta > 0, finite Z(x), support in pi_ref',
        -855,
        344,
        26,
        kl > 0.2 ? COSMOS.gold : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        kl > 0.2
          ? 'Nonnegative KL makes pi* optimal (finite nets approximate it)'
          : 'Prompt constant beta ln Z(x) is independent of pi',
        -855,
        396,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Right 3D header
      txt('3D REWARD - beta KL LANDSCAPE', 440, -365, 26, COSMOS.gold, 'mono'),
      txt('Gold ridge traces closed-form optimum pi*(beta)', 440, 396, 26, COSMOS.muted, 'sans'),
    ];

    return group(...nodes);
  });

  const eqOpt = glowTex(
    '\\pi^*(y \\mid x) = \\frac{1}{Z(x)} \\pi_{\\text{ref}}(y \\mid x) \\exp\\!\\left(\\frac{r(x,y)}{\\beta}\\right)',
    {
      x: -465,
      y: 236,
      size: 32,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, beta3d, title, live, eqOpt);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, beta3d, { theta: -0.22, phi: 0.92 });

  c.on('optimal-policy-b0', () =>
    s.play(sForm.to(1, { duration: remainDuration(c, 'optimal-policy-b0', 0.45) })),
  );
  c.on('optimal-policy-b1', () =>
    s.play(sSetup.to(1, { duration: remainDuration(c, 'optimal-policy-b1', 0.45) })),
  );
  c.on('pa-tilt-masses', () =>
    s.play(sMass.to(1, { duration: remainDuration(c, 'pa-tilt-masses', 0.65) })),
  );
  c.on('pa-tilt-normalize', () =>
    s.play(sNorm.to(1, { duration: remainDuration(c, 'pa-tilt-normalize', 0.65) })),
  );
  c.on('optimal-policy-b2', () =>
    s.play(sKl.to(1, { duration: remainDuration(c, 'optimal-policy-b2', 0.5) })),
  );
}
