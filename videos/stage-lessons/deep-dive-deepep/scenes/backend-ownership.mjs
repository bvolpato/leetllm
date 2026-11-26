// Scene 13: Follow the communicator into a registered device window.
// Host NCCL comm -> physical domains + Gin -> queues + signals -> symmetric mem -> window -> device ptrs.
import {
  COSMOS,
  ROLE,
  aura,
  buildFabricTopologyRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function backendOwnership(s, c) {
  const phase = s.value(0);
  const hybridMode = s.value(1);
  const fenceVal = s.value(0);
  const chainProg = s.value(0);
  const showOwners = s.value(0);

  const bgAura = aura(470, 12, 500, '#60a5fa20', '#a78bfa1c');
  const { view: rig3d } = buildFabricTopologyRig3d(hybridMode, fenceVal, phase, {
    x: 470,
    y: 12,
    unit: 92,
  });

  const title = heroTitle(['Communicator to', 'Registered Window'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.rank0,
    eyebrow: 'NCCL GIN BACKEND · OWNERSHIP & LIFETIME',
    subtitle: 'DeepEP, NCCL, and the application each own distinct resources',
  });

  const chain = [
    { label: '1. Host NCCL comm', col: ROLE.rank0 },
    { label: '2. Physical domains + Gin', col: ROLE.nvlink },
    { label: '3. Queue contexts + signals', col: ROLE.rdma },
    { label: '4. Symmetric memory window', col: ROLE.meta },
    { label: '5. Device pointers', col: ROLE.good },
  ];

  const live = guardedDynamic(1, () => {
    const isOwners = Math.round(showOwners.value) >= 1;
    const activeCount = Math.max(2, Math.min(5, Math.round(chainProg.value * 5)));

    const nodes = [
      txt('3D SYMMETRIC WINDOW & GIN DOMAINS', 470, -415, 26, ROLE.rank0, 'mono').glow(
        5,
        ROLE.rank0,
      ),
      txt(
        isOwners
          ? 'Keep comm & window alive through last consumer'
          : 'Hybrid: rail connections  ·  Direct: flat domain',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    if (!isOwners) {
      chain.forEach((step, i) => {
        const y = -112 + i * 82;
        const on = i < activeCount;
        const col = on ? step.col : COSMOS.dim;
        nodes.push(
          glassCell(-440, y, 820, 64, col, { fill: '#0d1628', glow: on ? 6 : 0 }),
          txt(step.label, -440, y, 27, col, 'mono'),
        );
        if (i < 4) {
          nodes.push(line([-440, y + 33], [-440, y + 48], { stroke: col, width: 2.5 }));
        }
      });
      nodes.push(
        txt(
          'Global rank mapping must match physical domain grouping',
          -860,
          312,
          26,
          ROLE.token,
          'sans',
          'left',
        ),
      );
    } else {
      const owners = [
        { who: 'DeepEP', owns: 'layouts, kernels, window lifecycle', col: ROLE.brand },
        { who: 'NCCL', owns: 'communicator & Gin network primitives', col: ROLE.nvlink },
        { who: 'Application', owns: 'process groups, ranks, shutdown order', col: ROLE.rank0 },
      ];
      owners.forEach((o, i) => {
        const y = -85 + i * 116;
        nodes.push(
          glassCell(-440, y, 820, 92, o.col, { fill: '#0d1729', glow: 7 }),
          txt(o.who, -815, y, 29, o.col, 'mono', 'left'),
          txt(o.owns, -55, y, 26, COSMOS.ink, 'sans', 'right'),
        );
      });
      nodes.push(
        glassCell(-440, 290, 820, 92, ROLE.bad, { fill: '#2c101a', glow: 7 }),
        txt('Never abort comm while kernels or hooks hold window', -440, 290, 26, ROLE.bad, 'mono'),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-backend-ownership-b0', () =>
    s.play(chainProg.to(1, { duration: remainDuration(c, 'de-backend-ownership-b0', 1.1) })),
  );
  c.on('de-backend-ownership-b1', () => {
    const dur = remainDuration(c, 'de-backend-ownership-b1', 0.6);
    s.play(showOwners.to(1, { duration: dur }));
    s.play(hybridMode.to(0, { duration: dur }));
  });
}
