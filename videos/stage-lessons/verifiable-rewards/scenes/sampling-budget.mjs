// Scene 18: Calculate whether another group is likely to be informative (1 - p^G - (1-p)^G curve & DAPO)
import {
  COSMOS,
  MIXED_01_64,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  rlvrMixedProbability,
  runPhase,
  txt,
} from '../parts.mjs';

export default function samplingBudget(s, c) {
  const phase = s.value(0);
  const sMixed = s.value(0);
  const sRes = s.value(0);
  const sZero = s.value(0);
  const sFilter = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#2e1d5214');
  const title = heroTitle(['Is Another Group Likely', 'to Be Informative?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'SAMPLING BUDGET · MIXED-GROUP PROBABILITY AT G = 64',
  });

  // Exact mixed-group probability curve for G = 64 over p in [0, 0.12]
  const px0 = -760;
  const px1 = -40;
  const pyBot = 235;
  const pyTop = -135;
  const mapX = (prob) => px0 + (prob / 0.12) * (px1 - px0);
  const mapY = (m) => pyBot - m * (pyBot - pyTop);
  const curvePts = Array.from({ length: 49 }, (_, i) => {
    const prob = (0.12 * i) / 48;
    const m = rlvrMixedProbability(prob, 64).mixed;
    return [mapX(prob), mapY(m)];
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sm = Math.max(0.65, sMixed.value);
    const sr = sRes.value;
    const sz = sZero.value;
    const sf = sFilter.value;

    const pt01X = mapX(0.01);
    const pt01Y = mapY(MIXED_01_64.mixed);

    const nodes = [
      line([px0, pyBot], [px1 + 24, pyBot], { stroke: COSMOS.rule, width: 2.2 }),
      line([px0, pyBot], [px0, pyTop - 24], { stroke: COSMOS.rule, width: 2.2 }),
      txt('P(MIXED GROUP, G = 64)', px0, pyTop - 52, 26, COSMOS.cyan, 'mono', 'left'),
      txt('PASS RATE p  (0% -> 12%)', (px0 + px1) * 0.5, pyBot + 52, 26, COSMOS.muted, 'mono'),

      glowingTrail(curvePts, {
        gradientColors: [COSMOS.rose, COSMOS.gold, COSMOS.emerald],
        width: 4.8,
        opacity: sm,
      }),
      glowDot(pt01X, pt01Y, { radius: 9, color: COSMOS.gold }),
      txt(
        sr > 0.3 ? `p=1% -> ${(MIXED_01_64.mixed * 100).toFixed(1)}%` : 'p = 1%',
        pt01X + 18,
        pt01Y - 12,
        28,
        COSMOS.gold,
        'mono',
        'left',
      ).glow(sr > 0.3 ? 7 : 2, COSMOS.gold),

      // Right column: exact telemetry & DAPO filtering
      glassCell(445, -108, 720, 148, COSMOS.gold, {
        fill: '#221c0f',
        glow: sr > 0.3 ? 9 * pulse : 4,
      }),
      txt('AT p = 0.01, G = 64 INDEPENDENT DRAWS', 445, -144, 26, COSMOS.muted, 'mono'),
      txt(
        `P(mixed) = ${(MIXED_01_64.mixed * 100).toFixed(1)}%   (all-fail = ${(MIXED_01_64.allFail * 100).toFixed(1)}%)`,
        445,
        -86,
        30,
        COSMOS.gold,
        'mono',
      ),

      glassCell(445, 76, 720, 148, sz > 0.3 ? COSMOS.rose : COSMOS.cyan, {
        fill: sz > 0.3 ? '#281119' : '#102138',
        glow: sz > 0.3 || sf > 0.3 ? 8 : 3,
      }),
      txt(
        sf > 0.3 ? 'DAPO DYNAMIC FILTERING' : 'ZERO PASS RATE LIMIT',
        445,
        38,
        26,
        sf > 0.3 ? COSMOS.emerald : COSMOS.rose,
        'mono',
      ),
      txt(
        sf > 0.3
          ? 'Drops uniform groups · bound retries on impossible tasks'
          : 'At p = 0, P(mixed) = 0 for EVERY finite group size G',
        445,
        96,
        26,
        COSMOS.ink,
        'sans',
      ),

      txt(
        'Log sampled + discarded tokens & wall time · diagnose syntax, capability & verifier health first',
        0,
        352,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  const eqMix = glowTex('P(\\text{mixed}) = 1 - p^G - (1 - p)^G', {
    x: 445,
    y: 235,
    size: 36,
    color: COSMOS.cyan,
    glow: 6,
  });

  s.add(bgAura, title, live, eqMix);
  runPhase(s, c, phase, 14);

  c.on('vr-sampling-budget-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-mixed-sampling-budget', () => s.play(sMixed.to(1, { duration: 0.45 })));
  c.on('vr-result-sampling-budget', () => s.play(sRes.to(1, { duration: 0.45 })));
  c.on('vr-sampling-budget-b1', () => s.play(sZero.to(0.6, { duration: 0.35 })));
  c.on('vr-zero-sampling-budget', () => s.play(sZero.to(1, { duration: 0.45 })));
  c.on('vr-sampling-budget-b2', () => s.play(sFilter.to(0.6, { duration: 0.35 })));
  c.on('vr-filter-sampling-budget', () =>
    s.play(sFilter.to(1, { duration: remainDuration(c, 'vr-filter-sampling-budget', 0.45) })),
  );
}
