// Act 2 (Scenes 7-12): Solver Scale & Conditioning, Hessian Step-Size Bound,
// Polynomial Bend & Ridge/Lasso Shrinkage, Penalty Contract, Gauss-Markov & Intervals, Generalization Finale.
import { circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  bendPredict,
  cinemaGrid,
  cueTo,
  data,
  decorAura,
  eigenStep,
  fadeIn,
  fadeOut,
  glowBar,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  interceptEstimatorState,
  lassoLine,
  mix,
  predict,
  quadratic,
  ridgeLine,
  rule,
  stabilityLimit,
  testMeanSquares,
  testScores,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 7. solver-scale: What does the solver have to store?
// Cues: grow-gram, duplicate-design
// ---------------------------------------------------------------------------
export function solverScale(s, c) {
  const growP = s.value(0);
  const dupP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.data, seed: 7 }));
  s.add(decorAura(0, 20, 560, '#ffd1661c', '#5ce1e614'));

  const headline = heroTitle(['Gram Matrix Scaling', '& QR / SVD Conditioning'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 62,
    accent: ROLE.data,
    eyebrow: 'O(d²) STORAGE  ·  O(d³) FACTORIZATION  ·  κ(XᵀX) = κ(X)²',
  });

  const live = dynamic(() => {
    const gr = growP.value;
    const dp = dupP.value;
    const side = mix(105, 250, gr);
    const cols = Math.round(mix(1000, 10000, gr));
    const mb = (cols * cols * 8) / 1e6;
    const nodes = [];

    // Left: Growing float64 Gram matrix square X^T X (labels cleanly below square)
    nodes.push(
      txt('GRAM MATRIX  XᵀX  (FLOAT64)', -520, -210, 28, ROLE.data, 'mono'),
      rect(side, side, { fill: '#221c0e', stroke: ROLE.data, width: 3.2, radius: 12 })
        .at(-520, -25)
        .glow(10, ROLE.data),
      txt(`${cols.toLocaleString()} × ${cols.toLocaleString()}`, -520, 148, 30, ROLE.data, 'mono'),
      txt(`${mb.toFixed(0)} MB`, -520, 198, 34, COSMOS.ink, 'mono'),
      txt('10× columns → 100× storage (800 MB)', -520, 255, 28, COSMOS.muted, 'sans'),
    );

    nodes.push(rule(0, -210, 0, 290, '#2a3759', 2));

    // Right: Condition number squaring + lstsq rank with duplicate column
    const rx = 80;
    nodes.push(
      txt('CONDITION NUMBER & RANK', rx, -210, 28, ROLE.line, 'mono', 'left'),
      txt('κ(X) ≈ 8.4   →   κ(XᵀX) ≈ 70 (squared!)', rx, -115, 30, ROLE.curve, 'mono', 'left'),
      txt(
        'QR / SVD solves directly on X without squaring κ',
        rx,
        -45,
        28,
        ROLE.good,
        'sans',
        'left',
      ),
      txt(
        dp > 0.2 ? '3 columns [1, x, 2x]  →  rank stays 2!' : '2 columns [1, x]  →  rank = 2',
        rx,
        75,
        32,
        dp > 0.2 ? ROLE.data : ROLE.line,
        'mono',
        'left',
      ).glow(dp > 0.2 ? 9 : 0, ROLE.data),
      txt(
        dp > 0.2
          ? 'lstsq picks minimum-norm weights; same 5 predictions'
          : 'Matches converged gradient descent exactly',
        rx,
        145,
        28,
        COSMOS.ink,
        'serif',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'grow-gram', growP, 1, { dur: 1.1 });
  cueTo(s, c, 'duplicate-design', dupP, 1, { dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 8. step-bound: Which step sizes shrink the error?
// Cues: safe-step, large-step, rate-limit, null-direction
// ---------------------------------------------------------------------------
export function stepBound(s, c) {
  const safeP = s.value(0);
  const largeP = s.value(0);
  const limP = s.value(0);
  const nullP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.line, seed: 8 }));
  s.add(decorAura(0, 30, 560, '#5ce1e61c', '#ff6b8b14'));

  const headline = heroTitle(['Hessian Curvature', '& Stability Limit'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.line,
    eyebrow: 'ERROR MULTIPLIER  (1 − η · λ_max) ∈ (−1, 1)',
  });

  const live = dynamic(() => {
    const sf = safeP.value;
    const lg = largeP.value;
    const lm = limP.value;
    const nl = nullP.value;
    const eSafe = eigenStep(0.05);
    const eLarge = eigenStep(0.2);
    const nodes = [];

    // Ruler [-4, +2] showing contraction strip (-1, +1)
    const x0 = -760;
    const x1 = 760;
    const xOf = (v) => mix(x0, x1, (v + 4.2) / 6.2);
    const ySafe = -75;
    const yLarge = 115;

    // Shaded safe contraction strip (-1, +1)
    const stripL = xOf(-1);
    const stripR = xOf(1);
    nodes.push(
      rect(stripR - stripL, 330, {
        fill: '#6ee7b71a',
        stroke: ROLE.good,
        width: 2.2,
        radius: 12,
      }).at((stripL + stripR) / 2, 20),
      txt('SHRINK ZONE  (−1, +1)', (stripL + stripR) / 2, -175, 26, ROLE.good, 'mono'),
      line([xOf(0), -140], [xOf(0), 190], { stroke: COSMOS.dim, width: 2.2, dash: [6, 5] }),
      txt('0', xOf(0), 220, 26, COSMOS.ink, 'mono'),
      txt('−1', stripL, 220, 26, ROLE.good, 'mono'),
      txt('+1', stripR, 220, 26, ROLE.good, 'mono'),
      txt('−3.7', xOf(-3.73), 220, 26, ROLE.curve, 'mono'),
    );

    // Safe step eta = 0.05 (moves from +1 to -0.183 inside strip!)
    const posSafe = mix(1, eSafe[0].multiplier, sf);
    nodes.push(
      txt(
        `η = 0.05 (SAFE)  →  ×${posSafe.toFixed(2)}`,
        x0,
        ySafe - 46,
        28,
        ROLE.line,
        'mono',
        'left',
      ),
      line([x0, ySafe], [x1, ySafe], { stroke: '#3c4e78', width: 2.4 }),
      glowDot(xOf(posSafe), ySafe, { radius: 13, color: ROLE.line, glow: 13 }),
    );

    // Oversized step eta = 0.20 (jumps to -3.73 outside strip!)
    const posLarge = mix(1, eLarge[0].multiplier, lg);
    nodes.push(
      txt(
        `η = 0.20 (EXPLODES)  →  ×${posLarge.toFixed(2)}`,
        x0,
        yLarge - 46,
        28,
        ROLE.curve,
        'mono',
        'left',
      ),
      line([x0, yLarge], [x1, yLarge], { stroke: '#3c4e78', width: 2.4 }),
      glowDot(xOf(posLarge), yLarge, { radius: 13, color: ROLE.curve, glow: 13 }),
    );

    // Bottom stability bound or flat null direction
    if (nl > 0.1) {
      nodes.push(
        txt(
          'Flat null direction (x & 2x): gradient = 0, so start point sets final weights!',
          0,
          310,
          30,
          ROLE.data,
          'serif',
        )
          .glow(7, ROLE.data)
          .opacity(nl),
      );
    } else if (lm > 0.1) {
      nodes.push(
        txt(
          `Stability bound:  0 < η < 2 / λ_max ≈ ${stabilityLimit.toFixed(4)}  (κ ≈ 70)`,
          0,
          310,
          34,
          ROLE.good,
          'mono',
        )
          .glow(9, ROLE.good)
          .opacity(lm),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'safe-step', safeP, 1, { dur: 0.9 });
  cueTo(s, c, 'large-step', largeP, 1, { dur: 0.9 });
  cueTo(s, c, 'rate-limit', limP, 1, { dur: 0.7 });
  cueTo(s, c, 'null-direction', nullP, 1, { dur: 0.8 });
}

// ---------------------------------------------------------------------------
// 9. complexity: How far does the bend move the forecast?
// Cues: curve-fit, half-question, curve-ridge*, curve-lasso
// ---------------------------------------------------------------------------
export function complexity(s, c) {
  const fitP = s.value(0);
  const halfP = s.value(0);
  const ridgeP = s.value(0);
  const lassoP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.curve, seed: 9 }));
  s.add(decorAura(0, 30, 560, '#ff6b8b1c', '#ffd16614'));

  const headline = heroTitle(['Quadratic Bend,', 'Ridge & Lasso Shrinkage'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.curve,
    eyebrow: 'FEATURE  (x − 3)² − 2  ·  FORECAST AT 600 TOKENS',
  });

  const live = dynamic(() => {
    const ft = fitP.value;
    const hf = halfP.value;
    const rg = ridgeP.value;
    const ls = lassoP.value;
    const cWeight = ls > 0.05 ? mix(-0.5, 0, ls) : rg > 0.05 ? mix(-1, -0.5, rg) : -ft;
    const f600 = bendPredict(6, cWeight);
    const nodes = [];

    // 6 aligned residual-correction rulers (x = 1..5 observed + x = 6 forecast)
    const x0 = -740;
    const x1 = 740;
    const zeroY = 55;
    const xOf = (x) => mix(x0, x1, (x - 0.6) / 5.8);
    const yOf = (delta) => zeroY - delta * 26;

    nodes.push(
      txt(
        `BEND WEIGHT c = ${cWeight.toFixed(2)}   ·   600-TOKEN FORECAST = ${f600.toFixed(1)} MS`,
        x0,
        -210,
        30,
        ROLE.curve,
        'mono',
        'left',
      ),
      line([x0, zeroY], [x1, zeroY], { stroke: ROLE.line, width: 3, dash: [10, 7] }),
      txt('Straight line (0)', x1, zeroY - 36, 26, ROLE.line, 'mono', 'right'),
    );

    for (let x = 1; x <= 6; x++) {
      const px = xOf(x);
      const corr = cWeight * ((x - 3) ** 2 - 2);
      const py = yOf(corr);
      if (x <= 5) {
        const obsDelta = data[x - 1].y - predict(x);
        nodes.push(circle(16, { fill: null, stroke: ROLE.data, width: 3 }).at(px, yOf(obsDelta)));
      }
      nodes.push(
        line([px, zeroY], [px, py], { stroke: ROLE.curve, width: 4 }).glow(8, ROLE.curve),
        glowDot(px, py, { radius: 11, color: ROLE.curve, glow: 12 }),
        txt(`${x * 100}t`, px, 290, 26, x === 6 ? ROLE.curve : COSMOS.muted, 'mono'),
      );
    }

    nodes.push(
      txt(
        ls > 0.3
          ? 'Lasso pushes bend weight to exact 0 → forecast returns to 220 ms'
          : rg > 0.2
            ? 'Ridge (λ = 2.8) halves bend to −0.5 → forecast = 216.5 ms'
            : hf > 0.2
              ? 'Full bend = 213 ms · Where does half that correction land?'
              : 'c = −1 lands inside all 5 gold rings',
        0,
        355,
        30,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'curve-fit', fitP, 1, { dur: 0.9 });
  cueTo(s, c, 'half-question', halfP, 1, { dur: 0.65 });
  cueTo(s, c, 'curve-ridge', ridgeP, 1, { after: true, dur: 0.85 });
  cueTo(s, c, 'curve-lasso', lassoP, 1, { dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 10. penalty-contract: Which coefficient pays the penalty?
// Cues: ridge-slope, ridge-intercept, lasso-slope
// ---------------------------------------------------------------------------
export function penaltyContract(s, c) {
  const rsP = s.value(0);
  const riP = s.value(0);
  const lsP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.ridge, seed: 10 }));
  s.add(decorAura(0, 30, 560, '#60a5fa1c', '#ff6b8b14'));

  const headline = heroTitle(['Never Penalize', 'the Intercept'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.ridge,
    eyebrow: 'FREE INTERCEPT PIVOTS THROUGH (x̄, ȳ) = (3, 160)',
  });

  const live = dynamic(() => {
    const rs = rsP.value;
    const ri = riP.value;
    const ls = lsP.value;
    let m = 20;
    let b = 100;
    let label = 'UNPENALIZED OLS:  b = 100,  m = 20';
    let col = ROLE.line;

    if (ls > 0.05) {
      const lLine = lassoLine(80 * ls);
      m = lLine.slope;
      b = lLine.intercept;
      label = `LASSO (FREE INTERCEPT):  b = ${b.toFixed(0)},  m = ${m.toFixed(1)} → FLAT!`;
      col = ROLE.curve;
    } else if (ri > 0.05) {
      m = mix(10, 12.2, ri);
      b = mix(130, 82, ri);
      label = 'PENALIZING INTERCEPT PULLS LINE OFF (x̄, ȳ)!';
      col = ROLE.warn;
    } else if (rs > 0.05) {
      const rLine = ridgeLine(2 * rs);
      m = rLine.slope;
      b = rLine.intercept;
      label = `RIDGE (λ = 2, FREE b):  b = ${b.toFixed(0)},  m = ${m.toFixed(1)}`;
      col = ROLE.ridge;
    }

    const gx0 = -740;
    const gx1 = 740;
    const gy0 = 265;
    const gy1 = -185;
    const xOf = (x) => mix(gx0, gx1, x / 5.5);
    const yOf = (y) => mix(gy0, gy1, (y - 60) / 165);

    const nodes = [
      txt(label, gx0, -215, 30, col, 'mono', 'left').glow(7, col),
      line([gx0, gy0], [gx1, gy0], { stroke: '#425582', width: 2.6 }),
      line([gx0, gy0], [gx0, gy1], { stroke: '#425582', width: 2.6 }),
      glowingTrail(
        [
          [xOf(0.4), yOf(b + m * 0.4)],
          [xOf(5.2), yOf(b + m * 5.2)],
        ],
        { color: col, width: 4.8, glow: 11 },
      ),
      ...data.map((row) =>
        glowDot(xOf(row.x), yOf(row.y), { radius: 9, color: ROLE.data, glow: 8 }),
      ),
      // Green training mean ring at (3, 160)
      circle(18, { fill: null, stroke: ROLE.good, width: 3.5 })
        .at(xOf(3), yOf(160))
        .glow(10, ROLE.good),
      txt('Green ring: training mean (300t, 160ms)', gx1, gy0 + 48, 26, ROLE.good, 'mono', 'right'),
    ];

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'ridge-slope', rsP, 1, { dur: 0.9 });
  cueTo(s, c, 'ridge-intercept', riP, 1, { dur: 0.9 });
  cueTo(s, c, 'lasso-slope', lsP, 1, { dur: 1.0 });
}

// ---------------------------------------------------------------------------
// 11. statistical-contract: What varies if we collect the timings again?
// Cues: weights-spread, resample-errors, future-interval, match-rows
// ---------------------------------------------------------------------------
export function statisticalContract(s, c) {
  const spP = s.value(0);
  const resP = s.value(0);
  const futP = s.value(0);
  const matP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.good, seed: 11 }));
  s.add(decorAura(0, 30, 560, '#6ee7b71c', '#ff6b8b14'));

  const headline = heroTitle(['Gauss-Markov, Intervals', '& Shape Hygiene'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 62,
    accent: ROLE.good,
    eyebrow: '32 NOISE OUTCOMES · CONFIDENCE VS PREDICTION · (5,) VS (5, 1)',
  });

  // View 1: Gauss-Markov 32 noise patterns (OLS var 1.10 vs other unbiased var 2.06)
  const view1 = guardedDynamic(
    () => fadeOut(futP.value),
    (vis) => {
      const sp = spP.value;
      const ev = interceptEstimatorState(sp);
      const x0 = -740;
      const x1 = 740;
      const xOf = (v) => mix(x0, x1, (v - 96.5) / 7);
      const nodes = [
        txt(
          '32 POSSIBLE ±1 MS NOISE PATTERNS  (TRUE INTERCEPT = 100)',
          x0,
          -205,
          26,
          ROLE.line,
          'mono',
          'left',
        ),
        line([xOf(100), -150], [xOf(100), 215], { stroke: ROLE.good, width: 3, dash: [8, 6] }),
        txt('OLS INTERCEPT  (Var = 1.10)', x0, -100, 28, ROLE.good, 'mono', 'left'),
        ...ev.olsEstimates.map((v, i) =>
          glowDot(xOf(v), -35 + ((i % 5) - 2) * 10, { radius: 6, color: ROLE.good, glow: 7 }),
        ),
        txt(
          `OTHER UNBIASED RULE  (Var = ${ev.otherVariance.toFixed(2)})`,
          x0,
          80,
          28,
          ROLE.curve,
          'mono',
          'left',
        ),
        ...ev.otherEstimates.map((v, i) =>
          glowDot(xOf(v), 145 + ((i % 5) - 2) * 10, { radius: 6, color: ROLE.curve, glow: 7 }),
        ),
        txt(
          resP.value > 0.2
            ? 'Fitted residuals are tied together by Σr = 0 and Σxr = 0'
            : 'Gauss-Markov: OLS has minimum variance among linear unbiased estimators',
          0,
          285,
          30,
          COSMOS.ink,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  // View 2: 95% Confidence vs Prediction Interval + (5,) vs (5, 1) broadcasting bug
  const view2 = guardedDynamic(
    () => fadeIn(futP.value),
    (vis) => {
      const mt = matP.value;
      const nodes = [];
      const x0 = -760;
      nodes.push(
        txt(
          '95% INTERVALS AT 600 TOKENS (POINT FORECAST = 220 MS)',
          x0,
          -205,
          26,
          ROLE.good,
          'mono',
          'left',
        ),
        txt('Mean CI:', x0, -110, 28, ROLE.good, 'mono', 'left'),
        glowBar(-160, -110, 440, 34, ROLE.good, { glow: 10 }),
        txt('Future reply PI:', x0, -25, 28, ROLE.curve, 'mono', 'left'),
        glowBar(-340, -25, 800, 34, ROLE.curve, { glow: 10 }),
        txt('220 ms', 60, -162, 28, ROLE.data, 'mono'),

        rule(-760, 65, 760, 65, '#2a3759', 2),
        txt(
          'SHAPE BUG:  y_col (5, 1) − pred (5,)  →  25-CELL (5, 5) MATRIX!',
          x0,
          125,
          28,
          mt > 0.2 ? ROLE.good : ROLE.warn,
          'mono',
          'left',
        ),
        txt(
          mt > 0.2
            ? 'FIXED:  y.ravel() (5,) − pred (5,)  →  5 matched pairs!'
            : 'Every target subtracted from every prediction silently!',
          x0,
          210,
          34,
          mt > 0.2 ? ROLE.good : ROLE.curve,
          'mono',
          'left',
        ).glow(9, mt > 0.2 ? ROLE.good : ROLE.curve),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  cueTo(s, c, 'weights-spread', spP, 1, { dur: 0.9 });
  cueTo(s, c, 'resample-errors', resP, 1, { dur: 0.7 });
  cueTo(s, c, 'future-interval', futP, 1, { dur: 0.85 });
  cueTo(s, c, 'match-rows', matP, 1, { dur: 0.8 });
}

// ---------------------------------------------------------------------------
// 12. generalize: What do the held-out requests say? (FINALE)
// Cues: test-predict, test-reveal*, test-errors*, test-second*, second-errors,
//       compare-both, square-errors, pooled-score*, use-fallback
// ---------------------------------------------------------------------------
export function generalize(s, c) {
  const predP = s.value(0);
  const rev1P = s.value(0);
  const err1P = s.value(0);
  const rev2P = s.value(0);
  const err2P = s.value(0);
  const cmpP = s.value(0);
  const sqP = s.value(0);
  const poolP = s.value(0);
  const fallP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.data, seed: 12 }));
  s.add(decorAura(0, 20, 580, '#ffd1661c', '#5ce1e614'));

  const headline = heroTitle(['Held-Out Generalization', '& Extrapolation Risk'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 62,
    accent: ROLE.data,
    eyebrow: 'LINE = 220 MS  VS  CURVE = 213 MS  AT 600 TOKENS',
  });

  // View 1: Two held-out 600-token replays (219 ms, then 214 ms -> tie at 18.5 ms^2!)
  const view1 = guardedDynamic(
    () => fadeOut(fallP.value),
    (vis) => {
      const r1 = rev1P.value;
      const e1 = err1P.value;
      const r2 = rev2P.value;
      const e2 = err2P.value;
      const cm = cmpP.value;
      const sq = sqP.value;
      const pl = poolP.value;
      const nodes = [];

      const rx0 = -720;
      const rx1 = 720;
      const ry = -60;
      const xOf = (ms) => mix(rx0, rx1, (ms - 210) / 13);

      nodes.push(
        txt('FIXED FORECASTS AT 600 TOKENS', rx0, -205, 26, COSMOS.muted, 'mono', 'left'),
        line([rx0, ry], [rx1, ry], { stroke: '#455a88', width: 3.5 }),
        glowDot(xOf(213), ry, { radius: 13, color: ROLE.curve, glow: 12 }),
        txt('Curve: 213', xOf(213), ry - 48, 28, ROLE.curve, 'mono'),
        glowDot(xOf(220), ry, { radius: 13, color: ROLE.line, glow: 12 }),
        txt('Line: 220', xOf(220), ry - 48, 28, ROLE.line, 'mono'),
      );

      if (r1 > 0.1 && r2 < 0.2) {
        nodes.push(
          glowDot(xOf(219), ry, { radius: 14, color: ROLE.data, glow: 14, opacity: r1 }),
          txt('Replay 1 = 219 ms', xOf(219), ry + 54, 28, ROLE.data, 'mono').opacity(r1),
        );
        if (e1 > 0.1) {
          nodes.push(
            txt(
              'Line miss: +1 ms   ·   Curve miss: −6 ms  (Line wins Replay 1)',
              0,
              125,
              32,
              ROLE.line,
              'mono',
            ).opacity(e1),
          );
        }
      } else if (r2 > 0.1) {
        nodes.push(
          glowDot(xOf(214), ry, { radius: 14, color: ROLE.data, glow: 14, opacity: r2 }),
          txt('Replay 2 = 214 ms', xOf(214), ry + 54, 28, ROLE.data, 'mono').opacity(r2),
        );
        if (e2 > 0.1) {
          nodes.push(
            txt(
              'Curve miss: −1 ms   ·   Line miss: +6 ms  (Curve wins Replay 2)',
              0,
              105,
              30,
              ROLE.curve,
              'mono',
            ).opacity(e2),
          );
        }
      }

      if (cm > 0.1 || sq > 0.1) {
        nodes.push(
          txt(
            sq > 0.2
              ? 'Squared misses:  Line (1 + 36) / 2   vs   Curve (36 + 1) / 2'
              : 'Replay 1 (219)  +  Replay 2 (214)',
            0,
            195,
            30,
            COSMOS.ink,
            'mono',
          ),
        );
      } else {
        nodes.push(
          txt(
            'HOLD-OUT REPLAYS AT 600 TOKENS:  LINE 220 ms  vs  CURVE 213 ms',
            0,
            195,
            28,
            COSMOS.dim,
            'mono',
          ),
        );
      }
      nodes.push(
        txt(
          pl > 0.1
            ? `EXACT TIE:  ${testMeanSquares.line.toFixed(1)} ms²  vs  ${testMeanSquares.curve.toFixed(1)} ms²`
            : 'Held-out MSE score:  Line = ?   ·   Curve = ?',
          0,
          285,
          pl > 0.1 ? 42 : 30,
          pl > 0.1 ? ROLE.data : COSMOS.dim,
          'mono',
        )
          .glow(pl > 0.1 ? 11 : 0, ROLE.data)
          .opacity(mix(0.6, 1, pl)),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 2: 5,000-token extrapolation warning ruler
  const view2 = guardedDynamic(
    () => fadeIn(fallP.value),
    (vis) => {
      const rx0 = -760;
      const rx1 = 760;
      const ry = 20;
      const xOf = (t) => mix(rx0, rx1, t / 5200);
      return group(
        txt(
          'EXTRAPOLATION RANGE CHECK  (100 TO 5,000 TOKENS)',
          rx0,
          -205,
          28,
          ROLE.curve,
          'mono',
          'left',
        ),
        line([rx0, ry], [rx1, ry], { stroke: '#455a88', width: 3.5 }),
        glowBar(xOf(100), ry, xOf(500) - xOf(100), 34, ROLE.line, { glow: 10 }),
        txt('Train [100–500]', xOf(300), ry - 54, 26, ROLE.line, 'mono'),
        glowDot(xOf(600), ry, { radius: 9, color: ROLE.data, glow: 10 }),
        txt('600', xOf(600), ry + 54, 26, ROLE.data, 'mono'),
        glowDot(xOf(5000), ry, { radius: 16, color: ROLE.curve, glow: 15 }),
        txt('5,000 tokens!', xOf(5000), ry - 56, 32, ROLE.curve, 'mono', 'right').glow(
          9,
          ROLE.curve,
        ),
        txt(
          'Measure under real load at 5,000 tokens before quoting latency',
          0,
          225,
          34,
          COSMOS.ink,
          'serif',
        ),
      ).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  cueTo(s, c, 'test-predict', predP, 1, { dur: 0.7 });
  cueTo(s, c, 'test-reveal', rev1P, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'test-errors', err1P, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'test-second', rev2P, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'second-errors', err2P, 1, { dur: 0.65 });
  cueTo(s, c, 'compare-both', cmpP, 1, { dur: 0.65 });
  cueTo(s, c, 'square-errors', sqP, 1, { dur: 0.65 });
  cueTo(s, c, 'pooled-score', poolP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'use-fallback', fallP, 1, { dur: 0.9 });
}
