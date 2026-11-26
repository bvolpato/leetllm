// Scene 14: Comparing two training runs (3-act grand finale!).
// Act 1 (Beats 0-3 & 5-6a): Quality-gate coordinate space with STRICT prediction withholding in Beats 1 & 5.
// Act 2 (Beat 4): Intermediate overflow in a single sum (+40,000 + 40,000 - 40,000 in FP16 vs FP32).
// Act 3 (Beat 6b): Orbiting 3D 16-byte Adam parameter state monolith bridging into FSDP & ZeRO.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  PARTIAL_FP16_STEPS,
  PARTIAL_FP32_STEPS,
  PARTIAL_INPUTS,
  aura,
  box3d,
  cinematic3d,
  comparisonRuns,
  fade,
  fmtVal,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  passesGates,
  qualityGates,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function earnedTransfer(s, c) {
  const phase = s.value(0);

  // Act 1: Quality-gate scatter + throughput telemetry
  const showAct1 = s.value(1);
  const placedA = s.value(0);
  const placedB = s.value(0);
  const verdictA = s.value(0);
  const verdictB = s.value(0);
  const showSpeedWinner = s.value(0);
  const retestProg = s.value(0); // 0 -> 1 moves A from 92% to 93%
  const finalWinner = s.value(0);

  // Act 2: Kernel partial-sum overflow (Beat 4)
  const showAct2 = s.value(0);
  const partialStep = s.value(0); // 0, 1, 2, 3

  // Act 3: 3D 16-byte parameter monolith (Beat 6b)
  const showAct3 = s.value(0);
  const showTotal16 = s.value(0);
  const showQuestion = s.value(0);

  const bgAura = aura(120, 0, 680, '#6ee7b71e', '#60a5fa14');

  const title1 = heroTitle(['Controlled Runs', '& Quality Gates'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: COSMOS.emerald,
    eyebrow: 'SAME GPU · SAME DATA · SAME SEEDS',
  });
  const title2 = heroTitle(['Intermediate', 'Partial Sums'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: COSMOS.rose,
    eyebrow: 'KERNEL ACCUMULATION PRECISION',
  }).opacity(0);
  const title3 = heroTitle(['16 Bytes Per', 'Parameter'], {
    x: -855,
    y: -445,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.gold,
    eyebrow: 'NEXT LESSON · FSDP & ZERO',
  }).opacity(0);

  // 3D 16-byte Adam parameter monolith (4 groups x 4 radiant 1-byte prisms)
  const monoView3d = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 14.8,
    unit: 98,
    focus: [0, 0, 0.3],
  })
    .at(260, -10)
    .opacity(0);

  const groupMeta = [
    { fill: '#2259a8', edge: COSMOS.blue },
    { fill: '#a82952', edge: COSMOS.rose },
    { fill: '#b88820', edge: COSMOS.gold },
    { fill: '#6a46b8', edge: COSMOS.violet },
  ];
  const monolithPrisms = [];
  groupMeta.forEach((gm, gIdx) => {
    const gx = -3.4 + gIdx * 1.85;
    for (let b = 0; b < 4; b++) {
      const y0 = -1.2 + b * 0.64;
      monolithPrisms.push(...box3d(gx, y0, 0, 1.35, 0.48, 0.92, gm.fill, gm.edge, 0.78));
    }
  });
  monoView3d.add(...monolithPrisms);

  // Act 1: Quality-gate coordinate plane + throughput telemetry
  const act1Live = guardedDynamic(showAct1, (a) => {
    const pa = placedA.value;
    const pb = placedB.value;
    const va = verdictA.value;
    const vb = verdictB.value;
    const sw = showSpeedWinner.value;
    const rt = retestProg.value;
    const fw = finalWinner.value;

    const runs = comparisonRuns(0.92 + (qualityGates.policy - 0.92) * rt);
    const pct = (v) => `${Number((v * 100).toFixed(1))}%`;

    // Coordinate frame on left-center [-720..180] x [-210..240]
    const xL = -720;
    const xR = 180;
    const yBot = 240;
    const yTop = -210;
    const xFmt = (r) => xL + ((r - 0.974) / 0.026) * (xR - xL);
    const yPol = (r) => yBot - ((r - 0.9) / 0.06) * (yBot - yTop);

    const xGate = xFmt(qualityGates.format);
    const yGate = yPol(qualityGates.policy);

    const nodes = [
      // Qualifying upper-right translucent zone
      rect(xR - xGate, yGate - yTop, { fill: '#0f2826', stroke: null })
        .at((xGate + xR) * 0.5, (yTop + yGate) * 0.5)
        .opacity(0.65 * a),

      // Axes
      line([xL, yBot], [xR, yBot], { stroke: '#35486e', width: 3.5 }).opacity(a),
      line([xL, yBot], [xL, yTop], { stroke: '#35486e', width: 3.5 }).opacity(a),

      // Golden minimum threshold lasers
      line([xGate, yBot], [xGate, yTop], {
        stroke: COSMOS.gold,
        width: 3.5,
        dash: [8, 6],
      })
        .glow(6, COSMOS.gold)
        .opacity(a),
      line([xL, yGate], [xR, yGate], {
        stroke: COSMOS.gold,
        width: 3.5,
        dash: [8, 6],
      })
        .glow(6, COSMOS.gold)
        .opacity(a),

      txt('POLICY PASS RATE', xL, yTop - 38, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('FORMAT PASS RATE', (xL + xR) * 0.5, yBot + 96, 26, COSMOS.muted, 'mono').opacity(a),
      txt('QUALIFYING ZONE', (xGate + xR) * 0.5, yTop + 34, 26, COSMOS.emerald, 'mono').opacity(
        0.75 * a,
      ),

      // Right-hand throughput column
      txt('THROUGHPUT (EX / S)', 575, -210, 26, COSMOS.muted, 'mono').opacity(a),
      line([320, -172], [830, -172], { stroke: '#26304a', width: 2 }).opacity(a),
    ];

    // Y ticks
    for (const v of [0.9, 0.93, 0.96]) {
      nodes.push(
        txt(
          pct(v),
          xL - 22,
          yPol(v),
          26,
          v === qualityGates.policy ? COSMOS.gold : COSMOS.muted,
          'mono',
          'right',
        ).opacity(a),
      );
    }
    // X ticks
    for (const v of [0.98, 0.99, 1.0]) {
      nodes.push(
        txt(
          pct(v),
          xFmt(v),
          yBot + 42,
          26,
          v === qualityGates.format ? COSMOS.gold : COSMOS.muted,
          'mono',
        ).opacity(a),
      );
    }

    // Plot Run A & Run B with STRICT prediction withholding during Beats 1 and 5!
    const inRetestHold = rt > 0.05 && fw < 0.5;
    runs.forEach((run, idx) => {
      const vis = idx === 0 ? pa : pb;
      if (vis < 0.02) return;
      const revealed = idx === 0 ? (inRetestHold ? false : va > 0.5 || fw > 0.5) : vb > 0.5;
      const passes = passesGates(run);
      const col = revealed
        ? passes
          ? COSMOS.emerald
          : COSMOS.rose
        : idx === 0
          ? COSMOS.blue
          : COSMOS.cyan;
      const px = xFmt(run.format);
      const py = yPol(run.policy);
      const rowY = -65 + idx * 185;

      nodes.push(
        glowDot(px, py, { radius: 14, color: col, glow: 15, opacity: vis * a }),
        txt(
          `${run.name}  ${pct(run.format)} / ${pct(run.policy)}`,
          px + 24,
          py + (idx === 0 ? 40 : -36),
          28,
          col,
          'mono',
          'left',
        )
          .glow(5, col)
          .opacity(vis * a),

        // Throughput telemetry on right
        txt(`Run ${run.name}`, 330, rowY, 34, col, 'mono', 'left').opacity(vis * a),
        txt(run.speed.toLocaleString('en-US'), 820, rowY, 44, col, 'mono', 'right')
          .glow(6, col)
          .opacity(vis * a),
      );

      if (revealed) {
        nodes.push(
          txt(passes ? 'PASSES BOTH' : 'BELOW POLICY', 575, rowY + 54, 26, col, 'mono')
            .glow(5, col)
            .opacity(vis * a),
        );
      } else {
        nodes.push(
          txt('check both minimums', 575, rowY + 54, 26, COSMOS.dim, 'sans').opacity(vis * a),
        );
      }
    });

    // Bottom status / prediction prompt
    let footer;
    let footerCol;
    if (fw > 0.5) {
      footer = 'Choose A · 1,500 ex/s (on 93% line)';
      footerCol = COSMOS.emerald;
    } else if (inRetestHold) {
      footer = 'Predict: if A reaches exactly 93.0% on policy, which run do you choose?';
      footerCol = COSMOS.gold;
    } else if (sw > 0.5) {
      footer = 'Only B clears both minimums  ·  Select B at 1,300 examples/s';
      footerCol = COSMOS.emerald;
    } else {
      footer = 'Predict: A is faster, but which run meets both minimum pass rates?';
      footerCol = COSMOS.gold;
    }
    nodes.push(txt(footer, 0, 428, 30, footerCol, 'sans').glow(5, footerCol).opacity(a));

    return group(...nodes);
  });

  // Act 2: Kernel partial-sum overflow (+40000 + 40000 - 40000)
  const act2Live = guardedDynamic(showAct2, (a) => {
    const st = Math.min(3, Math.floor(partialStep.value + 0.05));
    const fp16Val = PARTIAL_FP16_STEPS[st];
    const fp32Val = PARTIAL_FP32_STEPS[st];
    const cols = [-360, 110, 580];

    const nodes = [txt('INPUT STREAM', -810, -210, 26, COSMOS.muted, 'mono', 'left').opacity(a)];
    PARTIAL_INPUTS.forEach((v, idx) => {
      const done = idx < st;
      nodes.push(
        glowDot(cols[idx], -210, {
          radius: 18,
          color: done ? COSMOS.gold : COSMOS.dim,
          glow: done ? 12 : 4,
          opacity: a,
        }),
        txt(
          `${v > 0 ? '+' : ''}${v.toLocaleString('en-US')}`,
          cols[idx],
          -264,
          32,
          done ? COSMOS.gold : COSMOS.muted,
          'mono',
        ).opacity(a),
      );
    });

    const lanes = [
      {
        name: 'FP16 ACCUMULATOR',
        y: -5,
        val: fp16Val,
        steps: PARTIAL_FP16_STEPS,
        col: COSMOS.rose,
      },
      {
        name: 'FP32 ACCUMULATOR',
        y: 205,
        val: fp32Val,
        steps: PARTIAL_FP32_STEPS,
        col: COSMOS.cyan,
      },
    ];
    for (const ln of lanes) {
      nodes.push(txt(ln.name, -810, ln.y, 32, ln.col, 'mono', 'left').glow(6, ln.col).opacity(a));
      for (let i = 0; i < 3; i++) {
        const done = i < st;
        const val = ln.steps[i + 1];
        if (i > 0) {
          nodes.push(
            glowingTrail(
              [
                [cols[i - 1] + 55, ln.y],
                [cols[i] - 55, ln.y],
              ],
              { color: done ? ln.col : COSMOS.dim, width: 4, glow: 8, opacity: a },
            ),
          );
        }
        nodes.push(
          glowDot(cols[i], ln.y, {
            radius: 16,
            color: done ? ln.col : COSMOS.dim,
            glow: done ? 14 : 4,
            opacity: a,
          }),
          txt(done ? fmtVal(val) : '?', cols[i], ln.y + 58, 34, done ? ln.col : COSMOS.dim, 'mono')
            .glow(done ? 7 : 0, ln.col)
            .opacity(a),
        );
      }
    }

    nodes.push(
      txt(
        st >= 3
          ? 'Final 40,000 fits FP16, yet intermediate 80,000 overflowed FP16 irreversibly'
          : 'Watch the intermediate sum cross FP16 ceiling (65,504)',
        0,
        420,
        28,
        st >= 3 ? COSMOS.rose : COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Act 3: 3D 16-byte parameter monolith telemetry overlay (Beat 6b)
  const act3Live = guardedDynamic(showAct3, (a) => {
    const t16 = showTotal16.value;
    const qw = showQuestion.value;

    const nodes = [
      txt('FP32 ADAM STATE FOR 1 PARAMETER', 260, -385, 26, COSMOS.gold, 'mono')
        .glow(5, COSMOS.gold)
        .opacity(a),

      // Left clean vertical legend (no boxed cards!)
      glowDot(-835, -165, { radius: 10, color: COSMOS.blue, glow: 12, opacity: a }),
      txt('Weight · 4 B (FP32)', -805, -165, 30, COSMOS.blue, 'mono', 'left').opacity(a),

      glowDot(-835, -85, { radius: 10, color: COSMOS.rose, glow: 12, opacity: a }),
      txt('Gradient · 4 B (FP32)', -805, -85, 30, COSMOS.rose, 'mono', 'left').opacity(a),

      glowDot(-835, -5, { radius: 10, color: COSMOS.gold, glow: 12, opacity: a }),
      txt('Adam m · 4 B (FP32)', -805, -5, 30, COSMOS.gold, 'mono', 'left').opacity(a),

      glowDot(-835, 75, { radius: 10, color: COSMOS.violet, glow: 12, opacity: a }),
      txt('Adam v · 4 B (FP32)', -805, 75, 30, COSMOS.violet, 'mono', 'left').opacity(a),
    ];

    if (t16 > 0.05) {
      nodes.push(
        txt('TOTAL STATIC STATE', -855, 195, 26, COSMOS.muted, 'mono', 'left').opacity(t16 * a),
        txt('16 bytes', -855, 272, 68, COSMOS.gold, 'mono', 'left')
          .glow(10, COSMOS.gold)
          .opacity(t16 * a),
      );
    }

    if (qw > 0.05) {
      nodes.push(
        txt('Which worker holds those bytes?  →  FSDP & ZeRO', 260, 420, 34, COSMOS.emerald, 'sans')
          .glow(8, COSMOS.emerald)
          .opacity(qw * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title1, title2, title3, monoView3d, act1Live, act2Live, act3Live);
  runPhase(s, c, phase, 20);

  // Beat 0: Place A & B
  c.on('place-a', () => s.play(placedA.to(1, { duration: 0.45 })));
  c.on('place-b', () => s.play(placedB.to(1, { duration: 0.45 })));

  // Beat 2: Quality verdicts (after Beat 1 prediction hold!)
  c.after('quality-a', () =>
    s.play(verdictA.to(1, { duration: remainDuration(c, 'quality-a', 0.35, 0.35, true) })),
  );
  c.after('quality-b', () =>
    s.play(verdictB.to(1, { duration: remainDuration(c, 'quality-b', 0.35, 0.35, true) })),
  );
  c.after('quality-speed', () =>
    s.play(
      showSpeedWinner.to(1, { duration: remainDuration(c, 'quality-speed', 0.35, 0.35, true) }),
    ),
  );

  // Beat 4: Transition to kernel partial-sum overflow
  c.on('partial-inputs', () => {
    s.play(
      par(
        showAct1.to(0, { duration: 0.2 }),
        fade(title1, 0, { duration: 0.2 }),
        delay(showAct2.to(1, { duration: 0.25 }), 0.22),
        delay(fade(title2, 1, { duration: 0.25 }), 0.22),
      ),
    );
  });
  c.on('partial-first', () => s.play(partialStep.to(1, { duration: 0.45 })));
  c.on('partial-second', () => s.play(partialStep.to(2, { duration: 0.45 })));
  c.on('partial-final', () => s.play(partialStep.to(3, { duration: 0.45 })));

  // Beat 5: Return to Act 1 scatter & glide A onto 93% line (winner withheld until Beat 6!)
  c.onBeat(5, () => {
    s.play(
      par(
        showAct2.to(0, { duration: 0.2 }),
        fade(title2, 0, { duration: 0.2 }),
        delay(showAct1.to(1, { duration: 0.25 }), 0.22),
        delay(fade(title1, 1, { duration: 0.25 }), 0.22),
      ),
    );
  });
  c.on('policy-retest', () => s.play(retestProg.to(1, { duration: 0.85 })));

  // Beat 6a: Reveal A as winner
  c.after('final-selection', () =>
    s.play(finalWinner.to(1, { duration: remainDuration(c, 'final-selection', 0.35, 0.35, true) })),
  );

  // Beat 6b: Transition to 3D 16-byte parameter monolith finale!
  c.on('state-ownership', () => {
    const orbitDur = remainDuration(c, 'state-ownership', 6.5, 0.45);
    s.play(
      par(
        showAct1.to(0, { duration: 0.2 }),
        fade(title1, 0, { duration: 0.2 }),
        delay(showAct3.to(1, { duration: 0.25 }), 0.22),
        delay(fade(title3, 1, { duration: 0.25 }), 0.22),
        delay(fade(monoView3d, 1, { duration: 0.3 }), 0.22),
        delay(
          monoView3d.orbit({ theta: -0.22, phi: 0.9 }, { duration: Math.max(0.4, orbitDur - 0.3) }),
          0.24,
        ),
      ),
    );
  });
  c.on('byte-total', () =>
    s.play(showTotal16.to(1, { duration: remainDuration(c, 'byte-total', 0.45) })),
  );
  c.on('which-worker', () =>
    s.play(showQuestion.to(1, { duration: remainDuration(c, 'which-worker', 0.45) })),
  );
}
