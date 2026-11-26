// Shared cinematic math, invariants, 3D simplex/surface builders, and luminous UI for `softmax`.
import { stableSoftmax } from 'vizmatic';
import {
  Node,
  arrow,
  circle,
  curve3d,
  delay,
  dot,
  gridPlane3d,
  group,
  line,
  line3d,
  linear,
  linearGradient,
  par,
  points3d,
  polyPath,
  rect,
  surface,
} from 'vizmatic/stage';
import {
  crossEntropy,
  entropy,
  lossTrace,
  onlineLogSumExp,
  positionReduction,
  positiveTemperature,
  probabilityLossGradient,
  softmaxJacobian,
} from '../../films/softmax/arithmetic.mjs';
import {
  FRESH_LOGITS,
  FRESH_TARGET,
  GRAD,
  LOGITS,
  PROBS,
  TARGET,
  UPDATED,
  WORDS,
} from '../../films/softmax/fixtures.mjs';
import { completeModel, freshState, validateModel } from '../../films/softmax/model.mjs';
import {
  CINEMA_FRAME,
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout,
  morphEquation,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  CINEMA_FRAME,
  COSMOS,
  FRESH_LOGITS,
  FRESH_TARGET,
  GRAD,
  LOGITS,
  PROBS,
  TARGET,
  UPDATED,
  WORDS,
  aura,
  cinematic3d,
  crossEntropy,
  entropy,
  freshState,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lossTrace,
  metricReadout,
  morphEquation,
  onlineLogSumExp,
  orbitScene,
  positionReduction,
  positiveTemperature,
  probabilityLossGradient,
  rule,
  softmaxJacobian,
  stableSoftmax,
  txt,
  wireframeSlab3d,
};

/** Locked semantic roles for `softmax`: one color means one candidate or role across all 21 scenes. */
export const WORD_COLOR = Object.freeze([COSMOS.blue, COSMOS.emerald, COSMOS.violet]);
export const TARGET_COLOR = COSMOS.emerald;
export const MARK_COLOR = COSMOS.gold;
export const OTHER_COLOR = COSMOS.cyan;
export const DANGER_COLOR = COSMOS.rose;

export const MODEL = completeModel();
export const DOG_TRACE = lossTrace(LOGITS, TARGET);
export const UPDATED_TRACE = lossTrace(UPDATED, TARGET);
export const FRESH_TRACE = lossTrace(FRESH_LOGITS, FRESH_TARGET);
export const DOG_ATE_TRACE = lossTrace(LOGITS, 2);
export const SMOOTH_ALPHA = 0.1;
export const SMOOTH_TARGET = Object.freeze([
  SMOOTH_ALPHA / 3,
  1 - SMOOTH_ALPHA + SMOOTH_ALPHA / 3,
  SMOOTH_ALPHA / 3,
]);
export const SEQ_WORDS = Object.freeze(['bug', 'docs', 'today']);
export const CLASS_WORDS = Object.freeze(['bug', 'docs', 'pad']);

