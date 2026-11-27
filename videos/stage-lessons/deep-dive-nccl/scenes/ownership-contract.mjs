// Scene 02: Choose the collective from who needs which values (All-Reduce, Reduce, Broadcast, Reduce-Scatter, All-Gather + ncclAvg single vs double divide).
import {
  COSMOS,
  REDUCED_VEC,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function ownershipContract(s, c) {
  // step: 0..5=collective ops, 6=scaling Q, 7=avg 833.25, 8=ncclAvg, 9=double-div 208.31!, 10=objective match
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61e', '#a78bfa18');
  const title = heroTitle(['Choose the Collective', 'by Output Ownership'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.comm,
    eyebrow: 'NCCL COLLECTIVE CATALOG · NCCLAVG SCALING',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const nodes = [];

    if (st < 5.5) {
      const ops = [
        {
          k: 'ALL-REDUCE',
          d: 'Full sum [1111..4444] on ALL ranks',
          col: ROLE.good,
          active: st >= 1 && st < 2,
        },
        {
          k: 'REDUCE / BCAST',
          d: 'Reduce -> 1 root · Broadcast: root -> all',
          col: ROLE.r0,
          active: st >= 2 && st < 3,
        },
        {
          k: 'REDUCE-SCATTER',
          d: 'Diagonal: Rank r owns reduced slot r',
          col: ROLE.r2,
          active: st >= 3 && st < 4,
        },
        {
          k: 'ALL-GATHER',
          d: 'Copies each owned slot to every rank',
          col: ROLE.comm,
          active: st >= 4,
        },
      ];
      nodes.push(
        txt('FOUR FIXED INPUTS -> FIVE OWNERSHIP PATTERNS', 0, -225, 28, ROLE.comm, 'mono'),
      );
      ops.forEach((op, i) => {
        const y = -125 + i * 102;
        nodes.push(
          glassCell(0, y, 1380, 82, op.active ? op.col : COSMOS.dim, {
            fill: op.active ? '#122038' : '#0b101d',
            glow: op.active ? 10 : 1,
          }),
          txt(op.k, -640, y, 28, op.active ? op.col : COSMOS.muted, 'mono', 'left'),
          txt(op.d, -260, y, 28, op.active ? COSMOS.ink : COSMOS.dim, 'sans', 'left'),
        );
      });
    } else {
      nodes.push(
        txt(
          'SLOT 2 SCALING CONTRACT: SUM = 3,333 ACROSS 4 RANKS',
          0,
          -225,
          28,
          COSMOS.gold,
          'mono',
        ),
        glassCell(-550, 0, 480, 250, ROLE.orig, { fill: '#0f1d36', glow: 6 }),
        txt('ncclSum', -550, -76, 30, ROLE.r0, 'mono'),
        txt(String(REDUCED_VEC[2]), -550, 4, 46, COSMOS.ink, 'mono'),
        txt('Raw 4-rank sum', -550, 76, 26, COSMOS.muted, 'sans'),

        glassCell(0, 0, 480, 250, st >= 7 ? ROLE.good : COSMOS.dim, {
          fill: st >= 7 ? '#0d2924' : '#0a0f1c',
          glow: st >= 7 ? 10 : 2,
        }),
        txt('ncclAvg (DIVIDE ONCE)', 0, -76, 28, st >= 7 ? ROLE.good : COSMOS.dim, 'mono'),
        txt(
          st >= 7 ? '833.25' : '3333 / 4 = ?',
          0,
          4,
          46,
          st >= 7 ? ROLE.good : COSMOS.dim,
          'mono',
        ),
        txt('Equal-rank mean', 0, 76, 26, st >= 7 ? COSMOS.ink : COSMOS.dim, 'sans'),

        glassCell(550, 0, 480, 250, st >= 9 ? ROLE.bad : COSMOS.dim, {
          fill: st >= 9 ? '#2d1222' : '#0a0f1c',
          glow: st >= 9 ? 10 : 2,
        }),
        txt('DOUBLE DIVIDE (/4 AGAIN)', 550, -76, 26, st >= 9 ? ROLE.bad : COSMOS.dim, 'mono'),
        txt(
          st >= 9 ? '208.31!' : 'counterfactual',
          550,
          4,
          46,
          st >= 9 ? ROLE.bad : COSMOS.dim,
          'mono',
        ),
        txt('1/4 of true gradient!', 550, 76, 26, st >= 9 ? ROLE.bad : COSMOS.dim, 'sans'),
      );
    }

    nodes.push(
      txt(
        st >= 6
          ? 'Match ncclSum vs ncclAvg to your training loss scaling; never divide by world size twice'
          : 'Ownership decides the collective; every copy keeps the value its owner supplied',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['nc-ownership-contract-b0-s0', 0],
    ['nc-ownership-contract-b0-s1', 1],
    ['nc-ownership-contract-b0-s2', 2],
    ['nc-ownership-contract-b0-s3', 3],
    ['nc-ownership-contract-b0-s4', 4],
    ['nc-ownership-contract-b0-s5', 5],
    ['nc-ownership-contract-b1-s0', 6],
    ['nc-ownership-contract-b1-s1', 7],
    ['nc-ownership-contract-b1-s2', 8],
    ['nc-ownership-contract-b1-s3', 9],
    ['nc-ownership-contract-b1-s4', 10],
  ]);
}
