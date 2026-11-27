// Scene 25: Account for scales and move the right memory pages: Double quantization (0.5 -> 0.127 b/w, 3.03 GB saved) + CUDA managed optimizer paging.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  NESTED_QUANT,
  arrow,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function nestedPaging(s, c) {
  const showDoubleQ = s.value(1);
  const showNestedFormula = s.value(0);
  const showStage2 = s.value(0);
  const showSavings = s.value(0);
  const showPaging = s.value(0);
  const migrateProg = s.value(0);

  const bgAura = aura(0, 10, 620, '#ffd1661c', '#5ce1e61a');
  const title = heroTitle(['Double Quantization', 'and Paged Optimizers'], {
    x: -855,
    y: -420,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'QLORA MEMORY ENGINEERING',
  });

  const eq = glowTex(
    String.raw`\frac{8}{64} + \frac{32}{64 \times 256} \approx 0.127\text{ bits/weight}`,
    {
      x: 410,
      y: -365,
      size: 32,
      color: COSMOS.cyan,
    },
  );

  // Part 1: Double quantization hierarchy
  const partDoubleQ = guardedDynamic(showDoubleQ, (a) => {
    const nf = showNestedFormula.value;
    const sv = showSavings.value;

    const nodes = [
      // Level 1: 64-weight block
      glassCell(-615, -75, 420, 290, COSMOS.blue, { fill: '#101d35', glow: 7, opacity: a }),
      txt('64 WEIGHTS / BLOCK', -615, -182, 26, COSMOS.blue, 'mono').opacity(a),
      txt('8 × 8 NF4 block', -615, -138, 26, COSMOS.muted, 'sans').opacity(a),

      arrow([-395, -75], [-290, -75], { stroke: COSMOS.blue, width: 4, tip: 12 }).opacity(a),

      // Level 2: Per-block scale -> 8-bit scale code
      glassCell(-100, -75, 360, 220, COSMOS.gold, { fill: '#221c10', glow: 9, opacity: a }),
      txt(
        nf > 0.3 ? '8-BIT SCALE CODE' : '32-BIT FP32 SCALE',
        -100,
        -126,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      txt(
        nf > 0.3 ? '8 / 64 = 0.125 b/w' : '32 / 64 = 0.5 b/w',
        -100,
        -56,
        32,
        COSMOS.ink,
        'mono',
      ).opacity(a),
      txt('1 scale per 64 weights', -100, -4, 26, COSMOS.muted, 'sans').opacity(a),

      arrow([90, -75], [195, -75], { stroke: COSMOS.gold, width: 4, tip: 12 }).opacity(
        Math.max(0.25, nf) * a,
      ),

      // Level 3: 256 scale codes -> 1 FP32 parent scale
      glassCell(515, -75, 620, 290, COSMOS.cyan, {
        fill: '#102235',
        glow: nf > 0.3 ? 10 : 3,
        opacity: Math.max(0.35, nf) * a,
      }),
      txt('256 SCALE CODES -> 1 FP32 PARENT', 515, -182, 26, COSMOS.cyan, 'mono').opacity(
        Math.max(0.35, nf) * a,
      ),
      txt('32 / (64 × 256) = 0.00195 b/w', 515, -96, 28, COSMOS.ink, 'mono').opacity(
        Math.max(0.35, nf) * a,
      ),
      txt('bnb retains 8-bit codebook + offset', 515, -34, 26, COSMOS.muted, 'sans').opacity(
        Math.max(0.35, showStage2.value) * a,
      ),
      txt('Total = 0.12695 bits/weight', 515, 24, 30, COSMOS.cyan, 'mono').opacity(
        Math.max(0.35, nf) * a,
      ),

      // Bottom savings ledger
      glassCell(0, 275, 1660, 200, sv > 0.3 ? COSMOS.emerald : COSMOS.gold, {
        fill: '#10182d',
        glow: sv > 0.3 ? 10 : 5,
        opacity: a,
      }),
      txt(
        `ORDINARY: ${NESTED_QUANT.ordinaryBits} bits/w   ->   NESTED: ${NESTED_QUANT.nestedBits.toFixed(6)} bits/w`,
        0,
        228,
        30,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      txt(
        sv > 0.3
          ? `On 65B weights: saves ≈ ${NESTED_QUANT.savedGB.toFixed(2)} decimal GB of scale metadata`
          : 'Pack values, scale codes, centering offset, and parent scales together',
        0,
        296,
        32,
        sv > 0.3 ? COSMOS.emerald : COSMOS.ink,
        'mono',
      )
        .glow(sv > 0.3 ? 7 : 0, COSMOS.emerald)
        .opacity(a),
    ];

    // 8x4 mini grid preview inside 64-weight block
    for (let i = 0; i < 32; i++) {
      const gx = -745 + (i % 8) * 37;
      const gy = -90 + Math.floor(i / 8) * 34;
      nodes.push(
        rect(26, 24, { fill: '#2a4d8f', stroke: COSMOS.blue, width: 1, radius: 3 })
          .at(gx, gy)
          .opacity(0.85 * a),
      );
    }

    return group(...nodes);
  });

  // Part 2: CUDA Managed Memory Optimizer Paging (GPU <-> Host)
  const partPaging = guardedDynamic(showPaging, (a) => {
    const mp = migrateProg.value;

    const nodes = [
      // Left: GPU VRAM pool
      glassCell(-445, 25, 760, 420, COSMOS.blue, { fill: '#101b34', glow: 8, opacity: a }),
      txt('GPU VRAM (RESIDENT)', -445, -148, 28, COSMOS.blue, 'mono').opacity(a),
      glassCell(-635, 40, 310, 275, COSMOS.blue, { fill: '#152b54', glow: 6, opacity: a }),
      txt('4-bit Base', -635, 18, 30, COSMOS.blue, 'mono').opacity(a),
      txt('stays on GPU', -635, 66, 26, COSMOS.muted, 'sans').opacity(a),

      glassCell(-260, -68, 330, 112, COSMOS.rose, { fill: '#2c1424', glow: 8, opacity: a }),
      txt('Activations', -260, -88, 28, COSMOS.rose, 'mono').opacity(a),
      txt('spike fills VRAM', -260, -44, 26, COSMOS.muted, 'sans').opacity(a),

      // Right: Host CPU RAM pool
      glassCell(465, 25, 760, 420, COSMOS.cyan, { fill: '#102234', glow: 8, opacity: a }),
      txt('HOST CPU RAM (MANAGED PAGES)', 465, -148, 28, COSMOS.cyan, 'mono').opacity(a),
      txt('Paged back to GPU before optimizer.step()', 465, -82, 26, COSMOS.muted, 'sans').opacity(
        a,
      ),

      // Migration conduit
      arrow([-45, 108], [65, 108], { stroke: COSMOS.gold, width: 5, tip: 14 })
        .glow(10, COSMOS.gold)
        .opacity(a),
    ];

    // 4 yellow optimizer state pages migrating across GPU -> Host
    for (let i = 0; i < 4; i++) {
      const localP = Math.max(0, Math.min(1, mp * 2.2 - i * 0.25));
      const x = -260 + localP * 680;
      const y = 32 + i * 48;
      nodes.push(
        rect(200, 42, { fill: COSMOS.gold, stroke: '#ffffff', width: 1.2, radius: 6 })
          .at(x, y)
          .glow(9, COSMOS.gold)
          .opacity(a),
        txt(`opt page m${i + 1}`, x, y, 26, '#070910', 'mono').opacity(a),
      );
    }

    nodes.push(
      glassCell(0, 355, 1660, 118, COSMOS.emerald, { fill: '#0e2428', glow: 8, opacity: a }),
      glowDot(-785, 355, { radius: 7, color: COSMOS.gold, opacity: a }),
      txt(
        'CUDA unified memory migrates optimizer pages on spike · base weights & activations stay on GPU',
        10,
        355,
        28,
        COSMOS.ink,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eq, partDoubleQ, partPaging);

  c.on('nested-paging-1', () => s.play(showDoubleQ.to(1, { duration: 0.2 })));
  c.on('nested-formula', () => s.play(showNestedFormula.to(1, { duration: 0.5 })));
  c.on('nested-paging-2', () => s.play(showStage2.to(1, { duration: 0.35 })));
  c.on('nested-savings', () => s.play(showSavings.to(1, { duration: 0.45 })));
  c.on('nested-paging-3', () => {
    s.play(
      par(showDoubleQ.to(0, { duration: 0.16 }), delay(showPaging.to(1, { duration: 0.2 }), 0.16)),
    );
  });
  c.on('optimizer-migrate', () =>
    s.play(migrateProg.to(1, { duration: remainDuration(c, 'optimizer-migrate', 1.4) })),
  );
}
