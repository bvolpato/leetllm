// Shared cinematic palette, math invariants, and reusable luminous primitives
// for the 14-scene Layer Normalization (Pre-LN vs Post-LN) stage film.
import { arrow, circle, dot, group, line, rect, seq } from 'vizmatic/stage';
import {
  F,
  jac,
  ln,
  mean,
  norm,
  overTime,
  post,
  pre,
  rms,
  variance,
} from '../../films/layer-normalization/arithmetic.mjs';
import {
  direction,
  epsilon,
  point,
  row1,
  row2,
  start,
  x,
} from '../../films/layer-normalization/fixtures.mjs';
import {
  J,
  affineState,
  alignedWriteState,
  backwardTrace,
  branch,
  centered,
  deepNormTrace,
  normal,
  normalizationTransfer,
  placementTrace,
  post2,
  pre2,
  scale,
  scaleTrace,
  validateModel,
} from '../../films/layer-normalization/model.mjs';
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
  F,
  J,
  affineState,
  alignedWriteState,
  backwardTrace,
  branch,
  centered,
  deepNormTrace,
  direction,
  epsilon,
  jac,
  ln,
  mean,
  norm,
  normal,
  normalizationTransfer,
  overTime,
  placementTrace,
  point,
  post,
  post2,
  pre,
  pre2,
  rms,
  row1,
  row2,
  scale,
  scaleTrace,
  start,
  variance,
  x,
};

/** One semantic color per conceptual role across all 14 scenes. */
export const ROLE = Object.freeze({
  stream: COSMOS.blue,
  write: COSMOS.cyan,
  gold: COSMOS.gold,
  norm: COSMOS.emerald,
  rms: COSMOS.violet,
  alert: COSMOS.rose,
  amber: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
  surface: COSMOS.surface,
  surfaceAlt: COSMOS.surfaceAlt,
});

export const fmt = (n, digits = 2) => Number(n).toFixed(digits);
export const fmtTrim = (n, digits = 2) => String(Number(Number(n).toFixed(digits)));
export const signed = (n, digits = 2) => `${n >= 0 ? '+' : ''}${fmt(n, digits)}`;
export const pct = (n, digits = 1) => `${(n * 100).toFixed(digits)}%`;
export const vecStr = (v, digits = 2) => `[${v.map((u) => fmt(u, digits)).join(', ')}]`;

/** Verify all computed numbers imported from layer-normalization/model.mjs at build time. */
export function verifyLayerNormModel() {
  verifyInvariant(validateModel() === true, 'legacy model.mjs validateModel() passes');
  verifyApprox(mean(x), 2, 1e-12, 'input x mean');
  verifyApprox(variance(x), 5, 1e-12, 'input x population variance');
  verifyApprox(normal[0], 0.447213, 1e-4, 'standardized x[0]');
  verifyApprox(normal[2], -1.341639, 1e-4, 'standardized x[2]');
  verifyApprox(mean(normal), 0, 1e-12, 'standardized mean is zero');
  verifyApprox(variance(normal), 5 / (5 + epsilon), 1e-12, 'standardized variance with eps');
  verifyApprox(rms(x)[2], -1 / Math.sqrt(9 + epsilon), 1e-9, 'RMSNorm x[2]');
  verifyApprox(
    rms(x.map((v) => v + 5))[2],
    4 / Math.sqrt(54 + epsilon),
    1e-9,
    'shifted RMSNorm x[2]',
  );
  verifyApprox(ln(row1)[0], -1.06904, 1e-4, 'per-token row1[0]');
  verifyApprox(overTime(row1, row2)[0], -1.13137, 1e-4, 'over-time row1[0] before edit');
  verifyApprox(
    overTime(
      row1,
      row2.map((v) => v + 100),
    )[0],
    -1.02524,
    1e-4,
    'over-time row1[0] after edit',
  );
  const tr = placementTrace();
  verifyApprox(tr.pre[3][0], 0.89485, 1e-4, 'Pre-LN block 1 output f1');
  verifyApprox(tr.post[2][0], 1.3, 1e-9, 'Post-LN block 1 sum f1');
  verifyApprox(mean(tr.post[2]), 4.6, 1e-9, 'Post-LN block 1 sum mean');
  verifyApprox(tr.post[3][0], -1.02575, 1e-4, 'Post-LN block 1 output f1');
  verifyApprox(mean(pre2), 3.95, 1e-9, 'Pre-LN block 2 output mean');
  verifyApprox(mean(post2), 0, 1e-9, 'Post-LN block 2 output mean');
  verifyApprox(branch[0] + direction[0], 0, 1e-12, 'adversarial branch cancellation f1');
  const bw = backwardTrace();
  verifyApprox(bw.dx[0], 0.31305, 1e-4, 'backward dx[0]');
  verifyApprox(mean(bw.dx), 0, 1e-12, 'backward dx mean is zero');
  const dn = deepNormTrace(16);
  verifyApprox(dn.alpha, 32 ** 0.25, 1e-9, 'DeepNorm alpha for N=16');
  verifyApprox(dn.beta, 128 ** -0.25, 1e-9, 'DeepNorm beta for N=16');
  const nt = normalizationTransfer(5);
  verifyApprox(nt.ln[0], -1.34164, 1e-4, 'transfer LN[0]');
  verifyApprox(nt.shiftedLN[0], nt.ln[0], 1e-12, 'transfer LN shift invariance');
  verifyApprox(nt.rms[0], 0.36515, 1e-4, 'transfer RMS[0]');
  verifyApprox(nt.shiftedRMS[0], 0.68313, 1e-4, 'transfer shifted RMS[0]');
}

