// Scene 06: One direction, many possible corrections: 3D rank-1 line slide + live 3x3 outer product b a^T.
import {
  COSMOS,
  aura,
  cinematic3d,
  fmtNum,
  glassCell,
  glowTex,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  line3d,
  matrixGrid,
  orbitScene,
  points3d,
  rankOneConstruction,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

const B_DIR = [1.0, 0.6, 0.8];
const A_ROW = [1, -1, 0.5];
const OUTER_BA = B_DIR.map((bi) => A_ROW.map((aj) => bi * aj));

export default function rankOne(s, c) {
  const phase = s.value(0);
  const slideProg = s.value(0);
  const showScalar = s.value(0);
  const showOuter = s.value(0);

  const bgAura = aura(320, 0, 560, '#ffd16622', '#5ce1e616');
  const title = heroTitle(['One Direction,', 'Many Corrections'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'RANK-ONE OUTER PRODUCT',
  });

  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.05,
    distance: 15.4,
    unit: 88,
    focus: [0, 0, 0.4],
  }).at(420, -25);

  const grid = gridPlane3d({ size: 5.2, step: 1.0, z: 0, color: '#2b3a60', opacity: 0.45 });
  const axes = [
    line3d([-2.4, 0, 0], [2.4, 0, 0], { color: '#5c709e', width: 2, opacity: 0.7 }),
    line3d([0, -2.4, 0], [0, 2.4, 0], { color: '#5c709e', width: 2, opacity: 0.7 }),
    line3d([0, 0, -1.2], [0, 0, 2.4], { color: '#5c709e', width: 2, opacity: 0.7 }),
  ];

  // Infinite fixed line along B_DIR
  const spanLine = line3d(
    B_DIR.map((v) => -2.2 * v),
    B_DIR.map((v) => 2.2 * v),
    { color: COSMOS.gold, width: 2.6, opacity: 0.55, blend: 'screen' },
  );

  const coeffFn = () => {
    const st = rankOneConstruction(1, slideProg.value);
    return st.coefficient;
  };
  const tipFn = () => {
    const z = coeffFn();
    return B_DIR.map((v) => v * z);
  };

  const activeVec = line3d([0, 0, 0], tipFn, {
    color: COSMOS.gold,
    width: 6.0,
    glow: 12,
    blend: 'screen',
    onTop: true,
  });
  const tipPt = points3d(() => [tipFn()], {
    color: COSMOS.gold,
    radius: 8,
    glow: 14,
    blend: 'screen',
    onTop: true,
  });

  view3d.add(grid, ...axes, spanLine, activeVec, tipPt);

  const eq = glowTex(String.raw`\Delta W = b \, a^T, \qquad \Delta W x = b (a^T x)`, {
    x: 420,
    y: 432,
    size: 36,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const st = rankOneConstruction(1, slideProg.value);
    const sc = showScalar.value;
    const so = showOuter.value;

    const nodes = [
      txt('FIXED 3D OUTPUT LINE  span(b)', 335, -395, 26, COSMOS.gold, 'mono').glow(6, COSMOS.gold),

      glassCell(-560, -162, 590, 126, COSMOS.cyan, { fill: '#101d35', glow: 8 }),
      txt('1. DOT PRODUCT MEASUREMENT', -825, -196, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        `x = [${st.x.map((v) => fmtNum(v, 1)).join(', ')}]`,
        -825,
        -140,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),

      glassCell(-560, -10, 590, 114, COSMOS.gold, {
        fill: '#231d10',
        glow: sc > 0.2 ? 10 : 4,
      }),
      txt('SCALAR BOTTLENECK  z = aᵀx', -825, -42, 26, COSMOS.muted, 'mono', 'left'),
      txt(`z = ${fmtNum(st.coefficient, 2)}`, -825, 12, 42, COSMOS.gold, 'mono', 'left').glow(
        8,
        COSMOS.gold,
      ),

      // 3x3 Outer product matrix b a^T
      txt('OUTER PRODUCT  b · aᵀ (3×3)', -585, 102, 26, COSMOS.emerald, 'mono').opacity(
        Math.max(0.45, so),
      ),
      matrixGrid(OUTER_BA, -585, 275, {
        cellW: 118,
        cellH: 72,
        color: so > 0.3 ? COSMOS.emerald : COSMOS.blue,
        opacity: Math.max(0.45, so),
        fontSize: 28,
      }),
    ];

    return group(...nodes);
  });

  s.add(bgAura, view3d, title, eq, live);
  runPhase(s, c, phase, 12);
  orbitScene(s, c, view3d, { theta: -0.18, phi: 0.94 });

  c.on('rank-one-b1-1', () => s.play(showScalar.to(1, { duration: 0.45 })));
  c.on('rank-one-b2-1', () =>
    s.play(slideProg.to(0.95, { duration: remainDuration(c, 'rank-one-b2-1', 3.2) })),
  );
  c.on('rank-one-b3-1', () =>
    s.play(showOuter.to(1, { duration: remainDuration(c, 'rank-one-b3-1', 0.55) })),
  );
}
