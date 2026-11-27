// Scene 12: Shard state inside the existing data domain (Megatron-FSDP stages + hierarchical optimizer domains).
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

export default function dataOwnership(s, c) {
  const step = s.value(0); // 0=DP repeat, 1=FSDP O/G/P sharding, 2=hierarchical domains, 3=outer replication

  const bgAura = aura(0, 15, 620, '#34d3991c', '#5ce1e618');
  const title = heroTitle(['Shard Inside the', 'Existing Data Domain'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.dp,
    eyebrow: 'MEGATRON-FSDP · OWNERSHIP WITHOUT NEW RANKS',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    const tiers = [
      {
        label: '1. Optimizer State',
        sub: 'FP32 master + Adam m, v sharded across DP peers',
        col: ROLE.tp,
        active: st >= 0,
        y: -155,
      },
      {
        label: '2. + Gradients',
        sub: 'Optimizer state + reduced grad slices sharded',
        col: ROLE.cp,
        active: st >= 1,
        y: -25,
      },
      {
        label: '3. + Parameters',
        sub: 'Full FSDP: optimizer + gradients + BF16 weights sharded',
        col: ROLE.dp,
        active: st >= 1,
        y: 105,
      },
    ];

    nodes.push(
      txt('ZERO NEW RANKS ADDED TO TP x CP x DP x PP', -235, -248, 26, COSMOS.gold, 'mono'),
    );

    tiers.forEach((t) => {
      nodes.push(
        glassCell(-235, t.y, 1140, 102, t.active ? t.col : ROLE.dim, {
          fill: t.active ? '#101d32' : '#0b101d',
          glow: t.active ? 8 : 2,
        }),
        txt(t.label, -765, t.y, 28, t.active ? t.col : COSMOS.muted, 'mono', 'left'),
        txt(t.sub, -380, t.y, 26, t.active ? COSMOS.ink : COSMOS.muted, 'sans', 'left'),
      );
    });

    // Right column: Hierarchical optimizer domains (sharding sub-domain + outer replication)
    const hierActive = st >= 2;
    nodes.push(
      glassCell(605, -25, 470, 362, hierActive ? ROLE.ep : ROLE.dim, {
        fill: hierActive ? '#1b1a14' : '#0d1322',
        glow: hierActive ? 10 : 3,
      }),
      txt('HIERARCHICAL DOMAINS', 605, -155, 26, hierActive ? ROLE.ep : COSMOS.muted, 'mono'),
      glassCell(605, -62, 410, 76, hierActive ? ROLE.dp : ROLE.dim, { fill: '#0e2422', glow: 4 }),
      txt('Inner: Sharding Group', 605, -62, 26, COSMOS.ink, 'mono'),
      glassCell(605, 34, 410, 76, st >= 3 ? ROLE.pp : ROLE.dim, { fill: '#191430', glow: 4 }),
      txt('Outer: Replicated Copies', 605, 34, 26, COSMOS.ink, 'mono'),
      txt('Dense vs Expert', 605, 118, 26, st >= 2 ? COSMOS.gold : COSMOS.muted, 'mono'),
    );

    nodes.push(
      txt(
        st >= 2
          ? 'Dense (DP x CP) and Expert parameters can have different optimizer denominators'
          : 'Ownership changes memory footprint inside the existing DP axis without adding ranks',
        0,
        305,
        28,
        COSMOS.ink,
        'sans',
      ),
      txt(
        'Inspect parameter group, CP degree, and instance count before applying a memory equation',
        0,
        365,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['mg-data-ownership-b0', 0],
    ['mg-fsdp-owned', 1],
    ['mg-data-ownership-b1', 2],
    ['mg-optimizer-domains', 3],
  ]);
}
