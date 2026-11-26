// Scene 18: Split weights, layers, replicas and experts deliberately (TP matrix width + collectives, PP layer depth + bubbles, DP dense replicas, EP MoE expert routing; orbiting 3D multi-GPU rack).
import {
  COSMOS,
  ROLE,
  aura,
  buildParallelFabricRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function parallelCosts(s, c) {
  const phase = s.value(0);
  // step: 0=TP (tensor), 1=PP (pipeline), 2=DP (data replicas), 3=EP (expert routing), 4=shared compatibility matrix
  const step = s.value(0);

  const bgAura = aura(460, 20, 560, '#60a5fa1c', '#ffd16618');
  const rig3d = buildParallelFabricRig3d(step, phase, { x: 475, y: 20, unit: 92 });

  const title = heroTitle(['Split Weights, Layers,', 'Replicas & Experts'], {
    x: -855,
    y: -425,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'MULTI-GPU SERVING · TP · PP · DP · EP TRADEOFFS',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [
      txt('3D MULTI-GPU PARALLELISM FABRIC', 475, -395, 26, COSMOS.gold, 'mono').glow(
        5,
        COSMOS.gold,
      ),
      txt('More GPUs expand KV fit & add collective cost', 475, 400, 26, COSMOS.muted, 'mono'),
    ];

    if (st <= 3) {
      const axes = [
        [
          'TENSOR (TP)',
          'Splits matrix widths across GPUs',
          'Adds intra-layer AllReduce; frees per-GPU KV room',
          ROLE.r0,
          st === 0,
        ],
        [
          'PIPELINE (PP)',
          'Splits layer depth across stages',
          'Frees weight memory; exposes bubbles at low load',
          ROLE.r1,
          st === 1,
        ],
        [
          'DATA (DP)',
          'Independent model replicas + cores',
          'Routes request groups; replicates dense weights',
          ROLE.good,
          st === 2,
        ],
        [
          'EXPERT (EP)',
          'Distributes MoE expert weights',
          'Routes token activations; check shared-layer owners',
          COSMOS.gold,
          st === 3,
        ],
      ];
      axes.forEach(([name, what, cost, col, active], i) => {
        const cy = -185 + i * 130;
        nodes.push(
          glassCell(-420, cy, 860, 112, active ? col : COSMOS.dim, {
            fill: active ? '#132036' : '#0b101d',
            glow: active ? 10 : 2,
          }),
          txt(name, -815, cy - 26, 26, active ? col : COSMOS.muted, 'mono', 'left'),
          txt(what, -20, cy - 26, 26, active ? COSMOS.ink : COSMOS.dim, 'mono', 'right'),
          txt(cost, -815, cy + 24, 26, active ? COSMOS.ink : COSMOS.dim, 'sans', 'left'),
        );
      });
    } else {
      const matrix = [
        ['MODEL & DTYPE', 'Architecture + quantization + backend registry support', ROLE.r0],
        [
          'SCHEDULER & CACHE',
          'Token/sequence caps + parallel groups in one shared config',
          ROLE.kv,
        ],
        [
          'MEASURED TOPOLOGY',
          'More GPUs improve fit yet can slow small-batch latency',
          COSMOS.gold,
        ],
      ];
      matrix.forEach(([k, d, col], i) => {
        const cy = -145 + i * 165;
        nodes.push(
          glassCell(-420, cy, 860, 138, col, { fill: '#101b2e', glow: 8 }),
          txt(k, -815, cy - 30, 26, col, 'mono', 'left'),
          txt(d, -815, cy + 24, 26, COSMOS.ink, 'sans', 'left'),
        );
      });
    }

    nodes.push(
      txt(
        'Keep the compatibility matrix and measured topology beside every scaling decision',
        -855,
        368,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, rig3d.view, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d.view, { theta: -0.2, phi: 0.86 });
  wireStepCues(s, c, step, [
    ['vv-parallel-costs-op-0', 0],
    ['vv-parallel-costs-tensor', 0],
    ['vv-parallel-costs-pipeline', 1],
    ['vv-parallel-costs-op-1', 2],
    ['vv-parallel-costs-data', 2],
    ['vv-parallel-costs-expert', 3],
    ['vv-parallel-costs-op-2', 4],
  ]);
}
