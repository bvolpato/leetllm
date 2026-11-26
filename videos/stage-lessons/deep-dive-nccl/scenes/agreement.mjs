// Scene 04: A communicator executes an ordered group program (Seq 0 all agree -> Seq 1 Rank 2 calls broadcast instead of all-gather -> hang -> repair).
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

export default function agreement(s, c) {
  const phase = s.value(0);
  // step: 0=agreed seq0, 1=seq1 mismatch on R2, 2=repaired seq1
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#fb71851c', '#6ee7b718');
  const title = heroTitle(['A Communicator Runs', 'an Ordered Program'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.good,
    eyebrow: 'PER-RANK CALL SEQUENCE · HANG VS AGREEMENT',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const rankCols = [ROLE.r0, ROLE.r1, ROLE.r2, ROLE.r3];

    const nodes = [
      txt('SEQ 0 (OP, COUNT, DTYPE)', -240, -215, 26, COSMOS.muted, 'mono'),
      txt('SEQ 1 (NEXT COLLECTIVE)', 380, -215, 26, st === 1 ? ROLE.bad : ROLE.good, 'mono'),
    ];

    for (let r = 0; r < 4; r++) {
      const y = -118 + r * 98;
      const isBad = st === 1 && r === 2;
      nodes.push(
        txt(`Rank ${r}`, -760, y, 28, rankCols[r], 'mono'),
        glassCell(-240, y, 560, 74, ROLE.good, { fill: '#0e2422', glow: 5 }),
        txt('AllReduce(4, fp32, sum)', -240, y, 26, ROLE.good, 'mono'),
        glassCell(380, y, 560, 74, isBad ? ROLE.bad : st >= 1 ? ROLE.good : COSMOS.dim, {
          fill: isBad ? '#2e1222' : st >= 1 ? '#0e2422' : '#0a0f1c',
          glow: isBad ? 12 : st >= 1 ? 6 : 1,
        }),
        txt(
          isBad ? 'Broadcast(4, fp32)  MISMATCH!' : st >= 1 ? 'AllGather(4, fp32)' : 'pending...',
          380,
          y,
          26,
          isBad ? ROLE.bad : st >= 1 ? ROLE.good : COSMOS.dim,
          'mono',
        ),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-760 + u * 1520, 290, { radius: 6, color: st === 1 ? ROLE.bad : ROLE.good }),
      txt(
        st === 1
          ? 'Healthy links still hang! Compare earliest rank log divergence before blaming the network'
          : st >= 2
            ? 'Repairing the collective restores progress; CUDA streams cannot fix mismatched ops'
            : 'Every rank must enter compatible ops, counts, and dtypes in identical sequence order',
        0,
        365,
        28,
        st === 1 ? ROLE.bad : ROLE.good,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['agreement-communicator', 0],
    ['agreement-ordered', 0],
    ['nc-agreement-b0-s0', 0],
    ['nc-agreement-b0-s1', 0],
    ['nc-agreement-b0-s2', 0],
    ['nc-agreement-b0-s3', 0],
    ['agreement-mismatch', 1],
    ['agreement-compare', 1],
    ['nc-agreement-b1-s0', 1],
    ['nc-agreement-b1-s1', 1],
    ['nc-agreement-b1-s2', 1],
    ['nc-agreement-b1-s3', 1],
    ['agreement-repair', 2],
    ['agreement-agreed', 2],
    ['nc-agreement-b2-s0', 2],
    ['nc-agreement-b2-s1', 2],
    ['nc-agreement-b2-s2', 2],
  ]);
}
