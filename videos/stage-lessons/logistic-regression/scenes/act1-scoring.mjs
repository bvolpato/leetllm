// Act 1 (Scenes 1-5): Intro (Routing by Score), Evidence Score (Logit Sum),
// Sigmoid Saturation & 3D Manifold, Boundary Geometry, and Log-Loss Stability.
import {
  arrow,
  circle,
  curve3d,
  dot,
  dynamic,
  gridPlane3d,
  group,
  line,
  point3d,
  surface,
} from 'vizmatic/stage';
import {
  COSMOS,
  FITTED_OPENING_LOGIT,
  ROLE,
  boundaryGeometry,
  cinemaGrid,
  cinematic3d,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  fittedWeights,
  glowBar,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  livingDrift,
  makeAxes,
  mix,
  neonCurve,
  openingRequest,
  orbitScene,
  roundedScore,
  rule,
  sampleCurve,
  scaleTrack,
  sigmoid,
  smooth,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 1. intro: Routing by score
// Cues: opening-score, opening-auto*, opening-proposal, opening-choice, opening-review*
// ---------------------------------------------------------------------------
export function intro(s, c) {
  const dropP = s.value(0);
  const autoP = s.value(0);
  const propP = s.value(0);
  const moveP = s.value(0);
  const revP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.score, seed: 1 }));
  s.add(decorAura(180, -30, 560, '#5ce1e622', '#ffd16612'));

  const headline = heroTitle(['Routing', 'by Score'], {
    x: -855,
    y: -430,
    size: 58,
    lineHeight: 68,
    accent: ROLE.score,
    eyebrow: 'ACCESS REQUEST · REQ-10234',
  });

  const live = dynamic(() => {
    const dp = dropP.value;
    const au = autoP.value;
    const pr = propP.value;
    const mv = moveP.value;
    const rv = revP.value;
    const ph = drift.value;
    const nodes = [];

    const rx0 = -760;
    const rx1 = 760;
    const ry = 80;
    const xOf = (p) => mix(rx0, rx1, p);
    const cut = mix(0.8, 0.5, smooth(mv));
    const cutX = xOf(cut);
    const scoreX = xOf(openingRequest.p);

    // Probability ruler track with glowing review zone above cut
    nodes.push(
      txt('AUTOMATIC HANDLING', rx0, ry - 52, 26, ROLE.negative, 'mono', 'left'),
      txt('HUMAN REVIEW', rx1, ry - 52, 26, ROLE.threshold, 'mono', 'right'),
      line([rx0, ry], [cutX, ry], { stroke: ROLE.negative, width: 10 }).opacity(0.65),
      line([cutX, ry], [rx1, ry], { stroke: ROLE.threshold, width: 12 }).glow(10, ROLE.threshold),
      txt('0.0', rx0, ry + 54, 28, COSMOS.muted, 'mono'),
      txt('0.5', xOf(0.5), ry + 54, 28, COSMOS.muted, 'mono'),
      txt('1.0', rx1, ry + 54, 28, COSMOS.muted, 'mono'),
    );

    // Proposed cut ghost marker when proposing 0.50 before moving
    if (pr > 0.05 && mv < 0.05) {
      const gx = xOf(0.5);
      nodes.push(
        line([gx, ry - 26], [gx, ry + 26], {
          stroke: ROLE.threshold,
          width: 3,
          dash: [6, 6],
        }).opacity(0.7 * pr),
        txt('Try cut 0.50 ?', gx, ry + 106, 30, ROLE.threshold, 'mono').opacity(pr),
      );
    }

    // Active threshold marker
    nodes.push(
      line([cutX, ry - 24], [cutX, ry + 34], { stroke: ROLE.threshold, width: 5 }).glow(
        8,
        ROLE.threshold,
      ),
      glowDot(cutX, ry, { radius: 9, color: ROLE.threshold, glow: 12 }),
      txt(`Cut ${cut.toFixed(2)}`, cutX, ry + 106, 34, ROLE.threshold, 'mono').glow(
        6,
        ROLE.threshold,
      ),
    );

    // Dropping glowing request orb pinned at score 0.624
    const dropY = mix(-225, ry, smooth(dp));
    const pulse = 1 + 0.09 * Math.sin(ph * Math.PI * 8);
    nodes.push(
      line([scoreX, dropY - 96], [scoreX, dropY], { stroke: ROLE.score, width: 3.5 }).glow(
        8,
        ROLE.score,
      ),
      glowDot(scoreX, dropY, { radius: 14 * pulse, color: ROLE.score, glow: 16 }),
      txt('Change team access', scoreX, dropY - 224, 30, COSMOS.muted, 'sans'),
      txt(openingRequest.p.toFixed(3), scoreX, dropY - 160, 58, ROLE.score, 'mono').glow(
        10,
        ROLE.score,
      ),
    );

    // Decision readout row below ruler (strictly withheld until caption_boundary cues finish)
    const baseY = 285;
    const preAuto = fadeOut(au);
    if (preAuto > 0.02) {
      nodes.push(
        txt(
          'At cut 0.80, which route handles 0.624?',
          0,
          baseY + 30,
          38,
          COSMOS.muted,
          'serif',
        ).opacity(preAuto),
      );
    }

    const postAuto = fadeIn(au);
    if (postAuto > 0.02) {
      const leftX = mix(0, -340, smooth(pr));
      nodes.push(
        group(
          txt('AT CUT 0.80', leftX, baseY - 22, 26, COSMOS.muted, 'mono'),
          txt('Automatic', leftX, baseY + 42, 48, ROLE.negative, 'serif').glow(8, ROLE.negative),
        ).opacity(postAuto),
      );
    }

    if (pr > 0.05) {
      const preRev = fadeOut(rv);
      const postRev = fadeIn(rv);
      nodes.push(txt('AT CUT 0.50', 340, baseY - 22, 26, ROLE.threshold, 'mono').opacity(pr));
      if (preRev > 0.02) {
        nodes.push(
          txt('Which route?', 340, baseY + 42, 46, COSMOS.ink, 'serif').opacity(pr * preRev),
        );
      }
      if (postRev > 0.02) {
        nodes.push(
          txt('Human review', 340, baseY + 42, 48, ROLE.threshold, 'serif')
            .glow(10, ROLE.threshold)
            .opacity(postRev),
        );
      }
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'opening-score', dropP, 1, { dur: 0.9 });
  cueTo(s, c, 'opening-auto', autoP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'opening-proposal', propP, 1, { dur: 0.7 });
  cueTo(s, c, 'opening-choice', moveP, 1, { dur: 0.9 });
  cueTo(s, c, 'opening-review', revP, 1, { after: true, dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 2. evidence-score: Where did the score come from?
// Cues: score-intercept, score-ambiguity, score-support, score-total*
// ---------------------------------------------------------------------------
export function evidenceScore(s, c) {
  const intP = s.value(0);
  const ambP = s.value(0);
  const supP = s.value(0);
  const totP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.loss, seed: 2 }));
  s.add(decorAura(0, 40, 560, '#a78bfa20', '#5ce1e614'));

  const headline = heroTitle(['Signed Contributions', 'Build the Logit'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.score,
    eyebrow: 'AMBIGUITY = 3  ·  POLICY SUPPORT = 5',
  });

  const live = dynamic(() => {
    const iP = smooth(intP.value);
    const aP = smooth(ambP.value);
    const sP = smooth(supP.value);
    const tP = totP.value;
    const ph = drift.value;
    const nodes = [];

    const x0 = -740;
    const x1 = 760;
    const xOf = (z) => mix(x0, x1, (z + 6) / 13);

    // Common logit number line from -6 to +7
    const axisY = 170;
    nodes.push(
      line([x0, axisY], [x1, axisY], { stroke: '#4d6499', width: 3 }),
      line([xOf(0), -180], [xOf(0), axisY], {
        stroke: '#5b72a8',
        width: 2,
        dash: [8, 8],
      }),
    );
    for (const tick of [-6, -4, -2, 0, 2, 4, 6]) {
      const gx = xOf(tick);
      nodes.push(
        line([gx, axisY - 8], [gx, axisY + 8], { stroke: '#6c85bf', width: 2.2 }),
        txt(String(tick), gx, axisY + 42, 28, tick === 0 ? COSMOS.ink : COSMOS.muted, 'mono'),
      );
    }
    nodes.push(txt('Signed logit z', (x0 + x1) / 2, axisY + 84, 28, COSMOS.muted, 'sans'));

    // Row 1: Intercept 0 -> -4.9
    const r1Y = -125;
    const z1 = -4.9 * iP;
    nodes.push(
      txt('Intercept  b', -855, r1Y, 28, ROLE.loss, 'mono', 'left'),
      line([xOf(0), r1Y], [xOf(z1), r1Y], { stroke: ROLE.loss, width: 10 }).glow(8, ROLE.loss),
      glowDot(xOf(z1), r1Y, { radius: 9, color: ROLE.loss, glow: 12 }),
      iP > 0.25
        ? txt('−4.9', xOf(-2.45), r1Y - 40, 32, ROLE.loss, 'mono').opacity(iP)
        : txt('starts at 0', xOf(0) + 95, r1Y - 38, 26, COSMOS.dim, 'mono'),
    );

    // Vertical guide down from -4.9 to row 2
    const r2Y = -10;
    if (aP > 0.02) {
      const z2 = -4.9 + 10.2 * aP;
      nodes.push(
        line([xOf(-4.9), r1Y + 12], [xOf(-4.9), r2Y - 12], {
          stroke: '#506496',
          width: 2,
          dash: [5, 5],
        }).opacity(aP),
        txt('3 × (+3.4)', -855, r2Y, 28, ROLE.positive, 'mono', 'left').opacity(aP),
        line([xOf(-4.9), r2Y], [xOf(z2), r2Y], { stroke: ROLE.positive, width: 10 }).glow(
          10,
          ROLE.positive,
        ),
        glowDot(xOf(z2), r2Y, { radius: 10, color: ROLE.positive, glow: 12 }),
        aP > 0.35
          ? txt('+10.2  (→ +5.3)', xOf(0.2), r2Y - 40, 32, ROLE.positive, 'mono').opacity(aP)
          : group(),
      );
    } else {
      nodes.push(txt('Ambiguity: 3 × (+3.4)', -855, r2Y, 28, COSMOS.dim, 'mono', 'left'));
    }

    // Vertical guide down from +5.3 to row 3
    const r3Y = 95;
    if (sP > 0.02) {
      const z3 = 5.3 - 4.8 * sP;
      nodes.push(
        line([xOf(5.3), r2Y + 12], [xOf(5.3), r3Y - 12], {
          stroke: '#506496',
          width: 2,
          dash: [5, 5],
        }).opacity(sP),
        txt('5 × (−0.96)', -855, r3Y, 28, ROLE.negative, 'mono', 'left').opacity(sP),
        line([xOf(5.3), r3Y], [xOf(z3), r3Y], { stroke: ROLE.negative, width: 10 }).glow(
          10,
          ROLE.negative,
        ),
        glowDot(xOf(z3), r3Y, { radius: 10, color: ROLE.negative, glow: 12 }),
        sP > 0.35
          ? txt('−4.8', xOf(2.9), r3Y - 40, 32, ROLE.negative, 'mono').opacity(sP)
          : group(),
      );
    } else {
      nodes.push(txt('Support: 5 × (−0.96)', -855, r3Y, 28, COSMOS.dim, 'mono', 'left'));
    }

    // Final total strictly withheld until score-total completes
    const preTot = fadeOut(tP);
    const postTot = fadeIn(tP);
    const pulse = 1 + 0.1 * Math.sin(ph * Math.PI * 8);
    if (preTot > 0.02) {
      nodes.push(
        txt('z = −4.9 + 10.2 − 4.8 = ?', 0, 335, 44, COSMOS.muted, 'mono').opacity(preTot),
      );
    }
    if (postTot > 0.02) {
      nodes.push(
        group(
          line([xOf(roundedScore), r3Y + 12], [xOf(roundedScore), axisY], {
            stroke: ROLE.threshold,
            width: 3.5,
          }).glow(8, ROLE.threshold),
          glowDot(xOf(roundedScore), axisY, {
            radius: 13 * pulse,
            color: ROLE.threshold,
            glow: 16,
          }),
          glowTex('z = -4.9 + 10.2 - 4.8 = +0.50', {
            x: 0,
            y: 345,
            size: 46,
            color: ROLE.threshold,
          }),
        ).opacity(postTot),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'score-intercept', intP, 1, { dur: 0.85 });
  cueTo(s, c, 'score-ambiguity', ambP, 1, { dur: 0.95 });
  cueTo(s, c, 'score-support', supP, 1, { dur: 0.95 });
  cueTo(s, c, 'score-total', totP, 1, { after: true, dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 3. sigmoid: The same score step can have a different effect
// Cues: sigmoid-center, sigmoid-tail, request-probability, full-fit-score, logit-definition
// ---------------------------------------------------------------------------
export function sigmoidScene(s, c) {
  const centerP = s.value(0);
  const tailP = s.value(0);
  const reqP = s.value(0);
  const fullP = s.value(0);
  const logitP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.score, seed: 3 }));
  s.add(decorAura(-220, 10, 560, '#5ce1e61f', '#ffd16614'));

  const headline = heroTitle(['Steep at Zero,', 'Flat in the Tails'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.score,
    eyebrow: 'THE SIGMOID MAP  σ(z)',
  });

  const ax = makeAxes({
    x0: -810,
    y0: -230,
    w: 980,
    h: 490,
    xDom: [-6, 7],
    yDom: [0, 1.05],
    xTicks: [-4, -1, 0, 1, 4, 6],
    yTicks: [0, 0.5, 1],
    xLabel: 'logit z',
    yLabel: 'probability p',
  });
  const sigPts = sampleCurve(ax, sigmoid, -6, 7, 140);

  const live = dynamic(() => {
    const cp = smooth(centerP.value);
    const tp = smooth(tailP.value);
    const rp = smooth(reqP.value);
    const fp = fullP.value;
    const lp = logitP.value;
    const ph = drift.value;
    const nodes = [];

    nodes.push(
      ax.node,
      // Horizontal reference line at p = 0.5
      line(ax.pt(-6, 0.5), ax.pt(7, 0.5), { stroke: '#32456e', width: 1.6, dash: [8, 8] }),
      // Glowing sigmoid S-curve
      neonCurve(sigPts, [ROLE.negative, ROLE.score, ROLE.positive], { width: 5, glow: 12 }),
    );

    // Center probe: z from -1 to +1
    const zc = mix(-1, 1, cp);
    const cFrom = ax.pt(-1, sigmoid(-1));
    const cCorner = ax.pt(zc, sigmoid(-1));
    const cTo = ax.pt(zc, sigmoid(zc));
    nodes.push(
      line(cFrom, cCorner, { stroke: ROLE.threshold, width: 3.5 }),
      line(cCorner, cTo, { stroke: ROLE.threshold, width: 4.5 }).glow(8, ROLE.threshold),
      glowDot(cTo[0], cTo[1], { radius: 10, color: ROLE.threshold, glow: 14 }),
    );
    if (cp > 0.92) {
      nodes.push(
        txt('+0.462', cTo[0] + 76, cCorner[1] + 28, 28, ROLE.threshold, 'mono').glow(
          6,
          ROLE.threshold,
        ),
      );
    }

    // Tail probe: z from 4 to 6
    const zt = mix(4, 6, tp);
    const tFrom = ax.pt(4, sigmoid(4));
    const tCorner = ax.pt(zt, sigmoid(4));
    const tTo = ax.pt(zt, sigmoid(zt));
    nodes.push(
      line(tFrom, tCorner, { stroke: ROLE.positive, width: 3.5 }),
      line(tCorner, tTo, { stroke: ROLE.positive, width: 4.5 }).glow(8, ROLE.positive),
      glowDot(tTo[0], tTo[1], { radius: 10, color: ROLE.positive, glow: 14 }),
    );
    if (tp > 0.92) {
      nodes.push(
        txt('+0.016', tTo[0] + 15, tTo[1] - 34, 28, ROLE.positive, 'mono').glow(6, ROLE.positive),
      );
    }

    // Request point on curve (rounded 0.500 -> full fit 0.506)
    const activeZ = mix(roundedScore, FITTED_OPENING_LOGIT, smooth(fp));
    const reqPt = ax.pt(activeZ, sigmoid(activeZ));
    if (rp > 0.04) {
      const pulse = 1 + 0.1 * Math.sin(ph * Math.PI * 8);
      nodes.push(
        line(ax.pt(activeZ, 0), reqPt, { stroke: ROLE.score, width: 2.5, dash: [6, 6] }).opacity(
          rp,
        ),
        glowDot(reqPt[0], reqPt[1], { radius: 12 * pulse, color: ROLE.score, glow: 16 }).opacity(
          rp,
        ),
      );
    }

    // Right column readouts (x = 240..840, clean vertical rhythm)
    const rx = 250;
    nodes.push(
      txt('EQUAL STEP: Δz = 2', rx, -225, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        cp > 0.9 ? 'Center [−1, 1]:  Δp = +0.462' : 'Center [−1, 1]:  Δp = ?',
        rx,
        -165,
        30,
        ROLE.threshold,
        'mono',
        'left',
      ),
      txt(
        tp > 0.9 ? 'Tail [+4, +6]:  Δp = +0.016' : 'Tail [+4, +6]:  Δp = ?',
        rx,
        -105,
        30,
        ROLE.positive,
        'mono',
        'left',
      ),
      txt('Max slope at z = 0:  σ′(0) = 0.25', rx, -45, 26, COSMOS.muted, 'mono', 'left'),
      rule(rx, 8, 845, 8, '#263457', 2),
      txt('ROUNDED WEIGHTS', rx, 56, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        rp > 0.85 ? `σ(0.500) ≈ ${sigmoid(roundedScore).toFixed(3)}` : 'σ(0.500) = ?',
        rx,
        106,
        36,
        ROLE.score,
        'mono',
        'left',
      ),
      txt('FULL FIT WEIGHTS', rx, 184, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        fp > 0.85
          ? `σ(${FITTED_OPENING_LOGIT.toFixed(3)}) ≈ ${openingRequest.p.toFixed(3)}`
          : 'Full fit score = ?',
        rx,
        234,
        36,
        ROLE.good,
        'mono',
        'left',
      ),
    );

    // Bottom formula crossfades cleanly from sigmoid to log-odds definition
    const preLogit = fadeOut(lp);
    const postLogit = fadeIn(lp);
    if (preLogit > 0.02) {
      nodes.push(
        glowTex('p = \\sigma(z) = \\frac{1}{1 + e^{-z}}', {
          x: 0,
          y: 390,
          size: 44,
          color: ROLE.score,
        }).opacity(preLogit),
      );
    }
    if (postLogit > 0.02) {
      nodes.push(
        glowTex(
          'z = \\ln\\!\\left(\\frac{p}{1 - p}\\right) \\qquad (+1\\text{ logit} \\Rightarrow \\times e\\text{ odds})',
          {
            x: 0,
            y: 390,
            size: 40,
            color: ROLE.threshold,
          },
        ).opacity(postLogit),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'sigmoid-center', centerP, 1, { dur: 0.95 });
  cueTo(s, c, 'sigmoid-tail', tailP, 1, { dur: 0.9 });
  cueTo(s, c, 'request-probability', reqP, 1, { dur: 0.85 });
  cueTo(s, c, 'full-fit-score', fullP, 1, { dur: 0.7 });
  cueTo(s, c, 'logit-definition', logitP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 4. boundary-geometry: Measure the score in the feature plane (+ 3D sigmoid manifold)
// Cues: lr-boundary-geometry-step-0, lr-boundary-geometry-step-1, lr-boundary-normal,
//       lr-boundary-distance, lr-boundary-geometry-step-2, lr-boundary-level,
//       lr-boundary-vertical, lr-boundary-vertical-only, lr-boundary-constant
// ---------------------------------------------------------------------------
export function boundaryGeometryScene(s, c) {
  const step0P = s.value(0);
  const step1P = s.value(0);
  const normP = s.value(0);
  const distP = s.value(0);
  const step2P = s.value(0);
  const levelP = s.value(0);
  const vertP = s.value(0);
  const vertOnlyP = s.value(0);
  const constP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.score, seed: 4 }));
  s.add(decorAura(340, -10, 520, '#5ce1e61c', '#ff6b8b14'));

  const headline = heroTitle(['Linear Log-Odds', 'in the Feature Plane'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.score,
    eyebrow: 'NORMAL VECTOR β  &  ORTHOGONAL DISTANCE',
  });

  // 3D Sigmoid Decision Manifold shown in Beat 0 on the right side
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.05,
    distance: 15.6,
    unit: 84,
    focus: [0, 0, 0.8],
  }).at(470, -40);

  const floor3d = gridPlane3d({
    x: [-2.6, 2.6],
    y: [-2.6, 2.6],
    z: 0,
    step: 1,
    color: '#293b66',
    opacity: 0.45,
  });

  const sigSurf = surface(
    (u, v) => {
      const a = 2.75 + u * 0.85;
      const sup = 4.5 + v * 1.4;
      const z = fittedWeights[0] + fittedWeights[1] * a + fittedWeights[2] * sup;
      return sigmoid(z) * 2.4;
    },
    {
      x: [-2.6, 2.6],
      y: [-2.6, 2.6],
      resolution: [20, 20],
      colors: [ROLE.negative, ROLE.score, ROLE.positive],
      mesh: '#9bb5e8',
    },
  );
  // Equal-score contour z = 0 (p = 0.5 -> height 1.2) on the 3D sigmoid manifold
  const contour3d = curve3d(
    (t) => {
      const u = -2.2 + t * 4.4;
      const a = 2.75 + u * 0.85;
      const sup = (-fittedWeights[0] - fittedWeights[1] * a) / fittedWeights[2];
      const v = Math.max(-2.6, Math.min(2.6, (sup - 4.5) / 1.4));
      return [u, v, 1.22];
    },
    0,
    1,
    { samples: 40, color: ROLE.threshold, width: 4.5, glow: 10, blend: 'screen' },
  );
  view3d.add(floor3d, sigSurf, contour3d);

  // Beat 0: Least squares overshoot vs 3D sigmoid manifold
  const ax0 = makeAxes({
    x0: -800,
    y0: -210,
    w: 760,
    h: 430,
    xDom: [0, 5],
    yDom: [-0.5, 1.5],
    xTicks: [0, 1, 2, 3, 4, 5],
    yTicks: [-0.5, 0, 0.5, 1, 1.5],
    xLabel: 'feature x',
    yLabel: 'predicted value',
  });

  const view0 = guardedDynamic(
    () => fadeOut(step1P.value),
    (vis) => {
      const t0 = smooth(step0P.value);
      const nodes = [
        ax0.node,
        // Bounded [0, 1] probability rails
        line(ax0.pt(0, 0), ax0.pt(5, 0), { stroke: ROLE.threshold, width: 2.5, dash: [8, 8] }),
        line(ax0.pt(0, 1), ax0.pt(5, 1), { stroke: ROLE.threshold, width: 2.5, dash: [8, 8] }),
        // Unbounded linear least-squares line
        neonCurve([ax0.pt(0, -0.4), ax0.pt(5, 1.35)], [ROLE.positive, ROLE.warn], {
          width: 4.2,
          glow: 9,
        }),
        glowDot(...ax0.pt(5 * t0, 0.35 * 5 * t0 - 0.4), {
          radius: 11,
          color: ROLE.positive,
          glow: 14,
        }),
        txt('Linear fit leaves [0, 1]', -40, -238, 26, ROLE.positive, 'mono', 'right'),
        txt('3D Sigmoid Manifold  p = σ(βᵀx + b)', 470, -345, 28, ROLE.score, 'mono'),
        glowTex('\\mathrm{Var}(Y\\mid x) = p(1 - p)', {
          x: 470,
          y: 280,
          size: 38,
          color: ROLE.threshold,
        }),
        txt(
          'Squared error on bounded probabilities is the Brier loss',
          -420,
          365,
          28,
          COSMOS.muted,
          'sans',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  // Also fade out 3D view cleanly before Beat 1
  const view3dWrap = guardedDynamic(
    () => fadeOut(step1P.value),
    (vis) => view3d.opacity(vis),
  );

  // Beat 1 & Beat 2: Feature-plane boundary geometry, normal projection, threshold shift, vertical & constant cases
  const ax1 = makeAxes({
    x0: -800,
    y0: -215,
    w: 840,
    h: 455,
    xDom: [0.5, 5],
    yDom: [3.5, 5.75],
    xTicks: [1, 2, 3, 4, 5],
    yTicks: [3.5, 4.5, 5.5],
    xLabel: 'ambiguity x₁',
    yLabel: 'policy support x₂',
  });

  const view12 = guardedDynamic(
    () => fadeIn(step1P.value),
    (vis) => {
      const nm = smooth(normP.value);
      const ds = distP.value;
      const s2 = step2P.value;
      const lv = smooth(levelP.value);
      const vo = vertOnlyP.value;
      const co = constP.value;
      const isConst = co > 0.5;
      const isVert = !isConst && vo > 0.5;
      const w = isConst ? [-4.9, 0, 0] : isVert ? [-4.9, 3.4, 0] : fittedWeights;
      const tVal = mix(0.5, 0.2, lv);
      const g = boundaryGeometry(w, [3, 5], tVal);
      const nodes = [];

      if (isConst) {
        // Constant classifier plane: uniform glowing probability field
        nodes.push(
          scaleTrack(-800, 12, 840, 455, { stroke: ROLE.score, fill: '#0e1d36', radius: 14 }),
          txt('Constant Classifier:  β = [0, 0]', -380, -85, 38, ROLE.threshold, 'serif').glow(
            8,
            ROLE.threshold,
          ),
          txt('Same probability everywhere in feature space', -380, -15, 28, COSMOS.muted, 'sans'),
          txt(`p = σ(b) = ${g.probability.toFixed(4)}`, -380, 68, 48, ROLE.score, 'mono').glow(
            10,
            ROLE.score,
          ),
          txt('No nonzero normal β  ·  no separating hyperplane', -380, 155, 28, ROLE.warn, 'mono'),
        );
      } else {
        nodes.push(ax1.node);
        // Decision boundary line
        if (isVert) {
          const xx = (g.level - w[0]) / w[1];
          nodes.push(
            neonCurve([ax1.pt(xx, 3.5), ax1.pt(xx, 5.75)], [ROLE.threshold, ROLE.warn], {
              width: 5,
              glow: 12,
            }),
          );
        } else {
          const yOfX = (x) => (g.level - w[0] - w[1] * x) / w[2];
          const bPts = [];
          for (let i = 0; i <= 50; i++) {
            const x = 0.5 + (4.5 * i) / 50;
            const y = yOfX(x);
            if (y >= 3.5 && y <= 5.75) bPts.push(ax1.pt(x, y));
          }
          if (bPts.length >= 2) {
            nodes.push(neonCurve(bPts, [ROLE.threshold, ROLE.warn], { width: 5, glow: 12 }));
          }
        }

        // Request point (3, 5) and orthogonal projection
        const pReq = ax1.pt(3, 5);
        const pProj = ax1.pt(g.projection[0], g.projection[1]);
        const curEnd = [mix(pProj[0], pReq[0], nm), mix(pProj[1], pReq[1], nm)];
        nodes.push(
          line(pProj, curEnd, { stroke: ROLE.score, width: 4.5 }).glow(8, ROLE.score),
          glowDot(pProj[0], pProj[1], { radius: 8, color: ROLE.threshold, glow: 10 }),
          glowDot(pReq[0], pReq[1], { radius: 12, color: ROLE.score, glow: 16 }),
          txt('REQ (3, 5)', pReq[0] + 95, pReq[1] - 32, 26, ROLE.score, 'mono'),
        );
        // Unit normal arrow beta / ||beta||
        const ux = g.beta[0] / g.norm;
        const uy = g.beta[1] / g.norm;
        const pNorm = ax1.pt(g.projection[0] + ux * 0.75, g.projection[1] + uy * 0.75);
        nodes.push(
          arrow(pProj, pNorm, { stroke: ROLE.positive, width: 4.5 }).glow(8, ROLE.positive),
          txt('β', pNorm[0], pNorm[1] + 40, 32, ROLE.positive, 'serif'),
        );
      }

      // Right column equations & dynamic distance telemetry
      const rx = 470;
      nodes.push(
        txt(
          isConst
            ? 'DEGENERATE CASE: β = 0'
            : isVert
              ? 'VERTICAL BOUNDARY: β₂ = 0'
              : `THRESHOLD  t = ${tVal.toFixed(2)}`,
          rx,
          -240,
          28,
          ROLE.threshold,
          'mono',
        ),
        glowTex('\\|\\beta\\| = \\sqrt{\\beta_1^2 + \\beta_2^2}', {
          x: rx,
          y: -145,
          size: 38,
          color: ROLE.positive,
        }),
        glowTex('d = \\frac{z - \\operatorname{logit}(t)}{\\|\\beta\\|}', {
          x: rx,
          y: -15,
          size: 42,
          color: ROLE.score,
        }),
        txt(
          isConst
            ? '‖β‖ = 0  (distance undefined)'
            : ds > 0.7 || s2 > 0.2
              ? `Signed distance d = ${g.distance.toFixed(3)}`
              : 'Project onto equal-score line',
          rx,
          105,
          30,
          isConst ? ROLE.warn : ROLE.score,
          'mono',
        ),
      );

      // Bottom formula switches cleanly on Beat 2
      const preS2 = fadeOut(s2);
      const postS2 = fadeIn(s2);
      if (preS2 > 0.02) {
        nodes.push(
          txt(
            'Intercept b stays separate from the feature normal β',
            0,
            375,
            30,
            COSMOS.muted,
            'sans',
          ).opacity(preS2),
        );
      }
      if (postS2 > 0.02) {
        nodes.push(
          glowTex(
            '\\operatorname{logit}(t) = \\ln\\!\\left(\\frac{t}{1 - t}\\right) \\quad \\text{shifts a parallel boundary}',
            {
              x: 0,
              y: 375,
              size: 36,
              color: ROLE.threshold,
            },
          ).opacity(postS2),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view3dWrap, view0, view12);
  livingDrift(s, c, drift, 1);
  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.15, phi: 0.94, distance: 14.5 },
    { startOffset: 0.15, endMargin: 0.6 },
  );
  cueTo(s, c, 'lr-boundary-geometry-step-0', step0P, 1, { dur: 1.6 });
  cueTo(s, c, 'lr-boundary-geometry-step-1', step1P, 1, { dur: 0.9 });
  cueTo(s, c, 'lr-boundary-normal', normP, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-boundary-distance', distP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'lr-boundary-geometry-step-2', step2P, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-boundary-level', levelP, 1, { dur: 0.9 });
  cueTo(s, c, 'lr-boundary-vertical', vertP, 1, { dur: 0.5 });
  cueTo(s, c, 'lr-boundary-vertical-only', vertOnlyP, 1, { dur: 0.6 });
  cueTo(s, c, 'lr-boundary-constant', constP, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 5. log-loss: Which outcome did the model make unlikely?
// Cues: loss-select-outcome, loss-wrong, loss-correct, stable-loss, lr-stable-loss-result
// ---------------------------------------------------------------------------
export function logLossScene(s, c) {
  const selP = s.value(0);
  const wrongP = s.value(0);
  const corrP = s.value(0);
  const stabP = s.value(0);
  const resP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.positive, seed: 5 }));
  s.add(decorAura(0, 30, 560, '#ff6b8b1f', '#5ce1e614'));

  const headline = heroTitle(['Negative Log-Likelihood', '& Numerical Stability'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.positive,
    eyebrow: 'BINARY CROSS-ENTROPY  −ln(p)',
  });

  const ax = makeAxes({
    x0: -780,
    y0: -10,
    w: 920,
    h: 330,
    xDom: [0, 1],
    yDom: [0, 3],
    xTicks: [0.1, 0.5, 0.9],
    yTicks: [0, 1, 2, 3],
    xLabel: 'assigned positive probability p',
    yLabel: 'loss (nats)',
  });
  const lossPts = sampleCurve(ax, (x) => -Math.log(x), 0.055, 0.99, 120);

  // View 1 (Beats 0-1): Two-part probability ribbon + live -ln(p) cliff probe
  const view1 = guardedDynamic(
    () => fadeOut(stabP.value),
    (vis) => {
      const sel = selP.value;
      const wp = smooth(wrongP.value);
      const cp = smooth(corrP.value);
      const pVal = cp > 0.01 ? mix(0.1, 0.9, cp) : mix(0.5, 0.1, wp);
      const lossVal = -Math.log(pVal);
      const nodes = [];

      // Top probability split ribbon
      const rx = -780;
      const ry = -160;
      const rw = 1560;
      const rh = 62;
      const posW = rw * pVal;
      nodes.push(
        txt(
          `p = ${pVal.toFixed(2)}  (review required)`,
          rx,
          ry - 66,
          28,
          ROLE.positive,
          'mono',
          'left',
        ),
        txt(
          `1 − p = ${(1 - pVal).toFixed(2)}  (routine)`,
          rx + rw,
          ry - 66,
          28,
          ROLE.negative,
          'mono',
          'right',
        ),
        scaleTrack(rx, ry, rw, rh, { stroke: '#32446e', radius: 12 }),
        glowBar(rx, ry, posW, rh - 6, ROLE.positive, {
          glow: sel > 0.3 ? 14 : 7,
          radius: 10,
        }),
        glowBar(rx + posW + 4, ry, Math.max(8, rw - posW - 4), rh - 6, ROLE.negative, {
          glow: 4,
          radius: 10,
          opacity: sel > 0.3 ? 0.42 : 0.72,
        }),
      );

      // -ln(p) loss cliff
      const probePt = ax.pt(pVal, Math.min(3, lossVal));
      nodes.push(
        ax.node,
        neonCurve(lossPts, [ROLE.positive, ROLE.loss, ROLE.score], { width: 4.5, glow: 11 }),
        line([probePt[0], ax.py(0)], probePt, {
          stroke: ROLE.threshold,
          width: 2.5,
          dash: [6, 6],
        }),
        glowDot(probePt[0], probePt[1], { radius: 13, color: ROLE.threshold, glow: 16 }),
      );

      // Right live loss telemetry (withholding 2.303 / 0.105 during prediction beat 0)
      const tx = 510;
      if (wp < 0.02 && cp < 0.02) {
        nodes.push(
          txt('PREDICTION CHECK', tx, 50, 26, ROLE.threshold, 'mono'),
          txt('Which gets the bigger loss:', tx, 118, 32, COSMOS.ink, 'serif'),
          txt('p = 0.10   or   p = 0.90 ?', tx, 178, 36, ROLE.threshold, 'mono'),
          glowTex('-\\ln(0.50) = 0.693', { x: tx, y: 270, size: 36, color: ROLE.positive }),
        );
      } else {
        nodes.push(
          glowTex(`-\\ln(${pVal.toFixed(2)})`, { x: tx, y: 110, size: 46, color: ROLE.positive }),
          txt(`${lossVal.toFixed(3)} nats`, tx, 215, 56, ROLE.threshold, 'mono').glow(
            12,
            ROLE.threshold,
          ),
          txt(
            cp > 0.5 ? 'Confident & right: tiny penalty' : 'Confident & wrong: steep cliff',
            tx,
            290,
            28,
            cp > 0.5 ? ROLE.good : ROLE.positive,
            'sans',
          ),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Extreme logit z = -1000, y = 1 naive underflow vs stable softplus
  const view2 = guardedDynamic(
    () => fadeIn(stabP.value),
    (vis) => {
      const rs = resP.value;
      const ph = drift.value;
      const nodes = [];

      nodes.push(
        txt(
          'EXTREME WRONG LOGIT:  z = −1000   ·   LABEL y = 1',
          0,
          -225,
          30,
          ROLE.positive,
          'mono',
        ),
        // Left: Naive path breaks
        txt('NAIVE FLOAT64 PATH', -450, -135, 28, ROLE.positive, 'mono'),
        txt('σ(−1000) rounds to 0.0', -450, -70, 34, COSMOS.ink, 'mono'),
        glowTex('-\\ln(0) = +\\infty \\;\\;\\text{(fails)}', {
          x: -450,
          y: 35,
          size: 42,
          color: ROLE.positive,
        }),
        rule(0, -165, 0, 145, '#2b395e', 2),
        // Right: Stable softplus directly from logit z
        txt('STABLE SOFTPLUS PATH', 450, -135, 28, ROLE.good, 'mono'),
        glowTex('\\ell(z, y) = \\operatorname{softplus}(z) - y z', {
          x: 450,
          y: -55,
          size: 38,
          color: ROLE.score,
        }),
        rs > 0.5
          ? glowTex('\\ell(-1000, 1) = 1000', {
              x: 450,
              y: 55,
              size: 42,
              color: ROLE.good,
            }).opacity(rs)
          : txt('Evaluating finite logit...', 450, 55, 30, COSMOS.muted, 'serif'),
      );

      // Three evaluated softplus pieces cleanly spaced across the bottom
      const parts = [
        ['max(0, −1000)', '0', ROLE.score],
        ['exp(−|−1000|)', '0  (safe underflow)', ROLE.loss],
        ['log1p(0) − (−1000)', rs > 0.5 ? '1000 nats' : '?', ROLE.good],
      ];
      parts.forEach(([lbl, val, col], i) => {
        const cx = -560 + i * 560;
        const pulse = 1 + 0.06 * Math.sin(ph * Math.PI * 8 + i);
        nodes.push(
          circle(10 * pulse, { fill: col, stroke: null })
            .at(cx, 200)
            .glow(10, col),
          txt(lbl, cx, 250, 28, COSMOS.muted, 'mono'),
          txt(val, cx, 305, 32, col, 'mono'),
        );
      });

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'loss-select-outcome', selP, 1, { dur: 0.7 });
  cueTo(s, c, 'loss-wrong', wrongP, 1, { dur: 0.85 });
  cueTo(s, c, 'loss-correct', corrP, 1, { dur: 0.9 });
  cueTo(s, c, 'stable-loss', stabP, 1, { dur: 0.8 });
  cueTo(s, c, 'lr-stable-loss-result', resP, 1, { dur: 0.6 });
}
