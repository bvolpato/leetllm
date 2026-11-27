// Scene 15: What throughput would those bytes allow? Log-log roofline (200 TFLOP/s, 1 TB/s, knee 200) + 10 FLOP/B -> 10 TFLOP/s.
import {
  COSMOS,
  REG_1X4,
  ROLE,
  aura,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function rooflineCheck(s, c) {
  const demandFocus = s.value(0);
  const showPlot = s.value(0);
  const showKnee = s.value(0);
  const showPoint = s.value(0);
  const showResult = s.value(0);
  const showTiming = s.value(0);

  const bgAura = aura(150, -20, 620, '#5ce1e61e', '#ffd16618');
  const title = heroTitle(['What Throughput Would', 'Those Bytes Allow?'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.c,
    eyebrow: 'HARDWARE ROOFLINE & TIMING',
  });

  // Log-log mapping: AI in [1, 1000] -> x in [-160, 740]; TFLOP/s in [1, 400] -> y in [220, -280]
  const mapAI = (ai) => -160 + (Math.log10(ai) / 3) * 900;
  const mapTF = (tf) => 220 - (Math.log10(tf) / Math.log10(400)) * 500;

  const kneeX = mapAI(200);
  const kneeY = mapTF(200);
  const ptX = mapAI(10);
  const ptY = mapTF(10);

  const slopePts = [
    [mapAI(1), mapTF(1)],
    [kneeX, kneeY],
  ];
  const flatPts = [
    [kneeX, kneeY],
    [mapAI(1000), kneeY],
  ];

  const live = guardedDynamic(1, () => {
    const sp = showPlot.value;
    const sk = showKnee.value;
    const pt = showPoint.value;
    const sr = showResult.value;
    const st = showTiming.value;

    const nodes = [
      // Left side: Operand demand vs Missing HBM bytes (Beat 1 prediction setup!)
      txt('THREAD OPERAND COUNT', -855, -185, 26, ROLE.a, 'mono', 'left'),
      glassCell(-625, -100, 460, 96, demandFocus.value > 0.5 ? COSMOS.gold : ROLE.a, {
        fill: '#101d38',
        glow: demandFocus.value > 0.5 ? 11 : 7,
      }),
      txt(
        `${REG_1X4.flops} FLOPs / ${REG_1X4.bytes} B = ${REG_1X4.ratio.toFixed(1)} FLOP/B`,
        -625,
        -100,
        28,
        COSMOS.ink,
        'mono',
      ),

      txt('MEASURED HBM BYTES', -855, 18, 26, sp > 0.5 ? ROLE.good : COSMOS.amber, 'mono', 'left'),
      glassCell(-625, 102, 460, 96, sp > 0.5 ? ROLE.good : COSMOS.amber, {
        fill: sp > 0.5 ? '#0e2824' : '#261b10',
        dash: sp > 0.5 ? undefined : [8, 6],
        glow: 7,
      }),
      txt(
        sp > 0.5 ? 'Measure HBM bytes' : '?  (not yet measured)',
        -625,
        102,
        26,
        sp > 0.5 ? ROLE.good : COSMOS.amber,
        'mono',
      ),
    ];

    // Log-log axes always present on right (faint waiting frame until boundary illuminates the roof)
    nodes.push(
      line([-160, 220], [760, 220], { stroke: COSMOS.muted, width: 2.5 }).opacity(0.45 + 0.55 * sp),
      line([-160, 220], [-160, -300], { stroke: COSMOS.muted, width: 2.5 }).opacity(
        0.45 + 0.55 * sp,
      ),
      txt('HBM Arithmetic Intensity (FLOP / B)', 300, 282, 26, COSMOS.muted, 'mono').opacity(
        0.55 + 0.45 * sp,
      ),
      txt('TFLOP/s', -160, -328, 26, COSMOS.muted, 'mono').opacity(0.55 + 0.45 * sp),
    );
    for (const ai of [1, 10, 100, 1000]) {
      const ax = mapAI(ai);
      nodes.push(
        line([ax, 214], [ax, 228], { stroke: COSMOS.muted, width: 2 }).opacity(0.45 + 0.55 * sp),
        txt(String(ai), ax, 248, 26, COSMOS.muted, 'mono').opacity(0.45 + 0.55 * sp),
      );
    }
    if (sp < 0.01) {
      nodes.push(
        txt('ROOFLINE PLOT', 300, -110, 34, COSMOS.cyan, 'mono').opacity(0.75),
        txt(
          'Needs measured HBM bytes to locate X coordinate',
          300,
          -45,
          28,
          COSMOS.amber,
          'sans',
        ).opacity(0.9),
      );
    }

    if (sp > 0.05) {
      nodes.push(
        // Roofline glowing trails
        glowingTrail(slopePts, { color: ROLE.c, width: 4.5, glow: 10, opacity: 0.94 * sp }),
        glowingTrail(flatPts, { color: COSMOS.gold, width: 4.5, glow: 10, opacity: 0.94 * sp }),
        txt('1 TB/s slope', mapAI(18), mapTF(48), 26, ROLE.c, 'mono').opacity(sp),
        txt('200 TFLOP/s compute ceiling', mapAI(260), kneeY - 36, 26, COSMOS.gold, 'mono').opacity(
          sp,
        ),
      );
    }

    if (sk > 0.02) {
      nodes.push(
        line([kneeX, kneeY], [kneeX, 220], {
          stroke: COSMOS.gold,
          width: 2.2,
          dash: [8, 6],
        }).opacity(0.7 * sk),
        glowDot(kneeX, kneeY, { radius: 9, color: COSMOS.gold, glow: 12, opacity: sk }),
        txt('knee: 200', kneeX + 18, kneeY + 42, 26, COSMOS.gold, 'mono', 'left').opacity(sk),
      );
    }

    if (pt > 0.02) {
      nodes.push(
        line([ptX, 220], [ptX, ptY], { stroke: ROLE.good, width: 2.5, dash: [8, 6] }).opacity(pt),
        glowDot(ptX, ptY, { radius: 10, color: ROLE.good, glow: 14, opacity: pt }),
        txt('AI = 10', ptX + 20, ptY + 40, 26, ROLE.good, 'mono', 'left').opacity(pt),
      );
    }

    if (sr > 0.02) {
      nodes.push(
        line([-160, ptY], [ptX, ptY], { stroke: ROLE.good, width: 2.5, dash: [8, 6] }).opacity(sr),
        txt('10 TFLOP/s ceiling', ptX + 26, ptY + 86, 28, ROLE.good, 'mono', 'left')
          .glow(6, ROLE.good)
          .opacity(sr),
      );
    }

    if (st > 0.02) {
      nodes.push(
        txt(
          'Correctness (nonsymmetric) → Warmup → CUDA events in 1 stream → Sync → Hardware counters',
          0,
          392,
          26,
          COSMOS.gold,
          'mono',
        )
          .glow(5, COSMOS.gold)
          .opacity(st),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('thread-demand', () =>
    s.play(demandFocus.to(1, { duration: remainDuration(c, 'thread-demand', 0.45) })),
  );
  c.on('boundary', () => s.play(showPlot.to(1, { duration: remainDuration(c, 'boundary', 0.5) })));
  c.on('roofline-knee', () =>
    s.play(showKnee.to(1, { duration: remainDuration(c, 'roofline-knee', 0.45) })),
  );
  c.on('roofline-point', () =>
    s.play(showPoint.to(1, { duration: remainDuration(c, 'roofline-point', 0.45) })),
  );
  c.after('roofline-result', () =>
    s.play(showResult.to(1, { duration: remainDuration(c, 'roofline-result', 0.45) })),
  );
  c.on('timing', () => s.play(showTiming.to(1, { duration: remainDuration(c, 'timing', 0.5) })));
}
