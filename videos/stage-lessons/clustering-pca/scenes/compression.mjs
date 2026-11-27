// Scene 15 (compression): "Who is closest along the fitted line?"
// Project C -> rewind & add Query -> drop all 6 + Q onto PC1 line -> C beats B along 1D line! -> restore 2nd coord -> B wins again.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  DANGER_COLOR,
  GROUP_COLOR,
  LETTERS,
  QUERY_COLOR,
  aura,
  distance,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  labels,
  makePlot,
  pca,
  query,
  tweenCue,
  txt,
  xy,
} from '../parts.mjs';

const footOf = (p) => {
  const sc = (p[0] - pca.mean[0]) * pca.vector[0] + (p[1] - pca.mean[1]) * pca.vector[1];
  return [pca.mean[0] + sc * pca.vector[0], pca.mean[1] + sc * pca.vector[1]];
};

export default function compression(s, c) {
  const dropC = s.value(0);
  const showErrC = s.value(0);
  const showQuery = s.value(0);
  const showBaseline = s.value(0);
  const dropAll = s.value(0); // 0 = 2D, 1 = projected onto PC1
  const showKept = s.value(0);
  const showPredict = s.value(0);
  const showWrong = s.value(0);
  const showZero = s.value(0);
  const showAnswer = s.value(0);

  const bgAura = aura(0, 20, 620, '#3a183b2c', '#133a4a18');
  const title = heroTitle(['Who Is Closest Along', 'the Fitted 1D Line?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: DANGER_COLOR,
    eyebrow: 'PCA PROJECTION & NEIGHBOR REVERSAL',
  });

  const live = guardedDynamic(s.value(1), () => {
    const dAll = dropAll.value;
    const dC = Math.max(dropC.value, dAll);
    const plot = makePlot(-820, -235, 920, 500, { x: [0, 10], y: [0, 5.2] });

    const lineStart = plot.pt([
      pca.mean[0] - 4.8 * pca.vector[0],
      pca.mean[1] - 4.8 * pca.vector[1],
    ]);
    const lineEnd = plot.pt([pca.mean[0] + 4.8 * pca.vector[0], pca.mean[1] + 4.8 * pca.vector[1]]);

    const curPts = xy.map((p, i) => {
      const f = footOf(p);
      const t = i === 2 ? dC : dAll;
      return [p[0] + (f[0] - p[0]) * t, p[1] + (f[1] - p[1]) * t];
    });
    const qFoot = footOf(query);
    const curQ = [query[0] + (qFoot[0] - query[0]) * dAll, query[1] + (qFoot[1] - query[1]) * dAll];

    const dQB = distance(curQ, curPts[1]);
    const dQC = distance(curQ, curPts[2]);
    const errTotal = curPts.reduce((acc, p, i) => acc + distance(p, xy[i]) ** 2, 0);

    const nodes = [
      ...plot.axesNodes(0.85),
      line(lineStart, lineEnd, { stroke: COSMOS.cyan, width: 3.5 }).opacity(0.9),
      txt('PC1 LINE (KEEPS 85.2% VARIANCE)', -820, -272, 26, COSMOS.cyan, 'mono', 'left'),
    ];

    // Residual shortfall lines (red)
    xy.forEach((p, i) => {
      const t = i === 2 ? dC : dAll;
      if (t > 0.03) {
        nodes.push(
          line(plot.pt(p), plot.pt(curPts[i]), {
            stroke: DANGER_COLOR,
            width: 2.8,
            dash: [7, 5],
          }).opacity(0.85),
        );
      }
    });

    // Plot all 6 messages (place labels cleanly away from residual lines)
    curPts.forEach((p, i) => {
      const [px, py] = plot.pt(p);
      const col = GROUP_COLOR[labels[i]];
      const isUpper = i === 2 || i === 3;
      nodes.push(
        glowDot(px, py, { radius: 8.5, color: col, glow: 10 }),
        txt(
          LETTERS[i],
          px +
            (i === 0
              ? -34
              : i === 2
                ? -40
                : i === 3
                  ? 26
                  : i === 4
                    ? -24
                    : i === 1
                      ? 30
                      : i === 5
                        ? 32
                        : 0),
          py + (isUpper ? -36 : i === 0 ? 32 : i === 1 ? 34 : i === 5 ? 26 : 34),
          26,
          col,
          'mono',
        ),
      );
    });

    // Query dot & distance links
    if (showQuery.value > 0.02) {
      const [qx, qy] = plot.pt(curQ);
      nodes.push(
        glowDot(qx, qy, { radius: 9.5, color: QUERY_COLOR, glow: 14, opacity: showQuery.value }),
        txt('Q', qx - 32, qy - 36, 28, QUERY_COLOR, 'mono').opacity(showQuery.value),
      );
      if (showWrong.value > 0.5 && dAll > 0.5) {
        const [cx, cy] = plot.pt(curPts[2]);
        nodes.push(glowRing(cx, cy, 24, DANGER_COLOR, { width: 3.5, glow: 12 }));
      }
      if (showAnswer.value > 0.5 && dAll < 0.2) {
        const [bx, by] = plot.pt(curPts[1]);
        nodes.push(glowRing(bx, by, 24, COSMOS.emerald, { width: 3.5, glow: 12 }));
      }
    }

    // Right-side live distance & reconstruction ledger (withhold 1D numbers during prediction hold!)
    const rx = 185;
    const hide1d = dAll > 0.5 && showWrong.value < 0.5;
    nodes.push(
      txt('LIVE DISTANCES FROM Q', rx, -235, 26, QUERY_COLOR, 'mono', 'left'),
      txt(
        hide1d ? 'd(Q, B) = ?' : `d(Q, B) = ${dQB.toFixed(2)}`,
        rx,
        -162,
        34,
        GROUP_COLOR[0],
        'mono',
        'left',
      ).opacity(0.35 + 0.65 * Math.max(showQuery.value, showBaseline.value)),
      txt(
        hide1d ? 'd(Q, C) = ?' : `d(Q, C) = ${dQC.toFixed(2)}`,
        rx,
        -96,
        34,
        GROUP_COLOR[1],
        'mono',
        'left',
      ).opacity(0.35 + 0.65 * Math.max(showQuery.value, showBaseline.value)),
      txt('RECONSTRUCTION ERROR', rx, 10, 26, DANGER_COLOR, 'mono', 'left'),
      txt(
        `${errTotal.toFixed(2)}`,
        rx,
        82,
        56,
        errTotal < 0.05 ? COSMOS.emerald : DANGER_COLOR,
        'mono',
        'left',
      ).glow(8, errTotal < 0.05 ? COSMOS.emerald : DANGER_COLOR),
    );

    if (showErrC.value > 0.02 && showQuery.value < 0.3) {
      nodes.push(
        txt(
          'Red segment = C’s perpendicular shortfall',
          rx,
          175,
          26,
          DANGER_COLOR,
          'sans',
          'left',
        ).opacity(showErrC.value),
      );
    }

    const keptOp = showKept.value * Math.max(0, 1 - showZero.value * 2.6);
    if (keptOp > 0.02) {
      nodes.push(
        txt(
          '85.2% variance kept · 14.8% discarded',
          rx,
          175,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(keptOp),
      );
    }

    const zeroOp = Math.max(0, (showZero.value - 0.45) / 0.55);
    if (zeroOp > 0.02) {
      nodes.push(
        txt(
          '2D residual = 0.00 (exact recovery)',
          rx,
          175,
          26,
          COSMOS.emerald,
          'mono',
          'left',
        ).opacity(zeroOp),
      );
    }

    // Non-overlapping prediction -> wrong winner C -> restored winner B along bottom
    const pOp = showPredict.value * Math.max(0, 1 - showWrong.value * 2.6);
    if (pOp > 0.02) {
      nodes.push(
        txt(
          'Which message will the 1-coordinate search return?',
          -855,
          345,
          32,
          QUERY_COLOR,
          'serif',
          'left',
        )
          .glow(6, QUERY_COLOR)
          .opacity(pOp),
      );
    }
    const wOp =
      Math.max(0, (showWrong.value - 0.45) / 0.55) * Math.max(0, 1 - showAnswer.value * 2.6);
    if (wOp > 0.02) {
      nodes.push(
        txt(
          'C (reset link) wins along PC1! Dropping the perpendicular coordinate flipped B and C.',
          -855,
          345,
          28,
          DANGER_COLOR,
          'sans',
          'left',
        )
          .glow(6, DANGER_COLOR)
          .opacity(wOp),
      );
    }
    const rOp = Math.max(0, (showAnswer.value - 0.45) / 0.55);
    if (rOp > 0.02) {
      nodes.push(
        txt(
          'Restored 2nd coordinate: error → 0.00, and B (duplicate payment) is nearest again!',
          -855,
          345,
          30,
          COSMOS.emerald,
          'mono',
          'left',
        )
          .glow(7, COSMOS.emerald)
          .opacity(rOp),
      );
    }
    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'single', dropC, 1, { duration: 0.7 });
  tweenCue(s, c, 'error', showErrC, 1, { duration: 0.45 });
  tweenCue(s, c, 'rewind', dropC, 0, { duration: 0.6 });
  tweenCue(s, c, 'query', showQuery, 1, { duration: 0.45 });
  tweenCue(s, c, 'baseline', showBaseline, 1, { duration: 0.4 });
  tweenCue(s, c, 'drop', dropAll, 1, { duration: 0.9 });
  tweenCue(s, c, 'kept', showKept, 1, { duration: 0.45 });
  tweenCue(s, c, 'predict', showPredict, 1, { duration: 0.45 });
  tweenCue(s, c, 'wrong', showWrong, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'restore', dropAll, 0, { duration: 0.85 });
  tweenCue(s, c, 'zero', showZero, 1, { duration: 0.45 });
  tweenCue(s, c, 'answer', showAnswer, 1, { duration: 0.45 });
}
