// Scene 10: Who writes the FP8 operand? 3D DeepSeek-V3 1x128 / 128x128 tiles + CUDA-core FP32 promotion + reported vs proposed data movement.
import {
  COSMOS,
  aura,
  box3d,
  cinematic3d,
  glassCell,
  glowingArc,
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
} from '../parts.mjs';

export default function onlineQuantization(s, c) {
  const phase = s.value(0);
  const showTiles = s.value(0.35);
  const showPromote = s.value(0);
  const showMove = s.value(0);
  const showFuture = s.value(0);

  const bgAura = aura(320, -10, 560, '#5ce1e624', '#6ee7b71a');
  const title = heroTitle(['Who Writes the', 'FP8 Operand?'], {
    x: -855,
    y: -415,
    size: 60,
    lineHeight: 70,
    accent: COSMOS.emerald,
    eyebrow: 'DEEPSEEK-V3 ONLINE BLOCK SCALING · H800',
  });

  // 3D orbiting Tensor Core -> CUDA Core FP32 promotion stack
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.8,
    unit: 80,
    focus: [0, 0, 0.3],
  }).at(360, -110);

  const tcSlab = siliconSlab3d(2.3, 1.5, -0.75, 0.32, '#1a3868', COSMOS.cyan, '#8be9ff', 0.65);
  const cudaSlab = siliconSlab3d(2.3, 1.5, 1.85, 0.32, '#144d3e', COSMOS.emerald, '#a7f3d0', 0.68);
  const actBlock = box3d(-2.5, -0.25, -0.65, 1.5, 0.5, 0.42, '#226b8c', COSMOS.cyan, 0.85);
  const wtBlock = box3d(-0.5, -1.3, -0.65, 1.4, 1.4, 0.42, '#7d5a16', COSMOS.gold, 0.82);

  const risers = [
    [-0.9, -0.45],
    [0.0, 0.0],
    [0.9, 0.45],
  ].map(([rx, ry]) =>
    line3d([rx, ry, -0.5], [rx, ry, 1.55], {
      color: COSMOS.emerald,
      width: 2.8,
      glow: 8,
      blend: 'screen',
      opacity: 0.85,
      onTop: true,
    }),
  );

  const promoPhotons = points3d(
    () => {
      const ph = phase.value;
      const pr = showPromote.value;
      const pts = [];
      for (let i = 0; i < 3; i++) {
        const u = (ph * 0.55 + i * 0.33) % 1;
        const rx = -0.9 + i * 0.9;
        const ry = -0.45 + i * 0.45;
        pts.push([rx, ry, -0.45 + u * (0.4 + 1.55 * Math.max(0.25, pr))]);
      }
      return pts;
    },
    { color: COSMOS.emerald, radius: 6, glow: 12, blend: 'screen', onTop: true },
  );

  view3d.add(...tcSlab, ...actBlock, ...wtBlock, ...risers, promoPhotons, ...cudaSlab);

  const live = guardedDynamic(1, () => {
    const tl = showTiles.value;
    const pr = showPromote.value;
    const mv = showMove.value;
    const ft = showFuture.value;

    const nodes = [
      // 3D tier callouts
      txt('CUDA CORES · FP32 ACCUMULATION', 360, -412, 26, COSMOS.emerald, 'mono').glow(
        5,
        COSMOS.emerald,
      ),
      txt('TENSOR CORES · 1×128 ACT × 128×128 WT', 360, 178, 26, COSMOS.cyan, 'mono'),

      // Left side: DeepSeek-V3 group geometry & 128-element promotion rule
      glassCell(-495, -135, 720, 128, COSMOS.cyan, {
        fill: '#0e1d2e',
        glow: 8,
        opacity: 0.35 + 0.65 * tl,
      }),
      txt('ONLINE GROUP GRANULARITY', -825, -172, 26, COSMOS.muted, 'mono', 'left').opacity(
        0.35 + 0.65 * tl,
      ),
      txt(
        'Act: 1 × 128   ·   Weight: 128 × 128',
        -825,
        -114,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(0.35 + 0.65 * tl),

      glassCell(-495, 35, 720, 134, COSMOS.emerald, {
        fill: '#0d2224',
        glow: 9,
        opacity: 0.22 + 0.78 * pr,
      }),
      txt('EVERY 128 CONTRACTION ELEMENTS', -825, -2, 26, COSMOS.emerald, 'mono', 'left').opacity(
        0.22 + 0.78 * pr,
      ),
      txt(
        'Promote Tensor Core partial sum → CUDA FP32',
        -825,
        54,
        27,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(0.22 + 0.78 * pr),
    ];

    // Bottom full-width data movement pipeline (Beat 1: reported vs proposed fused TMA)
    const py = 335;
    const opM = 0.2 + 0.8 * mv;
    const steps = [
      { label: 'Read BF16', x: -690, col: COSMOS.blue },
      { label: 'Quantize', x: -335, col: COSMOS.gold },
      { label: 'Write FP8', x: 20, col: COSMOS.amber },
      { label: 'MMA reads FP8', x: 385, col: COSMOS.cyan },
    ];
    nodes.push(
      txt(
        'REPORTED DATA MOVEMENT · DEEPGEMM: CALLER CASTS & TRANSPOSES',
        -855,
        246,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(opM),
    );
    steps.forEach((st, i) => {
      nodes.push(
        glassCell(st.x, py, 270, 92, st.col, { fill: '#10182b', glow: 7, opacity: opM }),
        txt(st.label, st.x, py, 28, st.col, 'mono').opacity(opM),
      );
      if (i < steps.length - 1) {
        const nx = steps[i + 1].x;
        nodes.push(
          glowingArc([st.x + 138, py], [nx - 138, py], 0, {
            color: COSMOS.cyan,
            width: 3,
            opacity: 0.85 * opM,
          }),
        );
      }
    });

    // Proposed future optimization badge on far right
    if (ft > 0.02) {
      nodes.push(
        glassCell(715, py, 290, 114, COSMOS.violet, {
          fill: '#1b122c',
          dash: [8, 6],
          glow: 7,
          opacity: ft,
        }),
        txt('PROPOSED ONLY', 715, py - 24, 26, COSMOS.violet, 'mono').opacity(ft),
        txt('Fuse cast + TMA', 715, py + 22, 26, COSMOS.ink, 'sans').opacity(ft),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, view3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, view3d, { theta: -0.22, phi: 0.96 });

  c.on('lp-online-quantization-build-0', () =>
    s.play(showTiles.to(1, { duration: remainDuration(c, 'lp-online-quantization-build-0', 0.5) })),
  );
  c.on('lp-online-quantization-promote', () =>
    s.play(
      showPromote.to(1, { duration: remainDuration(c, 'lp-online-quantization-promote', 0.5) }),
    ),
  );
  c.on('lp-online-quantization-build-1', () =>
    s.play(showMove.to(1, { duration: remainDuration(c, 'lp-online-quantization-build-1', 0.55) })),
  );
  c.on('lp-online-quantization-future', () =>
    s.play(
      showFuture.to(1, { duration: remainDuration(c, 'lp-online-quantization-future', 0.45) }),
    ),
  );
}
