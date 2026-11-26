// Scene 17: How much space do the scales take? E8M0 exponent-only decoding, 8.25 bits/val (68 B vs 66 B), and 3x70 logical vs 297 B padded.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  bitStrip8,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function scaleBytes(s, c) {
  const phase = s.value(0);
  const showPartA = s.value(1);
  const showDecode80 = s.value(0);

  const showPartB = s.value(0);
  const showBitsVal = s.value(0);
  const showCount66 = s.value(0);

  const showPartC = s.value(0);
  const showLogical = s.value(0);
  const showPadded = s.value(0);

  const bgAura = aura(0, 30, 620, '#60a5fa1e', '#ffd16618');
  const title = heroTitle(['How Much Space', 'Do Scales Take?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.blue,
    eyebrow: 'E8M0 SCALE BYTES · OVERHEAD · BLOCK PADDING',
  });

  const e8Eq = glowTex(String.raw`S = 2^{\,u - 127}\quad (u \in [0, 254])`, {
    x: 420,
    y: -360,
    size: 38,
    color: COSMOS.gold,
  });

  // Part A (Beat 0): E8M0 unsigned 8-bit exponent decoder
  const partA = guardedDynamic(showPartA, (a) => {
    const d80 = showDecode80.value;
    const nodes = [
      txt('E8M0 BYTE 0x77 (u = 119) → ROW 0 SCALE', -445, -165, 26, COSMOS.cyan, 'mono').opacity(a),
      bitStrip8(0x77, -445, -80, { cellW: 58, cellH: 56, gap: 6, mode: 'e8m0', opacity: a }),
      glassCell(-445, 95, 520, 128, COSMOS.cyan, { fill: '#0e1d2e', glow: 8, opacity: a }),
      txt('2^(119 - 127) = 2^-8', -445, 95, 36, COSMOS.cyan, 'mono')
        .glow(6, COSMOS.cyan)
        .opacity(a),

      txt('E8M0 BYTE 0x80 (u = 128) → ROW 1 SCALE', 445, -165, 26, COSMOS.gold, 'mono').opacity(
        (0.3 + 0.7 * d80) * a,
      ),
      bitStrip8(0x80, 445, -80, {
        cellW: 58,
        cellH: 56,
        gap: 6,
        mode: 'e8m0',
        highlightIndices: d80 > 0.5 ? [0] : [],
        opacity: (0.3 + 0.7 * d80) * a,
      }),
      glassCell(445, 95, 520, 128, COSMOS.gold, {
        fill: '#1e1912',
        glow: 8,
        opacity: (0.3 + 0.7 * d80) * a,
      }),
      txt('2^(128 - 127) = 2^1 = 2', 445, 95, 36, COSMOS.gold, 'mono')
        .glow(6, COSMOS.gold)
        .opacity((0.3 + 0.7 * d80) * a),

      // Edge-case strip at bottom
      glassCell(0, 315, 1520, 134, COSMOS.blue, { fill: '#10182b', glow: 7, opacity: a }),
      txt('SPECIAL E8M0 RULES', 0, 278, 26, COSMOS.blue, 'mono').opacity(a),
      txt(
        '0x00 → 2^-127 (positive!)   ·   0xff → NaN   ·   no zero, negative, or infinity code',
        0,
        336,
        28,
        COSMOS.ink,
        'mono',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  // Part B (Beat 1): 8.25 bits/value and 68 B vs 66 B payload comparison
  const partB = guardedDynamic(showPartB, (a) => {
    const bv = showBitsVal.value;
    const c66 = showCount66.value;
    const nodes = [
      glassCell(0, -145, 1560, 154, COSMOS.cyan, { fill: '#0e1d2e', glow: 8, opacity: a }),
      txt('ONE FULL 32-ELEMENT MXFP8 BLOCK', 0, -186, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        bv > 0.5
          ? '256 element bits + 8 scale bits = 264 bits ÷ 32 = 8.25 bits / value'
          : '32 × 8 = 256 element bits + 8 E8M0 scale bits',
        0,
        -122,
        32,
        bv > 0.5 ? COSMOS.gold : COSMOS.cyan,
        'mono',
      )
        .glow(6, bv > 0.5 ? COSMOS.gold : COSMOS.cyan)
        .opacity(a),

      // 64 activations: FP32 tensor scale (68 B) vs two E8M0 scales (66 B)
      glassCell(-435, 145, 760, 230, COSMOS.amber, { fill: '#1c1614', glow: 8, opacity: a }),
      txt('SINGLE FP32 TENSOR SCALE (64 VALS)', -435, 68, 26, COSMOS.amber, 'mono').opacity(a),
      rect(520, 42, { fill: '#15304d', stroke: COSMOS.cyan, width: 2, radius: 6 })
        .at(-490, 138)
        .opacity(a),
      txt('64 B codes', -490, 138, 26, COSMOS.ink, 'mono').opacity(a),
      rect(110, 42, { fill: '#3d2810', stroke: COSMOS.amber, width: 2.4, radius: 6 })
        .at(-165, 138)
        .opacity(a),
      txt('4 B', -165, 138, 26, COSMOS.amber, 'mono').opacity(a),
      txt('Total = 68 B  (+6.25% overhead)', -435, 215, 30, COSMOS.amber, 'mono').opacity(a),

      glassCell(435, 145, 760, 230, COSMOS.emerald, {
        fill: '#0e2224',
        glow: 9,
        opacity: (0.3 + 0.7 * c66) * a,
      }),
      txt('TWO E8M0 BLOCK SCALES (64 VALS)', 435, 68, 26, COSMOS.emerald, 'mono').opacity(
        (0.3 + 0.7 * c66) * a,
      ),
      rect(520, 42, { fill: '#15304d', stroke: COSMOS.cyan, width: 2, radius: 6 })
        .at(380, 138)
        .opacity((0.3 + 0.7 * c66) * a),
      txt('64 B codes', 380, 138, 26, COSMOS.ink, 'mono').opacity((0.3 + 0.7 * c66) * a),
      rect(88, 42, { fill: '#0f382e', stroke: COSMOS.emerald, width: 2.4, radius: 6 })
        .at(695, 138)
        .opacity((0.3 + 0.7 * c66) * a),
      txt('2 B', 695, 138, 26, COSMOS.emerald, 'mono').opacity((0.3 + 0.7 * c66) * a),
      txt('Total = 66 B  (+3.125% overhead)', 435, 215, 30, COSMOS.emerald, 'mono')
        .glow(6, COSMOS.emerald)
        .opacity((0.3 + 0.7 * c66) * a),
    ];
    return group(...nodes);
  });

  // Part C (Beat 2): 3 rows × 70 logical values -> 3 blocks/row -> 219 B logical vs 297 B padded
  const partC = guardedDynamic(showPartC, (a) => {
    const lg = showLogical.value;
    const pd = showPadded.value;
    const nodes = [
      txt(
        '3 ROWS × 70 LOGICAL VALUES → 3 BLOCKS OF 32 PER ROW (9 BLOCKS TOTAL)',
        0,
        -210,
        26,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
    ];

    for (let r = 0; r < 3; r++) {
      const ry = -120 + r * 92;
      nodes.push(txt(`Row ${r}`, -775, ry, 28, COSMOS.muted, 'mono', 'left').opacity(a));
      // Block 0 (32 logical)
      nodes.push(
        rect(380, 56, { fill: '#14304c', stroke: COSMOS.cyan, width: 2, radius: 6 })
          .at(-445, ry)
          .opacity(a),
        txt('32 logical + 1B', -445, ry, 26, COSMOS.ink, 'mono').opacity(a),
        // Block 1 (32 logical)
        rect(380, 56, { fill: '#14304c', stroke: COSMOS.cyan, width: 2, radius: 6 })
          .at(-35, ry)
          .opacity(a),
        txt('32 logical + 1B', -35, ry, 26, COSMOS.ink, 'mono').opacity(a),
        // Block 2 (6 logical + 26 padded)
        rect(95, 56, { fill: '#14304c', stroke: COSMOS.cyan, width: 2, radius: 6 })
          .at(235, ry)
          .opacity(a),
        txt('6', 235, ry, 26, COSMOS.cyan, 'mono').opacity(a),
        rect(280, 56, {
          fill: pd > 0.5 ? '#2b1424' : '#12182b',
          stroke: pd > 0.5 ? COSMOS.rose : COSMOS.dim,
          width: 2.2,
          dash: [7, 5],
          radius: 6,
        })
          .at(428, ry)
          .glow(pd > 0.5 ? 7 : 0, COSMOS.rose)
          .opacity(a),
        txt('26 pad + 1B', 428, ry, 26, pd > 0.5 ? COSMOS.rose : COSMOS.dim, 'mono').opacity(a),
        txt('96 B + 3 B', 695, ry, 26, COSMOS.gold, 'mono').opacity(a),
      );
    }

    nodes.push(
      glassCell(-435, 290, 760, 156, COSMOS.cyan, {
        fill: '#0e1d2e',
        glow: 8,
        opacity: (0.25 + 0.75 * lg) * a,
      }),
      txt('LOGICAL PAYLOAD (NO PADDING)', -435, 246, 26, COSMOS.muted, 'mono').opacity(
        (0.25 + 0.75 * lg) * a,
      ),
      txt('210 code B + 9 scale B = 219 B', -435, 308, 34, COSMOS.cyan, 'mono')
        .glow(6, COSMOS.cyan)
        .opacity((0.25 + 0.75 * lg) * a),

      glassCell(435, 290, 760, 156, COSMOS.rose, {
        fill: '#221120',
        glow: 9,
        opacity: (0.2 + 0.8 * pd) * a,
      }),
      txt('STORED PADDED LAYOUT (FULL BLOCKS)', 435, 246, 26, COSMOS.muted, 'mono').opacity(
        (0.2 + 0.8 * pd) * a,
      ),
      txt('288 code B + 9 scale B = 297 B', 435, 308, 34, COSMOS.rose, 'mono')
        .glow(7, COSMOS.rose)
        .opacity((0.2 + 0.8 * pd) * a),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, e8Eq, partA, partB, partC);
  runPhase(s, c, phase, 16);

  c.on('lp-scale-bytes-build-0', () => s.play(phase.to(2.0, { duration: 0.45 })));
  c.on('lp-scale-bytes-decode', () =>
    s.play(showDecode80.to(1, { duration: remainDuration(c, 'lp-scale-bytes-decode', 0.45) })),
  );

  c.on('lp-scale-bytes-build-1', () => {
    s.play(
      par(showPartA.to(0, { duration: 0.2 }), delay(showPartB.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.hide('lp-scale-bytes-build-1', [e8Eq], { fade: 0.2 });
  c.on('lp-scale-bytes-bits', () =>
    s.play(showBitsVal.to(1, { duration: remainDuration(c, 'lp-scale-bytes-bits', 0.45) })),
  );
  c.on('lp-scale-bytes-count', () =>
    s.play(showCount66.to(1, { duration: remainDuration(c, 'lp-scale-bytes-count', 0.45) })),
  );

  c.on('lp-scale-bytes-build-2', () => {
    s.play(
      par(showPartB.to(0, { duration: 0.2 }), delay(showPartC.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('lp-scale-bytes-logical', () =>
    s.play(showLogical.to(1, { duration: remainDuration(c, 'lp-scale-bytes-logical', 0.45) })),
  );
  c.on('lp-scale-bytes-padding', () =>
    s.play(showPadded.to(1, { duration: remainDuration(c, 'lp-scale-bytes-padding', 0.45) })),
  );
}
