// Scene 16: Which precision change touched the result? Loss scaling/unscaling, two NaN failure routes, and TF32 bit truncation.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  FAIL_TRACES,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  roundedFormat,
  runPhase,
  txt,
} from '../parts.mjs';

export default function precisionControls(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1); // Beat 0: AMP GradScaler (scale -> FP16 -> unscale in FP32)
  const ampProg = s.value(0);

  const showPart2 = s.value(0); // Beat 1: Overflow NaN vs Underflow NaN
  const diagProg = s.value(0);

  const showPart3 = s.value(0); // Beat 2: TF32 input precision with FP32 storage
  const tf32Switched = s.value(0);

  const bgAura = aura(0, 20, 560, '#ffd16620', '#ff6b8b14');

  const title = heroTitle(['GradScaler, NaN Routes,', 'and TF32 Controls'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'AMP MIXED PRECISION · DIAGNOSTICS · TF32',
  });

  const tinyGrad = 2 ** -25;
  const scaledGrad = tinyGrad * 128;
  const fp16Scaled = roundedFormat(scaledGrad, 10, -14, 15);
  const fp16Direct = roundedFormat(tinyGrad, 10, -14, 15);

  const part1 = guardedDynamic(showPart1, (a) => {
    const p = ampProg.value;
    const stages = [
      { label: 'TINY GRADIENT', val: tinyGrad.toExponential(3), col: COSMOS.cyan },
      { label: 'SCALE × 128', val: scaledGrad.toExponential(3), col: COSMOS.gold },
      { label: 'FP16 STORED', val: fp16Scaled.toExponential(3), col: COSMOS.blue },
      { label: 'UNSCALE IN FP32', val: tinyGrad.toExponential(3), col: COSMOS.emerald },
    ];
    const nodes = [
      txt(
        'AMP LOSS SCALING PIPELINE (SCALE = 128)',
        -855,
        -205,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(a),
    ];

    stages.forEach((st, i) => {
      const cx = -630 + i * 420;
      const lit = p * 4 >= i + 0.35;
      nodes.push(
        glassCell(cx, -30, 340, 156, lit ? st.col : COSMOS.rule, {
          fill: '#0f172b',
          glow: lit ? 8 : 0,
          opacity: a,
        }),
        txt(st.label, cx, -66, 26, lit ? st.col : COSMOS.muted, 'mono').opacity(a),
        txt(lit ? st.val : '·', cx, -2, 32, lit ? COSMOS.ink : COSMOS.dim, 'mono').opacity(a),
      );
      if (i < 3) {
        nodes.push(
          glowingArc([cx + 174, -30], [cx + 244, -30], 0, {
            color: lit ? st.col : COSMOS.rule,
            width: 3.4,
            opacity: a,
          }),
        );
      }
    });

    nodes.push(
      glassCell(0, 240, 1560, 112, COSMOS.rose, { fill: '#22111d', glow: 8, opacity: a }),
      txt(
        `Without loss scaling: direct FP16 stores 2^-25 as ${fp16Direct} (gradient wiped out)`,
        0,
        243,
        32,
        COSMOS.rose,
        'mono',
      ).opacity(a),
      txt(
        'Always verify finite loss, finite unscaled gradients, and task quality',
        0,
        375,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  const part2 = guardedDynamic(showPart2, (a) => {
    const p = diagProg.value;
    const nodes = [
      txt(
        'TWO DISTINCT ROUTES TO NaN IN FP16',
        -855,
        -205,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ).opacity(a),
      // Left: Overflow
      glassCell(-440, 65, 790, 440, COSMOS.rose, { fill: '#1a1120', glow: 8, opacity: a }),
      txt('OVERFLOW ROUTE', -440, -108, 30, COSMOS.blue, 'mono').opacity(a),
      txt('300 × 300 = 90,000', -440, -35, 36, COSMOS.ink, 'mono').opacity(a),
      txt(p > 0.25 ? 'FP16 product -> ∞' : '...', -440, 45, 34, COSMOS.gold, 'mono').opacity(a),
      txt(p > 0.55 ? '∞ - ∞  ->  NaN' : '...', -440, 130, 44, COSMOS.rose, 'mono')
        .glow(7, COSMOS.rose)
        .opacity(a),
      txt(
        p > 0.85 ? `FP32 recovers: ${FAIL_TRACES.overflow.fp32}` : '',
        -440,
        215,
        32,
        COSMOS.emerald,
        'mono',
      ).opacity(a),

      // Right: Underflow
      glassCell(440, 65, 790, 440, COSMOS.cyan, { fill: '#0e1929', glow: 8, opacity: a }),
      txt('UNDERFLOW ROUTE', 440, -108, 30, COSMOS.cyan, 'mono').opacity(a),
      txt('tiny = 2^-25', 440, -35, 36, COSMOS.ink, 'mono').opacity(a),
      txt(
        p > 0.25 ? `FP16 stored -> ${FAIL_TRACES.underflow.stored}` : '...',
        440,
        45,
        34,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      txt(p > 0.55 ? '0 ÷ 0  ->  NaN' : '...', 440, 130, 44, COSMOS.rose, 'mono')
        .glow(7, COSMOS.rose)
        .opacity(a),
      txt(
        p > 0.85 ? `FP32 recovers: ${FAIL_TRACES.underflow.fp32}` : '',
        440,
        215,
        32,
        COSMOS.emerald,
        'mono',
      ).opacity(a),
      txt(
        'Inspect dtypes, scaling, kernels, and reductions to find the first failing op',
        0,
        375,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  const part3 = guardedDynamic(showPart3, (a) => {
    const sw = tf32Switched.value > 0.5;
    const inp = Math.fround(1.0001);
    const red = roundedFormat(inp, 10, -126, 127);

    const panels = [
      { label: 'INPUT TENSOR', val: inp, bytes: '4 B (float32)', color: COSMOS.blue, mask: false },
      {
        label: 'MULTIPLY INPUT (TF32)',
        val: sw ? red : inp,
        bytes: '10 fraction bits active',
        color: COSMOS.gold,
        mask: sw,
      },
      {
        label: 'OUTPUT TENSOR',
        val: sw ? red : inp,
        bytes: '4 B (FP32 accum)',
        color: COSMOS.cyan,
        mask: false,
      },
    ];

    const nodes = [
      txt(
        'ONE MATMUL OUTPUT (WEIGHT × 1) · TENSOR STORAGE STAYS FLOAT32',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
    ];

    panels.forEach((p, idx) => {
      const cx = -565 + idx * 565;
      nodes.push(
        glassCell(cx, 50, 490, 355, p.color, { fill: '#0f1629', glow: 8, opacity: a }),
        txt(p.label, cx, -82, 28, p.color, 'mono').opacity(a),
      );
      // 2 rows x 16 bits = 32 bits
      for (let bit = 0; bit < 32; bit++) {
        const bx = cx - 195 + (bit % 16) * 26;
        const by = -18 + Math.floor(bit / 16) * 44;
        const active = !p.mask || bit < 19;
        nodes.push(
          rect(20, 32, {
            fill: active ? p.color : '#141a2b',
            stroke: p.color,
            width: 1.2,
            radius: 3,
          })
            .at(bx, by)
            .opacity((active ? 0.92 : 0.25) * a),
        );
      }
      nodes.push(
        txt(p.val === 1 ? '1' : `≈ ${p.val.toFixed(7)}`, cx, 118, 36, p.color, 'mono').opacity(a),
        txt(p.bytes, cx, 175, 26, COSMOS.muted, 'mono').opacity(a),
      );
      if (idx < 2) {
        nodes.push(
          glowingArc([cx + 250, 50], [cx + 312, 50], 0, {
            color: COSMOS.gold,
            width: 3.4,
            opacity: a,
          }),
        );
      }
    });

    nodes.push(
      txt(
        '1,000,000 float32 values still take 4,000,000 bytes in TF32 · always verify output tolerance',
        0,
        355,
        28,
        COSMOS.gold,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, part1, part2, part3);
  runPhase(s, c, phase, 14);

  c.on('amp-unscale', () => s.play(ampProg.to(1, { duration: 1.3 })));
  c.on('amp-diagnosis', () => {
    s.play(
      par(
        showPart1.to(0, { duration: 0.2 }),
        delay(showPart2.to(1, { duration: 0.25 }), 0.22),
        delay(diagProg.to(1, { duration: 1.4 }), 0.25),
      ),
    );
  });
  c.on('tf32-storage', () => {
    s.play(
      par(
        showPart2.to(0, { duration: 0.2 }),
        delay(showPart3.to(1, { duration: 0.25 }), 0.22),
        delay(tf32Switched.to(1, { duration: remainDuration(c, 'tf32-storage', 0.65) }), 0.35),
      ),
    );
  });
}
