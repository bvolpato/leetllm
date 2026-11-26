// Scene 05: Conserve the values reused by a tile.
// 2x2 output, K=2: 8 multiplies, 16 naive requests vs 8 distinct scalars; HBM->SMEM->Regs->TC; M=1 vs M=512.
import {
  COSMOS,
  ROLE,
  aura,
  buildFp8WgmmaCube3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function reuseBudget(s, c) {
  const phase = s.value(0);
  const kCursor = s.value(0);
  const promoVal = s.value(0.2);
  const step = s.value(0); // 1=16 naive, 2=8 distinct, 3=hierarchy, 4=spill, 5=M=1 vs M=512, 6=occupancy

  const bgAura = aura(445, 20, 520, '#6ee7b720', '#60a5fa18');
  const { view: cube3d } = buildFp8WgmmaCube3d(kCursor, promoVal, phase, {
    x: 455,
    y: 15,
    unit: 94,
  });

  const title = heroTitle(['Conserve Values', 'Reused by a Tile'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.good,
    eyebrow: 'PERFORMANCE LADDER · DATA REUSE',
    subtitle: '2×2 output, K = 2 -> 8 scalar multiplies',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const nodes = [
      txt('3D TILE STAGING & REUSE RIG', 455, -415, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt('Reuse grows with tile size until registers spill', 455, 435, 26, COSMOS.muted, 'sans'),
    ];

    // Comparison bars: Naive 16 vs Staged 8
    const showNaive = st >= 0.6;
    const showStaged = st >= 1.6;
    const naiveW = showNaive ? 560 : 120;
    const stagedW = showStaged ? 280 : 120;
    nodes.push(
      txt('NAIVE THREADS', -855, -158, 26, ROLE.bad, 'mono', 'left'),
      rect(naiveW, 42, { fill: '#471528', stroke: ROLE.bad, width: 2.2, radius: 6 }).at(
        -855 + naiveW * 0.5,
        -112,
      ),
      txt(
        showNaive ? '16 requests (2× redundant)' : '4 outputs × 4 loads',
        -855 + naiveW + 18,
        -112,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),

      txt('STAGED TILE', -855, -36, 26, ROLE.good, 'mono', 'left'),
      rect(stagedW, 42, { fill: '#113c31', stroke: ROLE.good, width: 2.2, radius: 6 })
        .at(-855 + stagedW * 0.5, 10)
        .glow(showStaged ? 7 : 0, ROLE.good),
      txt(
        showStaged ? '8 distinct scalars' : 'staging tile...',
        -855 + stagedW + 18,
        10,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),
    );

    // Memory hierarchy ladder
    if (st >= 2.6) {
      const tiers = [
        { label: 'Global HBM', color: ROLE.a },
        { label: 'Shared Mem', color: ROLE.scale },
        { label: 'Registers', color: st >= 3.5 && st < 4.5 ? ROLE.warn : ROLE.c },
        { label: 'Tensor Core', color: ROLE.good },
      ];
      tiers.forEach((tier, i) => {
        const tx = -760 + i * 198;
        nodes.push(
          glassCell(tx, 125, 184, 72, tier.color, { fill: '#0e172a', glow: 6 }),
          txt(tier.label, tx, 125, 26, tier.color, 'mono'),
        );
      });
    }

    if (st >= 3.6 && st < 4.6) {
      nodes.push(
        txt(
          'Oversized tile -> register spill to slow local memory',
          -860,
          210,
          26,
          ROLE.warn,
          'sans',
          'left',
        ),
      );
    }

    // M=1 vs M=512 comparison
    if (st >= 4.6) {
      nodes.push(
        glassCell(-665, 272, 370, 92, ROLE.warn, { fill: '#261a10', glow: 6 }),
        txt('M = 1 (decode)', -665, 252, 26, ROLE.warn, 'mono'),
        txt('Mostly empty tile · low reuse', -665, 294, 26, COSMOS.muted, 'sans'),

        glassCell(-265, 272, 390, 92, ROLE.good, { fill: '#102924', glow: 8 }),
        txt('M = 512 (prefill)', -265, 252, 26, ROLE.good, 'mono'),
        txt('Full tiles · high arithmetic reuse', -265, 294, 26, COSMOS.ink, 'sans'),
      );
    }

    nodes.push(
      txt(
        st >= 5.5
          ? 'Check ready warps, registers, bytes & time together'
          : 'Measure real GPU bytes while the staged tile runs',
        -860,
        388,
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
  orbitScene(s, c, cube3d, { theta: -0.22, phi: 0.94 });

  c.on('rb-naive', () => s.play(step.to(1, { duration: remainDuration(c, 'rb-naive', 0.45) })));
  c.on('rb-distinct', () => {
    const dur = remainDuration(c, 'rb-distinct', 0.45);
    s.play(step.to(2, { duration: dur }));
    s.play(kCursor.to(1, { duration: dur }));
  });
  c.on('rb-hier', () => s.play(step.to(3, { duration: remainDuration(c, 'rb-hier', 0.45) })));
  c.on('rb-spill', () => s.play(step.to(4, { duration: remainDuration(c, 'rb-spill', 0.45) })));
  c.on('rb-m1-512', () => {
    const dur = remainDuration(c, 'rb-m1-512', 0.5);
    s.play(step.to(5, { duration: dur }));
    s.play(promoVal.to(1, { duration: dur }));
    s.play(kCursor.to(2, { duration: dur }));
  });
  c.on('rb-occ', () => s.play(step.to(6, { duration: remainDuration(c, 'rb-occ', 0.45) })));
}
