// Scene 09: Shorten depth while balancing forwarding work (3D Double Binary Tree: Tree A internal R0/R1 + Tree B internal R2/R3; Algorithms & Simple/LL/LL128 protocols).
import {
  COSMOS,
  ROLE,
  aura,
  buildDoubleTree3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function doubleTree(s, c) {
  const phase = s.value(0);
  // step: 0..3=double binary tree complementary leaves, 4..8=algo+proto selection & LL128 warning
  const step = s.value(0);

  const bgAura = aura(450, 25, 540, '#5ce1e61e', '#ffd16618');
  const { view: tree3d } = buildDoubleTree3d(phase, { x: 475, y: 25, unit: 92 });

  const title = heroTitle(['Double Trees Cut Depth', '& Balance Links'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.comm,
    eyebrow: 'O(LOG k) HOPS · ALGORITHMS & PROTOCOLS',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;

    const nodes = [
      txt('3D COMPLEMENTARY DOUBLE TREE', 475, -390, 26, ROLE.comm, 'mono').glow(5, ROLE.comm),
      txt('Cyan Tree A (int R0,R1) · Gold Tree B (int R2,R3)', 475, 405, 26, COSMOS.gold, 'mono'),

      glassCell(-420, -110, 860, 200, ROLE.comm, { fill: '#0e212e', glow: st < 4 ? 10 : 4 }),
      txt('COMPLEMENTARY DOUBLE BINARY TREE', -420, -172, 28, ROLE.comm, 'mono'),
      txt('Half payload on Tree A · half payload on Tree B', -420, -112, 26, COSMOS.ink, 'mono'),
      txt('No rank is internal on both -> balanced bandwidth', -420, -54, 26, ROLE.good, 'sans'),

      glassCell(-420, 145, 860, 224, st >= 7 ? ROLE.bad : st >= 4 ? COSMOS.gold : COSMOS.dim, {
        fill: st >= 7 ? '#2b1220' : st >= 4 ? '#221b0f' : '#0a0f1c',
        glow: st >= 4 ? 9 : 2,
      }),
      txt(
        'NCCL ALGORITHM × PROTOCOL MATRIX',
        -420,
        74,
        28,
        st >= 4 ? COSMOS.gold : COSMOS.dim,
        'mono',
      ),
      txt(
        'Algos: Ring · Tree · CollNet · NVLS · PAT',
        -420,
        132,
        26,
        st >= 4 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ),
      txt(
        'Protos: Simple · LL · LL128 (hardware-gated!)',
        -420,
        184,
        26,
        st >= 6 ? ROLE.comm : COSMOS.dim,
        'mono',
      ),
      txt(
        st >= 7
          ? 'WARNING: forcing LL128 on unsupported HW corrupts!'
          : 'Restore automatic selection after testing',
        -420,
        232,
        26,
        st >= 7 ? ROLE.bad : COSMOS.muted,
        'sans',
      ),

      txt(
        'Tree depth grows as O(log k) instead of 2(k-1), slashing small-message startup latency',
        -855,
        345,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];
    return group(...nodes);
  });

  s.add(bgAura, tree3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, tree3d, { theta: -0.2, phi: 0.9 });
  wireStepCues(s, c, step, [
    ['nc-double-tree-b0-s0', 0],
    ['nc-double-tree-b0-s1', 1],
    ['nc-double-tree-b0-s2', 2],
    ['nc-double-tree-b0-s3', 3],
    ['nc-double-tree-b1-s0', 4],
    ['nc-double-tree-b1-s1', 5],
    ['nc-double-tree-b1-s2', 6],
    ['nc-double-tree-b1-s3', 7],
    ['nc-double-tree-b1-s4', 8],
  ]);
}
