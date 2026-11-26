// Shared cinematic palette, math invariants, and reusable glowing primitives
// for the 19-scene Scaled Dot-Product Attention stage film.
import { arrow, circle, dot, group, line, rect, seq } from 'vizmatic/stage';
import {
  BIRDS_PULL,
  COLUMN_SUMS,
  DROPPED_OUTPUT,
  DROPPED_SHARE,
  EXPS,
  FP16_MAX,
  GAP_SHARES,
  HEAD2,
  HEAD2_OUTPUT,
  HEAD2_SCORES,
  HEAD2_WEIGHTS,
  K,
  LEAD_SLOPE,
  LONG_KEY,
  NEW_OUTPUT,
  NEW_QUERY,
  NEW_SCORES,
  NEW_STATE,
  NEW_WEIGHTS,
  OUTPUT,
  Q,
  ROOT,
  SCALED,
  SCORES,
  SCORE_BYTES,
  SHORT_KEY,
  STABLE_SHARES,
  TIED_SLOPE,
  TRACE,
  UNSCALED_WEIGHTS,
  V,
  WEIGHTS,
  angleTo,
  blendOf,
  cacheBytes,
  dot as dotProd,
  onlineSoftmax,
  project,
  shareSlope,
  softmax,
} from '../../films/attention/model.mjs';
import {
  COSMOS,
  aura,
  glowDot,
  glowingTrail,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';

export {
  BIRDS_PULL,
  COLUMN_SUMS,
  DROPPED_OUTPUT,
  DROPPED_SHARE,
  EXPS,
  FP16_MAX,
  GAP_SHARES,
  HEAD2,
  HEAD2_OUTPUT,
  HEAD2_SCORES,
  HEAD2_WEIGHTS,
  K,
  LEAD_SLOPE,
  LONG_KEY,
  NEW_OUTPUT,
  NEW_QUERY,
  NEW_SCORES,
  NEW_STATE,
  NEW_WEIGHTS,
  OUTPUT,
  Q,
  ROOT,
  SCALED,
  SCORES,
  SCORE_BYTES,
  SHORT_KEY,
  STABLE_SHARES,
  TIED_SLOPE,
  TRACE,
  UNSCALED_WEIGHTS,
  V,
  WEIGHTS,
  angleTo,
  blendOf,
  cacheBytes,
  dotProd,
  onlineSoftmax,
  project,
  shareSlope,
  softmax,
};

/** One semantic color per conceptual role across all 19 scenes. */
export const ROLE = Object.freeze({
  query: COSMOS.gold,
  birds: COSMOS.blue,
  sing: COSMOS.cyan,
  value: COSMOS.emerald,
  mask: COSMOS.rose,
  head: COSMOS.violet,
  amber: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
  surface: COSMOS.surface,
  surfaceAlt: COSMOS.surfaceAlt,
});

export const SENTENCE = Object.freeze([
  'Birds',
  'in',
  'the',
  'garden',
  'sing',
  'softly',
  'at',
  'dawn.',
]);

export const fmt = (n, digits = 2) => Number(n).toFixed(digits);
export const pct = (n) => `${Math.round(n * 100)}%`;
export const vecStr = (v, digits = 2) => `[${v.map((x) => fmt(x, digits)).join(', ')}]`;
export const vecTrim = (v) =>
  `[${v.map((x) => (Number.isInteger(x) ? String(x) : fmt(x, 1))).join(', ')}]`;

/** Verify all computed numbers imported from model.mjs at film build time. */
export function verifyAttentionModel() {
  verifyApprox(SCORES[1][0], 0.6, 1e-6, 'sing->birds dot product');
  verifyApprox(SCORES[1][1], 1.05, 1e-6, 'sing->sing dot product');
  verifyApprox(SCALED[1][0], 0.6 / Math.sqrt(2), 1e-6, 'scaled sing->birds');
  verifyApprox(SCALED[1][1], 1.05 / Math.sqrt(2), 1e-6, 'scaled sing->sing');
  verifyApprox(WEIGHTS[1][0] + WEIGHTS[1][1], 1, 1e-9, 'sing weights sum to 1');
  verifyApprox(WEIGHTS[0][0] + WEIGHTS[0][1], 1, 1e-9, 'birds weights sum to 1');
  verifyApprox(OUTPUT[1][0], 1.421, 0.002, 'sing output x');
  verifyApprox(OUTPUT[1][1], 1.579, 0.002, 'sing output y');
  verifyApprox(OUTPUT[0][0], 1.527, 0.002, 'birds output x');
  verifyApprox(OUTPUT[0][1], 1.473, 0.002, 'birds output y');
  verifyApprox(COLUMN_SUMS[0], 0.95, 0.01, 'column sum 0');
  verifyApprox(COLUMN_SUMS[1], 1.05, 0.01, 'column sum 1');
  verifyApprox(HEAD2_OUTPUT[0], 0.33, 0.01, 'head2 output 0');
  verifyApprox(HEAD2_OUTPUT[1], 0.67, 0.01, 'head2 output 1');
  verifyApprox(TIED_SLOPE, 2 / 9, 1e-6, 'tied softmax slope');
  verifyInvariant(LEAD_SLOPE > 4e-9 && LEAD_SLOPE < 4.2e-9, 'lead softmax slope');
  verifyApprox(BIRDS_PULL[0], 0.24, 0.01, 'birds pull x');
  verifyApprox(BIRDS_PULL[1], -0.24, 0.01, 'birds pull y');
  verifyApprox(SCORE_BYTES / 1e9, 34.36, 0.05, 'score bytes GB');
  verifyApprox(Math.round(cacheBytes(64) / 1e9), 344, 0, 'MHA KV cache GB');
  verifyApprox(Math.round(cacheBytes(8) / 1e9), 43, 0, 'GQA KV cache GB');
  verifyApprox(Math.round(cacheBytes(1) / 1e9), 5, 0, 'MQA KV cache GB');
  verifyApprox(TRACE.output, 1.51, 0.01, 'online softmax exact output');
  verifyApprox(NEW_QUERY[0], 2.5, 1e-6, 'transfer query x');
  verifyApprox(NEW_QUERY[1], 3.5, 1e-6, 'transfer query y');
  verifyApprox(NEW_SCORES[0], 2.7, 1e-6, 'transfer score birds');
  verifyApprox(NEW_SCORES[1], 3.9, 1e-6, 'transfer score sing');
  verifyApprox(NEW_OUTPUT[0], 1.3, 0.01, 'transfer output x');
  verifyApprox(NEW_OUTPUT[1], 1.7, 0.01, 'transfer output y');
  const editedV = [
    [2, 3],
    [1, 2],
  ];
  const editedOut = blendOf(NEW_WEIGHTS, editedV);
  verifyApprox(editedOut[0], 1.3, 0.01, 'edited output x');
  verifyApprox(editedOut[1], 2.3, 0.01, 'edited output y');
}

/** Clamp a play duration so an animation never runs past the scene's narration. */
export function safeDur(c, startTime, desired = 0.75, margin = 0.42) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.12, Math.min(desired, remaining));
}

