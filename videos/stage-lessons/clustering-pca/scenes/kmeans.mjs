// Scene 04 (kmeans): "Assign points, then move their centers"
// Orbiting 3D Voronoi squared-distance bowl + live Lloyd E-step / M-step + inertia 3.48 -> 1.74.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  GROUP_COLOR,
  LETTERS,
  QUERY_COLOR,
  aura,
  buildVoronoiBowl3d,
  centroids,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  inertia,
  initialInertia,
  labels,
  makePlot,
  orbitScene,
  seeds,
  tweenCue,
  txt,
  updatedInertia,
  xy,
} from '../parts.mjs';

export default function kmeans(s, c) {
  const showSeeds = s.value(0);
  const assignAmt = s.value(0);
  const showPredict = s.value(0);
  const showMeanX = s.value(0);
  const showMeanY = s.value(0);
  const moveCenters = s.value(0);
  const showAgain = s.value(0);
  const showSettled = s.value(0);
  const showRestarts = s.value(0);

  const curCenters = () =>
    seeds.map((sd, k) => [
      sd[0] + (centroids[k][0] - sd[0]) * moveCenters.value,
      sd[1] + (centroids[k][1] - sd[1]) * moveCenters.value,
    ]);

  const bgAura = aura(445, 10, 520, '#133a4a34', '#2a1c4f18');
  const { view: bowl3d } = buildVoronoiBowl3d(curCenters, { x: 445, y: 10 });

  const title = heroTitle(['Assign Points,', 'Move Centers'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.emerald,
    eyebrow: "LLOYD'S K-MEANS ALGORITHM · K = 3",
  });

  const live = guardedDynamic(s.value(1), () => {
    const cs = curCenters();
    const curJ = inertia(cs);
    const plot = makePlot(-820, -235, 760, 440, { x: [0, 10], y: [0, 5.2] });

    const nodes = [
      ...plot.axesNodes(0.85),
      txt(
        `INERTIA  J = ${curJ.toFixed(2)}`,
        -855,
        258,
        36,
        moveCenters.value > 0.8 ? COSMOS.emerald : QUERY_COLOR,
        'mono',
        'left',
      ).glow(7, moveCenters.value > 0.8 ? COSMOS.emerald : QUERY_COLOR),
    ];

    // Assignment links from points to current centers
    if (assignAmt.value > 0.02) {
      xy.forEach((p, i) => {
        const k = labels[i];
        nodes.push(
          line(plot.pt(p), plot.pt(cs[k]), {
            stroke: GROUP_COLOR[k],
            width: 3.0,
          }).opacity(assignAmt.value * 0.85),
        );
      });
    }

    // 6 message points
    xy.forEach((p, i) => {
      const [px, py] = plot.pt(p);
      const col = assignAmt.value > 0.35 ? GROUP_COLOR[labels[i]] : COSMOS.muted;
      nodes.push(
        glowDot(px, py, { radius: 8, color: col, glow: 9 }),
        txt(
          LETTERS[i],
          px + (i === 0 ? -26 : i === 2 || i === 4 ? -24 : 0),
          py + (i === 0 ? 32 : -32),
          26,
          col,
          'mono',
        ),
      );
    });

    // 3 centers (glowing gold rings)
    if (showSeeds.value > 0.02) {
      cs.forEach((ct, k) => {
        const [cx, cy] = plot.pt(ct);
        nodes.push(
          glowRing(cx, cy, 18, GROUP_COLOR[k], { width: 3.5, glow: 11, opacity: showSeeds.value }),
          glowDot(cx, cy, { radius: 5, color: QUERY_COLOR, glow: 10, opacity: showSeeds.value }),
        );
      });
    }

    // Live arithmetic readout for left cluster mean (1.0+1.2)/2 = 1.1, (1.0+1.8)/2 = 1.4
    const predOp = showPredict.value * Math.max(0, 1 - showMeanX.value * 2.6);
    if (predOp > 0.02) {
      nodes.push(
        txt('Where should the left center move?', -855, 326, 30, QUERY_COLOR, 'serif', 'left')
          .glow(6, QUERY_COLOR)
          .opacity(predOp),
      );
    }
    if (showMeanX.value > 0.02 && showSettled.value < 0.4) {
      const op =
        Math.max(0, (showMeanX.value - 0.35) / 0.65) * Math.max(0, 1 - showSettled.value * 2.6);
      if (op > 0.02) {
        nodes.push(
          txt('x̄ = (1.0 + 1.2)/2 = 1.1', -855, 326, 28, COSMOS.cyan, 'mono', 'left').opacity(op),
        );
      }
    }
    if (showMeanY.value > 0.02 && showSettled.value < 0.4) {
      const op = showMeanY.value * Math.max(0, 1 - showSettled.value * 2.6);
      if (op > 0.02) {
        nodes.push(
          txt(
            'ȳ = (1.0 + 1.8)/2 = 1.4  →  J drops 3.48 → 1.74',
            -420,
            326,
            28,
            COSMOS.emerald,
            'mono',
            'left',
          ).opacity(op),
        );
      }
    }

    const setOp = Math.max(0, (showSettled.value - 0.45) / 0.55);
    if (setOp > 0.02) {
      nodes.push(
        txt(
          `Settled! Same pairs remain (J = ${initialInertia.toFixed(2)} → ${updatedInertia.toFixed(2)})`,
          -855,
          326,
          28,
          COSMOS.emerald,
          'mono',
          'left',
        )
          .glow(6, COSMOS.emerald)
          .opacity(setOp),
      );
    }
    if (showRestarts.value > 0.02) {
      nodes.push(
        txt(
          'Compare restarts & repair empty groups before averaging',
          -855,
          388,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(showRestarts.value),
      );
    }
    if (showAgain.value > 0.02) {
      nodes.push(
        txt('RE-ASSIGNMENT CHECK', 445, -345, 26, COSMOS.emerald, 'mono').opacity(showAgain.value),
      );
    }

    nodes.push(
      txt('3D VORONOI SQUARED-DISTANCE BOWL', 445, -405, 26, COSMOS.cyan, 'mono').glow(
        5,
        COSMOS.cyan,
      ),
      txt(
        'Centroids slide to basin minima; inertia never increases',
        445,
        452,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return nodes;
  });

  s.add(bgAura, bowl3d, title, live);
  orbitScene(s, c, bowl3d, { theta: 0.45, phi: 0.96 });

  tweenCue(s, c, 'seed', showSeeds, 1, { duration: 0.45 });
  tweenCue(s, c, 'assign', assignAmt, 1, { duration: 0.65 });
  tweenCue(s, c, 'predict', showPredict, 1, { duration: 0.4 });
  tweenCue(s, c, 'meanx', showMeanX, 1, { duration: 0.45 });
  tweenCue(s, c, 'meany', showMeanY, 1, { duration: 0.45 });
  tweenCue(s, c, 'update', moveCenters, 1, { duration: 0.85 });
  tweenCue(s, c, 'again', showAgain, 1, { duration: 0.45 });
  tweenCue(s, c, 'settled', showSettled, 1, { duration: 0.45 });
  tweenCue(s, c, 'restarts', showRestarts, 1, { duration: 0.45 });
}
