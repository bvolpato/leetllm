// Scene 10: growth: "What if you had four times the compute?"
// SIGNATURE 3D SCENE: Orbiting 3D symmetric loss surface L(N,D) = 1 + 2/sqrt(N) + 2/sqrt(D)
// descending along the compute-optimal ridge from (10,10) to (20,20), paired on the left with
// coupled 2D iso-compute hyperbola (100 -> 400) and loss-valley cross-section.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  buildLossSurface3d,
  cinemaAtmosphere,
  fmt,
  loss,
  playCue,
  plotPlane,
  sampleCurve,
} from '../parts.mjs';

export default function growth(s, c) {
  const title = heroTitle(['What if you had four', 'times the compute?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.optimal,
  });

  // Right-side orbiting 3D symmetric loss surface with (10,10) and (20,20) ridge beacons
  const { view3d } = buildLossSurface3d({
    xPos: 475,
    yPos: -20,
    unit: 96,
    distance: 15.6,
    theta: -0.78,
    phi: 1.04,
    A: 2.0,
    B: 2.0,
    alpha: 0.5,
    beta: 0.5,
    beacons: [
      { u: -0.1, v: -0.1, color: COSMOS.muted, radius: 7.5 },
      { u: 1.15, v: 1.15, color: ROLE.compute, radius: 9.5 },
    ],
  });

  const expandT = s.value(0); // growth-expand: side 10 -> 20, budget 100 -> 400
  const compareGlow = s.value(0); // growth-old-new
  const floorFocus = s.value(0); // growth-floor

  const leftLayer = guardedDynamic(s.value(1), (alpha) => {
    const nodes = [];
    const p = expandT.value;
    const side = 10 + 10 * p;
    const budget = side * side;
    const oldLoss = loss(10, 10);
    const newLoss = loss(side, side);
    const ff = floorFocus.value;

    // Upper-left: N x D iso-compute curves (100 ghost -> 400 active)
    const allocPlane = plotPlane({
      left: -790,
      right: -130,
      top: -235,
      bottom: -15,
      xDomain: [0, 44],
      yDomain: [0, 44],
      xTicks: [10, 20, 40],
      yTicks: [10, 20, 40],
      xLabel: '',
      yLabel: 'D',
      opacity: alpha,
    });
    nodes.push(allocPlane.node);

    const oldIso = sampleCurve(allocPlane, (x) => 100 / x, 100 / 43, 43, 60);
    const newIso = sampleCurve(allocPlane, (x) => budget / x, budget / 43, 43, 60);
    nodes.push(
      glowingTrail(oldIso, {
        color: COSMOS.dim,
        width: 2.5,
        glow: 3,
        core: false,
        opacity: 0.65 * alpha,
      }),
      glowingTrail(newIso, { color: ROLE.tokens, width: 4.2, glow: 10, opacity: alpha }),
      glowDot(...allocPlane.toScreen(10, 10), {
        radius: 7,
        color: COSMOS.muted,
        glow: 4,
        opacity: alpha,
      }),
      glowDot(...allocPlane.toScreen(side, side), {
        radius: 10,
        color: ROLE.compute,
        glow: 14,
        opacity: alpha,
      }),
      txt(`N × D = ${Math.round(budget)}`, -130, -273, 28, ROLE.tokens, 'mono', 'right')
        .glow(6, ROLE.tokens)
        .opacity(alpha),
    );

    // Lower-left: Loss valley L(N, C/N) dropping from 2.265 -> 1.894 toward floor E=1
    const lossPlane = plotPlane({
      left: -790,
      right: -130,
      top: 90,
      bottom: 295,
      xDomain: [4, 40],
      yDomain: [1.5, 2.75],
      xTicks: [10, 20, 40],
      yTicks: [1.6, 2.0, 2.4],
      xLabel: 'Parameter units N',
      yLabel: 'Fitted loss',
      opacity: alpha,
    });
    nodes.push(lossPlane.node);

    const oldValPts = sampleCurve(lossPlane, (x) => loss(x, 100 / x), 4, 40, 64);
    const newValPts = sampleCurve(lossPlane, (x) => loss(x, budget / x), 4, 40, 64);
    nodes.push(
      glowingTrail(oldValPts, {
        color: COSMOS.dim,
        width: 2.5,
        glow: 3,
        core: false,
        opacity: 0.65 * alpha,
      }),
      glowingTrail(newValPts, { color: ROLE.optimal, width: 4.4, glow: 11, opacity: alpha }),
      glowDot(...lossPlane.toScreen(10, oldLoss), {
        radius: 7,
        color: COSMOS.muted,
        glow: 4,
        opacity: alpha,
      }),
      glowDot(...lossPlane.toScreen(side, newLoss), {
        radius: 10,
        color: ROLE.compute,
        glow: 14,
        opacity: alpha,
      }),
      txt(`Min loss: ${fmt(newLoss, 3)}`, -130, 52, 28, ROLE.compute, 'mono', 'right')
        .glow(7, ROLE.compute)
        .opacity(alpha),
    );

    // Highlight diminishing drop toward floor E=1
    if (ff > 0.05) {
      const fY = lossPlane.toY(1.56);
      nodes.push(
        line([lossPlane.bounds.left, fY], [lossPlane.bounds.right, fY], {
          stroke: ROLE.amber,
          width: 2.2,
        }).opacity(0.8 * ff * alpha),
        txt('Floor E = 1 stays fixed (shrinking drops)', -820, 418, 26, ROLE.amber, 'mono', 'left')
          .glow(5, ROLE.amber)
          .opacity(ff * alpha),
      );
    } else if (compareGlow.value > 0.2) {
      nodes.push(
        txt(
          '10×10 -> 20×20  ·  balanced 1:1 growth',
          -820,
          418,
          26,
          ROLE.optimal,
          'mono',
          'left',
        ).opacity(compareGlow.value * alpha),
      );
    }

    return nodes;
  });

  const rightCaption = guardedDynamic(s.value(1), (alpha) => [
    txt('3D Valley Along Optimal Ridge', 475, -355, 30, ROLE.compute, 'mono', 'center')
      .glow(6, ROLE.compute)
      .opacity(alpha),
    txt(
      '4× compute -> 2× N, 2× D  (÷√2 penalty)',
      475,
      325,
      26,
      COSMOS.muted,
      'mono',
      'center',
    ).opacity(alpha),
  ]);

  const eq = glowTex('L^*(4C) - E = \\frac{1}{\\sqrt{2}}(L^*(C) - E)', {
    x: 475,
    y: 405,
    size: 34,
    color: ROLE.optimal,
  });

  s.add(cinemaAtmosphere(ROLE.optimal, ROLE.compute), title, view3d, rightCaption, eq, leftLayer);

  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.16, phi: 0.94, distance: 14.4 },
    { startOffset: 0.15, endMargin: 0.55 },
  );

  playCue(s, c, 'growth-expand', (d) => s.play(expandT.to(1, { duration: d })), { dur: 1.8 });
  playCue(s, c, 'growth-old-new', (d) => s.play(compareGlow.to(1, { duration: d })), { dur: 0.8 });
  playCue(s, c, 'growth-floor', (d) => s.play(floorFocus.to(1, { duration: d })), { dur: 0.9 });
}
