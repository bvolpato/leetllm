// Scene 19: What does six milliseconds cost the step? 256 MiB / 6 ms -> algbw 44.74 GB/s -> *1.5 busbw 67.11 GB/s; serial 8+6=14ms vs overlapped 8+2=10ms!
import {
  ALGBW_256,
  BUSBW_256,
  COSMOS,
  OVERLAP_SERIAL,
  OVERLAP_SHIFT,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function receipt(s, c) {
  // step: 0=algbw 44.74, 1=factor 1.5, 2=busbw 67.11, 3=serial 14ms, 4=shift 4ms earlier, 5=2ms exposed, 6=step 10ms, 7=same row
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#ffd1661c', '#6ee7b718');
  const title = heroTitle(['What Does 6 ms', 'Cost the Step?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.r2,
    eyebrow: 'ALGBW VS BUSBW · SERIAL VS OVERLAPPED STEP',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    // ms [0..15] -> x in [-560, 640] (80 px/ms)
    const mx = (ms) => -560 + ms * 80;

    const nodes = [
      // Top benchmark receipt bar (stays fixed across schedules!)
      glassCell(0, -172, 1480, 114, st >= 2 ? COSMOS.gold : ROLE.comm, {
        fill: '#101d35',
        glow: st >= 7 ? 11 : 7,
      }),
      txt('ISOLATED 4-RANK BENCHMARK ROW (256 MiB / 6 ms)', 0, -202, 26, COSMOS.muted, 'mono'),
      txt(
        st >= 2
          ? `algbw = ${ALGBW_256.toFixed(2)} GB/s   ×   1.5 factor   =   busbw ${BUSBW_256.toFixed(2)} GB/s`
          : st >= 1
            ? `algbw = ${ALGBW_256.toFixed(2)} GB/s   ·   ring factor = 2(4-1)/4 = 1.5`
            : `algbw = 268,435,456 B / 0.006 s = ${ALGBW_256.toFixed(2)} GB/s`,
        0,
        -146,
        28,
        st >= 2 ? COSMOS.gold : ROLE.comm,
        'mono',
      ),

      // Shared time ruler [0..14 ms]
      line([mx(0), -64], [mx(14), -64], { stroke: COSMOS.muted, width: 2.2 }),
    ];

    [0, 4, 8, 10, 14].forEach((ms) => {
      const tx = mx(ms);
      nodes.push(
        line([tx, -74], [tx, -54], {
          stroke: ms === 10 || ms === 14 ? COSMOS.gold : COSMOS.muted,
          width: 2.2,
        }),
        txt(`${ms} ms`, tx, -94, 26, COSMOS.muted, 'mono'),
      );
    });

    // Schedule A: Serial (Compute 0..8, Comm 8..14 -> 14 ms)
    nodes.push(
      txt('SERIAL', -760, 22, 26, ROLE.bad, 'mono'),
      rect(mx(8) - mx(0), 66, { fill: '#12284a', stroke: ROLE.r0, width: 2.4, radius: 8 }).at(
        mx(4),
        22,
      ),
      txt('Compute (8 ms)', mx(4), 22, 26, ROLE.r0, 'mono'),
      rect(mx(14) - mx(8) - 4, 66, { fill: '#2e1222', stroke: ROLE.bad, width: 2.6, radius: 8 }).at(
        mx(11),
        22,
      ),
      txt('Comm 6 ms', mx(11), 22, 26, ROLE.bad, 'mono'),
      txt(`${OVERLAP_SERIAL.total} ms`, mx(14) + 28, 22, 30, ROLE.bad, 'mono', 'left'),
    );

    // Schedule B: Overlapped (Compute 0..8, Comm 4..10 -> only 2 ms exposed -> 10 ms!)
    if (st >= 4) {
      nodes.push(
        txt('OVERLAP', -760, 138, 26, ROLE.good, 'mono'),
        rect(mx(8) - mx(0), 66, { fill: '#12284a', stroke: ROLE.r0, width: 2.4, radius: 8 }).at(
          mx(4),
          138,
        ),
        txt('Compute (8 ms)', mx(4), 138, 26, ROLE.r0, 'mono'),
        rect(mx(8) - mx(4), 26, { fill: '#0e2834', stroke: ROLE.comm, width: 2.2, radius: 6 }).at(
          mx(6),
          192,
        ),
        txt('4 ms hidden', mx(6), 232, 26, ROLE.comm, 'mono'),
        rect(mx(10) - mx(8) - 4, 66, { fill: '#0d2924', stroke: ROLE.good, width: 3.0, radius: 8 })
          .at(mx(9), 138)
          .glow(10, ROLE.good),
        txt('+2 ms', mx(9), 138, 26, ROLE.good, 'mono'),
        txt(
          st >= 6 ? `${OVERLAP_SHIFT.total} ms!` : '?',
          mx(10) + 28,
          138,
          32,
          ROLE.good,
          'mono',
          'left',
        ),
      );
    }

    nodes.push(
      txt(
        st >= 6
          ? 'Identical 67.11 GB/s benchmark row -> 14 ms serial vs 10 ms overlapped (measure exposed wait!)'
          : 'busbw = algbw × 2(k-1)/k normalizes rank count; use HW counters for actual link bytes',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['receipt-algorithm', 0, true],
    ['receipt-factor', 1],
    ['receipt-bus', 2, true],
    ['receipt-serial', 3],
    ['receipt-shift', 4],
    ['nc-receipt-b2-s1', 5, true],
    ['receipt-step', 6, true],
    ['receipt-fixed', 7],
  ]);
}
