// Shared cinematic visual primitives, math helpers, and build-time invariants for the
// Gradients and Backprop stage lesson (28 scenes). All arithmetic is imported from
// videos/films/gradients-backprop/ so every spoken number is verified at build time.
import {
  Node,
  arrow,
  circle,
  dot,
  dynamic,
  group,
  line,
  linear,
  linearGradient,
  polyPath,
  radialGradient,
  rect,
  text,
} from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  glowTex,
  guardedDynamic,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';
import {
  BATCH_HISTORY,
  batchGradientState,
  derivativeLoss,
  finiteDifference,
  hiddenStep,
  hiddenUnit,
  latencyExample,
  precisionProbe,
  reluBranchState,
  reluCornerDifference,
} from '../../films/gradients-backprop/arithmetic.mjs';
import {
  BATCH_FEATURES,
  BATCH_TARGETS,
  NONLINEAR_START,
} from '../../films/gradients-backprop/fixtures.mjs';
import { number as formatNum } from '../../films/gradients-backprop/latency-ruler.mjs';
import { validateModel } from '../../films/gradients-backprop/model.mjs';

export {
  BATCH_FEATURES,
  BATCH_HISTORY,
  BATCH_TARGETS,
  COSMOS,
  NONLINEAR_START,
  batchGradientState,
  derivativeLoss,
  finiteDifference,
  formatNum,
  hiddenStep,
  hiddenUnit,
  latencyExample,
  precisionProbe,
  reluBranchState,
  reluCornerDifference,
};

/** Exact precomputed fixtures shared across multiple scenes. */
export const PRECISION_DOUBLE = precisionProbe(false);
export const PRECISION_SINGLE = precisionProbe(true);
export const LINEAR_TWO_WEIGHT = latencyExample([2, 2], [2, 1], 5);
export const CHALLENGE_START = latencyExample([2, 2], [3, 1], 7);
export const CHALLENGE_UPDATED = latencyExample([1.7, 1.9], [3, 1], 7);
export const CHALLENGE_UNSEEN = latencyExample([1.7, 1.9], [1, 2], 4);
export const HIDDEN_STEP_FULL = hiddenStep(0.05, 2, 5);
export const HIDDEN_STEP_HALF = hiddenStep(0.025, 2, 5);
export const HIDDEN_FRESH_STEP = hiddenStep(0.05, 1, 2);
export const HIDDEN_COPIED_FRESH = hiddenUnit(HIDDEN_STEP_FULL.after.weights, 1, 2);
export const HIDDEN_DEAD_UNIT = hiddenUnit([1.5, -4, 2, 0.5], 2, 5);
export const SIGMOID_TWO = 1 / (1 + Math.exp(-2));
export const SIGMOID_GRAD = 3 * SIGMOID_TWO * (1 - SIGMOID_TWO);

