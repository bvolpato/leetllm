// Scene 10: Follow one small gradient through FP16.
// Log2 exponent highway (2^-26 .. 2^-18) showing unscaled collapse to 0, +8 exponent lift, FP32 recovery,
// and contrast with irreversible forward-pass rounding (1.0001 -> 1.0).
import {
  BOUNDARY_FIX,
  COSMOS,
  TRANSFER_TRACE_RESTORED,
  aura,
  fade,
  glowDot,
  glowTex,
  glowingArc,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const zeroCollapse = s.value(0);
  const scaleShift = s.value(0);
  const showScaleEq = s.value(0);
  const showStored = s.value(0);
  const unscaleShift = s.value(0);
  const showRecovered = s.value(0);
  const showFwdCast = s.value(0);
  const showFwdWarn = s.value(0);

  const bgAura = aura(0, -30, 680, '#6ee7b71e', '#ff6b8b14');

  const title = heroTitle(['One Gradient,', 'Through the Cast'], {
    x: -855,
    y: -445,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.emerald,
    eyebrow: 'LOG₂ EXPONENT HIGHWAY · FP16 SUBNORMAL',
  });

  // Log2 exponent axis: -26 to -18 across [-620, 720] (generous left margin for g = 2^-26)
  const axisY = -125;
  const xExp = (e) => -620 + ((e + 26) / 8) * 1340;
  const xHalfStep = xExp(-25);
  const xFirstSub = xExp(-24);

  const scaleTex = glowTex(String.raw`2^{-26} \times 256 = 2^{-18}`, {
    x: -360,
    y: 120,
    size: 40,
    color: COSMOS.emerald,
    glow: 7,
  }).opacity(0);
  const unscaleTex = glowTex(String.raw`2^{-18} \div 256 = 2^{-26}`, {
    x: 360,
    y: 120,
    size: 40,
    color: COSMOS.cyan,
    glow: 7,
  }).opacity(0);

  const live = guardedDynamic(1, () => {
    const zc = zeroCollapse.value;
    const sc = scaleShift.value;
    const st = showStored.value;
    const us = unscaleShift.value;
    const rc = showRecovered.value;
    const fc = showFwdCast.value;
    const fw = showFwdWarn.value;

    const nodes = [
      // Exponent highway rail
      line([-660, axisY], [760, axisY], { stroke: '#2c3e64', width: 4 }),
      // Rose half-step barrier at 2^-25 (ends cleanly above tick labels)
      line([xHalfStep, axisY - 102], [xHalfStep, axisY + 18], {
        stroke: COSMOS.rose,
        width: 4,
        dash: [8, 6],
      }).glow(8, COSMOS.rose),
      txt('2⁻²⁵ half-step', xHalfStep, axisY - 134, 26, COSMOS.rose, 'mono'),
      // First subnormal marker at 2^-24
      line([xFirstSub, axisY - 22], [xFirstSub, axisY + 18], {
        stroke: COSMOS.cyan,
        width: 5,
      }).glow(6, COSMOS.cyan),
      txt('first subnormal', xFirstSub, axisY + 92, 26, COSMOS.cyan, 'mono'),
    ];

    for (const e of [-26, -24, -22, -20, -18]) {
      const tx = xExp(e);
      nodes.push(
        line([tx, axisY - 12], [tx, axisY + 12], { stroke: COSMOS.muted, width: 3 }),
        txt(`2^(${e})`, tx, axisY + 46, 26, COSMOS.muted, 'mono'),
      );
    }

    // Active gradient photon position
    let curExp = -26;
    if (us > 0.01) {
      curExp = -18 - 8 * us;
    } else if (sc > 0.01) {
      curExp = -26 + 8 * sc;
    }
    const curX = xExp(curExp);

    // Original starting beacon at 2^-26 (label placed cleanly left of rail with generous gap)
    nodes.push(
      glowDot(xExp(-26), axisY, { radius: 9, color: COSMOS.blue, glow: 8, opacity: 0.75 }),
      txt('g = 2⁻²⁶', xExp(-26) - 66, axisY, 30, COSMOS.gold, 'mono', 'right').glow(6, COSMOS.gold),
    );

    // Beat 0: Unscaled cast result (strictly withheld until tiny-gradient!)
    if (sc < 0.05) {
      nodes.push(
        glowDot(curX, axisY, { radius: 13, color: zc > 0.5 ? COSMOS.rose : COSMOS.gold, glow: 15 }),
        txt(
          zc > 0.5
            ? 'Unscaled FP16 cast  →  0  (underflow!)'
            : 'Predict: what will FP16 store for g = 2⁻²⁶?',
          0,
          125,
          36,
          zc > 0.5 ? COSMOS.rose : COSMOS.gold,
          'sans',
        ).glow(7, zc > 0.5 ? COSMOS.rose : COSMOS.gold),
      );
    }

    // Beat 1: +8 exponent lift beam along clean upper track (zero text crossings!)
    if (sc > 0.02) {
      const arcEnd = xExp(-26 + 8 * sc);
      nodes.push(
        glowingTrail(
          [
            [xExp(-26), axisY - 56],
            [arcEnd, axisY - 56],
          ],
          { color: COSMOS.emerald, width: 5, glow: 11 },
        ),
        glowDot(arcEnd, axisY - 56, { radius: 8, color: COSMOS.emerald, glow: 12 }),
        glowDot(curX, axisY, { radius: 13, color: COSMOS.gold, glow: 15 }),
      );
      if (st > 0.05) {
        nodes.push(
          txt(
            `FP16 stored: ${TRANSFER_TRACE_RESTORED.stored.toExponential(2)}`,
            -360,
            190,
            30,
            COSMOS.emerald,
            'mono',
          )
            .glow(7, COSMOS.emerald)
            .opacity(st),
        );
      }
    }

    // Beat 2: FP32 unscale return beam routed cleanly below all labels
    if (us > 0.02) {
      const retEnd = xExp(-18 - 8 * us);
      nodes.push(
        glowingTrail(
          [
            [xExp(-18), 22],
            [retEnd, 22],
          ],
          { color: COSMOS.cyan, width: 5, glow: 11 },
        ),
        glowDot(retEnd, 22, { radius: 8, color: COSMOS.cyan, glow: 12 }),
      );
      if (rc > 0.05) {
        nodes.push(
          txt(
            `Recovered: ${TRANSFER_TRACE_RESTORED.recovered.toExponential(2)} (exact)`,
            360,
            190,
            30,
            COSMOS.cyan,
            'mono',
          )
            .glow(7, COSMOS.cyan)
            .opacity(rc),
        );
      }
    }

    // Persistent lower reference band during Beats 0-1 (prevents empty lower canvas before Beat 2 forward contrast)
    if (fc < 0.02) {
      nodes.push(
        line([-760, 268], [760, 268], { stroke: '#26304a', width: 2 }),
        txt('FP16 SUBNORMAL FLOOR', -640, 326, 26, COSMOS.muted, 'mono', 'left'),
        txt('2⁻²⁴  (≈ 5.96 × 10⁻⁸)', -640, 376, 30, COSMOS.cyan, 'mono', 'left'),
        txt('ROUND-TO-ZERO CLIFF', 160, 326, 26, COSMOS.muted, 'mono', 'left'),
        txt('2⁻²⁵  (half-step)', 160, 376, 30, COSMOS.rose, 'mono', 'left'),
      );
    }

    // Lower contrasting forward-pass channel (1.0001 -> 1.0 irreversibly lost)
    if (fc > 0.02) {
      const fy = 315;
      nodes.push(
        line([-820, 245], [820, 245], { stroke: '#26304a', width: 2 }).opacity(fc),
        txt('FORWARD INPUT', -780, fy - 24, 26, COSMOS.gold, 'mono', 'left').opacity(fc),
        txt(`${BOUNDARY_FIX.forward}`, -780, fy + 22, 36, COSMOS.gold, 'mono', 'left').opacity(fc),
        glowingTrail(
          [
            [-490, fy],
            [-90, fy],
          ],
          { color: COSMOS.rose, width: 4.5, glow: 9, opacity: fc },
        ),
        glowDot(-490 + 400 * fc, fy, { radius: 9, color: COSMOS.rose, glow: 12, opacity: fc }),
        txt('FP16 FORWARD CAST', -40, fy - 24, 26, COSMOS.rose, 'mono', 'left').opacity(fc),
        txt(
          `Stored ${BOUNDARY_FIX.roundedInput.toFixed(1)}  (0.0001 erased!)`,
          -40,
          fy + 22,
          34,
          COSMOS.rose,
          'mono',
          'left',
        )
          .glow(6, COSMOS.rose)
          .opacity(fc),
        txt(
          'Loss scaling cannot undo forward rounding',
          0,
          430,
          28,
          fw > 0.3 ? COSMOS.rose : COSMOS.muted,
          'sans',
        )
          .glow(fw > 0.3 ? 6 : 0, COSMOS.rose)
          .opacity(fc),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, scaleTex, unscaleTex, live);

  c.after('tiny-gradient', () =>
    s.play(zeroCollapse.to(1, { duration: remainDuration(c, 'tiny-gradient', 0.4, 0.35, true) })),
  );
  c.on('scale-gradient', () => s.play(scaleShift.to(1, { duration: 1.1 })));
  c.on('transfer-scaled-exponent', () => {
    s.play(showScaleEq.to(1, { duration: 0.4 }));
    s.play(fade(scaleTex, 1, { duration: 0.45 }));
  });
  c.after('scaled-storage', () =>
    s.play(showStored.to(1, { duration: remainDuration(c, 'scaled-storage', 0.4, 0.35, true) })),
  );
  c.on('unscale-gradient', () => s.play(unscaleShift.to(1, { duration: 1.0 })));
  c.after('recovered-gradient', () => {
    const dur = remainDuration(c, 'recovered-gradient', 0.45, 0.35, true);
    s.play(showRecovered.to(1, { duration: dur }));
    s.play(fade(unscaleTex, 1, { duration: dur }));
  });
  c.on('transfer-forward-cast', () => s.play(showFwdCast.to(1, { duration: 0.7 })));
  c.after('forward-rounding', () =>
    s.play(showFwdWarn.to(1, { duration: remainDuration(c, 'forward-rounding', 0.4, 0.35, true) })),
  );
}
