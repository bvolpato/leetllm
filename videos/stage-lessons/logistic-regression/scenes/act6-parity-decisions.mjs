// Act 6 (Scenes 30-32): Implementation Parity (NumPy vs scikit-learn & Step-Size Diagnostics),
// Fresh Operating Point (4-Request Expected Cost Desk), and Final Decision & Mistake Bill.
import { circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  FRESH_BATCH,
  ROLE,
  SKLEARN_WEIGHTS,
  cinemaGrid,
  costForCounts,
  cueTo,
  decorAura,
  dotVec,
  fadeIn,
  fadeOut,
  fittedWeights,
  glowBar,
  glowDot,
  gradientTrajectory,
  guardedDynamic,
  heroTitle,
  livingDrift,
  makeAxes,
  mix,
  neonCurve,
  openingRequest,
  penalizedWeights,
  policyAt,
  probabilityCost,
  rule,
  scaleTrack,
  sigmoid,
  smooth,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 30. implementation-parity: What changes when we refit the same eight rows?
// Cues: lr-implementation-parity-step-0, lr-library-coefficients,
//       lr-implementation-parity-step-1, lr-parity-penalty, r3-score, r3-review,
//       lr-implementation-parity-step-2, lr-diagnose-first-update, remaining-updates
// ---------------------------------------------------------------------------
export function implementationParity(s, c) {
  const s0P = s.value(0);
  const libP = s.value(0);
  const s1P = s.value(0);
  const penP = s.value(0);
  const r3P = s.value(0);
  const r3RevP = s.value(0);
  const s2P = s.value(0);
  const step1P = s.value(0);
  const remP = s.value(0);
  const drift = s.value(0);

  const r3Base = sigmoid(dotVec(fittedWeights, [1, 2, 3]));
  const r3Pen = sigmoid(dotVec(penalizedWeights, [1, 2, 3]));
  const trajGood = gradientTrajectory(0.2, 10);
  const trajBad = gradientTrajectory(2.0, 10);

  s.add(cinemaGrid({ accent: ROLE.score, seed: 30 }));
  s.add(decorAura(0, 0, 560, '#5ce1e61a', '#ffd16614'));

  const headline = heroTitle(['Library Parity,', 'L2 Shrinkage & Step Size'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.score,
    eyebrow: 'DEBUGGING LOGISTIC REGRESSION FITS',
  });

  // View 0 (Beat 0): Gradient loop vs scikit-learn L-BFGS (C=inf, fit_intercept=False)
  const view0 = guardedDynamic(
    () => fadeOut(s1P.value),
    (vis) => {
      const lb = libP.value;
      const names = ['Intercept w₀', 'Ambiguity w₁', 'Support w₂'];
      const nodes = [
        txt('SAME 8 ROWS  ·  NO EXTRA INTERCEPT  ·  C = ∞', 0, -220, 28, COSMOS.muted, 'mono'),
        txt('GRADIENT LOOP (3000)', -120, -145, 28, ROLE.score, 'mono'),
        txt('SCIKIT-LEARN (L-BFGS)', 470, -145, 28, ROLE.threshold, 'mono'),
      ];
      names.forEach((name, i) => {
        const y = -55 + i * 120;
        const show = lb > i * 0.25 + 0.1;
        nodes.push(
          txt(name, -770, y, 32, COSMOS.muted, 'mono', 'left'),
          txt(fittedWeights[i].toFixed(3), -120, y, 46, ROLE.score, 'mono'),
          line([60, y], [290, y], { stroke: '#4d6499', width: 2.5 }),
          txt(
            show ? SKLEARN_WEIGHTS[i].toFixed(3) : '?',
            470,
            y,
            46,
            show ? ROLE.threshold : COSMOS.dim,
            'mono',
          ),
        );
      });
      nodes.push(
        txt(
          'Different stopping tolerances yield tiny weight differences but identical request rankings',
          0,
          355,
          29,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Turn on L2 penalty (C = 1) -> weights shrink toward 0 -> R3 moves 0.274 -> 0.520 across cut 0.50!
  const view1 = guardedDynamic(
    () => Math.min(fadeIn(s1P.value), fadeOut(s2P.value)),
    (vis) => {
      const pn = smooth(penP.value);
      const r3 = smooth(r3P.value);
      const rev = r3RevP.value;
      const curR3 = mix(r3Base, r3Pen, r3);
      const names = ['w₀', 'w₁', 'w₂'];
      const nodes = [
        txt(
          'TURN ON L2 PENALTY (C = 1):  WEIGHTS SHRINK TOWARD ZERO',
          0,
          -225,
          28,
          ROLE.threshold,
          'mono',
        ),
        txt('UNPENALIZED', -240, -155, 26, ROLE.score, 'mono'),
        txt('C = 1 (L2)', 360, -155, 26, ROLE.threshold, 'mono'),
      ];
      names.forEach((name, i) => {
        const y = -90 + i * 76;
        const curW = mix(fittedWeights[i], penalizedWeights[i], pn);
        nodes.push(
          txt(name, -560, y, 30, COSMOS.muted, 'mono'),
          txt(fittedWeights[i].toFixed(3), -240, y, 36, ROLE.score, 'mono'),
          line([-70, y], [190, y], { stroke: ROLE.threshold, width: 2.5 }).opacity(0.4 + 0.6 * pn),
          txt(pn > 0.15 ? curW.toFixed(3) : '?', 360, y, 36, ROLE.threshold, 'mono'),
        );
      });

      // R3 score bar crossing the 0.50 cut!
      const bx = -560;
      const bw = 960;
      const by = 215;
      const cutX = bx + bw * 0.5;
      nodes.push(
        txt('REQUEST R3 (ambiguity = 2, support = 3)', bx, by - 68, 28, COSMOS.ink, 'mono', 'left'),
        scaleTrack(bx, by, bw, 46, { stroke: '#32446e', radius: 10 }),
        glowBar(bx, by, bw * curR3, 42, r3 > 0.5 ? ROLE.threshold : ROLE.score, {
          glow: 10,
          radius: 8,
        }),
        line([cutX, by - 44], [cutX, by + 44], { stroke: COSMOS.ink, width: 4 }),
        txt('Cut 0.50', cutX, by + 76, 26, COSMOS.ink, 'mono'),
        txt(curR3.toFixed(3), bx + bw + 34, by, 38, ROLE.threshold, 'mono', 'left'),
        txt(
          rev > 0.5
            ? 'R3 crosses cut 0.50 into human review'
            : 'Regularization changes probabilities, not just weights',
          0,
          365,
          30,
          rev > 0.5 ? ROLE.threshold : COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Learning rate 0.2 (falls) vs 2.0 (jumps above 2.0!)
  const maxLoss = Math.ceil(Math.max(...trajBad.map((r) => r.loss)) * 1.05);
  const ax2 = makeAxes({
    x0: -790,
    y0: -205,
    w: 940,
    h: 455,
    xDom: [0, 10],
    yDom: [0, maxLoss],
    xTicks: [0, 2, 4, 6, 8, 10],
    yTicks: [0, 1, 2, maxLoss],
    xLabel: 'completed update',
    yLabel: 'mean log loss',
  });

  const view2 = guardedDynamic(
    () => fadeIn(s2P.value),
    (vis) => {
      const f1 = smooth(step1P.value);
      const rm = smooth(remP.value);
      const buildPts = (rows) => {
        if (f1 < 0.99) {
          return [ax2.pt(0, rows[0].loss), ax2.pt(f1, mix(rows[0].loss, rows[1].loss, f1))];
        }
        const endIdx = Math.min(10, Math.max(1, 1 + Math.round(rm * 9)));
        return rows.slice(0, endIdx + 1).map((r) => ax2.pt(r.step, r.loss));
      };
      const goodPts = buildPts(trajGood);
      const badPts = buildPts(trajBad);
      const rx = 510;
      return group(
        ax2.node,
        neonCurve(goodPts, [ROLE.score, ROLE.good], { width: 4.5, glow: 10 }),
        neonCurve(badPts, [ROLE.positive, ROLE.warn], { width: 4.5, glow: 10 }),
        glowDot(...goodPts.at(-1), { radius: 10, color: ROLE.score }),
        glowDot(...badPts.at(-1), { radius: 10, color: ROLE.positive }),
        txt(`Start loss: ${trajGood[0].loss.toFixed(3)}`, rx, -175, 30, ROLE.threshold, 'mono'),
        txt(
          `lr = 0.2:  ${f1 > 0.8 ? trajGood[1].loss.toFixed(3) : '?'}`,
          rx,
          -85,
          36,
          ROLE.score,
          'mono',
        ),
        txt(
          `lr = 2.0:  ${f1 > 0.8 ? trajBad[1].loss.toFixed(3) : '?'}`,
          rx,
          5,
          36,
          ROLE.positive,
          'mono',
        ),
        txt('Loss jumps? Shrink step size', rx, 115, 28, COSMOS.ink, 'sans'),
        txt(
          'Compare against a constant base-rate model and inspect calibration bins when debugging',
          0,
          375,
          28,
          COSMOS.muted,
          'sans',
        ),
      ).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'lr-implementation-parity-step-0', s0P, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-library-coefficients', libP, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-implementation-parity-step-1', s1P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-parity-penalty', penP, 1, { dur: 0.9 });
  cueTo(s, c, 'r3-score', r3P, 1, { dur: 0.9 });
  cueTo(s, c, 'r3-review', r3RevP, 1, { dur: 0.6 });
  cueTo(s, c, 'lr-implementation-parity-step-2', s2P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-diagnose-first-update', step1P, 1, { dur: 0.9 });
  cueTo(s, c, 'remaining-updates', remP, 1, { dur: 1.0 });
}

// ---------------------------------------------------------------------------
// 31. fresh-operating-point: Price a new batch before the labels arrive
// Cues: new-scores, auto-prices, review-prices, expected-question,
//       fresh-auto-routes*, lr-new-mid-queue*, lr-new-mid-auto, lr-new-mid-review,
//       lr-new-mid-total*, lr-new-low-selection, lr-new-low-policy*,
//       restore-middle, lr-new-high-selection, lr-new-high-policy*, lr-new-selected-policy*
// ---------------------------------------------------------------------------
export function freshOperatingPoint(s, c) {
  const scoresP = s.value(0);
  const autoP = s.value(0);
  const revP = s.value(0);
  const qP = s.value(0);
  const midAutoRouteP = s.value(0);
  const midRevRouteP = s.value(0);
  const midAutoSumP = s.value(0);
  const midRevSumP = s.value(0);
  const midTotP = s.value(0);
  const lowSelP = s.value(0);
  const lowPolP = s.value(0);
  const restP = s.value(0);
  const highSelP = s.value(0);
  const highPolP = s.value(0);
  const chooseP = s.value(0);
  const drift = s.value(0);

  const { probs, fpCost, fnCost, offers } = FRESH_BATCH;

  s.add(cinemaGrid({ accent: ROLE.threshold, seed: 31 }));
  s.add(decorAura(0, 10, 560, '#ffd1661b', '#5ce1e614'));

  const headline = heroTitle(['Pricing a Fresh Batch', 'Before Labels Arrive'], {
    x: -855,
    y: -440,
    size: 48,
    lineHeight: 56,
    accent: ROLE.threshold,
    eyebrow: '2 REVIEW SLOTS  ·  MISS $108  ·  EXTRA CHECK $12',
  });

  const live = dynamic(() => {
    const sc = scoresP.value;
    const au = autoP.value;
    const rv = revP.value;
    const mA = midAutoRouteP.value;
    const mR = midRevRouteP.value;
    const mAS = midAutoSumP.value;
    const mRS = midRevSumP.value;
    const mT = midTotP.value;
    const lS = lowSelP.value;
    const lP = lowPolP.value;
    const rs = restP.value;
    const hS = highSelP.value;
    const hP = highPolP.value;
    const ch = chooseP.value;

    // Active cut timeline: 0.30 -> 0.10 -> 0.30 -> 0.60 -> 0.30
    let activeCut = 0.3;
    if (ch > 0.5) activeCut = 0.3;
    else if (hS > 0.5) activeCut = 0.6;
    else if (rs > 0.5) activeCut = 0.3;
    else if (lS > 0.5) activeCut = 0.1;

    const nodes = [
      txt(`ACTIVE CUT  t = ${activeCut.toFixed(2)}`, 565, -390, 34, ROLE.threshold, 'mono').glow(
        8,
        ROLE.threshold,
      ),
      txt('PROBABILITY p', -835, -185, 26, ROLE.score, 'mono', 'left'),
      txt('AUTO ($108 × p)', -835, -60, 26, ROLE.negative, 'mono', 'left'),
      txt('REVIEW ($12 × (1−p))', -835, 72, 26, ROLE.threshold, 'mono', 'left'),
    ];

    const colX = (i) => -300 + i * 340;
    const shownCount = Math.max(1, Math.ceil(sc * 4));

    probs.forEach((p, i) => {
      const cx = colX(i);
      const risk = probabilityCost(p, fpCost, fnCost);
      const isRev = p >= activeCut;
      const routeVisible = i < 2 ? mA > 0.5 : mR > 0.5;
      const autoSel = routeVisible && !isRev;
      const revSel = routeVisible && isRev;

      nodes.push(
        txt(`N${i + 1}`, cx, -242, 28, COSMOS.muted, 'mono'),
        txt(i < shownCount ? p.toFixed(2) : '?', cx, -185, 44, ROLE.score, 'mono'),
        // Automatic price cell
        rect(226, 78, {
          fill: autoSel ? ROLE.threshold : '#0f172b',
          stroke: autoSel ? ROLE.threshold : '#2e4068',
          width: autoSel ? 3 : 2,
          radius: 10,
        })
          .at(cx, -60)
          .glow(autoSel ? 10 : 0, ROLE.threshold),
        txt(
          au > 0.5 ? `$${risk.automatic.toFixed(2)}` : '?',
          cx,
          -60,
          36,
          autoSel ? '#070910' : ROLE.negative,
          'mono',
        ),
        // Review price cell
        rect(226, 78, {
          fill: revSel ? ROLE.threshold : '#0f172b',
          stroke: revSel ? ROLE.threshold : '#2e4068',
          width: revSel ? 3 : 2,
          radius: 10,
        })
          .at(cx, 72)
          .glow(revSel ? 10 : 0, ROLE.threshold),
        txt(
          rv > 0.5 ? `$${risk.review.toFixed(2)}` : '?',
          cx,
          72,
          36,
          revSel ? '#070910' : ROLE.threshold,
          'mono',
        ),
      );
    });

    // Bottom 3 tested cut bills: 0.10 ($24.84, 3 rev), 0.30 ($34.44, 2 rev), 0.60 ($76.44, 1 rev)
    const known = [lP > 0.5, mT > 0.5, hP > 0.5];
    nodes.push(line([-820, 152], [820, 152], { stroke: '#2c3d63', width: 2 }));
    offers.forEach((off, i) => {
      const lx = -540 + i * 540;
      const chosen = ch > 0.5 && off.cut === 0.3;
      const col = chosen ? ROLE.good : off.feasible ? COSMOS.ink : ROLE.positive;
      nodes.push(
        txt(`Cut ${off.cut.toFixed(2)}`, lx, 206, 28, chosen ? ROLE.good : COSMOS.muted, 'mono'),
        txt(
          known[i]
            ? `${off.queue} rev  ·  $${off.cost.toFixed(2)}${off.feasible ? '' : ' (over)'}`
            : 'Pending',
          lx,
          258,
          32,
          known[i] ? col : COSMOS.dim,
          'mono',
        ),
      );
    });

    // Bottom strictly withheld narration prompt / sum readout
    let note = 'At cut 0.30, pick one expected dollar amount from each column';
    if (mAS > 0.5 && mRS < 0.5) note = 'Automatic:  $5.40 + $19.44 = $24.84';
    if (mRS > 0.5 && mT < 0.5) note = 'Automatic $24.84  +  Review $9.60  =  $34.44';
    if (mT > 0.5 && lS < 0.5) note = 'Cut 0.30 total: $34.44 in expectation (2 slots)';
    if (lS > 0.5 && rs < 0.5) note = 'Cut 0.10: N2 switches to review ($24.84, but needs 3 slots!)';
    if (rs > 0.5 && hS < 0.5) note = 'Return to cut 0.30 (2 slots)';
    if (hS > 0.5 && ch < 0.5)
      note = 'Cut 0.60: N3 goes auto ($76.44, 1 slot). Cheapest feasible cut?';
    if (ch > 0.5) note = 'Choose cut 0.30: N3 and N4 take the 2 slots ($34.44 expected)';

    nodes.push(txt(note, 0, 365, 32, ch > 0.5 ? ROLE.good : ROLE.threshold, 'serif'));

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'new-scores', scoresP, 1, { dur: 0.8 });
  cueTo(s, c, 'auto-prices', autoP, 1, { dur: 0.7 });
  cueTo(s, c, 'review-prices', revP, 1, { dur: 0.7 });
  cueTo(s, c, 'expected-question', qP, 1, { dur: 0.6 });
  cueTo(s, c, 'fresh-auto-routes', midAutoRouteP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'lr-new-mid-queue', midRevRouteP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'lr-new-mid-auto', midAutoSumP, 1, { dur: 0.65 });
  cueTo(s, c, 'lr-new-mid-review', midRevSumP, 1, { dur: 0.65 });
  cueTo(s, c, 'lr-new-mid-total', midTotP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'lr-new-low-selection', lowSelP, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-new-low-policy', lowPolP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'restore-middle', restP, 1, { dur: 0.6 });
  cueTo(s, c, 'lr-new-high-selection', highSelP, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-new-high-policy', highPolP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'lr-new-selected-policy', chooseP, 1, { after: true, dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 32. decision: What goes on the mistake bill?
// Cues: frozen-cut, final-route*, final-label*, final-verdict*, final-outcome,
//       final-miss, final-extra, final-receipt
// ---------------------------------------------------------------------------
export function decisionScene(s, c) {
  const cutP = s.value(0);
  const routeP = s.value(0);
  const labelP = s.value(0);
  const verdP = s.value(0);
  const outP = s.value(0);
  const missP = s.value(0);
  const extraP = s.value(0);
  const recP = s.value(0);
  const drift = s.value(0);

  const pol50 = policyAt(0.5);
  const extraCost = costForCounts({ fp: 1, fn: 0 }); // $18

  s.add(cinemaGrid({ accent: ROLE.good, seed: 32 }));
  s.add(decorAura(0, 0, 560, '#5ce1e61a', '#6ee7b716'));

  const headline = heroTitle(['Closing the Case', '& Mistake Bill'], {
    x: -855,
    y: -440,
    size: 48,
    lineHeight: 56,
    accent: ROLE.good,
    eyebrow: 'FROZEN 4-SLOT POLICY  ·  CUT t = 0.50',
  });

  const live = dynamic(() => {
    const rt = smooth(routeP.value);
    const lb = labelP.value;
    const vd = verdP.value;
    const ou = outP.value;
    const ms = missP.value;
    const ex = extraP.value;
    const rc = recP.value;
    const nodes = [];

    // Top probability ruler returning full circle from Scene 1!
    const rx0 = -740;
    const rx1 = 740;
    const ry = -195;
    const xOf = (p) => mix(rx0, rx1, p);
    const cutX = xOf(0.5);
    const scoreX = xOf(openingRequest.p);

    nodes.push(
      line([rx0, ry], [cutX, ry], { stroke: ROLE.negative, width: 8 }).opacity(0.6),
      line([cutX, ry], [rx1, ry], { stroke: ROLE.threshold, width: 10 }).glow(8, ROLE.threshold),
      line([cutX, ry - 20], [cutX, ry + 26], { stroke: ROLE.threshold, width: 4.5 }),
      txt('Cut 0.50', cutX, ry + 56, 28, ROLE.threshold, 'mono'),
      glowDot(scoreX, ry, { radius: 13, color: ROLE.score, glow: 14 }),
      txt(`REQ-10234: ${openingRequest.p.toFixed(3)}`, scoreX, ry - 48, 30, ROLE.score, 'mono'),
    );

    // Moving request token sliding into the Review Desk on the right
    const tokX = mix(-430, 420, rt);
    const tokY = 65;
    nodes.push(
      txt('REVIEW DESK  (4 SLOTS)', 420, -64, 28, ROLE.threshold, 'mono'),
      rect(580, 175, { fill: '#0b1224', stroke: ROLE.threshold, width: 2.6, radius: 14 })
        .at(420, tokY)
        .opacity(0.9),
      // Floating request badge
      rect(510, 130, { fill: '#12203b', stroke: ROLE.score, width: 2.6, radius: 12 })
        .at(tokX, tokY)
        .glow(8, ROLE.score),
      txt('Change team access', tokX, tokY - 26, 28, COSMOS.ink, 'sans'),
      txt(
        lb > 0.5 ? 'p = 0.624 · Routine' : 'p = 0.624 · Pending',
        tokX,
        tokY + 24,
        26,
        lb > 0.5 ? ROLE.negative : ROLE.score,
        'mono',
      ),
    );

    // Left validation receipt appears cleanly on Beat 1
    if (ms > 0.05) {
      nodes.push(
        group(
          txt('8 VALIDATION CASES (CUT 0.50)', -440, -45, 26, COSMOS.muted, 'mono'),
          line([-710, -12], [-170, -12], { stroke: '#32456e', width: 2 }),
          txt('1 missed review', -700, 45, 30, COSMOS.ink, 'sans', 'left'),
          txt('$120', -180, 45, 36, ROLE.positive, 'mono', 'right'),
          ex > 0.3
            ? group(
                txt('1 unnecessary review', -700, 110, 30, COSMOS.ink, 'sans', 'left'),
                txt('$18', -180, 110, 36, ROLE.negative, 'mono', 'right'),
              ).opacity(ex)
            : group(),
        ).opacity(ms),
      );
    }

    // Strictly withheld opening-request verdict + final policy receipt (no brief intermediate flash)
    let verdict = 'Cut 0.50 is frozen: where does 0.624 route?';
    if (vd > 0.5) verdict = `Unnecessary review  ·  $${extraCost} on the mistake bill`;
    else if (lb > 0.5) verdict = 'Closed case was routine: what kind of outcome?';
    else if (rt > 0.5) verdict = 'Routed to human review (0.624 ≥ 0.50)';

    nodes.push(
      txt(verdict, 0, 265, 36, vd > 0.5 ? ROLE.threshold : COSMOS.ink, 'serif'),
      rc > 0.4
        ? txt(
            `Validation total: ${pol50.queue} reviews  ·  $${pol50.cost}  ·  4 / 4 slots filled`,
            0,
            355,
            34,
            ROLE.good,
            'mono',
          )
            .glow(8, ROLE.good)
            .opacity(rc)
        : txt(
            'Freeze the cut and tally fresh traffic as cases close',
            0,
            355,
            28,
            COSMOS.muted,
            'sans',
          ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'frozen-cut', cutP, 1, { dur: 0.6 });
  cueTo(s, c, 'final-route', routeP, 1, { after: true, dur: 0.85 });
  cueTo(s, c, 'final-label', labelP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'final-verdict', verdP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'final-outcome', outP, 1, { dur: 0.65 });
  cueTo(s, c, 'final-miss', missP, 1, { dur: 0.65 });
  cueTo(s, c, 'final-extra', extraP, 1, { dur: 0.65 });
  cueTo(s, c, 'final-receipt', recP, 1, { dur: 0.7 });
}
