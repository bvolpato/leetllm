// Scene 15: What does the running sum keep? Four +0.25 updates at 1,024: FP16 flatlines at 1,024 vs FP32 climbs to 1,025.
import {
  COSMOS,
  aura,
  floatAdds,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  halfAdds,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function accumulation(s, c) {
  const phase = s.value(0);
  const fp16Steps = s.value(0);
  const fp16Flat = s.value(0);
  const fp32Steps = s.value(0);
  const fp32Win = s.value(0);
  const showDiag = s.value(0);

  const bgAura = aura(150, 0, 620, '#ff6b8b1e', '#6ee7b71a');
  const title = heroTitle(['What Does the', 'Running Sum Keep?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.emerald,
    eyebrow: 'ACCUMULATOR PRECISION · 1,024 + 4 × 0.25',
  });

  // Chart coordinates
  const cx0 = -280;
  const cx1 = 800;
  const cyBot = 195; // value 1023.72
  const cyTop = -255; // value 1025.15
  const mapStep = (k) => cx0 + (k / 4) * (cx1 - cx0);
  const mapVal = (v) => cyBot - ((v - 1023.72) / (1025.15 - 1023.72)) * (cyBot - cyTop);

  const live = guardedDynamic(1, () => {
    const k16 = fp16Steps.value;
    const fl = fp16Flat.value;
    const k32 = fp32Steps.value;
    const w32 = fp32Win.value;
    const dg = showDiag.value;

    const nodes = [
      // Chart frame & gridlines
      line([cx0, cyBot], [cx1, cyBot], { stroke: '#465885', width: 2.6 }),
      line([cx0, cyBot], [cx0, cyTop], { stroke: '#465885', width: 2.6 }),
      txt('UPDATE STEP (+0.25 EACH)', (cx0 + cx1) * 0.5, cyBot + 64, 26, COSMOS.muted, 'mono'),
    ];

    for (const v of [1024, 1024.25, 1024.5, 1024.75, 1025]) {
      const y = mapVal(v);
      const isInt = v === 1024 || v === 1025;
      nodes.push(
        line([cx0, y], [cx1, y], {
          stroke: isInt ? '#3a4f7d' : '#1b2642',
          width: isInt ? 1.8 : 1.2,
          dash: isInt ? undefined : [6, 6],
        }),
        txt(
          isInt ? String(v) : v.toFixed(2),
          cx0 - 18,
          y,
          26,
          isInt ? COSMOS.ink : COSMOS.dim,
          'mono',
          'right',
        ),
      );
    }
    for (let k = 0; k <= 4; k++) {
      const x = mapStep(k);
      nodes.push(
        line([x, cyBot - 8], [x, cyBot + 8], { stroke: '#465885', width: 2 }),
        txt(k === 0 ? 'start' : `+${k}×0.25`, x, cyBot + 32, 26, COSMOS.muted, 'mono'),
      );
    }

    // FP16 trace (flat at 1024 with tiny rejected +0.25 spikes)
    const n16 = Math.min(4, Math.max(0, Math.floor(k16 + 0.01)));
    const pts16 = [[mapStep(0), mapVal(halfAdds[0])]];
    for (let i = 1; i <= n16; i++) {
      const xMid = mapStep(i - 0.5);
      pts16.push([xMid, mapVal(1024.25)], [mapStep(i), mapVal(halfAdds[i])]);
    }
    if (pts16.length >= 2) {
      nodes.push(
        glowingTrail(pts16, { color: COSMOS.rose, width: 4.6, glow: 10 }),
        glowDot(pts16.at(-1)[0], pts16.at(-1)[1], { radius: 8, color: COSMOS.rose }),
      );
    }
    nodes.push(
      txt(
        'FP16 step = 1.0 (0.25 rounds away)',
        cx0 + 28,
        mapVal(1023.86),
        26,
        COSMOS.rose,
        'mono',
        'left',
      ).opacity(0.35 + 0.65 * fl),
    );

    // FP32 trace (climbs 1024 -> 1024.25 -> 1024.5 -> 1024.75 -> 1025)
    const n32 = Math.min(4, Math.max(0, Math.floor(k32 + 0.01)));
    if (n32 >= 1) {
      const pts32 = [];
      for (let i = 0; i <= n32; i++) {
        pts32.push([mapStep(i), mapVal(floatAdds[i])]);
      }
      nodes.push(
        glowingTrail(pts32, {
          gradientColors: [COSMOS.cyan, COSMOS.emerald],
          width: 5.2,
          glow: 12,
        }),
      );
      for (let i = 1; i <= n32; i++) {
        nodes.push(glowDot(mapStep(i), mapVal(floatAdds[i]), { radius: 8, color: COSMOS.emerald }));
      }
      if (w32 > 0.2) {
        nodes.push(
          txt(
            'FP32 keeps every +0.25 → 1,025',
            mapStep(2.2),
            mapVal(1024.92),
            28,
            COSMOS.emerald,
            'mono',
          )
            .glow(6, COSMOS.emerald)
            .opacity(w32),
        );
      }
    }

    // Left readouts
    nodes.push(
      glassCell(-635, -88, 440, 170, COSMOS.rose, { fill: '#201020', glow: 8 }),
      txt('FP16 ACCUMULATOR', -635, -138, 26, COSMOS.muted, 'mono'),
      txt(`${halfAdds[n16]}`, -635, -82, 48, COSMOS.rose, 'mono').glow(7, COSMOS.rose),
      txt('all 4 quarters lost', -635, -30, 26, COSMOS.rose, 'sans').opacity(0.35 + 0.65 * fl),

      glassCell(-635, 114, 440, 170, COSMOS.emerald, {
        fill: '#0e2224',
        glow: 8,
        opacity: 0.25 + 0.75 * Math.min(1, k32),
      }),
      txt('FP32 ACCUMULATOR', -635, 64, 26, COSMOS.muted, 'mono').opacity(
        0.25 + 0.75 * Math.min(1, k32),
      ),
      txt(`${floatAdds[n32]}`, -635, 120, 48, COSMOS.emerald, 'mono')
        .glow(7, COSMOS.emerald)
        .opacity(0.25 + 0.75 * Math.min(1, k32)),
      txt('exact sum retained', -635, 172, 26, COSMOS.emerald, 'sans').opacity(w32),
    );

    // Bottom diagnostic separation bar (Beat 2)
    nodes.push(
      glassCell(0, 355, 1660, 134, dg > 0.5 ? COSMOS.gold : COSMOS.dim, {
        fill: '#101829',
        glow: dg > 0.5 ? 8 : 3,
        opacity: 0.2 + 0.8 * dg,
      }),
      txt(
        'SEPARATE THE THREE PRECISION BOUNDARIES',
        -790,
        320,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(0.2 + 0.8 * dg),
      txt(
        '1. Original-input ref   vs   2. Reconstructed-input ref   vs   3. Actual kernel (MMA product & reduction mode)',
        -790,
        378,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(0.2 + 0.8 * dg),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('accumulation-beat-1-focus-1', () =>
    s.play(fp16Steps.to(4, { duration: remainDuration(c, 'accumulation-beat-1-focus-1', 1.4) })),
  );
  c.on('accumulation-beat-1-focus-2', () =>
    s.play(fp16Flat.to(1, { duration: remainDuration(c, 'accumulation-beat-1-focus-2', 0.45) })),
  );
  c.on('accumulation-replay-fp32', () =>
    s.play(fp32Steps.to(4, { duration: remainDuration(c, 'accumulation-replay-fp32', 1.5) })),
  );
  c.on('accumulation-finer-grid-retained', () =>
    s.play(
      fp32Win.to(1, { duration: remainDuration(c, 'accumulation-finer-grid-retained', 0.45) }),
    ),
  );
  c.on('accumulation-beat-3-focus-1', () =>
    s.play(showDiag.to(1, { duration: remainDuration(c, 'accumulation-beat-3-focus-1', 0.5) })),
  );
}
