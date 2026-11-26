// Scene 12: Make the row visible before signaling.
// Mixed-fabric NVLink data write + system-scope fence + Gin barrier signal -> consumer wait -> read.
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

export default function visibilityFence(s, c) {
  const phase = s.value(0);
  const hybridMode = s.value(1);
  const fenceVal = s.value(0);
  const consumerStep = s.value(0);

  const bgAura = aura(470, 12, 500, '#ff6b8b22', '#5ce1e61c');
  const { view: rig3d } = buildFabricTopologyRig3d(hybridMode, fenceVal, phase, {
    x: 470,
    y: 12,
    unit: 92,
  });

  const title = heroTitle(['Make Writes Visible', 'Before Signaling'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.bad,
    eyebrow: 'MIXED-FABRIC ORDERING · SYSTEM-SCOPE FENCE',
    subtitle: 'Data travels over NVLink while the barrier uses a Gin signal',
  });

  const steps = [
    { name: '1. NVLink write', sub: 'data in flight', col: ROLE.rank0 },
    { name: '2. System fence', sub: 'orders prior writes', col: ROLE.bad },
    { name: '3. Gin barrier', sub: 'publishes signal', col: ROLE.rdma },
    { name: '4. Stream wait', sub: 'consumer orders read', col: ROLE.nvlink },
  ];

  const live = guardedDynamic(1, () => {
    const fenced = Math.round(fenceVal.value) >= 1;
    const ordered = Math.round(consumerStep.value) >= 1;

    const nodes = [
      txt('3D SYSTEM-SCOPE VISIBILITY FENCE', 470, -415, 26, ROLE.bad, 'mono').glow(5, ROLE.bad),
      txt(
        fenced
          ? 'Fence orders NVLink payload before Gin signal'
          : 'Without fence: address arrives while data is in flight',
        470,
        435,
        26,
        fenced ? ROLE.good : ROLE.bad,
        'mono',
      ),
    ];

    steps.forEach((st, i) => {
      const y = -102 + i * 94;
      const active = i === 0 || (i <= 2 && fenced) || ordered;
      const col = active ? st.col : COSMOS.dim;
      nodes.push(
        glassCell(-440, y, 820, 74, col, {
          fill: i === 1 && fenced ? '#2e101c' : '#0d1729',
          glow: active ? 7 : 0,
        }),
        txt(st.name, -815, y, 27, col, 'mono', 'left'),
        txt(st.sub, -55, y, 26, active ? COSMOS.ink : COSMOS.dim, 'sans', 'right'),
      );
      if (i < 3) {
        nodes.push(line([-440, y + 38], [-440, y + 54], { stroke: col, width: 3 }));
      }
    });

    nodes.push(
      glassCell(-440, 305, 820, 92, ordered ? ROLE.good : ROLE.token, {
        fill: '#0e1e26',
        glow: 6,
      }),
      txt(
        ordered
          ? 'Submitted -> Visible to peer -> Consumer ordered'
          : 'Post-V2-pin repair inserts system-scope fence',
        -440,
        305,
        26,
        ordered ? ROLE.good : ROLE.token,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-visibility-fence-b0', () =>
    s.play(fenceVal.to(1, { duration: remainDuration(c, 'de-visibility-fence-b0', 0.75) })),
  );
  c.on('de-visibility-fence-b1', () =>
    s.play(consumerStep.to(1, { duration: remainDuration(c, 'de-visibility-fence-b1', 0.75) })),
  );
}
