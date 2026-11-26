// Scene 28: When does training need a mesh? (Cluster scale + topology control vs single-GPU iteration; fixed-batch replay, restart test, Compute Sanitizer).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function fitBoundary(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 0=cluster mesh fit & costs, 1=single GPU + mesh-change checklist + Compute Sanitizer

  const bgAura = aura(0, 15, 620, '#34d3991c', '#f59e0b18');
  const title = heroTitle(['When Does Training', 'Need a Mesh?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.dp,
    eyebrow: 'OPERATIONAL FIT · MESH-CHANGE VERIFICATION GATE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    nodes.push(
      glassCell(-430, -20, 760, 440, st === 0 ? ROLE.tp : ROLE.dim, {
        fill: st === 0 ? '#101f38' : '#0c1220',
        glow: st === 0 ? 10 : 4,
      }),
      txt('USE MEGATRON MESH WHEN:', -430, -182, 28, ROLE.tp, 'mono'),
      txt('Cluster scale exceeds 1 GPU memory/time', -430, -108, 26, COSMOS.ink, 'sans'),
      txt('Dense, MoE, multimodal, hybrid topologies', -430, -40, 26, COSMOS.ink, 'sans'),
      txt('You control fabric, recovery & checkpoints', -430, 28, 26, COSMOS.ink, 'sans'),
      txt('Cost: version skew & combinatorial flags', -430, 118, 26, ROLE.warn, 'mono'),

      glassCell(430, -20, 760, 440, st >= 1 ? ROLE.good : ROLE.dim, {
        fill: st >= 1 ? '#0e2524' : '#0c1220',
        glow: st >= 1 ? 10 : 4,
      }),
      txt('SINGLE GPU & CHANGE GATE:', 430, -182, 28, ROLE.good, 'mono'),
      txt('Fits 1 GPU? Iterate there without a mesh', 430, -108, 26, COSMOS.ink, 'sans'),
      txt('On mesh change: replay fixed-batch step', 430, -40, 26, COSMOS.ink, 'sans'),
      txt('Check routes, global pos, val & restart', 430, 28, 26, COSMOS.ink, 'sans'),
      txt('Kernel mem/sync bug -> Compute Sanitizer', 430, 118, 26, ROLE.cp, 'mono'),
    );

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-780 + u * 1560, 280, { radius: 6, color: ROLE.dp }),
      txt(
        'Every added parallelism axis must earn its debugging and state-mapping complexity',
        0,
        345,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 12);
  wireStepCues(s, c, step, [
    ['mg-fit-boundary-b0', 0],
    ['mg-fit-boundary-b1', 1],
  ]);
}
