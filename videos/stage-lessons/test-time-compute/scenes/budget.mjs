// Scene 20: budget: Budgets [0,128,512,2048] (acc [71,78,83,80]%, lat [220,310,610,1840]ms): predict <=1000ms winner? -> AFTER chosen-budget reveal 512; tighten to 400ms -> AFTER tighter-winner reveal 128 + 3D Pareto surface!
import {
  COSMOS,
  ROLE,
  aura,
  budgets,
  buildBudgetPareto3d,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  latency,
  lumBar,
  orbitScene,
  playCue,
  quality,
  txt,
} from '../parts.mjs';

export default function budget(s, c) {
  const reveal512 = s.value(0); // strictly withheld until AFTER chosen-budget!
  const tighten400 = s.value(0);
  const reveal128 = s.value(0); // strictly withheld until AFTER tighter-winner!

  const bgAura = aura(-240, 0, 720, '#14335c28', '#14383222');
  const title = heroTitle(['Budget vs Latency Deadlines:', 'Accuracy Under Shifting Time Limits'], {
    x: -855,
    y: -430,
    size: 44,
    lineHeight: 52,
    accent: ROLE.ok,
  });

  // Orbiting 3D Budget Pareto surface with moving SLA wall
  const view3d = buildBudgetPareto3d(tighten400, { x: 465, y: 20 });
  orbitScene(s, c, view3d, { theta: -0.25, phi: 0.94 });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const r5 = reveal512.value;
    const t4 = tighten400.value;
    const r1 = reveal128.value;
    const isTight = t4 > 0.35;

    const barX = -630;
    const maxW = 460;

    const nodes = [
      txt(
        isTight ? 'DEADLINE TIGHTENED TO 400 ms' : 'DEADLINE LIMIT: 1,000 ms',
        -855,
        -220,
        26,
        isTight ? ROLE.err : ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    budgets.forEach((b, idx) => {
      const y = -115 + idx * 96;
      const lat = latency[idx];
      const acc = quality[idx];
      const limit = isTight ? 400 : 1000;
      const fits = lat <= limit;
      const isWin = (isTight && r1 > 0.35 && b === 128) || (!isTight && r5 > 0.35 && b === 512);
      const col = isWin ? ROLE.ok : fits ? ROLE.draft : ROLE.err;
      nodes.push(
        txt(`B=${b}`, -855, y, 26, col, 'mono', 'left').opacity(alpha),
        lumBar(barX, y, acc * maxW, 38, col, { opacity: alpha, maxTrackW: maxW }),
        txt(
          `${(acc * 100).toFixed(0)}% | ${lat}ms${isWin ? ' *' : ''}`,
          barX + maxW + 18,
          y,
          26,
          col,
          'mono',
          'left',
        ).opacity(alpha),
      );
    });

    nodes.push(
      chipPill(
        isTight
          ? r1 > 0.35
            ? 'WINNER <=400ms: B=128 (78% @ 310ms)!'
            : 'Deadline now 400 ms: which budget wins?'
          : r5 > 0.35
            ? 'WINNER <=1000ms: B=512 (83% @ 610ms)!'
            : 'Under 1,000 ms: which budget is best?',
        -440,
        285,
        {
          w: 790,
          h: 74,
          color: (isTight ? r1 : r5) > 0.35 ? ROLE.ok : ROLE.gold,
          fill: (isTight ? r1 : r5) > 0.35 ? '#0f2d24' : '#261e10',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),
      txt(
        isTight ? '3D Pareto Surface + 400ms SLA Wall' : '3D Pareto Surface + 1000ms SLA Wall',
        465,
        355,
        26,
        isTight ? ROLE.err : ROLE.ok,
        'mono',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, view3d, layer);
  playCue(s, c, 'budget-sweep', (d) => s.play(reveal512.to(0, { duration: d })));
  playCue(s, c, 'delay-limit', (d) => s.play(reveal512.to(0, { duration: d })));
  // Strict prediction withholding #1: reveal 512 only after chosen-budget!
  playCue(s, c, 'chosen-budget', (d) => s.play(reveal512.to(1, { duration: d })), { after: true });
  playCue(s, c, 'largest-budget', (d) => s.play(reveal512.to(1, { duration: d })));
  playCue(s, c, 'tighter-budget', (d) => s.play(tighten400.to(1, { duration: d })));
  // Strict prediction withholding #2: reveal 128 only after tighter-winner!
  playCue(s, c, 'tighter-winner', (d) => s.play(reveal128.to(1, { duration: d })), { after: true });
  playCue(s, c, 'shared-capacity', (d) => s.play(reveal128.to(1, { duration: d })));
}
