// Scene 04: Earn the whole matrix shape and operation count.
// NT shapes A[M,K], B[N,K] -> D[M,N]; 2MNK = 17.18B FLOPs for 512x4096x4096; /10us = 1,718 TFLOP/s.
import {
  BENCH_FLOPS,
  BENCH_K,
  BENCH_M,
  BENCH_N,
  BENCH_TFLOPS,
  BENCH_US,
  COSMOS,
  ROLE,
  TILE_DONE,
  aura,
  buildFp8WgmmaCube3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function gemmContract(s, c) {
  const phase = s.value(0);
  const kCursor = s.value(0);
  const promoVal = s.value(0.2);
  const step = s.value(0); // 1=shape, 2=tiny, 3=2MNK, 4=17.18B, 5=1718 TFLOP/s, 6=tile vs whole

  const bgAura = aura(445, 20, 520, '#5ce1e620', '#ffd16618');
  const { view: cube3d } = buildFp8WgmmaCube3d(kCursor, promoVal, phase, {
    x: 455,
    y: 15,
    unit: 94,
  });

  const title = heroTitle(['Whole Matrix Shape', '& Operation Count'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.gold,
    eyebrow: 'NT INTERFACE · 2 M N K FLOPS',
    subtitle: 'Separate whole-matrix arithmetic from block tiles',
  });

  const flopsEq = glowTex('\\text{FLOPs} = 2 M N K', {
    x: -640,
    y: 120,
    size: 42,
    color: ROLE.gold,
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const nodes = [
      txt('3D WHOLE MATRIX VS BLOCK TILE', 455, -415, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt('Gold wireframe = one block tile inside [M, N, K]', 455, 435, 26, COSMOS.muted, 'sans'),
    ];

    // Top shape row: A[M,K] x B[N,K]^T -> D[M,N]
    const shapeLit = st >= 0.6;
    nodes.push(
      glassCell(-750, -135, 210, 90, shapeLit ? ROLE.a : COSMOS.dim, {
        fill: '#10203a',
        glow: shapeLit ? 8 : 0,
      }),
      txt('A  [M, K]', -750, -152, 26, ROLE.a, 'mono'),
      txt(`${BENCH_M} × ${BENCH_K}`, -750, -112, 26, COSMOS.ink, 'mono'),

      glassCell(-505, -135, 220, 90, shapeLit ? ROLE.b : COSMOS.dim, {
        fill: '#281122',
        glow: shapeLit ? 8 : 0,
      }),
      txt('B  [N, K]', -505, -152, 26, ROLE.b, 'mono'),
      txt(`${BENCH_N} × ${BENCH_K}`, -505, -112, 26, COSMOS.ink, 'mono'),

      glassCell(-250, -135, 220, 90, shapeLit ? ROLE.c : COSMOS.dim, {
        fill: '#0d2333',
        glow: shapeLit ? 8 : 0,
      }),
      txt('D  [M, N]', -250, -152, 26, ROLE.c, 'mono'),
      txt(`${BENCH_M} × ${BENCH_N}`, -250, -112, 26, COSMOS.ink, 'mono'),
    );

    // Tiny row verification strip
    if (st >= 1.6) {
      nodes.push(
        txt(
          `Tiny rows: [1,2]·[3,4] = ${TILE_DONE.result[0][0]}   ·   [0,-1]·[3,4] = ${TILE_DONE.result[1][0]}`,
          -860,
          -28,
          26,
          ROLE.good,
          'mono',
          'left',
        ),
      );
    }

    // 17.18B FLOPs + 1,718 TFLOP/s readouts
    if (st >= 3.6) {
      nodes.push(
        glassCell(-640, 250, 420, 94, ROLE.c, { fill: '#0e2030', glow: 8 }),
        txt('2 × 512 × 4096 × 4096', -640, 232, 26, COSMOS.muted, 'mono'),
        txt(`${(BENCH_FLOPS / 1e9).toFixed(2)} B FLOPs`, -640, 272, 34, ROLE.c, 'mono').glow(
          6,
          ROLE.c,
        ),
      );
    }

    if (st >= 4.6) {
      nodes.push(
        glassCell(-205, 250, 390, 94, ROLE.good, { fill: '#0f2822', glow: 10 }),
        txt(`At ${BENCH_US} us elapsed`, -205, 232, 26, COSMOS.muted, 'mono'),
        txt(
          `${Math.round(BENCH_TFLOPS).toLocaleString()} TFLOP/s`,
          -205,
          272,
          34,
          ROLE.good,
          'mono',
        ).glow(7, ROLE.good),
      );
    }

    nodes.push(
      txt(
        st >= 5.5
          ? 'Layout, scale traffic, barriers & stores separate equal-FLOP calls'
          : 'Count multiply + add separately -> 2MNK total operations',
        -860,
        385,
        26,
        st >= 5.5 ? ROLE.gold : COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, cube3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, cube3d, { theta: -0.18, phi: 0.92 });

  c.on('gc-shape', () => s.play(step.to(1, { duration: remainDuration(c, 'gc-shape', 0.45) })));
  c.after('gc-tiny', () =>
    s.play(step.to(2, { duration: remainAfterDuration(c, 'gc-tiny', 0.35) })),
  );
  c.show('gc-flops', flopsEq);
  c.on('gc-flops', () => {
    const dur = remainDuration(c, 'gc-flops', 0.45);
    s.play(step.to(3, { duration: dur }));
    s.play(kCursor.to(1, { duration: dur }));
  });
  c.after('gc-17b', () => s.play(step.to(4, { duration: remainAfterDuration(c, 'gc-17b', 0.35) })));
  c.after('gc-tflops', () => {
    const dur = remainAfterDuration(c, 'gc-tflops', 0.35);
    s.play(step.to(5, { duration: dur }));
    s.play(promoVal.to(1, { duration: dur }));
  });
  c.on('gc-tile', () => {
    const dur = remainDuration(c, 'gc-tile', 0.5);
    s.play(step.to(6, { duration: dur }));
    s.play(kCursor.to(2, { duration: dur }));
  });
}
