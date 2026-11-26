// Scene 18: thrash-budget: "Count context work against completed task steps"
// 5-op churn loop (fetch -> summarize -> drop -> fetch again -> summarize = 5 ops, 0 steps = stalled),
// B1 progress evidence table, B2 pinned request ID R17 + capped retry budget -> explicit gap exit.
import {
  COSMOS,
  ROLE,
  THRASH_OPS,
  aura,
  checkMark,
  chip,
  cornerBrackets,
  ease,
  glowArrow,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  swapVis,
  txt,
} from '../parts.mjs';

export default function thrashBudget(s, c) {
  const loopProg = s.value(0.2);
  const vLoop = s.value(1);
  const vMetrics = s.value(0);
  const vFix = s.value(0);
  const pinId = s.value(0);
  const capExit = s.value(0);

  const bgAura = aura(0, 0, 820, '#2c142626', '#14335c26');
  const title = heroTitle(['Count context work', 'against completed steps'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.poison,
  });

  // Shared top 5-op thrashing ribbon visible across B0..B2
  const stageVis = s.value(1);
  const topLoop = guardedDynamic(stageVis, (alpha) => {
    const lp = ease(loopProg.value);
    const activeIdx = Math.min(4, Math.floor(lp * 5));
    const xs = [-690, -345, 0, 345, 690];
    const subs = ['trace-17', 'ID dropped!', 'raw evicted', 'trace-17 again', 'ID dropped!'];

    const nodes = [
      txt(
        'REPEATED CONTEXT CHURN LOOP (SAME trace-17)',
        -855,
        -255,
        26,
        ROLE.poison,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    THRASH_OPS.forEach((opName, i) => {
      const lit = i <= activeIdx;
      const isBad = i === 1 || i === 4;
      const col = !lit ? ROLE.dim : isBad ? ROLE.poison : ROLE.evidence;
      nodes.push(
        chip(`${i + 1}. ${opName}`, xs[i], -170, {
          color: col,
          size: 26,
          h: 60,
          minW: 260,
          glow: lit ? 9 : 0,
          opacity: alpha * (lit ? 1 : 0.55),
        }),
        txt(
          subs[i],
          xs[i],
          -108,
          26,
          isBad && lit ? ROLE.poison : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha * (lit ? 1 : 0.55)),
      );
      if (i < 4) {
        nodes.push(
          glowArrow([xs[i] + 138, -170], [xs[i + 1] - 138, -170], lit ? ROLE.units : ROLE.dim, {
            width: 3,
            tip: 12,
            opacity: alpha * (lit ? 0.9 : 0.45),
          }),
        );
      }
    });

    return group(...nodes);
  });

  // B0 lower panel: 5 ops, 0 completed steps -> STALLED
  const lowerLoop = guardedDynamic(vLoop, (alpha) => {
    const done = loopProg.value > 0.85;
    const nodes = [
      cornerBrackets(-450, 130, 740, 260, ROLE.evidence, { arm: 28, width: 3, opacity: alpha }),
      txt('CONTEXT OPERATIONS', -780, 50, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt(done ? '5' : '...', -780, 145, 76, ROLE.evidence, 'mono', 'left').opacity(alpha),
      txt(
        'fetch, summarize, drop, fetch, summarize',
        -780,
        222,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),

      cornerBrackets(450, 130, 740, 260, ROLE.poison, { arm: 28, width: 3, opacity: alpha }),
      txt('COMPLETED TASK STEPS', 120, 50, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt(done ? '0  (STALLED)' : '...', 120, 145, 70, ROLE.poison, 'mono', 'left').opacity(alpha),
      txt(
        'Ratio ops / 0 undefined: log both raw counts',
        120,
        222,
        26,
        ROLE.units,
        'mono',
        'left',
      ).opacity(alpha),

      txt(
        'Bloat is old material piling up; thrashing is repeating context prep with zero progress.',
        0,
        380,
        30,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return group(...nodes);
  });

  // B1 lower panel: Tracking meaningful progress metrics
  const lowerMetrics = guardedDynamic(vMetrics, (alpha) => {
    const rows = [
      ['Reload same trace-17', 'Repeated span; zero new resolution', ROLE.poison],
      ['Empty search result', 'Valid outcome; identifies evidence gap', ROLE.units],
      ['Ruled-out hypothesis', 'Negative finding advances investigation', ROLE.note],
    ];
    const nodes = [
      txt(
        'DISTINGUISH CHURN FROM REAL PROGRESS',
        -855,
        10,
        26,
        ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha),
    ];
    rows.forEach(([left, right, col], i) => {
      const y = 90 + i * 86;
      nodes.push(
        txt(left, -855, y, 30, col, 'mono', 'left').opacity(alpha),
        txt(right, -200, y, 30, COSMOS.ink, 'sans', 'left').opacity(alpha),
      );
    });
    nodes.push(
      txt(
        'Track ops/step where defined, span reloads, evidence yield, and decision latency.',
        0,
        385,
        30,
        ROLE.evidence,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  // B2 lower panel: Pin request ID R17 + cap retry budget -> escalate gap
  const lowerFix = guardedDynamic(vFix, (alpha) => {
    const pn = ease(pinId.value);
    const ex = ease(capExit.value);
    const nodes = [
      cornerBrackets(-450, 130, 760, 250, pn > 0.3 ? ROLE.note : ROLE.units, {
        arm: 28,
        width: 3,
        opacity: alpha,
      }),
      checkMark(-790, 62, 26, ROLE.note, alpha * (0.45 + 0.55 * pn)),
      txt('PIN REQUIRED ENTITY KEY', -750, 62, 28, ROLE.note, 'mono', 'left').opacity(alpha),
      txt('R17 pinned outside prose summary', -790, 132, 32, COSMOS.ink, 'sans', 'left').opacity(
        alpha,
      ),
      txt(
        'Survives compaction until job finishes',
        -790,
        198,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),

      cornerBrackets(450, 130, 760, 250, ex > 0.3 ? ROLE.poison : ROLE.evidence, {
        arm: 28,
        width: 3,
        opacity: alpha,
      }),
      txt('CAP RETRIES & PREP WORK', 110, 62, 28, ROLE.units, 'mono', 'left').opacity(alpha),
      txt(
        'Budget exhausted -> escalate gap',
        110,
        132,
        32,
        ex > 0.3 ? ROLE.poison : COSMOS.ink,
        'sans',
        'left',
      ).opacity(alpha),
      txt('Preserve state; never fake success', 110, 198, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha,
      ),

      txt(
        'Reducing churn must never convert an unknown write into success or replay it blindly.',
        0,
        385,
        30,
        ROLE.units,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, topLoop, lowerLoop, lowerMetrics, lowerFix);

  playCue(s, c, 'ce-thrash-budget-1', (d) => s.play(loopProg.to(0.35, { duration: d })));
  playCue(s, c, 'ce-thrash-five', (d) => s.play(loopProg.to(1, { duration: Math.max(d, 1.4) })));
  playCue(s, c, 'ce-thrash-budget-2', (d) => s.play(swapVis(vLoop, vMetrics, d)));
  playCue(s, c, 'ce-thrash-budget-3', (d) => s.play(swapVis(vMetrics, vFix, d)));
  playCue(s, c, 'ce-pin-id', (d) => s.play(pinId.to(1, { duration: d })));
  playCue(s, c, 'ce-stalled-exit', (d) => s.play(capExit.to(1, { duration: d })));
}
