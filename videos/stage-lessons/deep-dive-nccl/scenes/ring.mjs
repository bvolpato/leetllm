// Scene 06: Follow slot 2 around the ring (3D 4-GPU NVLink Ring: R3 3000 -> R0 +3=3003 -> R1 +30=3033 -> hold! -> R2 +300=3333 owner!).
import {
  COSMOS,
  ROLE,
  aura,
  buildNcclRing3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  ringPartial,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function ring(s, c) {
  const phase = s.value(0);
  // step: 0=R3(3000), 1=hop0->R0, 2=add0(3003), 3=hop1->R1, 4=add1(3033), 5=ask who remains, 6=hop2->R2, 7=add2(3333), 8=owner R2
  const step = s.value(0);

  const bgAura = aura(450, 25, 540, '#5ce1e620', '#ffd16618');
  const { view: ring3d } = buildNcclRing3d(step, phase, { x: 475, y: 25, unit: 94 });

  const title = heroTitle(['Follow Slot 2', 'Around the Ring'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.comm,
    eyebrow: 'RING REDUCE-SCATTER · 3 CLOCKWISE HOPS',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const hopsDone = st >= 7 ? 3 : st >= 4 ? 2 : st >= 2 ? 1 : 0;
    const snap = ringPartial(hopsDone);

    const hops = [
      { label: 'START · Rank 3', val: '3000', done: true, col: ROLE.r3 },
      {
        label: 'HOP 1 · Rank 0 (+3)',
        val: st >= 2 ? '3003' : 'in flight...',
        done: st >= 2,
        col: ROLE.r0,
      },
      {
        label: 'HOP 2 · Rank 1 (+30)',
        val: st >= 4 ? '3033' : 'waiting...',
        done: st >= 4,
        col: ROLE.r1,
      },
      {
        label: 'HOP 3 · Rank 2 (+300)',
        val: st >= 7 ? '3333 (OWNER)' : '?',
        done: st >= 7,
        col: ROLE.good,
      },
    ];

    const nodes = [
      txt('3D 4-GPU NVLINK RING', 475, -390, 26, ROLE.comm, 'mono').glow(5, ROLE.comm),
      txt(
        st >= 7 ? 'Slot 2 complete (3333) on owner Rank 2' : `Running partial sum: ${snap.value}`,
        475,
        405,
        26,
        st >= 7 ? ROLE.good : COSMOS.gold,
        'mono',
      ),
    ];

    hops.forEach((h, i) => {
      const y = -162 + i * 108;
      nodes.push(
        glassCell(-430, y, 820, 86, h.done ? h.col : COSMOS.dim, {
          fill: h.done ? '#121f35' : '#0a0f1c',
          glow: h.done ? 9 : 1,
        }),
        txt(h.label, -805, y, 28, h.done ? h.col : COSMOS.muted, 'mono', 'left'),
        txt(h.val, -55, y, 30, h.done ? COSMOS.gold : COSMOS.dim, 'mono', 'right'),
      );
    });

    nodes.push(
      txt(
        st >= 7
          ? 'Reduce-scatter finishes on Rank 2 (owner of slot 2); other 3 slots travel in parallel'
          : st >= 5
            ? 'Predict: R3, R0, and R1 are in the sum (3033); which rank still contributes?'
            : 'Each hop adds one rank contribution without any central bottleneck',
        -855,
        345,
        28,
        st >= 7 ? ROLE.good : COSMOS.gold,
        'sans',
        'left',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, ring3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, ring3d, { theta: -0.2, phi: 0.9 });
  wireStepCues(s, c, step, [
    ['ring-hop-0', 1],
    ['ring-add-0', 2, true],
    ['ring-hop-1', 3],
    ['ring-add-1', 4, true],
    ['ring-whose', 5],
    ['ring-hop-2', 6],
    ['ring-add-2', 7, true],
    ['ring-owner', 8],
  ]);
}