/** Build-time mathematical invariant suite backed by `videos/films/softmax/model.mjs`. */
export function verifySoftmaxInvariants() {
  verifyInvariant(validateModel(), 'softmax model validateModel() must pass');
  verifyApprox(
    PROBS.reduce((a, b) => a + b, 0),
    1,
    1e-12,
    'PROBS sum to 1',
  );
  verifyApprox(PROBS[0], 0.8437947344813395, 1e-9, 'p(ran) ~ 84.4%');
  verifyApprox(PROBS[1], 0.11419519938459449, 1e-9, 'p(slept) ~ 11.4%');
  verifyApprox(PROBS[2], 0.04201006613406605, 1e-9, 'p(ate) ~ 4.2%');
  verifyApprox(DOG_TRACE.loss, 2.169846019804714, 1e-9, 'dog cross-entropy ~ 2.170 nats');
  verifyApprox(DOG_ATE_TRACE.loss - DOG_TRACE.loss, 1.0, 1e-12, 'relabeling to ate adds 1.0 nat');
  verifyApprox(
    GRAD.reduce((a, b) => a + b, 0),
    0,
    1e-12,
    'logit gradients sum to 0',
  );
  verifyApprox(UPDATED_TRACE.probabilities[TARGET], 0.608507176, 1e-6, 'updated p(slept) ~ 60.9%');
  verifyApprox(MODEL.smoothGap, Math.log(28), 1e-12, 'label smoothing optimal gap = ln(28)');
  verifyApprox(MODEL.second.loss, 1.387, 1e-3, 'double-softmax reported loss ~ 1.387');
  verifyApprox(MODEL.wrongGradient[TARGET], -0.127, 1e-3, 'double-softmax gradient ~ -0.127');
  verifyApprox(MODEL.sequence.mean, 1.238, 1e-3, 'two-token sequence mean ~ 1.238');
  verifyApprox(MODEL.pad.loss, 9.0, 1e-2, 'unmasked pad loss ~ 9.00');
  verifyApprox(MODEL.excluded.loss, 0.313, 1e-3, 'masked pad loss ~ 0.313');
  verifyApprox(MODEL.bytes / 2 ** 30, 31.3125, 1e-9, 'vocab logit matrix = 31.3125 GiB');
  verifyApprox(MODEL.tiles.at(-1).logSumExp - 2, 2.148755181, 1e-6, 'online tile loss ~ 2.15');
  verifyApprox(MODEL.freshMean, Math.log(8) / 2, 1e-12, 'fresh batch baseline mean = ln(8)/2');
}

/** Remaining seconds from a scene-relative cue time so animations never outrun narration. */
export function remainDuration(c, startOffset = 0, margin = 0.45) {
  const span = Math.max(0.2, c.end - c.start - startOffset - margin);
  return span;
}

/** Schedule a smooth value tween at a cue (`after: true` withholds until clause end). */
export function tweenCue(s, c, cueId, val, to, { duration = 0.65, after = false, ease } = {}) {
  const fire = () => {
    const opts = ease ? { duration, ease } : { duration };
    s.play(val.to(to, opts));
  };
  if (after) c.after(cueId, fire);
  else c.on(cueId, fire);
}

/** Drive a continuous subtle ambient oscillation across the entire scene window. */
export function runAmbientPhase(s, c, phaseVal, cycles = 2.2) {
  const dur = Math.max(0.5, c.end - c.start - 0.35);
  c.at(0.05, () => {
    s.play(phaseVal.to(cycles * Math.PI * 2, { duration: dur, ease: linear }));
  });
}

/** Smoothly cross-fade two visibility layers with zero P5 overlap (old drops below 0.25 before new rises). */
export function crossSwap(s, c, cueId, outVal, inVal, { duration = 0.55, after = false } = {}) {
  const fire = () => {
    const half = duration * 0.48;
    s.play(
      par(outVal.to(0, { duration: half }), delay(inVal.to(1, { duration: half }), half * 0.96)),
    );
  };
  if (after) c.after(cueId, fire);
  else c.on(cueId, fire);
}

/** Convert `#rrggbb` + alpha in [0, 1] to `#rrggbbaa` for Vizmatic's `rect({ fill })`. */
export function hexAlpha(hex, alpha = 1) {
  if (typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) return hex;
  const byte = Math.max(0, Math.min(255, Math.round(alpha * 255)))
    .toString(16)
    .padStart(2, '0');
  return `${hex}${byte}`;
}

/** Soft luminous bar without heavy slide-card borders. */
export function lumBar(
  cx,
  cy,
  w,
  h,
  {
    color = COSMOS.cyan,
    fillOpacity = 0.32,
    strokeWidth = 2.2,
    glow = 8,
    radius = 8,
    opacity = 1,
    dash,
  } = {},
) {
  const node = rect(Math.max(2, w), Math.max(2, h), {
    fill: fillOpacity > 0.005 ? hexAlpha(color, fillOpacity) : null,
    stroke: color,
    width: strokeWidth,
    radius,
    dash,
  })
    .at(cx, cy)
    .opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Glowing open ring (for orbital callouts, target highlights, or zero-box status beacons). */
export function glowRing(
  cx,
  cy,
  r,
  color = COSMOS.gold,
  { width = 3, glow = 8, opacity = 1, dash } = {},
) {
  const node = circle(r, {
    fill: null,
    stroke: color,
    width,
    dash,
  })
    .at(cx, cy)
    .opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Smooth quadratic arc between two points with screen glow. */
export function glowingArc(
  from,
  to,
  bend = -40,
  { color = COSMOS.gold, width = 3.2, glow = 8, opacity = 0.9, steps = 24 } = {},
) {
  const mx = (from[0] + to[0]) * 0.5;
  const my = (from[1] + to[1]) * 0.5 + bend;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * from[0] + 2 * u * t * mx + t * t * to[0],
      u * u * from[1] + 2 * u * t * my + t * t * to[1],
    ]);
  }
  return glowingTrail(pts, { color, width, glow, opacity, core: false });
}

