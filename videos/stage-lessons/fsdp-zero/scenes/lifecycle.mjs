// Scene 09: Follow one FSDP unit through a training step: Gather fwd -> reshard (keep acts) -> Gather bwd -> Reduce-scatter -> local update.
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function lifecycle(s, c) {
  const phase = s.value(0);
  // step: 0=fwd gather, 1=reshard + saved acts, 2=bwd gather + RS grads, 3=local optimizer update
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61e', '#6ee7b716');
  const title = heroTitle(['One FSDP Unit', 'Through a Step'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.comm,
    eyebrow: 'FULL_SHARD LIFECYCLE · FORWARD → BACKWARD → STEP',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const st = Math.round(step.value);
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const stages = [
      { name: '1. All-Gather', sub: 'materialize W', x: -640, col: ROLE.weights },
      { name: '2. Fwd + Reshard', sub: 'free W, keep Act', x: -215, col: ROLE.act },
      { name: '3. Bwd Gather + RS', sub: 're-gather W → G shard', x: 215, col: ROLE.grads },
      { name: '4. Local Adam', sub: 'update owned shard', x: 640, col: ROLE.good },
    ];

    const nodes = [];
    stages.forEach((sg, i) => {
      const active = st === i;
      const done = st > i;
      nodes.push(
        glassCell(sg.x, -110, 370, 138, active ? sg.col : done ? ROLE.comm : COSMOS.dim, {
          fill: active ? '#14223a' : '#0b101d',
          glow: active ? 11 * pulse : 0,
        }),
        txt(sg.name, sg.x, -140, 28, active ? sg.col : COSMOS.muted, 'mono'),
        txt(sg.sub, sg.x, -86, 26, active ? COSMOS.ink : COSMOS.dim, 'sans'),
      );
    });

    // Live residency meters below (Weights, Saved Activations, Gradient Shard)
    const wLevel = st === 0 || st === 2 ? 1.0 : 0.25;
    const actLevel = st === 1 || st === 2 ? 0.85 : 0.1;
    const gLevel = st === 2 ? 0.75 : st === 3 ? 0.35 : 0.08;

    const meters = [
      {
        label: 'Weights on GPU',
        lvl: wLevel,
        col: ROLE.weights,
        note: wLevel > 0.5 ? 'FULL unit' : '1/N shard',
        y: 78,
      },
      {
        label: 'Saved Activations',
        lvl: actLevel,
        col: ROLE.act,
        note: actLevel > 0.5 ? 'LIVE until bwd' : 'freed',
        y: 172,
      },
      {
        label: 'Gradient Shard',
        lvl: gLevel,
        col: ROLE.grads,
        note: st === 3 ? 'updating shard' : st === 2 ? 'reduce-scatter' : 'idle',
        y: 266,
      },
    ];

    meters.forEach((m) => {
      const barW = Math.max(48, m.lvl * 760);
      nodes.push(
        txt(m.label, -810, m.y, 26, m.col, 'mono', 'left'),
        rect(barW, 44, { fill: m.col, stroke: null, radius: 8 })
          .at(-430 + barW * 0.5, m.y)
          .glow(8, m.col)
          .opacity(0.86),
        txt(m.note, -430 + barW + 24, m.y, 26, COSMOS.ink, 'mono', 'left'),
      );
    });

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('lifecycle-b1-1', () => s.play(step.to(0, { duration: 0.4 })));
  c.on('lifecycle-b2-1', () => s.play(step.to(1, { duration: 0.45 })));
  c.on('lifecycle-b2-2', () => s.play(step.to(1.8, { duration: 0.45 })));
  c.on('lifecycle-b3-1', () => s.play(step.to(2, { duration: 0.45 })));
  c.on('lifecycle-b3-2', () => s.play(step.to(3, { duration: 0.45 })));
}