/** Build-time mathematical invariants asserting every spoken value across all 28 scenes. */
export function verifyGradientsInvariants() {
  verifyInvariant(validateModel() === true, 'validateModel() must pass');

  // Intro & loss square arithmetic
  verifyApprox(derivativeLoss(3), 1, 1e-12, 'loss at w=3');
  verifyApprox(derivativeLoss(2.9), 0.64, 1e-12, 'loss at w=2.9');
  verifyApprox(derivativeLoss(2.5), 0, 1e-12, 'loss at w=2.5');
  verifyApprox(derivativeLoss(2.25), 0.25, 1e-12, 'loss at w=2.25');
  verifyApprox(derivativeLoss(2), 1, 1e-12, 'loss at w=2');
  verifyApprox(2 * 2.99, 5.98, 1e-12, 'prediction at w=2.99');

  // Finite differences & derivative limit
  verifyApprox(finiteDifference(0.001), 4.004, 1e-9, 'finite difference at h=0.001');
  verifyApprox(derivativeLoss(3.001), 1.004004, 1e-9, 'loss at w=3.001');

  // Two-weight linear gradient & contour update
  verifyApprox(LINEAR_TWO_WEIGHT.prediction, 6, 1e-12, 'two-weight prediction');
  verifyApprox(LINEAR_TWO_WEIGHT.loss, 1, 1e-12, 'two-weight loss');
  verifyApprox(LINEAR_TWO_WEIGHT.gradient[0], 4, 1e-12, 'prompt partial derivative');
  verifyApprox(LINEAR_TWO_WEIGHT.gradient[1], 2, 1e-12, 'queue partial derivative');
  const contourStep = latencyExample([2 - 0.08 * 4, 2 - 0.08 * 2], [2, 1], 5);
  verifyApprox(contourStep.loss, 0.04, 1e-12, 'contour step loss');

  // Step size limits & stability
  verifyApprox(derivativeLoss(2.6), 0.04, 1e-12, 'rate 0.1 step loss');
  verifyApprox(derivativeLoss(-1), 49, 1e-12, 'rate 1.0 overshoot loss');
  verifyApprox(1 - 8 * 0.1, 0.2, 1e-12, 'rate 0.1 contraction factor');
  verifyApprox(1 - 8 * 0.25, -1, 1e-12, 'rate 0.25 boundary factor');
  verifyApprox(1 / 200 ** 2, 0.000025, 1e-12, 'raw-token stability bound');

  // ReLU gate & corner
  const reluOn = reluBranchState(2);
  const reluOff = reluBranchState(-0.5);
  verifyApprox(reluOn.promptGradient, 4, 1e-12, 'active ReLU prompt grad');
  verifyApprox(reluOff.loss, 9, 1e-12, 'inactive ReLU loss');
  verifyApprox(reluOff.promptGradient, 0, 1e-12, 'inactive ReLU prompt grad');
  verifyApprox(reluOff.queueGradient, -6, 1e-12, 'inactive ReLU queue grad');
  const corner = reluCornerDifference(1e-6);
  verifyApprox(corner.left, 0, 1e-9, 'corner left slope');
  verifyApprox(corner.right, -12, 1e-4, 'corner right limit');
  verifyApprox(corner.center, -6, 1e-4, 'corner centered limit');
  verifyApprox(reluBranchState(0.25).loss, 6.25, 1e-12, 'loss at w=0.25');

  // Shared weight path accumulation & batch conditioning
  verifyApprox(
    LINEAR_TWO_WEIGHT.gradient[0] + LINEAR_TWO_WEIGHT.gradient[1],
    6,
    1e-12,
    'shared weight sum',
  );
  const batch0 = batchGradientState([0, 0]);
  verifyApprox(batch0.loss, 43.375, 1e-12, 'batch initial MSE');
  verifyApprox(batch0.gradient[0], -36, 1e-12, 'batch prompt grad');
  verifyApprox(batch0.gradient[1], -14.75, 1e-12, 'batch queue grad');
  verifyApprox(BATCH_HISTORY[1].weights[0], 1.08, 1e-12, 'batch step 1 w_p');
  verifyApprox(BATCH_HISTORY[1].weights[1], 0.4425, 1e-12, 'batch step 1 w_q');
  verifyApprox(batchGradientState([2.1, 1.25]).rows[3].error, 0.9, 1e-12, 'conditioning R4 error');

  // Vector-Jacobian product seeds
  const r1 = latencyExample([1.3, 1.1], BATCH_FEATURES[0], 0).prediction;
  const r3 = latencyExample([1.3, 1.1], BATCH_FEATURES[2], 0).prediction;
  verifyApprox(r3 - r1, 2.6, 1e-12, 'VJP prediction gap');

  // Precision probe & batch backward check
  verifyApprox(PRECISION_DOUBLE.slope, 4, 1e-6, 'float64 centered check');
  verifyApprox(PRECISION_SINGLE.slope, 3.814697265625, 1e-8, 'float32 requested spacing slope');
  verifyApprox(PRECISION_SINGLE.slopeAtStoredSpacing, 4, 1e-12, 'float32 stored spacing slope');
  const probeBatch = batchGradientState([1.3, 1.1]);
  verifyApprox(probeBatch.gradient[0], -9.9, 1e-9, 'batch check prompt grad');
  verifyApprox(probeBatch.gradient[1], -3.925, 1e-9, 'batch check queue grad');

  // PyTorch loop & saved output
  verifyApprox(SIGMOID_TWO, 0.8807970779778823, 1e-12, 'sigmoid(2)');
  verifyApprox(SIGMOID_GRAD, 0.3149807562105239, 1e-12, 'd(3*sigmoid(2))/da');

  // Nonlinear hidden unit, update, dead ReLU, deep products, fresh request
  verifyApprox(HIDDEN_STEP_FULL.before.loss, 0.25, 1e-12, 'hidden initial loss');
  verifyApprox(HIDDEN_STEP_FULL.after.prediction, 5.8, 1e-12, 'hidden rate 0.05 prediction');
  verifyApprox(HIDDEN_STEP_FULL.after.loss, 0.64, 1e-12, 'hidden rate 0.05 overshoot loss');
  verifyApprox(HIDDEN_STEP_HALF.after.prediction, 5.1375, 1e-12, 'hidden rate 0.025 prediction');
  verifyApprox(HIDDEN_STEP_HALF.after.loss, 0.01890625, 1e-12, 'hidden rate 0.025 loss');
  verifyApprox(HIDDEN_DEAD_UNIT.loss, 20.25, 1e-12, 'dead ReLU loss');
  verifyApprox(HIDDEN_DEAD_UNIT.gradient[3], -9, 1e-12, 'dead ReLU output bias grad');
  verifyApprox(0.5 ** 10, 1 / 1024, 1e-12, 'vanishing 10-step product');
  verifyApprox(2 ** 10, 1024, 1e-12, 'exploding 10-step product');
  verifyApprox(CHALLENGE_START.prediction, 8, 1e-12, 'challenge prediction');
  verifyApprox(CHALLENGE_UPDATED.prediction, 7, 1e-12, 'challenge updated prediction');
  verifyApprox(CHALLENGE_UNSEEN.prediction, 5.5, 1e-12, 'challenge unseen prediction');
  verifyApprox(HIDDEN_FRESH_STEP.after.prediction, 1.9675, 1e-12, 'fresh step prediction');
  verifyApprox(HIDDEN_COPIED_FRESH.prediction, 2.23, 1e-12, 'copied gradient prediction');
}

