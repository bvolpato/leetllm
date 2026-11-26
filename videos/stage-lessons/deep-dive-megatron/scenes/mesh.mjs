// Scene 05: A rank is a coordinate in several communication groups (64-rank mesh: Rank 3 TP=[0,1,2,3], PP=[3,35] stride 32, DP=[3,11,19,27] stride 8).
import {
  COSMOS,
  ROLE,
  aura,
  buildMegatronMesh3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  meshGroup,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function mesh(s, c) {
  const phase = s.value(0);
  // step: 0=TP peers [0,1,2,3], 1=PP peers [3,35], 2=PP stride 32, 3=DP peers [3,11,19,27]
  const step = s.value(0);

  const bgAura = aura(450, 25, 540, '#60a5fa20', '#6ee7b718');
  const { view: mesh3d } = buildMegatronMesh3d(step, phase, { x: 475, y: 25, unit: 92 });

  const title = heroTitle(['One Rank Joins', 'Four Peer Groups'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.tp,
    eyebrow: '64-RANK MESH · TP · PP · DP · CP GROUPS',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const tpPeers = meshGroup(3, 'tp');
    const ppPeers = meshGroup(3, 'pp');
    const dpPeers = meshGroup(3, 'dp');

    const groups = [
      {
        k: 'TENSOR (TP, stride 1)',
        v: `[ ${tpPeers.join(', ')} ]`,
        d: 'Cooperate inside layer GEMMs',
        col: ROLE.tp,
        hi: st < 1,
      },
      {
        k: 'PIPELINE (PP, stride 32)',
        v: `[ ${ppPeers.join(', ')} ]`,
        d: 'Distant global IDs across stages',
        col: ROLE.pp,
        hi: st >= 1 && st < 3,
      },
      {
        k: 'DATA (DP, stride 8)',
        v: `[ ${dpPeers.join(', ')} ]`,
        d: 'Independent batches, same shard',
        col: ROLE.dp,
        hi: st >= 3,
      },
    ];

    const nodes = [
      txt('3D PARALLEL AXIS PEER LINKS', 475, -390, 26, ROLE.tp, 'mono').glow(5, ROLE.tp),
      txt('SP reuses TP peers (adds NO world-size factor)', 475, 405, 26, COSMOS.gold, 'mono'),
      txt('RANK 3 GROUPS IN 64-GPU WORLD (TP4·CP2·DP4·PP2)', -420, -225, 26, COSMOS.muted, 'mono'),
    ];

    groups.forEach((g, i) => {
      const y = -125 + i * 145;
      nodes.push(
        glassCell(-420, y, 860, 120, g.hi ? g.col : COSMOS.dim, {
          fill: g.hi ? '#122038' : '#0a0f1c',
          glow: g.hi ? 10 : 2,
        }),
        txt(g.k, -820, y - 24, 26, g.hi ? g.col : COSMOS.muted, 'mono', 'left'),
        txt(g.v, -20, y - 24, 28, g.hi ? COSMOS.gold : COSMOS.dim, 'mono', 'right'),
        txt(g.d, -820, y + 28, 26, g.hi ? COSMOS.ink : COSMOS.dim, 'sans', 'left'),
      );
    });

    nodes.push(
      txt(
        'Each collective runs inside the specific group that owns its data; launcher maps logical ranks to HW',
        -855,
        345,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, mesh3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, mesh3d, { theta: -0.2, phi: 0.9 });
  wireStepCues(s, c, step, [
    ['mesh-rank-three-peers', 0],
    ['mesh-pipeline-peers', 1],
    ['mesh-pipeline-stride', 2],
    ['mesh-data-peers', 3],
  ]);
}