/** Format probability nicely (>= 0.5% as 1 decimal or %, < 0.5% as <1% or exact). */
export function fmtPct(p, exact = false) {
  const pct = p * 100;
  if (exact) return `${pct < 0.1 ? pct.toFixed(2) : pct.toFixed(1)}%`;
  if (p > 0 && p < 0.005) return '<1%';
  if (p > 0.995 && p < 1) return '>99%';
  return `${pct.toFixed(1)}%`;
}

/**
 * Floating luminous unit-probability ribbon: shows the conserved 1.0 budget as glowing
 * light segments with zero box chrome.
 */
export function unitRibbon(
  left,
  cy,
  totalW,
  height,
  shares,
  colors = WORD_COLOR,
  { fillScales = [1, 1, 1], opacity = 1, showLabels = false, names = WORDS } = {},
) {
  const nodes = [
    rule(left, cy + height / 2 + 10, left + totalW, cy + height / 2 + 10, COSMOS.rule, 2).opacity(
      opacity * 0.7,
    ),
    rule(left, cy + height / 2 + 2, left, cy + height / 2 + 18, COSMOS.muted, 2).opacity(
      opacity * 0.8,
    ),
    rule(
      left + totalW,
      cy + height / 2 + 2,
      left + totalW,
      cy + height / 2 + 18,
      COSMOS.muted,
      2,
    ).opacity(opacity * 0.8),
  ];
  let cursor = left;
  shares.forEach((share, i) => {
    const segW = Math.max(0, totalW * Math.max(0, share) * (fillScales[i] ?? 1));
    if (segW >= 2) {
      const cx = cursor + segW / 2;
      nodes.push(
        lumBar(cx, cy, segW - 3, height, {
          color: colors[i],
          fillOpacity: 0.76,
          strokeWidth: 2,
          glow: 9,
          radius: 6,
          opacity,
        }),
      );
      if (showLabels && segW > 125) {
        nodes.push(
          txt(`${names[i]} ${fmtPct(share)}`, cx, cy, 26, COSMOS.bg, 'mono', 'center').opacity(
            opacity,
          ),
        );
      }
    }
    cursor += segW;
  });
  return nodes;
}

/**
 * Orbiting 3D Probability Simplex (`p_0 + p_1 + p_2 = 1`) with luminous barycentric
 * probability spires at the 3 vertices and a glowing live probability beacon moving on the triangle.
 */