/** Non-overlapping two-phase crossfade helpers (P5: old drops to 0 before new rises). */
export const fadeOut = (t) => Math.max(0, Math.min(1, 1 - t / 0.42));
export const fadeIn = (t) => Math.max(0, Math.min(1, (t - 0.58) / 0.42));

/** Clamp an animation duration so it strictly ends before `c.end - margin`. */
export function safeDur(clock, startTime, desired, margin = 0.32) {
  const avail = clock.end - startTime - margin;
  return Math.max(0.08, Math.min(desired, avail));
}

/** Schedule a Value transition cleanly on or after a declared cue without overrunning. */
export function cueTo(s, c, cueId, val, target, { after = false, dur = 0.65, ease } = {}) {
  const info = c.cue(cueId);
  const t0 = after ? info.end : info.start;
  const duration = safeDur(c, t0, dur);
  const opts = ease ? { duration, ease } : { duration };
  if (after) {
    c.after(cueId, () => s.play(val.to(target, opts)));
  } else {
    c.on(cueId, () => s.play(val.to(target, opts)));
  }
  return info;
}

/** Schedule a gentle pulse on a Value when a cue starts (also marks the cue used). */
export function pulseCue(s, c, cueId, val, peak = 1, { dur = 0.45, after = false } = {}) {
  const info = c.cue(cueId);
  const t0 = after ? info.end : info.start;
  const duration = safeDur(c, t0, dur);
  const run = () => s.play(val.to(peak, { duration }));
  if (after) c.after(cueId, run);
  else c.on(cueId, run);
  return info;
}

/** Continuous living scene-wide phase drift [0 -> target] bounded strictly inside the scene. */
export function livingDrift(s, c, val, target = 1, { startOffset = 0.05, endMargin = 0.45 } = {}) {
  const span = c.end - c.start;
  const duration = Math.max(0.3, span - startOffset - endMargin);
  c.at(startOffset, () => s.play(val.to(target, { duration, ease: linear })));
  return duration;
}

/** Mark a node (and its children recursively) as backdrop decoration so checkFilm ignores it. */
export function markDecor(node) {
  if (!node) return node;
  if (!node.data) node.data = {};
  node.data.decoration = true;
  if (Array.isArray(node.children)) {
    for (const child of node.children) markDecor(child);
  }
  return node;
}

/** Decorative aura wrapper marked so text over glowing auras never triggers false crowding. */
export function decorAura(x, y, radius, innerHex, midHex = '#07091000') {
  return markDecor(aura(x, y, radius, innerHex, midHex));
}

/** Subtle luminous cosmic coordinate lattice + orbital arcs + starfield marked as decoration. */
export function cinemaGrid({
  color = '#2b3b63',
  accent = COSMOS.cyan,
  opacity = 0.52,
  yOffset = 0,
  seed = 1,
} = {}) {
  const lines = [];
  for (let x = -800; x <= 800; x += 160) {
    lines.push(line([x, -460 + yOffset], [x, 460 + yOffset], { stroke: color, width: 1.2 }));
  }
  for (let y = -400; y <= 400; y += 160) {
    lines.push(line([-880, y + yOffset], [880, y + yOffset], { stroke: color, width: 1.2 }));
  }
  const arcs = [
    circle(560, { fill: null, stroke: accent, width: 1.3, dash: [10, 14] }).opacity(0.28),
    circle(820, { fill: null, stroke: '#5573b8', width: 1.1, dash: [6, 18] }).opacity(0.22),
  ];
  const stars = [];
  for (let i = 0; i < 90; i++) {
    const sx = Math.sin((i + seed * 19) * 127.1 + 3.7) * 43758.5453;
    const sy = Math.sin((i + seed * 31) * 269.5 + 9.1) * 19642.349;
    const x = -930 + (sx - Math.floor(sx)) * 1860;
    const y = -510 + (sy - Math.floor(sy)) * 1020;
    const r = 0.8 + (i % 4) * 0.35;
    const op = 0.16 + (i % 5) * 0.05;
    stars.push(
      dot(r, i % 9 === 0 ? accent : '#8ea4d2')
        .opacity(op)
        .at(x, y),
    );
  }
  return markDecor(
    group(...lines, ...arcs, ...stars)
      .opacity(opacity)
      .zIndex(-60),
  );
}