/**
 * Schedule an animation at a declared cue (start or end), clamping its duration
 * safely inside the scene window.
 */
export function playCue(
  s,
  c,
  cueId,
  build,
  { after = false, offset = 0, dur = 0.75, margin = 0.42 } = {},
) {
  const info = c.cue(cueId);
  const startAt = (after ? info.end : info.start) + offset;
  const d = safeDur(c, startAt, dur, margin);
  if (after) {
    c.after(cueId, () => build(d), offset);
  } else {
    c.on(cueId, () => build(d), offset);
  }
  return d;
}

/** Sequential fade-out then fade-in across two dynamic view values (zero overlap). */
export function swapVis(outVal, inVal, d = 0.65) {
  const half = Math.max(0.12, d * 0.46);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

/** Smooth quadratic Bezier polyline points between two 2D points with perpendicular lift. */
export function arcPts(p0, p1, lift = -120, steps = 28) {
  const mx = (p0[0] + p1[0]) / 2;
  const my = (p0[1] + p1[1]) / 2 + lift;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
    ]);
  }
  return pts;
}

/** Sample a smooth Gaussian bell curve into canvas [x, y] points. */
export function bellPts(cx, baseY, halfW, peakH, sigma, xMax = 28, steps = 90) {
  const pts = [];
  const inv2s2 = 1 / (2 * sigma * sigma);
  for (let i = 0; i <= steps; i++) {
    const u = -1 + (2 * i) / steps;
    const xVal = u * xMax;
    const yNorm = Math.exp(-xVal * xVal * inv2s2);
    pts.push([cx + u * halfW, baseY - yNorm * peakH]);
  }
  return pts;
}

/** Glowing vector arrow from origin [ox, oy] to tip [tx, ty] with tip photon. */
export function glowVector(
  origin,
  tip,
  { color = ROLE.query, width = 5, tipSize = 18, glow = 10, opacity = 1, dotRadius = 5 } = {},
) {
  const len = Math.hypot(tip[0] - origin[0], tip[1] - origin[1]);
  if (len < 2) {
    return glowDot(origin[0], origin[1], { radius: dotRadius, color, glow, opacity });
  }
  const vec = arrow(origin, tip, { stroke: color, width, tip: tipSize }).opacity(opacity);
  if (glow > 0) vec.glow(glow, color);
  const head = glowDot(tip[0], tip[1], { radius: dotRadius, color, glow: glow + 2, opacity });
  return group(vec, head);
}

