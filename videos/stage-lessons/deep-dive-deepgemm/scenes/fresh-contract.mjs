// Scene 26: Would you keep this packed run?
// DOUBLE PREDICTION SCENE!
// Prediction 1 (Beat 0 hold 2.5s): [96, 257, 0] @ align 128 -> hide [128,384,0], 512, 353, 159, 31.1%, 45% until Beat 1 c.after!
// Prediction 2 (Beat 3 hold 2.4s): 128-row (120 us) vs 256-row (105 us), both sum 14 -> hide swapped [9,5] & REJECT verdict until Beat 4 c.after!
import {
  COSMOS,
  FINAL_CHECK_0,
  FINAL_CHECK_1,
  FRESH_128,
  FRESH_256,
  ROLE,
  aura,
  buildMoePackSlabs3d,
  delay,
  finalRuns,
  freshReference,
  freshRows,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  packSegments,
  par,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function freshContract(s, c) {
  const phase = s.value(0);
  const showPack = s.value(1);
  const showFinal = s.value(0);

  // Part 1 values (Beats 0-2): fresh [96, 257, 0] packing
  const packStage = s.value(0); // 0 = raw [96,257,0], 1 = align 128 [128,384,0], 2 = align 256 [256,512,0]
  const showEdge = s.value(0);
  const showAsk1 = s.value(0);
  const revCap512 = s.value(0); // STRICT: c.after('dg-fresh-contract-1-1')
  const revUseful353 = s.value(0); // STRICT: c.after('dg-fresh-contract-1-2')
  const revShare311 = s.value(0); // STRICT: c.after('dg-fresh-contract-1-3')
  const revOvh45 = s.value(0); // STRICT: c.after('dg-fresh-contract-1-4')
  const showDouble768 = s.value(0);

  // Part 2 values (Beats 3-4): final run selection
  const showTimes = s.value(0);
  const showSum14 = s.value(0);
  const showAsk2 = s.value(0);
  const revT4 = s.value(0); // STRICT: c.after('dg-fresh-contract-4-0')
  const revT6 = s.value(0); // STRICT: c.after('dg-fresh-contract-4-1')
  const revReject = s.value(0); // STRICT: c.after('dg-fresh-contract-4-2')
  const showNccl = s.value(0);

  const currentWidths = () => {
    const st = packStage.value;
    const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
    if (st <= 1) return lerp(freshRows, FRESH_128.capacities, Math.max(0, st));
    return lerp(FRESH_128.capacities, FRESH_256.capacities, Math.min(1, st - 1));
  };
  const pinRow = () => {
    const w = currentWidths();
    return w[0] + w[1];
  };

  const bgAura = aura(445, 20, 520, '#ffd16620', '#6ee7b71a');
  const { view: pack3d } = buildMoePackSlabs3d(freshRows, currentWidths, pinRow, 768, phase, {
    x: 455,
    y: 15,
    unit: 92,
  });

  const title = heroTitle(['Would You Keep', 'This Packed Run?'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.gold,
    eyebrow: 'TRANSFER CHECK · PACK + VERIFY + TIME',
    subtitle: 'Fresh [96, 257, 0] experts -> alignment, per-token check & clock',
  });

  // View 1 (Beats 0-2): Fresh 3-expert packing (STRICT PREDICTION #1 WITHHOLDING)
  const packView = guardedDynamic(showPack, (a) => {
    const widths = currentWidths();
    const segs = packSegments(freshRows, widths);
    const barLeft = -700;
    const pxPerRow = 640 / 768;
    const toX = (row) => barLeft + row * pxPerRow;
    const rowY = (i) => -105 + i * 96;
    const barH = 42;

    const nodes = [
      txt('3D FRESH 3-EXPERT PACKING', 455, -415, 26, COSMOS.cyan, 'mono')
        .glow(5, COSMOS.cyan)
        .opacity(a),
      txt(
        showDouble768.value > 0.5
          ? 'Align 256: zero-count E2 still reserves 0 rows'
          : revCap512.value > 0.5
            ? 'Align 128: [128, 384, 0] = 512 reserved'
            : 'Three fresh experts: [96, 257, 0] useful rows',
        455,
        435,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
      line([toX(0), -160], [toX(768), -160], { stroke: COSMOS.dim, width: 2 }).opacity(a),
    ];

    for (const tick of [0, 128, 256, 384, 512, 640, 768]) {
      const tx = toX(tick);
      nodes.push(
        line([tx, -168], [tx, -152], { stroke: COSMOS.dim, width: 2 }).opacity(a),
        txt(String(tick), tx, -190, 26, COSMOS.muted, 'mono').opacity(a),
      );
    }

    for (let i = 0; i < 3; i++) {
      const seg = segs[i];
      const y = rowY(i);
      const sx = toX(seg.start);
      const uW = seg.count * pxPerRow;
      const tW = seg.width * pxPerRow;
      const pW = tW - uW;

      nodes.push(
        txt(`E${i}`, -845, y - 2, 28, COSMOS.ink, 'mono', 'left').opacity(a),
        txt(`${seg.count}`, -782, y - 2, 26, ROLE.c, 'mono', 'left').opacity(a),
      );

      if (uW > 1) {
        nodes.push(
          rect(uW, barH, { fill: '#104c63', stroke: ROLE.c, width: 2.2, radius: 4 })
            .at(sx + uW * 0.5, y)
            .opacity(a),
        );
      } else {
        nodes.push(
          line([sx, y - 18], [sx, y + 18], { stroke: COSMOS.muted, width: 3 }).opacity(a),
          txt('empty (0)', sx + 16, y, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        );
      }

      if (pW > 2) {
        nodes.push(
          rect(pW, barH, {
            fill: '#2b1e10',
            stroke: ROLE.warn,
            width: 2.0,
            radius: 4,
            dash: [5, 4],
          })
            .at(sx + uW + pW * 0.5, y)
            .opacity(a),
        );
      }
    }

    // Hint about E1 having 257 = 2*128 + 1 (without leaking 384 or 512!)
    if (showEdge.value > 0.5 && revCap512.value < 0.05) {
      nodes.push(
        txt(
          'E1 = 257 rows = 2 full 128-blocks + 1 extra row',
          -860,
          178,
          26,
          ROLE.gold,
          'mono',
          'left',
        ).opacity(a),
      );
    }

    if (showAsk1.value > 0.5 && packStage.value < 0.05) {
      nodes.push(
        glassCell(-460, 276, 780, 92, ROLE.gold, { fill: '#221c10', glow: 9, opacity: a }),
        txt(
          'Predict: total reserved rows & empty fraction at align 128?',
          -460,
          276,
          26,
          ROLE.gold,
          'serif',
        ).opacity(a),
      );
    }

    // Answers strictly revealed via c.after in Beat 1 & Beat 2!
    if (revCap512.value > 0.05) {
      const capStr =
        showDouble768.value > 0.5
          ? `Align 256: [${FRESH_256.capacities.join(',')}] = ${FRESH_256.capacity} (E2=0)`
          : `Align 128: [${FRESH_128.capacities.join(',')}] = ${FRESH_128.capacity} reserved`;
      nodes.push(
        glassCell(-460, 240, 800, 82, showDouble768.value > 0.5 ? ROLE.scale : ROLE.good, {
          fill: '#0e2420',
          glow: 8,
          opacity: revCap512.value * a,
        }),
        txt(
          capStr,
          -460,
          240,
          26,
          showDouble768.value > 0.5 ? ROLE.scale : ROLE.good,
          'mono',
        ).opacity(revCap512.value * a),
      );
    }

    if (revUseful353.value > 0.05) {
      const ratioStr =
        showDouble768.value > 0.5
          ? `${FRESH_256.useful} useful · ${FRESH_256.padding} pad -> 54.0% share (same 353 routes)`
          : revOvh45.value > 0.5
            ? `${FRESH_128.useful} useful · ${FRESH_128.padding} pad -> 31.1% share · 45.0% overhead`
            : revShare311.value > 0.5
              ? `${FRESH_128.useful} useful · ${FRESH_128.padding} empty / 512 = 31.1% padding share`
              : `${FRESH_128.useful} useful rows across the 3 experts`;
      nodes.push(
        txt(ratioStr, -860, 344, 26, ROLE.c, 'mono', 'left').opacity(revUseful353.value * a),
      );
    }

    return group(...nodes);
  });

  // View 2 (Beats 3-4): Final Decision, STRICT PREDICTION #2 WITHHOLDING!
  const finalView = guardedDynamic(showFinal, (a) => {
    const r0 = finalRuns[0]; // 128-row: 120 us, [5, 9]
    const r1 = finalRuns[1]; // 256-row: 105 us, [9, 5]
    const t4Rev = revT4.value > 0.5;
    const t6Rev = revT6.value > 0.5;
    const rejRev = revReject.value > 0.5;

    const c0 = rejRev ? ROLE.good : ROLE.a;
    const c1 = rejRev ? ROLE.bad : ROLE.c;

    const nodes = [
      txt('3D VERIFIED LAYER SELECTION', 455, -415, 26, ROLE.gold, 'mono')
        .glow(5, ROLE.gold)
        .opacity(a),
      txt(
        showNccl.value > 0.5
          ? 'Next lesson: multi-GPU communication with NCCL'
          : 'Check per-token accuracy BEFORE keeping a faster clock',
        455,
        435,
        26,
        showNccl.value > 0.5 ? ROLE.good : COSMOS.muted,
        'sans',
      ).opacity(a),
      txt(
        `REFERENCE:  ${freshReference.tokens[0]} = ${freshReference.values[0]}   ·   ${freshReference.tokens[1]} = ${freshReference.values[1]}   (sum = ${FINAL_CHECK_0.total})`,
        -860,
        -172,
        28,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(a),

      // Run 0: 128-row blocks (120 us, PASS)
      glassCell(-665, -18, 385, 218, c0, { fill: '#0e1d30', glow: rejRev ? 10 : 5, opacity: a }),
      txt(r0.name.toUpperCase(), -665, -92, 26, c0, 'mono').opacity(a),
      txt(
        showTimes.value > 0.5 ? `layer clock: ${r0.elapsed} us` : 'layer clock: ...',
        -665,
        -44,
        28,
        COSMOS.ink,
        'mono',
      ).opacity(a),
      txt(
        showSum14.value > 0.5 ? `pair sum = ${FINAL_CHECK_0.total}` : 'checking rows...',
        -665,
        2,
        26,
        COSMOS.muted,
        'mono',
      ).opacity(a),
      txt(
        t4Rev ? `t4 = ${r0.returned[0]} · t6 = ${r0.returned[1]}` : 't4, t6: [ ?, ? ]',
        -665,
        46,
        26,
        t4Rev ? ROLE.good : COSMOS.muted,
        'mono',
      ).opacity(a),

      // Run 1: 256-row blocks (105 us, FAIL swapped!)
      glassCell(-245, -18, 415, 218, c1, { fill: '#171528', glow: rejRev ? 10 : 5, opacity: a }),
      txt(r1.name.toUpperCase(), -245, -92, 26, c1, 'mono').opacity(a),
      txt(
        showTimes.value > 0.5 ? `layer clock: ${r1.elapsed} us` : 'layer clock: ...',
        -245,
        -44,
        28,
        COSMOS.ink,
        'mono',
      ).opacity(a),
      txt(
        showSum14.value > 0.5 ? `pair sum = ${FINAL_CHECK_1.total}` : 'checking rows...',
        -245,
        2,
        26,
        COSMOS.muted,
        'mono',
      ).opacity(a),
      txt(
        t6Rev
          ? `t4=${r1.returned[0]} · t6=${r1.returned[1]} (SWAP!)`
          : t4Rev
            ? `t4 = ${r1.returned[0]} (needed 5!)`
            : 't4, t6: [ ?, ? ]',
        -245,
        46,
        26,
        t4Rev ? ROLE.bad : COSMOS.muted,
        'mono',
      ).opacity(a),
    ];

    if (showAsk2.value > 0.5 && !t4Rev) {
      nodes.push(
        glassCell(-460, 194, 780, 92, ROLE.gold, { fill: '#221c10', glow: 9, opacity: a }),
        txt(
          '105 us < 120 us and both sum to 14. Keep the faster run?',
          -460,
          194,
          26,
          ROLE.gold,
          'serif',
        ).opacity(a),
      );
    }

    if (rejRev) {
      nodes.push(
        glassCell(-460, 194, 780, 96, ROLE.bad, { fill: '#2c1220', glow: 10, opacity: a }),
        txt(
          'REJECT 256-ROW RUN: SUM 14 HID SWAPPED TOKENS',
          -460,
          174,
          26,
          ROLE.bad,
          'mono',
        ).opacity(a),
        txt(
          'Restore source order -> verify every token -> re-time layer',
          -460,
          216,
          26,
          COSMOS.ink,
          'sans',
        ).opacity(a),
      );
    }

    if (showNccl.value > 0.5) {
      nodes.push(
        txt(
          'Next lesson: multi-GPU collectives & rings with NCCL ->',
          -860,
          345,
          28,
          ROLE.good,
          'sans',
          'left',
        )
          .glow(5, ROLE.good)
          .opacity(showNccl.value * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, pack3d, title, packView, finalView);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, pack3d, { theta: -0.2, phi: 0.94 });

  // Beat 0: setup fresh [96, 257, 0] + Prediction #1 prompt
  c.on('dg-fresh-contract-0-0', () =>
    s.play(packStage.to(0, { duration: remainDuration(c, 'dg-fresh-contract-0-0', 0.25) })),
  );
  c.on('dg-fresh-contract-0-1', () =>
    s.play(showEdge.to(1, { duration: remainDuration(c, 'dg-fresh-contract-0-1', 0.4) })),
  );
  c.on('dg-fresh-contract-0-2', () =>
    s.play(showAsk1.to(1, { duration: remainDuration(c, 'dg-fresh-contract-0-2', 0.4) })),
  );

  // Beat 1: Reveal align-128 capacities & ratios strictly after answer clauses!
  c.on('dg-fresh-contract-1-0', () =>
    s.play(packStage.to(1, { duration: remainDuration(c, 'dg-fresh-contract-1-0', 0.65) })),
  );
  c.after('dg-fresh-contract-1-1', () =>
    s.play(revCap512.to(1, { duration: remainAfterDuration(c, 'dg-fresh-contract-1-1', 0.35) })),
  );
  c.after('dg-fresh-contract-1-2', () =>
    s.play(revUseful353.to(1, { duration: remainAfterDuration(c, 'dg-fresh-contract-1-2', 0.35) })),
  );
  c.after('dg-fresh-contract-1-3', () =>
    s.play(revShare311.to(1, { duration: remainAfterDuration(c, 'dg-fresh-contract-1-3', 0.35) })),
  );
  c.after('dg-fresh-contract-1-4', () =>
    s.play(revOvh45.to(1, { duration: remainAfterDuration(c, 'dg-fresh-contract-1-4', 0.35) })),
  );

  // Beat 2: Double to align 256 in lockstep with readouts (never park at fractional 1.35!)
  c.on('dg-fresh-contract-2-0', () =>
    s.play(packStage.to(1, { duration: remainDuration(c, 'dg-fresh-contract-2-0', 0.25) })),
  );
  c.on('dg-fresh-contract-2-1', () => {
    const d = remainDuration(c, 'dg-fresh-contract-2-1', 0.45);
    s.play(par(packStage.to(2, { duration: d }), showDouble768.to(1, { duration: d })));
  });
  c.on('dg-fresh-contract-2-2', () =>
    s.play(showDouble768.to(1, { duration: remainDuration(c, 'dg-fresh-contract-2-2', 0.25) })),
  );

  // Beat 3: Swap cleanly to Final Decision (Prediction #2, STRICT WITHHOLDING!)
  c.on('dg-fresh-contract-3-0', () => {
    s.play(
      par(showPack.to(0, { duration: 0.18 }), delay(showFinal.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('dg-fresh-contract-3-1', () =>
    s.play(showTimes.to(1, { duration: remainDuration(c, 'dg-fresh-contract-3-1', 0.4) })),
  );
  c.on('dg-fresh-contract-3-2', () =>
    s.play(showSum14.to(1, { duration: remainDuration(c, 'dg-fresh-contract-3-2', 0.4) })),
  );
  c.on('dg-fresh-contract-3-3', () =>
    s.play(showAsk2.to(1, { duration: remainDuration(c, 'dg-fresh-contract-3-3', 0.4) })),
  );

  // Beat 4: Reveal swap failure & REJECT verdict strictly after clauses!
  c.after('dg-fresh-contract-4-0', () =>
    s.play(revT4.to(1, { duration: remainAfterDuration(c, 'dg-fresh-contract-4-0', 0.35) })),
  );
  c.after('dg-fresh-contract-4-1', () =>
    s.play(revT6.to(1, { duration: remainAfterDuration(c, 'dg-fresh-contract-4-1', 0.35) })),
  );
  c.after('dg-fresh-contract-4-2', () =>
    s.play(revReject.to(1, { duration: remainAfterDuration(c, 'dg-fresh-contract-4-2', 0.35) })),
  );
  c.on('dg-fresh-contract-4-3', () =>
    s.play(showNccl.to(1, { duration: remainDuration(c, 'dg-fresh-contract-4-3', 0.4) })),
  );
}
