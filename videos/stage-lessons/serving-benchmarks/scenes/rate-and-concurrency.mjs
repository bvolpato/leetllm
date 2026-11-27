// Scene 5: rate-and-concurrency - Read arrival rate beside in-flight work
// Luminous 15-request periodic arrival cascade sweeping [0, 3s] with a live concurrency dial,
// glowing Little's Law MathJax equation (L = 3 * 0.9 = 2.7), and cap-vs-burst diagnostics.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  averageInFlight,
  averageResidenceMs,
  cinemaHeader,
  clampDur,
  dashedRule,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  inFlightAt,
  radialGauge,
  timeAxisNodes,
  timedArrivalsMs,
  txt,
} from '../parts.mjs';

export default function rateAndConcurrency(s, c) {
  const sweepT = s.value(0); // 0 -> 3000 ms across beat 0
  const showLittle = s.value(0); // beat 1
  const showCounters = s.value(0); // beat 2

  const header = cinemaHeader("LITTLE'S LAW CHECK", 'Arrival rate beside', 'in-flight work', {
    x: -860,
    y: -435,
    accent: ROLE.open,
    size: 50,
  });

  const stageAura = aura(150, 10, 680, '#5ce1e61c', '#ffd16618');

  const littleEq = glowTex(String.raw`L = \lambda W = 3 \times 0.9 = 2.7`, {
    x: -555,
    y: 44,
    size: 40,
    color: ROLE.focus,
    glow: 8,
  });

  const cascadeView = guardedDynamic(
    () => 1,
    () => {
      const nowMs = sweepT.value;
      const lit = showLittle.value;
      const cnt = showCounters.value;
      const activeCount = inFlightAt(nowMs);

      const xLeft = -120;
      const xRight = 830;
      const minMs = -1000;
      const maxMs = 4600;
      const xOf = (ms) => xLeft + ((ms - minMs) / (maxMs - minMs)) * (xRight - xLeft);
      const topY = -270;
      const stepY = 36;

      const nodes = [];

      // Observation window [0, 3s] laser brackets
      const x0 = xOf(0);
      const x3 = xOf(3000);
      nodes.push(
        dashedRule(x0, topY - 24, x0, topY + 15 * stepY + 12, ROLE.open, 0.72, 2.4),
        dashedRule(x3, topY - 24, x3, topY + 15 * stepY + 12, ROLE.open, 0.72, 2.4),
        txt('[0 s, 3 s] observation window', (x0 + x3) * 0.5, topY - 46, 26, ROLE.open, 'mono'),
      );

      // 15 periodic request intervals
      timedArrivalsMs.forEach((arr, idx) => {
        const end = arr + averageResidenceMs;
        const yy = topY + idx * stepY;
        const isActive = arr <= nowMs && nowMs < end;
        const isDone = nowMs >= end;
        const col = isActive ? ROLE.focus : isDone ? ROLE.workload : '#36466b';

        nodes.push(
          glowingTrail(
            [
              [xOf(arr), yy],
              [xOf(end), yy],
            ],
            { color: col, width: isActive ? 7.2 : 4.2, glow: isActive ? 11 : 4 },
          ),
          glowDot(xOf(arr), yy, { radius: 5.0, color: ROLE.send, glow: 6 }),
          glowDot(xOf(end), yy, { radius: 4.8, color: ROLE.reply, glow: 6 }),
        );
      });

      // Live scanner playhead
      const xScan = xOf(nowMs);
      nodes.push(
        line([xScan, topY - 24], [xScan, topY + 15 * stepY + 10], {
          stroke: ROLE.focus,
          width: 3.4,
        }).glow(9, ROLE.focus),
      );

      // Bottom time axis for cascade
      nodes.push(
        ...timeAxisNodes(
          xLeft,
          xRight,
          topY + 15 * stepY + 26,
          minMs,
          maxMs,
          [-1000, 0, 1000, 2000, 3000, 4000],
          {
            format: (v) => `${v / 1000}s`,
          },
        ),
      );

      // Left column: Live concurrency radial dial
      const dialX = -560;
      const dialY = -145;
      nodes.push(
        radialGauge(dialX, dialY, 104, Math.min(1, activeCount / 4), ROLE.focus, {
          width: 10,
          glow: 11,
        }),
        txt(`${activeCount}`, dialX, dialY - 12, 48, ROLE.focus, 'mono').glow(8, ROLE.focus),
        txt('IN FLIGHT', dialX, dialY + 38, 26, COSMOS.muted, 'mono'),
        txt(
          `t = ${(nowMs / 1000).toFixed(1)} s  ·  W = 0.9 s`,
          dialX,
          dialY + 136,
          26,
          COSMOS.ink,
          'mono',
        ),
      );

      // Left bottom: Little's Law breakdown (Beat 1) -> 4-bucket counters (Beat 2)
      if (cnt > 0.3) {
        nodes.push(
          txt('REPORT SEPARATELY:', -860, 154, 26, ROLE.open, 'mono', 'left').opacity(cnt),
          txt('scheduled  ·  sent', -860, 206, 28, COSMOS.ink, 'mono', 'left').opacity(cnt),
          txt('completed  ·  still pending', -860, 258, 28, ROLE.focus, 'mono', 'left').opacity(
            cnt,
          ),
          txt(
            'Growing queue = arrivals outpace service',
            -860,
            326,
            26,
            ROLE.fail,
            'sans',
            'left',
          ).opacity(cnt),
        );
      } else if (lit > 0.2) {
        nodes.push(
          txt(
            `Integral: 8.1 req-s / 3 s = ${averageInFlight.toFixed(1)}`,
            -860,
            138,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(lit),
          txt('Cap of 2 -> throttles mean', -860, 202, 28, ROLE.fail, 'sans', 'left').opacity(lit),
          txt('Cap of 3 -> still binds bursts', -860, 258, 28, ROLE.burst, 'sans', 'left').opacity(
            lit,
          ),
        );
      } else {
        nodes.push(
          txt('Rate: arrivals / sec', -860, 138, 28, ROLE.open, 'sans', 'left'),
          txt('Concurrency: active in flight', -860, 194, 28, ROLE.focus, 'sans', 'left'),
          txt('Burstiness: arrival clustering', -860, 250, 28, ROLE.burst, 'sans', 'left'),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, cascadeView);

  c.on('rate-and-concurrency-beat-1-focus-1', () => {
    const t = c.cue('rate-and-concurrency-beat-1-focus-1').start;
    s.play(sweepT.to(3000, { duration: clampDur(c, t, 3.2) }));
  });
  c.show('rate-and-concurrency-beat-2-focus-1', littleEq);
  c.on('rate-and-concurrency-beat-2-focus-1', () => {
    const t = c.cue('rate-and-concurrency-beat-2-focus-1').start;
    s.play(showLittle.to(1, { duration: clampDur(c, t, 0.4) }));
  });
  c.on('rate-and-concurrency-beat-3-focus-1', () => {
    const t = c.cue('rate-and-concurrency-beat-3-focus-1').start;
    s.play(showCounters.to(1, { duration: clampDur(c, t, 0.4) }));
  });
}