/** Soft glowing translucent instrument plate (no opaque slide cards). */
export function glassPlate(
  cx,
  cy,
  w,
  h,
  { stroke = COSMOS.cyan, fill = '#10182ccc', radius = 14, strokeWidth = 2.2, glow = 6 } = {},
) {
  const box = rect(w, h, { fill, stroke, width: strokeWidth, radius }).at(cx, cy);
  if (glow > 0) box.glow(glow, stroke);
  return box;
}

/** Glowing connector wire with an animated photon packet riding along it. */
export function photonWire(
  pts,
  progress,
  { color = COSMOS.cyan, width = 3.2, glow = 8, reverse = false, opacity = 0.78 } = {},
) {
  const path = polyPath(pts);
  const ordered = reverse ? [...pts].reverse() : pts;
  const segs = [];
  let totalLen = 0;
  for (let i = 0; i < ordered.length - 1; i++) {
    const len = Math.hypot(ordered[i + 1][0] - ordered[i][0], ordered[i + 1][1] - ordered[i][1]);
    segs.push({ a: ordered[i], b: ordered[i + 1], len });
    totalLen += len;
  }
  const u = ((progress % 1) + 1) % 1;
  let dist = u * totalLen;
  let px = ordered[0][0];
  let py = ordered[0][1];
  for (const seg of segs) {
    if (dist <= seg.len || seg === segs.at(-1)) {
      const f = seg.len > 0 ? Math.min(1, Math.max(0, dist / seg.len)) : 0;
      px = seg.a[0] + (seg.b[0] - seg.a[0]) * f;
      py = seg.a[1] + (seg.b[1] - seg.a[1]) * f;
      break;
    }
    dist -= seg.len;
  }
  return group(
    new Node(path).stroke(color, width, opacity).glow(glow, color),
    dot(6.5, '#ffffff').at(px, py).glow(14, color),
  );
}

/** Format numbers cleanly with true minus sign and controlled decimals. */
export function fmt(v, digits = 3) {
  const clean = Math.abs(v) < 1e-12 ? 0 : v;
  return String(Number(clean.toFixed(digits))).replace('-', '−');
}

/** Format a 1D vector cleanly with true minus signs. */
export function vecLabel(vals, digits = 2) {
  return '(' + vals.map((v) => fmt(v, digits)).join(', ') + ')';
}

/**
 * Luminous 2D coordinate plane helper returning coordinate mappers + backdrop grid & axes.
 * Every label stays >= 26px and gridlines are marked as decoration.
 */
