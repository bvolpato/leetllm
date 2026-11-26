// Scene 14: Which copy keeps the update? FP32 vs FP16 vs BF16 ruler, bit-layout cells, 65504->65520 overflow, and 70,000 comparison.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  FORMAT_SPECS,
  FP16_PREV_BELOW_ONE,
  WEIGHT_CANDIDATE,
  WEIGHT_START,
  afterDuration,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  rule,
  runPhase,
  storedInFormat,
  txt,
} from '../parts.mjs';

export default function precisionSlots(s, c) {
  const phase = s.value(0);
  const showRuler = s.value(1); // Beats 0..2: weight update ruler near 1.0
  const candProg = s.value(0);
  const writeProg = s.value(0);
  const spacingProg = s.value(0);

  const showBits = s.value(0); // Beat 3: bit layouts & gap above 1
  const bitsProg = s.value(0);

  const showOverflow = s.value(0); // Beat 4: 65,504 -> 65,519 -> 65,520 overflow
  const probeInside = s.value(0);
  const probeAcross = s.value(0);
  const overflowInf = s.value(0);

  const showCompare = s.value(0); // Beat 5: 70,000 beside 1 - 0.0001 across all 3 formats
  const rev70k = s.value(0);
  const revUpdate = s.value(0);

  const bgAura = aura(0, 30, 560, '#ffd16620', '#5ce1e614');

  const title = heroTitle(['FP32, FP16, and BF16:', 'Spacing vs Dynamic Range'], {
    x: -855,
    y: -415,
    size: 50,
    lineHeight: 60,
    accent: COSMOS.gold,
    eyebrow: 'FLOATING-POINT PRECISION · MASTER WEIGHTS',
  });

  // Part 1: Weight update ruler near 1.0
  const partRuler = guardedDynamic(showRuler, (a) => {
    const cp = candProg.value;
    const wp = writeProg.value;
    const sp = spacingProg.value;
    const xMap = (v) => -540 + ((v - 0.99944) / 0.00062) * 1240;
    const candVal = WEIGHT_START + (WEIGHT_CANDIDATE - WEIGHT_START) * cp;
    const fp32Saved = storedInFormat(FORMAT_SPECS[0], WEIGHT_CANDIDATE);
    const fp16Saved = storedInFormat(FORMAT_SPECS[1], WEIGHT_CANDIDATE);

    const nodes = [
      txt(
        'UPDATE WEIGHT 1.0 BY -0.0001  ->  WHICH STORED COPY MOVES?',
        -855,
        -205,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(a),

      // Candidate track
      txt('Candidate', -855, -92, 32, COSMOS.gold, 'sans', 'left').opacity(a),
      rule(xMap(0.99944), -92, xMap(1.00006), -92, COSMOS.rule, 3).opacity(a),
      rule(xMap(WEIGHT_START), -92, xMap(candVal), -92, COSMOS.gold, 6).opacity(a),
      glowDot(xMap(candVal), -92, { radius: 11, color: COSMOS.gold, glow: 12, opacity: a }),
      txt(cp > 0.7 ? '0.9999' : '1.0', xMap(candVal), -136, 30, COSMOS.gold, 'mono').opacity(a),

      // FP32 track
      txt('FP32 (4 B)', -855, 58, 32, COSMOS.cyan, 'mono', 'left').opacity(a),
      rule(xMap(0.99944), 58, xMap(1.00006), 58, COSMOS.rule, 3).opacity(a),
      rule(xMap(WEIGHT_START), 30, xMap(WEIGHT_START), 86, COSMOS.ink, 3).opacity(a),
      glowDot(xMap(WEIGHT_START + (fp32Saved - WEIGHT_START) * wp), 58, {
        radius: 12,
        color: COSMOS.cyan,
        glow: 12,
        opacity: a,
      }),
      txt(
        wp > 0.8 ? `≈ ${fp32Saved.toFixed(8)}` : '1.0',
        xMap(WEIGHT_START + (fp32Saved - WEIGHT_START) * wp),
        0,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),

      // FP16 track
      txt('FP16 (2 B)', -855, 208, 32, COSMOS.blue, 'mono', 'left').opacity(a),
      rule(xMap(0.99944), 208, xMap(1.00006), 208, COSMOS.rule, 3).opacity(a),
      rule(xMap(WEIGHT_START), 180, xMap(WEIGHT_START), 236, COSMOS.ink, 3).opacity(a),
      glowDot(xMap(WEIGHT_START + (fp16Saved - WEIGHT_START) * wp), 208, {
        radius: 12,
        color: COSMOS.blue,
        glow: 12,
        opacity: a,
      }),
      txt(
        wp > 0.8 ? 'still 1 (rounded back)' : '1.0',
        xMap(WEIGHT_START) - 10,
        148,
        28,
        wp > 0.8 ? COSMOS.rose : COSMOS.blue,
        'mono',
        'right',
      ).opacity(a),
    ];

    // FP16 neighbor spacing reveal
    if (sp > 0.05) {
      const prevX = xMap(FP16_PREV_BELOW_ONE);
      const midX = xMap((WEIGHT_START + FP16_PREV_BELOW_ONE) * 0.5);
      nodes.push(
        rule(prevX, 240, prevX, 290, COSMOS.blue, 4).opacity(sp * a),
        rule(prevX, 265, xMap(WEIGHT_START), 265, COSMOS.blue, 3).opacity(sp * a),
        txt(String(FP16_PREV_BELOW_ONE), prevX, 322, 26, COSMOS.blue, 'mono').opacity(sp * a),
        rule(midX, 246, midX, 284, COSMOS.muted, 3).opacity(sp * a),
        txt('halfway', midX, 322, 26, COSMOS.muted, 'sans').opacity(sp * a),
        txt('1.0', xMap(WEIGHT_START), 322, 26, COSMOS.blue, 'mono').opacity(sp * a),
        txt(
          '0.9999 did not reach halfway -> FP16 & BF16 round back to 1 · keep FP32 master weights',
          0,
          395,
          28,
          COSMOS.emerald,
          'sans',
        ).opacity(sp * a),
      );
    } else if (wp < 0.1 && cp > 0.7) {
      nodes.push(
        txt(
          'Predict: which stored weight moves when we write 0.9999?',
          0,
          380,
          32,
          COSMOS.gold,
          'serif',
        )
          .glow(6, COSMOS.gold)
          .opacity(a),
      );
    }

    return group(...nodes);
  });

  // Part 2: Bit-layout strips (sign / exponent / fraction) + gap above 1
  const partBits = guardedDynamic(showBits, (a) => {
    const bp = bitsProg.value;
    const nodes = [
      txt(
        'BIT ALLOCATION: SIGN (1) · EXPONENT (RANGE) · FRACTION (SPACING)',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt('sign', -615, -135, 26, COSMOS.rose, 'mono', 'left').opacity(a),
      txt('exponent', -485, -135, 26, COSMOS.gold, 'mono', 'left').opacity(a),
      txt('fraction', -215, -135, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt('GAP ABOVE 1', 640, -135, 28, COSMOS.ink, 'mono').opacity(a),
    ];

    FORMAT_SPECS.forEach((spec, rowIdx) => {
      const cy = -35 + rowIdx * 165;
      const count = 1 + spec.exponent + spec.fraction;
      nodes.push(
        txt(spec.name, -855, cy, 42, spec.color, 'mono', 'left').opacity(a),
        txt(
          `1 + ${spec.exponent} + ${spec.fraction} bits (${spec.bytes} B)`,
          -615,
          cy + 58,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      );
      for (let bit = 0; bit < count; bit++) {
        const bx = -605 + bit * 30;
        const col = bit === 0 ? COSMOS.rose : bit <= spec.exponent ? COSMOS.gold : COSMOS.cyan;
        const lit = bit < Math.ceil(bp * 32);
        nodes.push(
          rect(24, 58, {
            fill: lit ? col : '#12182b',
            stroke: col,
            width: 1.4,
            radius: 4,
          })
            .at(bx, cy)
            .opacity((lit ? 0.92 : 0.4) * a),
        );
      }
      const gap = (2 ** -spec.fraction).toPrecision(3);
      nodes.push(
        txt(bp > 0.85 ? gap : '?', 640, cy + 4, 38, spec.color, 'mono')
          .glow(6, spec.color)
          .opacity(a),
      );
    });

    nodes.push(
      txt(
        'BF16 has 7 fraction bits vs FP16 10 -> 8× wider step above 1, yet keeps FP32 exponent range',
        0,
        405,
        28,
        COSMOS.gold,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Part 3: FP16 overflow ruler (65,504 -> 65,519 -> 65,520 = inf)
  const partOverflow = guardedDynamic(showOverflow, (a) => {
    const ins = probeInside.value;
    const acr = probeAcross.value;
    const inf = overflowInf.value;
    const val = 65504 + 15 * ins + acr;
    const xMap = (v) => -730 + (v - 65500) * 38;
    const storedVal = storedInFormat(FORMAT_SPECS[1], val);

    const nodes = [
      txt(
        'FP16 UPPER RANGE · ROUND TO NEAREST, TIES TO EVEN',
        -855,
        -205,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ).opacity(a),
      rule(xMap(65500), 10, xMap(65538), 10, COSMOS.muted, 3).opacity(a),
    ];

    for (let v = 65504; v <= 65536; v += 4) {
      nodes.push(rule(xMap(v), 10, xMap(v), 36, COSMOS.muted, 2).opacity(a));
    }

    // Key landmarks: 65504 and 65536
    nodes.push(
      rule(xMap(65504), -26, xMap(65504), 46, COSMOS.blue, 4).opacity(a),
      txt('65,504', xMap(65504), 86, 34, COSMOS.blue, 'mono').opacity(a),
      txt('max finite FP16', xMap(65504), 128, 26, COSMOS.blue, 'sans').opacity(a),

      rule(xMap(65536), -26, xMap(65536), 46, COSMOS.muted, 3).opacity(a),
      txt('65,536', xMap(65536), 86, 34, COSMOS.muted, 'mono').opacity(a),
      txt('needs exp 16', xMap(65536), 128, 26, COSMOS.muted, 'sans').opacity(a),

      // Active input probe
      rule(xMap(val), -75, xMap(val), 4, COSMOS.gold, 5).opacity(a),
      glowDot(xMap(val), 10, { radius: 11, color: COSMOS.gold, glow: 12, opacity: a }),
      txt(`input ${Math.round(val).toLocaleString('en')}`, xMap(val), -108, 38, COSMOS.gold, 'mono')
        .glow(6, COSMOS.gold)
        .opacity(a),
    );

    if (acr > 0.5) {
      nodes.push(
        txt('65,520', xMap(65520), 86, 34, COSMOS.rose, 'mono').opacity(a),
        txt('tie rounds up', xMap(65520), 128, 26, COSMOS.rose, 'sans').opacity(a),
      );
    }

    const showInf = inf > 0.5;
    const outText =
      acr > 0.5
        ? showInf
          ? '∞ (overflow)'
          : '...'
        : ins > 0.7
          ? storedVal.toLocaleString('en')
          : '65,504';
    const outCol = showInf ? COSMOS.rose : COSMOS.blue;
    nodes.push(
      glassCell(0, 295, 920, 128, outCol, { fill: '#121626', glow: 9, opacity: a }),
      txt('STORED FP16 RESULT', 0, 260, 26, COSMOS.muted, 'mono').opacity(a),
      txt(outText, 0, 316, 52, outCol, 'mono').glow(8, outCol).opacity(a),
    );
    return group(...nodes);
  });

  // Part 4: Store 70,000 vs Store 1 - 0.0001 across FP32, FP16, BF16
  const partCompare = guardedDynamic(showCompare, (a) => {
    const r70 = rev70k.value;
    const rup = revUpdate.value;
    const nodes = [
      txt('FORMAT', -660, -175, 28, COSMOS.muted, 'mono').opacity(a),
      txt('STORE 70,000', -40, -175, 32, COSMOS.gold, 'mono').opacity(a),
      txt('STORE 1 - 0.0001', 560, -175, 32, COSMOS.cyan, 'mono').opacity(a),
    ];

    FORMAT_SPECS.forEach((spec, i) => {
      const cy = -45 + i * 165;
      const v70 = storedInFormat(spec, 70000);
      const vUp = storedInFormat(spec, WEIGHT_CANDIDATE);
      const s70 =
        r70 > 0.5 ? (Number.isFinite(v70) ? v70.toLocaleString('en') : '∞ (overflow)') : '?';
      const sUp = rup > 0.5 ? (vUp === 1 ? '1  (lost)' : `≈ ${vUp.toFixed(8)}`) : '?';
      const col70 =
        r70 > 0.5 ? (Number.isFinite(v70) ? COSMOS.emerald : COSMOS.rose) : COSMOS.muted;
      const colUp = rup > 0.5 ? (vUp < 1 ? COSMOS.emerald : COSMOS.rose) : COSMOS.muted;

      nodes.push(
        glassCell(0, cy, 1660, 126, spec.color, { fill: '#0e1628', glow: 6, opacity: a }),
        txt(spec.name, -660, cy + 4, 44, spec.color, 'mono').opacity(a),
        txt(s70, -40, cy + 4, 40, col70, 'mono').opacity(a),
        txt(sUp, 560, cy + 4, 36, colUp, 'mono').opacity(a),
      );
    });

    return group(...nodes);
  });

  s.add(bgAura, title, partRuler, partBits, partOverflow, partCompare);
  runPhase(s, c, phase, 14);

  c.on('precision-small-update', () => s.play(candProg.to(1, { duration: 0.75 })));
  c.on('precision-write', () => s.play(writeProg.to(1, { duration: 0.75 })));
  c.on('precision-spacing', () => s.play(spacingProg.to(1, { duration: 0.75 })));

  c.on('precision-bits', () => {
    s.play(
      par(
        showRuler.to(0, { duration: 0.2 }),
        delay(showBits.to(1, { duration: 0.25 }), 0.22),
        delay(bitsProg.to(1, { duration: 1.1 }), 0.25),
      ),
    );
  });

  c.on('precision-last-finite', () => {
    s.play(
      par(
        showBits.to(0, { duration: 0.2 }),
        delay(showOverflow.to(1, { duration: 0.25 }), 0.22),
        delay(probeInside.to(1, { duration: 0.75 }), 0.25),
      ),
    );
  });
  c.on('precision-overflow-tie', () => s.play(probeAcross.to(1, { duration: 0.55 })));
  c.after('precision-overflow-tie', () =>
    s.play(overflowInf.to(1, { duration: afterDuration(c, 'precision-overflow-tie', 0.35) })),
  );

  c.on('precision-range', () => {
    s.play(
      par(
        showOverflow.to(0, { duration: 0.2 }),
        delay(showCompare.to(1, { duration: 0.25 }), 0.22),
      ),
    );
  });
  c.after('precision-range', () =>
    s.play(rev70k.to(1, { duration: afterDuration(c, 'precision-range', 0.35) })),
  );
  c.after('precision-compare-update', () =>
    s.play(
      revUpdate.to(1, {
        duration: remainDuration(c, 'precision-compare-update', 0.45),
      }),
    ),
  );
}
