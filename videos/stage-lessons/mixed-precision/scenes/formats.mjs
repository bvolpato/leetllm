// Scene 03: Compare range and local resolution.
// Act 1: Luminous FP16 vs BF16 bit-field beams, aligned local tick combs, and log dynamic-range horizon.
// Act 2 (Beat 3): Autocast operation-specific dtype routing & persistent FP32 parameter/gradient pipeline.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  bf16,
  bitFieldRibbon,
  fade,
  fp16,
  glowDot,
  glowTex,
  glowingArc,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function formats(s, c) {
  const phase = s.value(0);
  const showAct1 = s.value(1);
  const bitsReveal = s.value(0.25);
  const gridFocus = s.value(0);
  const rangeFocus = s.value(0);
  const contractFocus = s.value(0);

  const showAct2 = s.value(0);
  const routeMatmul = s.value(0);
  const routeLoss = s.value(0);
  const routeBackward = s.value(0);
  const routeBuffer = s.value(0);

  const bgAura = aura(100, -40, 680, '#60a5fa1e', '#6ee7b716');

  const title1 = heroTitle(['Range vs.', 'Local Resolution'], {
    x: -855,
    y: -445,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: '16-BIT FLOATING-POINT TRADEOFF',
  });

  const title2 = heroTitle(['Autocast', 'Dtype Routing'], {
    x: -855,
    y: -445,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.emerald,
    eyebrow: 'OP-SPECIFIC MIXED PRECISION',
  }).opacity(0);

  const fp16DeltaTex = glowTex(String.raw`\Delta_+ = 2^{-10}`, {
    x: -440,
    y: 195,
    size: 38,
    color: COSMOS.blue,
    glow: 6,
  });
  const bf16DeltaTex = glowTex(String.raw`\Delta_+ = 2^{-7}`, {
    x: 420,
    y: 195,
    size: 38,
    color: COSMOS.emerald,
    glow: 6,
  });

  // Act 1: Bit fields + local tick combs + dynamic range horizon
  const act1Live = guardedDynamic(showAct1, (a) => {
    const br = bitsReveal.value;
    const gf = gridFocus.value;
    const rf = rangeFocus.value;
    const cf = contractFocus.value;
    const ph = phase.value;
    const probeVal = 1.0 + 0.02 * Math.sin(ph * 1.1);

    const fp16Rib = bitFieldRibbon({
      x: -830,
      y: -145,
      totalWidth: 740,
      height: 52,
      signBits: 1,
      expBits: 5,
      fracBits: 10,
      expColor: COSMOS.gold,
      fracColor: COSMOS.blue,
      opacity: a,
      reveal: br,
    });
    const bf16Rib = bitFieldRibbon({
      x: 80,
      y: -145,
      totalWidth: 740,
      height: 52,
      signBits: 1,
      expBits: 8,
      fracBits: 7,
      expColor: COSMOS.gold,
      fracColor: COSMOS.emerald,
      opacity: a,
      reveal: br,
    });

    const nodes = [
      // Bit-field headers and ribbons
      txt('FP16 · 5 exp · 10 frac', -830, -210, 32, COSMOS.blue, 'mono', 'left')
        .glow(6, COSMOS.blue)
        .opacity(a),
      txt('BF16 · 8 exp · 7 frac', 80, -210, 32, COSMOS.emerald, 'mono', 'left')
        .glow(6, COSMOS.emerald)
        .opacity(a),
      fp16Rib.group,
      bf16Rib.group,
      // Clean segment count captions directly below exponent & mantissa spans
      txt('exp (5)', fp16Rib.centers[1].cx, -90, 26, COSMOS.gold, 'mono').opacity(a),
      txt('frac (10)', fp16Rib.centers[2].cx, -90, 26, COSMOS.blue, 'mono').opacity(a),
      txt('exp (8)', bf16Rib.centers[1].cx, -90, 26, COSMOS.gold, 'mono').opacity(a),
      txt('frac (7)', bf16Rib.centers[2].cx, -90, 26, COSMOS.emerald, 'mono').opacity(a),
    ];

    // Local tick grids on [0.975, 1.025]
    const drawLocalGrid = (x0, x1, y, fmtName, color, castFn, fracBits) => {
      const mid = (x0 + x1) * 0.5;
      const scale = (x1 - x0) / 0.05;
      const gap = 2 ** -fracBits;
      nodes.push(
        txt(
          `${fmtName} ticks around 1.0`,
          mid,
          y - 54,
          26,
          gf > 0.3 ? color : COSMOS.muted,
          'mono',
        ).opacity(a),
        line([x0, y], [x1, y], { stroke: '#33456b', width: 3 }).opacity(a),
      );
      for (let i = -Math.floor(0.025 / (gap / 2)); i <= Math.floor(0.025 / gap); i++) {
        const v = 1 + i * (i < 0 ? gap / 2 : gap);
        const px = mid + (v - 1) * scale;
        if (px < x0 - 2 || px > x1 + 2) continue;
        const isOne = i === 0;
        nodes.push(
          line([px, y - (isOne ? 24 : 15)], [px, y + (isOne ? 24 : 15)], {
            stroke: isOne ? COSMOS.gold : color,
            width: isOne ? 4.5 : fracBits === 7 ? 3.5 : 1.8,
          }).opacity((isOne ? 1 : 0.72 + 0.25 * gf) * a),
        );
      }
      if (gf > 0.05) {
        const px = mid + (probeVal - 1) * scale;
        const rx = mid + (castFn(probeVal) - 1) * scale;
        nodes.push(
          glowDot(px, y - 28, { radius: 7, color: COSMOS.gold, glow: 10, opacity: gf * a }),
          line([px, y - 20], [rx, y - 4], { stroke: COSMOS.gold, width: 2.5 }).opacity(gf * a),
          glowDot(rx, y, { radius: 6, color, glow: 10, opacity: gf * a }),
        );
      }
      nodes.push(txt('1.0', mid, y + 48, 26, COSMOS.gold, 'mono').opacity(a));
    };

    drawLocalGrid(-830, -90, 82, 'FP16 (fine)', COSMOS.blue, fp16, 10);
    drawLocalGrid(80, 820, 82, 'BF16 (8x coarser)', COSMOS.emerald, bf16, 7);

    // Lower dynamic-range horizon bar (log10 exponent span -38 to +38)
    const rLeft = -760;
    const rRight = 760;
    const logX = (exp10) => rLeft + ((exp10 + 40) / 80) * (rRight - rLeft);
    const ry = 315;
    const fp16X0 = logX(Math.log10(2 ** -14));
    const fp16X1 = logX(Math.log10(65504));
    const bf16X0 = logX(-38);
    const bf16X1 = logX(38.5);

    nodes.push(
      txt(
        'POSITIVE NORMAL RANGE (LOG SCALE)',
        -830,
        265,
        26,
        rf > 0.3 ? COSMOS.gold : COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
      // BF16 vast span
      glowingTrail(
        [
          [bf16X0, ry],
          [bf16X1, ry],
        ],
        {
          color: COSMOS.emerald,
          width: 8 + 4 * rf,
          glow: 8 + 6 * rf,
          opacity: (0.65 + 0.35 * rf) * a,
        },
      ),
      // FP16 narrow central island
      glowingTrail(
        [
          [fp16X0, ry - 18],
          [fp16X1, ry - 18],
        ],
        { color: COSMOS.blue, width: 9, glow: 9, opacity: a },
      ),
      txt('10⁻³⁸', bf16X0, ry + 42, 26, COSMOS.emerald, 'mono').opacity(a),
      txt(
        'FP16: 6.1e-5 .. 65,504',
        (fp16X0 + fp16X1) * 0.5,
        ry - 48,
        26,
        COSMOS.blue,
        'mono',
      ).opacity(a),
      txt('3.4×10³⁸', bf16X1, ry + 42, 26, COSMOS.emerald, 'mono').opacity(a),
    );

    if (cf > 0.02) {
      nodes.push(
        txt('Track separately: compute · storage · reduce', 0, 445, 28, COSMOS.gold, 'sans')
          .glow(6, COSMOS.gold)
          .opacity(cf * a),
      );
    }

    return group(...nodes);
  });

  // Act 2: Autocast operation-specific routing pipeline (Beat 3)
  const act2Live = guardedDynamic(showAct2, (a) => {
    const mm = routeMatmul.value;
    const ls = routeLoss.value;
    const bw = routeBackward.value;
    const bf = routeBuffer.value;
    const ph = phase.value;
    const travelT = (ph * 0.55) % 1;

    const nodes = [
      // Autocast region subtle glowing boundary arc (a live execution region, not a boxed bullet card)
      line([-820, -225], [220, -225], { stroke: COSMOS.blue, width: 2.5, dash: [10, 6] }).opacity(
        0.75 * a,
      ),
      txt('WITH TORCH.AUTOCAST(...)', -820, -255, 26, COSMOS.blue, 'mono', 'left').opacity(a),
      txt('OUTSIDE AUTOCAST', 340, -255, 26, COSMOS.rose, 'mono', 'left').opacity(a),

      // Stage 1: Matmul node
      glowDot(-620, -90, {
        radius: 22,
        color: mm > 0.3 ? COSMOS.blue : COSMOS.dim,
        glow: 14,
        opacity: a,
      }),
      txt('Matrix Multiply', -620, -152, 32, COSMOS.ink, 'sans').opacity(a),
      txt(
        mm > 0.3 ? '16-bit operands' : 'eligible op',
        -620,
        -25,
        28,
        mm > 0.3 ? COSMOS.blue : COSMOS.muted,
        'mono',
      )
        .glow(mm > 0.3 ? 6 : 0, COSMOS.blue)
        .opacity(a),

      // Conduit 1 -> 2
      glowingTrail(
        [
          [-580, -90],
          [-120, -90],
        ],
        { color: mm > 0.3 ? COSMOS.blue : COSMOS.dim, width: 4.5, glow: 8, opacity: a },
      ),

      // Stage 2: Cross-entropy loss node
      glowDot(-80, -90, {
        radius: 22,
        color: ls > 0.3 ? COSMOS.gold : COSMOS.dim,
        glow: 14,
        opacity: a,
      }),
      txt('Cross-Entropy Loss', -80, -152, 32, COSMOS.ink, 'sans').opacity(a),
      txt(
        ls > 0.3 ? 'widened to FP32' : 'sensitive reduction',
        -80,
        -25,
        28,
        ls > 0.3 ? COSMOS.gold : COSMOS.muted,
        'mono',
      )
        .glow(ls > 0.3 ? 6 : 0, COSMOS.gold)
        .opacity(a),

      // Conduit 2 -> 3 (crossing outside autocast)
      glowingTrail(
        [
          [-40, -90],
          [460, -90],
        ],
        { color: bw > 0.3 ? COSMOS.rose : COSMOS.dim, width: 4.5, glow: 8, opacity: a },
      ),

      // Stage 3: Backward node (outside autocast)
      glowDot(500, -90, {
        radius: 22,
        color: bw > 0.3 ? COSMOS.rose : COSMOS.dim,
        glow: 14,
        opacity: a,
      }),
      txt('Backward Pass', 500, -152, 32, COSMOS.ink, 'sans').opacity(a),
      txt(
        bw > 0.3 ? 'mirrors forward dtypes' : 'follows forward',
        500,
        -25,
        28,
        bw > 0.3 ? COSMOS.rose : COSMOS.muted,
        'mono',
      )
        .glow(bw > 0.3 ? 6 : 0, COSMOS.rose)
        .opacity(a),

      // Persistent FP32 state conduit along lower tier (routed cleanly below backward label & into right side of .grad)
      glowingArc([500, 22], [238, 195], 88, {
        color: bf > 0.3 ? COSMOS.cyan : COSMOS.dim,
        width: 4.5,
        glow: 9,
        opacity: a,
      }),
      glowingTrail(
        [
          [-540, 195],
          [160, 195],
        ],
        { color: bf > 0.3 ? COSMOS.emerald : COSMOS.dim, width: 5, glow: 10, opacity: a },
      ),
      glowDot(-580, 195, {
        radius: 22,
        color: bf > 0.3 ? COSMOS.emerald : COSMOS.cyan,
        glow: 14,
        opacity: a,
      }),
      glowDot(200, 195, {
        radius: 22,
        color: bf > 0.3 ? COSMOS.cyan : COSMOS.dim,
        glow: 14,
        opacity: a,
      }),
      txt('FP32 Parameters', -580, 132, 32, COSMOS.emerald, 'sans').opacity(a),
      txt('persistent master weights', -580, 255, 26, COSMOS.muted, 'mono').opacity(a),
      txt('FP32 .grad Buffer', 200, 255, 32, COSMOS.cyan, 'sans').opacity(a),
      txt(
        bf > 0.3 ? 'accumulates in FP32' : 'gradient target',
        200,
        304,
        26,
        bf > 0.3 ? COSMOS.cyan : COSMOS.muted,
        'mono',
      ).opacity(a),

      // Warning rule against model.half()
      txt(
        'Do not call model.half() with AMP  ·  parameters stay FP32',
        0,
        405,
        30,
        COSMOS.rose,
        'sans',
      )
        .glow(6, COSMOS.rose)
        .opacity(bf * a),
    ];

    // Live flowing photon along active pipeline segment
    if (mm > 0.2) {
      nodes.push(
        glowDot(-580 + 460 * travelT, -90, { radius: 8, color: COSMOS.gold, glow: 12, opacity: a }),
      );
    }
    if (bw > 0.2) {
      nodes.push(
        glowDot(-40 + 500 * travelT, -90, { radius: 8, color: COSMOS.rose, glow: 12, opacity: a }),
      );
    }
    if (bf > 0.2) {
      nodes.push(
        glowDot(160 - 700 * travelT, 195, {
          radius: 8,
          color: COSMOS.emerald,
          glow: 12,
          opacity: a,
        }),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title1, title2, fp16DeltaTex, bf16DeltaTex, act1Live, act2Live);
  runPhase(s, c, phase, 16);

  c.on('formats-b1-1', () => s.play(bitsReveal.to(1, { duration: 0.9 })));
  c.on('formats-b2-1', () => s.play(gridFocus.to(1, { duration: 0.7 })));
  c.on('formats-b2-2', () => s.play(rangeFocus.to(1, { duration: 0.7 })));
  c.on('formats-b3-1', () => s.play(contractFocus.to(1, { duration: 0.6 })));

  c.on('formats-extension-4', () => {
    s.play(
      par(
        showAct1.to(0, { duration: 0.2 }),
        fade(title1, 0, { duration: 0.2 }),
        fade(fp16DeltaTex, 0, { duration: 0.2 }),
        fade(bf16DeltaTex, 0, { duration: 0.2 }),
        delay(showAct2.to(1, { duration: 0.25 }), 0.22),
        delay(fade(title2, 1, { duration: 0.25 }), 0.22),
      ),
    );
  });
  c.on('autocast-matmul', () => s.play(routeMatmul.to(1, { duration: 0.45 })));
  c.on('autocast-loss', () => s.play(routeLoss.to(1, { duration: 0.45 })));
  c.on('autocast-backward', () => s.play(routeBackward.to(1, { duration: 0.45 })));
  c.on('autocast-buffer', () =>
    s.play(routeBuffer.to(1, { duration: remainDuration(c, 'autocast-buffer', 0.45) })),
  );
}