export function makePlot2d({
  left = -740,
  right = 740,
  top = -270,
  bottom = 290,
  xDomain = [0, 6],
  yDomain = [0, 5],
  xTicks = [],
  yTicks = [],
  xLabel = '',
  yLabel = '',
  showZeroY = false,
  showZeroX = false,
} = {}) {
  const X = (v) => left + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * (right - left);
  const Y = (v) => bottom - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * (bottom - top);

  const gridLines = [];
  for (const t of xTicks) {
    const gx = X(t);
    gridLines.push(line([gx, top], [gx, bottom], { stroke: '#1f2b48', width: 1.3 }));
  }
  for (const t of yTicks) {
    const gy = Y(t);
    gridLines.push(line([left, gy], [right, gy], { stroke: '#1f2b48', width: 1.3 }));
  }

  const axisNodes = [
    markDecor(group(...gridLines)),
    line([left, bottom], [right, bottom], { stroke: '#556896', width: 2.6 }),
    line([left, bottom], [left, top], { stroke: '#556896', width: 2.6 }),
  ];

  if (showZeroY && yDomain[0] < 0 && yDomain[1] > 0) {
    axisNodes.push(
      line([left, Y(0)], [right, Y(0)], { stroke: COSMOS.emerald, width: 2, dash: [8, 8] }).opacity(
        0.55,
      ),
    );
  }
  if (showZeroX && xDomain[0] < 0 && xDomain[1] > 0) {
    axisNodes.push(
      line([X(0), top], [X(0), bottom], { stroke: '#4b5f8e', width: 2, dash: [8, 8] }).opacity(
        0.55,
      ),
    );
  }

  for (const t of xTicks) {
    const tx = X(t);
    axisNodes.push(
      line([tx, bottom], [tx, bottom + 10], { stroke: '#7b8eb8', width: 2.2 }),
      txt(fmt(t, 2), tx, bottom + 38, 26, COSMOS.muted, 'mono'),
    );
  }
  for (const t of yTicks) {
    const ty = Y(t);
    axisNodes.push(
      line([left - 10, ty], [left, ty], { stroke: '#7b8eb8', width: 2.2 }),
      txt(fmt(t, 2), left - 24, ty, 26, COSMOS.muted, 'mono', 'right'),
    );
  }
  if (xLabel) {
    axisNodes.push(txt(xLabel, (left + right) / 2, bottom + 84, 26, COSMOS.muted, 'sans'));
  }
  if (yLabel) {
    axisNodes.push(txt(yLabel, left + 8, top - 34, 26, COSMOS.muted, 'sans', 'left'));
  }

  const sampleCurve = (fn, { from = xDomain[0], to = xDomain[1], samples = 120 } = {}) => {
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const xv = from + ((to - from) * i) / samples;
      const yv = fn(xv);
      if (yv >= yDomain[0] - 0.5 && yv <= yDomain[1] + 0.5) {
        pts.push([X(xv), Y(Math.max(yDomain[0], Math.min(yDomain[1], yv)))]);
      }
    }
    return pts;
  };

  return { X, Y, axes: group(...axisNodes), sampleCurve, bounds: { left, right, top, bottom } };
}

/**
 * Smooth 3D height function for the two-weight single-request loss valley L(w_p, w_q) = (2 w_p + w_q - 5)^2.
 * Maps world coordinates (u, v) in [-2.6, 2.6]^2 where w_p = 2 + u*0.65, w_q = 2 + v*0.95.
 */
export function twoWeightSurfaceZ(wp, wq) {
  const raw = (2 * wp + wq - 5) ** 2;
  return 3.2 * (1 - Math.exp(-raw * 0.14)) + 0.04;
}

/**
 * Luminous latency timeline bar comparing observed 5s finish against 2 prompt blocks of width w.
 * Centered cleanly in full-bleed stage coordinates ([-960, 960] x [-540, 540]).
 */
