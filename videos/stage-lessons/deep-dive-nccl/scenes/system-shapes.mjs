// Scene 18: Choose the measurement from the traffic shape (DP buckets, FSDP RS+AG, TP small per-layer AR, PP send/recv, EP uneven all-to-all; framework owns layouts & schedules).
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

export default function systemShapes(s, c) {
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61e', '#a78bfa18');
  const title = heroTitle(['Match Measurement', 'to Traffic Shape'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.comm,
    eyebrow: 'DP · FSDP · TP · PP · EP WORKLOAD REGIMES',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;

    const shapes = [
      {
        k: 'DATA PARALLEL (DP)',
        d: 'Large gradient buckets -> link bandwidth & overlap',
        col: ROLE.r0,
        hi: st === 0 || st >= 7,
      },
      {
        k: 'FSDP / ZeRO-3',
        d: 'Reduce-scatter grads + all-gather parameter views',
        col: ROLE.comm,
        hi: st === 1,
      },
      {
        k: 'TENSOR PARALLEL (TP)',
        d: 'Small per-layer reductions -> launch & hop latency',
        col: COSMOS.gold,
        hi: st === 2 || st === 6 || st === 7,
      },
      {
        k: 'PIPELINE / EXPERT (PP/EP)',
        d: 'Peer stage sends & skewed MoE all-to-all tokens',
        col: ROLE.r3,
        hi: st === 3 || st === 4,
      },
    ];

    const nodes = [
      txt(
        'FRAMEWORK OWNS GROUPS, LAYOUTS & OVERLAP · NCCL MOVES BYTES',
        0,
        -225,
        26,
        COSMOS.gold,
        'mono',
      ),
    ];

    shapes.forEach((sh, i) => {
      const y = -125 + i * 102;
      nodes.push(
        glassCell(0, y, 1460, 82, sh.hi ? sh.col : COSMOS.dim, {
          fill: sh.hi ? '#122038' : '#0b101d',
          glow: sh.hi ? 10 : 2,
        }),
        txt(sh.k, -695, y, 26, sh.hi ? sh.col : COSMOS.muted, 'mono', 'left'),
        txt(sh.d, -220, y, 26, sh.hi ? COSMOS.ink : COSMOS.dim, 'sans', 'left'),
      );
    });

    nodes.push(
      txt(
        'Count operations at EVERY message size in your trace before picking bandwidth vs latency tuning',
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
    ['nc-system-shapes-b0-s0', 0],
    ['nc-system-shapes-b0-s1', 1],
    ['nc-system-shapes-b0-s2', 2],
    ['nc-system-shapes-b0-s3', 3],
    ['nc-system-shapes-b0-s4', 4],
    ['nc-system-shapes-b1-s0', 5],
    ['nc-system-shapes-b1-s1', 6],
    ['nc-system-shapes-b1-s2', 7],
    ['nc-system-shapes-b1-s3', 8],
  ]);
}
