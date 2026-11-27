// Scene 13: request-denominator - Keep failures in the offered cohort
// Full-bleed 6-request Benchmark Receipt Clock paired with a glowing radial attainment gauge
// and non-overlapping telemetry strips comparing cohort counts, 2.5 s horizon rates, and 2.0 s offered rate.
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SERVING_COHORT,
  aura,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  radialGauge,
  receiptClockNodes,
  servingReceipt,
  txt,
} from '../parts.mjs';

export default function requestDenominator(s, c) {
  const beatMode = s.value(0); // 0 -> 1 -> 2
  const r = servingReceipt();

  const header = cinemaHeader('COHORT ACCOUNTING', 'Keep failures in the', 'offered cohort', {
    x: -860,
    y: -435,
    accent: ROLE.qualified,
    size: 50,
  });

  const stageAura = aura(120, 10, 680, '#6ee7b71a', '#5ce1e618');

  const clockView = guardedDynamic(
    () => 1,
    () => {
      const m = beatMode.value;
      const nodes = [
        // Top-right radial attainment gauge (3 / 6 = 50%)
        radialGauge(700, -325, 98, r.attainment, ROLE.qualified, {
          width: 10,
          glow: 11,
          markerFrac: 0.95,
        }),
        txt(`${Math.round(r.attainment * 100)}%`, 700, -338, 42, ROLE.qualified, 'mono').glow(
          8,
          ROLE.qualified,
        ),
        txt('3 / 6', 700, -290, 26, COSMOS.muted, 'mono'),

        // Signature 6-request Benchmark Receipt Clock
        ...receiptClockNodes(SERVING_COHORT, {
          xLeft: -680,
          xRight: 440,
          topY: -165,
          spacing: 66,
          windowEnd: 2000,
          horizon: r.horizon,
          until: r.horizon,
          showOutcomes: true,
        }),
      ];

      // Mutually exclusive bottom telemetry strips using clean half-crossfades!
      const a0 = fadeOutHalf(Math.min(1, m));
      const a1 = fadeInHalf(Math.min(1, m)) * fadeOutHalf(Math.max(0, m - 1));
      const a2 = fadeInHalf(Math.max(0, m - 1));

      if (a0 > 0.02) {
        const items = [
          { lbl: 'OFFERED', val: '6 req', col: ROLE.workload, x: -660 },
          { lbl: 'QUALIFIED', val: '3 pass', col: ROLE.qualified, x: -220 },
          { lbl: 'CRITERIA FAIL', val: '2 fail', col: ROLE.fail, x: 220 },
          { lbl: 'TIMEOUT', val: '1 drain', col: ROLE.timeout, x: 660 },
        ];
        items.forEach(({ lbl, val, col, x }) => {
          nodes.push(
            txt(lbl, x, 316, 26, COSMOS.muted, 'mono').opacity(a0),
            txt(val, x, 376, 44, col, 'mono').glow(7, col).opacity(a0),
          );
        });
      }

      if (a1 > 0.02) {
        const items = [
          { lbl: 'ATTAINMENT (3 / 6)', val: '50%', col: ROLE.qualified, x: -580 },
          { lbl: 'SUCCESS / 2.5 s', val: '2.0 /s', col: COSMOS.ink, x: 0 },
          { lbl: 'QUALIFIED / 2.5 s', val: '1.2 /s', col: ROLE.open, x: 580 },
        ];
        items.forEach(({ lbl, val, col, x }) => {
          nodes.push(
            txt(lbl, x, 316, 26, COSMOS.muted, 'mono').opacity(a1),
            txt(val, x, 376, 48, col, 'mono').glow(8, col).opacity(a1),
          );
        });
      }

      if (a2 > 0.02) {
        const items = [
          { lbl: 'ARRIVAL WINDOW', val: '2.0 s', col: ROLE.open, x: -580 },
          { lbl: 'OFFERED RATE (6 / 2 s)', val: '3.0 /s', col: ROLE.focus, x: 0 },
          { lbl: 'COHORT HORIZON', val: '2.5 s', col: ROLE.drain, x: 580 },
        ];
        items.forEach(({ lbl, val, col, x }) => {
          nodes.push(
            txt(lbl, x, 316, 26, COSMOS.muted, 'mono').opacity(a2),
            txt(val, x, 376, 48, col, 'mono').glow(8, col).opacity(a2),
          );
        });
      }

      nodes.push(
        txt(
          'Keep population, elapsed boundary, quality rule, and terminal outcomes in the receipt',
          0,
          448,
          26,
          COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, clockView);

  c.on('request-denominator-beat-1-focus-1', () => {
    const t = c.cue('request-denominator-beat-1-focus-1').start;
    s.play(beatMode.to(0.15, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('request-denominator-beat-2-focus-1', () => {
    const t = c.cue('request-denominator-beat-2-focus-1').start;
    s.play(beatMode.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.on('request-denominator-beat-3-focus-1', () => {
    const t = c.cue('request-denominator-beat-3-focus-1').start;
    s.play(beatMode.to(2, { duration: clampDur(c, t, 0.45) }));
  });
}
