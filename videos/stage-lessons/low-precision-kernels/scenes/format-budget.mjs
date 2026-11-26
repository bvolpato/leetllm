// Scene 03: What fits in the byte? Bit-field strips (FP32/TF32/BF16/FP16/E4M3/E5M2), [1,2] spacing, and OCP vs FNUZ.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  LAYERNORM_SPIKE,
  aura,
  bitStrip8,
  decode8,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

const FORMAT_ROWS = [
  { name: 'FP32', s: 1, e: 8, m: 23, bias: '127', max: '3.4e38', role: 'reference / accum' },
  { name: 'TF32*', s: 1, e: 8, m: 10, bias: '127', max: '3.4e38', role: '32b store, 10m MMA' },
  { name: 'BF16', s: 1, e: 8, m: 7, bias: '127', max: '3.4e38', role: 'wide 16-bit' },
  { name: 'FP16', s: 1, e: 5, m: 10, bias: '15', max: '65,504', role: 'fine 16-bit' },
  { name: 'E4M3', s: 1, e: 4, m: 3, bias: '7', max: '448', role: 'forward FP8' },
  { name: 'E5M2', s: 1, e: 5, m: 2, bias: '15', max: '57,344', role: 'gradient FP8' },
];

export default function formatBudget(s, c) {
  const phase = s.value(0);
  const showPartA = s.value(1);
  const show16 = s.value(0.4);
  const show8 = s.value(0);
  const showLimits = s.value(0);

  const showPartB = s.value(0);
  const showSpacing = s.value(0);
  const showNorm = s.value(0);

  const showPartC = s.value(0);
  const showBiasDiff = s.value(0);

  const bgAura = aura(120, 0, 620, '#60a5fa20', '#5ce1e616');
  const title = heroTitle(['What Fits', 'in the Byte?'], {
    x: -855,
    y: -420,
    size: 58,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'FORMAT BUDGET · SIGN · EXPONENT · FRACTION',
  });

  // Part A: Aligned proportional bit-field strips (Beats 0-1)
  const partA = guardedDynamic(showPartA, (a) => {
    const p = phase.value;
    const s16 = show16.value;
    const s8 = show8.value;
    const lim = showLimits.value;
    const unitW = 24; // 32 bits = 768 px
    const barX0 = -470;
    const nodes = [
      // Legend top-right
      rect(22, 22, { fill: COSMOS.rose, stroke: null, radius: 4 }).at(120, -370).opacity(a),
      txt('Sign', 146, -370, 26, COSMOS.rose, 'mono', 'left').opacity(a),
      rect(22, 22, { fill: COSMOS.blue, stroke: null, radius: 4 }).at(285, -370).opacity(a),
      txt('Exponent (range)', 311, -370, 26, COSMOS.blue, 'mono', 'left').opacity(a),
      rect(22, 22, { fill: COSMOS.cyan, stroke: null, radius: 4 }).at(635, -370).opacity(a),
      txt('Fraction', 661, -370, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
    ];

    FORMAT_ROWS.forEach((f, idx) => {
      const y = -190 + idx * 102;
      const is8 = idx >= 4;
      const vis = is8 ? Math.max(0.22, s8) : Math.max(0.45, s16);
      const op = vis * a;
      const wS = f.s * unitW;
      const wE = f.e * unitW;
      const wM = f.m * unitW;
      const isHighlight = is8 && lim > 0.5;

      nodes.push(
        txt(f.name, -855, y, 30, isHighlight ? COSMOS.gold : COSMOS.ink, 'mono', 'left').opacity(
          op,
        ),
        txt(`${f.s}/${f.e}/${f.m}`, -675, y, 26, COSMOS.muted, 'mono', 'left').opacity(op),
        // Sign segment
        rect(wS - 2, 46, { fill: COSMOS.rose, stroke: '#ffffff', width: 1, radius: 4 })
          .at(barX0 + wS * 0.5, y)
          .opacity(op * 0.9),
        // Exponent segment
        rect(wE - 2, 46, { fill: COSMOS.blue, stroke: '#ffffff', width: 1, radius: 4 })
          .at(barX0 + wS + wE * 0.5, y)
          .glow(isHighlight ? 8 : 3, COSMOS.blue)
          .opacity(op * 0.92),
        // Fraction segment
        rect(wM - 2, 46, { fill: COSMOS.cyan, stroke: '#ffffff', width: 1, radius: 4 })
          .at(barX0 + wS + wE + wM * 0.5, y)
          .glow(isHighlight ? 8 : 3, COSMOS.cyan)
          .opacity(op * 0.9),
      );
      if (f.name === 'TF32*') {
        const padW = 13 * unitW;
        nodes.push(
          rect(padW - 2, 46, {
            fill: '#12182b',
            stroke: COSMOS.dim,
            width: 1.4,
            radius: 4,
            dash: [6, 5],
          })
            .at(barX0 + wS + wE + wM + padW * 0.5, y)
            .opacity(op * 0.85),
        );
      }
      nodes.push(
        txt(`max ${f.max}`, 360, y, 28, isHighlight ? COSMOS.gold : COSMOS.ink, 'mono', 'left')
          .glow(isHighlight ? 6 : 0, COSMOS.gold)
          .opacity(op),
        txt(f.role, 610, y, 26, COSMOS.muted, 'sans', 'left').opacity(op),
      );
    });

    const scanX = barX0 + ((p * 0.28) % 1) * (32 * unitW);
    nodes.push(
      line([scanX, -225], [scanX, 355], { stroke: COSMOS.cyan, width: 1.6 })
        .opacity(0.28 * a)
        .set('blend', 'screen'),
    );
    return group(...nodes);
  });

  // Part B: [1, 2] representable spacing + LayerNorm spike (Beat 2)
  const spacingEq = glowTex(String.raw`\Delta = \frac{2^e}{2^m}`, {
    x: 615,
    y: -285,
    size: 40,
    color: COSMOS.gold,
  });

  const partB = guardedDynamic(showPartB, (a) => {
    const sp = showSpacing.value;
    const nm = showNorm.value;
    const p = phase.value;
    const rx0 = -760;
    const rx1 = 280;
    const mapX = (v) => rx0 + (v - 1) * (rx1 - rx0);

    const nodes = [
      // E4M3 ruler (8 spaces)
      txt(
        'E4M3 IN [1, 2] · 3 FRACTION BITS · 8 SPACES',
        rx0,
        -165,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      line([rx0, -95], [rx1, -95], { stroke: COSMOS.cyan, width: 3.2 }).opacity(a),
      // E5M2 ruler (4 spaces)
      txt(
        'E5M2 IN [1, 2] · 2 FRACTION BITS · 4 SPACES',
        rx0,
        45,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(a),
      line([rx0, 115], [rx1, 115], { stroke: COSMOS.gold, width: 3.2 }).opacity(a),
    ];

    for (let i = 0; i <= 8; i++) {
      const v = 1 + i / 8;
      const tx = mapX(v);
      nodes.push(
        line([tx, -114], [tx, -76], { stroke: COSMOS.cyan, width: 2.8 }).opacity(a),
        glowDot(tx, -95, { radius: 5, color: COSMOS.cyan, opacity: a }),
      );
      if (i % 2 === 0) {
        nodes.push(txt(v.toFixed(2), tx, -44, 26, COSMOS.muted, 'mono').opacity(a));
      }
    }
    for (let i = 0; i <= 4; i++) {
      const v = 1 + i / 4;
      const tx = mapX(v);
      nodes.push(
        line([tx, 96], [tx, 134], { stroke: COSMOS.gold, width: 2.8 }).opacity(a),
        glowDot(tx, 115, { radius: 5.5, color: COSMOS.gold, opacity: a }),
        txt(v.toFixed(2), tx, 166, 26, COSMOS.muted, 'mono').opacity(a),
      );
    }

    if (sp > 0.02) {
      nodes.push(
        glassCell(580, -95, 430, 94, COSMOS.cyan, { fill: '#0e1d2e', glow: 8, opacity: sp * a }),
        txt('E4M3 step = 1/8 = 0.125', 580, -95, 28, COSMOS.cyan, 'mono').opacity(sp * a),
        glassCell(580, 115, 430, 94, COSMOS.gold, { fill: '#1d1912', glow: 8, opacity: sp * a }),
        txt('E5M2 step = 1/4 = 0.250', 580, 115, 28, COSMOS.gold, 'mono').opacity(sp * a),
      );
    }

    if (nm > 0.02) {
      nodes.push(
        glassCell(0, 345, 1640, 134, COSMOS.amber, { fill: '#1b1420', glow: 8, opacity: nm * a }),
        txt(
          'LAYERNORM SPIKE EXAMPLE (1 NONZERO IN 1,024 · ε = 0)',
          -780,
          312,
          26,
          COSMOS.amber,
          'mono',
          'left',
        ).opacity(nm * a),
        txt(
          `Normalized magnitude = √1023 ≈ ${LAYERNORM_SPIKE.toFixed(2)} (about 32): even normalized activations span wide ranges`,
          -780,
          368,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(nm * a),
      );
    }

    const probeU = 0.5 + 0.45 * Math.sin(p * 1.4);
    nodes.push(glowDot(mapX(1 + probeU), -95, { radius: 7, color: '#ffffff', opacity: a }));

    return group(...nodes);
  });

  // Part C: OCP vs FNUZ on raw bytes 0x38 and 0x80 (Beat 3)
  const partC = guardedDynamic(showPartC, (a) => {
    const bd = showBiasDiff.value;
    const ocp38 = decode8(0x38, 'ocp');
    const fnuz38 = decode8(0x38, 'fnuz');
    const nodes = [
      txt('BYTE 0x38 · EXP = 7 · FRAC = 0', -440, -165, 26, COSMOS.cyan, 'mono').opacity(a),
      bitStrip8(0x38, -440, -82, {
        cellW: 58,
        cellH: 56,
        gap: 6,
        mode: 'e4m3',
        highlightIndices: [1, 2, 3, 4],
        opacity: a,
      }),
      glassCell(-640, 125, 340, 140, COSMOS.cyan, { fill: '#0f2033', glow: 8, opacity: a }),
      txt('OCP (bias 7)', -640, 86, 26, COSMOS.muted, 'mono').opacity(a),
      txt(`2^(7-7) = ${ocp38}`, -640, 148, 36, COSMOS.cyan, 'mono').glow(6, COSMOS.cyan).opacity(a),
      glassCell(-240, 125, 340, 140, COSMOS.amber, { fill: '#221814', glow: 8, opacity: a }),
      txt('FNUZ (bias 8)', -240, 86, 26, COSMOS.muted, 'mono').opacity(a),
      txt(`2^(7-8) = ${fnuz38}`, -240, 148, 36, COSMOS.amber, 'mono')
        .glow(6, COSMOS.amber)
        .opacity(a),

      // 0x80 comparison on the right
      txt('BYTE 0x80 · SIGN = 1 · REST = 0', 440, -165, 26, COSMOS.rose, 'mono').opacity(
        0.3 + 0.7 * bd * a,
      ),
      bitStrip8(0x80, 440, -82, {
        cellW: 58,
        cellH: 56,
        gap: 6,
        mode: 'e4m3',
        highlightIndices: [0],
        opacity: 0.3 + 0.7 * bd * a,
      }),
      glassCell(240, 125, 340, 140, COSMOS.cyan, {
        fill: '#0f2033',
        glow: 8,
        opacity: (0.25 + 0.75 * bd) * a,
      }),
      txt('OCP DECODER', 240, 86, 26, COSMOS.muted, 'mono').opacity((0.25 + 0.75 * bd) * a),
      txt('-0.0', 240, 148, 42, COSMOS.cyan, 'mono')
        .glow(6, COSMOS.cyan)
        .opacity((0.25 + 0.75 * bd) * a),
      glassCell(640, 125, 340, 140, COSMOS.rose, {
        fill: '#261120',
        glow: 9,
        opacity: (0.25 + 0.75 * bd) * a,
      }),
      txt('FNUZ DECODER', 640, 86, 26, COSMOS.muted, 'mono').opacity((0.25 + 0.75 * bd) * a),
      txt('NaN', 640, 148, 42, COSMOS.rose, 'mono')
        .glow(7, COSMOS.rose)
        .opacity((0.25 + 0.75 * bd) * a),

      txt('Value = (-1)^s × 2^(exp - bias) × (1 + frac / 8)', 0, 345, 30, COSMOS.gold, 'mono')
        .glow(5, COSMOS.gold)
        .opacity(a),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, partA, partB, partC);
  runPhase(s, c, phase, 16);

  c.on('lp-format-budget-build-0', () =>
    s.play(show16.to(1, { duration: remainDuration(c, 'lp-format-budget-build-0', 0.6) })),
  );
  c.on('lp-format-budget-build-1', () =>
    s.play(show8.to(1, { duration: remainDuration(c, 'lp-format-budget-build-1', 0.5) })),
  );
  c.on('lp-format-budget-limits', () =>
    s.play(showLimits.to(1, { duration: remainDuration(c, 'lp-format-budget-limits', 0.45) })),
  );

  c.on('lp-format-budget-build-2', () => {
    s.play(
      par(showPartA.to(0, { duration: 0.22 }), delay(showPartB.to(1, { duration: 0.28 }), 0.24)),
    );
  });
  c.show('lp-format-budget-build-2', [spacingEq], { fade: 0.25, lead: -0.26 });
  c.on('lp-format-budget-spacing', () =>
    s.play(showSpacing.to(1, { duration: remainDuration(c, 'lp-format-budget-spacing', 0.45) })),
  );
  c.on('lp-format-budget-norm', () =>
    s.play(showNorm.to(1, { duration: remainDuration(c, 'lp-format-budget-norm', 0.45) })),
  );

  c.on('lp-format-budget-build-3', () => {
    s.play(
      par(showPartB.to(0, { duration: 0.22 }), delay(showPartC.to(1, { duration: 0.28 }), 0.24)),
    );
  });
  c.hide('lp-format-budget-build-3', [spacingEq], { fade: 0.2 });
  c.on('lp-format-budget-bias', () =>
    s.play(showBiasDiff.to(1, { duration: remainDuration(c, 'lp-format-budget-bias', 0.45) })),
  );
}
