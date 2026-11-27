// Scene 26: Time completed work and inspect the actual blocked edge (Async enqueue vs CUDA event sync; Nsight Systems vs Compute & NCCL algbw/busbw; axis-to-symptom map).
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

export default function measuredTrace(s, c) {
  // step: 0=async enqueue, 1=CUDA event sync, 2=Nsight Sys/Compute + NCCL bw, 3=axis diagnosis, 4=TP crossing slow link
  const step = s.value(0);

  const bgAura = aura(0, 15, 620, '#5ce1e61c', '#fb718518');
  const title = heroTitle(['Time Completed Work &', 'Find the Blocked Edge'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.cp,
    eyebrow: 'CUDA EVENTS · NSIGHT SYSTEMS / COMPUTE · AXIS TRIAGE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    if (st <= 1) {
      nodes.push(
        txt(
          'FREEZE EXAMPLES, MASKS, MICROBATCH, DTYPE & CODE BEFORE BENCHMARKING',
          0,
          -232,
          26,
          COSMOS.gold,
          'mono',
        ),
        glassCell(-300, -100, 540, 108, ROLE.bad, { fill: '#2c1220', glow: 7 }),
        txt('Host Enqueue Timer (Async!)', -300, -124, 26, ROLE.bad, 'mono'),
        txt('Measures launch queue, NOT finished GPU', -300, -76, 26, COSMOS.ink, 'sans'),

        glassCell(120, 75, 1380, 130, st >= 1 ? ROLE.good : ROLE.dim, {
          fill: st >= 1 ? '#0e2624' : '#0f1628',
          glow: st >= 1 ? 10 : 4,
        }),
        txt(
          'CUDA Device-Event / Sync Boundary + Warmup + Repeated Windows',
          120,
          48,
          28,
          ROLE.good,
          'mono',
        ),
        txt(
          'Record peak memory high-water mark & slow communication tail beside step time',
          120,
          104,
          26,
          COSMOS.ink,
          'sans',
        ),
      );
    } else if (st === 2) {
      const tools = [
        { k: 'Nsight Systems', d: 'Host gaps, CUDA streams, overlap timelines', col: ROLE.tp },
        { k: 'Nsight Compute', d: 'Single kernel memory, math, occupancy', col: ROLE.cp },
        { k: 'NCCL algbw vs busbw', d: 'Always log op, payload bytes, rank count', col: ROLE.ep },
      ];
      tools.forEach((tl, i) => {
        const y = -150 + i * 155;
        nodes.push(
          glassCell(0, y, 1520, 124, tl.col, { fill: '#101d32', glow: 8 }),
          txt(tl.k, -715, y, 28, tl.col, 'mono', 'left'),
          txt(tl.d, -260, y, 28, COSMOS.ink, 'sans', 'left'),
        );
      });
    } else {
      const symptoms = [
        {
          k: 'Every layer slows (TP up)',
          d: 'TP peers crossing slow inter-node link',
          col: ROLE.bad,
          hot: st >= 4,
        },
        {
          k: 'Pipeline idle bubbles',
          d: 'Too few microbatches or stage imbalance',
          col: ROLE.pp,
          hot: st === 3,
        },
        {
          k: 'Context / Expert stalls',
          d: 'Remote KV exchange or hot-expert skew',
          col: ROLE.ep,
          hot: st === 3,
        },
        {
          k: 'FSDP / DP-opt step tail',
          d: 'Exposed reduce-scatter or all-gather tail',
          col: ROLE.dp,
          hot: st === 3,
        },
      ];
      symptoms.forEach((sy, i) => {
        const y = -185 + i * 116;
        nodes.push(
          glassCell(0, y, 1560, 96, sy.hot ? sy.col : ROLE.dim, {
            fill: sy.hot ? '#181428' : '#0c1220',
            glow: sy.hot ? 10 : 3,
          }),
          txt(sy.k, -735, y, 26, sy.hot ? sy.col : COSMOS.muted, 'mono', 'left'),
          txt(sy.d, -160, y, 26, COSMOS.ink, 'sans', 'left'),
        );
      });
    }

    nodes.push(
      txt(
        'Active warps alone never diagnose a link stall; change one causal input on a matched workload',
        0,
        360,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['mg-measured-trace-b0', 0],
    ['mg-completed-work', 1],
    ['mg-measured-trace-b1', 2],
    ['mg-measured-trace-b2', 3],
    ['mg-slow-link', 4],
  ]);
}
