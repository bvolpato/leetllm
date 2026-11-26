// Scene 26: Keep attention replicas distinct from coupled experts. Same 8 GPUs: one TP=8 replica vs four TP=2 (DP=4) replicas -> EP group spans TP x DP = 8 ranks!
import {
  COSMOS,
  ROLE,
  aura,
  buildCluster3d,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function replicaLayouts(s, c) {
  const phase = s.value(0);
  const p0 = s.value(0);
  const pPairs = s.value(0);
  const p1 = s.value(0);
  const pCopies = s.value(0);
  const p2 = s.value(0);
  const pEP = s.value(0);

  const bgAura = aura(440, 20, 560, '#60a5fa1c', '#ffd16614');
  const { view: cluster3d } = buildCluster3d(() => 0.56, phase, {
    x: 525,
    y: 35,
    unit: 88,
    gpus: 8,
    radius: 2.05,
    ringColor: COSMOS.gold,
    rankColors: [
      ROLE.gpu0,
      ROLE.gpu0,
      ROLE.gpu1,
      ROLE.gpu1,
      ROLE.expert,
      ROLE.expert,
      COSMOS.gold,
      COSMOS.gold,
    ],
  });

  const title = heroTitle(['Attention Replicas vs', 'Coupled MoE Experts'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: '1 × TP8 vs 4 × TP2 REPLICAS · EP = TP × DP COUPLING',
  });

  const pairCols = [ROLE.gpu0, ROLE.gpu1, ROLE.expert, COSMOS.gold];
  const pairFills = ['#102240', '#0e2c3a', '#21153b', '#28200f'];

  const live = guardedDynamic(1, () => {
    const pairs = pPairs.value > 0.4;
    const cop = pCopies.value > 0.4 || p1.value > 0.4;
    const ep = pEP.value > 0.4 || p2.value > 0.4;

    const nodes = [
      txt('3D 8-GPU NODE MESH', 525, -395, 26, COSMOS.gold, 'mono').glow(5, COSMOS.gold),
      txt(
        ep
          ? 'EP spans all 8 ranks (TP × DP)'
          : pairs
            ? '4 independent TP2 pairs'
            : '1 wide TP8 replica',
        525,
        420,
        26,
        ep ? ROLE.warn : COSMOS.muted,
        'mono',
      ),
      txt(
        ep
          ? 'EXPERT PARALLELISM COUPLES ALL 8 RANKS (EP = TP × DP)'
          : pairs
            ? 'FOUR TP=2 REPLICAS ON THE SAME 8 GPUS (DP = 4)'
            : 'SAME 8 PHYSICAL GPUS: 1 × TP8 vs 4 × TP2',
        -350,
        -210,
        26,
        ep ? ROLE.warn : COSMOS.gold,
        'mono',
      ),
    ];

    // EP outer coupling frame when active
    if (ep) {
      nodes.push(
        rect(1010, 412, {
          fill: '#23190b',
          stroke: ROLE.warn,
          width: 3.4,
          radius: 16,
          dash: [10, 6],
        })
          .at(-350, 22)
          .glow(10, ROLE.warn)
          .opacity(0.88),
      );
    }

    // 8 GPU cards in 2 rows x 4 cols on left side
    for (let r = 0; r < 8; r++) {
      const repIdx = Math.floor(r / 2);
      const gx = -715 + (r % 4) * 242;
      const gy = r < 4 ? -72 : 118;
      const col = pairs ? pairCols[repIdx] : ROLE.gpu0;
      const fill = pairs ? pairFills[repIdx] : '#10213d';
      nodes.push(
        glassCell(gx, gy, 218, 152, col, { fill, glow: 7 }),
        txt(`GPU ${r}`, gx, gy - 44, 26, col, 'mono'),
        txt(pairs ? `TP2 · R${repIdx}` : 'TP8', gx, gy + 2, 26, COSMOS.ink, 'mono'),
      );
      if (cop) {
        nodes.push(txt(`W${r % 2} · KV${repIdx}`, gx, gy + 44, 26, COSMOS.muted, 'mono'));
      }
    }

    const foot = ep
      ? 'Attention uses TP=2 per DP group; EP=TP×DP=8 couples all 8 ranks!'
      : cop
        ? '4 × TP2 duplicates weights & KV caches · benchmark vs TP8 on same load'
        : pairs
          ? 'With balanced traffic, 4 independent TP=2 pairs scale up to 4× one pair'
          : 'Compare 1 × TP8 vs 4 × TP2 (each pair fits)';

    nodes.push(
      glassCell(-340, 325, 1040, 82, ep ? ROLE.warn : ROLE.gpu1, {
        fill: '#10182b',
        glow: 8,
      }),
      txt(foot, -340, 325, 26, ep ? ROLE.warn : COSMOS.ink, 'sans'),
      glowDot(-820 + ((phase.value * 0.55) % 1) * 960, 415, {
        radius: 6,
        color: ep ? ROLE.warn : COSMOS.gold,
      }),
    );

    return group(...nodes);
  });

  s.add(bgAura, cluster3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, cluster3d, { theta: -0.18, phi: 0.92 });

  c.on('mp-replica-layouts-0', () =>
    s.play(p0.to(1, { duration: remainDuration(c, 'mp-replica-layouts-0', 0.35) })),
  );
  c.on('mp-replica-layouts-pairs', () =>
    s.play(pPairs.to(1, { duration: remainDuration(c, 'mp-replica-layouts-pairs', 0.55) })),
  );
  c.on('mp-replica-layouts-1', () =>
    s.play(p1.to(1, { duration: remainDuration(c, 'mp-replica-layouts-1', 0.35) })),
  );
  c.on('mp-replica-layouts-copies', () =>
    s.play(pCopies.to(1, { duration: remainDuration(c, 'mp-replica-layouts-copies', 0.5) })),
  );
  c.on('mp-replica-layouts-2', () =>
    s.play(p2.to(1, { duration: remainDuration(c, 'mp-replica-layouts-2', 0.35) })),
  );
  c.on('mp-replica-layouts-expert-group', () =>
    s.play(pEP.to(1, { duration: remainDuration(c, 'mp-replica-layouts-expert-group', 0.55) })),
  );
}
