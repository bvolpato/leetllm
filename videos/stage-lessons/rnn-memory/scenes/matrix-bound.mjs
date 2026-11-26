// Scene 10: matrix-bound: "What happens to the arrow on the next step?"
// View 1: Non-normal Jordan matrix transient growth (len 1.000 -> 1.118 -> 1.031 -> 0.035),
//         pairing a glowing 2D vector phase space with its length curve.
// View 2: Jacobian contraction bound ||J_t||_2 <= gamma * sigma_max(W_h) & 0.75^n decay curve.
// View 3: Float32 precision absorption: g = 0.6^50 ~ 8.08e-12 rounds back to 1.0 in FP32.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  MODEL,
  ROLE,
  SIGMA_MAX_W,
  cinemaAtmosphere,
  fmt,
  glowDot,
  glowRing,
  glowTex,
  glowVector,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  swapVis,
  txt,
} from '../parts.mjs';

export default function matrixBound(s, c) {
  const vectors = MODEL.matrixPowers.slice(0, 10);
  const lengths = vectors.map((v) => Math.hypot(...v));

  const vMatrix = s.value(1);
  const vBound = s.value(0);
  const vFloat = s.value(0);

  // View 1 state
  const stepVal = s.value(0); // 0 -> 1 -> 2 -> 9
  const showFormulaMode = s.value(0); // 0 = W, 1 = W^n, 2 = sigma_max

  // View 2 state
  const boundSteps = s.value(0); // 0 -> 9

  // View 3 state
  const showUpdate = s.value(0);
  const showResult = s.value(0);

  function tipAtStep(prog) {
    const clamped = Math.max(0, Math.min(9, prog));
    const i = Math.floor(clamped);
    const f = clamped - i;
    if (i === 0) {
      const ang = Math.PI / 2 + f * (Math.atan2(vectors[1][1], vectors[1][0]) - Math.PI / 2);
      const len = 1 + f * (lengths[1] - 1);
      return [len * Math.cos(ang), len * Math.sin(ang)];
    }
    const next = vectors[Math.min(9, i + 1)];
    return [
      vectors[i][0] + f * (next[0] - vectors[i][0]),
      vectors[i][1] + f * (next[1] - vectors[i][1]),
    ];
  }

  // VIEW 1: Jordan Matrix Transient Growth & Contraction
  const matrixView = guardedDynamic(vMatrix, (alpha) => {
    const prog = stepVal.value;
    const tip = tipAtStep(prog);
    const curLen = Math.hypot(tip[0], tip[1]);
    const mode = Math.round(showFormulaMode.value);

    const nodes = [
      heroTitle(['What happens to the arrow', 'on the next step?'], {
        x: -850,
        y: -435,
        size: 44,
        lineHeight: 52,
        accent: ROLE.gold,
      }).opacity(alpha),
      txt(`Length  ${fmt(curLen, 3)}`, 510, -385, 42, ROLE.gold, 'mono', 'center')
        .glow(8, ROLE.gold)
        .opacity(alpha),
    ];

    // Left: Length vs step curve (x: -760..50, y: -155..245)
    const lx = -740;
    const rx = 20;
    const by = 245;
    const ty = -155;
    const pPlot = (step, len) => [lx + ((rx - lx) * step) / 9, by - ((by - ty) * len) / 1.3];

    nodes.push(
      txt(
        'Arrow length ||Wⁿ v₀||',
        (lx + rx) / 2,
        -210,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
      line([lx, by], [rx + 14, by], { stroke: '#556894', width: 2.5 }).opacity(alpha),
      line([lx, by], [lx, ty - 10], { stroke: '#556894', width: 2.5 }).opacity(alpha),
      line(pPlot(0, 1), pPlot(9, 1), {
        stroke: '#556894',
        width: 2,
        dash: [8, 8],
      }).opacity(0.75 * alpha),
      txt('1.0', lx - 22, pPlot(0, 1)[1], 26, COSMOS.muted, 'mono', 'right').opacity(alpha),
      ...[0, 1, 2, 5, 9].map((n) =>
        txt(String(n), pPlot(n, 0)[0], by + 34, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      ),
      txt('Number of steps n', (lx + rx) / 2, by + 84, 28, COSMOS.ink, 'sans', 'center').opacity(
        alpha,
      ),
    );

    const curvePts = [pPlot(0, 1)];
    const whole = Math.min(9, Math.floor(prog));
    const frac = prog - whole;
    for (let k = 1; k <= whole; k++) curvePts.push(pPlot(k, lengths[k]));
    if (whole < 9 && frac > 0.01) {
      curvePts.push(pPlot(prog, curLen));
    }
    if (curvePts.length >= 2) {
      nodes.push(glowingTrail(curvePts, { color: ROLE.gold, width: 5, glow: 10, opacity: alpha }));
    }
    nodes.push(
      glowDot(pPlot(0, 1)[0], pPlot(0, 1)[1], {
        radius: 7,
        color: ROLE.gold,
        glow: 9,
        opacity: alpha,
      }),
    );
    if (whole >= 1) {
      const p1 = pPlot(1, lengths[1]);
      nodes.push(
        glowDot(p1[0], p1[1], { radius: 7.5, color: ROLE.gold, glow: 10, opacity: alpha }),
        txt(fmt(lengths[1], 3), p1[0] - 18, p1[1] - 38, 28, ROLE.gold, 'mono', 'center').opacity(
          alpha,
        ),
      );
    }
    if (whole >= 2) {
      const p2 = pPlot(2, lengths[2]);
      nodes.push(
        glowDot(p2[0], p2[1], { radius: 7.5, color: ROLE.gold, glow: 10, opacity: alpha }),
        txt(fmt(lengths[2], 3), p2[0] + 42, p2[1] - 34, 28, ROLE.gold, 'mono', 'center').opacity(
          alpha,
        ),
      );
    }
    if (whole >= 9) {
      const p9 = pPlot(9, lengths[9]);
      nodes.push(
        glowDot(p9[0], p9[1], { radius: 8, color: ROLE.state, glow: 12, opacity: alpha }),
        txt(fmt(lengths[9], 3), p9[0] - 14, p9[1] - 38, 28, ROLE.state, 'mono', 'center').opacity(
          alpha,
        ),
      );
    }

    // Right: 2D Vector Plane (origin at [260, 215], scale 320)
    const ox = 260;
    const oy = 215;
    const sc = 310;
    const toVec = (v) => [ox + v[0] * sc, oy - v[1] * sc];

    nodes.push(
      line([ox - 20, oy], [ox + 410, oy], { stroke: '#556894', width: 2.5 }).opacity(alpha),
      line([ox, oy + 20], [ox, oy - 380], { stroke: '#556894', width: 2.5 }).opacity(alpha),
      ...[
        [0.25, '¼'],
        [0.5, '½'],
        [1.0, '1'],
      ].flatMap(([h, lbl]) => {
        const y = oy - h * sc;
        return [
          line([ox, y], [ox + sc, y], { stroke: '#263250', width: 1.8, dash: [7, 7] }).opacity(
            alpha,
          ),
          txt(lbl, ox - 24, y, 26, COSMOS.muted, 'mono', 'right').opacity(alpha),
        ];
      }),
      line([ox + sc, oy], [ox + sc, oy - sc], {
        stroke: '#263250',
        width: 1.8,
        dash: [7, 7],
      }).opacity(alpha),
      txt('1', ox + sc, oy + 32, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );

    // Tip comet trail across steps
    const tipTrail = [toVec(vectors[0])];
    for (let k = 1; k <= whole; k++) tipTrail.push(toVec(vectors[k]));
    if (whole < 9 && frac > 0.01) tipTrail.push(toVec(tip));
    if (tipTrail.length >= 2) {
      nodes.push(
        glowingTrail(tipTrail, { color: ROLE.state, width: 3.2, glow: 8, opacity: 0.78 * alpha }),
      );
    }
    nodes.push(
      glowVector([ox, oy], toVec(tip), {
        color: ROLE.gold,
        width: 7,
        tipSize: Math.min(24, Math.max(10, curLen * 22)),
        glow: 12,
        opacity: alpha,
      }),
    );

    // Bottom-right formula / singular value readout (mutually exclusive modes)
    if (mode === 0) {
      nodes.push(
        glowTex('W = \\begin{bmatrix}0.5 & 1 \\\\ 0 & 0.5\\end{bmatrix}', {
          x: 470,
          y: 355,
          size: 38,
          color: ROLE.state,
          glow: 6,
        }).opacity(alpha),
      );
    } else if (mode === 1) {
      nodes.push(
        glowTex('W^n = \\begin{bmatrix}0.5^n & n\\,0.5^{n-1} \\\\ 0 & 0.5^n\\end{bmatrix}', {
          x: 470,
          y: 355,
          size: 36,
          color: ROLE.gold,
          glow: 7,
        }).opacity(alpha),
      );
    } else {
      nodes.push(
        glowTex(`\\sigma_{\\max}(W) = \\frac{1 + \\sqrt{2}}{2} \\approx ${fmt(SIGMA_MAX_W, 3)}`, {
          x: 470,
          y: 355,
          size: 36,
          color: ROLE.amber,
          glow: 8,
        }).opacity(alpha),
      );
    }

    return nodes;
  });

  // VIEW 2: Jacobian Contraction Bound (||J_t||_2 <= gamma * sigma_max(W_h) & 0.75^n)
  const boundView = guardedDynamic(vBound, (alpha) => {
    const bs = boundSteps.value;
    const nodes = [
      heroTitle(['How much can reach', 'an earlier state?'], {
        x: -850,
        y: -435,
        size: 46,
        lineHeight: 54,
        accent: ROLE.state,
      }).opacity(alpha),
      glowTex('\\|J_t\\|_2 \\le \\gamma\\,\\sigma_{\\max}(W_h)', {
        x: 440,
        y: -385,
        size: 46,
        color: ROLE.gold,
        glow: 8,
      }).opacity(alpha),
    ];

    // Left: 0.75^n contraction bound plot
    const lx = -730;
    const rx = 120;
    const by = 265;
    const ty = -145;
    const pPlot = (step, val) => [lx + ((rx - lx) * step) / 9, by - ((by - ty) * val) / 1.15];

    nodes.push(
      line([lx, by], [rx + 18, by], { stroke: '#556894', width: 2.5 }).opacity(alpha),
      line([lx, by], [lx, ty - 10], { stroke: '#556894', width: 2.5 }).opacity(alpha),
      line(pPlot(0, 1), pPlot(9, 1), { stroke: '#556894', width: 2, dash: [8, 8] }).opacity(
        0.7 * alpha,
      ),
      txt('1.0', lx - 22, pPlot(0, 1)[1], 26, COSMOS.muted, 'mono', 'right').opacity(alpha),
      ...[0, 1, 2, 5, 9].map((n) =>
        txt(String(n), pPlot(n, 0)[0], by + 34, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      ),
      txt('Backward links k', (lx + rx) / 2, by + 84, 28, COSMOS.ink, 'sans', 'center').opacity(
        alpha,
      ),
      glowDot(pPlot(0, 1)[0], pPlot(0, 1)[1], {
        radius: 8,
        color: ROLE.state,
        glow: 10,
        opacity: alpha,
      }),
    );

    if (bs > 0.05) {
      const pts = [pPlot(0, 1)];
      const whole = Math.min(9, Math.floor(bs));
      const frac = bs - whole;
      for (let k = 1; k <= whole; k++) pts.push(pPlot(k, 0.75 ** k));
      if (whole < 9 && frac > 0.01) pts.push(pPlot(bs, 0.75 ** bs));
      if (pts.length >= 2) {
        nodes.push(glowingTrail(pts, { color: ROLE.state, width: 5.5, glow: 12, opacity: alpha }));
      }
      if (whole >= 5) {
        const p5 = pPlot(5, 0.75 ** 5);
        nodes.push(
          glowRing(p5[0], p5[1], 18, ROLE.gold, { width: 3, glow: 10, opacity: alpha }),
          glowDot(p5[0], p5[1], { radius: 7, color: ROLE.gold, glow: 10, opacity: alpha }),
          txt(
            `0.75⁵ ≈ ${fmt(0.75 ** 5, 3)}`,
            p5[0] + 18,
            p5[1] - 42,
            30,
            ROLE.gold,
            'mono',
            'left',
          ).opacity(alpha),
        );
      }
    }

    // Right explanation callout (floating typography, zero boxes)
    nodes.push(
      txt('γ = max tanh slope (≤ 1)', 510, -105, 30, ROLE.state, 'mono', 'center').opacity(alpha),
      txt('σ_max(Wₕ) = largest singular value', 510, -45, 28, COSMOS.ink, 'mono', 'center').opacity(
        alpha,
      ),
    );
    if (bs > 0.5) {
      nodes.push(
        glowTex('0.75^5 \\approx 0.237', {
          x: 510,
          y: 105,
          size: 48,
          color: ROLE.gold,
          glow: 9,
        }).opacity(Math.min(1, bs / 5) * alpha),
        txt(
          'Each link ≤ 0.75 contracts exponentially',
          510,
          200,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(Math.min(1, bs / 5) * alpha),
      );
    }

    return nodes;
  });

  // VIEW 3: Float32 Precision Absorption (g = 0.6^50 ~ 8.08e-12)
  const gFloat = Math.fround(0.6 ** 50);
  const floatView = guardedDynamic(vFloat, (alpha) => {
    const nodes = [
      heroTitle(['Can this gradient', 'change a weight?'], {
        x: -850,
        y: -435,
        size: 46,
        lineHeight: 54,
        accent: ROLE.warn,
      }).opacity(alpha),
      glowTex(`g = 0.6^{50} \\approx ${(gFloat * 1e12).toFixed(2)} \\times 10^{-12}`, {
        x: 0,
        y: -170,
        size: 54,
        color: ROLE.state,
        glow: 9,
      }).opacity(alpha),
      txt(
        'Representable in float32 (far above ~1.4 × 10⁻⁴⁵ underflow)',
        0,
        -75,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    // Visual log-magnitude ruler comparing 1.0, float32 ULP (~1.19e-7), and g (~8.08e-12)
    const rLeft = -680;
    const rRight = 680;
    const rY = 55;
    const xLog = (exp) => rLeft + ((exp + 14) / 15) * (rRight - rLeft); // exp in [-14, +1]
    nodes.push(
      line([rLeft, rY], [rRight, rY], { stroke: '#4e6396', width: 4 }).opacity(alpha),
      glowDot(xLog(0), rY, { radius: 9, color: ROLE.gold, glow: 12, opacity: alpha }),
      txt('weight = 1.0', xLog(0), rY - 40, 28, ROLE.gold, 'mono', 'center').opacity(alpha),
      glowDot(xLog(-6.92), rY, { radius: 8, color: ROLE.amber, glow: 10, opacity: alpha }),
      txt('FP32 step ≈ 1.2×10⁻⁷', xLog(-6.92), rY + 42, 26, ROLE.amber, 'mono', 'center').opacity(
        alpha,
      ),
      glowDot(xLog(-11.09), rY, { radius: 9, color: ROLE.state, glow: 12, opacity: alpha }),
      txt('g ≈ 8.1×10⁻¹²', xLog(-11.09), rY - 40, 28, ROLE.state, 'mono', 'center').opacity(alpha),
    );

    if (showUpdate.value > 0.02) {
      nodes.push(
        txt('new weight = float32(1 − 1 × g)', 0, 200, 42, COSMOS.ink, 'mono', 'center').opacity(
          showUpdate.value * alpha,
        ),
      );
    }
    if (showResult.value > 0.02) {
      nodes.push(
        lumBar(0, 325, 860, 86, {
          color: ROLE.warn,
          fillOpacity: 0.25,
          glow: 12,
          opacity: showResult.value * alpha,
        }),
        txt(
          `new weight = ${Math.fround(1 - gFloat).toFixed(1)}  (unchanged!)`,
          0,
          325,
          36,
          ROLE.gold,
          'mono',
          'center',
        )
          .glow(9, ROLE.gold)
          .opacity(showResult.value * alpha),
      );
    }
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.state), matrixView, boundView, floatView);

  playCue(s, c, 'matrix-first', (d) => s.play(stepVal.to(1, { duration: d })), { dur: 0.8 });
  playCue(s, c, 'matrix-second', (d) => s.play(stepVal.to(2, { duration: d })), { dur: 0.8 });
  playCue(s, c, 'matrix-powers', (d) => s.play(stepVal.to(9, { duration: d })), { dur: 1.6 });
  playCue(s, c, 'matrix-decay', () => showFormulaMode.set(1), { dur: 0.25 });
  playCue(s, c, 'matrix-bound-1', () => showFormulaMode.set(2), { dur: 0.25 });

  playCue(s, c, 'jacobian-bound', (d) => s.play(swapVis(vMatrix, vBound, d)), { dur: 0.65 });
  playCue(s, c, 'bound-product', (d) => s.play(boundSteps.to(9, { duration: d })), { dur: 1.6 });

  playCue(s, c, 'finite-decay', (d) => s.play(swapVis(vBound, vFloat, d)), { dur: 0.65 });
  playCue(s, c, 'rounded-update', (d) => s.play(showUpdate.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'rounded-result', (d) => s.play(showResult.to(1, { duration: d })), { dur: 0.45 });
}
