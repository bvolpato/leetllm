// Scene 22: Find the first differing call (Per-rank log tuples: count=3 -> step 0; root=1 -> step 1; missing -> step 1; swap -> step 0; WARN + DEBUG_LEVELS=ATTN + RAS progress).
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

export default function diagnosticEvidence(s, c) {
  // step: 0=count 3 (hold!), 1=step 0!, 2=reset, 3=root=1, 4=scan col0 OK, 5=step 1!, 6=missing->step 1, 7=swap->step 0, 8..12=WARN/ATTN/RAS/shm/restore
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#fb71851c', '#5ce1e618');
  const title = heroTitle(['Find the First', 'Differing Call'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.bad,
    eyebrow: 'PER-RANK COLLECTIVE LOGS · WARN + ATTN · RAS',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    if (st < 8) {
      const r2Step0 =
        st <= 1 ? 'AllReduce(cnt=3!)' : st === 7 ? 'Broadcast(root=0)!' : 'AllReduce(cnt=4)';
      const r2Step1 =
        st >= 3 && st <= 5
          ? 'Broadcast(root=1!)'
          : st === 6
            ? '(MISSING CALL!)'
            : st === 7
              ? 'AllReduce(cnt=4)!'
              : 'Broadcast(root=0)';
      const verdict =
        st === 0
          ? 'Predict: Rank 2 count changed 4 -> 3; which step diverges first?'
          : st === 1
            ? 'FIRST DISAGREEMENT: Step 0 (count 3 != 4)'
            : st === 2 || st === 3 || st === 4
              ? 'Step 0 matches across ranks; scanning Step 1 tuples'
              : st === 5
                ? 'FIRST DISAGREEMENT: Step 1 (root 1 != 0)'
                : st === 6
                  ? 'MISSING CALL -> FIRST DISAGREEMENT: Step 1'
                  : 'SWAPPED CALLS -> FIRST DISAGREEMENT: Step 0';

      nodes.push(
        txt('STEP 0', -240, -218, 26, COSMOS.muted, 'mono'),
        txt('STEP 1', 380, -218, 26, COSMOS.muted, 'mono'),
      );

      for (let r = 0; r < 4; r++) {
        const y = -125 + r * 92;
        const isR2 = r === 2;
        const bad0 = isR2 && (st === 1 || st === 7);
        const bad1 = isR2 && (st === 5 || st === 6);
        nodes.push(
          txt(`Rank ${r}`, -760, y, 28, isR2 ? COSMOS.gold : ROLE.r0, 'mono'),
          glassCell(-240, y, 560, 72, bad0 ? ROLE.bad : ROLE.good, {
            fill: bad0 ? '#2d1222' : '#0e2422',
            glow: bad0 ? 10 : 3,
          }),
          txt(
            isR2 ? r2Step0 : 'AllReduce(cnt=4)',
            -240,
            y,
            26,
            bad0 ? ROLE.bad : COSMOS.ink,
            'mono',
          ),
          glassCell(380, y, 560, 72, bad1 ? ROLE.bad : ROLE.good, {
            fill: bad1 ? '#2d1222' : '#0e2422',
            glow: bad1 ? 10 : 3,
          }),
          txt(
            isR2 ? r2Step1 : 'Broadcast(root=0)',
            380,
            y,
            26,
            bad1 ? ROLE.bad : COSMOS.ink,
            'mono',
          ),
        );
      }

      nodes.push(txt(verdict, 0, 275, 28, st === 0 ? COSMOS.gold : ROLE.bad, 'mono'));
    } else {
      const items = [
        {
          k: 'NCCL_DEBUG=WARN',
          d: 'Default production log; add NCCL_DEBUG_LEVELS=ATTN (2.32.3+)',
          col: ROLE.r2,
          y: -125,
        },
        {
          k: 'SUBSYS=INIT,NET,GRAPH',
          d: 'Capture per-process route logs; check /dev/shm & ulimit -l',
          col: ROLE.comm,
          y: 10,
        },
        {
          k: 'RAS PROGRESS COUNTERS',
          d: 'Separates stalled kernel from missing call; clear ALGO/PROTO overrides',
          col: ROLE.good,
          y: 145,
        },
      ];
      nodes.push(txt('PRODUCTION NCCL DIAGNOSTIC PLAYBOOK', 0, -225, 28, COSMOS.gold, 'mono'));
      items.forEach((it) => {
        nodes.push(
          glassCell(0, it.y, 1480, 108, it.col, { fill: '#111b31', glow: 8 }),
          txt(it.k, -695, it.y, 26, it.col, 'mono', 'left'),
          txt(it.d, -260, it.y, 26, COSMOS.ink, 'sans', 'left'),
        );
      });
    }

    nodes.push(
      txt(
        'Never set NCCL_DEBUG=ATTN directly on mixed versions; older NCCL releases silently disable logging',
        0,
        375,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['log-count', 0],
    ['log-first', 1, true],
    ['log-reset', 2],
    ['log-root', 3],
    ['log-scan', 4],
    ['log-second', 5, true],
    ['log-missing', 6, true],
    ['log-swap', 7, true],
    ['log-evidence', 8],
    ['log-warn', 9],
    ['log-progress', 10],
    ['log-levels', 11],
    ['log-restore', 12],
  ]);
}
