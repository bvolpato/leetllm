// Scene 08: roofline: Orbiting 3D roofline performance surface as batch rows climb 1 -> 8 -> 20 (ridge) -> 32!
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  buildRoofline3d,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  txt,
} from '../parts.mjs';

export default function roofline(s, c) {
  const rowsVal = s.value(1); // 1 -> 20 -> 32 -> 8
  const showExtension = s.value(0);

  const bgAura = aura(350, 25, 560, '#16355e28', '#103c3618');
  const view3d = buildRoofline3d(rowsVal, { x: 350, y: 25 });

  const title = heroTitle(['Roofline Model:', 'row reuse & intensity'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.wait,
  });

  const eq = glowTex(
    String.raw`\text{Intensity} = \frac{2 \cdot N \cdot W}{2 \cdot W} = N\;\text{ops/byte}`,
    {
      x: 350,
      y: -385,
      size: 34,
      color: ROLE.wait,
      glow: 6,
    },
  );

  const stageVis = s.value(1);
  const maxW = 540;
  const barX = -855;

  const layer = guardedDynamic(stageVis, (alpha) => {
    const r = Math.round(rowsVal.value);
    const roof = Math.min(200, 10 * r);
    const computeBound = r >= 20;
    const ext = showExtension.value;
    const nodes = [
      txt(
        computeBound ? 'REGIME: COMPUTE-BOUND (FLAT ROOF)' : 'REGIME: MEMORY-BANDWIDTH BOUND',
        -855,
        -215,
        28,
        computeBound ? ROLE.decode : ROLE.clockA,
        'mono',
        'left',
      )
        .glow(6, computeBound ? ROLE.decode : ROLE.clockA)
        .opacity(alpha),

      txt(`Active rows sharing 1 weight read: N = ${r}`, -855, -125, 32, ROLE.wait, 'mono', 'left')
        .glow(8, ROLE.wait)
        .opacity(alpha),
      lumBar(barX, -70, (r / 32) * maxW, 34, ROLE.wait, { opacity: alpha, maxTrackW: maxW }),

      txt(
        `Arithmetic intensity: ${r} FLOPs / weight byte`,
        -855,
        25,
        30,
        ROLE.clockA,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        `Attainable roof: ${roof} / 200  (ridge at N = 20)`,
        -855,
        95,
        30,
        computeBound ? ROLE.decode : ROLE.prefill,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barX, 150, (roof / 200) * maxW, 34, computeBound ? ROLE.decode : ROLE.prefill, {
        opacity: alpha,
        maxTrackW: maxW,
      }),
      txt(
        ext > 0.3
          ? '1 two-byte weight × 8 rows = 16 ops ÷ 2 B = 8 ops/byte'
          : 'Single decode reads full weights for 1 row; batching & prefill reuse weights',
        -855,
        285,
        28,
        ext > 0.3 ? ROLE.wait : COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
      txt(
        '3D Roofline Surface (ridge = 20 ops/byte)',
        350,
        420,
        26,
        ROLE.clockA,
        'mono',
        'center',
      ).opacity(alpha),
    ];
    return group(...nodes);
  });

  s.add(bgAura, view3d, title, eq, layer);
  orbitScene(s, c, view3d, { theta: -0.22, phi: 0.92 }, { startOffset: 0.15, endMargin: 0.5 });

  playCue(s, c, 'shared-rows', (d) => s.play(rowsVal.to(20, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'upper-bounds', (d) => s.play(rowsVal.to(32, { duration: d })), { dur: 0.7 });
  playCue(
    s,
    c,
    'roofline-core-extension',
    (d) => {
      s.play(rowsVal.to(8, { duration: d }));
      s.play(showExtension.to(1, { duration: d }));
    },
    { dur: 0.65 },
  );
  bindCueBeat(s, c, s.value(0), [
    'weight-payload',
    'arithmetic-intensity',
    'fixed-weight-bytes',
    'roofline-point',
    'profile-shapes',
  ]);
}
