// Act 4 (Scenes 19-25): Ranking & ROC-AUC Pair Grid, Rare-Event Prevalence Shifts,
// Precision-Recall & Average Precision with Ties, Monotonic Rescaling,
// Calibration Bins & Reliability, ECE / Brier / Disputed Label Audit, and Calibration Maps.
import { circle, dot, dynamic, gridPlane3d, group, line, rect, surface } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SORTED_VAL,
  auditProbabilities,
  calibrationAudit,
  calibrationBins,
  cinemaGrid,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  glowBar,
  glowCol,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  isotonicFixture,
  livingDrift,
  makeAxes,
  mix,
  neonCurve,
  pairEvidence,
  plattFitStates,
  prevalenceFixture,
  rankingMetrics,
  rule,
  sampleCurve,
  scaleTrack,
  sigmoid,
  smooth,
  training,
  txt,
  validation,
  validationScores,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 19. ranking: Which request scores higher? (ROC-AUC 16-pair comparison grid)
// Cues: auc-first, auc-loss*, auc-switch, auc-win*, auc-pairs, auc-result*
// ---------------------------------------------------------------------------
export function rankingScene(s, c) {
  const firstP = s.value(0);
  const lossP = s.value(0);
  const switchP = s.value(0);
  const winP = s.value(0);
  const pairsP = s.value(0);
  const resP = s.value(0);
  const drift = s.value(0);

  const positives = validationScores.filter((v) => v.label === 1);
  const negatives = validationScores.filter((v) => v.label === 0);
  const ex0 = pairEvidence.find((p) => p.positive.id === 'V3' && p.negative.id === 'V4');
  const ex1 = pairEvidence.find((p) => p.positive.id === 'V3' && p.negative.id === 'V6');
  const orderedPairs = [ex0, ex1, ...pairEvidence.filter((p) => p !== ex0 && p !== ex1)];

  s.add(cinemaGrid({ accent: ROLE.threshold, seed: 19 }));
  s.add(decorAura(160, 0, 560, '#ffd1661a', '#6ee7b714'));

  const headline = heroTitle(['Pairwise Ranking', '& ROC-AUC'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.threshold,
    eyebrow: '4 REQUIRED × 4 ROUTINE = 16 PAIRS',
  });

  const live = dynamic(() => {
    const ls = lossP.value;
    const sw = switchP.value;
    const wn = winP.value;
    const pr = pairsP.value;
    const rs = resP.value;

    const settledCount =
      (ls > 0.5 ? 1 : 0) + (wn > 0.5 ? 1 : 0) + Math.floor(pr * (orderedPairs.length - 2));
    const settled = new Set(orderedPairs.slice(0, settledCount));
    const wins = orderedPairs.slice(0, settledCount).reduce((acc, item) => acc + item.win, 0);
    const activePair =
      pr >= 0.99
        ? null
        : orderedPairs[
            pr > 0.01 ? Math.min(settledCount, orderedPairs.length - 1) : sw > 0.5 ? 1 : 0
          ];

    const nodes = [];

    // Left: 8 sorted validation score bars
    nodes.push(txt('HELD-OUT SCORES', -525, -225, 28, ROLE.score, 'mono'));
    SORTED_VAL.forEach((v, i) => {
      const y = -155 + i * 64;
      const col = v.label ? ROLE.positive : ROLE.negative;
      const isActive = activePair && (v === activePair.positive || v === activePair.negative);
      const barW = 360 * v.p;
      nodes.push(
        txt(v.id, -815, y, 28, isActive ? ROLE.threshold : col, 'mono', 'left'),
        scaleTrack(-725, y, 360, 26, {
          stroke: isActive ? ROLE.threshold : '#2a3a5e',
          radius: 6,
        }),
        glowBar(-725, y, barW, 26, col, { glow: isActive ? 12 : 6, radius: 6 }),
        txt(v.p.toFixed(3), -340, y, 28, isActive ? ROLE.threshold : COSMOS.muted, 'mono', 'left'),
      );
    });

    // Right: 4x4 positive vs negative pair matrix
    nodes.push(txt('ROUTINE  (y = 0)', 420, -235, 26, ROLE.negative, 'mono'));
    negatives.forEach((n, j) => {
      nodes.push(txt(n.id, 130 + j * 195, -182, 28, ROLE.negative, 'mono'));
    });
    positives.forEach((pos, i) => {
      const cy = -95 + i * 116;
      nodes.push(txt(pos.id, 0, cy, 28, ROLE.positive, 'mono'));
      negatives.forEach((neg, j) => {
        const item = pairEvidence[i * 4 + j];
        const cx = 130 + j * 195;
        const isSettled = settled.has(item);
        const isAct = item === activePair;
        const fill = isSettled ? (item.win === 1 ? '#12382b' : '#3a1425') : '#0f172b';
        const stroke = isAct
          ? ROLE.threshold
          : isSettled
            ? item.win === 1
              ? ROLE.good
              : ROLE.positive
            : '#2c3d63';
        nodes.push(
          rect(164, 92, { fill, stroke, width: isAct ? 3.6 : 2.2, radius: 10 })
            .at(cx, cy)
            .glow(isAct ? 10 : 0, stroke),
          txt(
            isSettled ? String(item.win) : isAct ? '?' : '·',
            cx,
            cy,
            40,
            isSettled
              ? item.win === 1
                ? ROLE.good
                : ROLE.positive
              : isAct
                ? ROLE.threshold
                : COSMOS.dim,
            'mono',
          ),
        );
      });
    });

    // Bottom strictly withheld answer / verdict readout
    let caption = 'Does V3 (0.595) beat V4 (0.624)?';
    if (ls > 0.5 && sw < 0.5) caption = '0 wins:  0.595 < 0.624  (enter 0)';
    if (sw > 0.5 && wn < 0.5) caption = 'Does V3 (0.595) beat V6 (0.325)?';
    if (wn > 0.5 && pr < 0.05) caption = '1 win:  0.595 > 0.325  (enter 1)';
    if (pr > 0.05 && rs < 0.5) caption = `${wins} wins in ${settledCount} of 16 pairs...`;
    if (rs > 0.5) caption = 'ROC-AUC  =  13 / 16  =  0.8125';

    nodes.push(
      txt(caption, 0, 382, 42, rs > 0.5 ? ROLE.threshold : COSMOS.ink, 'mono').glow(
        rs > 0.5 ? 10 : 0,
        ROLE.threshold,
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'auc-first', firstP, 1, { dur: 0.7 });
  cueTo(s, c, 'auc-loss', lossP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'auc-switch', switchP, 1, { dur: 0.7 });
  cueTo(s, c, 'auc-win', winP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'auc-pairs', pairsP, 1, { dur: 1.2 });
  cueTo(s, c, 'auc-result', resP, 1, { after: true, dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 20. rare-event-population: Change the population while keeping the score model fixed
// Cues: lr-rare-event-population-step-0, automatic-accuracy, lr-majority-baseline,
//       lr-rare-event-population-step-1, lr-repeat-negatives,
//       lr-rare-event-population-step-2, lr-easy-negatives
// ---------------------------------------------------------------------------
export function rareEventPopulation(s, c) {
  const s0P = s.value(0);
  const accP = s.value(0);
  const majP = s.value(0);
  const s1P = s.value(0);
  const repP = s.value(0);
  const s2P = s.value(0);
  const easyP = s.value(0);
  const drift = s.value(0);

  const base = prevalenceFixture('base');
  const rep = prevalenceFixture('repeat');
  const easy = prevalenceFixture('easy');

  s.add(cinemaGrid({ accent: ROLE.positive, seed: 20 }));
  s.add(decorAura(0, 0, 560, '#ff6b8b1a', '#60a5fa18'));

  const headline = heroTitle(['Prevalence Shifts:', 'ROC vs Precision'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.positive,
    eyebrow: 'FIXED MODEL UNDER CHANGING BASE RATES',
  });

  // View 0 (Beat 0): 100 requests (4 pink, 96 blue) -> predict all automatic -> 96% accuracy, 0% recall
  const view0 = guardedDynamic(
    () => fadeOut(s1P.value),
    (vis) => {
      const ac = accP.value;
      const mj = majP.value;
      const ph = drift.value;
      const nodes = [
        txt('100 REQUESTS:  4 REQUIRED REVIEW  ·  96 ROUTINE', 0, -225, 28, COSMOS.muted, 'mono'),
      ];
      for (let i = 0; i < 100; i++) {
        const cx = -715 + (i % 20) * 75;
        const cy = -140 + Math.floor(i / 20) * 68;
        const isPos = i < 4;
        const col = isPos ? ROLE.positive : ROLE.negative;
        const pulse = isPos ? 1 + 0.1 * Math.sin(ph * Math.PI * 10 + i) : 1;
        nodes.push(
          rect(50 * pulse, 44 * pulse, { fill: col, stroke: null, radius: 8 })
            .at(cx, cy)
            .glow(isPos ? 12 : 3, col),
        );
      }
      nodes.push(
        txt('Always predict Automatic:', 0, 235, 32, COSMOS.ink, 'serif'),
        txt(
          ac > 0.4 ? 'Accuracy = 96 / 100 = 96%' : 'Accuracy = ?',
          -390,
          325,
          38,
          ROLE.negative,
          'mono',
        ),
        txt(
          mj > 0.4 ? 'Review Recall = 0 / 4 = 0%' : 'Review Recall = ?',
          390,
          325,
          38,
          ROLE.positive,
          'mono',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Repeat each negative 25x (FPR 0.5 & AUC 0.8125 unchanged, Precision 0.667 -> 0.0741!)
  const view1 = guardedDynamic(
    () => Math.min(fadeIn(s1P.value), fadeOut(s2P.value)),
    (vis) => {
      const rp = repP.value;
      const count = Math.round(100 * rp);
      const negs = validationScores.filter((v) => !v.label);
      const nodes = [
        txt(
          '25× COPIES OF EACH NEGATIVE  (SAME CLASS-CONDITIONAL MIX)',
          0,
          -225,
          28,
          ROLE.score,
          'mono',
        ),
      ];
      negs.forEach((v, g) => {
        const gx = -570 + g * 380;
        nodes.push(txt(`${v.id} × 25  (p=${v.p.toFixed(3)})`, gx, -155, 26, ROLE.negative, 'mono'));
        for (let j = 0; j < 25; j++) {
          const idx = g * 25 + j;
          if (idx >= count) continue;
          const cx = gx - 100 + (j % 5) * 50;
          const cy = -95 + Math.floor(j / 5) * 44;
          nodes.push(
            rect(36, 30, { fill: ROLE.negative, stroke: null, radius: 5 }).at(cx, cy).opacity(0.85),
          );
        }
      });
      nodes.push(
        txt(
          `ROC unchanged:  FPR = ${rep.fpr.toFixed(2)},  AUC = ${rep.auc.toFixed(4)}`,
          0,
          215,
          34,
          ROLE.threshold,
          'mono',
        ),
        txt(
          rp > 0.85
            ? `Precision collapses:  ${base.precision.toFixed(3)}  →  ${rep.precision.toFixed(4)}  (4 / 54)`
            : 'Counting flagged queue precision...',
          0,
          305,
          38,
          ROLE.positive,
          'mono',
        ).glow(rp > 0.85 ? 10 : 0, ROLE.positive),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Add 100 easy zero-score negatives (Queue & Precision 2/3 unchanged, FPR -> 0.0192, AUC -> 0.9928!)
  const view2 = guardedDynamic(
    () => fadeIn(s2P.value),
    (vis) => {
      const ep = easyP.value;
      const count = Math.round(100 * ep);
      const nodes = [
        txt('ADD 100 EASY ZERO-SCORE NEGATIVES  (p = 0.000)', 0, -225, 28, ROLE.good, 'mono'),
      ];
      for (let i = 0; i < count; i++) {
        const cx = -715 + (i % 20) * 75;
        const cy = -140 + Math.floor(i / 20) * 56;
        nodes.push(
          rect(48, 34, { fill: '#193b5e', stroke: ROLE.negative, width: 1.5, radius: 6 })
            .at(cx, cy)
            .opacity(0.85),
        );
      }
      nodes.push(
        txt(
          ep > 0.85
            ? `FPR falls to ${easy.fpr.toFixed(4)}   ·   AUC inflates to ${easy.auc.toFixed(4)}`
            : 'Every positive outranks all 100 easy negatives...',
          0,
          215,
          36,
          ROLE.threshold,
          'mono',
        ),
        txt(
          `Same 6 requests reach desk  ·  Precision stays ${easy.precision.toFixed(3)} (4 / 6)`,
          0,
          305,
          34,
          ROLE.score,
          'mono',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'lr-rare-event-population-step-0', s0P, 1, { dur: 0.7 });
  cueTo(s, c, 'automatic-accuracy', accP, 1, { dur: 0.75 });
  cueTo(s, c, 'lr-majority-baseline', majP, 1, { dur: 0.75 });
  cueTo(s, c, 'lr-rare-event-population-step-1', s1P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-repeat-negatives', repP, 1, { dur: 1.1 });
  cueTo(s, c, 'lr-rare-event-population-step-2', s2P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-easy-negatives', easyP, 1, { dur: 1.1 });
}

// ---------------------------------------------------------------------------
// 21. ap-and-ties: Collect threshold groups before scoring precision
// Cues: lr-ap-and-ties-step-0, lr-pr-membership, lr-ap-and-ties-step-1,
//       lr-average-precision, lr-ap-and-ties-step-2, lr-threshold-ties, lr-trapezoid-area
// ---------------------------------------------------------------------------
export function apAndTies(s, c) {
  const s0P = s.value(0);
  const memP = s.value(0);
  const s1P = s.value(0);
  const apP = s.value(0);
  const s2P = s.value(0);
  const tieP = s.value(0);
  const trapP = s.value(0);
  const drift = s.value(0);

  const baseRank = rankingMetrics(validationScores);
  const tiedRows = validationScores.map((v) => ({
    ...v,
    p: v.id === 'V3' || v.id === 'V4' ? 0.6 : v.p,
  }));
  const tieRank = rankingMetrics(tiedRows);
  const trapPts = [{ recall: 0, precision: 1 }, ...tieRank.groups];
  const trapArea = trapPts
    .slice(1)
    .reduce(
      (sum, g, i) =>
        sum + ((g.recall - trapPts[i].recall) * (g.precision + trapPts[i].precision)) / 2,
      0,
    );

  s.add(cinemaGrid({ accent: ROLE.score, seed: 21 }));
  s.add(decorAura(150, 0, 560, '#5ce1e61a', '#ffd16614'));

  const headline = heroTitle(['Precision-Recall,', 'AP & Score Ties'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.score,
    eyebrow: 'THRESHOLD GROUPS  ·  STEP AREA vs TRAPEZOID',
  });

  const ax = makeAxes({
    x0: 40,
    y0: -195,
    w: 760,
    h: 430,
    xDom: [0, 1],
    yDom: [0, 1],
    xTicks: [0, 0.25, 0.5, 0.75, 1],
    yTicks: [0, 0.5, 0.75, 1],
    xLabel: 'recall R',
    yLabel: 'precision P',
  });

  const live = dynamic(() => {
    const mP = memP.value;
    const s1 = s1P.value;
    const apV = apP.value;
    const s2 = s2P.value;
    const tV = tieP.value;
    const trV = trapP.value;

    const isTied = s2 > 0.5;
    const rank = isTied ? tieRank : baseRank;
    const prefixCount = s1 > 0.1 || isTied ? 8 : Math.min(8, Math.max(1, Math.round(mP * 8)));
    const nodes = [];

    // Left: Sorted score list (highlights tied V3 = V4 = 0.600 on Beat 2)
    nodes.push(
      txt(
        isTied ? 'TIED PROBE: V3 = V4 = 0.600' : '8 VALIDATION SCORES (HIGHEST FIRST)',
        -475,
        -225,
        26,
        isTied ? ROLE.threshold : COSMOS.muted,
        'mono',
      ),
    );
    rank.sorted.forEach((v, i) => {
      const y = -160 + i * 62;
      const col = v.label ? ROLE.positive : ROLE.negative;
      const isTieRow = isTied && (v.id === 'V3' || v.id === 'V4');
      const included = i < prefixCount;
      nodes.push(
        txt(v.id, -810, y, 26, isTieRow ? ROLE.threshold : col, 'mono', 'left').opacity(
          included ? 1 : 0.38,
        ),
        scaleTrack(-735, y, 360, 24, {
          stroke: isTieRow ? ROLE.threshold : '#2a3a5e',
          radius: 6,
        }),
        glowBar(-735, y, 360 * v.p, 24, col, {
          glow: included ? 8 : 2,
          radius: 6,
          opacity: included ? 1 : 0.35,
        }),
        txt(v.p.toFixed(3), -350, y, 26, isTieRow ? ROLE.threshold : COSMOS.muted, 'mono', 'left'),
        txt(v.label ? '+1' : '0', -230, y, 26, col, 'mono', 'left').opacity(included ? 1 : 0.35),
      );
    });

    // Right: Stepwise PR curve + shaded AP rectangles
    nodes.push(ax.node);
    let prevR = 0;
    let prevP = 1;
    let seen = 0;
    const stepPts = [ax.pt(0, 1)];
    for (const grp of rank.groups) {
      seen += grp.rows.length;
      if (seen > prefixCount) break;
      // Vertical step to new precision, then horizontal step to new recall
      stepPts.push(ax.pt(prevR, grp.precision), ax.pt(grp.recall, grp.precision));
      // Shaded AP step rectangle whenever recall increases (Beat 1 & 2)
      if ((s1 > 0.3 || isTied) && grp.recall > prevR) {
        const xA = ax.px(prevR);
        const xB = ax.px(grp.recall);
        const yTop = ax.py(grp.precision);
        const yBot = ax.py(0);
        nodes.push(
          rect(Math.max(4, xB - xA - 3), Math.max(4, yBot - yTop), {
            fill: ROLE.score,
            stroke: ROLE.score,
            width: 1.5,
            radius: 3,
          })
            .at((xA + xB) / 2, (yTop + yBot) / 2)
            .opacity(0.24),
        );
      }
      prevR = grp.recall;
      prevP = grp.precision;
    }
    if (stepPts.length >= 2) {
      nodes.push(neonCurve(stepPts, [ROLE.score, ROLE.threshold], { width: 4.2, glow: 10 }));
    }
    nodes.push(glowDot(...ax.pt(prevR, prevP), { radius: 11, color: ROLE.threshold, glow: 14 }));

    // Bottom formula / readout row (non-overlapping across beats 0, 1, 2)
    const b0 = fadeOut(s1);
    const b1 = Math.min(fadeIn(s1), fadeOut(s2));
    const b2 = fadeIn(s2);
    if (b0 > 0.02) {
      nodes.push(
        txt(
          `Queue ${prefixCount}:  P = ${prevP.toFixed(3)},  R = ${prevR.toFixed(3)}   (V4 dips precision to 0.667 before V3 recovers)`,
          0,
          365,
          28,
          ROLE.score,
          'mono',
        ).opacity(b0),
      );
    }
    if (b1 > 0.02) {
      nodes.push(
        glowTex(
          apV > 0.5
            ? `\\mathrm{AP} = \\frac{1 + 1 + 3/4 + 2/3}{4} \\approx ${baseRank.ap.toFixed(3)}`
            : '\\mathrm{AP} = \\sum_k (R_k - R_{k-1}) P_k',
          { x: 0, y: 365, size: 42, color: ROLE.threshold },
        ).opacity(b1),
      );
    }
    if (b2 > 0.02) {
      const msg =
        trV > 0.5
          ? `Tied group AP = ${tieRank.ap.toFixed(4)}  ·  AUC = ${tieRank.auc.toFixed(4)}  ·  Trapezoid PR = ${trapArea.toFixed(4)}`
          : tV > 0.5
            ? `Tied group enters together:  AP = ${tieRank.ap.toFixed(4)},  AUC = ${tieRank.auc.toFixed(4)} (half tie credit)`
            : 'Tied scores enter together at one threshold; never reorder ties favorably';
      nodes.push(txt(msg, 0, 365, 28, ROLE.threshold, 'mono').opacity(b2));
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'lr-ap-and-ties-step-0', s0P, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-pr-membership', memP, 1, { dur: 1.2 });
  cueTo(s, c, 'lr-ap-and-ties-step-1', s1P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-average-precision', apP, 1, { dur: 0.6 });
  cueTo(s, c, 'lr-ap-and-ties-step-2', s2P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-threshold-ties', tieP, 1, { dur: 0.75 });
  cueTo(s, c, 'lr-trapezoid-area', trapP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 22. rescaling: A new scale can preserve every ordering
// Cues: rescale-scores, rescale-threshold
// ---------------------------------------------------------------------------
export function rescalingScene(s, c) {
  const scaleP = s.value(0);
  const cutP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.loss, seed: 22 }));
  s.add(decorAura(0, 0, 560, '#a78bfa1c', '#5ce1e614'));

  const headline = heroTitle(['Squaring Every Score', 'Preserves Every Rank'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.loss,
    eyebrow: 'MONOTONIC TRANSFORM  p → p²',
  });

  const live = dynamic(() => {
    const sc = smooth(scaleP.value);
    const ct = smooth(cutP.value);
    const bx = -660;
    const maxW = 1040;
    const cutVal = mix(0.5, 0.25, ct);
    const cutX = bx + maxW * cutVal;
    const nodes = [];

    nodes.push(
      txt(sc > 0.5 ? 'SQUARED SCORE  p²' : 'ORIGINAL SCORE  p', -140, -230, 28, ROLE.score, 'mono'),
      txt('ROC-AUC = 0.8125  (INVARIANT)', 590, -230, 28, ROLE.good, 'mono'),
    );

    SORTED_VAL.forEach((v, i) => {
      const y = -160 + i * 62;
      const curP = mix(v.p, v.p * v.p, sc);
      const col = v.label ? ROLE.positive : ROLE.negative;
      const selected = curP >= cutVal;
      nodes.push(
        txt(v.id, -780, y, 28, col, 'mono', 'left'),
        scaleTrack(bx, y, maxW, 28, { stroke: '#2c3d63', radius: 6 }),
        glowBar(bx, y, Math.max(8, maxW * curP), 28, col, {
          glow: selected ? 10 : 4,
          radius: 6,
          opacity: selected ? 1 : 0.55,
        }),
        txt(curP.toFixed(3), bx + maxW + 36, y, 28, col, 'mono', 'left'),
      );
    });

    // Moving threshold hairline from 0.50 -> 0.25
    nodes.push(
      line([cutX, -195], [cutX, 305], { stroke: ROLE.threshold, width: 4.5 }).glow(
        10,
        ROLE.threshold,
      ),
      txt(`Cut ${cutVal.toFixed(2)}`, cutX, 345, 32, ROLE.threshold, 'mono'),
      txt(
        ct > 0.5
          ? 'Cut 0.50 → 0.25 keeps the exact same 4 selected requests, but percentages changed!'
          : 'Bars shrink without overtaking one another: all 16 pair verdicts stay fixed',
        0,
        402,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'rescale-scores', scaleP, 1, { dur: 1.0 });
  cueTo(s, c, 'rescale-threshold', cutP, 1, { dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 23. calibration: Let the later labels build the frequency
// Cues: collect-calibration, calibration-outcomes, calibration-one-label
// ---------------------------------------------------------------------------
export function calibrationScene(s, c) {
  const collP = s.value(0);
  const outP = s.value(0);
  const flipP = s.value(0);
  const drift = s.value(0);

  const binLabels = ['[0.00, 0.25)', '[0.25, 0.50)', '[0.50, 0.75)', '[0.75, 1.00]'];

  s.add(cinemaGrid({ accent: ROLE.score, seed: 23 }));
  s.add(decorAura(0, 0, 560, '#5ce1e61c', '#ff6b8b14'));

  const headline = heroTitle(['Forecast Bins', 'vs Observed Frequencies'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.score,
    eyebrow: 'RELIABILITY CHECK ON 8 VALIDATION SCORES',
  });

  const live = dynamic(() => {
    const cl = smooth(collP.value);
    const ou = smooth(outP.value);
    const fl = smooth(flipP.value);
    const baseY = 185;
    const maxH = 340;
    const nodes = [];

    nodes.push(
      txt('CYAN: MEAN FORECAST p̄', -540, -225, 26, ROLE.score, 'mono'),
      txt('PINK: OBSERVED FREQUENCY ȳ', 540, -225, 26, ROLE.positive, 'mono'),
      line([-780, baseY], [780, baseY], { stroke: '#4d6499', width: 2.6 }),
    );

    calibrationBins.forEach((bin, bIdx) => {
      const cx = -570 + bIdx * 380;
      const obsVal = bIdx === 2 ? mix(bin.observed, 1.0, fl) : bin.observed;
      const fcH = maxH * bin.forecast * Math.max(0.25, cl);
      const obH = maxH * obsVal * ou;

      // Forecast bar (left) and Observed frequency bar (right)
      nodes.push(
        glowCol(cx - 56, baseY, 84, fcH, ROLE.score, { glow: 8, radius: 8 }),
        txt(bin.forecast.toFixed(2), cx - 56, baseY - fcH - 28, 26, ROLE.score, 'mono'),
        ou > 0.05
          ? group(
              glowCol(cx + 56, baseY, 84, Math.max(8, obH), ROLE.positive, {
                glow: bIdx === 2 && fl > 0.3 ? 14 : 8,
                radius: 8,
              }),
              txt(
                obsVal.toFixed(2),
                cx + 56,
                baseY - Math.max(8, obH) - 28,
                26,
                ROLE.positive,
                'mono',
              ),
            ).opacity(ou)
          : txt('?', cx + 56, baseY - 38, 34, COSMOS.dim, 'mono'),
        txt(binLabels[bIdx], cx, baseY + 42, 26, COSMOS.ink, 'mono'),
        txt(`n = ${bin.rows.length}`, cx, baseY + 86, 26, ROLE.threshold, 'mono'),
      );
    });

    nodes.push(
      txt(
        fl > 0.4
          ? 'Bin [0.50, 0.75) has only n = 2: flipping 1 label jumps 0.50 → 1.00!'
          : ou > 0.5
            ? 'Lowest bin: 1/3 (0.33)  ·  Opening-request bin: 1/2 (0.50) vs 0.61 forecast'
            : 'Forecasts exist before outcomes close; bin populations show sample fragility',
        0,
        365,
        29,
        fl > 0.4 ? ROLE.warn : COSMOS.muted,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'collect-calibration', collP, 1, { dur: 0.9 });
  cueTo(s, c, 'calibration-outcomes', outP, 1, { dur: 1.0 });
  cueTo(s, c, 'calibration-one-label', flipP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 24. calibration-error: Weight each bin gap before adding it
// Cues: lr-calibration-error-step-0, lr-bin-contribution, lr-calibration-error-step-1,
//       lr-ece-answer, lr-brier-answer, lr-eight-bin-answer,
//       lr-calibration-error-step-2, lr-flipped-label, lr-flip-metrics, disputed-ece
// ---------------------------------------------------------------------------
export function calibrationError(s, c) {
  const s0P = s.value(0);
  const binP = s.value(0);
  const s1P = s.value(0);
  const eceP = s.value(0);
  const brierP = s.value(0);
  const eightP = s.value(0);
  const s2P = s.value(0);
  const flipP = s.value(0);
  const f1P = s.value(0);
  const dispP = s.value(0);
  const drift = s.value(0);

  const cal4 = calibrationAudit({ binCount: 4 });
  const cal8 = calibrationAudit({ binCount: 8 });
  const flipLabels = validation.map((r) => r[2]);
  flipLabels[3] = 1;
  const calFlip = calibrationAudit({ labels: flipLabels, binCount: 4 });

  s.add(cinemaGrid({ accent: ROLE.threshold, seed: 24 }));
  s.add(decorAura(-150, 0, 560, '#ffd1661a', '#5ce1e614'));

  const headline = heroTitle(['ECE, Brier Score', '& Label Sensitivity'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.threshold,
    eyebrow: 'WEIGHTED CALIBRATION GAPS',
  });

  const ax = makeAxes({
    x0: -790,
    y0: -210,
    w: 760,
    h: 455,
    xDom: [0, 1],
    yDom: [0, 1],
    xTicks: [0, 0.25, 0.5, 0.75, 1],
    yTicks: [0, 0.25, 0.5, 0.75, 1],
    xLabel: 'mean predicted probability',
    yLabel: 'observed positive rate',
  });

  // View 01 (Beats 0-1): Reliability diagram with diagonal, vertical gap bars, ECE + Brier + 8-bin audit
  const view01 = guardedDynamic(
    () => fadeOut(s2P.value),
    (vis) => {
      const bn = binP.value;
      const s1 = s1P.value;
      const ec = eceP.value;
      const br = brierP.value;
      const ei = eightP.value;
      const active = ei > 0.5 ? cal8 : cal4;
      const nodes = [
        ax.node,
        // Perfect calibration diagonal y = x
        line(ax.pt(0, 0), ax.pt(1, 1), { stroke: '#6c85bf', width: 2.4, dash: [8, 8] }),
      ];

      // Plot populated bins & weighted vertical gap stems
      const popBins = active.bins.filter((b) => b.n > 0);
      popBins.forEach((b, idx) => {
        const ptObs = ax.pt(b.forecast, b.observed);
        const ptDiag = ax.pt(b.forecast, b.forecast);
        nodes.push(
          line(ptDiag, ptObs, { stroke: ROLE.threshold, width: 5 }).glow(8, ROLE.threshold),
          glowDot(ptObs[0], ptObs[1], { radius: 8 + b.n * 2.5, color: ROLE.score, glow: 12 }),
        );
        // Right side breakdown for 4-bin view
        if (ei <= 0.5 && idx < 4) {
          const ry = -165 + idx * 96;
          nodes.push(
            txt(
              `Bin ${b.index + 1} (n=${b.n}):  ${(b.n / 8).toFixed(3)} × ${b.gap.toFixed(3)} = ${
                bn > 0.3 || s1 > 0.2 ? b.contribution.toFixed(4) : '?'
              }`,
              80,
              ry,
              27,
              idx === 0 ? ROLE.threshold : COSMOS.ink,
              'mono',
              'left',
            ),
          );
        }
      });

      if (ei > 0.5) {
        nodes.push(
          txt('RE-BINNED TO 8 EQUAL BINS', 460, -145, 28, ROLE.threshold, 'mono'),
          txt('Same 8 probabilities, different bin edges:', 460, -85, 28, COSMOS.muted, 'sans'),
          txt(`4-bin ECE = ${cal4.ece.toFixed(4)}`, 460, 0, 34, ROLE.score, 'mono'),
          txt(`8-bin ECE = ${cal8.ece.toFixed(4)}`, 460, 68, 38, ROLE.threshold, 'mono').glow(
            8,
            ROLE.threshold,
          ),
          txt('Bin-free Brier stays fixed at 0.1584', 460, 155, 28, ROLE.positive, 'mono'),
        );
      }

      // Bottom formula / ECE & Brier answers
      const preS1 = fadeOut(s1);
      const postS1 = fadeIn(s1);
      if (preS1 > 0.02) {
        nodes.push(
          glowTex('\\mathrm{ECE} = \\sum_b \\frac{n_b}{N} |\\bar{p}_b - \\bar{y}_b|', {
            x: 0,
            y: 365,
            size: 42,
            color: ROLE.threshold,
          }).opacity(preS1),
        );
      }
      if (postS1 > 0.02) {
        nodes.push(
          group(
            txt(
              ec > 0.4 ? `ECE = ${active.ece.toFixed(4)}` : 'ECE = ?',
              -340,
              365,
              40,
              ROLE.threshold,
              'mono',
            ),
            txt(
              br > 0.4 ? `Brier = ${cal4.brier.toFixed(4)}` : 'Brier = ?',
              340,
              365,
              40,
              ROLE.positive,
              'mono',
            ),
          ).opacity(postS1),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Flipping V4 label routine -> required shifts F1 0.75 -> 0.889 and ECE 0.139 -> 0.209
  const view2 = guardedDynamic(
    () => fadeIn(s2P.value),
    (vis) => {
      const fl = flipP.value;
      const f1 = f1P.value;
      const ds = dispP.value;
      const baseY = 125;
      const nodes = [
        txt(
          "FLIP ONLY V4'S LABEL (ROUTINE → REQUIRED), KEEP ALL SCORES FIXED",
          0,
          -225,
          28,
          ROLE.threshold,
          'mono',
        ),
        line([-780, baseY], [780, baseY], { stroke: '#4d6499', width: 2.5 }),
      ];

      auditProbabilities.forEach((p, i) => {
        const cx = -665 + i * 190;
        const isV4 = i === 3;
        const lbl = isV4 && fl > 0.5 ? 1 : validation[i][2];
        const col = lbl ? ROLE.positive : ROLE.negative;
        nodes.push(
          glowCol(cx, baseY, 74, 285 * p, ROLE.score, { glow: isV4 ? 12 : 6 }),
          txt(
            `V${i + 1}`,
            cx,
            baseY - 285 * p - 28,
            26,
            isV4 ? ROLE.threshold : COSMOS.muted,
            'mono',
          ),
          txt(p.toFixed(3), cx, baseY + 38, 26, ROLE.score, 'mono'),
          circle(22, { fill: col, stroke: isV4 ? ROLE.threshold : null, width: 3.5 })
            .at(cx, baseY + 98)
            .glow(isV4 ? 12 : 4, col),
        );
      });

      nodes.push(
        txt(
          f1 > 0.5
            ? `F1 @ 0.50:  ${cal4.f1.toFixed(3)}  →  ${calFlip.f1.toFixed(3)}`
            : `F1 @ 0.50:  ${cal4.f1.toFixed(3)}`,
          -410,
          345,
          36,
          ROLE.good,
          'mono',
        ),
        txt(
          ds > 0.5
            ? `4-bin ECE:  ${cal4.ece.toFixed(3)}  →  ${calFlip.ece.toFixed(3)}`
            : `4-bin ECE:  ${cal4.ece.toFixed(3)}`,
          410,
          345,
          36,
          ROLE.threshold,
          'mono',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view01, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'lr-calibration-error-step-0', s0P, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-bin-contribution', binP, 1, { dur: 0.8 });
  cueTo(s, c, 'lr-calibration-error-step-1', s1P, 1, { dur: 0.8 });
  cueTo(s, c, 'lr-ece-answer', eceP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'lr-brier-answer', brierP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'lr-eight-bin-answer', eightP, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-calibration-error-step-2', s2P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-flipped-label', flipP, 1, { dur: 0.8 });
  cueTo(s, c, 'lr-flip-metrics', f1P, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'disputed-ece', dispP, 1, { after: true, dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 25. calibration-maps: Keep the label sets and ranking contracts separate
// Cues: lr-calibration-maps-step-0, lr-calibrator-data, lr-isotonic-map, lr-platt-fit,
//       lr-calibration-maps-step-1, lr-map-ties, lr-positive-temperature,
//       lr-calibration-maps-step-2, lr-post-calibration-policy
// ---------------------------------------------------------------------------
export function calibrationMaps(s, c) {
  const s0P = s.value(0);
  const dataP = s.value(0);
  const isoP = s.value(0);
  const plattP = s.value(0);
  const s1P = s.value(0);
  const tiesP = s.value(0);
  const tempP = s.value(0);
  const s2P = s.value(0);
  const polP = s.value(0);
  const drift = s.value(0);

  const iso = isotonicFixture();
  const [pA, pB] = plattFitStates[1000];
  const v4Iso = iso.find((r) => r.id === 'V4');

  s.add(cinemaGrid({ accent: ROLE.good, seed: 25 }));
  s.add(decorAura(0, 0, 560, '#6ee7b71a', '#5ce1e614'));

  const headline = heroTitle(['Post-Hoc Calibration:', 'Platt, Isotonic & Temp'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.good,
    eyebrow: 'SEPARATE FITTING, CALIBRATION & VERIFICATION SPLITS',
  });

  // View 0 (Beat 0): Three separate data splits + Platt sigmoid & Isotonic preview
  const view0 = guardedDynamic(
    () => fadeOut(s1P.value),
    (vis) => {
      const dt = dataP.value;
      const pl = plattP.value;
      const isV = isoP.value;
      const nodes = [];

      const cols = [
        {
          title: '1. CLASSIFIER FIT',
          sub: '8 training rows (R1..R8)',
          x: -570,
          col: ROLE.negative,
        },
        {
          title: '2. CALIBRATOR FIT',
          sub: '8 calibration rows (V1..V8)',
          x: 0,
          col: ROLE.threshold,
        },
        { title: '3. FRESH VERIFY', sub: 'Reserved untouched split', x: 570, col: ROLE.good },
      ];
      cols.forEach((col, cIdx) => {
        nodes.push(
          txt(col.title, col.x, -210, 28, col.col, 'mono'),
          txt(col.sub, col.x, -162, 26, COSMOS.muted, 'sans'),
        );
        for (let i = 0; i < 8; i++) {
          const cx = col.x - 150 + (i % 4) * 100;
          const cy = -75 + Math.floor(i / 4) * 95;
          if (cIdx === 0) {
            const cDot = training[i][2] ? ROLE.positive : ROLE.negative;
            nodes.push(
              circle(22, { fill: cDot, stroke: null }).at(cx, cy).glow(6, cDot),
              txt(`R${i + 1}`, cx, cy + 44, 26, COSMOS.muted, 'mono'),
            );
          } else if (cIdx === 1) {
            nodes.push(
              circle(22, { fill: ROLE.threshold, stroke: null })
                .at(cx, cy)
                .glow(dt > 0.3 ? 10 : 4, ROLE.threshold),
              txt(`V${i + 1}`, cx, cy + 44, 26, COSMOS.muted, 'mono'),
            );
          } else {
            nodes.push(
              circle(22, { fill: '#102422', stroke: ROLE.good, width: 2.2 }).at(cx, cy),
              txt('?', cx, cy, 26, ROLE.good, 'mono'),
            );
          }
        }
      });

      nodes.push(
        txt(
          pl > 0.3
            ? `Platt sigmoid:  p = σ(${pA.toFixed(2)} z ${pB >= 0 ? '+' : ''}${pB.toFixed(2)})`
            : 'Platt scaling: 1D parametric sigmoid',
          -420,
          235,
          30,
          ROLE.score,
          'mono',
        ),
        txt(
          isV > 0.3
            ? 'Isotonic regression: nondecreasing step function'
            : 'Isotonic regression: monotone staircase',
          420,
          235,
          30,
          ROLE.threshold,
          'mono',
        ),
        txt(
          'Never fit a calibrator on the same labels used to fit the classifier',
          0,
          355,
          30,
          COSMOS.ink,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Left Isotonic flat steps (ties!) vs Right Temperature scaling sigma(z/T) (T > 0 keeps z = 0 fixed!)
  const axIso = makeAxes({
    x0: -790,
    y0: -195,
    w: 670,
    h: 420,
    xDom: [0, 1],
    yDom: [0, 1],
    xTicks: [0, 0.5, 1],
    yTicks: [0, 0.5, 1],
    xLabel: 'raw score',
    yLabel: 'isotonic p',
  });
  const axTemp = makeAxes({
    x0: 110,
    y0: -195,
    w: 690,
    h: 420,
    xDom: [-4, 4],
    yDom: [0, 1],
    xTicks: [-4, -2, 0, 2, 4],
    yTicks: [0, 0.5, 1],
    xLabel: 'logit z',
    yLabel: 'σ(z / T)',
  });

  const view1 = guardedDynamic(
    () => Math.min(fadeIn(s1P.value), fadeOut(s2P.value)),
    (vis) => {
      const ti = smooth(tiesP.value);
      const tm = smooth(tempP.value);
      const T = 1 + 1.5 * tm;
      const nodes = [axIso.node, axTemp.node];

      // Isotonic staircase
      const stepPts = [];
      let prev = null;
      iso.forEach((row) => {
        const mapped = mix(row.p, row.mapped, ti);
        const pt = axIso.pt(row.p, mapped);
        if (prev) stepPts.push([pt[0], prev[1]]);
        stepPts.push(pt);
        prev = pt;
      });
      if (stepPts.length >= 2) {
        nodes.push(neonCurve(stepPts, [ROLE.threshold, ROLE.warn], { width: 4.5, glow: 10 }));
      }
      iso.forEach((row) => {
        const pt = axIso.pt(row.p, mix(row.p, row.mapped, ti));
        nodes.push(
          glowDot(pt[0], pt[1], { radius: 8, color: row.label ? ROLE.positive : ROLE.negative }),
        );
      });

      // Temperature scaling curve
      const baseSig = sampleCurve(axTemp, (z) => sigmoid(z), -4, 4, 80);
      const tempSig = sampleCurve(axTemp, (z) => sigmoid(z / T), -4, 4, 80);
      nodes.push(
        neonCurve(baseSig, '#4b5f8f', { width: 2.4, glow: 0, opacity: 0.65 }),
        neonCurve(tempSig, [ROLE.score, ROLE.good], { width: 4.5, glow: 11 }),
        glowDot(...axTemp.pt(0, 0.5), { radius: 11, color: ROLE.threshold, glow: 14 }),
        txt('FLAT STEPS MERGE TIES', -120, -225, 26, ROLE.threshold, 'mono', 'right'),
        txt(`TEMP T = ${T.toFixed(2)}`, 800, -225, 26, ROLE.score, 'mono', 'right'),
        txt(
          'T > 0 preserves ranking and keeps the z = 0 (p = 0.5) boundary fixed',
          0,
          365,
          29,
          COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Reassess non-0.5 thresholds after calibration; labels don't grant authorization
  const view2 = guardedDynamic(
    () => fadeIn(s2P.value),
    (vis) => {
      const pl = smooth(polP.value);
      const cut = mix(0.5, 0.6, pl);
      const bx = -640;
      const bw = 1280;
      const by = 15;
      const cutX = bx + bw * cut;
      const nodes = [
        txt('REASSESS POLICY CUTS AFTER CALIBRATION', 0, -210, 28, ROLE.threshold, 'mono'),
        txt(
          `V4 raw score ${v4Iso.p.toFixed(3)}   →   calibrated ${v4Iso.mapped.toFixed(3)}`,
          0,
          -125,
          40,
          ROLE.score,
          'mono',
        ),
        scaleTrack(bx, by, bw, 76, { stroke: '#32446e', radius: 12 }),
        glowBar(bx, by, bw * v4Iso.mapped, 70, ROLE.score, { glow: 10, radius: 10 }),
        line([cutX, by - 68], [cutX, by + 68], { stroke: ROLE.threshold, width: 5 }).glow(
          10,
          ROLE.threshold,
        ),
        txt(`Policy cut ${cut.toFixed(2)}`, cutX, by + 110, 32, ROLE.threshold, 'mono'),
        txt(
          v4Iso.mapped >= cut ? 'Routes to human review' : 'Routes to automatic handling',
          0,
          215,
          38,
          v4Iso.mapped >= cut ? ROLE.threshold : ROLE.negative,
          'serif',
        ),
        txt(
          'Calibrated probabilities predict risk; routing labels never authorize access changes directly',
          0,
          335,
          28,
          COSMOS.muted,
          'sans',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'lr-calibration-maps-step-0', s0P, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-calibrator-data', dataP, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-platt-fit', plattP, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-isotonic-map', isoP, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-calibration-maps-step-1', s1P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-map-ties', tiesP, 1, { dur: 0.9 });
  cueTo(s, c, 'lr-positive-temperature', tempP, 1, { dur: 0.95 });
  cueTo(s, c, 'lr-calibration-maps-step-2', s2P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-post-calibration-policy', polP, 1, { dur: 0.9 });
}