export function latencyTimeline({
  weight = 3,
  traceSeconds,
  leftX = -760,
  secScale = 205,
  yBase = -40,
  showPrediction = true,
  highlightBlock = 0, // 0 none, 1 first, 2 second, 3 both
  showOverrun = true,
  showGapBracket = true,
  showDial = true,
  opacity = 1,
} = {}) {
  const xOf = (sec) => leftX + sec * secScale;
  const pred = 2 * weight;
  const tip = traceSeconds === undefined ? pred : Math.min(traceSeconds, pred);
  const landed = Math.abs(tip - pred) < 1e-4;
  const nodes = [];

  if (showDial) {
    nodes.push(
      txt('200-TOKEN REQUEST', leftX, yBase - 185, 26, COSMOS.cyan, 'mono', 'left'),
      txt('WEIGHT  (s / 100 tokens)', xOf(7) - 180, yBase - 185, 26, COSMOS.muted, 'mono', 'right'),
      txt(fmt(weight, 3), xOf(7), yBase - 185, 48, COSMOS.gold, 'mono', 'right').glow(
        10,
        COSMOS.gold,
      ),
    );
  }

  // Observed 5s emerald bar
  const targetW = xOf(5) - xOf(0);
  nodes.push(
    rect(targetW, 74, {
      fill: '#10362a99',
      stroke: COSMOS.emerald,
      width: 3,
      radius: 10,
    })
      .at(xOf(0) + targetW / 2, yBase - 86)
      .glow(8, COSMOS.emerald),
    txt('Actual finish', xOf(0) + 28, yBase - 86, 30, COSMOS.ink, 'sans', 'left'),
    txt('5 s', xOf(5) - 26, yBase - 86, 36, COSMOS.emerald, 'mono', 'right').glow(
      6,
      COSMOS.emerald,
    ),
    line([xOf(5), yBase - 46], [xOf(5), yBase + 136], {
      stroke: COSMOS.emerald,
      width: 3.2,
      dash: [7, 7],
    }).glow(5, COSMOS.emerald),
  );

  // Two predicted 100-token blocks
  for (let i = 0; i < 2; i++) {
    const bLeft = xOf(i * weight);
    const bRight = xOf(Math.min((i + 1) * weight, tip));
    const bw = bRight - bLeft;
    if (bw <= 8) continue;
    const isLit = highlightBlock === 3 || highlightBlock === i + 1;
    const strokeCol = isLit ? COSMOS.gold : COSMOS.cyan;
    nodes.push(
      rect(bw - 6, 86, {
        fill: isLit ? '#263a5acc' : '#122844b8',
        stroke: strokeCol,
        width: isLit ? 3.8 : 2.8,
        radius: 10,
      })
        .at(bLeft + bw / 2, yBase + 30)
        .glow(isLit ? 12 : 6, strokeCol),
    );
    if (i === 1 && showOverrun && bRight > xOf(5)) {
      const ow = bRight - xOf(5);
      nodes.push(
        rect(ow, 86, {
          fill: '#ff6b8b55',
          stroke: COSMOS.rose,
          width: 2.8,
          radius: 8,
        })
          .at(xOf(5) + ow / 2, yBase + 30)
          .glow(10, COSMOS.rose),
      );
      if (landed && showPrediction && ow > 110) {
        nodes.push(
          txt(`+${fmt(pred - 5, 2)} s`, xOf(5) + ow / 2, yBase + 30, 30, COSMOS.ink, 'mono'),
        );
      }
    }
    if (bw > 180) {
      const labelX = i === 1 && bRight > xOf(5) && showOverrun ? bLeft + 30 : bLeft + bw / 2;
      const anchor = i === 1 && bRight > xOf(5) && showOverrun ? 'left' : 'center';
      nodes.push(
        txt('100 tokens', labelX, yBase + 16, 28, COSMOS.ink, 'sans', anchor),
        txt(`${fmt(weight, 2)} s`, labelX, yBase + 52, 26, strokeCol, 'mono', anchor),
      );
    }
  }

  // Glowing playhead cursor at tip
  nodes.push(
    line([xOf(tip), yBase - 16], [xOf(tip), yBase + 78], {
      stroke: tip > 5 ? COSMOS.rose : COSMOS.cyan,
      width: 5,
    }).glow(10, tip > 5 ? COSMOS.rose : COSMOS.cyan),
  );

  // Bottom seconds ruler
  const rulerY = yBase + 136;
  nodes.push(line([xOf(0), rulerY], [xOf(7), rulerY], { stroke: '#556896', width: 2.8 }));
  for (let i = 0; i <= 7; i++) {
    const tx = xOf(i);
    nodes.push(
      line([tx, rulerY], [tx, rulerY + 12], { stroke: '#7b8eb8', width: 2.2 }),
      txt(String(i), tx, rulerY + 42, 26, COSMOS.muted, 'mono'),
    );
  }
  nodes.push(txt('seconds', xOf(7) + 32, rulerY + 42, 26, COSMOS.muted, 'sans', 'left'));

  if (landed && showGapBracket && Math.abs(pred - 5) > 1e-4) {
    const gy = rulerY + 88;
    const col = pred > 5 ? COSMOS.rose : COSMOS.amber;
    nodes.push(
      line([xOf(5), gy], [xOf(pred), gy], { stroke: col, width: 4.5 }).glow(8, col),
      line([xOf(5), gy - 10], [xOf(5), gy + 10], { stroke: col, width: 3 }),
      line([xOf(pred), gy - 10], [xOf(pred), gy + 10], { stroke: col, width: 3 }),
    );
  }

  if (landed && showPrediction) {
    const px = Math.min(xOf(6.2), Math.max(xOf(0.8), xOf(pred)));
    nodes.push(
      txt(`predicted ŷ = ${fmt(pred, 3)} s`, px, rulerY + 138, 34, COSMOS.cyan, 'mono').glow(
        8,
        COSMOS.cyan,
      ),
    );
  }

  return group(...nodes).opacity(opacity);
}

/**
 * Luminous horizontal trial comparison ruler for nonlinear updates and fresh-request comparisons.
 */
