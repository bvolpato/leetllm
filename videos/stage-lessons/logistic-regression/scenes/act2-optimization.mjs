// Act 2 (Scenes 6-12): Bernoulli Likelihood, Loss Curvature & Hessian,
// Chain-Rule Gradient Cancellation, Batch Gradient Accumulation, Data Contract,
// Gradient Descent Learning (with 3D Convex BCE Loss Surface), and Separable Growth & L2 Regularization.
import {
  Node,
  arrow,
  circle,
  curve3d,
  dot,
  dynamic,
  gridPlane3d,
  group,
  line,
  point3d,
  polyPath,
  rect,
  surface,
} from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaGrid,
  cinematic3d,
  cueTo,
  curvatureFixture,
  decorAura,
  dotVec,
  fadeIn,
  fadeOut,
  fitSteps,
  fittedWeights,
  glowBar,
  glowCol,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  likelihoodRows,
  livingDrift,
  makeAxes,
  meanHessian,
  mix,
  neonCurve,
  orbitScene,
  regularizedMinimum,
  regularizedObjective,
  reviewRegionVertices,
  rule,
  sampleCurve,
  scaleTrack,
  sigmoid,
  smooth,
  softplus,
  softplusNegative,
  training,
  trainingLoss,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 6. bernoulli-likelihood: Select the probability of each actual label
