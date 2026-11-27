// Scene 05: How close can a code get to zero? Subnormal grid around d = 2^-9, signed ties, and MI200 FTZ.
import {
  COSMOS,
  E4M3_D,
  E5M2_D,
  aura,
  bitStrip8,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function subnormalGrid(s, c) {
  const toSubnormal = s.value(0);
  const showE5Floor = s.value(0);
  const showThreeQ = s.value(0);
  const snapUp = s.value(0);
  const showNegZero = s.value(0);
  const showFTZ = s.value(0);

  const bgAura = aura(0, 40, 620, '#5ce1e61f', '#a78bfa1a');
  const title = heroTitle(['How Close', 'to Zero?'], {
    x: -855,
    y: -415,
    size: 62,
    lineHeight: 72,
    accent: COSMOS.cyan,
    eyebrow: 'SUBNORMALS · SIGNED ZERO · FLUSH-TO-ZERO',
  });

  const subEq = glowTex(String.raw`d_{\text{E4M3}} = 2^{-9},\quad d_{\text{E5M2}} = 2^{-16}`, {
    x: 420,
    y: -360,
    size: 36,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const sub = toSubnormal.value;
    const e5 = showE5Floor.value;
    const tq = showThreeQ.value;
    const up = snapUp.value;
    const nz = showNegZero.value;
    const ftz = showFTZ.value;

    // Code flips from smallest normal 0x08 (0 0001 000 = 2^-6) to smallest subnormal 0x01 (0 0000 001 = 2^-9)
    const activeCode = sub > 0.5 ? 0x01 : 0x08;
    const nodes = [
      txt(
        sub > 0.5
          ? 'EXP = 0000 · LEADING BIT = 0 (SUBNORMAL d = 2^-9)'
          : 'EXP = 0001 · LEADING BIT = 1 (SMALLEST NORMAL 2^-6)',
        -855,
        -195,
        26,
        sub > 0.5 ? COSMOS.cyan : COSMOS.gold,
        'mono',
        'left',
      ),
      bitStrip8(activeCode, -455, -110, {
        cellW: 58,
        cellH: 54,
        gap: 6,
        mode: 'e4m3',
        highlightIndices: [1, 2, 3, 4],
      }),
    ];

    // Right top comparison card for E4M3 vs E5M2 floor
    nodes.push(
      glassCell(430, -110, 790, 128, e5 > 0.5 ? COSMOS.gold : COSMOS.blue, {
        fill: '#10182b',
        glow: 7,
      }),
      txt('SMALLEST POSITIVE STEP', 430, -148, 26, COSMOS.muted, 'mono'),
      txt(
        e5 > 0.5
          ? `E4M3: 2^-9 (${E4M3_D.toFixed(6)})  ·  E5M2: 2^-16 (${E5M2_D.toExponential(2)})`
          : `E4M3 smallest subnormal d = 2^-9 ≈ ${E4M3_D.toFixed(6)}`,
        430,
        -90,
        26,
        e5 > 0.5 ? COSMOS.gold : COSMOS.cyan,
        'mono',
      ),
    );

    // Magnified subnormal ruler in [-1.2d, +1.5d]
    const rx0 = -810;
    const rx1 = 810;
    const ry = 105;
    const mapD = (k) => rx0 + ((k + 1.2) / 2.7) * (rx1 - rx0);

    nodes.push(
      txt('MAGNIFIED SUBNORMAL RULER (UNITS OF d = 2^-9)', 0, ry - 78, 26, COSMOS.muted, 'mono'),
      line([rx0, ry], [rx1, ry], { stroke: '#465885', width: 3.4 }),
    );
    for (const [k, label] of [
      [-1, '-d'],
      [-0.5, '-0.5d'],
      [0, '±0'],
      [0.5, '+0.5d'],
      [0.75, '+0.75d'],
      [1, '+d'],
    ]) {
      const tx = mapD(k);
      const isCode = Math.abs(k - Math.round(k)) < 1e-9;
      nodes.push(
        line([tx, ry - (isCode ? 24 : 14)], [tx, ry + (isCode ? 24 : 14)], {
          stroke: isCode ? COSMOS.cyan : COSMOS.dim,
          width: isCode ? 3.2 : 1.8,
        }),
        txt(label, tx, ry + 54, 26, isCode ? COSMOS.ink : COSMOS.muted, 'mono'),
      );
    }

    // Animated probes on the subnormal ruler
    if (tq > 0.02) {
      const xPos = mapD(0.75 + 0.25 * up);
      nodes.push(
        glowDot(xPos, ry - 18, {
          radius: 9,
          color: up > 0.5 ? COSMOS.emerald : COSMOS.gold,
          opacity: tq,
        }),
        txt(
          up > 0.5 ? '0.75d → +d' : '0.75d',
          xPos,
          ry - 50,
          26,
          up > 0.5 ? COSMOS.emerald : COSMOS.gold,
          'mono',
        ).opacity(tq),
      );
    }
    if (nz > 0.02) {
      const xHalfP = mapD(0.5 * (1 - nz));
      const xHalfN = mapD(-0.5 * (1 - nz));
      nodes.push(
        glowDot(xHalfP, ry + 18, { radius: 7, color: COSMOS.cyan, opacity: nz }),
        glowDot(xHalfN, ry + 18, { radius: 7, color: COSMOS.rose, opacity: nz }),
        txt('-0.5d → -0.0 (sign kept)', mapD(-0.65), ry - 48, 26, COSMOS.rose, 'mono').opacity(nz),
        txt(
          'Unscaled 10^-7 < 0.5 × 2^-16 → 0 even in E5M2',
          0,
          232,
          26,
          COSMOS.amber,
          'mono',
        ).opacity(nz),
      );
    }

    // Beat 2: CPU cast vs Matrix FTZ mode banner
    if (ftz > 0.02) {
      nodes.push(
        glassCell(-430, 365, 760, 126, COSMOS.cyan, { fill: '#0e1d2e', glow: 7, opacity: ftz }),
        txt('CPU OCP CAST', -430, 330, 26, COSMOS.cyan, 'mono').opacity(ftz),
        txt('Preserves subnormals + signed zero', -430, 384, 28, COSMOS.ink, 'sans').opacity(ftz),

        glassCell(430, 365, 760, 126, COSMOS.rose, { fill: '#221120', glow: 8, opacity: ftz }),
        txt(
          'MATRIX FTZ MODE (E.G. AMD MI200 FP16/BF16)',
          430,
          330,
          26,
          COSMOS.rose,
          'mono',
        ).opacity(ftz),
        txt(
          'Instruction can flush subnormals to 0: test target mode',
          430,
          384,
          26,
          COSMOS.ink,
          'sans',
        ).opacity(ftz),
      );
    } else {
      nodes.push(
        txt(
          'Even code 0x00 wins exact ±0.5d ties under round-to-nearest-even',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, subEq, live);

  c.on('lp-subnormal-grid-build-0', () =>
    s.play(toSubnormal.to(1, { duration: remainDuration(c, 'lp-subnormal-grid-build-0', 0.55) })),
  );
  c.on('lp-subnormal-grid-floor', () =>
    s.play(showE5Floor.to(1, { duration: remainDuration(c, 'lp-subnormal-grid-floor', 0.45) })),
  );
  c.on('lp-subnormal-grid-build-1', () =>
    s.play(showThreeQ.to(1, { duration: remainDuration(c, 'lp-subnormal-grid-build-1', 0.45) })),
  );
  c.on('lp-subnormal-grid-up', () =>
    s.play(snapUp.to(1, { duration: remainDuration(c, 'lp-subnormal-grid-up', 0.45) })),
  );
  c.on('lp-subnormal-grid-zero', () =>
    s.play(showNegZero.to(1, { duration: remainDuration(c, 'lp-subnormal-grid-zero', 0.5) })),
  );
  c.on('lp-subnormal-grid-build-2', () =>
    s.play(showFTZ.to(1, { duration: remainDuration(c, 'lp-subnormal-grid-build-2', 0.5) })),
  );
}
