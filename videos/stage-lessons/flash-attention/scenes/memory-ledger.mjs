// Scene 05: Count allocation, logical transfers and retained rows separately: 32 GiB / 128 GiB / 8 MiB.
import {
  COSMOS,
  FOUR_PASS_GIB,
  LEDGER_CONFIG,
  LSE_MIB,
  SCORE_DEC_GB,
  SCORE_GIB,
  aura,
  box3d,
  cinematic3d,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function memoryLedger(s, c) {
  const phase = s.value(0);
  const showScore = s.value(0);
  const showFour = s.value(0);
  const showAxes = s.value(0);

  const bgAura = aura(320, 20, 520, '#ff6b8b24', '#a78bfa16');
  const title = heroTitle(['Separate', 'Three Quantities'], {
    x: -855,
    y: -410,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: `B=${LEDGER_CONFIG.batch} · H=${LEDGER_CONFIG.heads} · N=${LEDGER_CONFIG.seq} · FP16`,
  });

  const eq = glowTex(String.raw`B \cdot H \cdot N^2 \cdot 2\text{ B} = 32\;\text{GiB}`, {
    x: -555,
    y: -170,
    size: 36,
    color: COSMOS.gold,
  });

  // 3D volumetric comparison: 1 score slab (32 GiB) vs 4-pass stack (128 GiB) vs LSE wafer (8 MiB)
  const view3d = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 15.8,
    unit: 105,
    focus: [0, 0, 1.0],
  }).at(340, 35);

  const scoreBox = box3d(-2.9, -1.1, 0, 1.7, 2.2, 0.85, '#b83254', COSMOS.rose, 0.78);
  const passBoxes = [0, 1, 2, 3].flatMap((k) =>
    box3d(
      -0.6,
      -1.1,
      k * 0.92,
      1.7,
      2.2,
      0.82,
      k % 2 === 0 ? '#c45b26' : '#b83254',
      COSMOS.amber,
      0.74,
    ),
  );
  const lseStrip = box3d(1.75, -1.1, 0, 0.45, 2.2, 0.14, '#5a3ec8', COSMOS.violet, 0.9);
  view3d.add(...scoreBox, ...passBoxes, ...lseStrip);

  const live = guardedDynamic(1, () => {
    const s1 = Math.max(0.3, showScore.value);
    const s4 = showFour.value;
    const sa = showAxes.value;

    const nodes = [
      txt('3D MEMORY VOLUMES (SCHEMATIC SCALE)', 340, -370, 26, COSMOS.muted, 'mono'),
      txt('32 GiB slab', 85, 385, 26, COSMOS.rose, 'mono'),
      txt('128 GiB (4-pass)', 355, 385, 26, COSMOS.amber, 'mono').opacity(Math.max(0.3, s4)),
      txt('8 MiB LSE', 610, 385, 26, COSMOS.violet, 'mono').opacity(Math.max(0.3, sa)),

      // Floating cinema quantitative rulers (zero boxed cards)
      rule(-855, -108, -220, -108, '#2a385c', 1.8).opacity(s1),
      txt('1. ONE ALLOCATED SCORE MATRIX', -855, -68, 26, COSMOS.muted, 'mono', 'left').opacity(s1),
      txt(`${SCORE_GIB} GiB`, -855, -6, 54, COSMOS.rose, 'mono', 'left')
        .glow(8, COSMOS.rose)
        .opacity(s1),
      txt(
        `(${SCORE_DEC_GB.toFixed(2)} GB decimal)`,
        -615,
        -6,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(s1),
      rect(160 * s1, 14, { fill: COSMOS.rose, stroke: null, radius: 5 })
        .at(-855 + 80 * s1, 44)
        .glow(7, COSMOS.rose)
        .opacity(0.9 * s1),
    ];

    if (s4 > 0.02) {
      nodes.push(
        rule(-855, 78, -220, 78, '#2a385c', 1.8).opacity(s4),
        txt(
          '2. FOUR-PASS LOGICAL INTERMEDIATES',
          -855,
          118,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(s4),
        txt(`${FOUR_PASS_GIB} GiB`, -855, 180, 54, COSMOS.amber, 'mono', 'left')
          .glow(8, COSMOS.amber)
          .opacity(s4),
        txt(`4 × ${SCORE_GIB} GiB (FP16)`, -585, 180, 26, COSMOS.muted, 'mono', 'left').opacity(s4),
        rect(620 * s4, 14, { fill: COSMOS.amber, stroke: null, radius: 5 })
          .at(-855 + 310 * s4, 230)
          .glow(8, COSMOS.amber)
          .opacity(0.92 * s4),
      );
    }

    if (sa > 0.02) {
      nodes.push(
        rule(-855, 264, -220, 264, '#2a385c', 1.8).opacity(sa),
        txt(
          '3. RETAINED ROW STATISTIC (B·H·N)',
          -855,
          304,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(sa),
        txt(`${LSE_MIB} MiB`, -855, 366, 52, COSMOS.violet, 'mono', 'left')
          .glow(8, COSMOS.violet)
          .opacity(sa),
        txt('Q, K, V, O still remain', -615, 366, 26, COSMOS.cyan, 'sans', 'left').opacity(sa),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, view3d, title, eq, live);
  runPhase(s, c, phase, 10);
  orbitScene(s, c, view3d, { theta: -0.34, phi: 0.96 });

  c.on('memory-ledger-beat-1', () => s.play(showScore.to(0.6, { duration: 0.35 })));
  c.on('fa-score-bytes', () => s.play(showScore.to(1, { duration: 0.4 })));
  c.on('memory-ledger-beat-2', () => s.play(showFour.to(0.55, { duration: 0.35 })));
  c.on('fa-four-passes', () => s.play(showFour.to(1, { duration: 0.4 })));
  c.on('memory-ledger-beat-3', () =>
    s.play(showAxes.to(1, { duration: remainDuration(c, 'memory-ledger-beat-3', 0.5) })),
  );
}
