// Scene 23: wrap - The arrival window has closed
// Signature 6-request Benchmark Receipt Clock parked at 2.0 s cutoff (with r06 pulsing open)
// for viewer prediction, then sweeping through drain to 2.5 s -> 3/6 qualified, 1.2/s receipt.
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SERVING_COHORT,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  radialGauge,
  receiptClockNodes,
  servingReceipt,
  txt,
} from '../parts.mjs';

export default function wrap(s, c) {
  const phase = s.value(0);
  const openHi = s.value(0); // highlights r06 still open at 2.0 s
  const drainProg = s.value(0); // 0 = 2000 ms, 1 = 2500 ms (after wrap-drain starts)
  const receiptLit = s.value(0); // wrap-receipt

  const receipt = servingReceipt();
  const cutoff = 2000;

  const header = cinemaHeader('BENCHMARK RECEIPT CLOCK', 'The arrival window', 'has closed', {
    x: -860,
    y: -435,
    accent: ROLE.drain,
    size: 50,
  });

  const stageAura = aura(120, 15, 680, '#fb923c1a', '#6ee7b718');

  const clockView = guardedDynamic(
    () => 1,
    () => {
      const dp = drainProg.value;
      const rl = receiptLit.value;
      const pulse = 0.72 + 0.28 * Math.sin(phase.value * 4.8);
      const untilMs = cutoff + dp * (receipt.horizon - cutoff);
      const drained = dp >= 0.96;

      const nodes = [
        // Top-right radial receipt gauge
        radialGauge(
          700,
          -325,
          92,
          drained ? receipt.attainment : 0.6,
          drained ? ROLE.qualified : ROLE.drain,
          { width: 10, glow: 11, markerFrac: 0.95 },
        ),
        txt(
          drained ? '3 / 6' : '5 + 1?',
          700,
          -335,
          38,
          drained ? ROLE.qualified : ROLE.drain,
          'mono',
        ).glow(7, drained ? ROLE.qualified : ROLE.drain),
        txt(drained ? '50% QUAL' : '1 OPEN', 700, -290, 26, COSMOS.muted, 'mono'),

        // Signature 6-request Benchmark Receipt Clock
        ...receiptClockNodes(SERVING_COHORT, {
          xLeft: -680,
          xRight: 440,
          topY: -165,
          spacing: 66,
          windowEnd: cutoff,
          horizon: receipt.horizon,
          until: untilMs,
          showOutcomes: true,
          highlightId: openHi.value > 0.2 && !drained ? 'r06' : null,
        }),
      ];

      // Bottom band: prediction prompt -> drained tally -> final 1.2/s receipt
      if (rl > 0.15) {
        nodes.push(
          txt('QUALIFIED COHORT RATE', -580, 316, 26, COSMOS.muted, 'mono').opacity(rl),
          txt('3 / 2.5 s = 1.2 /s', -580, 376, 44, ROLE.qualified, 'mono')
            .glow(8, ROLE.qualified)
            .opacity(rl),
          txt('SUSTAINED CAPACITY', 460, 316, 26, COSMOS.muted, 'mono').opacity(rl),
          txt('UNMEASURED (needs sweep)', 460, 376, 32, ROLE.burst, 'mono')
            .glow(6, ROLE.burst)
            .opacity(rl),
          txt(
            'Keep clocks, judgments, workload, model, server, client & hardware versions with the receipt',
            0,
            448,
            26,
            COSMOS.muted,
            'sans',
          ).opacity(rl),
        );
      } else if (drained) {
        nodes.push(
          txt('6 OFFERED', -560, 356, 38, ROLE.open, 'mono').glow(6, ROLE.open),
          txt('5 SUCCESSFUL', 0, 356, 38, COSMOS.ink, 'mono'),
          txt('3 QUALIFIED', 560, 356, 38, ROLE.qualified, 'mono').glow(7, ROLE.qualified),
          txt(
            'r03 missed TTFT  ·  r05 failed quality  ·  r06 timed out at 2.5 s',
            0,
            426,
            26,
            COSMOS.muted,
            'sans',
          ),
        );
      } else {
        nodes.push(
          txt(
            '6 OFFERED AT 2.0 s CUTOFF  ·  r06 IS STILL OPEN',
            0,
            336,
            30,
            ROLE.drain,
            'mono',
          ).glow(6, ROLE.drain),
          txt(
            'PREDICT: If we write the report now, whose experience disappears?',
            0,
            406,
            30,
            ROLE.focus,
            'mono',
          )
            .glow(7, ROLE.focus)
            .opacity(pulse),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, clockView);
  driftValue(s, c, phase, 7, { startOffset: 0.1, endMargin: 0.5 });

  c.on('wrap-window', () => {
    const t = c.cue('wrap-window').start;
    s.play(openHi.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('wrap-drain', () => {
    const t = c.cue('wrap-drain').start;
    s.play(drainProg.to(1, { duration: clampDur(c, t, 1.05) }));
  });
  c.on('wrap-receipt', () => {
    const t = c.cue('wrap-receipt').start;
    s.play(receiptLit.to(1, { duration: clampDur(c, t, 0.4) }));
  });
}