export function trialRuler({
  y = 140,
  label = 'Rate 0.05',
  target = 5,
  start = 4.5,
  current = 4.5,
  color = COSMOS.cyan,
  showLoss = false,
  leftX = -830,
  centerX = 110,
  scale = 540,
  opacity = 1,
} = {}) {
  const xOf = (sec) => centerX + (sec - target) * scale;
  const minX = xOf(target - 0.72);
  const maxX = xOf(target + 1.0);
  const loss = (current - target) ** 2;

  const nodes = [
    txt(label, leftX, y - 6, 32, color, 'sans', 'left').glow(5, color),
    line([minX, y], [maxX, y], { stroke: '#3c4f7a', width: 3 }),
    ...[-0.5, 0, 0.5, 1].map((off) =>
      line([xOf(target + off), y - 8], [xOf(target + off), y + 8], {
        stroke: '#6c80ad',
        width: 2,
      }),
    ),
    // Emerald target marker
    line([xOf(target), y - 30], [xOf(target), y + 26], { stroke: COSMOS.emerald, width: 4 }).glow(
      8,
      COSMOS.emerald,
    ),
    txt(`start ${fmt(start, 2)} s`, xOf(start), y - 50, 26, COSMOS.muted, 'mono'),
    txt(`target ${fmt(target, 2)} s`, xOf(target), y - 50, 26, COSMOS.emerald, 'mono'),
    // Error span bar
    line([xOf(target), y + 16], [xOf(current), y + 16], { stroke: color, width: 5.5 }).glow(
      8,
      color,
    ),
    // Open starting ring
    circle(13, { fill: COSMOS.bg, stroke: COSMOS.muted, width: 3 }).at(xOf(start), y),
    // Glowing current landing orb
    dot(10, color).at(xOf(current), y).glow(14, color),
    dot(4, '#ffffff').at(xOf(current), y),
    txt(`${fmt(current, 4)} s`, xOf(current), y + 54, 28, color, 'mono').glow(6, color),
  ];

  if (showLoss) {
    nodes.push(txt(`loss = ${fmt(loss, 8)}`, leftX, y + 42, 28, color, 'mono', 'left'));
  }

  return group(...nodes).opacity(opacity);
}

/** Luminous circular computation graph node with label above and value inside. */
export function compNode(
  cx,
  cy,
  {
    radius = 52,
    label = '',
    value = '',
    sub = '',
    color = COSMOS.cyan,
    active = true,
    glow = 10,
    labelYOffset = -80,
    subYOffset = 80,
    valueSize = 32,
  } = {},
) {
  const strokeCol = active ? color : '#394b72';
  const fillCol = active ? '#111a31e6' : '#0b1020cc';
  const parts = [
    circle(radius, { fill: fillCol, stroke: strokeCol, width: active ? 3.2 : 2 })
      .at(cx, cy)
      .glow(active ? glow : 0, strokeCol),
  ];
  if (value !== '') {
    parts.push(txt(String(value), cx, cy, valueSize, active ? color : COSMOS.muted, 'mono'));
  }
  if (label) {
    parts.push(txt(label, cx, cy + labelYOffset, 26, active ? COSMOS.ink : COSMOS.muted, 'sans'));
  }
  if (sub) {
    parts.push(txt(sub, cx, cy + subYOffset, 26, color, 'mono'));
  }
  return group(...parts);
}

/**
 * Luminous 5-stage hidden ReLU network graph (used in nonlinear-forward, deep-products, fresh-nonlinear).
 * Coordinate-centered for 1920x1080 full-bleed stage.
 */