/** Luminous horizontal or vertical bar with soft fill and bright edge glow (no bullet-card chrome). */
export function lumBar(
  x,
  y,
  w,
  h,
  {
    color = ROLE.birds,
    fillOpacity = 0.28,
    strokeWidth = 2.5,
    glow = 8,
    radius = 8,
    opacity = 1,
  } = {},
) {
  const safeW = Math.max(4, w);
  const safeH = Math.max(4, h);
  const body = rect(safeW, safeH, {
    fill: color,
    stroke: color,
    width: strokeWidth,
    radius,
  })
    .at(x, y)
    .opacity(fillOpacity * opacity);
  const edge = rect(safeW, safeH, {
    fill: null,
    stroke: color,
    width: strokeWidth,
    radius,
  })
    .at(x, y)
    .opacity(0.92 * opacity);
  if (glow > 0) edge.glow(glow, color);
  return group(body, edge);
}

/**
 * Clean 2D coordinate plane with glowing axes, subtle grid hairlines, and unit ticks.
 * Returns { node, toScreen(vx, vy), origin }.
 */
export function vectorPlane({
  originX = 240,
  originY = 260,
  scale = 240,
  xMin = -0.3,
  xMax = 2.2,
  yMin = -0.3,
  yMax = 2.2,
  step = 0.5,
  axisColor = '#556894',
  gridColor = '#2b385a',
  xLabel = 'x₁',
  yLabel = 'x₂',
} = {}) {
  const toScreen = (vx, vy) => [originX + vx * scale, originY - vy * scale];
  const left = originX + xMin * scale;
  const right = originX + xMax * scale;
  const bottom = originY - yMin * scale;
  const top = originY - yMax * scale;

  const parts = [
    aura(
      (left + right) / 2,
      (top + bottom) / 2,
      Math.max(right - left, bottom - top) * 0.68,
      '#1e2d5c40',
      '#0d152b18',
    ).zIndex(-50),
  ];

  for (let gx = Math.ceil(xMin / step) * step; gx <= xMax + 1e-6; gx += step) {
    const sx = originX + gx * scale;
    const isZero = Math.abs(gx) < 1e-6;
    parts.push(
      line([sx, bottom], [sx, top], {
        stroke: isZero ? axisColor : gridColor,
        width: isZero ? 2.6 : 1.3,
      }).opacity(isZero ? 0.9 : 0.65),
    );
  }
  for (let gy = Math.ceil(yMin / step) * step; gy <= yMax + 1e-6; gy += step) {
    const sy = originY - gy * scale;
    const isZero = Math.abs(gy) < 1e-6;
    parts.push(
      line([left, sy], [right, sy], {
        stroke: isZero ? axisColor : gridColor,
        width: isZero ? 2.6 : 1.3,
      }).opacity(isZero ? 0.9 : 0.65),
    );
  }

  // Axis arrowheads and crisp labels placed cleanly beyond axis tips
  parts.push(
    arrow([left, originY], [right + 16, originY], { stroke: axisColor, width: 2.6, tip: 12 }),
    arrow([originX, bottom], [originX, top - 16], { stroke: axisColor, width: 2.6, tip: 12 }),
    dot(4.5, COSMOS.ink).at(originX, originY),
    txt(xLabel, right + 42, originY, 28, COSMOS.muted, 'mono', 'left'),
    txt(yLabel, originX, top - 42, 28, COSMOS.muted, 'mono', 'center'),
  );

  // Clean integer tick labels outside the grid
  for (let ix = 1; ix <= Math.floor(xMax); ix++) {
    parts.push(
      txt(String(ix), originX + ix * scale, originY + 34, 26, COSMOS.dim, 'mono', 'center'),
    );
  }
  for (let iy = 1; iy <= Math.floor(yMax); iy++) {
    parts.push(
      txt(String(iy), originX - 34, originY - iy * scale, 26, COSMOS.dim, 'mono', 'right'),
    );
  }

  return {
    node: group(...parts).zIndex(-10),
    toScreen,
    origin: [originX, originY],
    bounds: { left, right, top, bottom },
  };
}

/**
 * Full-canvas ambient energy field: radial auras + luminous constellation anchor rings
 * placed cleanly behind scene geometry (no stroke lines crossing text).
 */
