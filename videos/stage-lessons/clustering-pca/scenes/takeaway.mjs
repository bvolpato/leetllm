// Scene 23 (takeaway): "Which message does the sign-in search return?"
// Finale: 5-doc corpus [P(-20,0), B(0,0), L(0,3), D(20,0), R(0,-3)] + Q(0, 3.2):
// PC1 keeps 97.8% variance yet collapses {B, L, R, Q} to x=0 -> storage tie-break picks B! Restore y -> L wins at d=0.20!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  DANGER_COLOR,
  QUERY_COLOR,
  aura,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  runAmbientPhase,
  transferDocuments,
  transferQuery,
  tweenCue,
  txt,
} from '../parts.mjs';

const DOC_COLS = [COSMOS.dim, COSMOS.cyan, COSMOS.emerald, COSMOS.dim, COSMOS.violet];

export default function takeaway(s, c) {
  const phase = s.value(0);
  const showPolicies = s.value(0);
  const showMiddle = s.value(0);
  const showHeight = s.value(0);
  const showDist = s.value(0);
  const showBaseline = s.value(0);
  const showVariance = s.value(0);
  const dropY = s.value(0); // 0 = 2D heights intact, 1 = projected onto x-axis (y=0)!
  const showTie = s.value(0);
  const showPredict = s.value(0);
  const showWrong = s.value(0);
  const showRepairQ = s.value(0);
  const showAnswer = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a34', '#3a183b18');
  const title = heroTitle(['Which Message Does the', 'Sign-In Search Return?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.emerald,
    eyebrow: 'EARNED TRANSFER · PCA SHORTCUT FINALE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const dy = dropY.value;
    const isFlat = dy > 0.5;
    const pulse = 0.72 + 0.28 * Math.sin(phase.value * 3.0);

    // Top storage-order ribbon: P, B, L, D, R
    const nodes = [
      txt(
        'STORAGE ORDER:   [ 0: P ]  [ 1: B ]  [ 2: L ]  [ 3: D ]  [ 4: R ]',
        -855,
        -252,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    // Left: Wide X-axis view (-20 .. +20) showing P and D at extremes and {B, L, R, Q} stacked at x=0
    const xL = -820;
    const xR = -120;
    const xMid = (xL + xR) / 2;
    const xAxisY = 30;
    const xOf = (v) => xMid + (v / 22) * (xR - xL) * 0.5;

    nodes.push(
      txt('WIDE HORIZONTAL AXIS (97.8% VARIANCE)', xL, -185, 26, COSMOS.muted, 'mono', 'left'),
      rule(xL, xAxisY, xR, xAxisY, COSMOS.muted, 2.5),
      glowDot(xOf(-20), xAxisY, {
        radius: 8.5,
        color: COSMOS.dim,
        glow: 8,
        opacity: 0.45 + 0.55 * showPolicies.value,
      }),
      txt('P (−20, 0)', xOf(-20), xAxisY + 42, 26, COSMOS.muted, 'mono').opacity(
        0.45 + 0.55 * showPolicies.value,
      ),
      glowDot(xOf(20), xAxisY, {
        radius: 8.5,
        color: COSMOS.dim,
        glow: 8,
        opacity: 0.45 + 0.55 * showPolicies.value,
      }),
      txt('D (+20, 0)', xOf(20), xAxisY + 42, 26, COSMOS.muted, 'mono').opacity(
        0.45 + 0.55 * showPolicies.value,
      ),
      glowRing(xMid, xAxisY, 22, COSMOS.emerald, {
        width: 2.5,
        dash: [6, 5],
        opacity: 0.4 + 0.6 * showMiddle.value,
      }),
      txt('{B, L, R, Q} at x = 0', xMid, xAxisY - 46, 26, COSMOS.emerald, 'mono').opacity(
        0.4 + 0.6 * showMiddle.value,
      ),
    );

    if (showVariance.value > 0.02) {
      nodes.push(
        txt(
          'Horizontal axis keeps 800 / 818 = 97.8% of variance!',
          xL,
          148,
          26,
          QUERY_COLOR,
          'mono',
          'left',
        ).opacity(showVariance.value),
      );
    }

    // Right: Magnified vertical coordinate lanes for B(0), L(+3), R(-3), and Query Q(+3.2)
    const laneTop = -165;
    const laneBot = 175;
    const laneMid = (laneTop + laneBot) / 2;
    const yOf = (yv) => laneMid - (yv / 3.8) * ((laneBot - laneTop) / 2);

    const items = [
      { id: 'B', label: 'billing', y: 0 * (1 - dy), col: DOC_COLS[1], x: 140 },
      { id: 'L', label: 'sign-in', y: 3 * (1 - dy), col: DOC_COLS[2], x: 355 },
      { id: 'R', label: 'runbook', y: -3 * (1 - dy), col: DOC_COLS[4], x: 570 },
      { id: 'Q', label: 'query', y: transferQuery[1] * (1 - dy), col: QUERY_COLOR, x: 765 },
    ];

    nodes.push(
      txt('MAGNIFIED VERTICAL COORDINATE (x = 0)', 80, -215, 26, COSMOS.cyan, 'mono', 'left'),
      rule(80, laneMid, 845, laneMid, COSMOS.rule, 2.2),
      txt('y = 0', 58, laneMid, 26, COSMOS.dim, 'mono', 'right'),
    );

    items.forEach((it) => {
      const py = yOf(it.y);
      const lblY = it.y >= 0 ? py - 52 : py + 52;
      nodes.push(
        line([it.x, laneMid], [it.x, py], { stroke: it.col, width: 3.5 }).opacity(
          0.4 + 0.6 * showHeight.value,
        ),
        glowDot(it.x, py, { radius: 9.5, color: it.col, glow: 12 }),
        txt(`${it.id} (${it.y.toFixed(1)})`, it.x, lblY, 26, it.col, 'mono'),
        txt(it.label, it.x, laneBot + 36, 26, COSMOS.muted, 'sans'),
      );
      if (it.id === 'B' && showWrong.value > 0.5 && isFlat) {
        nodes.push(glowRing(it.x, py, 24 + 4 * pulse, DANGER_COLOR, { width: 3.5, glow: 12 }));
      }
      if (it.id === 'L' && (showBaseline.value > 0.5 || showAnswer.value > 0.5) && !isFlat) {
        nodes.push(glowRing(it.x, py, 24 + 4 * pulse, COSMOS.emerald, { width: 3.5, glow: 12 }));
      }
    });

    if (showDist.value > 0.02 && !isFlat && showAnswer.value < 0.3) {
      nodes.push(
        txt(
          '2D search: d(Q, L) = 0.20 → L (sign-in help) wins!',
          xL,
          212,
          28,
          COSMOS.emerald,
          'mono',
          'left',
        ).opacity(showDist.value * Math.max(0, 1 - dropY.value * 2.5)),
      );
    }

    // Bottom non-overlapping prompts & resolutions
    const p1Op = showPredict.value * Math.max(0, 1 - showWrong.value * 2.6);
    if (p1Op > 0.02) {
      nodes.push(
        txt(
          'B, L, R all tie at distance 0 (first in storage order wins). Which ID returns?',
          -855,
          335,
          30,
          QUERY_COLOR,
          'serif',
          'left',
        )
          .glow(6, QUERY_COLOR)
          .opacity(p1Op),
      );
    }

    const wOp =
      Math.max(0, (showWrong.value - 0.45) / 0.55) * Math.max(0, 1 - showAnswer.value * 2.6);
    if (wOp > 0.02) {
      nodes.push(
        txt(
          showRepairQ.value > 0.5
            ? 'B returned (tie-break)! Open another IVF list, OR bring back coordinate y?'
            : 'B (billing help) wins the tie even though L had the exact same score!',
          -855,
          335,
          30,
          showRepairQ.value > 0.5 ? QUERY_COLOR : DANGER_COLOR,
          'sans',
          'left',
        )
          .glow(6, showRepairQ.value > 0.5 ? QUERY_COLOR : DANGER_COLOR)
          .opacity(wOp),
      );
    }

    const ansOp = Math.max(0, (showAnswer.value - 0.45) / 0.55);
    if (ansOp > 0.02) {
      nodes.push(
        lumBar(-20, 350, 1670, 82, {
          color: COSMOS.emerald,
          fillOpacity: 0.14,
          glow: 9,
          opacity: ansOp,
        }),
        txt(
          'Bring back y: d(Q, L) = 0.20 → L wins! Always check shortcuts against flat search.',
          -20,
          350,
          30,
          COSMOS.emerald,
          'mono',
        )
          .glow(7, COSMOS.emerald)
          .opacity(ansOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'policies', showPolicies, 1, { duration: 0.45 });
  tweenCue(s, c, 'middle', showMiddle, 1, { duration: 0.45 });
  tweenCue(s, c, 'height', showHeight, 1, { duration: 0.45 });
  tweenCue(s, c, 'dist', showDist, 1, { duration: 0.45 });
  tweenCue(s, c, 'baseline', showBaseline, 1, { duration: 0.45 });
  tweenCue(s, c, 'variance', showVariance, 1, { duration: 0.45 });
  tweenCue(s, c, 'project', dropY, 1, { duration: 0.85 });
  tweenCue(s, c, 'tie', showTie, 1, { duration: 0.45 });
  tweenCue(s, c, 'predict', showPredict, 1, { duration: 0.45 });
  tweenCue(s, c, 'wrong', showWrong, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'repair-question', showRepairQ, 1, { duration: 0.45 });
  tweenCue(s, c, 'restore', dropY, 0, { duration: 0.85, after: true });
  tweenCue(s, c, 'answer', showAnswer, 1, { duration: 0.45 });
}
