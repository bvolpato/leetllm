// Scene 04: Which launches are on the clock?
// Beat 0-1: Fresh check -> 5 warmups -> [CUDA events: 100 timed launches] -> Fresh check.
// Beat 2: 5 alternating rounds across naive / tiled / padded in separate unprofiled processes.
import {
  COSMOS,
  ROLE,
  aura,
  delay,
  dot,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  par,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function timingWindow(s, c) {
  const phase = s.value(0);
  const showTimeline = s.value(1);
  const showRounds = s.value(0);

  const check1 = s.value(0);
  const warm = s.value(0);
  const batch = s.value(0);
  const check2 = s.value(0);
  const uncheck = s.value(0);
  const meanNote = s.value(0);
  const outsideNote = s.value(0);
  const gapsNote = s.value(0);
  const tailNote = s.value(0);

  const roundsProg = s.value(0);
  const allRows = s.value(0);
  const envNote = s.value(0);

  const bgAura = aura(0, 10, 640, '#5ce1e61c', '#ffd16614');
  const title = heroTitle(['Which Launches Are', 'on the Clock?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.output,
    eyebrow: 'CUDA EVENTS · BENCHMARK PROTOCOL',
  });

  // Beats 0 & 1: 4-stage launch pipeline + CUDA event bracket
  const timelineView = guardedDynamic(showTimeline, (a) => {
    const p = phase.value;
    const c1 = check1.value;
    const wm = warm.value;
    const bt = batch.value;
    const c2 = check2.value;
    const uc = uncheck.value;
    const mn = meanNote.value;
    const gp = gapsNote.value;
    const tl = tailNote.value;

    const nodes = [
      // Stage 1: Preflight check
      glassCell(-680, -35, 290, 320, c1 > 0.3 ? ROLE.input : COSMOS.rule, {
        fill: '#0f1b33',
        glow: c1 > 0.3 ? 8 : 2,
        opacity: a,
      }),
      txt('PREFLIGHT', -680, -145, 26, ROLE.input, 'mono').opacity(a),
      txt('1× poison', -680, -90, 28, COSMOS.ink, 'mono').opacity(a),
      txt(
        c1 > 0.7 ? 'Bit check ON' : 'Pending',
        -680,
        62,
        26,
        c1 > 0.7 ? ROLE.good : COSMOS.muted,
        'mono',
      ).opacity(a),

      // Stage 2: 5 warmups
      glassCell(-345, -35, 280, 320, wm > 0.3 ? ROLE.gold : COSMOS.rule, {
        fill: '#1e1a12',
        glow: wm > 0.3 ? 8 : 2,
        opacity: a,
      }),
      txt('WARMUP', -345, -145, 26, ROLE.gold, 'mono').opacity(a),
      txt('5 launches', -345, -90, 28, COSMOS.ink, 'mono').opacity(a),

      // Stage 3: 100 timed launches (inside CUDA event bracket!)
      glassCell(175, -35, 650, 320, bt > 0.3 ? ROLE.output : COSMOS.rule, {
        fill: '#0d2233',
        glow: bt > 0.3 ? 10 : 3,
        opacity: a,
      }),
      txt('TIMED BATCH (CUDA EVENTS)', 175, -145, 26, ROLE.output, 'mono').opacity(a),

      // Stage 4: Post check
      glassCell(695, -35, 290, 320, c2 > 0.3 ? ROLE.good : COSMOS.rule, {
        fill: '#0e2624',
        glow: c2 > 0.3 ? 8 : 2,
        opacity: a,
      }),
      txt('POSTFLIGHT', 695, -145, 26, ROLE.good, 'mono').opacity(a),
      txt('1× poison', 695, -90, 28, COSMOS.ink, 'mono').opacity(a),
      txt(
        c2 > 0.7 ? 'Bit check ON' : 'Pending',
        695,
        62,
        26,
        c2 > 0.7 ? ROLE.good : COSMOS.muted,
        'mono',
      ).opacity(a),
    ];

    // 5 warmup dots
    const litWarm = Math.floor(wm * 5.99);
    for (let i = 0; i < 5; i++) {
      nodes.push(
        dot(9, i < litWarm ? ROLE.gold : COSMOS.rule)
          .at(-425 + i * 40, 10)
          .opacity(a),
      );
    }

    // 100 timed launch dots (20 x 5 grid)
    const litBatch = Math.floor(bt * 100.99);
    for (let i = 0; i < 100; i++) {
      const col = i % 20;
      const row = Math.floor(i / 20);
      nodes.push(
        dot(5.2, i < litBatch ? ROLE.output : COSMOS.rule)
          .at(-100 + col * 29, -82 + row * 36)
          .opacity(a),
      );
    }

    // Glowing CUDA Event Bracket underneath Stage 3
    nodes.push(
      glowingTrail(
        [
          [-150, 148],
          [-150, 182],
          [500, 182],
          [500, 148],
        ],
        { color: ROLE.output, width: 3.6, glow: 8, opacity: (0.4 + 0.6 * bt) * a },
      ),
      txt(
        mn > 0.3 ? 'event_elapsed ÷ 100 = mean per launch' : 'cudaEventRecord(start) → stop + sync',
        175,
        228,
        28,
        ROLE.output,
        'mono',
      ).opacity(a),
    );

    if (gp > 0.3) {
      nodes.push(
        txt('Launch gaps sit INSIDE the bracket', 175, -242, 28, ROLE.gold, 'mono')
          .glow(6, ROLE.gold)
          .opacity(gp * a),
      );
    }

    // Bottom takeaway line
    let bottom = 'Only preflight and postflight run a bit check (fail → exit 2, blank timing)';
    let bottomCol = ROLE.warn;
    if (tl > 0.3) {
      bottom = 'For per-call percentiles, time individual launches · rotate buffers for cold cache';
      bottomCol = ROLE.gold;
    } else if (outsideNote.value > 0.3) {
      bottom = 'Allocation, transfers, and validation stay OUTSIDE the CUDA timer';
      bottomCol = ROLE.good;
    } else if (uc < 0.3) {
      bottom = 'Each dot represents one GPU kernel launch';
      bottomCol = COSMOS.muted;
    }
    nodes.push(txt(bottom, 0, 355, 28, bottomCol, 'sans').opacity(a));

    // Ambient pulse moving along timed bracket
    const u = (p * 0.45) % 1;
    nodes.push(glowDot(-145 + u * 640, 182, { radius: 6, color: ROLE.gold, opacity: bt * a }));

    return group(...nodes);
  });

  // Beat 2: 5 alternating rounds across separate processes
  const roundsView = guardedDynamic(showRounds, (a) => {
    const rp = roundsProg.value;
    const ar = allRows.value;
    const ev = envNote.value;
    const orders = [
      ['naive', 'tiled', 'padded'],
      ['padded', 'tiled', 'naive'],
      ['naive', 'tiled', 'padded'],
      ['padded', 'tiled', 'naive'],
      ['naive', 'tiled', 'padded'],
    ];
    const colOf = { naive: ROLE.input, tiled: ROLE.output, padded: ROLE.gold };
    const litRows = Math.ceil(rp * 5);

    const nodes = [
      txt(
        '5 ALTERNATING ROUNDS · SEPARATE UNPROFILED PROCESSES',
        0,
        -235,
        28,
        ROLE.output,
        'mono',
      ).opacity(a),
    ];

    orders.forEach((ord, r) => {
      const y = -140 + r * 92;
      const lit = r < litRows;
      nodes.push(
        txt(`Round ${r + 1}`, -720, y, 30, lit ? COSMOS.ink : COSMOS.muted, 'mono').opacity(a),
      );
      ord.forEach((name, j) => {
        const cx = -340 + j * 450;
        const col = colOf[name];
        nodes.push(
          glassCell(cx, y, 360, 66, lit ? col : COSMOS.rule, {
            fill: lit ? '#0f1c33' : '#0b101d',
            glow: lit ? 7 : 0,
            opacity: a,
          }),
          txt(name, cx, y, 30, lit ? col : COSMOS.muted, 'mono').opacity(a),
        );
      });
    });

    nodes.push(
      txt(
        ev > 0.3
          ? 'Unlocked clocks · browser + remote desktop shared this GPU · keep every raw row'
          : ar > 0.3
            ? 'Save all 5 rows per kernel · fixed shape, precision, block, and check'
            : 'Reverse order each round to expose thermal or clock drift',
        0,
        345,
        28,
        ev > 0.3 ? ROLE.warn : ROLE.output,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, timelineView, roundsView);
  runPhase(s, c, phase, 16);

  c.on('gpu-timing-window-check', () =>
    s.play(check1.to(1, { duration: remainDuration(c, 'gpu-timing-window-check', 0.45) })),
  );
  c.on('gpu-timing-window-warm', () =>
    s.play(warm.to(1, { duration: remainDuration(c, 'gpu-timing-window-warm', 0.5) })),
  );
  c.on('gpu-timing-window-batch', () =>
    s.play(batch.to(1, { duration: remainDuration(c, 'gpu-timing-window-batch', 0.9) })),
  );
  c.on('gpu-timing-window-post', () =>
    s.play(check2.to(1, { duration: remainDuration(c, 'gpu-timing-window-post', 0.45) })),
  );
  c.on('gpu-timing-window-unchecked', () =>
    s.play(uncheck.to(1, { duration: remainDuration(c, 'gpu-timing-window-unchecked', 0.4) })),
  );
  c.on('gpu-timing-window-mean', () =>
    s.play(meanNote.to(1, { duration: remainDuration(c, 'gpu-timing-window-mean', 0.45) })),
  );
  c.on('gpu-timing-window-outside', () =>
    s.play(outsideNote.to(1, { duration: remainDuration(c, 'gpu-timing-window-outside', 0.45) })),
  );
  c.on('gpu-timing-window-gaps', () =>
    s.play(gapsNote.to(1, { duration: remainDuration(c, 'gpu-timing-window-gaps', 0.45) })),
  );
  c.on('gpu-timing-window-tail', () =>
    s.play(tailNote.to(1, { duration: remainDuration(c, 'gpu-timing-window-tail', 0.45) })),
  );

  c.onBeat(2, () =>
    s.play(
      par(
        showTimeline.to(0, { duration: 0.18 }),
        delay(showRounds.to(1, { duration: 0.24 }), 0.22),
      ),
    ),
  );
  c.on('gpu-timing-window-rounds', () =>
    s.play(roundsProg.to(1, { duration: remainDuration(c, 'gpu-timing-window-rounds', 0.85) })),
  );
  c.on('gpu-timing-window-allrows', () =>
    s.play(allRows.to(1, { duration: remainDuration(c, 'gpu-timing-window-allrows', 0.45) })),
  );
  c.on('gpu-timing-window-environment', () =>
    s.play(envNote.to(1, { duration: remainDuration(c, 'gpu-timing-window-environment', 0.45) })),
  );
}