// Cues: lr-bernoulli-likelihood-step-0, lr-label-selection, lr-complete-likelihood,
//       lr-bernoulli-likelihood-step-1, lr-mean-likelihood, lr-bernoulli-likelihood-step-2,
//       lr-zero-target-entropy
// ---------------------------------------------------------------------------
export function bernoulliLikelihood(s, c) {
  const s0P = s.value(0);
  const selP = s.value(0);
  const likP = s.value(0);
  const s1P = s.value(0);
  const meanP = s.value(0);
  const s2P = s.value(0);
  const entP = s.value(0);
  const drift = s.value(0);

  const rows = likelihoodRows(fittedWeights);
  const jointLik = rows.reduce((acc, r) => acc * r.selected, 1);
  const meanBce = trainingLoss(fittedWeights);

  s.add(cinemaGrid({ accent: ROLE.loss, seed: 6 }));
  s.add(decorAura(0, 20, 560, '#a78bfa1e', '#5ce1e614'));

  const headline = heroTitle(['Bernoulli Likelihood', 'to Mean Cross-Entropy'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.loss,
    eyebrow: 'MAXIMUM LIKELIHOOD ESTIMATION',
  });

  // View 0 (Beat 0): 8 rows selecting p or (1-p), multiplying to joint likelihood
  const view0 = guardedDynamic(
    () => fadeOut(s1P.value),
    (vis) => {
      const sl = selP.value;
      const lk = likP.value;
      const ph = drift.value;
      const nodes = [];

      nodes.push(
        txt('ROW', -820, -210, 26, COSMOS.muted, 'mono', 'left'),
        txt('LABEL y', -675, -210, 26, COSMOS.muted, 'mono'),
        txt('SELECTED PROBABILITY  pʸ (1 − p)¹⁻ʸ', -340, -210, 26, ROLE.score, 'mono', 'left'),
        txt('VALUE', 780, -210, 26, ROLE.threshold, 'mono', 'right'),
      );

      rows.forEach((r, i) => {
        const y = -148 + i * 56;
        const col = r.y ? ROLE.positive : ROLE.negative;
        const rev = Math.max(0, Math.min(1, sl * 1.4 - i * 0.06));
        const barW = 720 * r.selected;
        const pulse = 1 + 0.05 * Math.sin(ph * Math.PI * 8 + i);
        nodes.push(
          txt(r.id, -820, y, 26, col, 'mono', 'left'),
          dot(9 * pulse, col)
            .at(-675, y)
            .glow(7, col),
          txt(r.y ? 'y = 1  →  p' : 'y = 0  →  1−p', -580, y, 26, col, 'mono', 'left'),
          scaleTrack(-300, y, 740, 24, { stroke: '#2c3d63', radius: 6 }),
          glowBar(-300, y, barW * Math.max(0.15, rev), 24, col, { glow: 7, radius: 6 }),
          txt(r.selected.toFixed(3), 780, y, 26, rev > 0.5 ? col : COSMOS.dim, 'mono', 'right'),
        );
      });

      const preLik = fadeOut(lk);
      const postLik = fadeIn(lk);
      if (preLik > 0.02) {
        nodes.push(
          glowTex('P(Y_i = y_i \\mid x_i) = p_i^{y_i}(1 - p_i)^{1 - y_i}', {
            x: 0,
            y: 365,
            size: 40,
            color: ROLE.score,
          }).opacity(preLik),
        );
      }
      if (postLik > 0.02) {
        nodes.push(
          glowTex(
            `L(w) = \\prod_{i=1}^{8} p_i^{y_i}(1 - p_i)^{1 - y_i} \\approx ${jointLik.toFixed(4)}`,
            { x: 0, y: 365, size: 40, color: ROLE.threshold },
          ).opacity(postLik),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Log turns product into sum -> negate & divide by N
  const view1 = guardedDynamic(
    () => Math.min(fadeIn(s1P.value), fadeOut(s2P.value)),
    (vis) => {
      const mp = meanP.value;
      const nodes = [];

      nodes.push(
        txt('LOG TURNS PRODUCT INTO SUM OF SURPRISES', -820, -210, 26, ROLE.loss, 'mono', 'left'),
      );

      // 8 glowing loss columns rising from baseline y = 100
      const baseY = 100;
      const maxH = 240;
      rows.forEach((r, i) => {
        const cx = -715 + i * 204;
        const col = r.y ? ROLE.positive : ROLE.negative;
        const h = Math.min(maxH, r.loss * 165);
        nodes.push(
          glowCol(cx, baseY, 108, h, col, { glow: 8, radius: 8 }),
          txt(r.id, cx, baseY + 34, 26, col, 'mono'),
          txt(r.loss.toFixed(2), cx, baseY + 72, 26, COSMOS.ink, 'mono'),
        );
      });
      nodes.push(line([-800, baseY], [800, baseY], { stroke: '#4d6499', width: 2.6 }));

      if (mp > 0.2) {
        const meanY = baseY - meanBce * 165;
        nodes.push(
          line([-800, meanY], [800, meanY], {
            stroke: ROLE.threshold,
            width: 3.5,
            dash: [10, 8],
          })
            .glow(8, ROLE.threshold)
            .opacity(mp),
          txt(
            `mean = ${meanBce.toFixed(4)}`,
            795,
            meanY - 28,
            28,
            ROLE.threshold,
            'mono',
            'right',
          ).opacity(mp),
        );
      }

      nodes.push(
        glowTex(
          'J(w) = -\\frac{1}{N} \\sum_{i=1}^{N} \\left[ y_i \\ln p_i + (1 - y_i)\\ln(1 - p_i) \\right]',
          { x: 0, y: 270, size: 38, color: ROLE.threshold },
        ),
        txt(
          'Normalizing by 1/N keeps gradient scale independent of batch size N',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): One-hot target entropy = 0 -> H(y, p) = KL(y || p) vs population entropy
  const view2 = guardedDynamic(
    () => fadeIn(s2P.value),
    (vis) => {
      const ep = entP.value;
      const nodes = [];

      nodes.push(
        // Left: Single hard label one-hot distribution
        txt('ONE HARD LABEL  (y = 1)', -440, -210, 28, ROLE.positive, 'mono'),
        glowCol(-540, 60, 110, 210, ROLE.positive, { glow: 10 }),
        glowCol(-340, 60, 110, 10, ROLE.negative, { glow: 0, opacity: 0.4 }),
        line([-640, 60], [-240, 60], { stroke: '#4d6499', width: 2.4 }),
        txt('P(1) = 1', -540, 96, 26, ROLE.positive, 'mono'),
        txt('P(0) = 0', -340, 96, 26, COSMOS.dim, 'mono'),
        txt('Target entropy H(q) = 0', -440, 165, 30, ROLE.threshold, 'mono'),
        rule(0, -220, 0, 210, '#2a3759', 2),
        // Right: Population marginal uncertainty
        txt('WHOLE POPULATION  (P(Y=1) = 0.5)', 440, -210, 28, ROLE.score, 'mono'),
        glowCol(340, 60, 110, 105, ROLE.positive, { glow: 8 }),
        glowCol(540, 60, 110, 105, ROLE.negative, { glow: 8 }),
        line([240, 60], [640, 60], { stroke: '#4d6499', width: 2.4 }),
        txt('0.50', 340, 96, 26, ROLE.positive, 'mono'),
        txt('0.50', 540, 96, 26, ROLE.negative, 'mono'),
        txt('Marginal entropy H(Y) = ln 2 ≈ 0.693', 440, 165, 30, ROLE.score, 'mono'),
      );

      nodes.push(
        glowTex(
          'H(q, p) = H(q) + D_{\\mathrm{KL}}(q \\,\\|\\, p) = 0 + D_{\\mathrm{KL}}(q \\,\\|\\, p)',
          {
            x: 0,
            y: 285,
            size: 38,
            color: ep > 0.3 ? ROLE.threshold : ROLE.score,
          },
        ),
        txt(
          'Expected log loss is minimized by the true conditional probability P(Y = 1 | x)',
          0,
          375,
          28,
          COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'lr-bernoulli-likelihood-step-0', s0P, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-label-selection', selP, 1, { dur: 0.9 });
  cueTo(s, c, 'lr-complete-likelihood', likP, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-bernoulli-likelihood-step-1', s1P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-mean-likelihood', meanP, 1, { dur: 0.8 });
  cueTo(s, c, 'lr-bernoulli-likelihood-step-2', s2P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-zero-target-entropy', entP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 7. loss-curvature: Inspect the learning signal before trusting convexity
// Cues: lr-loss-curvature-step-0, lr-bce-derivative, lr-mse-derivative,
//       lr-loss-curvature-step-1, lr-design-hessian, lr-duplicate-flat,
//       lr-loss-curvature-step-2, lr-no-finite-optimum
// ---------------------------------------------------------------------------
export function lossCurvature(s, c) {
  const s0P = s.value(0);
  const bceP = s.value(0);
  const mseP = s.value(0);
  const s1P = s.value(0);
  const hessP = s.value(0);
  const dupP = s.value(0);
  const s2P = s.value(0);
  const noOptP = s.value(0);
  const drift = s.value(0);

  const curv = curvatureFixture(-8, 1);
  const H = meanHessian([0, 0, 0]);

  s.add(cinemaGrid({ accent: ROLE.positive, seed: 7 }));
  s.add(decorAura(0, 10, 560, '#ff6b8b1e', '#60a5fa18'));

  const headline = heroTitle(['Learning Signal,', 'Hessian & Separation'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.positive,
    eyebrow: 'WHY BCE BEATS SQUARED ERROR ON LOGITS',
  });

  // View 0 (Beat 0): z = -8, y = 1 BCE arrow (-0.9997) vs MSE arrow (-0.00067)
  const view0 = guardedDynamic(
    () => fadeOut(s1P.value),
    (vis) => {
      const bce = smooth(bceP.value);
      const mse = smooth(mseP.value);
      const nodes = [];

      nodes.push(
        txt(
          `CONFIDENTLY WRONG POSITIVE ROW:  z = −8  ·  p = ${curv.p.toFixed(6)}  ·  y = 1`,
          0,
          -220,
          28,
          ROLE.positive,
          'mono',
        ),
        // BCE gradient track (origin at x = 320, pointing left by 860px)
        txt('BCE LOGIT GRADIENT:  p − y', -760, -110, 30, ROLE.positive, 'mono', 'left'),
        line([-560, -45], [320, -45], { stroke: '#334670', width: 3 }),
        glowDot(320, -45, { radius: 8, color: COSMOS.muted, glow: 4 }),
      );
      if (bce > 0.02) {
        const endX = 320 + 840 * curv.bce * bce;
        nodes.push(
          arrow([320, -45], [endX, -45], { stroke: ROLE.positive, width: 9 }).glow(
            14,
            ROLE.positive,
          ),
          txt(curv.bce.toFixed(6), 410, -45, 40, ROLE.positive, 'mono', 'left')
            .glow(8, ROLE.positive)
            .opacity(bce),
        );
      } else {
        nodes.push(txt('slope = ?', 410, -45, 36, COSMOS.dim, 'mono', 'left'));
      }

      // MSE gradient track
      nodes.push(
        txt(
          'SQUARED-ERROR GRADIENT:  2(p − y) p(1 − p)',
          -760,
          85,
          30,
          ROLE.negative,
          'mono',
          'left',
        ),
        line([-560, 150], [320, 150], { stroke: '#334670', width: 3 }),
        glowDot(320, 150, { radius: 8, color: COSMOS.muted, glow: 4 }),
      );
      if (mse > 0.02) {
        // Exaggerate visual tick slightly to 12px so tiny arrow is perceivable while displaying exact -0.000670
        const endX = 320 - 14 * mse;
        nodes.push(
          arrow([320, 150], [endX, 150], { stroke: ROLE.negative, width: 6 }).glow(
            10,
            ROLE.negative,
          ),
          txt(curv.squaredError.toFixed(6), 410, 150, 40, ROLE.negative, 'mono', 'left')
            .glow(8, ROLE.negative)
            .opacity(mse),
        );
      } else {
        nodes.push(txt('slope = ?', 410, 150, 36, COSMOS.dim, 'mono', 'left'));
      }

      nodes.push(
        glowTex(
          '\\frac{\\partial L_{\\text{MSE}}}{\\partial z} = 2(p - y)\\,p(1 - p) \\approx -0.00067',
          {
            x: 0,
            y: 285,
            size: 38,
            color: ROLE.negative,
          },
        ),
        txt(
          'Saturated sigmoid crushes squared-error gradient; BCE cancels p(1−p) cleanly',
          0,
          375,
          28,
          COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Weighted design Hessian H = (1/N) X^T diag(p(1-p)) X + duplicate column flat direction
  const view1 = guardedDynamic(
    () => Math.min(fadeIn(s1P.value), fadeOut(s2P.value)),
    (vis) => {
      const hp = hessP.value;
      const dp = dupP.value;
      const nodes = [];

      nodes.push(
        txt('3 × 3 MEAN HESSIAN  (AT w = 0)', -480, -215, 28, ROLE.score, 'mono'),
        glowTex('H = \\frac{1}{N} X^\\top \\operatorname{diag}(p(1 - p)) X \\succeq 0', {
          x: -480,
          y: -135,
          size: 34,
          color: ROLE.score,
        }),
      );

      // 3x3 glowing Hessian matrix cells
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const cx = -670 + j * 190;
          const cy = -20 + i * 115;
          const show = hp > (i * 3 + j) / 10;
          nodes.push(
            rect(164, 86, {
              fill: '#0f1930',
              stroke: show ? ROLE.score : '#2a3a5e',
              width: 2.2,
              radius: 10,
            }).at(cx, cy),
            txt(
              show ? H[i][j].toFixed(3) : '·',
              cx,
              cy,
              32,
              show ? ROLE.score : COSMOS.dim,
              'mono',
            ),
          );
        }
      }

      nodes.push(rule(0, -220, 0, 290, '#2a3759', 2));

      // Right: Duplicate-feature nullspace direction (Δw1 = +u, Δw3 = -u -> Δz = 0)
      const u = dp;
      nodes.push(
        txt('DUPLICATE COLUMN CREATES FLAT DIRECTION', 440, -215, 26, ROLE.threshold, 'mono'),
        txt('Augmented rows: [1, a, s, a]', 440, -155, 28, COSMOS.muted, 'mono'),
      );
      training.slice(0, 4).forEach(([a, sup], i) => {
        const y = -75 + i * 74;
        nodes.push(
          txt(`[1, ${a.toFixed(1)}, ${sup}, ${a.toFixed(1)}]`, 270, y, 28, COSMOS.ink, 'mono'),
          txt('→  Δz = 0.00', 640, y, 28, ROLE.good, 'mono'),
        );
      });
      nodes.push(
        txt(
          `Shift Δw₁ = +${u.toFixed(2)},  Δw₃ = −${u.toFixed(2)}`,
          440,
          235,
          30,
          ROLE.threshold,
          'mono',
        ),
        txt('Full column rank ⇒ strictly positive definite H', 0, 365, 28, COSMOS.muted, 'sans'),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Separable 2-point loss keeps falling forever as coefficient a grows
  const ax2 = makeAxes({
    x0: -790,
    y0: -210,
    w: 960,
    h: 450,
    xDom: [0, 10],
    yDom: [0, 0.75],
    xTicks: [0, 2, 4, 6, 8, 10],
    yTicks: [0, 0.25, 0.5, 0.75],
    xLabel: 'coefficient a',
    yLabel: 'mean log loss',
  });
  const sepCurve = sampleCurve(ax2, softplusNegative, 0, 10, 100);

  const view2 = guardedDynamic(
    () => fadeIn(s2P.value),
    (vis) => {
      const aVal = 1 + 8.5 * smooth(s2P.value);
      const noOpt = noOptP.value;
      const pt = ax2.pt(aVal, softplus(-aVal));
      const nodes = [
        ax2.node,
        neonCurve(sepCurve, [ROLE.score, ROLE.good], { width: 4.5, glow: 11 }),
        glowDot(pt[0], pt[1], { radius: 13, color: ROLE.threshold, glow: 16 }),
        txt('SEPARABLE PAIR', 515, -185, 26, COSMOS.muted, 'mono'),
        txt(`a = ${aVal.toFixed(2)}`, 515, -105, 52, ROLE.threshold, 'mono').glow(
          10,
          ROLE.threshold,
        ),
        txt(`loss = ${softplus(-aVal).toFixed(5)}`, 515, -20, 34, ROLE.score, 'mono'),
        glowTex('L(a) = \\ln(1 + e^{-a}) \\to 0', { x: 515, y: 95, size: 36, color: ROLE.score }),
        txt(
          noOpt > 0.5
            ? 'No finite unpenalized minimizer: add L2 penalty'
            : 'Every larger coefficient pushes loss closer to zero',
          0,
          365,
          32,
          noOpt > 0.5 ? ROLE.positive : COSMOS.muted,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'lr-loss-curvature-step-0', s0P, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-bce-derivative', bceP, 1, { dur: 0.9 });
  cueTo(s, c, 'lr-mse-derivative', mseP, 1, { dur: 0.9 });
  cueTo(s, c, 'lr-loss-curvature-step-1', s1P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-design-hessian', hessP, 1, { dur: 1.0 });
  cueTo(s, c, 'lr-duplicate-flat', dupP, 1, { dur: 0.9 });
  cueTo(s, c, 'lr-loss-curvature-step-2', s2P, 1, { dur: 1.2 });
  cueTo(s, c, 'lr-no-finite-optimum', noOptP, 1, { after: true, dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 8. gradient: The chain rule leaves a residual
// Cues: gradient-chain, gradient-cancel, worked-row-gradient, lr-gradient-local
// ---------------------------------------------------------------------------
export function gradientScene(s, c) {
  const chainP = s.value(0);
  const cancelP = s.value(0);
  const rowP = s.value(0);
  const locP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.threshold, seed: 8 }));
  s.add(decorAura(0, -10, 560, '#ffd1661c', '#5ce1e614'));

  const headline = heroTitle(['Chain Rule Cancellation', 'Leaves (p − y) x'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.threshold,
    eyebrow: 'WORKED ROW R4:  [1, 3.5, 6]  ·  y = 1',
  });

  const live = dynamic(() => {
    const ch = chainP.value;
    const cn = cancelP.value;
    const rw = rowP.value;
    const lc = locP.value;
    const ph = drift.value;
    const nodes = [];

    // Top equation row: full 3-factor chain rule crossfades cleanly to cancelled (p - y) x_j
    const preCancel = fadeOut(cn);
    const postCancel = fadeIn(cn);
    if (preCancel > 0.02) {
      nodes.push(
        glowTex(
          '\\frac{\\partial \\ell}{\\partial w_j} = \\underbrace{\\frac{p - y}{p(1 - p)}}_{\\partial \\ell / \\partial p} \\cdot \\underbrace{p(1 - p)}_{\\partial p / \\partial z} \\cdot \\underbrace{x_j}_{\\partial z / \\partial w_j}',
          { x: 0, y: -155, size: 42, color: ch > 0.1 ? ROLE.score : COSMOS.muted },
        ).opacity(preCancel),
      );
    }
    if (postCancel > 0.02) {
      nodes.push(
        glowTex('\\frac{\\partial \\ell}{\\partial w_j} = (p - y)\\, x_j', {
          x: 0,
          y: -155,
          size: 56,
          color: ROLE.threshold,
        }).opacity(postCancel),
        txt('p(1 − p) cancels identically!', 0, -68, 28, ROLE.good, 'mono').opacity(postCancel),
      );
    }

    // Worked row R4 at w = [0, 0, 0] -> p = 0.5, y = 1, residual = -0.5
    const cols = [
      { name: 'Intercept  x₀', feat: '1', grad: '−0.50', val: -0.5, color: ROLE.loss },
      { name: 'Ambiguity  x₁', feat: '3.5', grad: '−1.75', val: -1.75, color: ROLE.positive },
      { name: 'Support  x₂', feat: '6.0', grad: '−3.00', val: -3.0, color: ROLE.score },
    ];
    nodes.push(
      txt(
        'AT w = [0, 0, 0]:   p = 0.50,   y = 1   ⇒   residual (p − y) = −0.50',
        0,
        24,
        28,
        ROLE.positive,
        'mono',
      ),
    );

    cols.forEach((col, i) => {
      const cx = -540 + i * 540;
      const cy = 175;
      const reveal = Math.max(0, Math.min(1, rw * 1.4 - i * 0.15));
      const pulse = 1 + 0.05 * Math.sin(ph * Math.PI * 8 + i);
      nodes.push(
        txt(col.name, cx, cy - 82, 28, col.color, 'mono'),
        txt(`(−0.5) × ${col.feat}`, cx, cy - 28, 32, COSMOS.ink, 'mono'),
        scaleTrack(cx - 170, cy + 36, 340, 26, { stroke: '#2c3d63', radius: 6 }),
        glowBar(
          cx - 170,
          cy + 36,
          Math.max(12, 340 * (Math.abs(col.val) / 3.2) * reveal),
          26,
          col.color,
          { glow: 9 * pulse, radius: 6 },
        ),
        txt(
          reveal > 0.5 ? `g = ${col.grad}` : 'g = ?',
          cx,
          cy + 94,
          36,
          reveal > 0.5 ? col.color : COSMOS.dim,
          'mono',
        ),
      );
    });

    nodes.push(
      txt(
        lc > 0.4
          ? 'Subtracting negative gradients raises scores for similar review-required cases'
          : 'Each weight receives the shared residual scaled by its own feature',
        0,
        375,
        30,
        lc > 0.4 ? ROLE.good : COSMOS.muted,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'gradient-chain', chainP, 1, { dur: 0.85 });
  cueTo(s, c, 'gradient-cancel', cancelP, 1, { dur: 0.9 });
  cueTo(s, c, 'worked-row-gradient', rowP, 1, { dur: 1.0 });
  cueTo(s, c, 'lr-gradient-local', locP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 9. batch-gradient: Collect every row before updating
// Cues: batch-columns, collect-batch, average-batch, first-update
// ---------------------------------------------------------------------------
export function batchGradient(s, c) {
  const colP = s.value(0);
  const collP = s.value(0);
  const avgP = s.value(0);
  const updP = s.value(0);
  const drift = s.value(0);

  const rowGrads = training.map(([a, sup, y], i) => {
    const res = 0.5 - y;
    return { id: `R${i + 1}`, y, g: [res, res * a, res * sup] };
  });
  const sums = [0, 1, 2].map((j) => rowGrads.reduce((acc, r) => acc + r.g[j], 0));
  const means = sums.map((v) => v / 8);
  const w1 = fitSteps[1];

  s.add(cinemaGrid({ accent: ROLE.score, seed: 9 }));
  s.add(decorAura(0, 0, 560, '#5ce1e61b', '#ffd16614'));

  const headline = heroTitle(['Full-Batch Gradient', 'Across All 8 Requests'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.score,
    eyebrow: 'STEP 1 AT w = [0, 0, 0]  ·  η = 0.20',
  });

  const live = dynamic(() => {
    const cl = colP.value;
    const co = collP.value;
    const av = avgP.value;
    const up = updP.value;
    const completed = Math.min(8, Math.round(co * 8));
    const nodes = [];

    // Column headers
    const xs = [-760, -490, -210, 70];
    nodes.push(
      txt('ROW', xs[0], -230, 26, COSMOS.muted, 'mono', 'left'),
      txt('INTERCEPT g₀', xs[1], -230, 26, cl > 0.2 ? ROLE.loss : COSMOS.muted, 'mono'),
      txt('AMBIGUITY g₁', xs[2], -230, 26, cl > 0.2 ? ROLE.positive : COSMOS.muted, 'mono'),
      txt('SUPPORT g₂', xs[3], -230, 26, cl > 0.2 ? ROLE.score : COSMOS.muted, 'mono'),
    );

    // 8 training rows lighting up sequentially during collect-batch
    rowGrads.forEach((r, i) => {
      const y = -172 + i * 54;
      const active = i < completed;
      const col = r.y ? ROLE.positive : ROLE.negative;
      const alpha = active ? 1 : 0.34;
      nodes.push(
        txt(`${r.id} (y=${r.y})`, xs[0], y, 26, col, 'mono', 'left').opacity(alpha),
        txt(r.g[0].toFixed(2), xs[1], y, 26, ROLE.loss, 'mono').opacity(alpha),
        txt(r.g[1].toFixed(2), xs[2], y, 26, ROLE.positive, 'mono').opacity(alpha),
        txt(r.g[2].toFixed(2), xs[3], y, 26, ROLE.score, 'mono').opacity(alpha),
      );
    });

    // Running column totals below row 8
    const runSums = [0, 1, 2].map((j) =>
      rowGrads.slice(0, completed).reduce((acc, r) => acc + r.g[j], 0),
    );
    nodes.push(
      line([-780, 244], [210, 244], { stroke: '#4d6499', width: 2.5 }),
      txt(`SUM (${completed}/8)`, xs[0], 292, 26, ROLE.threshold, 'mono', 'left'),
      txt(runSums[0].toFixed(2), xs[1], 292, 28, ROLE.loss, 'mono'),
      txt(runSums[1].toFixed(2), xs[2], 292, 28, ROLE.positive, 'mono'),
      txt(runSums[2].toFixed(2), xs[3], 292, 28, ROLE.score, 'mono'),
    );

    // Right side summary panel (floating typography, no box card)
    const rx = 580;
    nodes.push(
      rule(240, -230, 240, 340, '#2a3759', 2),
      txt('MEAN GRADIENT  (÷ 8)', rx, -195, 26, ROLE.score, 'mono'),
      txt(
        av > 0.5 ? `[${means.map((v) => v.toFixed(3)).join(', ')}]` : 'Waiting for all 8 rows...',
        rx,
        -125,
        34,
        av > 0.5 ? ROLE.score : COSMOS.dim,
        'mono',
      ),
      glowTex('w^{(1)} = w^{(0)} - 0.20\\,\\bar{g}', {
        x: rx,
        y: -15,
        size: 38,
        color: ROLE.threshold,
      }),
      txt('UPDATED WEIGHTS w⁽¹⁾', rx, 90, 26, ROLE.good, 'mono'),
      txt(
        up > 0.5 ? `[${w1.map((v) => v.toFixed(4)).join(', ')}]` : '[ ?,  ?,  ? ]',
        rx,
        155,
        34,
        up > 0.5 ? ROLE.good : COSMOS.dim,
        'mono',
      ),
      txt(
        up > 0.5 ? 'Both feature weights rise first' : 'Intercept stays 0 on balanced batch',
        rx,
        245,
        26,
        COSMOS.muted,
        'sans',
      ),
      txt(
        up > 0.5 ? 'Joint fit separates signs later' : 'Each row starts at p = 0.50',
        rx,
        290,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'batch-columns', colP, 1, { dur: 0.7 });
  cueTo(s, c, 'collect-batch', collP, 1, { dur: 1.5 });
  cueTo(s, c, 'average-batch', avgP, 1, { dur: 0.8 });
  cueTo(s, c, 'first-update', updP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 10. data-contract: Keep one label paired with one logit
// Cues: lr-data-contract-step-0, lr-shape-broadcast, lr-shape-reject,
//       lr-data-contract-step-1, lr-sign-conditional, lr-data-contract-step-2,
//       lr-snapshot-boundary
// ---------------------------------------------------------------------------
export function dataContract(s, c) {
  const s0P = s.value(0);
  const brdP = s.value(0);
  const rejP = s.value(0);
  const s1P = s.value(0);
  const sgnP = s.value(0);
  const s2P = s.value(0);
  const snpP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.positive, seed: 10 }));
  s.add(decorAura(150, 0, 560, '#ff6b8b1a', '#6ee7b716'));

  const headline = heroTitle(['Shape Contracts', '& Snapshot Boundaries'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.positive,
    eyebrow: 'X ∈ ℝ⁸ˣ³   ·   w ∈ ℝ³   ·   y, z ∈ ℝ⁸',
  });

  // View 0 (Beat 0): Correct (8,) x (8,) 8 pairs vs mistaken (8, 1) x (8,) 8x8 broadcast grid
  const view0 = guardedDynamic(
    () => fadeOut(s1P.value),
    (vis) => {
      const brd = brdP.value;
      const rej = rejP.value;
      const nodes = [];

      nodes.push(
        txt('CORRECT:  (8,) × (8,)  →  8 PAIRS', -490, -215, 28, ROLE.good, 'mono'),
        txt('MISTAKEN:  (8, 1) × (8,)  →  64 PAIRS', 410, -215, 28, ROLE.positive, 'mono'),
      );

      // Left: 8 clean diagonal 1-to-1 green nodes
      for (let i = 0; i < 8; i++) {
        const cx = -770 + i * 80;
        nodes.push(
          rect(54, 54, { fill: ROLE.good, stroke: null, radius: 8 }).at(cx, -10).glow(8, ROLE.good),
          txt(String(i + 1), cx, -10, 26, '#070910', 'mono'),
        );
      }
      nodes.push(txt('Row i pairs ONLY with label i', -490, 95, 28, COSMOS.muted, 'sans'));

      // Right: 8x8 broadcast matrix exploding out
      const showCells = Math.max(8, Math.round(brd * 64));
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const idx = i * 8 + j;
          if (idx >= showCells) continue;
          const cx = 185 + j * 64;
          const cy = -140 + i * 54;
          const isDiag = i === j;
          const col = isDiag ? ROLE.good : ROLE.positive;
          nodes.push(
            rect(48, 38, { fill: col, stroke: null, radius: 6 })
              .at(cx, cy)
              .opacity(isDiag ? 0.95 : 0.72),
          );
        }
      }

      nodes.push(
        txt(
          rej > 0.5
            ? 'Reject mismatched shapes before fitting'
            : '56 off-diagonal cells pair each label with the wrong request score',
          0,
          365,
          30,
          rej > 0.5 ? ROLE.positive : COSMOS.muted,
          'serif',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Marginal class averages (both positive!) vs conditional support weight (-0.959)
  const view1 = guardedDynamic(
    () => Math.min(fadeIn(s1P.value), fadeOut(s2P.value)),
    (vis) => {
      const sg = sgnP.value;
      const posRows = training.filter((r) => r[2] === 1);
      const negRows = training.filter((r) => r[2] === 0);
      const meanPos = [0, 1].map((j) => posRows.reduce((a, r) => a + r[j], 0) / posRows.length);
      const meanNeg = [0, 1].map((j) => negRows.reduce((a, r) => a + r[j], 0) / negRows.length);
      const baseY = 175;
      const scale = 52;
      const nodes = [];

      nodes.push(
        txt('MARGINAL CLASS AVERAGES DRIVE STEP 1', 0, -215, 28, COSMOS.muted, 'mono'),
        // Ambiguity bars
        txt('AMBIGUITY x₁', -420, -145, 30, ROLE.positive, 'mono'),
        glowCol(-510, baseY, 120, meanPos[0] * scale, ROLE.positive, { glow: 9 }),
        txt(`y=1: ${meanPos[0].toFixed(2)}`, -510, baseY + 42, 26, ROLE.positive, 'mono'),
        glowCol(-330, baseY, 120, meanNeg[0] * scale, ROLE.negative, { glow: 7 }),
        txt(`y=0: ${meanNeg[0].toFixed(2)}`, -330, baseY + 42, 26, ROLE.negative, 'mono'),
        // Support bars
        txt('POLICY SUPPORT x₂', 420, -145, 30, ROLE.score, 'mono'),
        glowCol(330, baseY, 120, meanPos[1] * scale, ROLE.positive, { glow: 9 }),
        txt(`y=1: ${meanPos[1].toFixed(2)}`, 330, baseY + 42, 26, ROLE.positive, 'mono'),
        glowCol(510, baseY, 120, meanNeg[1] * scale, ROLE.negative, { glow: 7 }),
        txt(`y=0: ${meanNeg[1].toFixed(2)}`, 510, baseY + 42, 26, ROLE.negative, 'mono'),
        line([-680, baseY], [680, baseY], { stroke: '#4d6499', width: 2.5 }),
        txt(
          sg > 0.4
            ? `Joint conditional fit reverses support weight to w₂ = ${fittedWeights[2].toFixed(3)}`
            : 'Both features average higher on positive rows initially',
          0,
          340,
          32,
          sg > 0.4 ? ROLE.good : COSMOS.muted,
          'serif',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Snapshot boundary table (step, weights, post-update loss)
  const view2 = guardedDynamic(
    () => fadeIn(s2P.value),
    (vis) => {
      const sn = snpP.value;
      const steps = [1, 201, 501, 1001, 3000];
      const nodes = [
        txt('EACH LOSS IS EVALUATED AFTER ITS OWN UPDATE', 0, -220, 28, ROLE.threshold, 'mono'),
        txt('STEP', -660, -140, 26, COSMOS.muted, 'mono'),
        txt('WEIGHTS  [w₀, w₁, w₂]', -70, -140, 26, ROLE.score, 'mono'),
        txt('POST-UPDATE LOSS', 580, -140, 26, ROLE.positive, 'mono'),
        line([-780, -108], [780, -108], { stroke: '#32456e', width: 2 }),
      ];
      steps.forEach((st, idx) => {
        const y = -52 + idx * 78;
        const w = fitSteps[st];
        const l = trainingLoss(w);
        const hi = idx === steps.length - 1 && sn > 0.4;
        nodes.push(
          txt(String(st), -660, y, 30, hi ? ROLE.threshold : COSMOS.ink, 'mono'),
          txt(
            `[${w.map((v) => v.toFixed(3)).join(',  ')}]`,
            -70,
            y,
            30,
            hi ? ROLE.threshold : ROLE.score,
            'mono',
          ),
          txt(l.toFixed(4), 580, y, 30, hi ? ROLE.good : ROLE.positive, 'mono'),
        );
      });
      nodes.push(
        txt(
          'Match design, reduction, penalty, intercept, and stopping rule when comparing trainers',
          0,
          375,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'lr-data-contract-step-0', s0P, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-shape-broadcast', brdP, 1, { dur: 1.0 });
  cueTo(s, c, 'lr-shape-reject', rejP, 1, { dur: 0.6 });
  cueTo(s, c, 'lr-data-contract-step-1', s1P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-sign-conditional', sgnP, 1, { dur: 0.8 });
  cueTo(s, c, 'lr-data-contract-step-2', s2P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-snapshot-boundary', snpP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 11. learning: Fit a compromise among the observed cases (+ 3D Convex BCE Loss Bowl!)
// Cues: fit-boundary, lr-learning-trajectory, training-exception
// ---------------------------------------------------------------------------
export function learningScene(s, c) {
  const fitP = s.value(0);
  const trajP = s.value(0);
  const excP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.threshold, seed: 11 }));
  s.add(decorAura(430, -20, 520, '#5ce1e61c', '#a78bfa18'));

  const headline = heroTitle(['Rotating the Boundary', 'Down the Convex Bowl'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.threshold,
    eyebrow: '3,000 FULL-BATCH GRADIENT UPDATES',
  });

  // Right: 3D Convex Binary Cross-Entropy Loss Surface L(w1, w2) + glowing descent trajectory!
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.8,
    unit: 86,
    focus: [0, 0, 0.9],
  }).at(470, -55);

  const floor3d = gridPlane3d({
    x: [-2.6, 2.6],
    y: [-2.6, 2.6],
    z: 0,
    step: 1,
    color: '#2a3c66',
    opacity: 0.44,
  });

  // Map (u, v) in [-2.6, 2.6]^2 around fitted (w1, w2) holding w0 = fittedWeights[0]
  const lossHeight = (u, v) => {
    const w1 = fittedWeights[1] + u * 1.15;
    const w2 = fittedWeights[2] + v * 0.65;
    return Math.min(2.6, trainingLoss([fittedWeights[0], w1, w2]) * 1.55);
  };

  const bceBowl = surface(lossHeight, {
    x: [-2.6, 2.6],
    y: [-2.6, 2.6],
    resolution: [20, 20],
    colors: [ROLE.good, ROLE.score, ROLE.loss, ROLE.positive],
    mesh: '#8fa9e0',
  });

  const trajPt3d = (t) => {
    const idx = Math.min(3000, Math.round(Math.expm1(t * Math.log(3001))));
    const w = fitSteps[idx];
    const u = Math.max(-2.5, Math.min(2.5, (w[1] - fittedWeights[1]) / 1.15));
    const v = Math.max(-2.5, Math.min(2.5, (w[2] - fittedWeights[2]) / 0.65));
    return [u, v, Math.min(2.65, trainingLoss(w) * 1.55 + 0.08)];
  };

  const descentTrail = curve3d(trajPt3d, 0, 1, {
    samples: 48,
    color: ROLE.threshold,
    width: 4.5,
    glow: 10,
    blend: 'screen',
  });

  const descentBead = point3d(() => trajPt3d(smooth(fitP.value)), {
    color: ROLE.threshold,
    radius: 7,
    glow: 14,
    blend: 'screen',
  });

  view3d.add(floor3d, bceBowl, descentTrail, descentBead);

  // Left: 2D Feature Plane with rotating boundary and 8 persistent training points
  const ax = makeAxes({
    x0: -800,
    y0: -225,
    w: 770,
    h: 395,
    xDom: [0.5, 5],
    yDom: [0, 9],
    xTicks: [1, 2, 3, 4, 5],
    yTicks: [0, 3, 6, 9],
    xLabel: 'ambiguity x₁',
    yLabel: 'policy support x₂',
  });

  const live = dynamic(() => {
    const fp = smooth(fitP.value);
    const ep = excP.value;
    const ph = drift.value;
    const stepIdx = Math.min(3000, Math.max(1, Math.round(Math.expm1(fp * Math.log(3001)))));
    const w = fitSteps[stepIdx];
    const curLoss = trainingLoss(w);
    const nodes = [ax.node];

    // Shaded review half-plane
    const verts = reviewRegionVertices(w, 0.5);
    if (verts.length >= 3) {
      const polyPts = verts.map((v) => ax.pt(v.x, v.y));
      nodes.push(new Node(polyPath(polyPts, true)).fill(ROLE.threshold, 0.14).stroke(null));
    }

    // Rotating glowing boundary line w0 + w1*x + w2*y = 0
    if (Math.abs(w[2]) > 1e-4) {
      const linePts = [];
      for (let i = 0; i <= 40; i++) {
        const x = 0.5 + (4.5 * i) / 40;
        const y = (-w[0] - w[1] * x) / w[2];
        if (y >= 0 && y <= 9) linePts.push(ax.pt(x, y));
      }
      if (linePts.length >= 2) {
        nodes.push(neonCurve(linePts, [ROLE.threshold, ROLE.warn], { width: 4.5, glow: 11 }));
      }
    }

    // 8 persistent training dots (R3 at [2, 3, 1] is the highlighted exception!)
    training.forEach(([a, sup, y], i) => {
      const [px, py] = ax.pt(a, sup);
      const col = y ? ROLE.positive : ROLE.negative;
      nodes.push(glowDot(px, py, { radius: 11, color: col, glow: 10 }));
      if (i === 2 && ep > 0.15) {
        const ringR = 22 + 4 * Math.sin(ph * Math.PI * 10);
        nodes.push(
          circle(ringR, { fill: null, stroke: ROLE.threshold, width: 3.4 })
            .at(px, py)
            .glow(10, ROLE.threshold)
            .opacity(ep),
          txt('R3 missed', px - 84, py - 56, 26, ROLE.threshold, 'mono').opacity(ep),
        );
      }
    });

    // Telemetry below both views
    nodes.push(
      txt('3D Convex BCE Surface  L(w₁, w₂)', 470, -345, 28, ROLE.score, 'mono'),
      txt(
        `Step ${stepIdx}   ·   w = [${w.map((v) => v.toFixed(2)).join(', ')}]`,
        -415,
        335,
        30,
        ROLE.score,
        'mono',
      ),
      txt(`Mean log loss = ${curLoss.toFixed(4)}`, 470, 315, 34, ROLE.threshold, 'mono').glow(
        8,
        ROLE.threshold,
      ),
      txt(
        ep > 0.4
          ? 'A straight boundary cannot carve out every isolated exception (R3)'
          : 'Ambiguity settles positive (+3.40), support settles negative (−0.96)',
        0,
        395,
        28,
        ep > 0.4 ? ROLE.positive : COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, view3d, live);
  livingDrift(s, c, drift, 1);
  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.18, phi: 0.94, distance: 14.6 },
    { startOffset: 0.15, endMargin: 0.55 },
  );
  cueTo(s, c, 'fit-boundary', fitP, 1, { dur: 1.8 });
  cueTo(s, c, 'lr-learning-trajectory', trajP, 1, { dur: 1.2 });
  cueTo(s, c, 'training-exception', excP, 1, { dur: 0.8 });
}

// ---------------------------------------------------------------------------
// 12. separation: Loss can fall while weights keep growing (+ L2 Regularization)
// Cues: separable-growth, separable-again, regularized-objective
// ---------------------------------------------------------------------------
export function separationScene(s, c) {
  const grow1P = s.value(0);
  const grow2P = s.value(0);
  const regP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.positive, seed: 12 }));
  s.add(decorAura(0, 20, 560, '#ff6b8b1c', '#ffd16614'));

  const headline = heroTitle(['Separable Data', '& L2 Weight Control'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.positive,
    eyebrow: 'WHY UNPENALIZED WEIGHTS EXPLODE',
  });

  // View 0 (Beat 0): Two perfectly separable points moving further apart as a = 1 -> 2 -> 4
  const view0 = guardedDynamic(
    () => fadeOut(regP.value),
    (vis) => {
      const a = 1 + smooth(grow1P.value) + 2 * smooth(grow2P.value);
      const x0 = -740;
      const x1 = 740;
      const axisY = -30;
      const xOf = (z) => mix(x0, x1, (z + 5) / 10);
      const nodes = [];

      nodes.push(
        txt(`SEPARABLE PAIR:  a = ${a.toFixed(2)}`, 0, -210, 34, ROLE.threshold, 'mono'),
        line([x0, axisY], [x1, axisY], { stroke: '#4d6499', width: 3 }),
        line([xOf(0), axisY - 55], [xOf(0), axisY + 18], {
          stroke: '#5b72a8',
          width: 2,
          dash: [6, 6],
        }),
      );
      for (const tk of [-4, -2, 0, 2, 4]) {
        const gx = xOf(tk);
        nodes.push(txt(String(tk), gx, axisY + 46, 26, COSMOS.muted, 'mono'));
      }

      // Negative point at -a, Positive point at +a
      const negX = xOf(-a);
      const posX = xOf(a);
      nodes.push(
        glowDot(negX, axisY, { radius: 16, color: ROLE.negative, glow: 16 }),
        txt('Routine (y = 0)', negX, axisY - 68, 28, ROLE.negative, 'sans'),
        txt(`p = ${sigmoid(-a).toFixed(3)}`, negX, axisY + 106, 30, ROLE.negative, 'mono'),
        glowDot(posX, axisY, { radius: 16, color: ROLE.positive, glow: 16 }),
        txt('Required (y = 1)', posX, axisY - 68, 28, ROLE.positive, 'sans'),
        txt(`p = ${sigmoid(a).toFixed(3)}`, posX, axisY + 106, 30, ROLE.positive, 'mono'),
        glowTex(`L(a) = \\ln(1 + e^{-a}) = ${softplus(-a).toFixed(4)}`, {
          x: 0,
          y: 230,
          size: 46,
          color: ROLE.score,
        }),
        txt(
          'Doubling a always lowers log loss further: no finite optimum',
          0,
          345,
          30,
          COSMOS.muted,
          'serif',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Regularized objective curve softplus(-a) + 0.1 a^2 with finite valley at a ≈ 1.178
  const ax1 = makeAxes({
    x0: -790,
    y0: -215,
    w: 960,
    h: 465,
    xDom: [0, 5],
    yDom: [0, 3],
    xTicks: [0, 1, 2, 3, 4, 5],
    yTicks: [0, 1, 2, 3],
    xLabel: 'coefficient a',
    yLabel: 'objective',
  });
  const lossC = sampleCurve(ax1, (x) => softplus(-x), 0, 5, 100);
  const penC = sampleCurve(ax1, (x) => 0.1 * x * x, 0, 5, 100);
  const combC = sampleCurve(ax1, regularizedObjective, 0, 5, 100);

  const view1 = guardedDynamic(
    () => fadeIn(regP.value),
    (vis) => {
      const rp = smooth(regP.value);
      const aNow = mix(4.2, regularizedMinimum, rp);
      const pt = ax1.pt(aNow, regularizedObjective(aNow));
      const nodes = [
        ax1.node,
        neonCurve(lossC, ROLE.score, { width: 3.2, glow: 6, opacity: 0.8 }),
        neonCurve(penC, ROLE.threshold, { width: 3.2, glow: 6, opacity: 0.8 }),
        neonCurve(combC, [ROLE.positive, ROLE.warn], { width: 5, glow: 13 }),
        line([pt[0], ax1.py(0)], pt, { stroke: ROLE.positive, width: 2.5, dash: [6, 6] }),
        glowDot(pt[0], pt[1], { radius: 13, color: ROLE.positive, glow: 16 }),
        // Right legend + minimum readout
        txt('OBJECTIVE TERMS', 515, -195, 26, COSMOS.muted, 'mono'),
        txt('Log loss:  ln(1 + e⁻ᵃ)', 515, -125, 30, ROLE.score, 'mono'),
        txt('L2 penalty:  + 0.1 a²', 515, -60, 30, ROLE.threshold, 'mono'),
        txt('Combined objective', 515, 5, 30, ROLE.positive, 'mono'),
        txt(
          `Finite optimum a* ≈ ${regularizedMinimum.toFixed(3)}`,
          515,
          125,
          34,
          ROLE.good,
          'mono',
        ).glow(8, ROLE.good),
        txt(
          'Squared-weight penalty creates a finite preferred scale',
          0,
          375,
          30,
          COSMOS.muted,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'separable-growth', grow1P, 1, { dur: 0.9 });
  cueTo(s, c, 'separable-again', grow2P, 1, { dur: 0.9 });
  cueTo(s, c, 'regularized-objective', regP, 1, { dur: 1.0 });
}
