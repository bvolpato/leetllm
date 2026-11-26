// Shared cinematic palette, math invariants, and reusable glowing primitives
// for the 23-scene Transformer Architecture End-to-End stage film.
import { arrow, circle, dot, group, line, rect, seq } from 'vizmatic/stage';
import { dotProduct, stableSoftmax } from 'vizmatic';
import {
  ARTICLE_STATES,
  EMBED,
  HEAD_WORKSHEET,
  VOCAB,
  WK,
  WORDS,
  WOUT,
  WQ,
} from '../../films/transformer/fixtures.mjs';
import {
  clamp,
  lerpRow,
  mergeHeads,
  norm,
  normStats,
  position,
  positionIds,
  project,
  slice14,
  splitHeads,
  sum,
  unmaskedRead,
} from '../../films/transformer/arithmetic.mjs';
import {
  AXIS_BASELINES,
  CACHE_RUNS,
  FEEDBACK,
  FEEDBACK_IDS,
  FEEDBACK_INPUT,
  FRESH,
  INPUT,
  MODEL,
  compute,
  normalizationAxisCase,
} from '../../films/transformer/model.mjs';
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
  ARTICLE_STATES,
  AXIS_BASELINES,
  CACHE_RUNS,
  EMBED,
  FEEDBACK,
  FEEDBACK_IDS,
  FEEDBACK_INPUT,
  FRESH,
  HEAD_WORKSHEET,
  INPUT,
  MODEL,
  VOCAB,
  WK,
  WORDS,
  WOUT,
  WQ,
  clamp,
  compute,
  dotProduct,
  lerpRow,
  mergeHeads,
  norm,
  normStats,
  normalizationAxisCase,
  position,
  positionIds,
  project,
  slice14,
  splitHeads,
  stableSoftmax,
  sum,
  unmaskedRead,
};

/** One semantic color per conceptual role across all 23 scenes. */
export const ROLE = Object.freeze({
  query: COSMOS.gold,
  stream: COSMOS.blue,
  attn: COSMOS.cyan,
  valid: COSMOS.emerald,
  mask: COSMOS.rose,
  pos: COSMOS.violet,
  amber: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
  surface: COSMOS.surface,
  surfaceAlt: COSMOS.surfaceAlt,
});

/** Token-specific colors matching the 3-word opening prefix. */
export const TOK_COLORS = Object.freeze([ROLE.stream, ROLE.mask, ROLE.valid, ROLE.attn]);

/** Computed article decoder runs from ARTICLE_STATES (PyTorch seeded & stdlib). */
export const ARTICLE_RUNS = Object.freeze(
  ARTICLE_STATES.map((row) => {
    const [a, b, c, d] = norm(row);
    const logits = [a, 0.2 * a, 0.2 * d, 0.5 * c + d, -b, c];
    const probs = stableSoftmax(logits);
    return Object.freeze({
      row,
      logits,
      resultLogit: logits[3],
      resultProbability: probs[3],
    });
  }),
);

export const fmt = (n, digits = 2) => {
  const num = Number(n);
  const clean = Math.abs(num) < 0.5 * 10 ** -digits ? 0 : num;
  return clean.toFixed(digits);
};
export const pct = (n, digits = 0) => `${(Number(n) * 100).toFixed(digits)}%`;
export const vecStr = (v, digits = 2) => `[${v.map((x) => fmt(x, digits)).join(', ')}]`;

