// Scene 13 (pca): "Find a direction that keeps the cloud wide"
// Orbiting 3D PCA variance ellipsoid + live mean-centering + rotating projection axis maximizing squared spread + sign flip!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  GROUP_COLOR,
  LETTERS,
  QUERY_COLOR,
  RETAINED_ENERGY,
  TOTAL_ENERGY,
  aura,
  buildPcaEllipsoid3d,
  glowArrow,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  labels,
  makePlot,
  orbitScene,
  pca,
  tweenCue,
  txt,
  xy,
} from '../parts.mjs';

const OPT_ANGLE = Math.atan2(pca.vector[1], pca.vector[0]);

export default function pcaScene(s, c) {
  const centerAmt = s.value(0);
  const projAmt = s.value(0);
  const rotAngle = s.value(-0.05); // starts horizontal, rotates cleanly up to OPT_ANGLE
  const showBest = s.value(0);
  const showScore = s.value(0);
  const flipSign = s.value(1); // +1 or -1

  const bgAura = aura(445, 10, 520, '#133a4a36', '#133a3d18');
  const { view: ellip3d } = buildPcaEllipsoid3d(() => rotAngle.value, { x: 445, y: 10 });

  const title = heroTitle(['Find the Direction That', 'Keeps the Cloud Wide'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.emerald,
    eyebrow: 'PRINCIPAL COMPONENT ANALYSIS · PC1',
  });

  const eqScore = glowTex('z_i = (x_i - \\mu) \\cdot v_1', {
    x: -480,
    y: 350,
    size: 40,
    color: QUERY_COLOR,
    glow: 7,
  });

  const live = guardedDynamic(s.value(1), () => {
    const cnt = centerAmt.value;
    const prj = projAmt.value;
    const ang = rotAngle.value;
    const sgn = flipSign.value >= 0 ? 1 : -1;
    const vx = Math.cos(ang) * sgn;
    const vy = Math.sin(ang) * sgn;

    const plot = makePlot(-835, -245, 780, 480, { x: [-5.5, 5.5], y: [-3.2, 3.2] });
    const orig = plot.pt([0, 0]);
    const centeredPts = xy.map((p) => [
      p[0] - pca.mean[0] * cnt - (1 - cnt) * 4.2,
      p[1] - pca.mean[1] * cnt - (1 - cnt) * 2.1,
    ]);
    const scores = centeredPts.map((p) => p[0] * vx + p[1] * vy);
    const energy = scores.reduce((acc, sc) => acc + sc * sc, 0);

    const nodes = [
      ...plot.axesNodes(0.7),
      // Crosshairs at origin (0, 0)
      line([plot.left, orig[1]], [plot.right, orig[1]], { stroke: COSMOS.rule, width: 1.8 }),
      line([orig[0], plot.top], [orig[0], plot.bottom], { stroke: COSMOS.rule, width: 1.8 }),
    ];

    // Candidate principal axis line clamped strictly inside the plot bounds
    if (prj > 0.02) {
      const tMax = Math.min(
        Math.abs(vx) > 1e-4 ? 4.9 / Math.abs(vx) : 99,
        Math.abs(vy) > 1e-4 ? 2.8 / Math.abs(vy) : 99,
      );
      const pA = plot.pt([-tMax * vx, -tMax * vy]);
      const pB = plot.pt([tMax * vx, tMax * vy]);
      nodes.push(
        line(pA, pB, { stroke: QUERY_COLOR, width: 3.5 }).opacity(prj),
        glowArrow(orig, plot.pt([2.0 * vx, 2.0 * vy]), QUERY_COLOR, { opacity: prj }),
      );
    }

    // Orthogonal projections & points
    centeredPts.forEach((pt, i) => {
      const [px, py] = plot.pt(pt);
      const col = GROUP_COLOR[labels[i]];
      if (prj > 0.02) {
        const foot = [scores[i] * vx, scores[i] * vy];
        const [fx, fy] = plot.pt(foot);
        nodes.push(
          line([px, py], [fx, fy], { stroke: COSMOS.rose, width: 2.2, dash: [6, 5] }).opacity(
            prj * 0.8,
          ),
          glowDot(fx, fy, { radius: 5.5, color: QUERY_COLOR, glow: 8, opacity: prj }),
        );
      }
      nodes.push(
        glowDot(px, py, { radius: 8, color: col, glow: 10 }),
        txt(
          LETTERS[i],
          px + (i === 0 ? -36 : i === 1 ? 34 : i === 4 ? -18 : i === 5 ? 14 : 0),
          py + (i === 0 ? 36 : i === 1 ? 38 : i === 4 ? -36 : i === 5 ? 42 : -32),
          26,
          col,
          'mono',
        ),
      );
    });

    // Live spread energy readout (withheld until centered and projecting so uncentered norm never exceeds PC1)
    const spreadLabel =
      prj > 0.02
        ? `CAPTURED SPREAD:  Σ z_i² = ${energy.toFixed(1)} / ${TOTAL_ENERGY.toFixed(1)}  (${((energy / TOTAL_ENERGY) * 100).toFixed(1)}%)`
        : 'STEP 1: CENTER CLOUD AT ORIGIN (0, 0) FIRST';
    nodes.push(
      txt(
        spreadLabel,
        -855,
        282,
        28,
        showBest.value > 0.5 ? COSMOS.emerald : prj > 0.02 ? QUERY_COLOR : COSMOS.cyan,
        'mono',
        'left',
      ).glow(6, showBest.value > 0.5 ? COSMOS.emerald : prj > 0.02 ? QUERY_COLOR : COSMOS.cyan),
    );

    if (showScore.value > 0.02) {
      const scC = pca.scores[2] * sgn;
      nodes.push(
        txt(
          sgn < 0
            ? `Sign flip (−v₁):  z_C = ${scC.toFixed(2)}  (same line!)`
            : `Point C score:  z_C = ${scC.toFixed(2)}  (kept ${RETAINED_ENERGY.toFixed(1)})`,
          445,
          -345,
          28,
          sgn < 0 ? COSMOS.amber : COSMOS.emerald,
          'mono',
        ).opacity(showScore.value),
      );
    }

    nodes.push(
      txt('3D PCA VARIANCE ELLIPSOID', 445, -405, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt(
        'Gold axis rotates to align with widest spread (85.2%)',
        445,
        452,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return nodes;
  });

  s.add(bgAura, ellip3d, title, live);
  orbitScene(s, c, ellip3d, { theta: 0.48, phi: 0.96 });

  tweenCue(s, c, 'center', centerAmt, 1, { duration: 0.8 });
  tweenCue(s, c, 'project', projAmt, 1, { duration: 0.55 });
  tweenCue(s, c, 'rotate', rotAngle, OPT_ANGLE, { duration: 1.25 });
  tweenCue(s, c, 'best', showBest, 1, { duration: 0.45 });
  c.show('score', eqScore);
  tweenCue(s, c, 'score', showScore, 1, { duration: 0.45 });
  tweenCue(s, c, 'sign', flipSign, -1, { duration: 0.45 });
}
