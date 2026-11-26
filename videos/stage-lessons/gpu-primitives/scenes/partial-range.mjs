// Scene 08: A valid final total cannot repair an invalid partial. Int64 overflow, FP32 ULP=8 ruler, repeatability vs accuracy.
import {
  COSMOS,
  FP32_1E8_EXACT,
  FP32_1E8_LOST,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  swapViews,
  txt,
} from '../parts.mjs';

export default function partialRange(s, c) {
  const phase = s.value(0);

  const showBeat0 = s.value(1);
  const showFinalValid = s.value(0);
  const showOverflow = s.value(0);

  const showBeat1 = s.value(0);
  const showLostZero = s.value(0);
  const showExactOne = s.value(0);

  const showBeat2 = s.value(0);
  const showAccuracy = s.value(0);
  const showRepeatClaim = s.value(0);

  const bgAura = aura(0, 20, 620, '#ff6b8b1e', '#5ce1e61a');

  // Beat 0: Signed int64 partial overflow [MAX, 1, -1, 0]
  const beat0 = guardedDynamic(showBeat0, (a) => {
    const fin = showFinalValid.value;
    const ovf = showOverflow.value;
    const p = phase.value;
    const pulse = 0.65 + 0.35 * Math.sin(p * 4.2);

    const inputs = ['MAX', '+1', '−1', '0'];
    const xs = [-570, -190, 190, 570];

    const nodes = [
      heroTitle(['Signed int64', 'Partial Overflow'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.rose,
        eyebrow: 'EVERY INTERMEDIATE PARTIAL MUST FIT',
      }).opacity(a),
    ];

    inputs.forEach((lbl, i) => {
      const col = i < 2 && ovf > 0.5 ? COSMOS.rose : COSMOS.blue;
      nodes.push(
        glassCell(xs[i], -155, 250, 94, col, {
          fill: i < 2 && ovf > 0.5 ? '#28101c' : '#101d38',
          glow: 7,
          opacity: a,
        }),
        txt(lbl, xs[i], -155, 42, col, 'mono').opacity(a),
      );
    });

    if (fin > 0.02) {
      nodes.push(
        glassCell(460, -355, 560, 82, COSMOS.emerald, {
          fill: '#0c2422',
          glow: 8,
          opacity: fin * a,
        }),
        txt('Exact final sum = MAX (valid)', 460, -355, 28, COSMOS.emerald, 'mono').opacity(
          fin * a,
        ),
      );
    }

    if (ovf > 0.02) {
      nodes.push(
        glowingArc([xs[0], -102], [-380, 52], 14, {
          color: COSMOS.rose,
          width: 4,
          opacity: ovf * a,
          core: false,
        }),
        glowingArc([xs[1], -102], [-380, 52], 14, {
          color: COSMOS.rose,
          width: 4,
          opacity: ovf * a,
          core: false,
        }),
        glassCell(-415, 120, 740, 134, COSMOS.rose, {
          fill: '#2c101d',
          glow: 12 * pulse,
          opacity: ovf * a,
        }),
        txt('MAX + 1 = 2⁶³', -415, 90, 42, COSMOS.rose, 'mono')
          .glow(8, COSMOS.rose)
          .opacity(ovf * a),
        txt('OUTSIDE INT64 · REJECTED HERE', -415, 148, 26, COSMOS.gold, 'mono').opacity(ovf * a),

        glassCell(415, 120, 740, 134, COSMOS.dim, {
          fill: '#111626',
          dash: [8, 6],
          glow: 0,
          opacity: ovf * a,
        }),
        txt('−1 arrives too late', 415, 92, 34, COSMOS.muted, 'sans').opacity(ovf * a),
        txt('Inputs in [−9, 9] → |partial| ≤ 9N', 415, 148, 26, COSMOS.cyan, 'mono').opacity(
          ovf * a,
        ),
      );
    }

    nodes.push(
      glassCell(0, 365, 1460, 82, COSMOS.gold, { fill: '#181611', glow: 8, opacity: a }),
      txt(
        'A valid final sum cannot repair an overflowing earlier tree partial',
        0,
        365,
        29,
        COSMOS.gold,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Beat 1: FP32 ULP=8 ruler near 10^8 + dual trees
  const beat1 = guardedDynamic(showBeat1, (a) => {
    const zr = showLostZero.value;
    const on = showExactOne.value;
    const p = phase.value;
    const u = (p * 0.8) % 1;

    const rLeft = -620;
    const rRight = 620;
    const rY = -140;
    const rMid = (rLeft + rRight) * 0.5;
    const oneX = rLeft + (rRight - rLeft) * (1 / 8);

    const nodes = [
      heroTitle(['Float32 ULP = 8', 'at 100,000,000'], {
        x: -855,
        y: -420,
        size: 52,
        lineHeight: 62,
        accent: COSMOS.gold,
        eyebrow: 'NEIGHBORING FLOAT32 VALUES ARE 8 APART',
      }).opacity(a),

      // ULP number line ruler
      rect((rRight - rLeft) * 0.5, 42, { fill: '#351726', stroke: null, radius: 6 })
        .at((rLeft + rMid) * 0.5, rY)
        .opacity(0.75 * a),
      line([rLeft, rY], [rRight, rY], { stroke: COSMOS.cyan, width: 4 }).opacity(a),
      line([rLeft, rY - 26], [rLeft, rY + 26], { stroke: COSMOS.blue, width: 4 }).opacity(a),
      line([rMid, rY - 20], [rMid, rY + 20], {
        stroke: COSMOS.gold,
        width: 3,
        dash: [6, 5],
      }).opacity(a),
      line([rRight, rY - 26], [rRight, rY + 26], { stroke: COSMOS.blue, width: 4 }).opacity(a),

      txt('10⁸', rLeft, rY - 52, 30, COSMOS.blue, 'mono').opacity(a),
      txt('midpoint +4.0', rMid, rY - 52, 26, COSMOS.gold, 'mono').opacity(a),
      txt('10⁸ + 8', rRight, rY - 52, 30, COSMOS.blue, 'mono').opacity(a),

      // +1 dot snapping back to 10^8
      glowDot(oneX - (oneX - rLeft) * (zr > 0.5 ? u : 0), rY, {
        radius: 9,
        color: COSMOS.rose,
        opacity: a,
      }),
      txt('10⁸ + 1 snaps back to 10⁸', rLeft + 260, rY + 52, 26, COSMOS.rose, 'mono').opacity(a),

      // Left tree: (10^8 + 1) - 10^8 -> 0
      glassCell(-430, 145, 720, 210, COSMOS.rose, { fill: '#22101a', glow: 9, opacity: a }),
      txt('LEFT TREE: (10⁸ + 1) − 10⁸', -430, 82, 28, COSMOS.muted, 'mono').opacity(a),
      txt(`10⁸ − 10⁸ = ${FP32_1E8_LOST}`, -430, 158, 40, COSMOS.rose, 'mono')
        .glow(7, COSMOS.rose)
        .opacity(a),
      txt('100% error vs exact sum', -430, 218, 26, COSMOS.rose, 'sans').opacity(a),

      // Right tree: (10^8 - 10^8) + 1 -> 1
      glassCell(430, 145, 720, 210, on > 0.5 ? COSMOS.emerald : COSMOS.cyan, {
        fill: on > 0.5 ? '#0d2624' : '#101d35',
        glow: 9,
        opacity: a,
      }),
      txt('RIGHT TREE: (10⁸ − 10⁸) + 1', 430, 82, 28, COSMOS.muted, 'mono').opacity(a),
      txt(
        on > 0.5 ? `0 + 1 = ${FP32_1E8_EXACT}` : 'Cancel large pair first',
        430,
        158,
        40,
        on > 0.5 ? COSMOS.emerald : COSMOS.cyan,
        'mono',
      )
        .glow(7, on > 0.5 ? COSMOS.emerald : COSMOS.cyan)
        .opacity(a),
      txt('Exact sum preserved', 430, 218, 26, COSMOS.emerald, 'sans').opacity(a),

      glassCell(0, 365, 1480, 82, COSMOS.cyan, { fill: '#0e1a2e', glow: 8, opacity: a }),
      txt(
        'Both trees are race-free · Fixed tree order keeps bits stable even across finish orders',
        0,
        365,
        28,
        COSMOS.cyan,
        'sans',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  // Beat 2: Repeatability vs Accuracy
  const beat2 = guardedDynamic(showBeat2, (a) => {
    const acc = showAccuracy.value;
    const rep = showRepeatClaim.value;

    const nodes = [
      heroTitle(['Repeatability', 'vs Accuracy'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.cyan,
        eyebrow: 'TWO INDEPENDENT AXES · VERIFY BOTH',
      }).opacity(a),

      // Left axis: Bitwise repeatability (3 identical runs of 0x00000000)
      glassCell(-430, 20, 740, 396, COSMOS.cyan, { fill: '#0e1c30', glow: 9, opacity: a }),
      txt('BITWISE REPEATABILITY', -430, -135, 28, COSMOS.cyan, 'mono').opacity(a),
      ...[0, 1, 2].map((i) => {
        const y = -66 + i * 80;
        return group(
          glassCell(-430, y, 560, 62, COSMOS.cyan, { fill: '#122640', glow: 5, opacity: a }),
          txt(`Run ${i + 1}:   0x00000000   (0.0)`, -430, y, 28, COSMOS.ink, 'mono').opacity(a),
        );
      }),
      txt('IDENTICAL BITS × 3 RUNS', -430, 178, 28, COSMOS.cyan, 'mono')
        .glow(6, COSMOS.cyan)
        .opacity(a),

      // Right axis: Accuracy vs reference 1.0
      glassCell(430, 20, 740, 380, COSMOS.rose, { fill: '#22101a', glow: 9, opacity: a }),
      txt('NUMERICAL ACCURACY', 430, -122, 28, COSMOS.rose, 'mono').opacity(a),
      txt('Returned: 0.0   vs   Reference: 1.0', 430, -28, 30, COSMOS.ink, 'mono').opacity(a),
      txt('|0 − 1| = 1.0', 430, 68, 62, COSMOS.rose, 'mono')
        .glow(10, COSMOS.rose)
        .opacity(Math.max(0.35, acc) * a),
      txt('FIXED TREE REPEATS AN INACCURATE ZERO', 430, 175, 26, COSMOS.gold, 'mono').opacity(
        Math.max(0.35, rep) * a,
      ),

      glassCell(0, 355, 1540, 86, COSMOS.gold, { fill: '#181611', glow: 9, opacity: a }),
      txt(
        'Check installed CUB release, GPU & build · DeviceReduce & DeviceScan have separate defaults',
        0,
        355,
        27,
        COSMOS.gold,
        'sans',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  s.add(bgAura, beat0, beat1, beat2);
  runPhase(s, c, phase, 14);

  c.on('range-final', () => s.play(showFinalValid.to(1, { duration: 0.4 })));
  c.on('partial-range-step-1', () => s.play(showOverflow.to(1, { duration: 0.45 })));

  c.on('range-zero', () => {
    swapViews(s, showBeat0, showBeat1, 0.16, 0.22);
    s.play(showLostZero.to(1, { duration: 0.45 }));
  });
  c.on('partial-range-step-2', () => s.play(showExactOne.to(1, { duration: 0.45 })));

  c.on('range-reference', () => {
    swapViews(s, showBeat1, showBeat2, 0.16, 0.22);
    s.play(showAccuracy.to(1, { duration: 0.45 }));
  });
  c.on('partial-range-step-3', () =>
    s.play(showRepeatClaim.to(1, { duration: remainDuration(c, 'partial-range-step-3', 0.45) })),
  );
}
