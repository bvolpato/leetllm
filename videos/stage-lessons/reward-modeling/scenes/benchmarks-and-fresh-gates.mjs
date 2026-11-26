// Scene 22: Keep benchmark construction beside the result: RB2 1-of-4 (25% baseline), BoN-16 r=0.87, 80% fresh screen fail.
import {
  COSMOS,
  aura,
  circle,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  radialDial,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function benchmarksAndFreshGates(s, c) {
  const phase = s.value(0);
  const showOneOfFour = s.value(0.45);
  const showCorr = s.value(0);
  const showGate = s.value(0);
  const gateFail = s.value(0);

  const bgAura = aura(150, 15, 580, '#5ce1e61e', '#ff6b8b16');
  const title = heroTitle(['Benchmarks &', 'Fresh-Output Gates'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'REWARDBENCH 2 (1-OF-4)  ·  FRESH ROLLOUT AUDIT',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const f4 = showOneOfFour.value;
    const cr = showCorr.value;
    const gt = showGate.value;
    const gf = gateFail.value;
    const pulse = 0.65 + 0.35 * Math.sin(p * 3.4);

    // Left-center: 1-of-4 Outcome Geometry (25% random chance vs 50% binary)
    const cx = -575;
    const cy = 20;
    const rad = 148;
    const fourPts = [
      [cx - rad, cy - 60],
      [cx + rad, cy - 60],
      [cx + rad, cy + 85],
      [cx - rad, cy + 85],
    ];

    // Middle: Tulu 3 8B BoN-16 correlation scatter (r = 0.87)
    const sx0 = -175;
    const sx1 = 240;
    const sy0 = 165;
    const sy1 = -165;
    const scat = [
      [0.12, 0.18],
      [0.24, 0.28],
      [0.36, 0.31],
      [0.45, 0.52],
      [0.58, 0.55],
      [0.68, 0.72],
      [0.77, 0.74],
      [0.86, 0.89],
      [0.92, 0.88],
    ];

    const nodes = [
      // Column 1: RewardBench 2 1-of-4 geometry (clean clearance from dial and larger orb rims)
      txt('REWARDBENCH 2 (6 DOMAINS)', cx, -215, 26, COSMOS.cyan, 'mono'),
      txt('1 winner of 4 → 25% baseline', cx, -168, 26, COSMOS.gold, 'mono').opacity(
        Math.max(0.5, f4),
      ),
      radialDial(cx, cy + 4, 98, 0.25, {
        color: COSMOS.cyan,
        width: 10,
        glow: 9 * Math.max(0.5, f4),
      }),
      txt('25%', cx, cy + 8, 42, COSMOS.cyan, 'mono').glow(7, COSMOS.cyan),
      txt('vs 50% pair', cx, cy + 142, 26, COSMOS.muted, 'mono'),
      ...fourPts.map((pt, i) =>
        group(
          circle(32, {
            fill: i === 0 ? '#0d2624' : '#12182b',
            stroke: i === 0 ? COSMOS.emerald : COSMOS.dim,
            width: i === 0 ? 3 : 2,
          })
            .at(pt[0], pt[1])
            .glow(i === 0 ? 8 : 0, COSMOS.emerald),
          txt(
            i === 0 ? '★' : `y${i + 1}`,
            pt[0],
            pt[1] + 2,
            26,
            i === 0 ? COSMOS.emerald : COSMOS.muted,
            'mono',
          ),
        ),
      ),
      txt('Ties uses a separate metric', cx, 212, 26, COSMOS.muted, 'sans'),

      // Column 2: Best-of-16 Correlation (r = 0.87)
      txt('BEST-OF-16 CORRELATION', (sx0 + sx1) * 0.5, -210, 26, COSMOS.violet, 'mono').opacity(
        Math.max(0.45, cr),
      ),
      line([sx0, sy0], [sx1, sy0], { stroke: '#455885', width: 2.2 }).opacity(Math.max(0.45, cr)),
      line([sx0, sy0], [sx0, sy1], { stroke: '#455885', width: 2.2 }).opacity(Math.max(0.45, cr)),
      glowingTrail(
        [
          [sx0 + 18, sy0 - 25],
          [sx1 - 15, sy1 + 20],
        ],
        { color: COSMOS.violet, width: 3.6, opacity: 0.8 * Math.max(0.4, cr) },
      ),
      ...scat.map(([ux, uy]) =>
        glowDot(sx0 + ux * (sx1 - sx0), sy0 - uy * (sy0 - sy1), {
          radius: 6,
          color: COSMOS.cyan,
          opacity: Math.max(0.4, cr),
        }),
      ),
      txt('r = 0.87', (sx0 + sx1) * 0.5, -142, 42, COSMOS.violet, 'mono')
        .glow(7, COSMOS.violet)
        .opacity(Math.max(0.45, cr)),
      txt(
        'Tulu 3 8B · PPO less sensitive',
        (sx0 + sx1) * 0.5,
        212,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(Math.max(0.45, cr)),

      // Column 3: Fresh Rollout Gate (92% stored vs 64% fresh < 80% gate)
      txt('FRESH-OUTPUT GATE', 585, -210, 26, COSMOS.rose, 'mono'),
      radialDial(585, 12, 134, 0.64 * Math.max(0.35, gt), {
        color: gf > 0.4 ? COSMOS.rose : COSMOS.amber,
        width: 13,
        glow: 12 * pulse,
      }),
      txt('64%', 585, -10, 56, gf > 0.4 ? COSMOS.rose : COSMOS.amber, 'mono').glow(
        9,
        gf > 0.4 ? COSMOS.rose : COSMOS.amber,
      ),
      txt('gate ≥ 80%', 585, 48, 28, COSMOS.gold, 'mono'),
      txt(
        gf > 0.4 ? 'SCREEN FAILS' : 'stored: 92%',
        585,
        195,
        30,
        gf > 0.4 ? COSMOS.rose : COSMOS.cyan,
        'mono',
      ).glow(gf > 0.4 ? 8 : 5, gf > 0.4 ? COSMOS.rose : COSMOS.cyan),

      // Bottom audit checklist
      line([-855, 295], [810, 295], { stroke: '#253355', width: 2 }),
      txt(
        'Break out long wrong answers · report counts, margins, midpoint drift & calibration per group',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('benchmark-four', () => s.play(showOneOfFour.to(0.8, { duration: 0.4 })));
  c.on('benchmarks-and-fresh-gates-step-1', () => s.play(showOneOfFour.to(1, { duration: 0.4 })));
  c.on('benchmarks-and-fresh-gates-step-2', () => s.play(showCorr.to(1, { duration: 0.55 })));
  c.on('benchmarks-and-fresh-gates-step-3', () => s.play(showGate.to(1, { duration: 0.5 })));
  c.on('benchmark-fresh', () =>
    s.play(gateFail.to(1, { duration: remainDuration(c, 'benchmark-fresh', 0.45) })),
  );
}
