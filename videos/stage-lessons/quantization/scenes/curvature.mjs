// Scene 11: curvature: Calibration inputs [[5,4],[1,1]] -> Hessian H = [[82,18],[18,4]] + orbiting 3D anisotropic Hessian error valley.
import {
  COSMOS,
  HESSIAN_EX,
  ROLE,
  aura,
  buildHessianBowl3d,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function curvature(s, c) {
  const showHessian = s.value(0);
  const showCross = s.value(0);
  const showComp = s.value(0);

  const bgAura = aura(-240, 0, 720, '#14335c28', '#14383222');
  const title = heroTitle(['Calibration Curvature:', 'The Layer Output Hessian'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.ok,
  });

  // Orbiting 3D Hessian valley on the right
  const view3d = buildHessianBowl3d(showComp, { x: 465, y: 20 });
  orbitScene(s, c, view3d, { theta: -0.25, phi: 0.94 });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const hs = showHessian.value;
    const cr = showCross.value;
    const cp = showComp.value;

    const nodes = [
      txt(
        'TWO CALIBRATION INPUT COLUMNS:  x1 = [5, 1],  x2 = [4, 1]',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      // Calibration input matrix
      rect(340, 175, { fill: '#101c36', stroke: ROLE.weight, width: 2.6, radius: 12 })
        .at(-665, -75)
        .opacity(alpha),
      txt('X (2 x 2)', -665, -126, 26, ROLE.weight, 'mono', 'center').opacity(alpha),
      txt('[ 5   4 ]', -665, -72, 34, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('[ 1   1 ]', -665, -20, 34, COSMOS.ink, 'mono', 'center').opacity(alpha),

      // Hessian matrix H = 2 X X^T
      rect(420, 175, { fill: '#0f2826', stroke: ROLE.ok, width: 2.8, radius: 12 })
        .at(-235, -75)
        .opacity(alpha * (0.48 + 0.52 * hs)),
      txt('H = 2 X X^T', -235, -126, 26, ROLE.ok, 'mono', 'center').opacity(
        alpha * (0.48 + 0.52 * hs),
      ),
      txt(
        `[ ${HESSIAN_EX[0][0]}   ${HESSIAN_EX[0][1]} ]`,
        -235,
        -72,
        34,
        ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha * (0.48 + 0.52 * hs)),
      txt(
        `[ ${HESSIAN_EX[1][0]}    ${HESSIAN_EX[1][1]} ]`,
        -235,
        -20,
        34,
        ROLE.grid,
        'mono',
        'center',
      ).opacity(alpha * (0.48 + 0.52 * hs)),

      chipPill(
        cr > 0.35
          ? 'Diag [82, 4] energy | Off-diag 18 coupling'
          : 'Sum 2(x x^T) builds output curvature H',
        -440,
        105,
        {
          w: 790,
          h: 70,
          color: cr > 0.35 ? ROLE.gold : ROLE.grid,
          size: 26,
          opacity: alpha,
        },
      ),
      chipPill(
        cp > 0.35
          ? 'Coupled w2 can offset w1 rounding error!'
          : '3D valley: shifting w2 offsets w1 error',
        -440,
        215,
        {
          w: 790,
          h: 70,
          color: cp > 0.35 ? ROLE.ok : COSMOS.muted,
          fill: cp > 0.35 ? '#0f2d24' : '#10182d',
          size: 26,
          glow: cp > 0.35 ? 10 : 4,
          opacity: alpha * (0.5 + 0.5 * cp),
        },
      ),
      txt('3D Hessian Valley: E(dw1, dw2)', 465, 355, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, view3d, layer);
  playCue(s, c, 'calibration-samples', (d) => s.play(showHessian.to(0.2, { duration: d })));
  playCue(s, c, 'calibration-loss', (d) => s.play(showHessian.to(0.5, { duration: d })));
  playCue(s, c, 'build-curvature', (d) => s.play(showHessian.to(1, { duration: d })));
  playCue(s, c, 'channel-energy', (d) => s.play(showCross.to(0.5, { duration: d })));
  playCue(s, c, 'channel-relationships', (d) => s.play(showCross.to(1, { duration: d })));
  playCue(s, c, 'shared-correction', (d) => s.play(showComp.to(0.6, { duration: d })));
  playCue(s, c, 'calibrated-limit', (d) => s.play(showComp.to(1, { duration: d })));
}
