// Scene 07: Who else needs a copy? Ring All-Gather copies 3333 from R2 -> R3 -> R0 -> R1 so every rank holds [1111, 2222, 3333, 4444].
import {
  COSMOS,
  REDUCED_VEC,
  ROLE,
  aura,
  buildNcclRing3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function gather(s, c) {
  const phase = s.value(0);
  // step: 0=R2 only, 1=copy->R3, 2=2 copies, 3=copy->R0, 4=3 copies, 5=copy->R1, 6=all 4 have full vector
  const step = s.value(0);

  const bgAura = aura(450, 25, 540, '#6ee7b71e', '#5ce1e618');
  const { view: ring3d } = buildNcclRing3d(step, phase, { x: 475, y: 25, unit: 94 });

  const title = heroTitle(['Who Else Needs', 'a Copy?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'RING ALL-GATHER · SHARDS -> FULL VECTOR',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const hasSlot2 = [st >= 3, st >= 5, true, st >= 1];
    const copyCount = hasSlot2.filter(Boolean).length;
    const rankCols = [ROLE.r0, ROLE.r1, ROLE.r2, ROLE.r3];

    const nodes = [
      txt('3D ALL-GATHER RING BROADCAST', 475, -390, 26, ROLE.good, 'mono').glow(5, ROLE.good),
      txt(
        st >= 6
          ? 'All 4 ranks hold [1111, 2222, 3333, 4444]'
          : `Copies of slot 2 (3333): ${copyCount} of 4 ranks`,
        475,
        405,
        26,
        st >= 6 ? ROLE.good : COSMOS.gold,
        'mono',
      ),
    ];

    for (let r = 0; r < 4; r++) {
      const y = -162 + r * 108;
      const got = hasSlot2[r];
      nodes.push(
        glassCell(-430, y, 820, 86, got ? ROLE.good : COSMOS.dim, {
          fill: got ? '#0e2624' : '#0a0f1c',
          glow: got ? 8 : 1,
        }),
        txt(`Rank ${r}`, -805, y, 28, rankCols[r], 'mono', 'left'),
        txt(
          st >= 6
            ? `[ ${REDUCED_VEC.join(', ')} ]`
            : got
              ? `slot 2 = 3333  ${r === 2 ? '(origin)' : '(copied)'}`
              : 'waiting for copy...',
          -55,
          y,
          28,
          got ? ROLE.good : COSMOS.dim,
          'mono',
          'right',
        ),
      );
    }

    nodes.push(
      txt(
        st >= 6
          ? 'Reduce-Scatter + All-Gather = All-Reduce; sharded optimizers skip this gradient gather'
          : 'Sender keeps its own value while forwarding copies clockwise around the ring',
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

  s.add(bgAura, ring3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, ring3d, { theta: -0.2, phi: 0.9 });
  wireStepCues(s, c, step, [
    ['gather-copy-0', 1],
    ['gather-count', 2],
    ['gather-copy-1', 3],
    ['gather-count-three', 4],
    ['gather-copy-2', 5],
    ['gather-vector', 6, true],
  ]);
}
