// Act 3 (Scenes 13-18): Moving Threshold Policy, Confusion Matrix Token Routing,
// Precision & Recall Denominators, Harmonic vs Arithmetic Mean (F1),
// Staffing Capacity Desk (4, 5, 6 slots), and Calibrated Expected Cost Break-Even.
import { Node, circle, dot, dynamic, group, line, polyPath, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SORTED_VAL,
  cinemaGrid,
  costForCounts,
  countsAt,
  cueTo,
  decorAura,
  dotVec,
  fadeIn,
  fadeOut,
  fittedWeights,
  glowBar,
  glowCol,
  glowDot,
  glowTex,
  guardedDynamic,
  harmonicFixture,
  heroTitle,
  livingDrift,
  makeAxes,
  mix,
  neonCurve,
  policies,
  policyAt,
  probabilityCost,
  reviewRegionVertices,
  rule,
  scaleTrack,
  sigmoid,
  smooth,
  training,
  txt,
  validationScores,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 13. boundary: Move the policy while the model stays fixed
// Cues: boundary-region, lower-threshold
// ---------------------------------------------------------------------------
export function boundaryScene(s, c) {
  const regP = s.value(0);
  const lowP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.threshold, seed: 13 }));
  s.add(decorAura(-180, 0, 560, '#ffd1661c', '#5ce1e614'));

  const headline = heroTitle(['Freeze the Weights,', 'Slide the Policy'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.threshold,
    eyebrow: 'PARALLEL DECISION CONTOURS IN FEATURE SPACE',
  });

  const ax = makeAxes({
    x0: -800,
    y0: -215,
    w: 960,
    h: 470,
    xDom: [0.5, 5],
    yDom: [0, 9],
    xTicks: [1, 2, 3, 4, 5],
    yTicks: [0, 3, 6, 9],
    xLabel: 'ambiguity x₁',
    yLabel: 'policy support x₂',
  });

  const live = dynamic(() => {
    const rg = smooth(regP.value);
    const lw = smooth(lowP.value);
    const tVal = mix(0.5, 0.2, lw);
    const level = Math.log(tVal / (1 - tVal));
    const nodes = [ax.node];

    // Shaded review half-plane
    const verts = reviewRegionVertices(fittedWeights, tVal);
    if (verts.length >= 3) {
      const polyPts = verts.map((v) => ax.pt(v.x, v.y));
      nodes.push(
        new Node(polyPath(polyPts, true)).fill(ROLE.threshold, 0.06 + 0.14 * rg).stroke(null),
      );
    }

    // Parallel boundary line for current t
    const bPts = [];
    for (let i = 0; i <= 50; i++) {
      const x = 0.5 + (4.5 * i) / 50;
      const y = (level - fittedWeights[0] - fittedWeights[1] * x) / fittedWeights[2];
      if (y >= 0 && y <= 9) bPts.push(ax.pt(x, y));
    }
    if (bPts.length >= 2) {
      nodes.push(neonCurve(bPts, [ROLE.threshold, ROLE.warn], { width: 5, glow: 12 }));
    }

    // 8 training dots with glowing gold action rings when p >= tVal
    let flagged = 0;
    training.forEach(([a, sup, y]) => {
      const [px, py] = ax.pt(a, sup);
      const p = sigmoid(dotVec(fittedWeights, [1, a, sup]));
      const col = y ? ROLE.positive : ROLE.negative;
      const isRev = p >= tVal;
      if (isRev) flagged++;
      nodes.push(glowDot(px, py, { radius: 11, color: col, glow: 10 }));
      if (isRev) {
        nodes.push(
          circle(21, { fill: null, stroke: ROLE.threshold, width: 3.2 })
            .at(px, py)
            .glow(8, ROLE.threshold),
        );
      }
    });

    // Right readout column
    const rx = 515;
    nodes.push(
      txt('FIXED WEIGHTS w', rx, -205, 26, COSMOS.muted, 'mono'),
      txt('[−4.89, +3.40, −0.96]', rx, -150, 28, ROLE.score, 'mono'),
      rule(260, -100, 770, -100, '#2a3759', 2),
      txt('ACTIVE THRESHOLD', rx, -45, 26, ROLE.threshold, 'mono'),
      txt(`t = ${tVal.toFixed(2)}`, rx, 20, 56, ROLE.threshold, 'mono').glow(10, ROLE.threshold),
      txt(`logit(t) = ${level.toFixed(2)}`, rx, 95, 30, COSMOS.ink, 'mono'),
      txt(`${flagged} of 8 routed to review`, rx, 165, 30, ROLE.warn, 'sans'),
      txt('Pink = required · Blue = routine', rx, 230, 26, COSMOS.muted, 'sans'),
      txt(
        lw > 0.5
          ? 'Lowering the cut shifts the line parallel into negative logits without refitting'
          : 'Gold rings mark the action policy; dot color keeps the observed outcome',
        0,
        375,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'boundary-region', regP, 1, { dur: 0.85 });
  cueTo(s, c, 'lower-threshold', lowP, 1, { dur: 1.0 });
}

// ---------------------------------------------------------------------------
// 14. confusion: Every count has a request behind it
// Cues: route-validation, threshold-sweep-b2-2, cost-alternatives-b3-2
// ---------------------------------------------------------------------------
export function confusionScene(s, c) {
  const routeP = s.value(0);
  const sweepP = s.value(0);
  const costP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.score, seed: 14 }));
  s.add(decorAura(0, 10, 560, '#5ce1e61a', '#ff6b8b14'));

  const headline = heroTitle(['Confusion Matrix', '& Error Costs'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.score,
    eyebrow: '8 RESERVED VALIDATION REQUESTS  (V1..V8)',
  });

  const cellOrigin = (key) => {
    if (key === 'tp') return [-370, -35];
    if (key === 'fp') return [390, -35];
    if (key === 'fn') return [-370, 170];
    return [390, 170];
  };
  const cellOf = (v, t) => (v.p >= t ? (v.label ? 'tp' : 'fp') : v.label ? 'fn' : 'tn');

  const live = dynamic(() => {
    const rt = smooth(routeP.value);
    const sw = smooth(sweepP.value);
    const cs = costP.value;
    const tVal = mix(0.8, 0.2, sw);
    const counts = countsAt(tVal);
    const totalCost = costForCounts(counts);
    const nodes = [];

    // Column & row headers for the 2x2 confusion matrix
    nodes.push(
      txt(`THRESHOLD CUT  t = ${tVal.toFixed(2)}`, 550, -355, 34, ROLE.threshold, 'mono').glow(
        8,
        ROLE.threshold,
      ),
      txt('ACTUAL: REQUIRED (y = 1)', -370, -155, 26, ROLE.positive, 'mono'),
      txt('ACTUAL: ROUTINE (y = 0)', 390, -155, 26, ROLE.negative, 'mono'),
      txt('REVIEW', -715, -35, 26, ROLE.threshold, 'mono', 'right'),
      txt('AUTO', -715, 170, 26, COSMOS.muted, 'mono', 'right'),
    );

    // 4 clean quantitative quadrants
    const cellsMeta = [
      ['tp', `TP = ${counts.tp}`, 'Caught review', ROLE.good],
      ['fp', `FP = ${counts.fp}`, 'Extra check ($18)', ROLE.warn],
      ['fn', `FN = ${counts.fn}`, 'Missed review ($120)', ROLE.positive],
      ['tn', `TN = ${counts.tn}`, 'Clean auto ($0)', ROLE.negative],
    ];
    cellsMeta.forEach(([key, title, sub, col]) => {
      const [cx, cy] = cellOrigin(key);
      nodes.push(
        rect(640, 165, { fill: '#0d1426', stroke: col, width: 2.2, radius: 14 })
          .at(cx, cy)
          .opacity(0.88),
        txt(title, cx - 285, cy - 52, 28, col, 'mono', 'left'),
        txt(sub, cx + 285, cy - 52, 26, COSMOS.muted, 'sans', 'right'),
      );
    });

    // Physically moving validation tokens V1..V8 routed cleanly via the empty center aisle (x = 10)
    const aisleX = 10;
    const travel = (pts, q) => {
      const clamped = Math.max(0, Math.min(1, q));
      const segs = pts.length - 1;
      const scaled = clamped * segs;
      const idx = Math.min(segs - 1, Math.floor(scaled));
      const f = scaled - idx;
      return [mix(pts[idx][0], pts[idx + 1][0], f), mix(pts[idx][1], pts[idx + 1][1], f)];
    };
    validationScores.forEach((v, i) => {
      const startX = -715 + i * 204;
      const startY = -235;
      const kHigh = cellOf(v, 0.8);
      const kLow = cellOf(v, 0.2);
      const sameClassIdx = validationScores
        .filter((r) => r.label === v.label)
        .findIndex((r) => r.id === v.id);
      const offsetX = -210 + sameClassIdx * 140;

      const [hx, hy] = cellOrigin(kHigh);
      const [lx, ly] = cellOrigin(kLow);
      const tgtHigh = [hx + offsetX, hy + 22];
      const tgtLow = [lx + offsetX, ly + 22];

      let [cx, cy] = travel(
        [[startX, startY], [aisleX, startY], [aisleX, tgtHigh[1]], tgtHigh],
        rt,
      );
      if (sw > 0.01 && kHigh !== kLow) {
        const crossAt = Math.max(0, Math.min(1, (0.8 - v.p) / 0.6));
        const localT = smooth(Math.max(0, Math.min(1, (sw - crossAt * 0.7) / 0.3)));
        [cx, cy] = travel([tgtHigh, [aisleX, tgtHigh[1]], [aisleX, tgtLow[1]], tgtLow], localT);
      }
      const col = v.label ? ROLE.positive : ROLE.negative;
      nodes.push(
        circle(26, { fill: col, stroke: '#070910', width: 2 }).at(cx, cy).glow(7, col),
        txt(v.id, cx, cy, 26, '#070910', 'mono'),
      );
    });

    // Bottom cost comparison strip (crossfades cleanly on beat 2)
    const preCost = fadeOut(cs);
    const postCost = fadeIn(cs);
    if (preCost > 0.02) {
      nodes.push(
        txt(
          `Queue: ${counts.tp + counts.fp} reviews   ·   Error cost: $${totalCost}`,
          0,
          355,
          38,
          ROLE.threshold,
          'mono',
        ).opacity(preCost),
      );
    }
    if (postCost > 0.02) {
      nodes.push(
        group(
          txt('COST = $18 × FP + $120 × FN', -560, 345, 28, COSMOS.muted, 'mono'),
          txt('Cut 0.80: $240', -80, 345, 32, ROLE.positive, 'mono'),
          txt('Cut 0.50: $138', 260, 345, 32, ROLE.warn, 'mono'),
          txt('Cut 0.20: $36', 600, 345, 34, ROLE.good, 'mono').glow(8, ROLE.good),
        ).opacity(postCost),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'route-validation', routeP, 1, { dur: 1.1 });
  cueTo(s, c, 'threshold-sweep-b2-2', sweepP, 1, { dur: 1.25 });
  cueTo(s, c, 'cost-alternatives-b3-2', costP, 1, { dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 15. denominators: Precision and recall collect different groups
// Cues: precision-cohort, recall-cohort, f1-receipt
// ---------------------------------------------------------------------------
export function denominatorsScene(s, c) {
  const precP = s.value(0);
  const recP = s.value(0);
  const f1P = s.value(0);
  const drift = s.value(0);

  const tpTokens = validationScores.filter((v) => v.label === 1 && v.p >= 0.2);
  const fpTokens = validationScores.filter((v) => v.label === 0 && v.p >= 0.2);

  s.add(cinemaGrid({ accent: ROLE.good, seed: 15 }));
  s.add(decorAura(0, 10, 560, '#6ee7b71a', '#ffd16614'));

  const headline = heroTitle(['Different Denominators:', 'Precision vs Recall'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.good,
    eyebrow: 'VALIDATION AT CUT t = 0.20',
  });

  const live = dynamic(() => {
    const pp = smooth(precP.value);
    const rp = smooth(recP.value);
    const f1 = f1P.value;
    const nodes = [];

    // Left: Precision cohort (6 sent to review: 4 TP + 2 FP)
    nodes.push(
      txt('PRECISION COHORT  (SENT TO REVIEW)', -450, -210, 28, ROLE.threshold, 'mono'),
      txt('Denominator = TP + FP = 6 requests', -450, -162, 26, COSMOS.muted, 'sans'),
    );
    [...tpTokens, ...fpTokens].forEach((v, i) => {
      const cx = -740 + i * 116;
      const cy = -40;
      const col = v.label ? ROLE.positive : ROLE.negative;
      nodes.push(
        circle(34, { fill: col, stroke: ROLE.threshold, width: 3 })
          .at(cx, cy)
          .glow(pp > 0.3 ? 10 : 4, col)
          .opacity(0.35 + 0.65 * pp),
        txt(v.id, cx, cy, 26, '#070910', 'mono'),
        txt(v.label ? 'TP' : 'FP', cx, cy + 56, 26, col, 'mono'),
      );
    });
    nodes.push(
      glowTex('\\text{Precision} = \\frac{4}{4 + 2} = \\frac{2}{3} \\approx 0.667', {
        x: -450,
        y: 120,
        size: 38,
        color: ROLE.threshold,
      }).opacity(0.3 + 0.7 * pp),
    );

    nodes.push(rule(0, -220, 0, 200, '#2a3759', 2));

    // Right: Recall cohort (4 actual positives: 4 TP + 0 FN)
    nodes.push(
      txt('RECALL COHORT  (ACTUALLY REQUIRED)', 450, -210, 28, ROLE.positive, 'mono'),
      txt('Denominator = TP + FN = 4 requests', 450, -162, 26, COSMOS.muted, 'sans'),
    );
    tpTokens.forEach((v, i) => {
      const cx = 240 + i * 140;
      const cy = -40;
      nodes.push(
        circle(36, { fill: ROLE.positive, stroke: ROLE.good, width: 3.2 })
          .at(cx, cy)
          .glow(rp > 0.3 ? 12 : 4, ROLE.positive)
          .opacity(0.35 + 0.65 * rp),
        txt(v.id, cx, cy, 26, '#070910', 'mono'),
        txt('TP', cx, cy + 56, 26, ROLE.good, 'mono'),
      );
    });
    nodes.push(
      glowTex('\\text{Recall} = \\frac{4}{4 + 0} = 1.000', {
        x: 450,
        y: 120,
        size: 38,
        color: ROLE.good,
      }).opacity(0.3 + 0.7 * rp),
    );

    // Bottom: Harmonic mean F1 receipt
    nodes.push(
      glowTex(
        f1 > 0.4
          ? 'F_1 = \\frac{2 \\cdot (2/3) \\cdot 1}{2/3 + 1} = 0.800'
          : 'F_1 = \\frac{2 P R}{P + R}',
        { x: 0, y: 295, size: 46, color: f1 > 0.4 ? ROLE.score : COSMOS.muted },
      ),
      txt(
        'Always report raw counts (TP, FP, FN) alongside rates',
        0,
        388,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'precision-cohort', precP, 1, { dur: 0.9 });
  cueTo(s, c, 'recall-cohort', recP, 1, { dur: 0.9 });
  cueTo(s, c, 'f1-receipt', f1P, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 16. harmonic-mean: Keep a small recall from hiding inside a large average
// Cues: lr-harmonic-mean-step-0, lr-harmonic-formula, lr-harmonic-mean-step-1,
//       lr-harmonic-answer, lr-harmonic-mean-step-2, lr-harmonic-counts
// ---------------------------------------------------------------------------
export function harmonicMean(s, c) {
  const s0P = s.value(0);
  const fmlP = s.value(0);
  const s1P = s.value(0);
  const ansP = s.value(0);
  const s2P = s.value(0);
  const cntP = s.value(0);
  const drift = s.value(0);

  const ext = harmonicFixture(1, 0, 99);

  s.add(cinemaGrid({ accent: ROLE.loss, seed: 16 }));
  s.add(decorAura(0, 20, 560, '#a78bfa1e', '#ff6b8b14'));

  const headline = heroTitle(['Why F1 Uses the', 'Harmonic Mean'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.loss,
    eyebrow: 'PUNISHING A COLLAPSED COMPONENT',
  });

  // View 0 (Beat 0): Reciprocal formula
  const view0 = guardedDynamic(
    () => fadeOut(s1P.value),
    (vis) => {
      const fm = fmlP.value;
      return group(
        txt('A SMALL COMPONENT HAS A HUGE RECIPROCAL', 0, -195, 28, ROLE.threshold, 'mono'),
        glowTex('F_1 = \\frac{2 P R}{P + R} = \\frac{2}{\\frac{1}{P} + \\frac{1}{R}}', {
          x: 0,
          y: -40,
          size: 56,
          color: fm > 0.2 ? ROLE.score : COSMOS.ink,
        }),
        txt(
          'When R = 0.01, its reciprocal 1/R = 100 dominates the denominator',
          0,
          145,
          32,
          ROLE.positive,
          'serif',
        ),
        txt(
          'Arithmetic mean averages values; harmonic mean averages reciprocals',
          0,
          235,
          28,
          COSMOS.muted,
          'sans',
        ),
      ).opacity(vis);
    },
  );

  // View 1 (Beat 1): Limiting example P = 1.00, R = 0.01 -> Arithmetic 0.505 vs F1 = 0.0198
  const view1 = guardedDynamic(
    () => Math.min(fadeIn(s1P.value), fadeOut(s2P.value)),
    (vis) => {
      const an = ansP.value;
      const bx = -440;
      const maxW = 940;
      const rows = [
        ['Precision  (1 / 1)', 1.0, ROLE.good],
        ['Recall  (1 / 100)', 0.01, ROLE.positive],
        ['Arithmetic mean', ext.arithmetic, ROLE.warn],
        ['Harmonic F1', an > 0.5 ? ext.f1 : 0, ROLE.score],
      ];
      const nodes = [
        txt('LIMITING CASE:  TP = 1,   FP = 0,   FN = 99', 0, -215, 30, ROLE.threshold, 'mono'),
      ];
      rows.forEach(([lbl, val, col], i) => {
        const y = -115 + i * 104;
        const valText = i === 3 && an <= 0.5 ? '?' : i === 3 ? ext.f1.toFixed(4) : val.toFixed(3);
        nodes.push(
          txt(lbl, -820, y, 28, col, 'mono', 'left'),
          scaleTrack(bx, y, maxW, 38, { stroke: '#2c3d63', radius: 8 }),
          glowBar(bx, y, Math.max(8, maxW * val), 38, col, { glow: 9, radius: 8 }),
          txt(valText, bx + maxW + 32, y, 34, col, 'mono', 'left'),
        );
      });
      nodes.push(
        txt(
          'F1 = 0.0198 refuses to hide 99 missed reviews behind 1 pure review',
          0,
          345,
          30,
          COSMOS.ink,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Equivalent count form 2TP / (2TP + FP + FN) & zero-division discipline
  const view2 = guardedDynamic(
    () => fadeIn(s2P.value),
    (vis) => {
      const cn = cntP.value;
      return group(
        txt('DIRECT CONFUSION-COUNT FORM', 0, -195, 28, ROLE.score, 'mono'),
        glowTex('F_1 = \\frac{2\\,TP}{2\\,TP + FP + FN}', {
          x: 0,
          y: -45,
          size: 58,
          color: cn > 0.2 ? ROLE.good : ROLE.score,
        }),
        txt(
          'TP = 1,  FP = 0,  FN = 99   →   2 / (2 + 0 + 99) = 2 / 101 ≈ 0.0198',
          0,
          125,
          30,
          ROLE.threshold,
          'mono',
        ),
        txt(
          'Keep zero-division conventions and raw class + queue counts visible',
          0,
          245,
          30,
          COSMOS.muted,
          'sans',
        ),
      ).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'lr-harmonic-mean-step-0', s0P, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-harmonic-formula', fmlP, 1, { dur: 0.8 });
  cueTo(s, c, 'lr-harmonic-mean-step-1', s1P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-harmonic-answer', ansP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'lr-harmonic-mean-step-2', s2P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-harmonic-counts', cntP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 17. capacity: Which review queue can we staff?
// Cues: policy-queues, policy-middle, policy-low, choose-feasible*,
//       fifth-seat, final-replay, five-seat-cut*, sixth-seat, six-seat-trial, six-seat-cut*
// ---------------------------------------------------------------------------
export function capacityScene(s, c) {
  const q0P = s.value(0);
  const midP = s.value(0);
  const lowP = s.value(0);
  const ch4P = s.value(0);
  const seat5P = s.value(0);
  const rep5P = s.value(0);
  const ch5P = s.value(0);
  const seat6P = s.value(0);
  const tri6P = s.value(0);
  const ch6P = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.threshold, seed: 17 }));
  s.add(decorAura(0, 10, 560, '#ffd1661b', '#ff6b8b14'));

  const headline = heroTitle(['Staffing the', 'Review Queue'], {
    x: -855,
    y: -440,
    size: 48,
    lineHeight: 56,
    accent: ROLE.threshold,
    eyebrow: 'CAPACITY CONSTRAINTS ON THE 8 VALIDATION CASES',
  });

  const live = dynamic(() => {
    const mP = smooth(midP.value);
    const lP = smooth(lowP.value);
    const c4 = ch4P.value;
    const s5 = seat5P.value;
    const r5 = smooth(rep5P.value);
    const c5 = ch5P.value;
    const s6 = seat6P.value;
    const t6 = smooth(tri6P.value);
    const c6 = ch6P.value;

    // Determine active seats (4 -> 5 -> 6) and active threshold cut
    const seats = s6 > 0.5 ? 6 : s5 > 0.5 ? 5 : 4;
    let activeCut = 0.8;
    if (t6 > 0.01) activeCut = mix(0.5, 0.2, t6);
    else if (c5 > 0.5) activeCut = 0.5;
    else if (r5 > 0.01) activeCut = mix(0.5, 0.2, r5);
    else if (c4 > 0.5) activeCut = 0.5;
    else if (lP > 0.01) activeCut = mix(0.5, 0.2, lP);
    else if (mP > 0.01) activeCut = mix(0.8, 0.5, mP);

    const nodes = [];
    nodes.push(
      txt(`ACTIVE CUT  t = ${activeCut.toFixed(2)}`, 540, -395, 34, ROLE.threshold, 'mono').glow(
        8,
        ROLE.threshold,
      ),
      txt(`${seats} REVIEW SLOTS AVAILABLE`, 540, -345, 26, ROLE.score, 'mono'),
      txt('AUTO', -845, -170, 26, COSMOS.muted, 'mono', 'left'),
      txt('REVIEW', -845, 18, 26, ROLE.threshold, 'mono', 'left'),
      txt('COST', -845, 148, 26, COSMOS.muted, 'mono', 'left'),
    );

    // Draw available slot outlines on the Review row
    const colX = (i) => -635 + i * 204;
    for (let i = 0; i < seats; i++) {
      nodes.push(
        rect(178, 146, { fill: '#0b1224', stroke: ROLE.threshold, width: 2.2, radius: 12 })
          .at(colX(i), 18)
          .opacity(0.9),
      );
    }

    // 8 sorted validation files moving between Automatic (y=-170) and Review (y=18)
    SORTED_VAL.forEach((v, i) => {
      const cx = colX(i);
      // Smooth vertical interpolation as activeCut crosses v.p
      const depth = smooth(Math.max(0, Math.min(1, (v.p - activeCut + 0.05) / 0.1)));
      const cy = mix(-170, 18, depth);
      const col = v.label ? ROLE.positive : ROLE.negative;
      const inRev = depth > 0.5;
      const overflow = depth > 0.96 && i >= seats;
      const errCost = inRev ? (v.label ? 0 : 18) : v.label ? 120 : 0;

      nodes.push(
        rect(158, 126, {
          fill: '#121b33',
          stroke: overflow ? ROLE.positive : col,
          width: overflow ? 3.5 : 2.2,
          radius: 10,
        })
          .at(cx, cy)
          .glow(overflow ? 10 : 4, overflow ? ROLE.positive : col),
        txt(v.id, cx, cy - 36, 26, col, 'mono'),
        txt(v.p.toFixed(3), cx, cy, 30, COSMOS.ink, 'mono'),
        txt(v.label ? 'Req' : 'Rout', cx, cy + 36, 26, col, 'sans'),
        txt(`$${errCost}`, cx, 148, 30, errCost > 0 ? ROLE.warn : COSMOS.dim, 'mono'),
      );
      if (overflow) {
        nodes.push(txt('NO SLOT', cx, -82, 26, ROLE.positive, 'mono'));
      }
    });

    // Bottom 3-policy ledger (0.80, 0.50, 0.20)
    const selectedCut = c6 > 0.5 ? 0.2 : c5 > 0.5 ? 0.5 : c4 > 0.5 ? 0.5 : null;
    const knownMask = [q0P.value > 0.1, mP > 0.85, lP > 0.85];
    nodes.push(line([-820, 200], [820, 200], { stroke: '#2c3d63', width: 2 }));
    policies.forEach((pol, i) => {
      const lx = -540 + i * 540;
      const isChosen = selectedCut === pol.threshold;
      const col = isChosen ? ROLE.good : COSMOS.muted;
      nodes.push(
        txt(`Cut ${pol.threshold.toFixed(2)}`, lx, 245, 28, col, 'mono'),
        txt(
          knownMask[i] ? `${pol.queue} reviews  ·  $${pol.cost}` : 'Pending',
          lx,
          292,
          32,
          isChosen ? ROLE.good : COSMOS.ink,
          'mono',
        ),
      );
    });

    // Bottom prompt / strictly-withheld decision banner
    let footer = 'Compare each cut against our 4-slot desk';
    if (lP > 0.85 && c4 < 0.5) footer = 'Lowest bill using at most 4 slots?';
    if (c4 > 0.5 && s5 < 0.5) footer = '4 slots → Choose cut 0.50 ($138, 4 reviews)';
    if (s5 > 0.5 && c5 < 0.5) footer = 'With 5 slots, can cut 0.20 fit all 6 files?';
    if (c5 > 0.5 && s6 < 0.5) footer = '5 slots → Keep cut 0.50 (V8 still needs slot 6)';
    if (s6 > 0.5 && c6 < 0.5) footer = 'Open slot 6 and test cut 0.20...';
    if (c6 > 0.5) footer = '6 slots → Cut 0.20 now fits ($36, saving $102)';

    nodes.push(txt(footer, 0, 378, 34, selectedCut !== null ? ROLE.good : ROLE.threshold, 'serif'));

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'policy-queues', q0P, 1, { dur: 0.7 });
  cueTo(s, c, 'policy-middle', midP, 1, { dur: 0.9 });
  cueTo(s, c, 'policy-low', lowP, 1, { dur: 0.9 });
  cueTo(s, c, 'choose-feasible', ch4P, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'fifth-seat', seat5P, 1, { dur: 0.7 });
  cueTo(s, c, 'final-replay', rep5P, 1, { dur: 0.9 });
  cueTo(s, c, 'five-seat-cut', ch5P, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'sixth-seat', seat6P, 1, { dur: 0.7 });
  cueTo(s, c, 'six-seat-trial', tri6P, 1, { dur: 0.85 });
  cueTo(s, c, 'six-seat-cut', ch6P, 1, { after: true, dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 18. calibrated-cost: Which route costs less before the case closes?
// Cues: lr-expected-auto, lr-expected-review, first-risk-answer*,
//       lower-risk-probe, second-risk-answer*, find-crossing, lr-bayes-cut, lr-cost-capacity
// ---------------------------------------------------------------------------
export function calibratedCost(s, c) {
  const autoP = s.value(0);
  const revP = s.value(0);
  const ans1P = s.value(0);
  const lowP = s.value(0);
  const ans2P = s.value(0);
  const crossP = s.value(0);
  const cutP = s.value(0);
  const capP = s.value(0);
  const drift = s.value(0);

  const breakEven = probabilityCost(0.2).cut; // 18/138 ≈ 0.13043

  s.add(cinemaGrid({ accent: ROLE.threshold, seed: 18 }));
  s.add(decorAura(-150, 0, 560, '#ffd1661c', '#60a5fa14'));

  const headline = heroTitle(['Expected Error Cost', '& Bayes Break-Even Cut'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.threshold,
    eyebrow: 'CALIBRATED PROBABILITY DECISION RULE',
  });

  const ax = makeAxes({
    x0: -790,
    y0: -210,
    w: 940,
    h: 465,
    xDom: [0, 0.3],
    yDom: [0, 40],
    xTicks: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3],
    yTicks: [0, 10, 20, 30, 40],
    xLabel: 'calibrated probability p',
    yLabel: 'expected cost ($)',
  });

  const live = dynamic(() => {
    const au = smooth(autoP.value);
    const rv = smooth(revP.value);
    const a1 = ans1P.value;
    const lw = smooth(lowP.value);
    const a2 = ans2P.value;
    const cr = smooth(crossP.value);
    const ct = cutP.value;
    const cp = capP.value;

    const pNow = cr > 0.01 ? mix(0.05, breakEven, cr) : mix(0.2, 0.05, lw);
    const curCost = probabilityCost(pNow);
    const nodes = [ax.node];

    // Automatic expected cost line: 120 * p
    if (au > 0.02) {
      const endX = 0.3 * au;
      nodes.push(
        neonCurve([ax.pt(0, 0), ax.pt(endX, 120 * endX)], [ROLE.positive, ROLE.warn], {
          width: 4.5,
          glow: 10,
        }),
      );
    }

    // Review expected cost line: 18 * (1 - p)
    if (rv > 0.02) {
      const endX = 0.3 * rv;
      nodes.push(
        neonCurve([ax.pt(0, 18), ax.pt(endX, 18 * (1 - endX))], [ROLE.negative, ROLE.score], {
          width: 4.5,
          glow: 10,
        }),
      );
    }

    // Vertical probe line at pNow (readout pinned right-aligned so it never overlaps yLabel)
    const footX = ax.px(pNow);
    nodes.push(
      line([footX, ax.py(0)], [footX, ax.py(40)], {
        stroke: ROLE.threshold,
        width: 2.5,
        dash: [6, 6],
      }),
      txt(
        `Probe p = ${pNow.toFixed(cr > 0.5 ? 3 : 2)}`,
        150,
        -238,
        28,
        ROLE.threshold,
        'mono',
        'right',
      ),
    );
    if (au > 0.8) {
      nodes.push(glowDot(...ax.pt(pNow, curCost.automatic), { radius: 11, color: ROLE.positive }));
    }
    if (rv > 0.8) {
      nodes.push(
        glowDot(...ax.pt(pNow, curCost.review), {
          radius: 11,
          color: cr > 0.85 ? ROLE.threshold : ROLE.negative,
        }),
      );
    }

    // Right column: route prices crossfades cleanly to 8-request capacity check on beat 5
    const preCap = fadeOut(cp);
    const postCap = fadeIn(cp);
    const rx = 510;
    if (preCap > 0.02) {
      nodes.push(
        group(
          txt('AUTOMATIC:  $120 × p', rx, -195, 28, ROLE.positive, 'mono'),
          txt(
            au > 0.8 ? `$${curCost.automatic.toFixed(2)}` : '$ ?',
            rx,
            -120,
            56,
            ROLE.positive,
            'mono',
          ).glow(8, ROLE.positive),
          rule(260, -40, 760, -40, '#2a3759', 2),
          txt('REVIEW:  $18 × (1 − p)', rx, 20, 28, ROLE.negative, 'mono'),
          txt(
            rv > 0.8 ? `$${curCost.review.toFixed(2)}` : '$ ?',
            rx,
            95,
            56,
            ROLE.negative,
            'mono',
          ).glow(8, ROLE.negative),
          ct > 0.4
            ? glowTex('p^* = \\frac{18}{18 + 120} \\approx 0.130', {
                x: rx,
                y: 215,
                size: 38,
                color: ROLE.threshold,
              }).opacity(ct)
            : group(),
        ).opacity(preCap),
      );
    }
    if (postCap > 0.02) {
      const qual = validationScores.filter((v) => v.p >= breakEven).length;
      nodes.push(
        group(
          txt('BAYES CUT ON VALIDATION', rx, -205, 26, ROLE.threshold, 'mono'),
          ...SORTED_VAL.map((v, i) => {
            const gx = 320 + (i % 2) * 340;
            const gy = -115 + Math.floor(i / 2) * 86;
            const q = v.p >= breakEven;
            const col = q ? ROLE.threshold : COSMOS.dim;
            return group(
              dot(9, col)
                .at(gx - 95, gy)
                .glow(q ? 8 : 0, col),
              txt(`${v.id}: ${v.p.toFixed(3)}`, gx + 15, gy, 28, col, 'mono'),
            );
          }),
          txt(`${qual} qualify · only 4 slots`, rx, 240, 32, ROLE.positive, 'mono'),
        ).opacity(postCap),
      );
    }

    // Bottom status strictly withholding answers until caption_boundary cues finish (contiguous, zero flicker)
    let note = 'Compare expected bills before the case closes';
    if (cp > 0.5) note = 'Individual Bayes cut can still overflow a 4-slot review queue';
    else if (ct > 0.5) note = 'Break-even p* = 18 / 138 ≈ 0.130';
    else if (cr > 0.05) note = 'Crossing: $120 p = $18 (1 − p)';
    else if (a2 > 0.5) note = 'Choose automatic handling at p = 0.05 ($6.00 < $17.10)';
    else if (lw > 0.05) note = 'At p = 0.05 ($6.00 vs $17.10), which route now?';
    else if (a1 > 0.5) note = 'Choose human review at p = 0.20 ($14.40 < $24.00)';
    else if (rv > 0.5) note = 'At p = 0.20 ($24.00 vs $14.40), which route costs less?';

    nodes.push(txt(note, 0, 375, 32, ROLE.threshold, 'serif'));

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'lr-expected-auto', autoP, 1, { dur: 0.9 });
  cueTo(s, c, 'lr-expected-review', revP, 1, { dur: 0.9 });
  cueTo(s, c, 'first-risk-answer', ans1P, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'lower-risk-probe', lowP, 1, { dur: 0.9 });
  cueTo(s, c, 'second-risk-answer', ans2P, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'find-crossing', crossP, 1, { dur: 0.9 });
  cueTo(s, c, 'lr-bayes-cut', cutP, 1, { dur: 0.8 });
  cueTo(s, c, 'lr-cost-capacity', capP, 1, { dur: 0.8 });
}