/** Clamp a play duration so an animation never runs past the scene's narration. */
export function safeDur(c, startTime, desired = 0.75, margin = 0.42) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.12, Math.min(desired, remaining));
}

/** Schedule an animation at a declared cue (start or end), clamped safely inside c.end. */
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

/** Schedule an animation at the start of a beat index, clamped safely inside c.end. */
export function playBeat(s, c, beatIndex, build, { offset = 0, dur = 0.75, margin = 0.42 } = {}) {
  const beat = c.beats[beatIndex];
  const startAt = (beat ? beat.start : c.start) + offset;
  const d = safeDur(c, startAt, dur, margin);
  c.onBeat(beatIndex, () => build(d), offset);
  return d;
}

/** Drive a continuous subtle ambient phase (0 -> 1) spanning the full scene window safely. */
export function scenePulse(s, c, phaseVal, { startOffset = 0.1, endMargin = 0.5 } = {}) {
  const d = Math.max(0.5, c.end - c.start - startOffset - endMargin);
  c.at(startOffset, () => {
    s.play(phaseVal.to(1, { duration: d }));
  });
  return d;
}

/** Sequential fade-out then fade-in across two dynamic view values (zero overlap). */
export function swapVis(outVal, inVal, d = 0.65) {
  const half = Math.max(0.12, d * 0.46);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

/** Full-canvas ambient energy field placed cleanly behind scene geometry. */
export function cinemaAtmosphere(primary = ROLE.write, secondary = ROLE.gold) {
  return group(
    aura(-540, -240, 560, `${primary}24`, '#07091000'),
    aura(460, 140, 620, `${secondary}20`, '#07091000'),
    aura(0, 0, 720, '#2a3d7a22', '#07091000'),
  ).zIndex(-80);
}

/** Luminous horizontal or vertical bar with soft fill and bright edge glow (no card chrome). */
export function lumBar(
  xPos,
  yPos,
  w,
  h,
  {
    color = ROLE.stream,
    fillOpacity = 0.3,
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
    .at(xPos, yPos)
    .opacity(fillOpacity * opacity);
  const edge = rect(safeW, safeH, {
    fill: null,
    stroke: color,
    width: strokeWidth,
    radius,
  })
    .at(xPos, yPos)
    .opacity(0.92 * opacity);
  if (glow > 0) edge.glow(glow, color);
  return group(body, edge);
}

/** Glowing vector arrow from origin to tip with tip photon. */
export function glowVector(
  origin,
  tip,
  { color = ROLE.stream, width = 5, tipSize = 18, glow = 10, opacity = 1, dotRadius = 5 } = {},
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

/** Luminous ring marker for ghost positions and focus anchors. */
export function glowRing(
  xPos,
  yPos,
  radius,
  color,
  { width = 3, glow = 8, fillOpacity = 0.12, opacity = 1 } = {},
) {
  const fill = circle(radius, { fill: color, stroke: null })
    .at(xPos, yPos)
    .opacity(fillOpacity * opacity);
  const ring = circle(radius, { fill: null, stroke: color, width }).at(xPos, yPos).opacity(opacity);
  if (glow > 0) ring.glow(glow, color);
  return group(fill, ring);
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

/** Glowing conserved share strip with clean external labels above. */
export function shareRibbon({
  xPos = 0,
  yPos = 0,
  width = 860,
  height = 54,
  shares = [0.5, 0.5],
  colors = [ROLE.write, ROLE.rms],
  labels = ['A', 'B'],
  opacity = 1,
} = {}) {
  const left = xPos - width / 2;
  const parts = [];
  let cursor = left;
  shares.forEach((w, i) => {
    const segW = Math.max(4, w * width);
    const cx = cursor + segW / 2;
    const col = colors[i % colors.length];
    parts.push(
      lumBar(cx, yPos, Math.max(4, segW - 4), height, {
        color: col,
        fillOpacity: 0.45,
        strokeWidth: 2.5,
        glow: 9,
        radius: 6,
        opacity,
      }),
    );
    if (labels[i]) {
      const anchor = i === 0 ? 'left' : 'right';
      const lx = i === 0 ? left : left + width;
      parts.push(
        txt(labels[i], lx, yPos - height / 2 - 34, 30, col, 'mono', anchor)
          .glow(6, col)
          .opacity(opacity),
      );
    }
    cursor += segW;
  });
  return group(...parts);
}

/** Clean 2D coordinate plane with glowing axes, subtle grid hairlines, and crisp labels. */
export function coordPlane({
  originX = -160,
  originY = 120,
  scaleX = 120,
  scaleY = 120,
  xMin = -3,
  xMax = 3,
  yMin = -3,
  yMax = 3,
  stepX = 1,
  stepY = 1,
  xTicks,
  yTicks,
  xLabel = 'x',
  yLabel = 'y',
  opacity = 1,
} = {}) {
  const toScreen = (vx, vy) => [originX + vx * scaleX, originY - vy * scaleY];
  const left = originX + xMin * scaleX;
  const right = originX + xMax * scaleX;
  const bottom = originY - yMin * scaleY;
  const top = originY - yMax * scaleY;
  const parts = [];

  for (let gx = Math.ceil(xMin / stepX) * stepX; gx <= xMax + 1e-6; gx += stepX) {
    const sx = originX + gx * scaleX;
    const isZero = Math.abs(gx) < 1e-6;
    parts.push(
      line([sx, bottom], [sx, top], {
        stroke: isZero ? '#5f74a8' : '#253252',
        width: isZero ? 2.6 : 1.3,
      }).opacity((isZero ? 0.92 : 0.62) * opacity),
    );
  }
  for (let gy = Math.ceil(yMin / stepY) * stepY; gy <= yMax + 1e-6; gy += stepY) {
    const sy = originY - gy * scaleY;
    const isZero = Math.abs(gy) < 1e-6;
    parts.push(
      line([left, sy], [right, sy], {
        stroke: isZero ? '#5f74a8' : '#253252',
        width: isZero ? 2.6 : 1.3,
      }).opacity((isZero ? 0.92 : 0.62) * opacity),
    );
  }

  parts.push(
    arrow([left, originY], [right + 14, originY], {
      stroke: '#6c82b8',
      width: 2.6,
      tip: 12,
    }).opacity(opacity),
    arrow([originX, bottom], [originX, top - 14], {
      stroke: '#6c82b8',
      width: 2.6,
      tip: 12,
    }).opacity(opacity),
    dot(4.5, COSMOS.ink).at(originX, originY).opacity(opacity),
  );

  if (xLabel) {
    parts.push(txt(xLabel, right, bottom + 74, 28, COSMOS.muted, 'mono', 'right').opacity(opacity));
  }
  if (yLabel) {
    parts.push(txt(yLabel, left, top - 40, 28, COSMOS.muted, 'mono', 'left').opacity(opacity));
  }

  const xt = xTicks ?? [];
  xt.forEach((v) => {
    parts.push(
      txt(String(v), originX + v * scaleX, bottom + 34, 26, COSMOS.dim, 'mono', 'center').opacity(
        opacity,
      ),
    );
  });
  const yt = yTicks ?? [];
  yt.forEach((v) => {
    parts.push(
      txt(String(v), left - 24, originY - v * scaleY, 26, COSMOS.dim, 'mono', 'right').opacity(
        opacity,
      ),
    );
  });

  return {
    node: group(...parts),
    toScreen,
    bounds: { left, right, top, bottom },
  };
}

/** Glowing feature-spectrum waveform for 4 features on a shared axis. */
export function featureSpectrum({
  cx = -260,
  cy = 45,
  width = 760,
  height = 380,
  yMin = -4,
  yMax = 6,
  values = [1, -1, -3, 3],
  ghostValues,
  color = ROLE.write,
  highlightIndex = -1,
  highlightColor = ROLE.gold,
  yTicks = [-3, 0, 3, 6],
  opacity = 1,
} = {}) {
  const left = cx - width / 2;
  const right = cx + width / 2;
  const top = cy - height / 2;
  const bottom = cy + height / 2;
  const toX = (i) => left + ((i + 0.5) / values.length) * width;
  const toY = (v) => bottom - ((v - yMin) / (yMax - yMin)) * height;
  const zeroY = toY(0);
  const parts = [];

  // Subtle horizontal grid + zero meridian
  yTicks.forEach((tick) => {
    const sy = toY(tick);
    const isZero = tick === 0;
    parts.push(
      line([left - 12, sy], [right + 12, sy], {
        stroke: isZero ? '#5f74a8' : '#232f4f',
        width: isZero ? 2.6 : 1.3,
      }).opacity((isZero ? 0.92 : 0.6) * opacity),
      txt(String(tick), left - 28, sy, 26, COSMOS.dim, 'mono', 'right').opacity(opacity),
    );
  });

  // Ghost reference polyline if provided
  if (ghostValues) {
    const gPts = ghostValues.map((v, i) => [toX(i), toY(v)]);
    parts.push(
      glowingTrail(gPts, {
        color: COSMOS.muted,
        width: 2.2,
        glow: 3,
        core: false,
        opacity: 0.35 * opacity,
      }),
    );
    gPts.forEach(([gx, gy]) => {
      parts.push(
        glowRing(gx, gy, 8, COSMOS.muted, {
          width: 2,
          glow: 3,
          fillOpacity: 0.08,
          opacity: 0.45 * opacity,
        }),
      );
    });
  }

  // Active glowing polyline + luminous stems + feature beads
  const pts = values.map((v, i) => [toX(i), toY(v)]);
  parts.push(
    glowingTrail(pts, {
      color,
      width: 4.5,
      glow: 10,
      opacity,
    }),
  );

  values.forEach((v, i) => {
    const px = toX(i);
    const py = toY(v);
    const col = i === highlightIndex ? highlightColor : color;
    parts.push(
      line([px, zeroY], [px, py], { stroke: col, width: 3.5 }).opacity(0.62 * opacity),
      glowDot(px, py, { radius: i === highlightIndex ? 11 : 9, color: col, glow: 14, opacity }),
      txt(`f${i + 1}`, px, bottom + 34, 26, COSMOS.muted, 'mono', 'center').opacity(opacity),
      txt(fmt(v, 2), px, bottom + 72, 26, col, 'mono', 'center')
        .glow(4, col)
        .opacity(opacity),
    );
  });

  return { node: group(...parts), toX, toY, zeroY, bounds: { left, right, top, bottom } };
}
