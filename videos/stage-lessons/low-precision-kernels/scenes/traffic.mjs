// Scene 16: Which bytes cross memory? 3D HBM <-> Tensor Core bus: 66 B packed vs 512 B FP32 standalone dequant round-trip.
import {
  COSMOS,
  aura,
  cinematic3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line3d,
  orbitScene,
  points3d,
  remainDuration,
  runPhase,
  siliconSlab3d,
  txt,
  wireframeSlab3d,
} from '../parts.mjs';

export default function traffic(s, c) {
  const phase = s.value(0);
  const showPacked = s.value(0.4);
  const showWrite = s.value(0);
  const showReread = s.value(0);
  const showFused = s.value(0);
  const showSaved = s.value(0);

  const bgAura = aura(320, 10, 560, '#ff6b8b24', '#6ee7b71a');
  const title = heroTitle(['Which Bytes', 'Cross Memory?'], {
    x: -855,
    y: -415,
    size: 60,
    lineHeight: 70,
    accent: COSMOS.rose,
    eyebrow: 'PACKED 66 B VS 512 B INTERMEDIATE TRAFFIC',
  });

  // 3D orbiting Tensor Core / HBM memory-bus hierarchy
  const view3d = cinematic3d({
    theta: -0.74,
    phi: 1.06,
    distance: 15.8,
    unit: 86,
    focus: [0, 0, 0.2],
  }).at(380, -10);

  const tcSlab = siliconSlab3d(2.3, 1.45, 2.2, 0.34, '#1b4f6e', COSMOS.cyan, '#8be9ff', 0.68);
  const hbmSlab = siliconSlab3d(2.8, 1.85, -1.7, 0.42, '#691b3a', COSMOS.rose, '#ff9bb4', 0.58);

  const busLanes = [
    [-0.6, -0.35],
    [0.6, -0.35],
    [-0.6, 0.35],
    [0.6, 0.35],
  ];
  const pipes = busLanes.map(([lx, ly]) =>
    line3d([lx, ly, -1.65], [lx, ly, 1.88], {
      color: COSMOS.rose,
      width: 2.5,
      glow: 7,
      blend: 'screen',
      opacity: 0.72,
      onTop: true,
    }),
  );

  const packetCenter = () => {
    const p = phase.value;
    const fus = showFused.value;
    if (fus > 0.5) return [0, 0, 1.65];
    const u = (p * 0.55) % 1;
    const z = u < 0.5 ? 1.55 - u * 5.2 : -1.05 + (u - 0.5) * 5.2;
    return [0, 0, z];
  };
  const packetCage = wireframeSlab3d(packetCenter, 1.05, 0.75, 0.24, {
    color: COSMOS.amber,
    width: 3.4,
    glow: 10,
  });

  const photons = points3d(
    () => {
      const p = phase.value;
      const fus = showFused.value;
      const pts = [];
      for (let i = 0; i < 4; i++) {
        const [lx, ly] = busLanes[i];
        const u = (p * 0.5 + i * 0.25) % 1;
        pts.push([lx, ly, fus > 0.5 ? 1.85 : -1.55 + u * 3.3]);
      }
      return pts;
    },
    { color: COSMOS.gold, radius: 5.5, glow: 11, blend: 'screen', onTop: true },
  );

  view3d.add(...hbmSlab, ...pipes, photons, ...packetCage, ...tcSlab);

  const live = guardedDynamic(1, () => {
    const pk = showPacked.value;
    const wr = showWrite.value;
    const rr = showReread.value;
    const fs = showFused.value;
    const sv = showSaved.value;
    const isFused = fs > 0.5;

    const nodes = [
      txt('TENSOR CORE MATRIX KERNEL', 380, -372, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt('OFF-CHIP HBM MEMORY', 380, 434, 26, COSMOS.rose, 'mono').glow(5, COSMOS.rose),

      // Step 1: Packed operand inventory
      glassCell(-485, -155, 740, 128, COSMOS.cyan, {
        fill: '#0e1d2e',
        glow: 8,
        opacity: 0.35 + 0.65 * pk,
      }),
      txt(
        'PACKED ACTIVATION (2 × 32 FP8 + 2 SCALES)',
        -825,
        -190,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(0.35 + 0.65 * pk),
      txt(
        '64 code B + 2 scale B = 66 B stored',
        -825,
        -134,
        30,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(0.35 + 0.65 * pk),

      // Step 2: Standalone FP32 dequantize round-trip
      glassCell(-485, 25, 740, 168, isFused ? COSMOS.dim : COSMOS.rose, {
        fill: '#201020',
        glow: isFused ? 0 : 9,
        opacity: (0.2 + 0.8 * wr) * (isFused ? 0.5 : 1),
      }),
      txt('STANDALONE DEQUANTIZE PATH (FP32)', -825, -24, 26, COSMOS.rose, 'mono', 'left').opacity(
        (0.2 + 0.8 * wr) * (isFused ? 0.5 : 1),
      ),
      txt('Write 64 × 4 B = 256 B to HBM', -825, 26, 28, COSMOS.ink, 'mono', 'left').opacity(
        (0.2 + 0.8 * wr) * (isFused ? 0.5 : 1),
      ),
      txt(
        rr > 0.5 ? 'GEMM rereads 256 B → 512 B extra' : 'Then matrix kernel must reread...',
        -825,
        74,
        28,
        rr > 0.5 ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      ).opacity((0.2 + 0.8 * wr) * (isFused ? 0.5 : 1)),

      // Step 3: Fused consumer path
      glassCell(-485, 265, 740, 184, COSMOS.emerald, {
        fill: '#0d2224',
        glow: 10,
        opacity: 0.18 + 0.82 * fs,
      }),
      txt('FUSED COMPATIBLE MATRIX KERNEL', -825, 210, 26, COSMOS.emerald, 'mono', 'left').opacity(
        0.18 + 0.82 * fs,
      ),
      txt(
        'Consumes 66 B codes + scales directly',
        -825,
        264,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(0.18 + 0.82 * fs),
      txt(
        sv > 0.5 ? 'Saves 512 B intermediate HBM traffic!' : 'Applies scale inside MMA contraction',
        -825,
        320,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      )
        .glow(6, COSMOS.emerald)
        .opacity(0.18 + 0.82 * fs),
    ];

    return group(...nodes);
  });

  s.add(bgAura, view3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, view3d, { theta: -0.24, phi: 0.96 });

  c.on('traffic-beat-1-focus-1', () =>
    s.play(showPacked.to(1, { duration: remainDuration(c, 'traffic-beat-1-focus-1', 0.45) })),
  );
  c.on('traffic-beat-2-focus-1', () =>
    s.play(showWrite.to(1, { duration: remainDuration(c, 'traffic-beat-2-focus-1', 0.5) })),
  );
  c.on('traffic-beat-2-focus-2', () =>
    s.play(showReread.to(1, { duration: remainDuration(c, 'traffic-beat-2-focus-2', 0.45) })),
  );
  c.on('traffic-beat-3-focus-1', () =>
    s.play(showFused.to(1, { duration: remainDuration(c, 'traffic-beat-3-focus-1', 0.5) })),
  );
  c.on('traffic-beat-3-focus-2', () =>
    s.play(showSaved.to(1, { duration: remainDuration(c, 'traffic-beat-3-focus-2', 0.45) })),
  );
}
