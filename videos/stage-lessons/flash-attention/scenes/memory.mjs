// Scene 04: How many trips do scores and probabilities make?: 3D HBM-vs-SRAM 4-trip shuttle.
import {
  COSMOS,
  aura,
  cinematic3d,
  glassCell,
  glowDot,
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

export default function memory(s, c) {
  const phase = s.value(0);
  const tripStage = s.value(0); // 1=write S, 2=read S, 3=write P, 4=read P
  const showSram = s.value(0);

  const bgAura = aura(290, 20, 520, '#ff6b8b26', '#5ce1e614');
  const title = heroTitle(['Four Trips', 'Through HBM'], {
    x: -855,
    y: -410,
    size: 60,
    lineHeight: 70,
    accent: COSMOS.rose,
    eyebrow: 'STANDARD MATERIALIZED ATTENTION',
  });

  const view3d = cinematic3d({
    theta: -0.72,
    phi: 1.08,
    distance: 15.8,
    unit: 90,
    focus: [0, 0, 0.2],
  }).at(320, 0);

  const computeSlab = siliconSlab3d(2.3, 1.5, 2.25, 0.34, '#c48f26', COSMOS.gold, '#fff4c8', 0.68);
  const hbmSlab = siliconSlab3d(2.8, 1.9, -1.75, 0.44, '#6e1d3b', COSMOS.rose, '#ff9ab2', 0.58);

  const lanes = [
    [-0.45, -0.35],
    [0.45, -0.35],
    [-0.45, 0.35],
    [0.45, 0.35],
  ];
  const pipes = lanes.map(([lx, ly]) =>
    line3d([lx, ly, -1.72], [lx, ly, 1.9], {
      color: COSMOS.rose,
      width: 2.6,
      glow: 8,
      blend: 'screen',
      opacity: 0.78,
      onTop: true,
    }),
  );

  // Moving 3x3 packet cage shuttling between compute (z=1.55) and HBM (z=-1.15)
  const packetCenter = () => {
    const st = tripStage.value;
    const sram = showSram.value;
    if (sram > 0.5) return [0, 0, 1.65];
    const ph = phase.value;
    const goingDown = Math.floor(st) % 2 === 1;
    const frac = (ph * 0.65) % 1;
    const z = goingDown ? 1.55 - frac * 2.65 : -1.1 + frac * 2.65;
    return [0, 0, st < 0.2 ? 1.55 : z];
  };
  const packetCage = wireframeSlab3d(packetCenter, 0.95, 0.75, 0.24, {
    color: COSMOS.amber,
    width: 3.4,
    glow: 10,
  });

  const busPhotons = points3d(
    () => {
      const ph = phase.value;
      const pts = [];
      for (let i = 0; i < lanes.length; i++) {
        const [lx, ly] = lanes[i];
        const u = (ph * 0.55 + i * 0.25) % 1;
        pts.push([lx, ly, -1.6 + u * 3.4]);
      }
      return pts;
    },
    { color: COSMOS.amber, radius: 5.5, glow: 11, blend: 'screen', onTop: true },
  );

  view3d.add(...hbmSlab, ...pipes, busPhotons, ...packetCage, ...computeSlab);

  const tripLabels = [
    '1. Write N × N scores S → HBM',
    '2. Read N × N scores S ← HBM',
    '3. Write N × N probs P → HBM',
    '4. Read N × N probs P ← HBM',
  ];

  const live = guardedDynamic(1, () => {
    const count = Math.min(4, Math.floor(tripStage.value + 0.05));
    const sram = showSram.value;
    const nodes = [
      txt('ARITHMETIC UNITS + SRAM', 320, -355, 26, COSMOS.gold, 'mono').glow(5, COSMOS.gold),
      txt('OFF-CHIP HBM POOL', 320, 428, 26, COSMOS.rose, 'mono').glow(5, COSMOS.rose),
    ];

    for (let i = 0; i < 4; i++) {
      const done = count > i;
      const col = done ? (i % 2 === 0 ? COSMOS.rose : COSMOS.amber) : COSMOS.dim;
      const y = -165 + i * 74;
      nodes.push(
        glowDot(-845, y, {
          radius: done ? 7 : 4,
          color: col,
          glow: done ? 10 : 0,
          opacity: done ? 1 : 0.4,
        }),
        txt(tripLabels[i], -815, y, 28, done ? COSMOS.ink : COSMOS.dim, 'mono', 'left'),
      );
    }

    const bigCol = sram > 0.5 ? COSMOS.emerald : COSMOS.rose;
    nodes.push(
      glassCell(-555, 235, 600, 144, bigCol, { fill: '#121728', glow: 10 }),
      txt(
        sram > 0.5 ? 'FLASHATTENTION WORKSPACE' : 'FULL-SQUARE HBM TRIPS',
        -555,
        194,
        26,
        COSMOS.muted,
        'mono',
      ),
      txt(
        sram > 0.5 ? 'Tile reused on-chip' : `${count} / 4 transfers`,
        -555,
        256,
        40,
        bigCol,
        'mono',
      ).glow(8, bigCol),
    );

    return group(...nodes);
  });

  s.add(bgAura, view3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, view3d, { theta: -0.25, phi: 0.98 });

  c.on('store-scores', () => s.play(tripStage.to(1, { duration: 0.45 })));
  c.on('fetch-scores', () => s.play(tripStage.to(2, { duration: 0.45 })));
  c.on('store-probabilities', () => s.play(tripStage.to(3, { duration: 0.45 })));
  c.on('fetch-probabilities', () => s.play(tripStage.to(4, { duration: 0.45 })));
  c.on('count-transfers', () => s.play(tripStage.to(4.05, { duration: 0.3 })));
  c.on('small-workspace', () =>
    s.play(showSram.to(1, { duration: remainDuration(c, 'small-workspace', 0.55) })),
  );
}