/** Verify all computed numbers imported from videos/films/transformer/model.mjs at build time. */
export function verifyTransformerModel() {
  for (const model of [MODEL, FEEDBACK]) {
    verifyInvariant(
      model.weights.every((row) => Math.abs(sum(row) - 1) < 1e-12),
      'attention weights sum to 1',
    );
    model.weights.forEach((row, i) =>
      row.forEach((v, j) => {
        if (j > i) verifyApprox(v, 0, 1e-12, `causal zero weight [${i},${j}]`);
      }),
    );
    verifyInvariant(
      model.Z.every((row) => row.length === 4 && row.every(Number.isFinite)),
      'block output Z finite width-4',
    );
    verifyInvariant(
      model.H.every((row) => row.length === 6 && row.every((v) => v >= 0)),
      'ReLU hidden H non-negative width-6',
    );
    verifyApprox(sum(model.probs), 1, 1e-12, 'vocabulary probabilities sum to 1');
  }

  verifyApprox(INPUT[2][0], 0.1, 1e-9, 'positioned the coord 1');
  verifyApprox(INPUT[2][3], 1.1, 1e-9, 'positioned the coord 4');
  verifyInvariant(MODEL.choice === 3, 'step 1 greedy choice is result (ID 3)');
  verifyInvariant(FEEDBACK.choice === 5, 'step 2 greedy choice is value (ID 5)');

  // Split & merge head round-trip identity
  const merged = mergeHeads(splitHeads(HEAD_WORKSHEET));
  merged.forEach((r, i) =>
    r.forEach((v, j) => verifyApprox(v, HEAD_WORKSHEET[i][j], 1e-12, `head merge [${i},${j}]`)),
  );

  // Fresh 2-key decoder
  verifyApprox(sum(FRESH.weights), 1, 1e-12, 'fresh weights sum to 1');
  verifyApprox(FRESH.read[0], 3.57183279386, 1e-9, 'fresh read coord 1');
  verifyApprox(FRESH.read[1], 0.21408360307, 1e-9, 'fresh read coord 2');
  verifyApprox(FRESH.wrong[0], 4, 1e-12, 'fresh wrong read x');
  verifyApprox(FRESH.wrong[1], 0, 1e-12, 'fresh wrong read y');

  // Cached SDPA alignment vs upper-left bug
  for (const { full, upperLeft, aligned } of CACHE_RUNS) {
    upperLeft.read.forEach((v, j) => verifyApprox(v, full.V[0][j], 1e-12, 'upperLeft reads V[0]'));
    verifyInvariant(upperLeft.maxLogitDifference > 0.05, 'upperLeft logits differ from full');
    aligned.read.forEach((v, j) => verifyApprox(v, full.A.at(-1)[j], 1e-12, 'aligned matches A'));
    verifyApprox(aligned.maxLogitDifference, 0, 1e-12, 'aligned logits match full');
  }
  verifyInvariant(CACHE_RUNS[0].upperLeft.choice === 4, 'cropped opening prompt selects None');
  verifyInvariant(
    CACHE_RUNS[1].upperLeft.choice === FEEDBACK.choice,
    'cropped step 2 still picks value despite wrong read',
  );

  // Prefix preservation on append
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      verifyApprox(FEEDBACK.Z[i][j], MODEL.Z[i][j], 1e-12, `feedback preserves Z[${i},${j}]`);
    }
  }

  // Normalization axis leakage contrast
  const featAfter = normalizationAxisCase(4, false);
  const posAfter = normalizationAxisCase(4, true);
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 4; j++) {
      verifyApprox(
        featAfter.model.Z[i][j],
        AXIS_BASELINES[0].model.Z[i][j],
        1e-12,
        'feature norm preserves earlier rows',
      );
    }
  }
  const posLeak = Math.max(
    ...posAfter.model.Z[0].map((v, j) => Math.abs(v - AXIS_BASELINES[1].model.Z[0][j])),
  );
  verifyInvariant(posLeak > 0.01, 'position norm leaks future change into row 0');

  // Future vs past perturbation causality
  const future = INPUT.map((r) => [...r]);
  future[2][0] += 4;
  const fOut = compute(future);
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 4; j++) {
      verifyApprox(fOut.Z[i][j], MODEL.Z[i][j], 1e-12, 'future change keeps earlier rows fixed');
    }
  }
  verifyInvariant(
    fOut.Z[2].some((v, j) => Math.abs(v - MODEL.Z[2][j]) > 1e-6),
    'future change moves last row',
  );
  const past = INPUT.map((r) => [...r]);
  past[0][0] += 4;
  const pOut = compute(past);
  verifyInvariant(
    pOut.Z.every((row, i) => row.some((v, j) => Math.abs(v - MODEL.Z[i][j]) > 1e-8)),
    'past change reaches all rows',
  );

  // Article runs both round to 35.3%
  verifyApprox(ARTICLE_RUNS[0].resultProbability * 100, 35.3, 0.1, 'PyTorch article prob 35.3%');
  verifyApprox(ARTICLE_RUNS[1].resultProbability * 100, 35.3, 0.1, 'Stdlib article prob 35.3%');
}

