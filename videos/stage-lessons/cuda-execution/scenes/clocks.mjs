// Scene 11: Which clock can we stop? Host enqueue vs CUDA event stream interval vs synchronized host clock, plus warmup isolation.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  TICKET_CLOCK,
  TOKEN_VALUES,
  afterDuration,
  aura,
  buildDualClockNodes,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  txt,
  warmupTrace,
} from '../parts.mjs';

export default function clocks(s, c) {
  const showPart1 = s.value(1); // Beats 0 & 1: Ticket 102 dual clocks
  const clockTime = s.value(0);
  const hostWaiting = s.value(0);
  const showStreamInt = s.value(0);
  const showHostInt = s.value(0);

  const showPart2 = s.value(0); // Beat 2: Separate warmup + 2 warmed samples
  const warmupTime = s.value(0);

  const bgAura = aura(0, 10, 560, '#5ce1e622', '#60a5fa18');

  const title = heroTitle(['CUDA Events,', 'Host Clocks, and Warmup'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.cyan,
    eyebrow: 'HONEST TIMING · TICKET 102 REPLAY',
  });

  const part1 = guardedDynamic(showPart1, (a) => {
    const t = clockTime.value;
    const { nodes: clockNodes, run } = buildDualClockNodes({
      clock: TICKET_CLOCK,
      time: t,
      ticks: [0, 10, 20, 30, 40, 50],
      x0: -600,
      x1: 790,
      hostY: 44,
      streamY: 194,
      waiting: hostWaiting.value > 0.5,
      showStreamInterval: showStreamInt.value > 0.5,
      showHostInterval: showHostInt.value > 0.5,
      alpha: a,
    });

    const nodes = [
      txt('GPU INPUT ROW · TICKET 102', -855, -225, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
    ];
    TOKEN_VALUES.forEach((v, i) => {
      const cx = -735 + i * 210;
      nodes.push(
        glassCell(cx, -158, 176, 68, COSMOS.cyan, { fill: '#0e1d2e', glow: 5, opacity: a }),
        txt(`T${i}: ${v}`, cx, -155, 28, COSMOS.ink, 'mono').opacity(a),
      );
    });

    nodes.push(...clockNodes);

    // Caller log strip at bottom
    const rep = showHostInt.value > 0.5 && run.reported;
    nodes.push(
      glassCell(0, 372, 1660, 108, rep ? COSMOS.emerald : COSMOS.blue, {
        fill: '#0e1628',
        glow: 8,
        opacity: a,
      }),
      txt('CALLER LOG · TICKET 102', -790, 344, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt(
        `GPU events: ${showStreamInt.value > 0.5 ? '40 ms' : '?'}`,
        -790,
        392,
        34,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt(
        `Python scalar: ${rep ? run.scalar : '?'}`,
        0,
        392,
        34,
        rep ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ).opacity(a),
      txt(
        `Host total: ${rep ? `${run.hostInterval} ms` : '?'}`,
        790,
        392,
        34,
        rep ? COSMOS.gold : COSMOS.muted,
        'mono',
        'right',
      ).opacity(a),
    );
    return group(...nodes);
  });

  const part2 = guardedDynamic(showPart2, (a) => {
    const wt = warmupTime.value;
    const tr = warmupTrace(wt);
    const x0 = -730;
    const scale = 48; // 30 ms -> 1440 px

    const nodes = [
      txt(
        'SEPARATE STEADY-STATE BENCHMARK · EXCLUDE WARMUP',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
    ];

    tr.events.forEach((ev, i) => {
      const isWarmup = i === 0;
      const sx = x0 + ev.start * scale;
      const w = (ev.end - ev.start) * scale - 16;
      const frac = Math.max(0, Math.min(1, (wt - ev.start) / (ev.end - ev.start)));
      const col = isWarmup ? COSMOS.rose : COSMOS.cyan;
      const done = wt >= ev.end;
      nodes.push(
        txt(isWarmup ? 'Warmup (excluded)' : ev.id, sx + w * 0.5, -95, 30, col, 'mono').opacity(a),
        glassCell(sx + w * 0.5, 20, w, 155, col, {
          fill: '#0e1526',
          glow: done ? 8 : 0,
          dash: isWarmup ? [10, 6] : undefined,
          opacity: a,
        }),
      );
      if (frac > 0.01) {
        const fw = Math.max(8, (w - 10) * frac);
        nodes.push(
          rect(fw, 138, { fill: col, stroke: null, radius: 6 })
            .at(sx + 5 + fw * 0.5, 20)
            .opacity((isWarmup ? 0.35 : 0.72) * a),
        );
      }
      if (done) {
        nodes.push(
          txt(`${ev.end - ev.start} ms`, sx + w * 0.5, 24, 42, COSMOS.ink, 'mono').opacity(a),
        );
      }
    });

    const meanStr =
      tr.mean !== null
        ? `Warmed mean = ${tr.mean} ms  (${tr.completed} completed samples)`
        : 'Waiting for warmed samples...';
    nodes.push(
      glassCell(0, 290, 1560, 128, tr.mean !== null ? COSMOS.emerald : COSMOS.rule, {
        fill: '#0e1e26',
        glow: tr.mean !== null ? 9 : 0,
        opacity: a,
      }),
      txt(meanStr, 0, 294, 38, tr.mean !== null ? COSMOS.emerald : COSMOS.muted, 'mono')
        .glow(6, COSMOS.emerald)
        .opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, part1, part2);

  c.on('advance-enqueue', () => s.play(clockTime.to(TICKET_CLOCK.hostReturn, { duration: 0.55 })));
  c.on('continue-device', () => s.play(clockTime.to(16, { duration: 0.85 })));
  c.on('finish-device', () => {
    s.play(hostWaiting.to(1, { duration: 0.1 }));
    s.play(clockTime.to(TICKET_CLOCK.eventEnd, { duration: 0.9 }));
  });
  c.after('finish-device', () =>
    s.play(showStreamInt.to(1, { duration: afterDuration(c, 'finish-device', 0.35) })),
  );
  c.on('report-scalar', () => s.play(clockTime.to(TICKET_CLOCK.scalarAt, { duration: 0.45 })));
  c.after('report-scalar', () =>
    s.play(showHostInt.to(1, { duration: afterDuration(c, 'report-scalar', 0.35) })),
  );

  c.on('warmup-complete', () => {
    s.play(
      par(
        showPart1.to(0, { duration: 0.2 }),
        delay(showPart2.to(1, { duration: 0.25 }), 0.22),
        delay(warmupTime.to(14, { duration: 0.65 }), 0.25),
      ),
    );
  });
  c.on('warmed-samples', () =>
    s.play(warmupTime.to(30, { duration: remainDuration(c, 'warmed-samples', 1.25) })),
  );
}
