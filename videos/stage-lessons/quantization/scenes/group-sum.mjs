// Scene 09: group-sum: Group 0 [2,-1]*[4,2]=6 (scale 0.25 -> 1.5); Group 1 [3,1]*[-1,5]=2 (scale 2.0 -> 4.0); total=5.5 vs wrong 2.0!
import {
  COSMOS,
  GROUP_SUM_EX,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function groupSum(s, c) {
  const showPartials = s.value(0);
  const showScaled = s.value(0);
  const showExport = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Grouped Dot Product:', 'Scale Each Group Before Adding'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.grid,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const pt = showPartials.value;
    const sc = showScaled.value;
    const ex = showExport.value;

    const nodes = [
      txt(
        'GROUP 0 (BLUE, s=0.25) AND GROUP 1 (ROSE, s=2.0) MUST STAY SEPARATE UNTIL SCALED',
        -855,
        -225,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      // Group 0 panel
      rect(760, 240, { fill: '#10203a', stroke: ROLE.weight, width: 2.8, radius: 14 })
        .at(-430, -35)
        .opacity(alpha),
      txt('GROUP 0  (scale = 0.25)', -430, -112, 28, ROLE.weight, 'mono', 'center').opacity(alpha),
      txt('codes [2, -1]  ·  inputs [4, 2]', -430, -55, 28, COSMOS.ink, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        `integer partial = 2x4 + (-1)x2 = ${GROUP_SUM_EX.partials[0]}`,
        -430,
        2,
        28,
        ROLE.grid,
        'mono',
        'center',
      ).opacity(alpha * (0.48 + 0.52 * pt)),
      txt(
        `scaled = 0.25 x 6 = ${(GROUP_SUM_EX.scales[0] * GROUP_SUM_EX.partials[0]).toFixed(1)}`,
        -430,
        55,
        30,
        ROLE.ok,
        'mono',
        'center',
      ).opacity(alpha * (0.45 + 0.55 * sc)),

      // Group 1 panel
      rect(760, 240, { fill: '#2a1426', stroke: ROLE.err, width: 2.8, radius: 14 })
        .at(430, -35)
        .opacity(alpha),
      txt('GROUP 1  (scale = 2.0)', 430, -112, 28, ROLE.err, 'mono', 'center').opacity(alpha),
      txt('codes [3, 1]  ·  inputs [-1, 5]', 430, -55, 28, COSMOS.ink, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        `integer partial = 3x(-1) + 1x5 = ${GROUP_SUM_EX.partials[1]}`,
        430,
        2,
        28,
        ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha * (0.48 + 0.52 * pt)),
      txt(
        `scaled = 2.0 x 2 = ${(GROUP_SUM_EX.scales[1] * GROUP_SUM_EX.partials[1]).toFixed(1)}`,
        430,
        55,
        30,
        ROLE.ok,
        'mono',
        'center',
      ).opacity(alpha * (0.45 + 0.55 * sc)),

      // Correct vs Wrong totals
      chipPill(`CORRECT: 1.5 + 4.0 = ${GROUP_SUM_EX.total.toFixed(1)}`, -410, 165, {
        w: 720,
        h: 76,
        color: ROLE.ok,
        fill: '#0f2d24',
        size: 30,
        glow: sc > 0.3 ? 12 : 4,
        opacity: alpha * (0.5 + 0.5 * sc),
      }),
      chipPill(`WRONG (add first): 0.25 x (6+2) = ${GROUP_SUM_EX.wrong.toFixed(1)}`, 410, 165, {
        w: 760,
        h: 76,
        color: ROLE.err,
        fill: '#321420',
        size: 28,
        glow: sc > 0.3 ? 10 : 4,
        opacity: alpha * (0.5 + 0.5 * sc),
      }),
      txt(
        ex > 0.35
          ? 'Export group indices, dimensions, scale precision & zero-points so kernels match every group'
          : 'Scale each group partial before summing across groups to avoid corrupting the dot product',
        0,
        290,
        26,
        ex > 0.35 ? ROLE.gold : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'group-sum-build-0', (d) => s.play(showPartials.to(0.4, { duration: d })));
  playCue(s, c, 'group-first-partial', (d) => s.play(showPartials.to(0.7, { duration: d })));
  playCue(s, c, 'group-second-partial', (d) => s.play(showPartials.to(1, { duration: d })));
  playCue(s, c, 'group-sum-build-1', (d) => s.play(showScaled.to(0.4, { duration: d })));
  playCue(s, c, 'group-first-scale', (d) => s.play(showScaled.to(0.7, { duration: d })));
  playCue(s, c, 'group-second-scale', (d) => s.play(showScaled.to(1, { duration: d })));
  playCue(s, c, 'group-sum-build-2', (d) => s.play(showExport.to(1, { duration: d })));
}