export function hiddenUnitFlow(
  state,
  {
    yCenter = -30,
    forwardStage = 4, // 0=input only, 1=h, 2=z, 3=pred, 4=loss
    backwardStage = 0, // 0=none, 1=dL/dy, 2=dL/dz, 3=dL/dh, 4=dL/dx & all grads
    showWeights = true,
    showGradSummary = false,
    gradQuestion = false,
    drift = 0,
    opacity = 1,
  } = {},
) {
  const xs = [-720, -360, 0, 370, 730];
  const nodeSpecs = [
    { x: xs[0], label: 'input x', val: fmt(state.input, 2), col: COSMOS.blue, ready: true },
    {
      x: xs[1],
      label: 'h = w₁x + b₁',
      val: forwardStage >= 1 ? fmt(state.h, 3) : '?',
      col: COSMOS.cyan,
      ready: forwardStage >= 1,
    },
    {
      x: xs[2],
      label: 'z = ReLU(h)',
      val: forwardStage >= 2 ? fmt(state.z, 3) : '?',
      col: state.gate ? COSMOS.emerald : COSMOS.rose,
      ready: forwardStage >= 2,
    },
    {
      x: xs[3],
      label: 'prediction ŷ',
      val: forwardStage >= 3 ? fmt(state.prediction, 4) : '?',
      col: COSMOS.gold,
      ready: forwardStage >= 3,
    },
    {
      x: xs[4],
      label: 'loss (ŷ − y)²',
      val: forwardStage >= 4 ? fmt(state.loss, 4) : '?',
      col: COSMOS.rose,
      ready: forwardStage >= 4,
    },
  ];

  const parts = [];

  if (showWeights) {
    const wNames = ['w₁', 'b₁', 'w₂', 'b₂'];
    const wXs = [-540, -180, 185, 550];
    wNames.forEach((wn, i) => {
      parts.push(
        txt(wn, wXs[i], yCenter - 225, 26, COSMOS.muted, 'mono'),
        txt(fmt(state.weights[i], 3), wXs[i], yCenter - 180, 34, COSMOS.gold, 'mono').glow(
          6,
          COSMOS.gold,
        ),
      );
    });
  }

  // Forward glowing wires
  for (let i = 0; i < 4; i++) {
    const x1 = xs[i] + 64;
    const x2 = xs[i + 1] - 64;
    const active = forwardStage >= i + 1;
    if (active) {
      parts.push(
        photonWire(
          [
            [x1, yCenter],
            [x2, yCenter],
          ],
          drift * 2.5 + i * 0.25,
          { color: i === 3 ? COSMOS.rose : COSMOS.cyan, width: 3.4, glow: 8 },
        ),
      );
    } else {
      parts.push(line([x1, yCenter], [x2, yCenter], { stroke: '#2c3d66', width: 2.2 }));
    }
  }

  // Nodes
  for (const n of nodeSpecs) {
    parts.push(
      compNode(n.x, yCenter, {
        radius: 58,
        label: n.label,
        value: n.val,
        color: n.col,
        active: n.ready,
        labelYOffset: -88,
        valueSize: 30,
      }),
    );
  }
  parts.push(
    txt(`target y = ${fmt(state.target, 2)}`, xs[4], yCenter + 92, 26, COSMOS.emerald, 'mono'),
  );

  // Backward luminous photon paths
  if (backwardStage > 0) {
    const bPaths = [
      { from: xs[4], to: xs[3], val: state.signal, active: true },
      { from: xs[3], to: xs[2], val: state.signal * state.weights[2], active: true },
      {
        from: xs[2],
        to: xs[1],
        val: state.signal * state.weights[2] * state.gate,
        active: Boolean(state.gate),
      },
      { from: xs[1], to: xs[0], val: state.inputGradient, active: Boolean(state.gate) },
    ];
    const by = yCenter + 165;
    bPaths.slice(0, backwardStage).forEach((bp, idx) => {
      const col = bp.active ? COSMOS.rose : COSMOS.dim;
      const x1 = bp.from - 64;
      const x2 = bp.to + 64;
      if (bp.active) {
        parts.push(
          photonWire(
            [
              [x1, by],
              [x2, by],
            ],
            drift * 2.8 + idx * 0.22,
            { color: COSMOS.rose, width: 3.8, glow: 10 },
          ),
        );
      } else {
        parts.push(line([x1, by], [x2, by], { stroke: COSMOS.dim, width: 2.4, dash: [8, 8] }));
      }
      parts.push(
        arrow([x1, by], [x2, by], { stroke: col, width: 2.6, tip: 11 }).opacity(0.85),
        txt(
          idx === 3 ? `in ${fmt(bp.val, 2)}` : fmt(bp.val, 2),
          (x1 + x2) / 2,
          by - 34,
          28,
          col,
          'mono',
        ),
      );
    });

    if (backwardStage >= 3) {
      const gCol = state.gate ? COSMOS.emerald : COSMOS.rose;
      parts.push(
        txt(
          state.gate ? 'gate = 1 (open)' : 'gate = 0 (blocked)',
          xs[2],
          by + 48,
          26,
          gCol,
          'mono',
        ).glow(6, gCol),
      );
    }
    if (backwardStage >= 2) {
      parts.push(
        txt(
          `∂L/∂w₂ = ${fmt(state.signal, 2)} × ${fmt(state.z, 2)} = ${fmt(state.gradient[2], 2)}`,
          xs[3] + 60,
          by + 48,
          26,
          COSMOS.rose,
          'mono',
        ),
      );
    }
    if (backwardStage >= 4) {
      parts.push(
        txt(
          `∂L/∂w₁ = ${fmt(state.signal * state.weights[2] * state.gate, 2)} × ${fmt(state.input, 2)} = ${fmt(state.gradient[0], 2)}`,
          xs[1] - 60,
          by + 48,
          26,
          state.gate ? COSMOS.rose : COSMOS.muted,
          'mono',
        ),
      );
    }
    if (showGradSummary && backwardStage >= 4) {
      parts.push(
        txt(
          `∇L = (${state.gradient.map((g) => fmt(g, 2)).join(', ')})`,
          0,
          by + 114,
          38,
          COSMOS.gold,
          'mono',
        ).glow(10, COSMOS.gold),
      );
    }
  } else if (gradQuestion) {
    parts.push(txt('∇L = (?, ?, ?, ?)', 0, yCenter + 275, 38, COSMOS.muted, 'mono'));
  }

  return group(...parts).opacity(opacity);
}

export {
  decorAura as aura,
  glowTex,
  guardedDynamic,
  linear,
  linearGradient,
  polyPath,
  radialGradient,
  text,
  txt,
};
