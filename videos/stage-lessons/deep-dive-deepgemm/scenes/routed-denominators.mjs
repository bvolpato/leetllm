// Scene 13: How many expert rows come from one token?
// Flash EP8: 1 token -> 6 experts; 256/8 = 32 experts/rank; 512x8=4096 -> x6=24576 -> /8=3072; 4MHI+2MHI=6MHI.
import {
  COSMOS,
  FLASH_ASSIGNMENTS,
  FLASH_BALANCED_ROWS,
  FLASH_EXPERTS,
  FLASH_LOCAL_EXPERTS,
  FLASH_RANKS,
  FLASH_SOURCE_PER_RANK,
  FLASH_SOURCE_TOTAL,
  FLASH_TOPK,
  PACK_128,
  ROLE,
  aura,
  buildMoePackSlabs3d,
  counts,
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

export default function routedDenominators(s, c) {
  const phase = s.value(0);
  const padLerp = s.value(0);
  const step = s.value(0); // 1=top6, 2=32/rank, 3=4096, 4=3072, 5=shift+1/-1, 6=6MHI, 7=20.94 vs 32.21

  const widthsFn = () => counts.map((v, i) => v + (PACK_128.padded[i] - v) * padLerp.value);
  const pinFn = () => {
    const w = widthsFn();
    return w[0] + w[1];
  };

  const bgAura = aura(445, 20, 520, '#60a5fa20', '#5ce1e61c');
  const { view: pack3d } = buildMoePackSlabs3d(counts, widthsFn, pinFn, 640, phase, {
    x: 455,
    y: 15,
    unit: 92,
  });

  const title = heroTitle(['How Many Expert Rows', 'From One Token?'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.a,
    eyebrow: 'FLASH EP8 · ROUTED DENOMINATORS',
    subtitle: 'Source tokens, routed assignments, and padded rows differ',
  });

  const mhiEq = glowTex('4 M H I + 2 M H I = 6 M H I', {
    x: -460,
    y: 205,
    size: 38,
    color: ROLE.gold,
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const r0 = st >= 4.5 ? FLASH_BALANCED_ROWS - 1 : FLASH_BALANCED_ROWS;
    const r1 = st >= 4.5 ? FLASH_BALANCED_ROWS + 1 : FLASH_BALANCED_ROWS;

    const nodes = [
      txt('3D FLASH EP8 ROUTED SLABS', 455, -415, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt('H = 4096 · I = 2048 · 256 experts · top-6 · EP8', 455, 435, 26, COSMOS.muted, 'mono'),
    ];

    // Row 1: Single token fan-out & rank split
    nodes.push(
      glassCell(-665, -125, 385, 96, st >= 0.6 ? ROLE.a : COSMOS.dim, {
        fill: '#101d38',
        glow: st >= 0.6 ? 8 : 0,
      }),
      txt('1 SOURCE TOKEN', -665, -145, 26, COSMOS.muted, 'mono'),
      txt(`-> ${FLASH_TOPK} expert rows`, -665, -104, 26, ROLE.a, 'mono'),

      glassCell(-245, -125, 415, 96, st >= 1.6 ? ROLE.c : COSMOS.dim, {
        fill: '#0e2232',
        glow: st >= 1.6 ? 8 : 0,
      }),
      txt(`${FLASH_EXPERTS} EXPERTS / ${FLASH_RANKS} RANKS`, -245, -145, 26, COSMOS.muted, 'mono'),
      txt(`${FLASH_LOCAL_EXPERTS} experts / rank`, -245, -104, 26, ROLE.c, 'mono'),
    );

    // Row 2: EP8 cluster counts (512 -> 4096 -> 24576 -> 3072)
    if (st >= 2.6) {
      nodes.push(
        glassCell(-735, 24, 240, 128, ROLE.a, { fill: '#101d36', glow: 7 }),
        txt(`${FLASH_SOURCE_PER_RANK} × ${FLASH_RANKS}`, -735, -14, 26, COSMOS.muted, 'mono'),
        txt(`${FLASH_SOURCE_TOTAL.toLocaleString()}`, -735, 24, 32, ROLE.a, 'mono'),
        txt('source tok', -735, 62, 26, COSMOS.muted, 'sans'),

        glassCell(-465, 24, 255, 128, ROLE.scale, { fill: '#1e1536', glow: 7 }),
        txt(`× ${FLASH_TOPK} top-k`, -465, -14, 26, COSMOS.muted, 'mono'),
        txt(`${FLASH_ASSIGNMENTS.toLocaleString()}`, -465, 24, 32, ROLE.scale, 'mono'),
        txt('assignments', -465, 62, 26, COSMOS.muted, 'sans'),
      );
    }

    if (st >= 3.6) {
      nodes.push(
        glassCell(-175, 24, 290, 128, st >= 4.5 ? ROLE.gold : ROLE.good, {
          fill: '#0e2622',
          glow: 9,
        }),
        txt(
          st >= 4.5 ? 'SHIFT 1 ROUTE' : `/ ${FLASH_RANKS} RANKS`,
          -175,
          -14,
          26,
          COSMOS.muted,
          'mono',
        ),
        txt(
          st >= 4.5 ? `R0:${r0} R1:${r1}` : `${FLASH_BALANCED_ROWS.toLocaleString()}`,
          -175,
          24,
          26,
          st >= 4.5 ? ROLE.gold : ROLE.good,
          'mono',
        ),
        txt(st >= 4.5 ? 'source = 4,096' : 'rows / rank', -175, 62, 26, COSMOS.muted, 'sans'),
      );
    }

    // Row 3: 416 useful vs 640 padded FLOPs comparison
    if (st >= 6.6) {
      nodes.push(
        glassCell(-665, 315, 370, 88, ROLE.good, { fill: '#0e2620', glow: 8 }),
        txt('416 USEFUL ROWS', -665, 296, 26, COSMOS.muted, 'mono'),
        txt(`${(PACK_128.usefulFlops / 1e9).toFixed(2)} B FLOPs`, -665, 336, 30, ROLE.good, 'mono'),

        glassCell(-250, 315, 400, 88, ROLE.warn, { fill: '#281b10', glow: 8 }),
        txt('640 RESERVED ROWS', -250, 296, 26, COSMOS.muted, 'mono'),
        txt(`${(PACK_128.paddedFlops / 1e9).toFixed(2)} B FLOPs`, -250, 336, 30, ROLE.warn, 'mono'),
      );
    } else {
      nodes.push(
        txt(
          'L1 (gate + up) = 4MHI  ·  L2 (down) = 2MHI  ·  Total = 6MHI',
          -860,
          365,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, pack3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, pack3d, { theta: -0.2, phi: 0.94 });

  c.on('rd-top6', () => s.play(step.to(1, { duration: remainDuration(c, 'rd-top6', 0.45) })));
  c.on('rd-ranks', () => s.play(step.to(2, { duration: remainDuration(c, 'rd-ranks', 0.45) })));
  c.on('rd-4096', () => s.play(step.to(3, { duration: remainDuration(c, 'rd-4096', 0.45) })));
  c.on('rd-3072', () => s.play(step.to(4, { duration: remainDuration(c, 'rd-3072', 0.45) })));
  c.on('rd-shift', () => s.play(step.to(5, { duration: remainDuration(c, 'rd-shift', 0.45) })));
  c.show('rd-6mhi', mhiEq);
  c.on('rd-6mhi', () => s.play(step.to(6, { duration: remainDuration(c, 'rd-6mhi', 0.45) })));
  c.after('rd-compare', () => {
    const dur = remainAfterDuration(c, 'rd-compare', 0.4);
    s.play(step.to(7, { duration: dur }));
    s.play(padLerp.to(1, { duration: dur }));
  });
}
