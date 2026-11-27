// Scene 04: Two values at opposite ends of the range.
// Logarithmic dynamic-range cliffs + strict prediction withholding for FP16 (0, Inf) vs BF16 (finite, 99,840).
import {
  COSMOS,
  FP16_HALF_SUBNORMAL,
  FP16_MAX,
  RANGE_LARGE,
  RANGE_LARGE_BF16,
  RANGE_LARGE_FP16,
  RANGE_SMALL,
  RANGE_SMALL_BF16,
  RANGE_SMALL_FP16,
  aura,
  fmtVal,
  glowDot,
  glowingArc,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function rangeCheck(s, c) {
  const showLarge = s.value(0);
  const revealFp16 = s.value(0);
  const revealBf16 = s.value(0);

  const bgAura = aura(0, -40, 680, '#ff6b8b1e', '#6ee7b716');

  const title = heroTitle(['Opposite Ends', 'of the Range'], {
    x: -855,
    y: -445,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.rose,
    eyebrow: 'LOGARITHMIC DYNAMIC RANGE',
  });

  // Logarithmic axis mapping 10^-9 .. 10^6 onto [-760, 760]
  const axisLeft = -760;
  const axisRight = 760;
  const axisY = -120;
  const logX = (val) => axisLeft + ((Math.log10(val) + 9) / 15) * (axisRight - axisLeft);

  const xUnderCliff = logX(FP16_HALF_SUBNORMAL);
  const xOverCliff = logX(FP16_MAX);
  const xSmall = logX(RANGE_SMALL);
  const xLarge = logX(RANGE_LARGE);

  const colSmall = -240;
  const colLarge = 470;
  const yFp16 = 175;
  const yBf16 = 310;

  const live = guardedDynamic(1, () => {
    const lg = showLarge.value;
    const r16 = revealFp16.value;
    const rbf = revealBf16.value;

    const nodes = [
      // Main log axis + glowing safe FP16 zone between the two rose cliffs
      line([axisLeft, axisY], [axisRight, axisY], { stroke: '#2d3d61', width: 4 }),
      glowingTrail(
        [
          [xUnderCliff, axisY],
          [xOverCliff, axisY],
        ],
        { color: COSMOS.blue, width: 7, glow: 10 },
      ),
      txt(
        'FP16 REPRESENTABLE SPAN',
        (xUnderCliff + xOverCliff) * 0.5,
        axisY - 40,
        26,
        COSMOS.blue,
        'mono',
      ),

      // Left underflow cliff wall (stops cleanly above axis labels)
      line([xUnderCliff, axisY - 82], [xUnderCliff, axisY + 14], {
        stroke: COSMOS.rose,
        width: 4,
        dash: [8, 5],
      }).glow(8, COSMOS.rose),
      txt('2⁻²⁵ half-step', xUnderCliff, axisY - 110, 26, COSMOS.rose, 'mono'),

      // Right overflow cliff wall (stops cleanly above axis labels)
      line([xOverCliff, axisY - 82], [xOverCliff, axisY + 14], {
        stroke: COSMOS.rose,
        width: 4,
        dash: [8, 5],
      }).glow(8, COSMOS.rose),
      txt('65,504 max', xOverCliff, axisY - 110, 26, COSMOS.rose, 'mono'),

      // Left yellow beacon: backward gradient 1.2e-8
      glowDot(xSmall, axisY, { radius: 13, color: COSMOS.gold, glow: 15 }),
      txt('1.2 × 10⁻⁸', xSmall, axisY + 56, 30, COSMOS.gold, 'mono').glow(6, COSMOS.gold),
      txt('gradient', xSmall, axisY + 98, 26, COSMOS.muted, 'sans'),
    ];

    // Right yellow beacon: forward activation 100,000
    if (lg > 0.02) {
      nodes.push(
        glowDot(xLarge, axisY, { radius: 13, color: COSMOS.gold, glow: 15, opacity: lg }),
        txt('100,000', xLarge, axisY + 56, 30, COSMOS.gold, 'mono')
          .glow(6, COSMOS.gold)
          .opacity(lg),
        txt('activation', xLarge, axisY + 98, 26, COSMOS.muted, 'sans').opacity(lg),
      );
    }

    // Column headings for cast comparison
    nodes.push(
      txt('BACKWARD GRADIENT', colSmall, 72, 26, COSMOS.muted, 'mono'),
      txt('FORWARD ACTIVATION', colLarge, 72, 26, COSMOS.muted, 'mono'),
      line([-820, 112], [820, 112], { stroke: '#26304a', width: 2 }),

      // FP16 cast row
      txt('FP16', -740, yFp16, 40, COSMOS.blue, 'mono', 'left').glow(6, COSMOS.blue),
      txt(
        r16 > 0.5 ? fmtVal(RANGE_SMALL_FP16) : '?',
        colSmall,
        yFp16,
        52,
        r16 > 0.5 ? COSMOS.rose : COSMOS.dim,
        'mono',
      ).glow(r16 > 0.5 ? 9 : 0, COSMOS.rose),
      txt(
        r16 > 0.5 ? fmtVal(RANGE_LARGE_FP16) : '?',
        colLarge,
        yFp16,
        52,
        r16 > 0.5 ? COSMOS.rose : COSMOS.dim,
        'mono',
      ).glow(r16 > 0.5 ? 9 : 0, COSMOS.rose),

      // BF16 cast row
      txt('BF16', -740, yBf16, 40, COSMOS.emerald, 'mono', 'left').glow(6, COSMOS.emerald),
      txt(
        rbf > 0.5 ? fmtVal(RANGE_SMALL_BF16) : '?',
        colSmall,
        yBf16,
        44,
        rbf > 0.5 ? COSMOS.emerald : COSMOS.dim,
        'mono',
      ).glow(rbf > 0.5 ? 8 : 0, COSMOS.emerald),
      txt(
        rbf > 0.5 ? fmtVal(RANGE_LARGE_BF16) : '?',
        colLarge,
        yBf16,
        48,
        rbf > 0.5 ? COSMOS.emerald : COSMOS.dim,
        'mono',
      ).glow(rbf > 0.5 ? 8 : 0, COSMOS.emerald),
    );

    if (r16 > 0.5) {
      nodes.push(
        txt('underflow', colSmall + 125, yFp16, 26, COSMOS.rose, 'sans', 'left').opacity(r16),
        txt('overflow', colLarge + 125, yFp16, 26, COSMOS.rose, 'sans', 'left').opacity(r16),
      );
    }

    if (rbf > 0.5) {
      nodes.push(
        txt('finite', colSmall + 165, yBf16, 26, COSMOS.emerald, 'sans', 'left').opacity(rbf),
        txt('finite', colLarge + 150, yBf16, 26, COSMOS.emerald, 'sans', 'left').opacity(rbf),
      );
    }

    // Bottom footer message respecting strict prediction withholding
    const footer =
      rbf > 0.5
        ? 'Wider exponent range keeps both finite; fraction bits pick where each lands'
        : r16 > 0.5
          ? 'Forward activation already overflowed before backward loss scaling can run'
          : 'Predict: what does FP16 store for 1.2 × 10⁻⁸ and 100,000?';
    const footerColor = rbf > 0.5 ? COSMOS.emerald : r16 > 0.5 ? COSMOS.rose : COSMOS.gold;
    nodes.push(txt(footer, 0, 442, 28, footerColor, 'sans').glow(5, footerColor));

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('range-large', () => s.play(showLarge.to(1, { duration: 0.5 })));
  c.after('range-half', () =>
    s.play(revealFp16.to(1, { duration: remainDuration(c, 'range-half', 0.45, 0.35, true) })),
  );
  c.after('range-wide', () =>
    s.play(revealBf16.to(1, { duration: remainDuration(c, 'range-wide', 0.45, 0.35, true) })),
  );
}
