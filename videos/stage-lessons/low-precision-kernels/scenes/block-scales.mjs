// Scene 14: Which scale belongs to this partial sum? 3D two-block Tensor Core contraction: 5*2 + 8*3 = 34 vs wrong 5*(2+3) = 25.
import {
  BLOCK_CONTRACT,
  COSMOS,
  aura,
  box3d,
  cinematic3d,
  glassCell,
  glowTex,
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

export default function blockScales(s, c) {
  const phase = s.value(0);
  const showB0 = s.value(0.35);
  const showC0 = s.value(0);
  const showB1 = s.value(0);
  const showC1 = s.value(0);
  const showWrong = s.value(0);

  const bgAura = aura(330, 10, 560, '#5ce1e624', '#ffd1661c');
  const title = heroTitle(['Which Scale Owns', 'This Partial?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'K-BLOCK CONTRACTION · MICROSCALING MMA',
  });

  const eq = glowTex(
    String.raw`\hat{Y} = \sum_{b} (S_{x,b} S_{w,b}) \sum_{k \in b} q_{x,k} q_{w,k}`,
    {
      x: -470,
      y: -200,
      size: 34,
      color: COSMOS.cyan,
    },
  );

  // 3D orbiting two-block contraction stage
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.2,
    unit: 98,
    focus: [0, 0, 0.35],
  }).at(380, 10);

  const baseSlab = siliconSlab3d(2.6, 1.5, -1.0, 0.28, '#13203d', COSMOS.blue, '#7aa2f7', 0.55);
  const b0Prism = box3d(-2.2, -0.75, -0.95, 1.8, 1.5, 1.0, '#165a72', COSMOS.cyan, 0.8);
  const b1Prism = box3d(0.4, -0.75, -0.95, 1.8, 1.5, 1.85, '#805a14', COSMOS.gold, 0.84);
  const sumSlab = siliconSlab3d(1.6, 0.9, 2.15, 0.24, '#134d3e', COSMOS.emerald, '#a7f3d0', 0.72);

  const conduits = [
    line3d([-1.3, 0, 0.1], [-0.6, 0, 1.9], {
      color: COSMOS.cyan,
      width: 3.4,
      glow: 9,
      blend: 'screen',
      onTop: true,
    }),
    line3d([1.3, 0, 0.92], [0.6, 0, 1.9], {
      color: COSMOS.gold,
      width: 3.4,
      glow: 9,
      blend: 'screen',
      onTop: true,
    }),
  ];

  const streamDots = points3d(
    () => {
      const p = phase.value;
      const u = (p * 0.5) % 1;
      return [
        [-1.3 + 0.7 * u, 0, 0.1 + 1.8 * u],
        [1.3 - 0.7 * u, 0, 0.92 + 0.98 * u],
      ];
    },
    {
      colorAt: (i) => (i === 0 ? COSMOS.cyan : COSMOS.gold),
      radius: 6.5,
      glow: 12,
      blend: 'screen',
      onTop: true,
    },
  );

  view3d.add(...baseSlab, ...b0Prism, ...b1Prism, ...conduits, streamDots, ...sumSlab);

  const live = guardedDynamic(1, () => {
    const b0 = showB0.value;
    const c0 = showC0.value;
    const b1 = showB1.value;
    const c1 = showC1.value;
    const wr = showWrong.value;

    const nodes = [
      // 3D captions
      txt('FP32 ACCUMULATOR (10 + 24 = 34)', 380, -370, 26, COSMOS.emerald, 'mono').glow(
        5,
        COSMOS.emerald,
      ),
      txt('BLOCK 0 (×5)     ·     BLOCK 1 (×8)', 380, 365, 26, COSMOS.gold, 'mono'),

      // Left column: Block 0 card
      glassCell(-495, -55, 720, 134, COSMOS.cyan, {
        fill: '#0e1d2e',
        glow: 8,
        opacity: 0.3 + 0.7 * b0,
      }),
      txt(
        'BLOCK 0 · CODED PARTIAL = 1×1 + 1×1 = 2',
        -825,
        -90,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(0.3 + 0.7 * b0),
      txt(
        c0 > 0.5
          ? `s_x · s_w = 1 × 5 = 5  →  contributes ${BLOCK_CONTRACT.contributions[0]}`
          : 'Scale product s_x · s_w = 1 × 5 = 5',
        -825,
        -32,
        28,
        c0 > 0.5 ? COSMOS.emerald : COSMOS.ink,
        'mono',
        'left',
      ).opacity(0.3 + 0.7 * b0),

      // Block 1 card
      glassCell(-495, 110, 720, 134, COSMOS.gold, {
        fill: '#1d1812',
        glow: 8,
        opacity: 0.2 + 0.8 * b1,
      }),
      txt(
        'BLOCK 1 · CODED PARTIAL = 1×1 + 2×1 = 3',
        -825,
        75,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(0.2 + 0.8 * b1),
      txt(
        c1 > 0.5
          ? `s_x · s_w = 2 × 4 = 8  →  contributes ${BLOCK_CONTRACT.contributions[1]}`
          : 'Scale product s_x · s_w = 2 × 4 = 8',
        -825,
        133,
        28,
        c1 > 0.5 ? COSMOS.emerald : COSMOS.ink,
        'mono',
        'left',
      ).opacity(0.2 + 0.8 * b1),

      // Correct vs Wrong comparison bottom-left
      glassCell(-680, 315, 350, 174, COSMOS.emerald, {
        fill: '#0d2224',
        glow: 9,
        opacity: 0.2 + 0.8 * c1,
      }),
      txt('PER-BLOCK SUM', -680, 264, 26, COSMOS.muted, 'mono').opacity(0.2 + 0.8 * c1),
      txt(`5(2) + 8(3)`, -680, 314, 28, COSMOS.ink, 'mono').opacity(0.2 + 0.8 * c1),
      txt(`= ${BLOCK_CONTRACT.correct}`, -680, 366, 42, COSMOS.emerald, 'mono')
        .glow(7, COSMOS.emerald)
        .opacity(0.2 + 0.8 * c1),

      glassCell(-310, 315, 350, 174, COSMOS.rose, {
        fill: '#231020',
        glow: 9,
        opacity: 0.15 + 0.85 * wr,
      }),
      txt('FACTORED (WRONG)', -310, 264, 26, COSMOS.rose, 'mono').opacity(0.15 + 0.85 * wr),
      txt('5 × (2 + 3)', -310, 314, 28, COSMOS.ink, 'mono').opacity(0.15 + 0.85 * wr),
      txt(`= ${BLOCK_CONTRACT.wrong}`, -310, 366, 42, COSMOS.rose, 'mono')
        .glow(7, COSMOS.rose)
        .opacity(0.15 + 0.85 * wr),
    ];

    return group(...nodes);
  });

  s.add(bgAura, view3d, title, eq, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, view3d, { theta: -0.22, phi: 0.94 });

  c.on('block-scales-beat-1-focus-1', () =>
    s.play(showB0.to(1, { duration: remainDuration(c, 'block-scales-beat-1-focus-1', 0.45) })),
  );
  c.on('block-scales-beat-1-focus-2', () =>
    s.play(showC0.to(1, { duration: remainDuration(c, 'block-scales-beat-1-focus-2', 0.45) })),
  );
  c.on('block-scales-beat-2-focus-1', () =>
    s.play(showB1.to(1, { duration: remainDuration(c, 'block-scales-beat-2-focus-1', 0.45) })),
  );
  c.on('block-scales-beat-2-focus-2', () =>
    s.play(showC1.to(1, { duration: remainDuration(c, 'block-scales-beat-2-focus-2', 0.45) })),
  );
  c.on('block-scales-beat-3-focus-1', () =>
    s.play(showWrong.to(1, { duration: remainDuration(c, 'block-scales-beat-3-focus-1', 0.5) })),
  );
}
