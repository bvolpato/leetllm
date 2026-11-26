// Scene 22: Choose the communication pattern for the split (3D Parallel Fabric + TP, PP, DP, EP, and DP-Attention != full replicas).
import {
  COSMOS,
  ROLE,
  aura,
  buildPdFabric3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function parallelAxes(s, c) {
  const phase = s.value(0);
  // step: 0=TP (dimensions + collectives), 1=PP (layers + bubbles), 2=DP (independent replicas + cache locality),
  // 3=EP (MoE tokens + all-to-all imbalance), 4=Context/SP + DP-Attention != full-model replicas
  const step = s.value(0);

  const bgAura = aura(460, 20, 560, '#60a5fa1e', '#a78bfa18');
  const { view: fabric3d } = buildPdFabric3d(step, phase, { x: 475, y: 25, unit: 90 });

  const title = heroTitle(['Match Parallel Axes', 'to Communication Cost'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.prefill,
    eyebrow: 'TP · PP · DP · EP · DP-ATTENTION',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [
      txt('3D MULTI-GPU SCALING FABRIC', 475, -390, 26, ROLE.prefill, 'mono').glow(5, ROLE.prefill),
      txt('Fitting weights does not guarantee ITL', 475, 405, 26, COSMOS.gold, 'mono'),
    ];

    const axes = [
      {
        name: 'TP (Tensor)',
        split: 'Shards weights · per-layer all-reduce',
        col: ROLE.prefill,
        hi: st === 0,
      },
      {
        name: 'PP (Pipeline)',
        split: 'Splits layers · stage sync & bubbles',
        col: ROLE.grammar,
        hi: st === 1,
      },
      {
        name: 'DP (Data)',
        split: 'Full replicas · splits local radix cache',
        col: ROLE.decode,
        hi: st === 2,
      },
      {
        name: 'EP (Expert)',
        split: 'MoE tokens · all-to-all & imbalance',
        col: ROLE.spec,
        hi: st === 3,
      },
      {
        name: 'DP-Attn / CP',
        split: 'Attn replicas + sharded MLP (!= full DP)',
        col: ROLE.radix,
        hi: st >= 4,
      },
    ];

    axes.forEach((ax, i) => {
      const y = -185 + i * 112;
      nodes.push(
        glassCell(-420, y, 860, 92, ax.hi ? ax.col : COSMOS.dim, {
          fill: ax.hi ? '#12223a' : '#0a0f1c',
          glow: ax.hi ? 10 : 2,
        }),
        txt(ax.name, -825, y, 26, ax.hi ? ax.col : COSMOS.muted, 'mono', 'left'),
        txt(ax.split, -595, y, 26, ax.hi ? COSMOS.ink : COSMOS.dim, 'sans', 'left'),
      );
    });

    const caption =
      st >= 4
        ? 'A parallel layout that fits weights in HBM can still worsen ITL when collectives dominate.'
        : 'Every axis trades memory capacity and throughput against a specific communication pattern.';

    nodes.push(txt(caption, -855, 360, 26, st >= 4 ? COSMOS.gold : COSMOS.ink, 'sans', 'left'));
    return group(...nodes);
  });

  s.add(bgAura, fabric3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, fabric3d, { theta: -0.22, phi: 0.92 });
  wireStepCues(s, c, step, [
    ['sg-parallel-axes-beat-0', 0],
    ['sg-parallel-pipeline', 1],
    ['sg-parallel-data', 2],
    ['sg-parallel-expert', 3],
    ['sg-parallel-axes-beat-1', 4],
  ]);
}
