// Scene 11: Hand the output tile to a warp: WMMA 16x16x16 D=AB+C, BF16->FP32 accumulation, 73x61x67 corner pad & crop.
import { delay, par } from 'vizmatic/stage';
import {
  BF16_A,
  BF16_B,
  BF16_ROUNDED_SUM,
  BF16_WIDE_SUM,
  COSMOS,
  ROLE,
  aura,
  buildSystolicGemm3d,
  fragmentAccumulation,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function tensorcores(s, c) {
  const kCursor = s.value(0);
  const showFrag = s.value(1);
  const fragProg = s.value(0.25);
  const showWide = s.value(0);
  const showCorner = s.value(0);
  const cropped = s.value(0);

  const bgAura = aura(380, 20, 540, '#a78bfa22', '#5ce1e618');
  const { view: gemm3d } = buildSystolicGemm3d(kCursor, { x: 425, y: 20, unit: 100 });

  const title = heroTitle(['Hand the Output Tile', 'to a Warp'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.violet,
    eyebrow: 'TENSOR CORES · WMMA 16 × 16 × 16',
  });

  const eq = glowTex('D = A \\cdot B + C', { x: -640, y: -200, size: 44, color: COSMOS.gold });

  // View 1: Fragment accumulation + BF16 vs FP32 wide sum
  const fragView = guardedDynamic(showFrag, (a) => {
    const f = fragmentAccumulation(fragProg.value);
    const sw = showWide.value;
    const nodes = [
      txt('3D WARP-COLLECTIVE MMA', 425, -405, 26, COSMOS.violet, 'mono')
        .glow(5, COSMOS.violet)
        .opacity(a),
      txt(
        'All 32 lanes cooperate on one 16×16×16 fragment',
        425,
        420,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
      txt(`ACCUMULATED FRAGMENT (${f.count} / 2 slices)`, -640, -110, 26, ROLE.c, 'mono').opacity(
        a,
      ),
    ];

    for (let r = 0; r < 2; r++) {
      for (let col = 0; col < 2; col++) {
        const cx = -720 + col * 160;
        const cy = -20 + r * 110;
        nodes.push(
          glassCell(cx, cy, 136, 86, ROLE.c, { fill: '#0d2233', glow: 8, opacity: a }),
          txt(String(f.output[r][col]), cx, cy, 38, ROLE.c, 'mono').opacity(a),
        );
      }
    }

    if (sw > 0.02) {
      nodes.push(
        txt('MIXED-PRECISION ACCUMULATION', -855, 195, 26, COSMOS.gold, 'mono', 'left').opacity(
          sw * a,
        ),
        txt(
          `1024 + (${BF16_A} × ${BF16_B}) = ${BF16_WIDE_SUM}  (FP32 keeps fraction)`,
          -855,
          255,
          28,
          ROLE.good,
          'mono',
          'left',
        )
          .glow(5, ROLE.good)
          .opacity(sw * a),
        txt(
          `Store as BF16 → rounds back to ${BF16_ROUNDED_SUM}`,
          -855,
          312,
          28,
          ROLE.bad,
          'mono',
          'left',
        ).opacity(sw * a),
      );
    }

    return group(...nodes);
  });

  // View 2: 73 x 61 x 67 padded 16x16 corner fragment (9x13 useful + 3-wide K tail)
  const cornerView = guardedDynamic(showCorner, (a) => {
    const cr = cropped.value;
    const cellW = 28;
    const gx0 = -640;
    const gy0 = -150;
    const nodes = [
      txt(
        'RAGGED SHAPE: M = 73, N = 61, K = 67',
        -855,
        -252,
        28,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(a),
      txt('CORNER TILE (row 64, col 48) · 16 × 16 PADDED', -420, -204, 26, ROLE.c, 'mono').opacity(
        a,
      ),
    ];

    // 16x16 corner output grid: 9 rows x 13 cols useful, rest zero-padded
    for (let r = 0; r < 16; r++) {
      for (let col = 0; col < 16; col++) {
        const useful = r < 9 && col < 13;
        const cx = gx0 + col * cellW;
        const cy = gy0 + r * cellW;
        const cellOp = useful ? a : (1 - cr * 0.72) * a;
        nodes.push(
          rect(cellW - 4, cellW - 4, {
            fill: useful ? '#0f3644' : '#181422',
            stroke: useful ? (cr > 0.5 ? ROLE.good : ROLE.c) : COSMOS.dim,
            width: useful ? 1.8 : 0.9,
            radius: 3,
          })
            .at(cx, cy)
            .opacity(cellOp),
        );
      }
    }

    // Highlight border around 9x13 useful region (caption placed cleanly below grid!)
    nodes.push(
      rect(13 * cellW + 4, 9 * cellW + 4, {
        fill: null,
        stroke: cr > 0.5 ? ROLE.good : COSMOS.gold,
        width: 3.4,
        radius: 6,
      })
        .at(gx0 + 6 * cellW, gy0 + 4 * cellW)
        .glow(9, cr > 0.5 ? ROLE.good : COSMOS.gold)
        .opacity(a),
      txt('Gold frame = 9 × 13 useful corner', -430, 326, 28, COSMOS.gold, 'mono').opacity(a),
    );

    // Right side: K = 67 = 4 × 16 + 3 tail ribbon + alignment rules
    nodes.push(
      txt('K = 67 → 4 FULL PANELS + 3-POSITION TAIL', 360, -182, 26, ROLE.a, 'mono').opacity(a),
    );
    for (let pIdx = 0; pIdx < 5; pIdx++) {
      const px = 40 + pIdx * 165;
      const isTail = pIdx === 4;
      nodes.push(
        glassCell(px, -95, 145, 86, isTail ? COSMOS.gold : ROLE.a, {
          fill: isTail ? '#292212' : '#10203a',
          glow: isTail ? 10 : 4,
          opacity: a,
        }),
        txt(
          isTail ? 'tail: 3' : `k ${pIdx * 16}..${pIdx * 16 + 15}`,
          px,
          -95,
          26,
          isTail ? COSMOS.gold : COSMOS.ink,
          'mono',
        ).opacity(a),
      );
    }

    if (cr > 0.02) {
      nodes.push(
        txt('WMMA ALIGNMENT REQUIREMENTS', 360, 48, 26, COSMOS.violet, 'mono').opacity(cr * a),
        txt('Base pointer: 32-byte aligned', 360, 112, 28, COSMOS.ink, 'mono').opacity(cr * a),
        txt('FP16 stride: multiple of 8 elements', 360, 168, 28, ROLE.a, 'mono').opacity(cr * a),
        txt('FP32 stride: multiple of 4 elements', 360, 224, 28, ROLE.c, 'mono').opacity(cr * a),
        txt('Pad inputs with zeros · crop output to 9 × 13', 360, 315, 28, ROLE.good, 'sans')
          .glow(5, ROLE.good)
          .opacity(cr * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, gemm3d, title, eq, fragView, cornerView);
  const tailStart = c.cue('tail-panel').start;
  orbitScene(
    s,
    c,
    gemm3d,
    { theta: -0.2, phi: 0.9 },
    { startOffset: 0.1, endMargin: Math.max(0.55, c.end - tailStart + 0.4) },
  );

  c.on('warp-add', () => {
    const dur = remainDuration(c, 'warp-add', 0.65);
    s.play(kCursor.to(1, { duration: dur }));
    s.play(fragProg.to(1, { duration: dur }));
  });
  c.on('wide-sum', () => s.play(showWide.to(1, { duration: remainDuration(c, 'wide-sum', 0.45) })));
  c.on('tail-panel', () => {
    s.play(
      par(showFrag.to(0, { duration: 0.2 }), delay(showCorner.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.hide('tail-panel', [gemm3d, eq], { fade: 0.2 });
  c.on('crop-fragment', () =>
    s.play(cropped.to(1, { duration: remainDuration(c, 'crop-fragment', 0.45) })),
  );
}
