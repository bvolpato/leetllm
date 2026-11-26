// Scene 5: historical-frontiers: "How does a bigger budget change the split?"
// Act 1 (Beat 0): Kaplan's three separate fitted log-log slopes (-0.076, -0.095, -0.050).
// Act 2 (Beats 1-2): 100x compute expansion comparing Kaplan's parameter-heavy beam
//   (28.84x N, 3.47x D) against equal-growth Chinchilla reference (10x N, 10x D).
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playCue,
  plotPlane,
  sampleCurve,
  scenePulse,
  swapVis,
} from '../parts.mjs';

const KAPLAN_SLOPES = [
  { name: 'N only (abundant D)', slope: 0.076, col: ROLE.params, sub: '10× N -> 84% loss' },
  { name: 'D only (abundant N)', slope: 0.095, col: ROLE.tokens, sub: 'Data-limited regime' },
  { name: 'Compute frontier', slope: 0.05, col: ROLE.compute, sub: 'Best loss per budget' },
];

export default function historicalFrontiers(s, c) {
  const title = heroTitle(['How does a bigger budget', 'change the split?'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.params,
  });

  const act1Vis = s.value(1);
  const act2Vis = s.value(0);
  const slopeSweep = s.value(0);
  const growthExp = s.value(0); // 0 -> 2 (10^0 = 1x up to 10^2 = 100x)
  const equalFocus = s.value(0);
  const pulse = s.value(0);

  // Act 1: Three separate Kaplan 2020 log-log slopes
  const act1Layer = guardedDynamic(act1Vis, (alpha) => {
    const nodes = [];
    const sw = Math.max(0.06, slopeSweep.value);

    nodes.push(
      txt(
        'Kaplan et al. (2020)  ·  three distinct fitted regimes (no added floor)',
        -840,
        -255,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
    );

    KAPLAN_SLOPES.forEach((item, i) => {
      const left = -780 + i * 565;
      const right = left + 430;
      const plane = plotPlane({
        left,
        right,
        top: -125,
        bottom: 205,
        xDomain: [0, 3],
        yDomain: [-0.34, 0.04],
        xTicks: [0, 1, 2, 3],
        yTicks: [-0.3, -0.15, 0],
        xLabel: 'log₁₀ resource',
        yLabel: i === 0 ? 'log₁₀ loss' : '',
        opacity: alpha,
      });
      nodes.push(plane.node);

      const pts = sampleCurve(plane, (x) => -item.slope * x, 0, sw * 3, 40);
      nodes.push(glowingTrail(pts, { color: item.col, width: 4.5, glow: 11, opacity: alpha }));
      const endX = sw * 3;
      const [ex, ey] = plane.toScreen(endX, -item.slope * endX);
      nodes.push(glowDot(ex, ey, { radius: 8, color: item.col, glow: 14, opacity: alpha }));

      const cx = (left + right) / 2;
      nodes.push(
        txt(item.name, cx, -190, 28, COSMOS.ink, 'sans', 'center').opacity(alpha),
        txt(`slope −${fmt(item.slope, 3)}`, cx, 315, 34, item.col, 'mono', 'center')
          .glow(7, item.col)
          .opacity(alpha),
        txt(item.sub, cx, 365, 26, COSMOS.muted, 'sans', 'center').opacity(alpha),
      );
    });

    return nodes;
  });

  // Act 2: 100x compute expansion: Kaplan (0.73 / 0.27) vs Equal growth (0.50 / 0.50)
  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const mult = 10 ** growthExp.value; // 1 .. 100
    const ef = equalFocus.value;

    const kapN = mult ** 0.73;
    const kapD = mult ** 0.27;
    const eqN = mult ** 0.5;
    const eqD = mult ** 0.5;

    const scale = 19.5; // max width 30 * 19.5 = 585px, max height 12 * 19.5 = 234px
    const baseY = 175;

    const drawGrowthBox = (leftX, nMult, dMult, heading, col, subEq, dimOthers) => {
      const boxW = 30 * scale;
      const boxH = 12 * scale;
      const w = Math.max(10, nMult * scale);
      const h = Math.max(10, dMult * scale);
      const a = (dimOthers ? 0.52 : 1) * alpha;

      nodes.push(
        txt(heading, leftX + boxW / 2, -165, 34, col, 'sans', 'center')
          .glow(dimOthers ? 3 : 8, col)
          .opacity(a),
        txt(subEq, leftX + boxW / 2, -118, 28, COSMOS.muted, 'mono', 'center').opacity(a),
        // Frame showing 30x by 12x capacity
        lumBar(leftX + boxW / 2, baseY - boxH / 2, boxW, boxH, {
          color: COSMOS.dim,
          fillOpacity: 0.07,
          strokeWidth: 1.5,
          glow: 0,
          radius: 4,
          opacity: 0.55 * a,
        }),
        // Active growth multiplier rectangle
        lumBar(leftX + w / 2, baseY - h / 2, w, h, {
          color: col,
          fillOpacity: 0.36,
          strokeWidth: 3,
          glow: dimOthers ? 5 : 12,
          radius: 4,
          opacity: a,
        }),
        txt(`N: ${fmt(nMult, 2)}×`, leftX + boxW / 2, baseY + 48, 34, col, 'mono', 'center')
          .glow(6, col)
          .opacity(a),
        txt(`D: ${fmt(dMult, 2)}×`, leftX + boxW / 2, baseY + 96, 34, ROLE.tokens, 'mono', 'center')
          .glow(6, ROLE.tokens)
          .opacity(a),
      );
    };

    nodes.push(
      txt(`Compute multiplier:  ${fmt(mult, 1)}×`, 0, -255, 38, ROLE.compute, 'mono', 'center')
        .glow(9, ROLE.compute)
        .opacity(alpha),
    );

    drawGrowthBox(
      -790,
      kapN,
      kapD,
      'Kaplan frontier',
      ROLE.params,
      'N ∝ C^0.73  ·  D ∝ C^0.27',
      ef > 0.5,
    );
    drawGrowthBox(
      160,
      eqN,
      eqD,
      'Equal growth',
      ROLE.optimal,
      'N ∝ C^0.50  ·  D ∝ C^0.50',
      ef < 0.2,
    );

    const footer =
      ef > 0.5
        ? 'Multipliers preserve starting D/N ratio  (20:1 stays 20:1)'
        : '28.84 × 3.47  ≈  100× total compute';
    nodes.push(
      txt(footer, 0, 365, 30, ef > 0.5 ? ROLE.optimal : ROLE.compute, 'mono', 'center')
        .glow(6, ef > 0.5 ? ROLE.optimal : ROLE.compute)
        .opacity(alpha),
    );

    return nodes;
  });

  const kapEq = glowTex('N \\propto C^{0.73},\\; D \\propto C^{0.27} \\;\\text{ vs }\\; C^{0.50}', {
    x: 415,
    y: -380,
    size: 34,
    color: ROLE.compute,
  });

  s.add(cinemaAtmosphere(ROLE.params, ROLE.optimal), title, act1Layer, act2Layer);
  scenePulse(s, c, pulse);

  playCue(s, c, 'sl-historical-frontiers-0', (d) => s.play(slopeSweep.to(1, { duration: d })), {
    dur: 1.5,
  });
  c.show('sl-historical-frontiers-1', kapEq);
  playCue(
    s,
    c,
    'sl-historical-frontiers-1',
    (d) => s.play(swapVis(act1Vis, act2Vis, Math.min(0.65, d)), growthExp.to(2, { duration: d })),
    { dur: 1.8 },
  );
  playCue(s, c, 'sl-historical-frontiers-2', (d) => s.play(equalFocus.to(1, { duration: d })), {
    dur: 0.85,
  });
}
