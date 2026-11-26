// Scene 14: What happens on the seventh collective? Mismatch hang (all-reduce vs all-gather) -> 5 collective catalog -> replay call #7 matched.
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function processGroups(s, c) {
  const phase = s.value(0);
  // mode: 0=call7 mismatch, 1=stalled, 2=all-reduce, 3=reduce-scatter, 4=all-gather, 5=all-to-all, 6=broadcast, 7=replay fixed, 8=returned [11,22]
  const mode = s.value(0);

  const bgAura = aura(0, 20, 620, '#fb71851c', '#5ce1e618');
  const title = heroTitle(['What Happens on the', 'Seventh Collective?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.bad,
    eyebrow: 'C10D PROCESS GROUPS · COLLECTIVE CATALOG',
  });

  const live = guardedDynamic(1, () => {
    const m = Math.round(mode.value);
    const p = phase.value;

    const specs = {
      0: {
        head: 'CALL #7 · BRANCH MISMATCH',
        r0: 'all_reduce([1, 2])',
        r1: 'all_gather([10, 20])',
        res0: 'waiting...',
        res1: 'waiting...',
        col: ROLE.bad,
      },
      1: {
        head: 'CALL #7 · DEADLOCK / STALL!',
        r0: 'all_reduce([1, 2])',
        r1: 'all_gather([10, 20])',
        res0: 'STALLED (timeout)',
        res1: 'STALLED (timeout)',
        col: ROLE.bad,
      },
      2: {
        head: '1. ALL-REDUCE (SUM)',
        r0: 'input: [1, 2]',
        r1: 'input: [10, 20]',
        res0: 'output: [11, 22]',
        res1: 'output: [11, 22]',
        col: ROLE.good,
      },
      3: {
        head: '2. REDUCE-SCATTER (SUM)',
        r0: 'input: [1, 2]',
        r1: 'input: [10, 20]',
        res0: 'output: [11]',
        res1: 'output: [22]',
        col: ROLE.copy,
      },
      4: {
        head: '3. ALL-GATHER',
        r0: 'input: [1, 2]',
        r1: 'input: [10, 20]',
        res0: '[1, 2, 10, 20]',
        res1: '[1, 2, 10, 20]',
        col: ROLE.orig,
      },
      5: {
        head: '4. ALL-TO-ALL',
        r0: 'input: [1, 2]',
        r1: 'input: [10, 20]',
        res0: 'output: [1, 10]',
        res1: 'output: [2, 20]',
        col: ROLE.grad,
      },
      6: {
        head: '5. BROADCAST (FROM RANK 0)',
        r0: 'input: [1, 2]',
        r1: 'input: [10, 20]',
        res0: 'output: [1, 2]',
        res1: 'output: [1, 2]',
        col: ROLE.trans,
      },
      7: {
        head: 'REPLAY CALL #7 · MATCHED',
        r0: 'all_reduce(SUM, [1,2])',
        r1: 'all_reduce(SUM, [10,20])',
        res0: 'syncing...',
        res1: 'syncing...',
        col: ROLE.good,
      },
      8: {
        head: 'CALL #7 COMPLETED!',
        r0: 'all_reduce(SUM, [1,2])',
        r1: 'all_reduce(SUM, [10,20])',
        res0: 'output: [11, 22]',
        res1: 'output: [11, 22]',
        col: ROLE.good,
      },
    };
    const sp = specs[Math.max(0, Math.min(8, m))];

    const nodes = [
      txt(sp.head, 0, -218, 30, sp.col, 'mono').glow(6, sp.col),

      // Rank 0 card
      glassCell(-430, -52, 740, 232, ROLE.orig, { fill: '#0f1d36', glow: 8 }),
      txt('RANK 0  (ProcessGroup)', -430, -126, 28, ROLE.orig, 'mono'),
      txt(sp.r0, -430, -56, 32, COSMOS.ink, 'mono'),
      txt(sp.res0, -430, 14, 30, sp.col, 'mono'),

      // Rank 1 card
      glassCell(430, -52, 740, 232, ROLE.copy, { fill: '#0e212e', glow: 8 }),
      txt('RANK 1  (ProcessGroup)', 430, -126, 28, ROLE.copy, 'mono'),
      txt(sp.r1, 430, -56, 32, COSMOS.ink, 'mono'),
      txt(sp.res1, 430, 14, 30, sp.col, 'mono'),

      // Bottom checklist strip (NCCL vs Gloo + hang debug)
      glassCell(0, 185, 1520, 132, m >= 7 ? ROLE.good : COSMOS.muted, {
        fill: '#10182b',
        glow: m >= 7 ? 8 : 2,
      }),
      txt(
        m >= 7
          ? 'Compare per-rank logs at first disagreeing call · check group, order, op, shapes, dtypes'
          : 'All ranks in a group must enter the same collective in the same order',
        0,
        158,
        26,
        COSMOS.ink,
        'sans',
      ),
      txt(
        'CUDA backend: NCCL   ·   CPU backend: Gloo   ·   Set timeout & isolate 2-rank reproducer',
        0,
        214,
        26,
        COSMOS.gold,
        'mono',
      ),
    ];

    const u = (p * 0.65) % 1;
    nodes.push(glowDot(-760 + u * 1520, 315, { radius: 6, color: sp.col }));

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('other-call', () => s.play(mode.to(0, { duration: 0.25 })));
  c.on('stalled', () => s.play(mode.to(1, { duration: remainDuration(c, 'stalled', 0.35) })));
  c.on('reduce-both', () =>
    s.play(mode.to(2, { duration: remainDuration(c, 'reduce-both', 0.35) })),
  );
  c.on('scatter-sum', () =>
    s.play(mode.to(3, { duration: remainDuration(c, 'scatter-sum', 0.35) })),
  );
  c.on('gather-slices', () =>
    s.play(mode.to(4, { duration: remainDuration(c, 'gather-slices', 0.35) })),
  );
  c.on('exchange-slices', () =>
    s.play(mode.to(5, { duration: remainDuration(c, 'exchange-slices', 0.35) })),
  );
  c.on('broadcast-zero', () =>
    s.play(mode.to(6, { duration: remainDuration(c, 'broadcast-zero', 0.35) })),
  );
  c.on('same-branch', () =>
    s.play(mode.to(7, { duration: remainDuration(c, 'same-branch', 0.35) })),
  );
  c.after('returned-sum', () =>
    s.play(mode.to(8, { duration: remainDuration(c, 'returned-sum', 0.35) })),
  );
}