export function cinemaAtmosphere(accent = ROLE.sing, secondary = ROLE.query) {
  return group(
    aura(-540, -240, 560, `${accent}24`, '#07091000'),
    aura(460, 140, 620, `${secondary}20`, '#07091000'),
    aura(0, 0, 720, '#2a3d7a22', '#07091000'),
  ).zIndex(-80);
}

/**
 * Glowing conserved share strip (horizontal bar split into weighted segments with clean
 * external labels above/below so labels never collide with bar borders).
 */
export function shareRibbon({
  x = 0,
  y = 0,
  width = 760,
  height = 54,
  shares = [0.421, 0.579],
  colors = [ROLE.birds, ROLE.sing],
  labels = ['Birds', 'sing'],
  showPct = true,
  opacity = 1,
} = {}) {
  const left = x - width / 2;
  const parts = [];
  let cursor = left;
  shares.forEach((w, i) => {
    const segW = Math.max(2, w * width);
    const cx = cursor + segW / 2;
    const col = colors[i % colors.length];
    parts.push(
      lumBar(cx, y, segW - 4, height, {
        color: col,
        fillOpacity: 0.42,
        strokeWidth: 2.5,
        glow: 9,
        radius: 6,
        opacity,
      }),
    );
    if (showPct && segW > 110) {
      const lbl = labels[i] ? `${labels[i]} ${pct(w)}` : pct(w);
      parts.push(txt(lbl, cx, y - height / 2 - 30, 28, col, 'mono', 'center').opacity(opacity));
    }
    cursor += segW;
  });
  return group(...parts);
}

/** Luminous ring marker (for value endpoints, query focal points, etc.). */
export function glowRing(x, y, radius, color, { width = 3.5, glow = 10, fillOpacity = 0.14 } = {}) {
  const fill = circle(radius, { fill: color, stroke: null }).at(x, y).opacity(fillOpacity);
  const ring = circle(radius, { fill: null, stroke: color, width }).at(x, y).glow(glow, color);
  return group(fill, ring);
}

/** Luminous matrix cell grid without PowerPoint table clutter. */
export function glowMatrix({
  cx = 0,
  cy = 0,
  rows = 2,
  cols = 2,
  cellW = 136,
  cellH = 74,
  gap = 12,
  values = [],
  colors = [],
  rowLabels = [],
  colLabels = [],
  highlight = () => false,
  dim = () => false,
  fontSize = 30,
  bracketColor = '#6e83b7',
} = {}) {
  const totalW = cols * cellW + (cols - 1) * gap;
  const totalH = rows * cellH + (rows - 1) * gap;
  const left = cx - totalW / 2;
  const top = cy - totalH / 2;
  const parts = [];

  // Subtle glowing matrix brackets on left & right
  const bxL = left - 18;
  const bxR = left + totalW + 18;
  const byT = top - 10;
  const byB = top + totalH + 10;
  parts.push(
    glowingTrail(
      [
        [bxL + 14, byT],
        [bxL, byT],
        [bxL, byB],
        [bxL + 14, byB],
      ],
      { color: bracketColor, width: 3, glow: 5, core: false, opacity: 0.78 },
    ),
    glowingTrail(
      [
        [bxR - 14, byT],
        [bxR, byT],
        [bxR, byB],
        [bxR - 14, byB],
      ],
      { color: bracketColor, width: 3, glow: 5, core: false, opacity: 0.78 },
    ),
  );

  for (let r = 0; r < rows; r++) {
    const ry = top + r * (cellH + gap) + cellH / 2;
    if (rowLabels[r]) {
      parts.push(txt(rowLabels[r], bxL - 22, ry, 28, COSMOS.muted, 'sans', 'right'));
    }
    for (let k = 0; k < cols; k++) {
      const rx = left + k * (cellW + gap) + cellW / 2;
      if (r === 0 && colLabels[k]) {
        parts.push(txt(colLabels[k], rx, byT - 30, 28, COSMOS.muted, 'sans', 'center'));
      }
      const val = values[r]?.[k] ?? '';
      const isHi = highlight(r, k);
      const isDim = dim(r, k);
      const col = colors[r]?.[k] ?? (isHi ? ROLE.query : COSMOS.cyan);
      const alpha = isDim ? 0.28 : 1;
      parts.push(
        lumBar(rx, ry, cellW, cellH, {
          color: col,
          fillOpacity: isHi ? 0.34 : 0.16,
          strokeWidth: isHi ? 3 : 1.6,
          glow: isHi ? 10 : 4,
          radius: 8,
          opacity: alpha,
        }),
      );
      if (val !== '') {
        parts.push(
          txt(String(val), rx, ry, fontSize, isHi ? COSMOS.ink : col, 'mono', 'center').opacity(
            alpha,
          ),
        );
      }
    }
  }
  return group(...parts);
}
