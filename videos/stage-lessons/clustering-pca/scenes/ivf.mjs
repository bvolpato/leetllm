// Scene 20 (ivf): "Which list gets opened?"
// 3 coarse centroid posting lists: nprobe=1 opens upper list {C, D} (misses B in closed left list!); nprobe=2 opens left list {A, B} -> B recovered (3+4=7 dists vs 6 flat!).
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  DANGER_COLOR,
  GROUP_COLOR,
  LETTERS,
  QUERY_COLOR,
  aura,
  centroids,
  coarseDistances,
  distance,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  labels,
  lumBar,
  makePlot,
  query,
  tweenCue,
  txt,
  xy,
} from '../parts.mjs';

const DIST_B = distance(query, xy[1]); // 1.84
const DIST_C = distance(query, xy[2]); // 1.91

export default function ivf(s, c) {
  const showRoute = s.value(0);
  const showCoarse = s.value(0);
  const showPredict = s.value(0);
  const openOne = s.value(0);
  const showWrong = s.value(0);
  const openTwo = s.value(0);
  const showWinner = s.value(0);
  const showWork = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a32', '#2a1c4f18');
  const title = heroTitle(['Inverted-File Index:', 'Which List Gets Opened?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'IVF COARSE ROUTING · NPROBE = 1 vs 2',
  });

  const live = guardedDynamic(s.value(1), () => {
    const plot = makePlot(-835, -235, 760, 470, { x: [0, 10], y: [0, 5.2] });
    const qPt = plot.pt(query);
    const p1 = openOne.value > 0.5;
    const p2 = openTwo.value > 0.5;

    const nodes = [
      ...plot.axesNodes(0.85),
      txt('2D MAP & 3 CLUSTER CENTERS', -835, -272, 26, COSMOS.cyan, 'mono', 'left'),
    ];

    // Coarse distance lines from Q to all 3 centroids
    if (showCoarse.value > 0.02) {
      centroids.forEach((ct, k) => {
        nodes.push(
          line(qPt, plot.pt(ct), {
            stroke: GROUP_COLOR[k],
            width: k === 1 || (k === 0 && p2) ? 3.2 : 1.8,
            dash: [7, 5],
          }).opacity(showCoarse.value * 0.8),
        );
      });
    }

    // 6 message points + 3 centroids
    xy.forEach((p, i) => {
      const [px, py] = plot.pt(p);
      const grp = labels[i];
      const opened = (grp === 1 && p1) || (grp === 0 && p2);
      const col = opened ? GROUP_COLOR[grp] : COSMOS.muted;
      nodes.push(
        glowDot(px, py, { radius: opened ? 9 : 7, color: col, glow: opened ? 12 : 5 }),
        txt(
          LETTERS[i],
          px + (i === 0 ? -28 : i === 2 ? -28 : i === 1 ? -34 : 0),
          py + (i === 0 ? 24 : i === 2 ? -32 : i === 1 ? -32 : -26),
          26,
          col,
          'mono',
        ),
      );
      if (i === 2 && showWrong.value > 0.5 && !p2) {
        nodes.push(glowRing(px, py, 22, DANGER_COLOR, { width: 3.5, glow: 12 }));
      }
      if (i === 1 && showWinner.value > 0.5 && p2) {
        nodes.push(glowRing(px, py, 22, COSMOS.emerald, { width: 3.5, glow: 12 }));
      }
    });

    centroids.forEach((ct, k) => {
      const [cx, cy] = plot.pt(ct);
      nodes.push(
        glowRing(cx, cy, 17, GROUP_COLOR[k], {
          width: 3,
          glow: 9,
          opacity: 0.45 + 0.55 * showRoute.value,
        }),
      );
    });

    nodes.push(
      glowDot(qPt[0], qPt[1], { radius: 9.5, color: QUERY_COLOR, glow: 14 }),
      txt('Q', qPt[0] - 24, qPt[1] - 24, 28, QUERY_COLOR, 'mono'),
    );

    // Right side: 3 IVF posting lists showing OPEN vs CLOSED status
    const rx = 25;
    const lists = [
      {
        k: 1,
        name: 'List 2 (upper):  C, D',
        dist: coarseDistances[1],
        open: p1,
        detail: `C: ${DIST_C.toFixed(2)}, D: 2.45`,
      },
      {
        k: 0,
        name: 'List 1 (left):   A, B',
        dist: coarseDistances[0],
        open: p2,
        detail: `B: ${DIST_B.toFixed(2)}, A: 2.48`,
      },
      {
        k: 2,
        name: 'List 3 (right):  E, F',
        dist: coarseDistances[2],
        open: false,
        detail: 'closed',
      },
    ];

    nodes.push(
      txt('IVF POSTING LISTS (BY COARSE DISTANCE)', rx, -235, 26, QUERY_COLOR, 'mono', 'left'),
    );
    lists.forEach((ls, idx) => {
      const y = -135 + idx * 124;
      const col = ls.open ? GROUP_COLOR[ls.k] : COSMOS.dim;
      nodes.push(
        lumBar(rx + 410, y, 820, 96, {
          color: col,
          fillOpacity: ls.open ? 0.2 : 0.08,
          dash: ls.open ? undefined : [8, 6],
          glow: ls.open ? 9 : 3,
        }),
        txt(
          `${ls.name}   (d_c = ${ls.dist.toFixed(2)})`,
          rx + 24,
          y - 18,
          26,
          ls.open ? col : COSMOS.muted,
          'mono',
          'left',
        ),
        txt(
          ls.open ? `OPEN → ${ls.detail}` : 'CLOSED (not scanned)',
          rx + 24,
          y + 22,
          26,
          ls.open ? COSMOS.ink : COSMOS.dim,
          'mono',
          'left',
        ),
      );
    });

    // Bottom non-overlapping prediction -> nprobe=1 wrong -> nprobe=2 winner + work
    const predOp = showPredict.value * Math.max(0, 1 - showWrong.value * 2.6);
    if (predOp > 0.02) {
      nodes.push(
        txt(
          'Upper list holds {C, D}. If we open ONLY the upper list, can it return B?',
          -855,
          340,
          30,
          QUERY_COLOR,
          'serif',
          'left',
        )
          .glow(6, QUERY_COLOR)
          .opacity(predOp),
      );
    }
    const wrOp =
      Math.max(0, (showWrong.value - 0.45) / 0.55) * Math.max(0, 1 - showWinner.value * 2.6);
    if (wrOp > 0.02) {
      nodes.push(
        txt(
          'nprobe = 1 misses B (closed left list) and returns C (d = 1.91)!',
          -855,
          340,
          30,
          DANGER_COLOR,
          'mono',
          'left',
        )
          .glow(6, DANGER_COLOR)
          .opacity(wrOp),
      );
    }
    const winOp = Math.max(0, (showWinner.value - 0.45) / 0.55);
    if (winOp > 0.02) {
      nodes.push(
        txt(
          showWork.value > 0.5
            ? 'nprobe = 2 recovers B (1.84 < 1.91): 3 coarse + 4 doc = 7 dists (vs 6 flat!)'
            : 'nprobe = 2 opens left list → B (1.84) beats C (1.91) and comes back!',
          -855,
          340,
          28,
          COSMOS.emerald,
          'mono',
          'left',
        )
          .glow(7, COSMOS.emerald)
          .opacity(winOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  c.on('query', () => s.play(showRoute.to(0.35, { duration: 0.3 })));
  tweenCue(s, c, 'route', showRoute, 1, { duration: 0.45 });
  tweenCue(s, c, 'coarse', showCoarse, 1, { duration: 0.45 });
  tweenCue(s, c, 'predict', showPredict, 1, { duration: 0.45 });
  tweenCue(s, c, 'one', openOne, 1, { duration: 0.5 });
  tweenCue(s, c, 'wrong', showWrong, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'two', openTwo, 1, { duration: 0.5 });
  tweenCue(s, c, 'winner', showWinner, 1, { duration: 0.45 });
  tweenCue(s, c, 'work', showWork, 1, { duration: 0.45 });
}
