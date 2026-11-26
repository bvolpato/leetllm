// Scene 08: Build the update from thin factors: B(3x2) * A(2x3) dot-product accumulation -> 3x3 dense update.
import {
  COSMOS,
  FACTORS,
  FACTORS_BA,
  aura,
  fmtNum,
  glassCell,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  matrixGrid,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function factorization(s, c) {
  const phase = s.value(0);
  const hlA = s.value(0);
  const hlB = s.value(0);
  const entryStep = s.value(0);
  const fullReveal = s.value(0);

  const bgAura = aura(120, 40, 620, '#ffd1661e', '#5ce1e61a');
  const title = heroTitle(['Build the Update', 'From Thin Factors'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'RANK-2 MATRIX FACTORIZATION',
  });

  const eq = glowTex(String.raw`\Delta W = B A = b_1 a_1^T + b_2 a_2^T`, {
    x: 420,
    y: -365,
    size: 38,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const ha = hlA.value;
    const hb = hlB.value;
    const es = entryStep.value;
    const fr = fullReveal.value;

    const activeRow = es > 0.1 && fr < 0.5 ? Math.min(2, Math.floor(es * 2.9)) : -1;
    const activeCol = es > 0.1 && fr < 0.5 ? Math.min(2, Math.floor((es * 5.8) % 3)) : -1;
    const revealCount = fr > 0.3 ? 9 : es > 0.1 ? Math.max(1, Math.min(9, Math.ceil(es * 9))) : 0;

    const rIdx = activeRow >= 0 ? activeRow : 0;
    const cIdx = activeCol >= 0 ? activeCol : 0;
    const p1 = FACTORS.B[rIdx][0] * FACTORS.A[0][cIdx];
    const p2 = FACTORS.B[rIdx][1] * FACTORS.A[1][cIdx];
    const sumVal = FACTORS_BA[rIdx][cIdx];

    const nodes = [
      // B (3x2) on left
      txt('B : 3 × 2 (output directions)', -615, -205, 26, COSMOS.cyan, 'mono'),
      matrixGrid(FACTORS.B, -615, -10, {
        cellW: 96,
        cellH: 80,
        color: hb > 0.2 ? COSMOS.cyan : COSMOS.blue,
        highlightRow: activeRow,
        fontSize: 30,
      }),

      txt('×', -430, -10, 48, COSMOS.muted, 'mono'),

      // A (2x3) in center
      txt('A : 2 × 3 (measuring rows)', -165, -205, 26, COSMOS.gold, 'mono'),
      matrixGrid(FACTORS.A, -165, -10, {
        cellW: 96,
        cellH: 80,
        color: ha > 0.2 ? COSMOS.gold : COSMOS.blue,
        highlightCol: activeCol,
        fontSize: 30,
      }),

      txt('=', 75, -10, 48, COSMOS.muted, 'mono'),

      // Product B·A (3x3) on right
      txt('B · A : 3 × 3 (rank <= 2)', 455, -205, 26, COSMOS.emerald, 'mono'),
      matrixGrid(FACTORS_BA, 455, -10, {
        cellW: 108,
        cellH: 80,
        color: fr > 0.3 ? COSMOS.emerald : COSMOS.cyan,
        highlight: activeRow >= 0 && activeCol >= 0 ? [activeRow, activeCol] : null,
        revealCount: Math.max(1, revealCount),
        fontSize: 30,
      }),

      // Inner rank bottleneck arc
      glowingArc([-530, 145], [-250, 145], 44, {
        color: COSMOS.gold,
        width: 3.4,
        opacity: 0.85,
      }),
      txt('inner rank r = 2', -390, 206, 26, COSMOS.gold, 'mono'),

      // Live entry dot-product readout along bottom
      glassCell(0, 338, 1660, 134, fr > 0.3 ? COSMOS.emerald : COSMOS.gold, {
        fill: '#101a30',
        glow: 9,
      }),
      txt(
        fr > 0.3
          ? 'COMPLETE UPDATE = SUM OF 2 RANK-1 OUTER PRODUCTS'
          : `DOT PRODUCT FOR ENTRY (${rIdx + 1}, ${cIdx + 1})`,
        0,
        300,
        26,
        COSMOS.muted,
        'mono',
      ),
      txt(
        fr > 0.3
          ? 'Training keeps only thin A (6) and B (6) without materializing dense BA'
          : `(${fmtNum(FACTORS.B[rIdx][0])} × ${fmtNum(FACTORS.A[0][cIdx])}) + (${fmtNum(FACTORS.B[rIdx][1])} × ${fmtNum(FACTORS.A[1][cIdx])}) = ${fmtNum(p1)} + ${fmtNum(p2)} = ${fmtNum(sumVal)}`,
        0,
        356,
        fr > 0.3 ? 30 : 34,
        fr > 0.3 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).glow(7, fr > 0.3 ? COSMOS.emerald : COSMOS.gold),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);
  runPhase(s, c, phase, 12);

  c.on('factorization-b1-1', () => s.play(hlA.to(1, { duration: 0.4 })));
  c.on('factorization-b1-2', () => s.play(hlB.to(1, { duration: 0.4 })));
  c.on('factorization-b2-1', () => s.play(entryStep.to(1, { duration: 2.2 })));
  c.on('factorization-b3-1', () =>
    s.play(fullReveal.to(1, { duration: remainDuration(c, 'factorization-b3-1', 0.55) })),
  );
}
