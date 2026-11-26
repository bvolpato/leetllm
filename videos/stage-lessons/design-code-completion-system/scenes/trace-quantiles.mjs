// Scene 15: trace-quantiles - Compute the percentile from complete request rows
// 20-row counterexample from completeTraceQuantiles(): Row 1 (100+1=101), Row 2 (1+100=101),
// Rows 3..20 (1+1=2) -> rank-19 p95 of complete rows = 101 ms vs summing stage p95s = 1 + 1 = 2 ms!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  TRACE_Q,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function traceQuantiles(s, c) {
  const phase = s.value(0);
  const rowsOn = s.value(0);
  const p95On = s.value(0);

  const header = cinemaHeader(
    'END-TO-END TRACE QUANTILES',
    'Compute p95 from',
    'complete request rows',
    {
      x: -860,
      y: -445,
      accent: ROLE.fail,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#f43f5e16', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const rw = rowsOn.value;
      const p9 = p95On.value;
      const nodes = [];

      // Left: 20-Row Request Trace Table
      const lx = -840;
      nodes.push(
        txt('20 REQUEST ROWS (STAGE A + STAGE B = TOTAL)', lx, -195, 26, ROLE.ed, 'mono', 'left'),
        txt(
          'Row  1:   100 ms  +    1 ms  =  101 ms   (slow A)',
          lx,
          -130,
          26,
          ROLE.fail,
          'mono',
          'left',
        ),
        txt(
          'Row  2:     1 ms  +  100 ms  =  101 ms   (slow B)',
          lx,
          -75,
          26,
          ROLE.warn,
          'mono',
          'left',
        ),
        txt(
          'Row 3..20:  1 ms  +    1 ms  =    2 ms   (18 fast)',
          lx,
          -20,
          26,
          ROLE.ok,
          'mono',
          'left',
        ),
        txt(
          `Nearest-rank p95 on 20 rows -> rank ${TRACE_Q.rank} (2nd largest!)`,
          lx,
          55,
          26,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(0.45 + rw * 0.55),
      );

      // Right: Correct Row-Sum p95 (101 ms) vs Broken Column-Sum p95 (2 ms!)
      const rx = 140;
      const pAlpha = 0.4 + p9 * 0.6;
      nodes.push(
        line([75, -210], [75, 130], { stroke: '#2c3d66', width: 2.5 }),
        txt('CORRECT: SORT ROW TOTALS', rx, -175, 26, ROLE.ok, 'mono', 'left').opacity(pAlpha),
        txt(
          `Rank 19 of [2..2, 101, 101] = ${TRACE_Q.complete} ms!`,
          rx,
          -118,
          28,
          ROLE.ok,
          'mono',
          'left',
        )
          .glow(p9 > 0.4 ? 8 : 0, ROLE.ok)
          .opacity(pAlpha),

        txt('BROKEN: SUM STAGE p95s', rx, -20, 26, ROLE.fail, 'mono', 'left').opacity(pAlpha),
        txt('p95(A) = 1 ms  ·  p95(B) = 1 ms', rx, 34, 26, COSMOS.ink, 'mono', 'left').opacity(
          pAlpha,
        ),
        txt(
          `1 + 1 = ${TRACE_Q.stageSum} ms  (50x UNDERESTIMATE!)`,
          rx,
          90,
          28,
          ROLE.fail,
          'mono',
          'left',
        )
          .glow(p9 > 0.4 ? 8 : 0, ROLE.fail)
          .opacity(pAlpha),
      );

      nodes.push(
        txt('WORKSHEET SUMS', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Immediate: 183 ms · Debounced: 333 ms', 480, -378, 26, COSMOS.muted, 'mono', 'center'),
        line([-840, 195], [840, 195], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'Slow stages belonged to DIFFERENT requests: only complete row traces capture real tail latency!',
          0,
          275,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.fail,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.2);

  c.on('cc-rank19', () => {
    s.play(rowsOn.to(1, { duration: clampDur(c, c.cue('cc-rank19').start, 0.35) }));
  });
  c.on('cc-complete101', () => {
    s.play(p95On.to(1, { duration: clampDur(c, c.cue('cc-complete101').start, 0.4) }));
  });
}
