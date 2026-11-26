// Scene 17: What did the attention check establish? (CPU SDPA parity, all-masked NaN, wrong inverse map)
import { delay, par } from 'vizmatic/stage';
import {
  ATTENTION_CPU_FIXTURE,
  COSMOS,
  CPU_HEAD0_WEIGHTS,
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

export default function kernelDiagnostics(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const showParity = s.value(0);

  const showPart2 = s.value(0);
  const showAllMasked = s.value(0);
  const showRestored = s.value(0);

  const showPart3 = s.value(0);
  const showWrongMap = s.value(0);

  const bgAura = aura(0, 20, 620, '#18336626', '#3d1e5414');

  // Beat 1: Real 4x4 head-0 causal attention weights from ATTENTION_CPU_FIXTURE
  const part1 = guardedDynamic(showPart1, (a) => {
    const pr = showParity.value;
    const cell = 114;
    const gap = 10;
    const gx0 = -640;
    const gy0 = -135;

    const nodes = [
      heroTitle(['What Did the Attention', 'Check Establish?'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.cyan,
        eyebrow: '2-HEAD CPU FORWARD TEST · MANUAL MASK vs PYTORCH SDPA',
      }).opacity(a),
      txt(
        'HEAD 0 CAUSAL WEIGHTS (FUTURE = 0.00)',
        gx0 - 50,
        gy0 - 78,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
    ];

    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 4; col++) {
        const w = CPU_HEAD0_WEIGHTS[r][col];
        const allowed = col <= r;
        const cx = gx0 + col * (cell + gap);
        const cy = gy0 + r * (cell + gap);
        const fill = !allowed ? '#0d101b' : w > 0.45 ? '#164652' : '#11263c';
        const stroke = !allowed ? '#26304a' : w > 0.45 ? COSMOS.gold : COSMOS.cyan;
        nodes.push(
          rect(cell, cell, { fill, stroke, width: 2, radius: 8 })
            .at(cx, cy)
            .opacity((allowed ? 0.95 : 0.45) * a),
          txt(
            allowed ? w.toFixed(2) : '0',
            cx,
            cy + 2,
            28,
            allowed ? COSMOS.ink : COSMOS.dim,
            'mono',
          ).opacity(a),
        );
      }
    }

    // Right column: show comparison setup from Beat 1 start so canvas stays balanced, light up agreement on cue
    const rx = 310;
    const prOp = Math.max(0.38, pr);
    nodes.push(
      txt('FORWARD OUTPUT AGREEMENT (DROPOUT OFF)', rx, -195, 26, COSMOS.emerald, 'mono').opacity(
        prOp * a,
      ),
      txt(
        pr > 0.3
          ? `max |manual - SDPA| = ${ATTENTION_CPU_FIXTURE.maxAbsoluteDifference.toExponential(2)}`
          : 'Manual causal mask  vs  PyTorch SDPA',
        rx,
        -120,
        32,
        pr > 0.3 ? COSMOS.emerald : COSMOS.cyan,
        'mono',
      )
        .glow(pr > 0.3 ? 7 : 3, pr > 0.3 ? COSMOS.emerald : COSMOS.cyan)
        .opacity(prOp * a),
      txt(
        '· Tests forward parity only (backward tests gradients)',
        rx - 380,
        -10,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(prOp * a),
      txt(
        '· Profile eligible CUDA run for backend, memory & time',
        rx - 380,
        52,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(prOp * a),
      txt(
        '· FlashAttention skips HBM score grid; FLOPs stay O(T^2)',
        rx - 380,
        114,
        28,
        COSMOS.gold,
        'sans',
        'left',
      ).opacity(prOp * a),
    );

    return group(...nodes);
  });

  // Beat 2: All-masked row -> NaN vs restoring >= 1 finite key
  const part2 = guardedDynamic(showPart2, (a) => {
    const am = showAllMasked.value;
    const rs = showRestored.value;
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 4.2);

    const isFixed = rs > 0.5;
    const rowScores = isFixed ? ['0.0', '-inf', '-inf', '-inf'] : ['-inf', '-inf', '-inf', '-inf'];
    const rowCol = isFixed ? COSMOS.emerald : COSMOS.rose;

    const nodes = [
      heroTitle(['Isolating Nonfinite', 'Forward Tensors'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: rowCol,
        eyebrow: 'EMPTY ATTENTION ROW DIAGNOSTIC · BEFORE GRADIENT CLIPPING',
      }).opacity(a),
      txt(
        'KEEP POSITIONS, NORM, DROPOUT, SHIFT & MASK FIXED',
        -830,
        -182,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
    ];

    const amOp = Math.max(0.75, am);
    rowScores.forEach((sc, idx) => {
      const cx = -610 + idx * 240;
      const ok = isFixed && idx === 0;
      const cellCol = am < 0.05 ? COSMOS.muted : ok ? COSMOS.emerald : COSMOS.rose;
      nodes.push(
        glassCell(cx, -50, 210, 96, cellCol, {
          fill: am < 0.05 ? '#12182b' : ok ? '#0e2824' : '#291018',
          glow: am < 0.05 ? 2 : ok ? 9 : 7 * pulse,
          opacity: amOp * a,
        }),
        txt(am < 0.05 ? `k${idx}` : sc, cx, -48, 36, cellCol, 'mono').opacity(amOp * a),
      );
    });

    nodes.push(
      glowingArc([226, -50], [348, -50], -28, {
        color: am < 0.05 ? COSMOS.muted : rowCol,
        width: 4,
        opacity: amOp * a,
      }),
      glassCell(560, -50, 400, 114, am < 0.05 ? COSMOS.muted : rowCol, {
        fill: am < 0.05 ? '#12182b' : isFixed ? '#0d2623' : '#2b1018',
        glow: am < 0.05 ? 2 : 10 * pulse,
        opacity: amOp * a,
      }),
      txt('SOFTMAX OUTPUT', 560, -82, 26, COSMOS.muted, 'mono').opacity(amOp * a),
      txt(
        am < 0.05 ? 'awaiting mask' : isFixed ? '[1.0, 0, 0, 0]' : 'NaN  (invalid!)',
        560,
        -28,
        am < 0.05 ? 30 : 38,
        am < 0.05 ? COSMOS.muted : rowCol,
        'mono',
      )
        .glow(am < 0.05 ? 2 : 8, am < 0.05 ? COSMOS.muted : rowCol)
        .opacity(amOp * a),
      txt(
        am < 0.05
          ? 'Check masked score row'
          : isFixed
            ? 'At least one finite score restores valid probabilities -> check first nonfinite tensor before clipping'
            : 'No finite score in row -> forward output is already NaN',
        0,
        135,
        28,
        am < 0.05 ? COSMOS.muted : rowCol,
        'sans',
      ).opacity(amOp * a),
      txt(
        'Very low loss + gibberish? Run the shift check and future-input probe (not clipping).',
        0,
        228,
        28,
        COSMOS.gold,
        'sans',
      ).opacity(Math.max(0.45, rs) * a),
    );

    return group(...nodes);
  });

  // Beat 3: Wrong inverse vocabulary map silently decoding valid gibberish
  const part3 = guardedDynamic(showPart3, (a) => {
    const wm = showWrongMap.value;
    const wmOp = Math.max(0.75, wm);
    const nodes = [
      heroTitle(['Valid Decode,', 'Wrong Inverse Map'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.rose,
        eyebrow: 'CHECKPOINT ROW-ORDER AUDIT · ISOLATING FAILURE CAUSES',
      }).opacity(a),

      glassCell(-580, -30, 320, 124, COSMOS.gold, { fill: '#251e0e', glow: 7, opacity: a }),
      txt('SAMPLED LOCAL', -580, -60, 26, COSMOS.muted, 'mono').opacity(a),
      txt('ID 1', -580, -6, 46, COSMOS.gold, 'mono').opacity(a),

      // Correct map
      glowingArc([-415, -55], [-60, -135], -30, { color: COSMOS.emerald, width: 3.8, opacity: a }),
      glassCell(260, -135, 620, 102, COSMOS.emerald, { fill: '#0e2624', glow: 7, opacity: a }),
      txt('Saved map:  1 -> GPT-2 461 -> "ak"', 260, -133, 30, COSMOS.emerald, 'mono').opacity(a),

      // Wrong map slot (pre-framed before cue, illuminated on wrong-inverse)
      glowingArc([-415, -5], [-60, 85], 30, {
        color: wm < 0.05 ? COSMOS.muted : COSMOS.rose,
        width: 3.8,
        opacity: wmOp * a,
      }),
      glassCell(260, 85, 620, 102, wm < 0.05 ? COSMOS.muted : COSMOS.rose, {
        fill: wm < 0.05 ? '#12182b' : '#291018',
        glow: wm < 0.05 ? 2 : 8,
        opacity: wmOp * a,
      }),
      txt(
        wm < 0.05 ? 'Alt map:  1 -> ? (audit row)' : 'Wrong map:  1 -> GPT-2  11 -> ","',
        260,
        87,
        30,
        wm < 0.05 ? COSMOS.muted : COSMOS.rose,
        'mono',
      ).opacity(wmOp * a),
      glowDot(-780, 250, {
        radius: 6,
        color: wm < 0.05 ? COSMOS.cyan : COSMOS.gold,
        opacity: wmOp * a,
      }),
      txt(
        'Both decode cleanly -> verify checkpoint row order · pre-update loss drift? Check weights & batch first',
        -745,
        252,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(wmOp * a),
    ];

    return group(...nodes);
  });

  s.add(bgAura, part1, part2, part3);
  runPhase(s, c, phase, 16);

  c.on('kernel-diagnostics-1', () => s.play(phase.to(1.2, { duration: 0.4 })));
  c.on('cpu-attention-check', () => s.play(showParity.to(1, { duration: 0.55 })));

  c.on('kernel-diagnostics-2', () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.16)),
    );
  });
  c.on('invalid-mask', () => s.play(showAllMasked.to(1, { duration: 0.5 })));
  c.on('first-finite', () => s.play(showRestored.to(1, { duration: 0.55 })));

  c.on('kernel-diagnostics-3', () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.16)),
    );
  });
  c.on('wrong-inverse', () =>
    s.play(showWrongMap.to(1, { duration: remainDuration(c, 'wrong-inverse', 0.55) })),
  );
}
