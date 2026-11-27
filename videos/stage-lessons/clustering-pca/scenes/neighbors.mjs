// Scene 02 (neighbors): "Build a distance from two coordinate changes"
// Glowing right-triangle dx/dy legs from A(1.0,1.0) to B(1.2,1.8) -> sqrt(0.68)=0.825 vs C(4.0,4.2)=4.386 -> 3 pairs.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  GROUP_COLOR,
  LETTERS,
  QUERY_COLOR,
  aura,
  distance,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  labels,
  makePlot,
  tweenCue,
  txt,
  withinGroupDistances,
  xy,
} from '../parts.mjs';

const DIST_AB = withinGroupDistances[0]; // sqrt(0.68) = 0.8246
const DIST_AC = distance(xy[0], xy[2]); // sqrt(9 + 10.24) = 4.386

export default function neighbors(s, c) {
  const legX = s.value(0);
  const legY = s.value(0);
  const showSq = s.value(0);
  const showRoot = s.value(0);
  const showCompete = s.value(0);
  const showWinner = s.value(0);
  const showPairs = s.value(0);

  const bgAura = aura(320, 20, 560, '#133a4a34', '#1d225216');
  const title = heroTitle(['Build Distance From', 'Two Coordinate Steps'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'EUCLIDEAN METRIC',
  });

  const eqDist = glowTex(
    'd(A, B) = \\sqrt{(\\Delta x)^2 + (\\Delta y)^2} = \\sqrt{0.68} \\approx 0.82',
    {
      x: -430,
      y: -215,
      size: 32,
      color: QUERY_COLOR,
      glow: 6,
    },
  );

  const live = guardedDynamic(s.value(1), () => {
    const plot = makePlot(80, -290, 770, 580, { x: [0, 10], y: [0, 5.2] });
    const aPt = plot.pt(xy[0]);
    const bPt = plot.pt(xy[1]);
    const cPt = plot.pt(xy[2]);
    const corner = [bPt[0], aPt[1]];

    const nodes = [
      ...plot.axesNodes(0.85),
      txt('COORDINATE PLANE (6 MESSAGES)', 465, -330, 26, COSMOS.cyan, 'mono'),
    ];

    // Right-triangle construction A -> corner -> B
    if (legX.value > 0.02) {
      const mx = aPt[0] + (corner[0] - aPt[0]) * legX.value;
      nodes.push(
        glowingTrail([aPt, [mx, aPt[1]]], {
          color: COSMOS.cyan,
          width: 4.5,
          glow: 9,
          opacity: legX.value,
        }),
        txt('Δx = 0.2', -855, -105, 30, COSMOS.cyan, 'mono', 'left').opacity(legX.value),
      );
    }
    if (legY.value > 0.02) {
      const my = aPt[1] + (bPt[1] - aPt[1]) * legY.value;
      nodes.push(
        glowingTrail([corner, [corner[0], my]], {
          color: COSMOS.emerald,
          width: 4.5,
          glow: 9,
          opacity: legY.value,
        }),
        txt('Δy = 0.8', -855, -45, 30, COSMOS.emerald, 'mono', 'left').opacity(legY.value),
      );
    }
    if (showSq.value > 0.02) {
      nodes.push(
        txt(
          '(0.2)² + (0.8)² = 0.04 + 0.64 = 0.68',
          -855,
          25,
          28,
          QUERY_COLOR,
          'mono',
          'left',
        ).opacity(showSq.value),
      );
    }
    if (showRoot.value > 0.02) {
      nodes.push(
        glowingTrail([aPt, bPt], {
          color: QUERY_COLOR,
          width: 4.5,
          glow: 11,
          opacity: showRoot.value,
        }),
        txt(`d(A, B) = √0.68 = ${DIST_AB.toFixed(3)}`, -855, 92, 32, QUERY_COLOR, 'mono', 'left')
          .glow(7, QUERY_COLOR)
          .opacity(showRoot.value),
      );
    }
    if (showCompete.value > 0.02) {
      nodes.push(
        line(aPt, cPt, { stroke: COSMOS.rose, width: 3.0, dash: [10, 7] }).opacity(
          showCompete.value,
        ),
        txt(
          `d(A, C) = ${DIST_AC.toFixed(3)} (login message)`,
          -855,
          175,
          28,
          COSMOS.rose,
          'mono',
          'left',
        ).opacity(showCompete.value),
      );
    }
    if (showWinner.value > 0.02) {
      nodes.push(
        txt(
          '0.825 < 4.386  ⇒  billing partner B is 5.3× closer',
          -855,
          240,
          28,
          COSMOS.emerald,
          'mono',
          'left',
        )
          .glow(6, COSMOS.emerald)
          .opacity(showWinner.value),
      );
    }
    if (showPairs.value > 0.02) {
      const pairs = [
        [0, 1],
        [2, 3],
        [4, 5],
      ];
      pairs.forEach(([u, v], k) => {
        nodes.push(
          glowingTrail([plot.pt(xy[u]), plot.pt(xy[v])], {
            color: GROUP_COLOR[k],
            width: 4.0,
            glow: 9,
            opacity: showPairs.value,
          }),
        );
      });
      nodes.push(
        txt(
          'Algorithm sees only coordinates & distance (human labels come later)',
          -855,
          340,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(showPairs.value),
      );
    }

    // Plot all 6 points
    xy.forEach((p, i) => {
      const [px, py] = plot.pt(p);
      const col =
        showPairs.value > 0.5 ? GROUP_COLOR[labels[i]] : i < 2 ? COSMOS.cyan : COSMOS.muted;
      nodes.push(
        glowDot(px, py, { radius: 8, color: col, glow: 10 }),
        txt(
          LETTERS[i],
          px + (i === 0 ? -24 : i === 4 ? -28 : 0),
          py + (i === 0 ? 30 : -32),
          28,
          col,
          'mono',
        ),
      );
    });

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'x', legX, 1, { duration: 0.55 });
  tweenCue(s, c, 'y', legY, 1, { duration: 0.55 });
  tweenCue(s, c, 'square', showSq, 1, { duration: 0.45 });
  tweenCue(s, c, 'root', showRoot, 1, { duration: 0.5 });
  c.show('root', eqDist);
  tweenCue(s, c, 'compete', showCompete, 1, { duration: 0.5 });
  tweenCue(s, c, 'winner', showWinner, 1, { duration: 0.45 });
  tweenCue(s, c, 'pairs', showPairs, 1, { duration: 0.55 });
}
