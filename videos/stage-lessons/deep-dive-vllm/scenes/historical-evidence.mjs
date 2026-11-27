// Scene 05: Read the original throughput result with its denominator (2023 PagedAttention paper: 2-4x vs FT/Orca, OPT 13B/66B/175B, LLaMA 13B, GCP A2 A100, mean E2E / output length, matched modern benchmark).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function historicalEvidence(s, c) {
  // step: 0=2023 paper workloads, 1=hardware + baselines + latency metric, 2=modern matched benchmark checklist
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1a', '#ffd16616');
  const title = heroTitle(['Read the 2023 Paper', 'With Its Denominator'], {
    x: -855,
    y: -425,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'HISTORICAL EVIDENCE · PAGEDATTENTION BENCHMARK RECEIPT',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    const cards =
      st === 0
        ? [
            [
              'HEADLINE RESULT',
              '2x - 4x Higher Throughput',
              'vs FasterTransformer & Orca at comparable latency',
              COSMOS.gold,
            ],
            [
              'BASIC SAMPLING',
              'OPT 13B / 66B / 175B',
              'ShareGPT & Alpaca length distributions · Poisson arrivals',
              ROLE.r0,
            ],
            [
              'SHARED PREFIXES',
              'LLaMA 13B · WMT16',
              'Translation prompts exercising copy-on-write prefix reuse',
              ROLE.kv,
            ],
          ]
        : st === 1
          ? [
              [
                'HARDWARE & WINDOW',
                'GCP A2 · NVIDIA A100',
                '1-hour traces (15 minutes for OPT-175B)',
                ROLE.r0,
              ],
              [
                'BASELINES',
                'Custom FT + Rebuilt Orca',
                'FasterTransformer dynamic batcher; 3 Orca reservation modes',
                ROLE.r1,
              ],
              [
                'LATENCY DENOMINATOR',
                'Mean E2E / Output Length',
                'Normalized end-to-end mean (not tail p99 ITL)',
                COSMOS.gold,
              ],
            ]
          : [
              [
                'MATCH WORKLOAD',
                'Same Arrivals & Lengths',
                'Identical prompt/output traces across both servers',
                ROLE.kv,
              ],
              [
                'MATCH STACK',
                'HW · Topology · Versions',
                'Same model, dtype, sampling, warmed graphs & output checks',
                ROLE.r0,
              ],
              [
                'MEASURE & INSPECT',
                'Useful Completions + Tails',
                'Compare TTFT / ITL distributions and active runner backend',
                ROLE.good,
              ],
            ];

    cards.forEach(([eyebrow, main, sub, col], i) => {
      const cy = -140 + i * 168;
      nodes.push(
        glassCell(0, cy, 1680, 140, col, { fill: '#0f1829', glow: 8 }),
        txt(eyebrow, -800, cy - 32, 26, col, 'mono', 'left'),
        txt(main, 800, cy - 32, 32, COSMOS.ink, 'mono', 'right'),
        txt(sub, -800, cy + 26, 26, COSMOS.muted, 'sans', 'left'),
      );
    });

    nodes.push(
      txt(
        st === 0
          ? 'Keep model, trace distribution, and arrival process attached to the 2x-4x speedup'
          : st === 1
            ? 'Baseline implementation and latency normalization define what a chart actually proved'
            : 'Check the runner attention backend to identify which kernel read your paged KV blocks',
        0,
        378,
        26,
        COSMOS.gold,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['vv-historical-evidence-op-0', 0],
    ['vv-historical-evidence-op-1', 1],
    ['vv-historical-evidence-op-2', 2],
  ]);
}