/** Clamp a play duration so an animation never runs past the scene's narration. */
export function safeDur(c, startTime, desired = 0.7, margin = 0.42) {
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
  { after = false, offset = 0, dur = 0.7, margin = 0.42 } = {},
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

/** Luminous bar with soft fill and bright edge glow (for data bars, vector cells, grids). */
export function lumBar(
  x,
  y,
  w,
  h,
  {
    color = ROLE.stream,
    fillOpacity = 0.26,
    strokeWidth = 2.4,
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

/** Luminous ring marker. */
export function glowRing(
  x,
  y,
  radius,
  color,
  { width = 3.5, glow = 10, fillOpacity = 0.14, opacity = 1 } = {},
) {
  const fill = circle(radius, { fill: color, stroke: null })
    .at(x, y)
    .opacity(fillOpacity * opacity);
  const ring = circle(radius, { fill: null, stroke: color, width })
    .at(x, y)
    .glow(glow, color)
    .opacity(opacity);
  return group(fill, ring);
}

/** Full-canvas ambient energy field placed behind scene geometry. */
export function cinemaAtmosphere(accent = ROLE.attn, secondary = ROLE.query) {
  return group(
    aura(-540, -240, 560, `${accent}24`, '#07091000'),
    aura(460, 140, 620, `${secondary}20`, '#07091000'),
    aura(0, 0, 720, '#2a3d7a22', '#07091000'),
  ).zIndex(-80);
}

/** Clean 2D coordinate plane with glowing axes, subtle grid hairlines, and unit ticks. */
export function vectorPlane({
  originX = -260,
  originY = 120,
  scaleX = 180,
  scaleY = 180,
  xMin = -1.6,
  xMax = 1.8,
  yMin = -1.4,
  yMax = 1.9,
  xTicks = [-1, 0, 1],
  yTicks = [-1, 0, 1],
  axisColor = '#556894',
  gridColor = '#263457',
  xLabel = 'coord 1',
  yLabel = 'coord 4',
  tickDigits = 0,
  opacity = 1,
} = {}) {
  const toScreen = (vx, vy) => [originX + vx * scaleX, originY - vy * scaleY];
  const left = originX + xMin * scaleX;
  const right = originX + xMax * scaleX;
  const bottom = originY - yMin * scaleY;
  const top = originY - yMax * scaleY;
  const axisX = Math.max(left, Math.min(right, originX));
  const axisY = Math.max(top, Math.min(bottom, originY));

  const parts = [
    aura(
      (left + right) / 2,
      (top + bottom) / 2,
      Math.max(right - left, bottom - top) * 0.65,
      '#1e2d5c36',
      '#0d152b14',
    )
      .opacity(opacity)
      .zIndex(-50),
  ];

  xTicks.forEach((gx) => {
    const sx = originX + gx * scaleX;
    const isZero = Math.abs(gx) < 1e-6;
    parts.push(
      line([sx, bottom], [sx, top], {
        stroke: isZero ? axisColor : gridColor,
        width: isZero ? 2.4 : 1.3,
      }).opacity((isZero ? 0.85 : 0.55) * opacity),
      txt(fmt(gx, tickDigits), sx, bottom + 36, 26, COSMOS.dim, 'mono', 'center').opacity(opacity),
    );
  });

  yTicks.forEach((gy) => {
    const sy = originY - gy * scaleY;
    const isZero = Math.abs(gy) < 1e-6;
    parts.push(
      line([left, sy], [right, sy], {
        stroke: isZero ? axisColor : gridColor,
        width: isZero ? 2.4 : 1.3,
      }).opacity((isZero ? 0.85 : 0.55) * opacity),
      txt(fmt(gy, tickDigits), left - 28, sy, 26, COSMOS.dim, 'mono', 'right').opacity(opacity),
    );
  });

  parts.push(
    arrow([left, axisY], [right + 16, axisY], {
      stroke: axisColor,
      width: 2.5,
      tip: 12,
    }).opacity(opacity),
    arrow([axisX, bottom], [axisX, top - 16], {
      stroke: axisColor,
      width: 2.5,
      tip: 12,
    }).opacity(opacity),
    txt(xLabel, right + 28, axisY, 26, COSMOS.muted, 'mono', 'left').opacity(opacity),
    txt(yLabel, axisX, top - 40, 26, COSMOS.muted, 'mono', 'center').opacity(opacity),
  );

  return {
    node: group(...parts).zIndex(-10),
    toScreen,
    origin: [originX, originY],
    bounds: { left, right, top, bottom },
  };
}

/** Luminous horizontal vector strip with glowing brackets and generous cell padding. */
export function vectorRow({
  cx = 0,
  cy = 0,
  values = [],
  cellW = 148,
  cellH = 74,
  gap = 12,
  color = ROLE.attn,
  digits = 2,
  fontSize = 28,
  label = '',
  labelColor = null,
  highlightIdx = -1,
  opacity = 1,
} = {}) {
  const n = values.length;
  const totalW = n * cellW + (n - 1) * gap;
  const left = cx - totalW / 2;
  const bxL = left - 16;
  const bxR = left + totalW + 16;
  const byT = cy - cellH / 2 - 8;
  const byB = cy + cellH / 2 + 8;
  const baseColor = Array.isArray(color) ? color[0] : color;
  const parts = [
    glowingTrail(
      [
        [bxL + 12, byT],
        [bxL, byT],
        [bxL, byB],
        [bxL + 12, byB],
      ],
      { color: baseColor, width: 2.6, glow: 5, core: false, opacity: 0.72 * opacity },
    ),
    glowingTrail(
      [
        [bxR - 12, byT],
        [bxR, byT],
        [bxR, byB],
        [bxR - 12, byB],
      ],
      { color: baseColor, width: 2.6, glow: 5, core: false, opacity: 0.72 * opacity },
    ),
  ];

  if (label) {
    parts.push(
      txt(label, bxL - 26, cy, 28, labelColor ?? baseColor, 'mono', 'right').opacity(opacity),
    );
  }

  values.forEach((v, i) => {
    const rx = left + i * (cellW + gap) + cellW / 2;
    const isHi = i === highlightIdx;
    const col = Array.isArray(color) ? color[i % color.length] : color;
    const str =
      v === null || v === undefined ? '?' : typeof v === 'number' ? fmt(v, digits) : String(v);
    parts.push(
      lumBar(rx, cy, cellW, cellH, {
        color: isHi ? ROLE.query : col,
        fillOpacity: isHi ? 0.34 : 0.16,
        strokeWidth: isHi ? 2.8 : 1.8,
        glow: isHi ? 10 : 4,
        radius: 8,
        opacity,
      }),
      txt(str, rx, cy, fontSize, isHi ? COSMOS.ink : col, 'mono', 'center').opacity(opacity),
    );
  });

  return group(...parts);
}

/** Luminous conserved probability ribbon with external labels (zero border collision). */
export function shareRibbon({
  x = 0,
  y = 0,
  width = 1280,
  height = 54,
  shares = [],
  colors = [],
  labels = [],
  count = shares.length,
  opacity = 1,
} = {}) {
  const left = x - width / 2;
  const parts = [
    lumBar(x, y, width, height, {
      color: ROLE.rule,
      fillOpacity: 0.25,
      strokeWidth: 1.6,
      glow: 0,
      radius: 8,
      opacity,
    }),
  ];
  let cursor = left;
  shares.forEach((w, i) => {
    const segW = Math.max(0, w * width);
    const col = colors[i % colors.length];
    if (i < count && segW > 3) {
      parts.push(
        lumBar(cursor + segW / 2, y, Math.max(6, segW - 4), height, {
          color: col,
          fillOpacity: 0.48,
          strokeWidth: 2.4,
          glow: 9,
          radius: 6,
          opacity,
        }),
      );
    }
    cursor += segW;
  });

  // Evenly distributed external labels below the ribbon so small shares never collide
  const n = labels.length;
  if (n > 0) {
    const step = width / n;
    labels.forEach((lbl, i) => {
      const lx = left + (i + 0.5) * step;
      const col = colors[i % colors.length];
      const textStr = i < count ? `${lbl} ${pct(shares[i])}` : `${lbl} ?`;
      parts.push(txt(textStr, lx, y + height / 2 + 42, 26, col, 'mono', 'center').opacity(opacity));
    });
  }
  return group(...parts);
}

/** Luminous matrix grid with glowing brackets and generous cell padding. */
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
  fontSize = 28,
  bracketColor = '#6e83b7',
  opacity = 1,
} = {}) {
  const totalW = cols * cellW + (cols - 1) * gap;
  const totalH = rows * cellH + (rows - 1) * gap;
  const left = cx - totalW / 2;
  const top = cy - totalH / 2;
  const bxL = left - 18;
  const bxR = left + totalW + 18;
  const byT = top - 10;
  const byB = top + totalH + 10;
  const parts = [
    glowingTrail(
      [
        [bxL + 14, byT],
        [bxL, byT],
        [bxL, byB],
        [bxL + 14, byB],
      ],
      { color: bracketColor, width: 2.8, glow: 5, core: false, opacity: 0.78 * opacity },
    ),
    glowingTrail(
      [
        [bxR - 14, byT],
        [bxR, byT],
        [bxR, byB],
        [bxR - 14, byB],
      ],
      { color: bracketColor, width: 2.8, glow: 5, core: false, opacity: 0.78 * opacity },
    ),
  ];

  for (let r = 0; r < rows; r++) {
    const ry = top + r * (cellH + gap) + cellH / 2;
    if (rowLabels[r]) {
      parts.push(
        txt(rowLabels[r], bxL - 24, ry, 26, COSMOS.muted, 'mono', 'right').opacity(opacity),
      );
    }
    for (let k = 0; k < cols; k++) {
      const rx = left + k * (cellW + gap) + cellW / 2;
      if (r === 0 && colLabels[k]) {
        parts.push(
          txt(colLabels[k], rx, byT - 34, 26, COSMOS.muted, 'mono', 'center').opacity(opacity),
        );
      }
      const val = values[r]?.[k] ?? '';
      const isHi = highlight(r, k);
      const isDim = dim(r, k);
      const col = colors[r]?.[k] ?? (isHi ? ROLE.query : ROLE.attn);
      const cellOp = (isDim ? 0.3 : 1) * opacity;
      parts.push(
        lumBar(rx, ry, cellW, cellH, {
          color: col,
          fillOpacity: isHi ? 0.36 : 0.16,
          strokeWidth: isHi ? 3 : 1.6,
          glow: isHi ? 10 : 4,
          radius: 8,
          opacity: cellOp,
        }),
      );
      if (val !== '') {
        parts.push(
          txt(String(val), rx, ry, fontSize, isHi ? COSMOS.ink : col, 'mono', 'center').opacity(
            cellOp,
          ),
        );
      }
    }
  }
  return group(...parts);
}
