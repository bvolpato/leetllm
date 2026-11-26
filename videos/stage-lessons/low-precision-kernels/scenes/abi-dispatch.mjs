// Scene 21: Can this kernel consume the operand? 2x32 shape gate, Oct 2026 NVIDIA/AMD hardware matrix, and PyTorch TF32 controls.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

const HW_ROWS = [
  {
    vendor: 'NVIDIA Hopper / Ada',
    formats: 'Conventional FP8 (OCP E4M3 / E5M2)',
    col: COSMOS.emerald,
  },
  {
    vendor: 'NVIDIA Blackwell SM 10.0 / 10.3',
    formats: 'MXFP8 & NVFP4 train (10.0+ NVFP4 infer)',
    col: COSMOS.cyan,
  },
  { vendor: 'AMD CDNA 3 (ROCm 10)', formats: 'FNUZ FP8 (bias 8, 0x80 = NaN)', col: COSMOS.amber },
  { vendor: 'AMD CDNA 4 / RDNA 4 (ROCm 10)', formats: 'OCP FP8 matrix paths', col: COSMOS.violet },
];

export default function abiDispatch(s, c) {
  const phase = s.value(0);
  const showShape = s.value(1);
  const showGateHit = s.value(0);
  const showHW = s.value(0);
  const showTF32 = s.value(0);

  const bgAura = aura(0, 20, 620, '#ff6b8b1e', '#5ce1e61a');
  const title = heroTitle(['Can This Kernel', 'Consume It?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.rose,
    eyebrow: 'KERNEL ABI · SHAPE · HARDWARE · TF32 CONTROLS',
  });

  // Part 1 (Beat 0): 2x32 operand rejected by multiple-of-32 nonfinal dimension gate + ABI match rails
  const part1 = guardedDynamic(showShape, (a) => {
    const hit = showGateHit.value;
    const p = phase.value;
    const nodes = [
      // Left operand block: 2 x 32
      glassCell(-635, -75, 420, 178, COSMOS.blue, { fill: '#101a2e', glow: 8, opacity: a }),
      txt('OPERAND SHAPE', -635, -130, 26, COSMOS.muted, 'mono').opacity(a),
      txt('2 × 32', -635, -72, 46, COSMOS.blue, 'mono').glow(6, COSMOS.blue).opacity(a),
      txt('nonfinal dim = 2', -635, -18, 26, COSMOS.rose, 'mono').opacity(a),

      // Gate barrier in center
      glowingArc([-420, -75], [-135, -75], 0, { color: COSMOS.rose, width: 3.8, opacity: a }),
      glassCell(110, -75, 470, 178, COSMOS.rose, { fill: '#241020', glow: 10, opacity: a }),
      txt('TE TRAINING SHAPE GATE', 110, -130, 26, COSMOS.rose, 'mono').opacity(a),
      txt('nonfinal % 32 == 0', 110, -72, 34, COSMOS.gold, 'mono').opacity(a),
      txt(
        hit > 0.3 ? 'REJECTED: 2 is not ×32' : 'checking alignment...',
        110,
        -18,
        26,
        COSMOS.rose,
        'mono',
      ).opacity(a),

      // Right target MMA
      glassCell(645, -75, 410, 178, COSMOS.dim, {
        fill: '#111626',
        dash: [8, 6],
        glow: 0,
        opacity: 0.65 * a,
      }),
      txt('MMA KERNEL', 645, -105, 26, COSMOS.dim, 'mono').opacity(a),
      txt('DISPATCH BLOCKED', 645, -45, 28, COSMOS.rose, 'mono').opacity(a),

      // Full ABI checklist rails below (horizontal neon strips, no bullet prose!)
      glassCell(-435, 240, 790, 250, COSMOS.cyan, { fill: '#0e1829', glow: 7, opacity: a }),
      txt('1. OPERAND ABI BEFORE DISPATCH', -800, 152, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt(
        'Encoding (OCP vs FNUZ)  ·  Scale type & axes',
        -800,
        212,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(a),
      txt(
        'Orientation  ·  Padding  ·  Alignment  ·  Scale layout',
        -800,
        266,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(a),

      glassCell(435, 240, 790, 250, COSMOS.gold, { fill: '#191714', glow: 7, opacity: a }),
      txt('2. INSTRUCTION EXECUTION ABI', 70, 152, 26, COSMOS.gold, 'mono', 'left').opacity(a),
      txt(
        'Product precision  ·  Internal reduction',
        70,
        212,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(a),
      txt(
        'Accumulator type  ·  Epilogue  ·  Output dtype',
        70,
        266,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(a),

      glowDot(-420 + ((p * 0.6) % 1) * 280, -75, { radius: 6, color: COSMOS.rose, opacity: a }),
    ];
    return group(...nodes);
  });

  // Part 2 (Beat 1): Hardware matrix (Oct 2026 snapshot)
  const part2 = guardedDynamic(showHW, (a) => {
    const nodes = [
      txt(
        'HARDWARE SUPPORT SNAPSHOT (OCT 2026 · CHECK ACTUAL DEVICE)',
        320,
        -365,
        26,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
    ];
    HW_ROWS.forEach((row, i) => {
      const y = -165 + i * 134;
      nodes.push(
        glassCell(0, y, 1660, 108, row.col, { fill: '#0e1628', glow: 7, opacity: a }),
        rect(14, 72, { fill: row.col, stroke: null, radius: 5 })
          .at(-800, y)
          .glow(8, row.col)
          .opacity(a),
        txt(row.vendor, -765, y, 30, row.col, 'mono', 'left').opacity(a),
        txt(row.formats, 25, y, 28, COSMOS.ink, 'sans', 'left').opacity(a),
      );
    });
    return group(...nodes);
  });

  // Part 3 (Beat 2): TF32 separate controls for matmul vs convolution
  const part3 = guardedDynamic(showTF32, (a) => {
    const p = phase.value;
    const nodes = [
      txt(
        'TF32: 32-BIT STORAGE · 10-BIT FRACTION MMA READ',
        350,
        -365,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(a),

      glassCell(-435, -35, 790, 240, COSMOS.cyan, { fill: '#0e1d2e', glow: 8, opacity: a }),
      txt('PYTORCH MATMUL CONTROL', -435, -110, 26, COSMOS.cyan, 'mono').opacity(a),
      txt('cuda.matmul.fp32_precision', -435, -40, 30, COSMOS.gold, 'mono')
        .glow(5, COSMOS.gold)
        .opacity(a),
      txt('"tf32"  |  "ieee"', -435, 28, 34, COSMOS.ink, 'mono').opacity(a),

      glassCell(435, -35, 790, 240, COSMOS.violet, { fill: '#18122b', glow: 8, opacity: a }),
      txt('PYTORCH CONVOLUTION CONTROL', 435, -110, 26, COSMOS.violet, 'mono').opacity(a),
      txt('cudnn.conv.fp32_precision', 435, -40, 30, COSMOS.gold, 'mono')
        .glow(5, COSMOS.gold)
        .opacity(a),
      txt('Independent setting from matmul', 435, 28, 28, COSMOS.ink, 'sans').opacity(a),

      glassCell(0, 275, 1660, 178, COSMOS.amber, { fill: '#1e1612', glow: 8, opacity: a }),
      txt('DISPATCH HYGIENE', -790, 222, 26, COSMOS.amber, 'mono', 'left').opacity(a),
      txt(
        '1. Stick to one control family (do not mix current controls with legacy flags)',
        -790,
        278,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(a),
      txt(
        '2. Verify kernel symbol and reduction mode on the exact device you benchmark',
        -790,
        328,
        28,
        COSMOS.cyan,
        'sans',
        'left',
      ).opacity(a),
      glowDot(-780 + ((p * 0.4) % 1) * 1560, 150, { radius: 5, color: COSMOS.gold, opacity: a }),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, part1, part2, part3);
  runPhase(s, c, phase, 16);

  c.on('lp-abi-dispatch-build-0', () =>
    s.play(showGateHit.to(1, { duration: remainDuration(c, 'lp-abi-dispatch-build-0', 0.5) })),
  );
  c.on('lp-abi-dispatch-build-1', () => {
    s.play(par(showShape.to(0, { duration: 0.2 }), delay(showHW.to(1, { duration: 0.28 }), 0.22)));
  });
  c.on('lp-abi-dispatch-build-2', () => {
    s.play(par(showHW.to(0, { duration: 0.2 }), delay(showTF32.to(1, { duration: 0.28 }), 0.22)));
  });
}