export function buildSimplex3d(
  probsFn,
  {
    x = 390,
    y = 35,
    scale = 2.35,
    names = WORDS,
    colors = WORD_COLOR,
    theta = -0.68,
    phi = 1.06,
    distance = 14.2,
    unit = 112,
    trailFn,
  } = {},
) {
  // Equilateral triangle in z=0 plane centered at origin
  const V = [
    [scale * Math.cos(Math.PI / 2), scale * Math.sin(Math.PI / 2), 0], // top: ran
    [scale * Math.cos((7 * Math.PI) / 6), scale * Math.sin((7 * Math.PI) / 6), 0], // left-front: slept
    [scale * Math.cos((11 * Math.PI) / 6), scale * Math.sin((11 * Math.PI) / 6), 0], // right-front: ate
  ];
  const bary = (p) => [
    p[0] * V[0][0] + p[1] * V[1][0] + p[2] * V[2][0],
    p[0] * V[0][1] + p[1] * V[1][1] + p[2] * V[2][1],
    0.04,
  ];

  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    focus: [0, 0, 0.75],
  }).at(x, y);

  // Subtle floor grid plane
  view.add(
    gridPlane3d({
      x: [-2.8, 2.8],
      y: [-2.8, 2.8],
      z: -0.02,
      step: 0.7,
      color: '#1c2642',
      opacity: 0.38,
    }),
  );

  // Luminous simplex triangle edges
  const edges = [
    [0, 1],
    [1, 2],
    [2, 0],
  ];
  for (const [a, b] of edges) {
    view.add(
      line3d(V[a], V[b], {
        color: COSMOS.cyan,
        width: 3.0,
        glow: 8,
        blend: 'screen',
      }),
    );
  }
  // Medians toward centroid (uniform 1/3, 1/3, 1/3)
  for (let i = 0; i < 3; i++) {
    view.add(
      line3d(V[i], [0, 0, 0], {
        color: colors[i],
        width: 1.5,
        opacity: 0.35,
        blend: 'screen',
      }),
    );
  }

  // Soft entropy dome over the simplex (peaks at uniform center!)
  const dome = surface(
    (wx, wy) => {
      const r2 = wx * wx + wy * wy;
      return Math.max(0, 1.35 * Math.exp(-r2 / 2.2) - 0.14);
    },
    {
      x: [-2.2, 2.2],
      y: [-2.2, 2.2],
      resolution: [26, 26],
      colors: ['#070910', '#121a3a', '#1d3b66', '#28648e', '#5ce1e6'],
      mesh: '#5ce1e6',
      meshOpacity: 0.12,
      meshWidth: 0.5,
      opacity: 0.38,
    },
  );
  view.add(dome);

  // Reactive 3D vertex probability spires (height = 2.6 * p_i)
  for (let i = 0; i < 3; i++) {
    const vx = V[i][0];
    const vy = V[i][1];
    view.add(
      line3d(
        [vx, vy, 0],
        () => {
          const p = probsFn();
          return [vx, vy, Math.max(0.08, (p[i] ?? 0) * 2.55)];
        },
        {
          color: colors[i],
          width: 7.5,
          glow: 12,
          blend: 'screen',
          onTop: true,
        },
      ),
    );
    // Glowing cap beam from barycentric point to vertex spire top
    view.add(
      line3d(
        () => {
          const p = probsFn();
          const b = bary(p);
          return [b[0], b[1], 0.12];
        },
        () => {
          const p = probsFn();
          return [vx, vy, Math.max(0.08, (p[i] ?? 0) * 2.55)];
        },
        {
          color: colors[i],
          width: 2.0,
          opacity: 0.65,
          glow: 5,
          blend: 'screen',
          onTop: true,
        },
      ),
    );
  }

  // Optional 3D geodesic curve on simplex (e.g., temperature sweep!)
  if (typeof trailFn === 'function') {
    view.add(
      curve3d(
        (t) => {
          const p = trailFn(t);
          const b = bary(p);
          const h = 0.22 + 0.85 * Math.exp(-(b[0] * b[0] + b[1] * b[1]) / 2.2);
          return [b[0], b[1], h];
        },
        {
          t: [0, 1],
          samples: 64,
          color: COSMOS.gold,
          width: 3.6,
          glow: 10,
          blend: 'screen',
          onTop: true,
        },
      ),
    );
  }

  // Live probability beacon rising from barycentric point on simplex
  view.add(
    line3d(
      () => {
        const b = bary(probsFn());
        return [b[0], b[1], 0];
      },
      () => {
        const b = bary(probsFn());
        return [b[0], b[1], 1.55];
      },
      {
        color: COSMOS.gold,
        width: 4.0,
        glow: 12,
        blend: 'screen',
        onTop: true,
      },
    ),
  );
  view.add(
    points3d(
      () => {
        const p = probsFn();
        const b = bary(p);
        return [
          [b[0], b[1], 1.58],
          [V[0][0], V[0][1], Math.max(0.08, p[0] * 2.55)],
          [V[1][0], V[1][1], Math.max(0.08, p[1] * 2.55)],
          [V[2][0], V[2][1], Math.max(0.08, p[2] * 2.55)],
        ];
      },
      {
        color: COSMOS.gold,
        radius: 6.5,
        glow: 12,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  return { view, V, bary, names };
}

/**
 * Orbiting 3D Cross-Entropy Loss Landscape `L(z_target, z_comp) = ln(e^{z_t} + e^{z_c} + 1) - z_t`
 * showing the steep linear penalty wall vs flat zero floor and a glowing descent trajectory.
 */
export function buildLossLandscape3d(
  pointFn,
  { x = 390, y = 25, theta = -0.78, phi = 1.04, distance = 15.2, unit = 108 } = {},
) {
  const lossZ = (zt, zc) => {
    const m = Math.max(zt, zc, 0);
    const lse = m + Math.log(Math.exp(zt - m) + Math.exp(zc - m) + Math.exp(-m));
    return Math.min(3.2, (lse - zt) * 0.52);
  };

  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    focus: [0, 0, 0.9],
  }).at(x, y);

  view.add(
    surface((wx, wy) => lossZ(wx, wy), {
      x: [-2.2, 3.2],
      y: [-1.2, 3.4],
      resolution: [38, 38],
      colors: ['#0c2d2e', '#1a4f63', '#2d3f8f', '#6b2f8a', '#c93b6b', '#ffd166'],
      mesh: '#6ee7b7',
      meshOpacity: 0.14,
      meshWidth: 0.55,
      opacity: 0.88,
    }),
  );

  // Glowing descent geodesic from (z_slept=1, z_ran=3) down to updated point
  view.add(
    curve3d(
      (t) => {
        const zt = 1 + (UPDATED[1] - 1) * t;
        const zc = 3 + (UPDATED[0] - 3) * t;
        return [zt, zc, lossZ(zt, zc) + 0.09];
      },
      {
        t: [0, 1],
        samples: 48,
        color: COSMOS.emerald,
        width: 4.2,
        glow: 10,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  // Live glowing marker beacon on the surface
  view.add(
    line3d(
      () => {
        const [zt, zc] = pointFn();
        return [zt, zc, lossZ(zt, zc)];
      },
      () => {
        const [zt, zc] = pointFn();
        return [zt, zc, lossZ(zt, zc) + 0.95];
      },
      {
        color: COSMOS.gold,
        width: 3.6,
        glow: 10,
        blend: 'screen',
        onTop: true,
      },
    ),
  );
  view.add(
    points3d(
      () => {
        const [zt, zc] = pointFn();
        return [[zt, zc, lossZ(zt, zc) + 0.1]];
      },
      {
        color: COSMOS.gold,
        radius: 7.5,
        glow: 14,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  return { view, lossZ };
}

/**
 * Draw a clean 2D glowing `-ln(p)` curve with live moving marker (no box borders).
 */
export function buildNegLogCurve2d(
  x0,
  y0,
  w,
  h,
  pRead,
  {
    maxLoss = 3.2,
    opacity = 1,
    markerColor = COSMOS.gold,
    showBaseline = true,
    xCaption = 'target probability p',
  } = {},
) {
  const px = (p) => x0 + Math.max(0.02, Math.min(1, p)) * w;
  const py = (l) => y0 + h - Math.min(maxLoss, Math.max(0, l)) * (h / maxLoss);

  const curvePts = [];
  for (let i = 0; i <= 72; i++) {
    const p = 0.042 + (0.958 * i) / 72;
    curvePts.push([px(p), py(-Math.log(p))]);
  }
  const pNow = Math.max(0.042, Math.min(1, pRead));
  const lNow = -Math.log(pNow);
  const mx = px(pNow);
  const my = py(lNow);

  const nodes = [
    rule(x0, y0 + h, x0 + w, y0 + h, COSMOS.muted, 2.5).opacity(opacity * 0.8),
    rule(x0, y0, x0, y0 + h, COSMOS.muted, 2.5).opacity(opacity * 0.8),
    glowingTrail(curvePts, {
      gradientColors: [COSMOS.rose, COSMOS.gold, COSMOS.emerald],
      width: 4.5,
      glow: 10,
      opacity,
    }),
    txt('0', x0 - 24, y0 + h, 26, COSMOS.muted, 'mono', 'right').opacity(opacity),
    txt('3 nats', x0 - 20, y0 + 8, 26, COSMOS.muted, 'mono', 'right').opacity(opacity),
    txt('1.0', x0 + w, y0 + h + 32, 26, COSMOS.muted, 'mono', 'center').opacity(opacity),
    txt(xCaption, x0 + w * 0.5, y0 + h + 34, 26, COSMOS.muted, 'sans', 'center').opacity(opacity),
  ];

  if (showBaseline) {
    nodes.push(
      line([mx, y0 + h], [mx, my], {
        stroke: markerColor,
        width: 2.2,
        dash: [8, 6],
      }).opacity(opacity * 0.75),
      line([x0, my], [mx, my], {
        stroke: markerColor,
        width: 2.2,
        dash: [8, 6],
      }).opacity(opacity * 0.75),
    );
  }
  nodes.push(glowDot(mx, my, { radius: 8.5, color: markerColor, glow: 14, opacity }));
  return { nodes, mx, my, px, py };
}

/**
 * Draw glowing score-ruler columns (used cleanly across early dog-example scenes with zero chrome).
 */
export function buildRulerBars(
  left,
  right,
  baseY,
  maxH,
  scores,
  probs,
  {
    minZ = -0.5,
    maxZ = 3.5,
    offset = 0,
    shift = 0,
    names = WORDS,
    colors = WORD_COLOR,
    barW = 92,
    growScales = [1, 1, 1],
    solidScales = [1, 1, 1],
    readMode = 'share', // 'none' | 'weight' | 'share'
    targetIdx = TARGET,
    opacity = 1,
    showTicks = true,
  } = {},
) {
  const xOf = (z) => left + ((z - minZ) / (maxZ - minZ)) * (right - left);
  const nodes = [
    glowingTrail(
      [
        [left, baseY],
        [right, baseY],
      ],
      { color: COSMOS.muted, width: 3.0, glow: 4, opacity: opacity * 0.75, core: false },
    ),
  ];
  if (showTicks) {
    for (const t of [0, 1, 2, 3]) {
      const tx = xOf(t);
      const val = t + offset - shift;
      const lbl =
        Math.abs(val) >= 100 ? String(Math.round(val)) : String(Math.round(val * 10) / 10);
      nodes.push(
        line([tx, baseY - 7], [tx, baseY + 12], { stroke: COSMOS.muted, width: 2.5 }).opacity(
          opacity * 0.8,
        ),
        txt(lbl, tx, baseY + 42, 26, COSMOS.muted, 'mono', 'center').opacity(opacity * 0.9),
      );
    }
  }
  scores.forEach((z, i) => {
    const cx = xOf(z);
    const p = probs[i];
    const h = Math.max(6, maxH * p * (growScales[i] ?? 1));
    const fillOp = 0.08 + 0.68 * (solidScales[i] ?? 1);
    nodes.push(
      lumBar(cx, baseY - 12 - h / 2, barW, h, {
        color: colors[i],
        fillOpacity: fillOp,
        strokeWidth: i === targetIdx ? 3.2 : 2.2,
        glow: i === targetIdx ? 12 : 7,
        radius: 7,
        opacity,
      }),
      glowDot(cx, baseY, { radius: 7, color: colors[i], glow: 10, opacity }),
      txt(names[i], cx, baseY + 86, 30, colors[i], 'sans', 'center').opacity(opacity),
    );
    if (readMode === 'share') {
      nodes.push(
        txt(fmtPct(p), cx, baseY - 38 - h, 28, colors[i], 'mono', 'center').opacity(opacity),
      );
    } else if (readMode === 'weight') {
      const w = Math.exp(z + offset - shift);
      const wStr = w >= 10 ? w.toFixed(1) : w.toFixed(3);
      nodes.push(txt(wStr, cx, baseY - 38 - h, 28, colors[i], 'mono', 'center').opacity(opacity));
    }
  });
  return { nodes, xOf };
}

/** Glowing directional arrow helper for clean motion diagrams. */
export function glowArrow(
  from,
  to,
  color = COSMOS.gold,
  { width = 3.5, tip = 13, opacity = 1 } = {},
) {
  return arrow(from, to, { stroke: color, width, tip }).glow(6, color).opacity(opacity);
}
