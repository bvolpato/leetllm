// Scene 8: temperature-gradient - "How much pressure does the score get?"
// Pure Cinema: continuous P(pos) & |grad| curves over tau in [0.01, 1.0] with live sliding beads
// and saturation gauges, transitioning cleanly to the 32,860x exponential hard-vs-easy negative ratio.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  playAfter,
  playOn,
  rule,
  swapVis,
  txt,
  verifyApprox,
} from '../parts.mjs';

export default function temperatureGradient(s, c) {
  const gap = 0.7;
  const probOf = (t) => 1 / (1 + Math.exp(-gap / t));
  const gradOf = (t) => Math.exp(-gap / t) / (1 + Math.exp(-gap / t)) / t;
  const ratio = Math.exp((0.72 - 0.2) / 0.05);
  verifyApprox(ratio, 32859.6, 1.0, 'negative gradient ratio ~32,860');

  const vCurve = s.value(1);
  const vRatio = s.value(0);
  const tau = s.value(1.0);
  const hiGap = s.value(0);
  const showRule = s.value(0);
  const showLive = s.value(0);
  const showRatioAns = s.value(0);

  const title = heroTitle(['How temperature τ', 'shapes score gradients'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.focus,
  });

  const eqRule = glowTex(
    'P^+ = \\frac{1}{1 + e^{-\\Delta/\\tau}}, \\qquad |g| = \\frac{1 - P^+}{\\tau}',
    {
      x: 370,
      y: -415,
      size: 32,
      color: ROLE.focus,
      glow: 6,
    },
  );

  // Pre-sample curves on log-spaced tau axis [0.01 .. 1.0] so 0.01, 0.05, 0.1, 1.0 spread cleanly!
  const px0 = -780;
  const py0 = 215;
  const plotW = 920;
  const plotH = 400;
  const logMin = Math.log10(0.01);
  const logMax = Math.log10(1.0);
  const mapTX = (t) => px0 + ((Math.log10(Math.max(0.01, t)) - logMin) / (logMax - logMin)) * plotW;
  const mapY = (val) => py0 - Math.min(1, Math.max(0, val)) * plotH;

  const probPts = [];
  const gradPts = [];
  for (let i = 0; i <= 80; i++) {
    const u = i / 80;
    const tVal = Math.pow(10, logMin + u * (logMax - logMin));
    probPts.push([mapTX(tVal), mapY(probOf(tVal))]);
    gradPts.push([mapTX(tVal), mapY(gradOf(tVal))]);
  }

  // View 1: Saturation Curves + Live Gauges
  const curveLayer = guardedDynamic(vCurve, (alpha) => {
    const curT = tau.value;
    const pVal = probOf(curT);
    const gVal = gradOf(curT);
    const live = showLive.value;
    const nodes = [];

    // Header operand summary
    nodes.push(
      txt(
        'positive 0.90   ·   negative 0.20   ·   fixed gap Δ = 0.70',
        px0,
        -255,
        28,
        hiGap.value > 0.3 ? ROLE.focus : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    );

    // Axes & log-scale tau ticks
    nodes.push(
      line([px0, py0], [px0 + plotW, py0], { stroke: '#4c6294', width: 2.4 }).opacity(alpha),
      line([px0, py0], [px0, py0 - plotH - 12], { stroke: '#4c6294', width: 2.4 }).opacity(alpha),
      txt('1.0', px0 - 20, mapY(1.0), 26, COSMOS.dim, 'mono', 'right').opacity(alpha),
      txt('0.5', px0 - 20, mapY(0.5), 26, COSMOS.dim, 'mono', 'right').opacity(alpha),
      txt('0.0', px0 - 20, mapY(0.0), 26, COSMOS.dim, 'mono', 'right').opacity(alpha),
    );
    for (const tk of [0.01, 0.05, 0.1, 0.5, 1.0]) {
      const tx = mapTX(tk);
      nodes.push(
        line([tx, py0 - 8], [tx, py0 + 8], { stroke: '#6c82b4', width: 2 }).opacity(alpha),
        txt(`τ=${tk}`, tx, py0 + 36, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
      );
    }

    // Curves + legend placed cleanly above the vertical sweep line so sweep never crosses text
    nodes.push(
      glowingTrail(probPts, { color: ROLE.positive, width: 4.2, glow: 8, opacity: alpha }),
      glowingTrail(gradPts, { color: ROLE.focus, width: 4.2, glow: 8, opacity: alpha }),
      txt('● P(positive)', px0 + 18, py0 - plotH - 36, 26, ROLE.positive, 'mono', 'left').opacity(
        alpha,
      ),
      txt(
        '● |score gradient|',
        px0 + 320,
        py0 - plotH - 36,
        26,
        ROLE.focus,
        'mono',
        'left',
      ).opacity(alpha),
    );

    // Live vertical sweep line + beads once live starts
    if (live > 0.05) {
      const sx = mapTX(curT);
      nodes.push(
        line([sx, py0], [sx, py0 - plotH], {
          stroke: ROLE.anchor,
          width: 2.2,
          dash: [6, 6],
        }).opacity(0.75 * live * alpha),
        glowDot(sx, mapY(pVal), {
          radius: 9,
          color: ROLE.positive,
          glow: 13,
          opacity: live * alpha,
        }),
        glowDot(sx, mapY(gVal), { radius: 9, color: ROLE.focus, glow: 13, opacity: live * alpha }),
      );
    }

    // Right-hand live vertical gauges
    const gx1 = 380;
    const gx2 = 660;
    const gh = 360;
    const gBase = 215;
    nodes.push(
      rule(220, -255, 220, 290, COSMOS.rule, 1.8).opacity(0.55 * alpha),
      lumBar(gx1, gBase - gh / 2, 110, gh, {
        color: '#344770',
        fillAlpha: 0.16,
        strokeWidth: 1.6,
        glow: 0,
        radius: 10,
        opacity: alpha,
      }),
      lumBar(gx2, gBase - gh / 2, 110, gh, {
        color: '#344770',
        fillAlpha: 0.16,
        strokeWidth: 1.6,
        glow: 0,
        radius: 10,
        opacity: alpha,
      }),
      txt('P(pos)', gx1, gBase + 38, 28, ROLE.positive, 'mono', 'center').opacity(alpha),
      txt('|grad|', gx2, gBase + 38, 28, ROLE.focus, 'mono', 'center').opacity(alpha),
    );

    if (live > 0.05) {
      const ph = Math.max(6, gh * pVal);
      const grh = Math.max(6, gh * gVal);
      nodes.push(
        lumBar(gx1, gBase - ph / 2, 102, ph, {
          color: ROLE.positive,
          fillAlpha: 0.5,
          strokeWidth: 2.4,
          glow: 9,
          radius: 8,
          opacity: live * alpha,
        }),
        lumBar(gx2, gBase - grh / 2, 102, grh, {
          color: ROLE.focus,
          fillAlpha: 0.5,
          strokeWidth: 2.4,
          glow: 9,
          radius: 8,
          opacity: live * alpha,
        }),
        txt(pVal.toFixed(4), gx1, gBase - gh - 34, 30, ROLE.positive, 'mono', 'center').opacity(
          live * alpha,
        ),
        txt(gVal.toExponential(2), gx2, gBase - gh - 34, 28, ROLE.focus, 'mono', 'center').opacity(
          live * alpha,
        ),
      );
    }

    // Bottom readout bar
    nodes.push(rule(-850, 295, 850, 295, COSMOS.rule, 1.6).opacity(0.55 * alpha));
    if (live > 0.05) {
      nodes.push(
        txt(
          `τ = ${curT.toFixed(2)}     ·     P(pos) = ${pVal.toFixed(6)}     ·     |g| = ${gVal.toExponential(3)}`,
          0,
          365,
          34,
          ROLE.focus,
          'mono',
          'center',
        )
          .glow(7, ROLE.focus)
          .opacity(live * alpha),
      );
    } else if (showRule.value > 0.05) {
      nodes.push(
        txt(
          '1 / τ grows as τ shrinks, while (1 − P⁺) collapses exponentially on easy rows',
          0,
          365,
          30,
          ROLE.anchor,
          'sans',
          'center',
        ).opacity(showRule.value * alpha),
      );
    } else {
      nodes.push(
        txt(
          'Lowering τ sharpens the softmax and scales raw-score derivatives by 1 / τ',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }

    return nodes;
  });

  // View 2: Hard Negative (0.72) vs Easy Negative (0.20) Gradient Ratio at tau = 0.05
  const ratioEq = glowTex(
    '\\frac{g_1}{g_2} = \\frac{P_1}{P_2} = \\exp\\!\\left(\\frac{0.72 - 0.20}{0.05}\\right) = e^{10.4}',
    {
      x: 0,
      y: 12,
      size: 44,
      color: ROLE.focus,
      glow: 8,
    },
  );

  const ratioLayer = guardedDynamic(vRatio, (alpha) => {
    const ans = showRatioAns.value;
    const nodes = [
      txt(
        'TWO NEGATIVES IN ONE ROW   ·   τ = 0.05',
        0,
        -255,
        30,
        ROLE.anchor,
        'mono',
        'center',
      ).opacity(alpha),
      // Two visual score bars cleanly above equation
      txt('hard negative  s₁ = 0.72', -440, -185, 30, ROLE.competitor, 'mono', 'center').opacity(
        alpha,
      ),
      lumBar(-440, -135, 360, 26, {
        color: ROLE.competitor,
        fillAlpha: 0.45,
        glow: 9,
        opacity: alpha,
      }),
      txt('easy negative  s₂ = 0.20', 440, -185, 30, ROLE.unrelated, 'mono', 'center').opacity(
        alpha,
      ),
      lumBar(440, -135, 100, 26, {
        color: ROLE.unrelated,
        fillAlpha: 0.45,
        glow: 6,
        opacity: alpha,
      }),
      txt(
        'common denominator cancels in the ratio',
        0,
        120,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    if (ans > 0.05) {
      nodes.push(
        txt(
          `≈ ${Math.round(ratio).toLocaleString('en-US')}× more gradient pressure on s₁ = 0.72`,
          0,
          215,
          44,
          ROLE.competitor,
          'mono',
          'center',
        )
          .glow(10, ROLE.competitor)
          .opacity(ans * alpha),
        txt(
          'Verify high-scoring negatives before training: one mislabeled positive gets massive push',
          0,
          310,
          30,
          ROLE.focus,
          'sans',
          'center',
        ).opacity(ans * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.focus, ROLE.competitor), title, eqRule, curveLayer, ratioLayer);

  playOn(s, c, 'cl-temperature-gradient-gap', (d) => hiGap.to(1, { duration: d }), 0.4);
  playOn(s, c, 'cl-temperature-gradient-rule', (d) => showRule.to(1, { duration: d }), 0.45);
  playAfter(
    s,
    c,
    'cl-temperature-gradient-one',
    (d) => [showLive.to(1, { duration: d }), tau.to(1.0, { duration: d })],
    0.5,
  );
  playAfter(s, c, 'cl-temperature-gradient-tenth', (d) => tau.to(0.1, { duration: d }), 0.9);
  playAfter(s, c, 'cl-temperature-gradient-fifth', (d) => tau.to(0.05, { duration: d }), 0.85);
  playAfter(s, c, 'cl-temperature-gradient-tiny', (d) => tau.to(0.01, { duration: d }), 0.85);

  c.hide('repair-ratio-inputs', eqRule);
  c.show('repair-ratio-inputs', ratioEq, { lead: -0.45 });
  playOn(s, c, 'repair-ratio-inputs', (d) => swapVis(vCurve, vRatio, d), 0.7);
  playAfter(
    s,
    c,
    'cl-temperature-gradient-ratio',
    (d) => showRatioAns.to(1, { duration: d }),
    0.55,
  );
}
