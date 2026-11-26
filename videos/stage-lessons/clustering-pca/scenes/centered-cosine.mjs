// Scene 19 (centered-cosine): "What changes when the origin moves?"
// Translating by fitted mean swings Doc 2 past 90 deg (positive -> negative cosine!) while Euclidean distances stay invariant; mean-point hits (0,0) -> undefined cosine.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  DANGER_COLOR,
  QUERY_COLOR,
  aura,
  cosine,
  distance,
  glowArrow,
  glowDot,
  guardedDynamic,
  heroTitle,
  makePlot,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const Q_RAW = [3.0, 4.0];
const D1_RAW = [2.6, 4.4];
const D2_RAW = [6.4, 1.6];
const MEAN_DOC = [(D1_RAW[0] + D2_RAW[0]) / 2, (D1_RAW[1] + D2_RAW[1]) / 2]; // [4.5, 3.0]
const COS1_RAW = cosine(Q_RAW, D1_RAW);
const COS2_RAW = cosine(Q_RAW, D2_RAW);
const DIST1 = distance(Q_RAW, D1_RAW);
const DIST2 = distance(Q_RAW, D2_RAW);

export default function centeredCosine(s, c) {
  const phase = s.value(0);
  const showOrig = s.value(0);
  const shiftAmt = s.value(0);
  const showVals = s.value(0);
  const showDist = s.value(0);
  const showZero = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a30', '#3a183b18');
  const title = heroTitle(['What Changes When', 'the Origin Moves?'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.cyan,
    eyebrow: 'MEAN-CENTERING & COSINE GEOMETRY',
  });

  const live = guardedDynamic(s.value(1), () => {
    const sh = shiftAmt.value;
    const plot = makePlot(-815, -245, 810, 520, { x: [-3.2, 7.2], y: [-2.8, 5.2] });
    const orig = plot.pt([0, 0]);

    const curQ = [Q_RAW[0] - MEAN_DOC[0] * sh, Q_RAW[1] - MEAN_DOC[1] * sh];
    const cur1 = [D1_RAW[0] - MEAN_DOC[0] * sh, D1_RAW[1] - MEAN_DOC[1] * sh];
    const cur2 = [D2_RAW[0] - MEAN_DOC[0] * sh, D2_RAW[1] - MEAN_DOC[1] * sh];

    const c1Now = cosine(curQ, cur1) ?? 0;
    const c2Now = cosine(curQ, cur2) ?? 0;

    const nodes = [
      ...plot.axesNodes(0.75),
      line([orig[0] - 85, orig[1]], [orig[0] + 85, orig[1]], { stroke: COSMOS.muted, width: 2.0 }),
      line([orig[0], orig[1] - 85], [orig[0], orig[1] + 85], { stroke: COSMOS.muted, width: 2.0 }),
      txt('O (0,0)', orig[0] - 16, orig[1] + 32, 26, COSMOS.muted, 'mono', 'right'),
      glowArrow(orig, plot.pt(curQ), QUERY_COLOR, { width: 4.2 }),
      txt('Q', plot.pt(curQ)[0] + 28, plot.pt(curQ)[1] - 26, 28, QUERY_COLOR, 'mono'),
      glowArrow(orig, plot.pt(cur1), COSMOS.emerald, { width: 4.0 }),
      txt(
        'Doc 1',
        plot.pt(cur1)[0] + 6,
        plot.pt(cur1)[1] - 38,
        26,
        COSMOS.emerald,
        'mono',
        'center',
      ),
      glowArrow(orig, plot.pt(cur2), COSMOS.violet, { width: 4.0 }),
      txt('Doc 2', plot.pt(cur2)[0] + 18, plot.pt(cur2)[1] + 24, 26, COSMOS.violet, 'mono', 'left'),
    ];

    // Pairwise Euclidean distance links (invariant under translation!)
    if (showDist.value > 0.02) {
      nodes.push(
        line(plot.pt(curQ), plot.pt(cur1), {
          stroke: COSMOS.emerald,
          width: 3,
          dash: [7, 5],
        }).opacity(showDist.value),
        line(plot.pt(curQ), plot.pt(cur2), {
          stroke: COSMOS.violet,
          width: 3,
          dash: [7, 5],
        }).opacity(showDist.value),
      );
    }

    // Hypothetical document at fitted mean lands right on (0,0) -> undefined cosine!
    if (showZero.value > 0.02) {
      nodes.push(
        glowDot(orig[0], orig[1], {
          radius: 11,
          color: DANGER_COLOR,
          glow: 14,
          opacity: showZero.value,
        }),
      );
    }

    // Right ledger: Source vs Live Cosine + Fixed Distances
    const rx = 105;
    nodes.push(
      txt('COSINE SIMILARITY (ORIGIN-DEPENDENT)', rx, -235, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        `Doc 1:  raw ${COS1_RAW.toFixed(2)}   →   live ${c1Now.toFixed(2)}`,
        rx,
        -155,
        30,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * showOrig.value),
      txt(
        `Doc 2:  raw +${COS2_RAW.toFixed(2)}   →   live ${c2Now >= 0 ? '+' : ''}${c2Now.toFixed(2)}`,
        rx,
        -88,
        30,
        c2Now < 0 ? DANGER_COLOR : COSMOS.violet,
        'mono',
        'left',
      )
        .glow(c2Now < 0 ? 7 : 0, DANGER_COLOR)
        .opacity(0.45 + 0.55 * showOrig.value),
    );

    if (showVals.value > 0.02) {
      nodes.push(
        txt(
          'Doc 2 swung past 90°: cosine flipped negative!',
          rx,
          -12,
          26,
          DANGER_COLOR,
          'sans',
          'left',
        ).opacity(showVals.value),
      );
    }

    if (showDist.value > 0.02) {
      nodes.push(
        txt('EUCLIDEAN DISTANCES (INVARIANT)', rx, 88, 26, COSMOS.cyan, 'mono', 'left').opacity(
          showDist.value,
        ),
        txt(
          `d(Q, Doc 1) = ${DIST1.toFixed(2)}   ·   d(Q, Doc 2) = ${DIST2.toFixed(2)}`,
          rx,
          145,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(showDist.value),
      );
    }

    if (showZero.value > 0.02) {
      nodes.push(
        txt(
          'Doc at fitted mean → lands at (0,0) → cos undefined!',
          rx,
          245,
          26,
          DANGER_COLOR,
          'mono',
          'left',
        )
          .glow(7, DANGER_COLOR)
          .opacity(showZero.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.0);

  tweenCue(s, c, 'original', showOrig, 1, { duration: 0.45 });
  tweenCue(s, c, 'translate', shiftAmt, 1, { duration: 0.9 });
  tweenCue(s, c, 'values', showVals, 1, { duration: 0.45 });
  tweenCue(s, c, 'distance', showDist, 1, { duration: 0.45 });
  tweenCue(s, c, 'zero', showZero, 1, { duration: 0.45 });
}
