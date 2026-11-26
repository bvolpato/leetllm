// Scene 01: Who still needs the three? Blue 3 fan-out across row of B, crop right col, keep load!
import {
  A,
  B,
  COSMOS,
  ROLE,
  aura,
  buildSystolicGemm3d,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const kCursor = s.value(1);
  const phase = s.value(0);
  const showLeft = s.value(0);
  const showRight = s.value(0);
  const cropped = s.value(0);
  const credit = s.value(0);

  const bgAura = aura(390, 20, 520, '#60a5fa24', '#ff6b8b18');
  const { view: gemm3d } = buildSystolicGemm3d(kCursor, { x: 400, y: 15, unit: 102 });

  const title = heroTitle(['Who Still Needs', 'the Three?'], {
    x: -855,
    y: -415,
    size: 62,
    lineHeight: 72,
    accent: ROLE.a,
    eyebrow: 'GEMM · COOPERATIVE TILE LOAD',
    subtitle: 'Load once, multiply across partners',
  });

  const aVal = A[1][1]; // 3
  const bLeft = B[1][0]; // 1
  const bRight = B[1][1]; // 4

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sl = showLeft.value;
    const sr = showRight.value;
    const cr = cropped.value;
    const cd = credit.value;
    const keepOpacity = Math.max(0.14, 1 - cr * 0.86);
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.5);

    const nodes = [
      txt('3D SYSTOLIC TILE RIG', 400, -405, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt('A (blue) × B (pink) → C accumulators (cyan)', 400, 425, 26, COSMOS.muted, 'sans'),

      // Source blue 3 cell
      txt('SHARED A[1, 1]', -555, -152, 26, ROLE.a, 'mono'),
      glassCell(-555, -78, 170, 96, cd > 0.5 ? ROLE.good : ROLE.a, {
        fill: cd > 0.5 ? '#0e2824' : '#101d38',
        glow: 10 * pulse,
      }),
      txt(String(aVal), -555, -78, 46, cd > 0.5 ? ROLE.good : ROLE.a, 'mono').glow(6, ROLE.a),

      // B row partners: 1 and 4
      txt('B[1, 0]', -765, 96, 26, ROLE.b, 'mono'),
      glassCell(-720, 178, 168, 96, ROLE.b, { fill: '#261120', glow: 8 }),
      txt(String(bLeft), -720, 178, 44, ROLE.b, 'mono'),

      txt('B[1, 1]', -345, 96, 26, ROLE.b, 'mono').opacity(keepOpacity),
      glassCell(-390, 178, 168, 96, cr > 0.5 ? COSMOS.dim : ROLE.b, {
        fill: '#261120',
        dash: cr > 0.5 ? [8, 6] : undefined,
        glow: cr > 0.5 ? 0 : 8,
        opacity: keepOpacity,
      }),
      txt(String(bRight), -390, 178, 44, ROLE.b, 'mono').opacity(keepOpacity),
    ];

    if (sl > 0.02) {
      const u = (p * 0.65) % 1;
      nodes.push(
        glowingArc([-580, -28], [-634, 178], 12, {
          color: cd > 0.5 ? ROLE.good : ROLE.a,
          width: 3.6,
          opacity: 0.9 * sl,
        }),
        glowDot(-580 - 54 * u, -28 + 206 * u, {
          radius: 6,
          color: cd > 0.5 ? ROLE.good : COSMOS.gold,
          opacity: sl,
        }),
        txt(`${aVal} × ${bLeft} = ${aVal * bLeft}`, -720, 274, 34, ROLE.c, 'mono')
          .glow(6, ROLE.c)
          .opacity(sl),
        txt('left sum', -720, 316, 26, COSMOS.muted, 'sans').opacity(sl),
      );
    }

    if (sr > 0.02) {
      const rightVis = sr * Math.max(0, 1 - cr * 1.4);
      if (rightVis > 0.04) {
        nodes.push(
          glowingArc([-530, -28], [-476, 178], 12, {
            color: ROLE.b,
            width: 3.4,
            opacity: 0.85 * rightVis,
          }),
          txt(`${aVal} × ${bRight} = ${aVal * bRight}`, -390, 274, 34, ROLE.c, 'mono').opacity(
            rightVis,
          ),
          txt('right sum', -390, 316, 26, COSMOS.muted, 'sans').opacity(rightVis),
        );
      }
    }

    if (cr > 0.85 && cd < 0.02) {
      nodes.push(
        txt('CROPPED', -390, 274, 26, COSMOS.amber, 'mono'),
        txt('Skip loading 3?', -555, 388, 36, COSMOS.gold, 'serif').glow(6, COSMOS.gold),
      );
    }

    if (cd > 0.02) {
      nodes.push(
        txt('Keep 3: 3 × 1 = +3', -555, 388, 34, ROLE.good, 'mono').glow(7, ROLE.good).opacity(cd),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, gemm3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, gemm3d, { theta: -0.22, phi: 0.92 });

  c.on('left-product', () =>
    s.play(showLeft.to(1, { duration: remainDuration(c, 'left-product', 0.45) })),
  );
  c.on('right-product', () =>
    s.play(showRight.to(1, { duration: remainDuration(c, 'right-product', 0.45) })),
  );
  c.on('crop-column', () =>
    s.play(cropped.to(1, { duration: remainDuration(c, 'crop-column', 0.5) })),
  );
  c.after('credit-three', () =>
    s.play(credit.to(1, { duration: remainDuration(c, 'credit-three', 0.45) })),
  );
}
