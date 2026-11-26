// Act 4 (Scenes 21-26): Feature Standardization Units, Numerical Stability (exp(-1000)),
// Routing Threshold & 100-Request Calibration, Triangle Universal Approximation,
// Approximation Conditions & Interior Ambiguity, Dual-Circuit Dimmer Payoff (3D Surface Comparison).
import { circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  REQUESTS,
  REQUEST_IDS,
  ROLE,
  approximation,
  beatTo,
  cinemaGrid,
  cinematic3d,
  cueTo,
  decorAura,
  differenceLamp,
  fadeIn,
  fadeOut,
  forward,
  glowBadge,
  glowBar,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  livingDrift,
  mix,
  numCell,
  orbitScene,
  point3d,
  requestForward,
  rule,
  stableBce,
  standardize,
  surface,
  targetCurve,
  triangle,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 21. units: Changing the units changes the optimization
// Cues: raw-scale, standardize-features, reuse-training-stats
// ---------------------------------------------------------------------------
export function units(s, c) {
  const rawP = s.value(0);
  const stdP = s.value(0);
  const reuP = s.value(0);
  const drift = s.value(0);

  const zStd = standardize([8, 900], [5, 500], [2, 200]); // [1.5, 2.0]

  s.add(cinemaGrid({ accent: ROLE.dark, seed: 21 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61a', '#6ee7b714'));

  const headline = heroTitle(['Standardizing Units', 'Balances Feature Scales'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.dark,
    eyebrow: 'RAW [QUEUE = 8, TOKENS = 900]  →  STANDARDIZED [1.5, 2.0]',
  });

  const live = dynamic(() => {
    const st = stdP.value;
    const ru = reuP.value;
    const qW = mix(28, 420, st);
    const tW = mix(1120, 560, st);
    return group(
      txt(
        st > 0.4
          ? 'STANDARDIZED CONTRIBUTIONS  (x − μ_train) / σ_train'
          : 'RAW UNITS ON ONE SHARED SCALE  (TOKENS DWARF QUEUE!)',
        -800,
        -195,
        28,
        st > 0.4 ? ROLE.good : ROLE.grad,
        'mono',
        'left',
      ),
      txt('Queue wait', -800, -75, 32, ROLE.dark, 'mono', 'left'),
      glowBar(-460, -75, qW, 46, ROLE.dark, { glow: 9 }),
      txt(
        st > 0.4 ? `z = ${zStd[0].toFixed(1)}` : 'raw = 8',
        -460 + qW + 26,
        -75,
        30,
        ROLE.dark,
        'mono',
        'left',
      ),

      txt('Prompt tokens', -800, 55, 32, ROLE.lit, 'mono', 'left'),
      glowBar(-460, 55, tW, 46, ROLE.lit, { glow: 9 }),
      txt(
        st > 0.4 ? `z = ${zStd[1].toFixed(1)}` : 'raw = 900',
        -460 + tW + 26,
        55,
        30,
        ROLE.lit,
        'mono',
        'left',
      ),

      txt(
        ru > 0.2
          ? 'FREEZE TRAINING (μ, σ) = ([5, 500], [2, 200]) FOR VALIDATION & SERVING!'
          : 'Training statistics travel with the model; never refit on the test split',
        0,
        245,
        30,
        ru > 0.2 ? ROLE.good : COSMOS.ink,
        'mono',
      ).glow(ru > 0.2 ? 8 : 0, ROLE.good),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'raw-scale', rawP, 1, { dur: 0.7 });
  cueTo(s, c, 'standardize-features', stdP, 1, { dur: 0.95 });
  cueTo(s, c, 'reuse-training-stats', reuP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 22. stable: Keep the computation finite (z = -1000)
// Cues: overflow-example, stable-sigmoid, stable-logit-loss
// ---------------------------------------------------------------------------
export function stable(s, c) {
  const ovP = s.value(0);
  const sgP = s.value(0);
  const lgP = s.value(0);
  const drift = s.value(0);

  const lossFinite = stableBce(-1000, 1); // 1000

  s.add(cinemaGrid({ accent: ROLE.good, seed: 22 }));
  s.add(decorAura(0, 20, 560, '#6ee7b71a', '#ff6b8b14'));

  const headline = heroTitle(['Log-Sum-Exp Stability', 'at Extreme Logits'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'LOGIT z = −1,000,  TARGET y = 1  ·  PASS LOGITS DIRECTLY TO BCE',
  });

  const live = dynamic(() => {
    const sg = sgP.value;
    const lg = lgP.value;
    return group(
      // Row 1: Naive overflow
      txt('NAIVE  1 / (1 + exp(1000))', -800, -175, 28, ROLE.grad, 'mono', 'left'),
      numCell('OVERFLOW!  exp(1000) = ∞', 240, -175, {
        w: 560,
        h: 66,
        stroke: ROLE.grad,
        textColor: ROLE.grad,
        glow: 10,
      }),

      // Row 2: Stable negative-branch sigmoid (safe, but rounds to 0 -> log(0) = -inf)
      txt('STABLE BRANCH  eᶻ / (1 + eᶻ)', -800, -35, 28, ROLE.lit, 'mono', 'left').opacity(
        mix(0.45, 1, sg),
      ),
      numCell('e⁻¹⁰⁰⁰ → 0.0   (log(0) = −∞!)', 240, -35, {
        w: 560,
        h: 66,
        stroke: ROLE.lit,
        textColor: ROLE.lit,
        glow: sg > 0.2 ? 9 : 0,
        opacity: mix(0.45, 1, sg),
      }),

      // Row 3: Direct BCEWithLogits
      txt('DIRECT BCE WITH LOGITS', -800, 105, 28, ROLE.good, 'mono', 'left').opacity(
        mix(0.45, 1, lg),
      ),
      numCell(`FINITE LOSS = ${lossFinite.toFixed(0)}`, 240, 105, {
        w: 560,
        h: 68,
        size: 34,
        stroke: ROLE.good,
        textColor: ROLE.good,
        glow: lg > 0.2 ? 12 : 0,
        opacity: mix(0.45, 1, lg),
      }),

      glowTex('\\max(z, 0) - y z + \\log(1 + e^{-|z|})', {
        x: 0,
        y: 250,
        size: 46,
        color: lg > 0.2 ? ROLE.good : COSMOS.muted,
      }),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'overflow-example', ovP, 1, { dur: 0.7 });
  cueTo(s, c, 'stable-sigmoid', sgP, 1, { dur: 0.75 });
  cueTo(s, c, 'stable-logit-loss', lgP, 1, { dur: 0.8 });
}

// ---------------------------------------------------------------------------
// 23. checked-risk-report: Which requests take the slow path? (Threshold + Calibration)
// Cues: checked-risk-report-beat-0, route-policy-result*, checked-risk-report-beat-1,
//       calibration-sample, count-timeouts, calibration-bucket-result*, checked-risk-report-beat-2
// ---------------------------------------------------------------------------
export function checkedRiskReport(s, c) {
  const b0P = s.value(0);
  const rtP = s.value(0);
  const b1P = s.value(0);
  const beat1P = s.value(0);
  const calP = s.value(0);
  const cntP = s.value(0);
  const resP = s.value(0);
  const b2P = s.value(0);
  const drift = s.value(0);

  const scores = REQUESTS.map((x) => requestForward(x).score);

  s.add(cinemaGrid({ accent: ROLE.lit, seed: 23 }));
  s.add(decorAura(0, 20, 560, '#ffd1661a', '#5ce1e614'));

  const headline = heroTitle(['Routing Thresholds vs', 'Empirical Calibration'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.lit,
    eyebrow: 'THRESHOLD 0.60 → 0.62  ·  100 HELD-OUT REQUESTS AT 0.93',
  });

  // View 1 (Beat 0): 4 fixed score marks vs sliding policy threshold 0.60 -> 0.62
  const view1 = guardedDynamic(
    () => fadeOut(beat1P.value),
    (vis) => {
      const rt = rtP.value;
      const b1 = b1P.value;
      const thresh = mix(0.6, 0.62, b1);
      const x0 = -360;
      const x1 = 440;
      const xOf = (p) => mix(x0, x1, (p - 0.38) / 0.3);
      const cutX = xOf(thresh);
      const nodes = [
        txt('REQUEST', -740, -205, 26, COSMOS.muted, 'mono'),
        txt('FIXED SCORE', -480, -205, 26, ROLE.dark, 'mono'),
        txt('ROUTE POLICY', 660, -205, 26, ROLE.lit, 'mono'),
        line([cutX, -165], [cutX, 200], { stroke: ROLE.lit, width: 4 }).glow(10, ROLE.lit),
        txt(`Threshold ${thresh.toFixed(2)}`, cutX, 245, 30, ROLE.lit, 'mono'),
      ];

      scores.forEach((p, i) => {
        const y = -110 + i * 95;
        const slow = p >= thresh;
        nodes.push(
          txt(REQUEST_IDS[i], -740, y, 28, COSMOS.ink, 'mono'),
          txt(p.toFixed(3), -480, y, 30, ROLE.dark, 'mono'),
          rule(x0, y, x1, y, '#2b3b60', 2.4),
          glowDot(xOf(p), y, {
            radius: 13,
            color: slow && rt > 0.2 ? ROLE.lit : ROLE.dark,
            glow: 10,
          }),
          txt(
            rt > 0.2 ? (slow ? 'SLOW PATH' : 'fast path') : '?',
            660,
            y,
            28,
            rt > 0.2 ? (slow ? ROLE.lit : COSMOS.muted) : COSMOS.dim,
            'mono',
          ),
        );
      });
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beats 1-2): 100-request held-out calibration grid (93 / 100 timed out!)
  const view2 = guardedDynamic(
    () => fadeIn(beat1P.value),
    (vis) => {
      const cnt = cntP.value;
      const rs = resP.value;
      const b2 = b2P.value;
      const revealed = Math.round(100 * Math.max(cnt * 0.5, rs));
      const nodes = [txt('100 HELD-OUT REQUESTS SCORED 0.93', -440, -210, 28, ROLE.dark, 'mono')];
      for (let i = 0; i < 100; i += 1) {
        const cx = -670 + (i % 10) * 50;
        const cy = -140 + Math.floor(i / 10) * 42;
        const active = i < revealed;
        const hit = i < 93;
        nodes.push(
          rect(36, 30, {
            fill: active ? (hit ? ROLE.dark : '#2b3b60') : '#10182b',
            stroke: active ? (hit ? ROLE.dark : COSMOS.muted) : '#222f4d',
            width: 1.5,
            radius: 5,
          }).at(cx, cy),
        );
      }

      const rx = 120;
      nodes.push(
        txt('ASSIGNED SCORE', rx, -125, 26, COSMOS.muted, 'mono', 'left'),
        txt('0.93', rx, -55, 58, ROLE.dark, 'mono', 'left').glow(10, ROLE.dark),
        txt('OBSERVED FREQUENCY', rx, 55, 26, COSMOS.muted, 'mono', 'left'),
        txt(
          rs > 0.2 ? '93 / 100 = 0.93  (CALIBRATED!)' : `Checking... ${revealed} / 100`,
          rx,
          125,
          36,
          rs > 0.2 ? ROLE.good : ROLE.lit,
          'mono',
          'left',
        ).glow(rs > 0.2 ? 10 : 0, ROLE.good),
        txt(
          b2 > 0.2
            ? 'Check all score buckets on held-out traffic; fit calibrators on separate data'
            : 'A score is a calibrated probability only when observed frequencies match it',
          0,
          315,
          29,
          COSMOS.ink,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'checked-risk-report-beat-0', b0P, 1, { dur: 0.7 });
  cueTo(s, c, 'route-policy-result', rtP, 1, { dur: 0.65, after: true });
  cueTo(s, c, 'checked-risk-report-beat-1', b1P, 1, { dur: 0.9 });
  beatTo(s, c, 1, beat1P, 1, { dur: 0.8 });
  cueTo(s, c, 'calibration-sample', calP, 1, { dur: 0.65 });
  cueTo(s, c, 'count-timeouts', cntP, 1, { dur: 0.75 });
  cueTo(s, c, 'calibration-bucket-result', resP, 1, { dur: 0.8, after: true });
  cueTo(s, c, 'checked-risk-report-beat-2', b2P, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 24. approximation: More hinges can build a curve
// Cues: complete-triangle, assemble-triangles, refine-approximation
// ---------------------------------------------------------------------------
export function approximationScene(s, c) {
  const triP = s.value(0);
  const asmP = s.value(0);
  const refP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.lit, seed: 24 }));
  s.add(decorAura(0, 20, 560, '#ffd1661a', '#5ce1e614'));

  const headline = heroTitle(['Shifted ReLU Triangles', 'Approximate Any Curve'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.lit,
    eyebrow: '3 HINGES = 1 COMPACT TRIANGLE  ·  FINER SPACING SHRINKS ERROR',
  });

  const live = dynamic(() => {
    const tr = triP.value;
    const as = asmP.value;
    const rf = refP.value;
    const segs = rf > 0.35 ? 12 : as > 0.2 ? 4 : 0;
    const nodes = [];

    const gx0 = -760;
    const gx1 = 760;
    const gy0 = 195;
    const gy1 = -185;
    const xOf = (x) => mix(gx0, gx1, x / 4);
    const yOf = (y) => mix(gy0, gy1, y / 1.15);

    nodes.push(rule(gx0, gy0, gx1, gy0, '#3b4e78', 3), rule(gx0, gy0, gx0, gy1, '#3b4e78', 3));

    if (segs === 0) {
      // Single closed triangle: ReLU(x) - 2 ReLU(x-1) + tr * ReLU(x-2)
      const pts = [];
      for (let i = 0; i <= 40; i += 1) {
        const x = mix(0, 3.5, i / 40);
        const y = Math.max(0, x) - 2 * Math.max(0, x - 1) + tr * Math.max(0, x - 2);
        pts.push([xOf(x), yOf(Math.max(-0.2, y))]);
      }
      nodes.push(
        glowingTrail(pts, { color: ROLE.lit, width: 5, glow: 12 }),
        txt(
          tr > 0.3
            ? '3rd ReLU closes the right tail cleanly back to zero → 1 compact triangle!'
            : 'Two hinges drop below zero past x = 2; add a 3rd shifted ReLU!',
          0,
          290,
          30,
          ROLE.lit,
          'serif',
        ),
      );
    } else {
      // Gray target curve + piecewise linear ReLU triangle sum
      const tPts = [];
      const aPts = [];
      let maxErr = 0;
      for (let i = 0; i <= 80; i += 1) {
        const x = (i / 80) * 4;
        const ty = targetCurve(x);
        const ay = approximation(x, segs);
        maxErr = Math.max(maxErr, Math.abs(ty - ay));
        tPts.push([xOf(x), yOf(ty)]);
        aPts.push([xOf(x), yOf(ay)]);
      }
      nodes.push(
        glowingTrail(tPts, { color: COSMOS.muted, width: 3.2, glow: 4, opacity: 0.7 }),
        glowingTrail(aPts, { color: ROLE.lit, width: 4.8, glow: 12 }),
        txt(
          `SEGMENTS = ${segs}    ·    MAX GRID ERROR = ${maxErr.toFixed(4)}`,
          0,
          -205,
          30,
          rf > 0.35 ? ROLE.good : ROLE.lit,
          'mono',
        ).glow(rf > 0.35 ? 10 : 6, rf > 0.35 ? ROLE.good : ROLE.lit),
        txt(
          rf > 0.35
            ? 'Finer triangle spacing hugs the smooth target uniformly across [0, 4]!'
            : 'Weighted shifted triangles stitch straight segments along the target curve',
          0,
          290,
          30,
          COSMOS.ink,
          'serif',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'complete-triangle', triP, 1, { dur: 0.9 });
  cueTo(s, c, 'assemble-triangles', asmP, 1, { dur: 0.85 });
  cueTo(s, c, 'refine-approximation', refP, 1, { dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 25. approximation-conditions: What can a wider layer guarantee?
// Cues: approximation-conditions-beat-0, approximation-conditions-beat-1,
//       polynomial-width, approximation-conditions-beat-2, straight-fit,
//       bow-fit, probe-fit, fit-values*
// ---------------------------------------------------------------------------
export function approximationConditions(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const polyP = s.value(0);
  const beat2P = s.value(0);
  const b2P = s.value(0);
  const strP = s.value(0);
  const bowP = s.value(0);
  const prbP = s.value(0);
  const valP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.gate, seed: 25 }));
  s.add(decorAura(0, 20, 560, '#a78bfa1a', '#ffd16614'));

  const headline = heroTitle(['Universal Approximation:', 'Limits & Interior Freedom'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.gate,
    eyebrow: 'NON-POLYNOMIAL ACTIVATION  ·  COMPACT DOMAIN  ·  GENERALIZATION',
  });

  // View 1 (Beats 0-1): Polynomial activation degree trap (width adds terms, degree stays 2!)
  const view1 = guardedDynamic(
    () => fadeOut(beat2P.value),
    (vis) => {
      const pl = polyP.value;
      return group(
        txt('WHY POLYNOMIAL ACTIVATIONS FAIL UNIVERSALITY', 0, -200, 28, ROLE.grad, 'mono'),
        glowTex('\\sum_{i=1}^{W} c_i (a_i x + b_i)^2 = A x^2 + B x + C', {
          x: 0,
          y: -65,
          size: 48,
          color: ROLE.lit,
        }),
        txt(
          pl > 0.2
            ? 'Width W = 1, 10, or 10,000 → highest power STILL stays at x²!'
            : 'Requires biases, continuous non-polynomial activation, and a compact domain',
          0,
          85,
          32,
          pl > 0.2 ? ROLE.grad : COSMOS.ink,
          'mono',
        ),
        txt(
          'Only non-polynomial gates (ReLU, sigmoid, tanh, GELU) unlock arbitrary degree',
          0,
          215,
          30,
          ROLE.good,
          'serif',
        ),
      ).opacity(vis);
    },
  );

  // View 2 (Beat 2): Two curves pinned at (0,0) and (1,1) diverging at x=0.25 (0.25 vs 1.00)
  const view2 = guardedDynamic(
    () => fadeIn(beat2P.value),
    (vis) => {
      const st = strP.value;
      const bw = bowP.value;
      const pr = prbP.value;
      const vl = valP.value;
      const gx0 = -640;
      const gx1 = 640;
      const gy0 = 200;
      const gy1 = -175;
      const xOf = (x) => mix(gx0, gx1, x);
      const yOf = (y) => mix(gy0, gy1, y / 1.25);

      const bowPts = [];
      for (let i = 0; i <= 50; i += 1) {
        const x = i / 50;
        const y = x + 3 * Math.sin(Math.PI * x) * (1 - x) * 0.56; // hits 0 at 0, 1 at 1, ~1.0 at x=0.25
        bowPts.push([
          xOf(x),
          yOf(x === 0 ? 0 : x === 1 ? 1 : Math.min(1.12, x + 4 * x * (1 - x) * 1.0)),
        ]);
      }
      const nodes = [
        rule(gx0, gy0, gx1, gy0, '#3b4e78', 2.8),
        rule(gx0, gy0, gx0, gy1, '#3b4e78', 2.8),
        // Straight line through (0,0) and (1,1)
        line([xOf(0), yOf(0)], [xOf(1), yOf(1)], { stroke: ROLE.dark, width: 4.2 })
          .glow(9, ROLE.dark)
          .opacity(mix(0.35, 1, st)),
        // Bowed curve through (0,0), (0.25, 1.0), and (1,1)
        glowingTrail(bowPts, { color: ROLE.gate, width: 4.5, glow: 10, opacity: mix(0.25, 1, bw) }),
        // Observed endpoints
        glowDot(xOf(0), yOf(0), { radius: 14, color: ROLE.lit, glow: 13 }),
        glowDot(xOf(1), yOf(1), { radius: 14, color: ROLE.lit, glow: 13 }),
        // Probe line at x = 0.25
        line([xOf(0.25), gy0], [xOf(0.25), gy1], {
          stroke: ROLE.lit,
          width: 3,
          dash: [8, 6],
        }).opacity(mix(0.2, 1, pr)),
        txt('x = 0.25', xOf(0.25), gy0 + 45, 26, ROLE.lit, 'mono'),
        txt(
          vl > 0.2
            ? 'At x = 0.25: straight line predicts 0.25  vs  bowed curve predicts 1.00!'
            : 'Both curves fit the endpoints with ZERO training error; what happens inside?',
          0,
          305,
          30,
          vl > 0.2 ? ROLE.lit : COSMOS.ink,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'approximation-conditions-beat-0', b0P, 1, { dur: 0.7 });
  cueTo(s, c, 'approximation-conditions-beat-1', b1P, 1, { dur: 0.7 });
  cueTo(s, c, 'polynomial-width', polyP, 1, { dur: 0.75 });
  beatTo(s, c, 2, beat2P, 1, { dur: 0.8 });
  cueTo(s, c, 'approximation-conditions-beat-2', b2P, 1, { dur: 0.6 });
  cueTo(s, c, 'straight-fit', strP, 1, { dur: 0.7 });
  cueTo(s, c, 'bow-fit', bowP, 1, { dur: 0.75 });
  cueTo(s, c, 'probe-fit', prbP, 1, { dur: 0.7 });
  cueTo(s, c, 'fit-values', valP, 1, { dur: 0.7, after: true });
}

// ---------------------------------------------------------------------------
// 26. payoff: Which lamp reading would settle it? (SIGNATURE 3D DUAL SURFACES)
// Cues: final-lamp-probe, second-dimmer, dimmer-hinges*, final-lamp-reveal*,
//       difference-circuit, interior-setting, difference-result*, final-meaning
// ---------------------------------------------------------------------------
export function payoff(s, c) {
  const p1P = s.value(0);
  const p2P = s.value(0);
  const hngP = s.value(0);
  const revP = s.value(0);
  const difP = s.value(0);
  const intP = s.value(0);
  const drsP = s.value(0);
  const finP = s.value(0);
  const drift = s.value(0);

  const sumOut = forward([0.8, 0.5]); // h=[1.3, 0.3], y=0.7
  const diffOut = differenceLamp([0.8, 0.5]); // h=[0.3, 0.0], y=0.3

  s.add(cinemaGrid({ accent: ROLE.lit, seed: 26 }));
  s.add(decorAura(390, 20, 480, '#ffd16622', '#5ce1e614'));

  const headline = heroTitle(['Two Circuits, Same Corners,', 'Different Interior Physics'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 62,
    accent: ROLE.lit,
    eyebrow: 'INTERIOR PROBE  (A = 0.8,  B = 0.5)  SETTLES WHICH MODEL IS TRUE',
  });

  // Right: Orbiting 3D surface of |A - B| difference-circuit vs sum-tent interior probe!
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.05,
    distance: 11.8,
    unit: 132,
    focus: [0, 0, 0.5],
  }).at(430, 35);

  view3d.add(
    surface(
      (u, v) => {
        const a = (u + 1.5) / 3;
        const b = (v + 1.5) / 3;
        return differenceLamp([a, b]).y * 1.45;
      },
      {
        x: [-1.5, 1.5],
        y: [-1.5, 1.5],
        resolution: [26, 26],
        colors: ['#0a1630', '#2b2266', '#60a5fa', '#5ce1e6', '#ffd166'],
        mesh: '#a78bfa',
        meshOpacity: 0.18,
        meshWidth: 0.6,
        opacity: 0.9,
      },
    ),
    // Interior probe (0.8, 0.5) -> u = 0.9, v = 0: two heights 0.7 (gold) vs 0.3 (cyan)
    point3d([0.9, 0, sumOut.y * 1.45], { color: ROLE.lit, radius: 13, glow: 14 }),
    point3d([0.9, 0, diffOut.y * 1.45], { color: ROLE.dark, radius: 13, glow: 14 }),
  );

  const live = dynamic(() => {
    const hg = hngP.value;
    const rv = revP.value;
    const df = difP.value;
    const dr = drsP.value;
    const fn = finP.value;
    const lx = -820;

    return group(
      txt('INTERIOR DIMMERS:  A = 0.8,  B = 0.5', lx, -205, 28, ROLE.dark, 'mono', 'left'),
      // Circuit 1: Sum-based hinges
      txt('CIRCUIT 1 (SUM HINGES)', lx, -120, 28, ROLE.lit, 'mono', 'left'),
      txt(
        hg > 0.2 ? 'h = [1.3, 0.3]  →  1.3 − 2(0.3)' : 'h = [ReLU(A+B), ReLU(A+B−1)]',
        lx,
        -68,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),
      numCell(rv > 0.2 ? `y₁ = ${sumOut.y.toFixed(1)}` : 'y₁ = ?', lx + 145, 10, {
        w: 280,
        h: 66,
        size: 36,
        stroke: rv > 0.2 ? ROLE.lit : '#2b3b60',
        textColor: rv > 0.2 ? ROLE.lit : COSMOS.dim,
        glow: rv > 0.2 ? 12 : 0,
      }),

      // Circuit 2: Difference-based hinges
      txt('CIRCUIT 2 (GAP |A − B|)', lx, 100, 28, ROLE.dark, 'mono', 'left').opacity(
        mix(0.45, 1, df),
      ),
      txt('ReLU(A−B) + ReLU(B−A)', lx, 152, 28, COSMOS.muted, 'mono', 'left').opacity(
        mix(0.45, 1, df),
      ),
      numCell(dr > 0.2 ? `y₂ = ${diffOut.y.toFixed(1)}` : 'y₂ = ?', lx + 145, 228, {
        w: 280,
        h: 66,
        size: 36,
        stroke: dr > 0.2 ? ROLE.dark : '#2b3b60',
        textColor: dr > 0.2 ? ROLE.dark : COSMOS.dim,
        glow: dr > 0.2 ? 12 : 0,
        opacity: mix(0.45, 1, df),
      }),

      txt('3D GAP SURFACE  |A − B|', 430, 250, 26, ROLE.gate, 'mono'),
      txt(
        fn > 0.2
          ? 'Both match all 4 corners, yet diverge (0.7 vs 0.3) at (0.8, 0.5): measure there!'
          : dr > 0.2
            ? 'Circuit 1 predicts 0.7; Circuit 2 predicts 0.3! Which reading separates them?'
            : 'Test an interior dimmer setting never seen in binary training data',
        0,
        325,
        29,
        fn > 0.2 ? ROLE.good : ROLE.lit,
        'serif',
      ),
    );
  });

  s.add(headline, view3d, live);
  orbitScene(s, c, view3d, { theta: -0.78, phi: 1.05, deltaTheta: 0.48, deltaPhi: 0.08 });
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'final-lamp-probe', p1P, 1, { dur: 0.65 });
  cueTo(s, c, 'second-dimmer', p2P, 1, { dur: 0.65 });
  cueTo(s, c, 'dimmer-hinges', hngP, 1, { dur: 0.65, after: true });
  cueTo(s, c, 'final-lamp-reveal', revP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'difference-circuit', difP, 1, { dur: 0.75 });
  cueTo(s, c, 'interior-setting', intP, 1, { dur: 0.65 });
  cueTo(s, c, 'difference-result', drsP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'final-meaning', finP, 1, { dur: 0.75 });
}
