// Scene 16: Keep assignments, capacity and token identity separate (8 tokens x 2 = 16 assignments; cap=4 drops overflowing assignments without erasing source tokens).
import {
  COSMOS,
  EXP_CAP,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function expertCapacity(s, c) {
  const step = s.value(0); // 0=2 assignments/token, 1=capacity drop preserves token, 2=hot expert queue, 3=grouped GEMM / no over-sharding

  const bgAura = aura(0, 15, 620, '#f59e0b1a', '#fb718518');
  const title = heroTitle(['Assignments, Capacity', '& Token Identity'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.ep,
    eyebrow: 'PERMUTATION · CAPACITY DROPPING VS DROPLESS DISPATCH',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    const totalTok = typeof EXP_CAP.tokens === 'number' ? EXP_CAP.tokens : 8;
    const totalAsgn = Array.isArray(EXP_CAP.assignments) ? EXP_CAP.assignments.length : 16;
    const cap = typeof EXP_CAP.capacity === 'number' ? EXP_CAP.capacity : 4;
    const dropped = typeof EXP_CAP.droppedAssignments === 'number' ? EXP_CAP.droppedAssignments : 4;

    // 4-column telemetry row
    const stats = [
      { k: 'SOURCE TOKENS', v: `${totalTok} (fixed)`, col: ROLE.tp },
      { k: 'ASSIGNMENTS (TOP-2)', v: `${totalAsgn} total`, col: ROLE.ep },
      { k: 'HOT EXPERT CAP', v: `cap = ${cap}`, col: st >= 1 ? ROLE.warn : ROLE.dim },
      {
        k: 'DROPPED ASSIGNMENTS',
        v: st >= 1 ? `${dropped} overflow` : '0 (dropless)',
        col: st >= 1 ? ROLE.bad : ROLE.good,
      },
    ];
    stats.forEach((m, i) => {
      const x = -600 + i * 400;
      nodes.push(
        glassCell(x, -170, 365, 118, m.col, { fill: '#10192d', glow: 7 }),
        txt(m.k, x, -198, 26, COSMOS.muted, 'mono'),
        txt(m.v, x, -145, 28, m.col, 'mono'),
      );
    });

    // Visual queue for hot Expert 2 (8 arriving assignments vs capacity 4 line)
    nodes.push(txt('HOT EXPERT 2 QUEUE (8 ARRIVING ASSIGNMENTS)', -120, -45, 26, ROLE.ep, 'mono'));
    for (let i = 0; i < 8; i++) {
      const x = -630 + i * 150;
      const isOverflow = i >= 4 && st >= 1;
      nodes.push(
        glassCell(x, 45, 126, 92, isOverflow ? ROLE.bad : ROLE.good, {
          fill: isOverflow ? '#2f1222' : '#0e2524',
          glow: isOverflow ? 9 : 5,
        }),
        txt(`T${i}`, x, 24, 28, isOverflow ? ROLE.bad : COSMOS.ink, 'mono'),
        txt(isOverflow ? 'DROP' : 'KEEP', x, 66, 26, isOverflow ? ROLE.bad : ROLE.good, 'mono'),
      );
    }

    // Residual survival note on right
    nodes.push(
      glassCell(685, 45, 315, 148, ROLE.tp, { fill: '#101f38', glow: 7 }),
      txt('SOURCE TOKEN', 685, 5, 26, ROLE.tp, 'mono'),
      txt('STILL EXISTS', 685, 48, 28, ROLE.good, 'mono'),
      txt('2nd expert / resid.', 685, 92, 26, COSMOS.muted, 'sans'),
    );

    nodes.push(
      txt(
        st >= 2
          ? 'A hot expert forms a queue even when total tokens (8) and assignments (16) stay fixed'
          : 'Dropping an overflowing assignment never deletes the source token or its residual path',
        0,
        290,
        28,
        COSMOS.ink,
        'sans',
      ),
      txt(
        'Read per-expert counts beside dispatch/combine time; over-sharding small experts shrinks GEMM efficiency',
        0,
        352,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['mg-expert-capacity-b0', 0],
    ['mg-drop-assignment', 1],
    ['mg-expert-capacity-b1', 2],
    ['mg-hot-expert', 3],
  ]);
}
