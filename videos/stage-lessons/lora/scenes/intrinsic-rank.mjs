// Scene 05: One free scalar can still change every direction: Orbiting 3D counterexample θI_3 (rank 3) vs rank-1 BA.
import {
  COSMOS,
  aura,
  cinematic3d,
  glassCell,
  glowTex,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  line3d,
  orbitScene,
  points3d,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intrinsicRank(s, c) {
  const phase = s.value(0);
  const thetaVal = s.value(1.6);
  const showBasis = s.value(0);
  const modeBA = s.value(0); // 0 = theta*I_3, 1 = rank-1 BA
  const widenRank = s.value(0);

  const bgAura = aura(320, 0, 560, '#a78bfa22', '#ffd16618');
  const title = heroTitle(['One Free Scalar', 'Can Reach All Axes'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.violet,
    eyebrow: 'COUNTEREXAMPLE · INTRINSIC DIM VS MATRIX RANK',
  });

  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.06,
    distance: 15.2,
    unit: 88,
    focus: [0, 0, 0.4],
  }).at(415, 0);

  const grid = gridPlane3d({ size: 5.2, step: 1.0, z: 0, color: '#2b3a60', opacity: 0.45 });
  const axes = [
    line3d([-2.4, 0, 0], [2.6, 0, 0], { color: '#5c709e', width: 2, opacity: 0.7 }),
    line3d([0, -2.4, 0], [0, 2.6, 0], { color: '#5c709e', width: 2, opacity: 0.7 }),
    line3d([0, 0, -0.4], [0, 0, 2.6], { color: '#5c709e', width: 2, opacity: 0.7 }),
  ];

  // Dynamic output tips for basis inputs e1, e2, e3
  const tipOf = (idx) => () => {
    const th = thetaVal.value;
    const ba = modeBA.value;
    const wid = widenRank.value;
    // In theta*I mode: e1 -> [th,0,0], e2 -> [0,th,0], e3 -> [0,0,th]
    const diag = [
      [th, 0, 0],
      [0, th, 0],
      [0, 0, th],
    ][idx];
    // In rank-1 BA mode: all 3 outputs lie on one gold line along u = [1, 0.7, 0.85]
    const coeffs = [1.5, -0.9, 0.85];
    const r1 = [coeffs[idx] * 1.0, coeffs[idx] * 0.7, coeffs[idx] * 0.85];
    // When widened to rank-2: second basis direction adds perpendicular component
    const extra = idx === 1 ? [0.6 * wid, -1.1 * wid, 0.9 * wid] : [0, 0, 0];
    const target = [r1[0] + extra[0], r1[1] + extra[1], r1[2] + extra[2]];
    return [
      diag[0] * (1 - ba) + target[0] * ba,
      diag[1] * (1 - ba) + target[1] * ba,
      diag[2] * (1 - ba) + target[2] * ba,
    ];
  };

  const vecColors = [COSMOS.cyan, COSMOS.gold, COSMOS.violet];
  const rays = [0, 1, 2].map((i) =>
    line3d([0, 0, 0], tipOf(i), {
      color: vecColors[i],
      width: 4.5,
      glow: 10,
      blend: 'screen',
      onTop: true,
    }),
  );

  // Reference rank-1 line guide
  const rank1Line = line3d([-2.0, -1.4, -1.7], [2.2, 1.54, 1.87], {
    color: COSMOS.gold,
    width: 2.0,
    opacity: 0.55,
    blend: 'screen',
  });

  const tips = points3d(() => [tipOf(0)(), tipOf(1)(), tipOf(2)()], {
    colorAt: (idx) => vecColors[idx],
    radius: 7.5,
    glow: 13,
    blend: 'screen',
    onTop: true,
  });

  view3d.add(grid, ...axes, rank1Line, ...rays, tips);

  const eq = glowTex(String.raw`\Delta W = \theta I_3 \quad \text{vs} \quad \Delta W = B A`, {
    x: 330,
    y: -385,
    size: 36,
    color: COSMOS.ink,
  });

  const live = guardedDynamic(1, () => {
    const th = thetaVal.value;
    const ba = modeBA.value;
    const wid = widenRank.value;
    const isZero = Math.abs(th) < 0.08 && ba < 0.3;

    const nodes = [
      glassCell(-555, -135, 595, 165, ba < 0.5 ? COSMOS.violet : '#334268', {
        fill: ba < 0.5 ? '#1c1636' : '#11182b',
        glow: ba < 0.5 ? 10 : 2,
      }),
      txt('COUNTEREXAMPLE:  ΔW = θ · I₃', -825, -182, 26, COSMOS.violet, 'mono', 'left'),
      txt(`1 scalar knob:  θ = ${th.toFixed(2)}`, -825, -126, 32, COSMOS.ink, 'mono', 'left'),
      txt(
        isZero
          ? 'At θ = 0: all 3 outputs vanish (rank 0)'
          : '3 independent output axes -> matrix rank 3',
        -825,
        -76,
        26,
        isZero ? COSMOS.rose : COSMOS.cyan,
        'sans',
        'left',
      ),

      glassCell(-575, 86, 560, 165, ba >= 0.5 ? COSMOS.gold : '#334268', {
        fill: ba >= 0.5 ? '#261f10' : '#11182b',
        glow: ba >= 0.5 ? 10 : 2,
      }),
      txt('LORA UPDATE:  ΔW = B · A', -825, 38, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        wid > 0.4 ? 'r = 2  ->  rank <= 2 (plane)' : 'r = 1  ->  rank <= 1 (line)',
        -825,
        94,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        wid > 0.4 ? 'Wider factors unlock more directions' : 'All 3 outputs collapse onto 1 line',
        -825,
        144,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ),

      glassCell(-575, 316, 560, 128, COSMOS.emerald, {
        fill: '#0f2228',
        glow: showBasis.value > 0.2 ? 8 : 3,
      }),
      txt('DISTINCTION TO KEEP', -825, 282, 26, COSMOS.muted, 'mono', 'left'),
      txt('Parameter count != matrix rank', -825, 336, 28, COSMOS.emerald, 'mono', 'left'),
      txt('Compare low-rank vs full tuning on held-out cases', 415, 442, 26, COSMOS.muted, 'sans'),
    ];
    return group(...nodes);
  });

  s.add(bgAura, view3d, title, eq, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, view3d, { theta: -0.2, phi: 0.94 });

  c.on('intrinsic-rank-1', () => s.play(thetaVal.to(2.0, { duration: 0.6 })));
  c.on('intrinsic-rank-2', () => s.play(showBasis.to(1, { duration: 0.45 })));
  c.on('intrinsic-zero', () => s.play(thetaVal.to(0, { duration: 0.55 })));
  c.on('intrinsic-ba', () => s.play(modeBA.to(1, { duration: 0.6 })));
  c.on('intrinsic-rank-3', () =>
    s.play(widenRank.to(1, { duration: remainDuration(c, 'intrinsic-rank-3', 0.65) })),
  );
}
