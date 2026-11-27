// Scene 20: What did the benchmark check? all_reduce_perf -b 256M -e 256M -g 4 -n 20 -w 5 -c 1 -T 60; bytes/elems/us -> GB/s; #wrong=0; nearest-rank p99 of 20 = max!
import {
  ALGBW_256,
  COSMOS,
  PAYLOAD_256MIB,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function benchmarkContract(s, c) {
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61e', '#6ee7b718');
  const title = heroTitle(['What Did the', 'Benchmark Check?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.comm,
    eyebrow: 'NCCL-TESTS · UNIT CONVERSION · NEAREST-RANK P99',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const elems = PAYLOAD_256MIB / 4; // 67,108,864

    const nodes = [
      // Top command ribbon
      glassCell(0, -185, 1480, 96, ROLE.comm, { fill: '#0e222e', glow: st < 3 ? 10 : 4 }),
      txt(
        './all_reduce_perf -b 256M -e 256M -g 4 -w 5 -n 20 -c 1 -T 60',
        0,
        -185,
        28,
        ROLE.comm,
        'mono',
      ),

      // Left card: Bytes -> Elements -> Decimal GB/s
      glassCell(-420, 35, 760, 270, st >= 3 && st < 7 ? COSMOS.gold : ROLE.r0, {
        fill: '#0f1d36',
        glow: st >= 3 && st < 7 ? 10 : 4,
      }),
      txt('UNIT CONVERSION (256 MiB)', -420, -56, 28, COSMOS.gold, 'mono'),
      txt(
        `256 × 1024² = ${PAYLOAD_256MIB.toLocaleString()} bytes`,
        -420,
        6,
        26,
        COSMOS.ink,
        'mono',
      ),
      txt(`/ 4 B (fp32) = ${elems.toLocaleString()} elements`, -420, 60, 26, COSMOS.ink, 'mono'),
      txt(`/ 0.006 s / 1e9 = ${ALGBW_256.toFixed(2)} GB/s`, -420, 114, 28, ROLE.good, 'mono'),

      // Right card: Correctness + Nearest-rank p99
      glassCell(420, 35, 760, 270, st >= 7 ? ROLE.good : COSMOS.dim, {
        fill: st >= 7 ? '#0d2624' : '#0a0f1c',
        glow: st >= 7 ? 10 : 2,
      }),
      txt('CORRECTNESS & TAIL STATS', 420, -56, 28, st >= 7 ? ROLE.good : COSMOS.dim, 'mono'),
      txt(
        '#wrong = 0 -> out-of-place & in-place verified',
        420,
        6,
        26,
        st >= 7 ? COSMOS.ink : COSMOS.dim,
        'sans',
      ),
      txt(
        'p99 rank = ceil(0.99 × 20) = 20 (the MAX!)',
        420,
        60,
        26,
        st >= 10 ? COSMOS.gold : COSMOS.dim,
        'mono',
      ),
      txt(
        'Collect more samples to measure true tail',
        420,
        114,
        26,
        st >= 11 ? ROLE.good : COSMOS.dim,
        'sans',
      ),
    ];

    nodes.push(
      txt(
        'Warm up 5 runs, time 20+, check correctness (-c 1), and compare with real training trace lifetimes',
        0,
        345,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['nc-benchmark-contract-b0-s0', 0],
    ['nc-benchmark-contract-b0-s1', 1],
    ['nc-benchmark-contract-b0-s2', 2],
    ['nc-benchmark-contract-b1-s0', 3],
    ['nc-benchmark-contract-b1-s1', 4],
    ['nc-benchmark-contract-b1-s2', 5],
    ['nc-benchmark-contract-b1-s3', 6],
    ['nc-benchmark-contract-b2-s0', 7],
    ['nc-benchmark-contract-b2-s1', 8],
    ['nc-benchmark-contract-b2-s2', 9],
    ['nc-benchmark-contract-b2-s3', 10],
    ['nc-benchmark-contract-b2-s4', 11],
  ]);
}
