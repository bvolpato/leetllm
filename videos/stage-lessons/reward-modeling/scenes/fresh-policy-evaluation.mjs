// Scene 20: The writer changes what the judge sees: 92% stored vs 64% fresh + orbiting 3D Goodhart overoptimization landscape!
import {
  COSMOS,
  aura,
  buildGoodhartLandscape3d,
  goodhartGoldZ,
  goodhartProxyZ,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  radialDial,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function freshPolicyEvaluation(s, c) {
  const phase = s.value(0);
  const freshShow = s.value(0.35);
  const optProgress = s.value(0.18);

  const { view: landscape3d } = buildGoodhartLandscape3d(optProgress, { x: 325, y: 15 });
  const bgAura = aura(325, 15, 560, '#fb923c24', '#6ee7b716');

  const title = heroTitle(['Goodhart Drift', 'Under Policy Shift'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.amber,
    eyebrow: 'FRESH ROLLOUTS · PROXY OVEROPTIMIZATION',
  });

  const live = guardedDynamic(1, () => {
    const fs = freshShow.value;
    const u = optProgress.value;
    const proxyVal = goodhartProxyZ(u);
    const goldVal = goodhartGoldZ(u);
    const gap = Math.max(0, proxyVal - goldVal);

    const nodes = [
      // Left-top: Stored 92% vs Fresh 64% radial gauges (generous clearance from labels)
      radialDial(-705, -62, 98, 0.92, {
        color: COSMOS.cyan,
        width: 10,
        glow: 9,
      }),
      txt('STORED PAIRS', -705, -206, 26, COSMOS.muted, 'mono'),
      txt('92%', -705, -58, 44, COSMOS.cyan, 'mono').glow(7, COSMOS.cyan),
      txt('past policy', -705, 64, 26, COSMOS.muted, 'sans'),

      radialDial(-415, -62, 98, 0.64 * Math.max(0.25, fs), {
        color: COSMOS.rose,
        width: 10,
        glow: 11,
        opacity: Math.max(0.5, fs),
      }),
      txt('FRESH ROLLOUTS', -415, -206, 26, COSMOS.rose, 'mono').opacity(Math.max(0.5, fs)),
      txt('64%', -415, -58, 44, COSMOS.rose, 'mono')
        .glow(8, COSMOS.rose)
        .opacity(Math.max(0.5, fs)),
      txt('new writer outputs', -415, 64, 26, COSMOS.muted, 'sans').opacity(Math.max(0.5, fs)),

      // Left-bottom: Live Goodhart telemetry from 3D trajectories
      txt('PROXY REWARD (OPTIMIZED)', -855, 165, 26, COSMOS.amber, 'mono', 'left'),
      txt(`${proxyVal.toFixed(2)}  ↗`, -855, 220, 44, COSMOS.amber, 'mono', 'left').glow(
        7,
        COSMOS.amber,
      ),

      txt('GOLD QUALITY (INDEPENDENT)', -855, 295, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        `${goldVal.toFixed(2)}  ${u > 0.55 ? '↘ COLLAPSE' : '↗'}`,
        -855,
        350,
        42,
        u > 0.55 ? COSMOS.rose : COSMOS.emerald,
        'mono',
        'left',
      ).glow(7, u > 0.55 ? COSMOS.rose : COSMOS.emerald),

      txt(
        u > 0.6
          ? `Goodhart gap: +${gap.toFixed(2)} (Gao et al. schematic)`
          : 'Human review + task checks supply independent evidence',
        -855,
        420,
        26,
        u > 0.6 ? COSMOS.rose : COSMOS.muted,
        'sans',
        'left',
      ),

      // 3D viewport captions (no chrome)
      txt('3D OVEROPTIMIZATION LANDSCAPE', 325, -405, 26, COSMOS.amber, 'mono').glow(
        5,
        COSMOS.amber,
      ),
      txt(
        'Amber = proxy climbs  ·  Emerald = gold peaks & falls',
        325,
        428,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, landscape3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, landscape3d, { theta: -0.18, phi: 0.92 });

  c.on('fresh-samples', () => s.play(freshShow.to(1, { duration: 0.55 })));
  c.on('optimization-first-phase', () => s.play(optProgress.to(0.58, { duration: 0.85 })));
  c.on('fresh-policy-evaluation-b3-1', () => s.play(optProgress.to(0.8, { duration: 0.65 })));
  c.on('fresh-policy-evaluation-b3-2', () =>
    s.play(
      optProgress.to(1.0, {
        duration: remainDuration(c, 'fresh-policy-evaluation-b3-2', 0.85),
      }),
    ),
  );
}
