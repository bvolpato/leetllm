// Shared Pure Cinema palette, math invariants, glowing 2D/3D primitives, and cue helpers
// for the 14-scene Sparse Autoencoders stage film.
import { dotProduct } from 'vizmatic';
import {
  arrow,
  circle,
  curve3d,
  dot,
  dynamic,
  group,
  line,
  line3d,
  points3d,
  rect,
  seq,
} from 'vizmatic/stage';
import {
  OBSERVATION_CONTEXTS,
  candidates,
  code,
  dictionary,
  steeringBaseline,
  steeringDirection,
  steeringReadouts,
  target,
} from '../../films/sparse-autoencoders/fixtures.mjs';
import {
  candidateLoss,
  coverageFixture,
  denseLoss,
  encoderFixture,
  sparseLoss,
  topK,
} from '../../films/sparse-autoencoders/model.mjs';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';

export {
  COSMOS,
  OBSERVATION_CONTEXTS,
  aura,
  candidates,
  cinematic3d,
  code,
  dictionary,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout,
  orbitScene,
  rule,
  steeringBaseline,
  steeringDirection,
  steeringReadouts,
  target,
  txt,
};

/** One semantic color per conceptual role across all 14 scenes. */
export const ROLE = Object.freeze({
  activation: COSMOS.ink,
  first: COSMOS.blue, // blue password / credential feature
  second: '#f472b6', // unmistakable luminous pink for urgency / overlapping feature
  other: COSMOS.cyan, // other dictionary columns, edits, post-training dots
  residual: COSMOS.emerald, // green residual / unexplained sliver / loss recovered
  mark: COSMOS.gold, // gold highlight, threshold, key metric, yellow probe row
  wrong: COSMOS.rose, // coral-rose error, false alarm, damage, drop
  violet: COSMOS.violet, // secondary accent
  amber: COSMOS.amber, // warm accent
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
  surface: COSMOS.surface,
});

export const SLOT_COLOR = Object.freeze([
  ROLE.first,
  ROLE.second,
  ROLE.other,
  ROLE.other,
  ROLE.other,
]);

export const EXAMPLE_SLOTS = Object.freeze([ROLE.first, ROLE.second, ROLE.dim, ROLE.dim, ROLE.dim]);

export const WIDTH = target.length;
export const SLOTS = dictionary.length;

const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const scale = (v, k) => [v[0] * k, v[1] * k];
const dotOf2 = (a, b) => a[0] * b[0] + a[1] * b[1];
export const vec = Object.freeze({
  add,
  scale,
  dot: dotOf2,
  length: (v) => Math.hypot(v[0], v[1]),
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
});

const live = (value) => (typeof value === 'function' ? value : () => value);

/** Reconstruct activation from a 5-slot sparse code and the lesson dictionary. */
export const decode = (z) =>
  z.reduce((sum, value, i) => add(sum, scale(dictionary[i], value)), [0, 0]);

/** Two terms of the SAE objective: MSE / D and lambda * L1 / M. */
export function objectiveTerms(z, lambda) {
  const rebuilt = decode(z);
  const error = ((target[0] - rebuilt[0]) ** 2 + (target[1] - rebuilt[1]) ** 2) / WIDTH;
  const penalty = z.map((value) => (lambda * Math.abs(value)) / SLOTS);
  return { error, penalty, total: error + penalty.reduce((sum, value) => sum + value, 0) };
}

/** Build-time mathematical invariants covering all core SAE formulas and fixtures. */
export function verifySaeInvariants() {
  for (let i = 0; i < dictionary.length; i++) {
    verifyApprox(vec.length(dictionary[i]), 1, 1e-12, `dictionary[${i}] unit norm`);
  }
  verifyApprox(target[0], 2.3, 1e-12, 'target[0] = 2.3');
  verifyApprox(target[1], 0.6, 1e-12, 'target[1] = 0.6');
  const decoded = decode(code);
  verifyApprox(decoded[0], target[0], 1e-12, 'decode(code)[0]');
  verifyApprox(decoded[1], target[1], 1e-12, 'decode(code)[1]');

  const enc = encoderFixture();
  for (let i = 0; i < code.length; i++) {
    verifyApprox(enc.estimated[i], code[i], 1e-9, `encoderFixture estimated[${i}]`);
  }
  verifyApprox(vec.length(enc.weights[0]), 5 / 3, 1e-9, 'encoder row 0 norm');
  verifyApprox(vec.length(enc.weights[1]), 5 / 3, 1e-9, 'encoder row 1 norm');

  const tk = topK(candidates, 2);
  verifyApprox(tk[0], 0, 1e-12, 'topK[0]');
  verifyApprox(tk[1], 2.4, 1e-12, 'topK[1]');
  verifyApprox(tk[2], 0, 1e-12, 'topK[2]');
  verifyApprox(tk[3], 1.7, 1e-12, 'topK[3]');
  verifyApprox(tk[4], 0, 1e-12, 'topK[4]');

  verifyInvariant(
    denseLoss(0.05) < sparseLoss(0.05),
    'model.mjs denseLoss < sparseLoss at low lambda',
  );
  verifyInvariant(
    sparseLoss(0.5) < denseLoss(0.5),
    'model.mjs sparseLoss < denseLoss at high lambda',
  );
  verifyApprox(candidateLoss([1, 0], 0), 0, 1e-12, 'candidateLoss exact zero');

  const sparse5 = [code[0], 0, 0, 0, 0];
  const crossing = objectiveTerms(sparse5, 0).error / ((code[1] - sparse5[1]) / SLOTS);
  verifyApprox(crossing, 2.5, 1e-9, '5-slot objective crossing at lambda = 2.5');
  verifyApprox(objectiveTerms(sparse5, 4).total, 1.7, 1e-9, 'sparse total at lambda = 4');
  verifyApprox(objectiveTerms(code, 4).total, 2.0, 1e-9, 'dense total at lambda = 4');

  const cov = coverageFixture();
  verifyApprox(cov.general, 0, 1e-12, 'coverageFixture bird detector silent');
  verifyApprox(cov.reconstructed[0], 1, 1e-9, 'coverageFixture recon[0]');
  verifyApprox(cov.reconstructed[1], 1, 1e-9, 'coverageFixture recon[1]');

  verifyApprox(dotProduct(steeringReadouts[1], steeringDirection), 0, 1e-12, 'steering orthogonal');
  verifyApprox(dotProduct(steeringReadouts[2], steeringDirection), 0.8, 1e-12, 'steering overlap');
  verifyApprox(dotProduct([1, 2], steeringBaseline), 0.4, 1e-12, 'steering cached');
  verifyApprox(
    dotProduct(vec.add(steeringBaseline, vec.scale(steeringDirection, 0.7)), [1, 2]),
    1.8,
    1e-12,
    'steering re-encoded',
  );

  const clampEdited = vec.add([1, 0.5], vec.scale([0, 1], 1));
  verifyApprox(dotProduct([1, 2], [1, 0.5]), 2, 1e-12, 'clamp initial');
  verifyApprox(dotProduct([1, 2], clampEdited), 4, 1e-12, 'clamp re-encoded');
  verifyApprox(dotProduct([3, 100], [1, 0.1]), 13, 1e-12, 'gradient initial score');
  verifyApprox(dotProduct([3, 100], [1, 0]), 3, 1e-12, 'gradient held slope');

  verifyApprox(0.9 * 1.2 + 0.8 * 0.1 + 0.7 * 0, 1.16, 1e-12, 'circuit total score');
  verifyApprox(0.8 * 0.1, 0.08, 1e-12, 'circuit ablated score');
  verifyApprox((200_000 * 4096 * 4) / 2 ** 30, 3.0517578125, 1e-3, 'activation storage GiB');
  verifyApprox(1 - (2.4 - 2) / (6 - 2), 0.9, 1e-12, 'loss recovered 90%');
  verifyApprox(1 - (2.4 - 2) / (10 - 2), 0.95, 1e-12, 'loss recovered 95%');
}

/** Clamp a play duration so an animation never outruns its scene's narration. */
export function safeDur(c, startTime, desired = 0.8, margin = 0.42) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.12, Math.min(desired, remaining));
}

/** Schedule an animation at a declared cue (start or end) bounded inside the scene window. */
export function playCue(
  s,
  c,
  cueId,
  build,
  { after = false, offset = 0, dur = 0.8, margin = 0.42 } = {},
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

/** Sequential fade-out then fade-in across two dynamic view values (zero text overlap). */
export function swapVis(outVal, inVal, d = 0.6) {
  const half = Math.max(0.12, d * 0.45);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

/** Full-canvas ambient cosmic energy field behind scene geometry. */
export function cinemaAtmosphere(accent = ROLE.other, secondary = ROLE.second) {
  return group(
    aura(-500, -180, 580, `${accent}24`, '#07091000'),
    aura(480, 140, 620, `${secondary}1e`, '#07091000'),
    aura(0, 20, 740, '#22336a20', '#07091000'),
  ).zIndex(-80);
}

/** Luminous ring marker with subtle translucent fill and screen-friendly glow. */
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
  const ring = circle(radius, { fill: null, stroke: color, width }).at(x, y).opacity(opacity);
  if (glow > 0) ring.glow(glow, color);
  return group(fill, ring);
}

/** Luminous bar primitive (soft glowing fill + bright border, zero slide-card chrome). */
export function lumBar(
  x,
  y,
  w,
  h,
  {
    color = ROLE.first,
    fillOpacity = 0.3,
    strokeWidth = 2.4,
    glow = 8,
    radius = 7,
    opacity = 1,
    dash,
  } = {},
) {
  const safeW = Math.max(4, w);
  const safeH = Math.max(4, h);
  const body = rect(safeW, safeH, {
    fill: color,
    stroke: null,
    radius,
  })
    .at(x, y)
    .opacity(fillOpacity * opacity);
  const edge = rect(safeW, safeH, {
    fill: null,
    stroke: color,
    width: strokeWidth,
    radius,
    dash,
  })
    .at(x, y)
    .opacity(0.92 * opacity);
  if (glow > 0) edge.glow(glow, color);
  return group(body, edge);
}

/** Glowing vector arrow from `origin` to `tip` with tip photon. */
export function glowVector(
  origin,
  tip,
  {
    color = ROLE.first,
    width = 5.5,
    tipSize = 18,
    glow = 9,
    opacity = 1,
    dotRadius = 4.5,
    dash,
  } = {},
) {
  const len = Math.hypot(tip[0] - origin[0], tip[1] - origin[1]);
  if (len < 3) {
    return glowDot(origin[0], origin[1], { radius: dotRadius, color, glow, opacity });
  }
  const vecNode = arrow(origin, tip, {
    stroke: color,
    width,
    tip: Math.min(tipSize, len * 0.55),
    dash,
  }).opacity(opacity);
  if (glow > 0) vecNode.glow(glow, color);
  const head = glowDot(tip[0], tip[1], {
    radius: dotRadius,
    color,
    glow: glow > 0 ? glow + 2 : 0,
    opacity,
  });
  return group(vecNode, head);
}

/** Smooth 2D quadratic Bezier polyline points between two points with perpendicular lift. */
export function arcPts(p0, p1, liftY = -80, steps = 28) {
  const mx = (p0[0] + p1[0]) * 0.5;
  const my = (p0[1] + p1[1]) * 0.5 + liftY;
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

/**
 * Full-bleed dark-cosmos 2D activation plane with equal-unit scaling, subtle glowing grid,
 * crisp axes, toggleable tick numbers (to prevent text collisions when rays sweep),
 * and live vector/shadow/ruler helpers.
 */
export function cinemaPlane(
  s,
  {
    cx = -370,
    cy = 85,
    width = 960,
    height = 760,
    x = [-1.3, 2.9],
    y = [-1.5, 1.9],
    xStep = 1,
    yStep = 1,
    showTicks = true,
    showGrid = true,
    xLabel = 'x₁',
    yLabel = 'x₂',
    axisColor = '#586d9b',
    gridColor = '#233052',
  } = {},
) {
  const spanX = x[1] - x[0];
  const spanY = y[1] - y[0];
  const unit = Math.min(width / spanX, height / spanY);
  const realW = unit * spanX;
  const realH = unit * spanY;
  const left = cx - realW / 2;
  const right = cx + realW / 2;
  const top = cy - realH / 2;
  const bottom = cy + realH / 2;
  const ox = left - x[0] * unit;
  const oy = bottom + y[0] * unit;

  const P = (v) => [ox + v[0] * unit, oy - v[1] * unit];
  const foot = (point, direction) => {
    const n = vec.length(direction);
    if (n < 1e-12) return [0, 0];
    const u = scale(direction, 1 / n);
    return scale(u, dotOf2(point, u));
  };

  const ticksAlpha = s.value(showTicks ? 1 : 0);
  const gridAlpha = s.value(showGrid ? 1 : 0);

  const planeAura = aura(cx, cy, Math.max(realW, realH) * 0.62, '#1c2b5936', '#07091000').zIndex(
    -60,
  );

  const gridLines = guardedDynamic(gridAlpha, (a) => {
    const out = [];
    for (let gx = Math.ceil(x[0] / xStep - 1e-6) * xStep; gx <= x[1] + 1e-6; gx += xStep) {
      if (Math.abs(gx) < 1e-6) continue;
      const sx = ox + gx * unit;
      out.push(line([sx, bottom], [sx, top], { stroke: gridColor, width: 1.4 }).opacity(0.62 * a));
    }
    for (let gy = Math.ceil(y[0] / yStep - 1e-6) * yStep; gy <= y[1] + 1e-6; gy += yStep) {
      if (Math.abs(gy) < 1e-6) continue;
      const sy = oy - gy * unit;
      out.push(line([left, sy], [right, sy], { stroke: gridColor, width: 1.4 }).opacity(0.62 * a));
    }
    return out;
  });

  const axesLines = group(
    line([left, oy], [right, oy], { stroke: axisColor, width: 2.6 }).opacity(0.92),
    line([ox, bottom], [ox, top], { stroke: axisColor, width: 2.6 }).opacity(0.92),
    dot(4.5, COSMOS.ink).at(ox, oy),
    txt(xLabel, right + 28, oy, 26, COSMOS.muted, 'mono', 'left'),
    txt(yLabel, ox, top - 28, 26, COSMOS.muted, 'mono', 'center'),
  );

  const fmtTick = (v) => {
    const r = Math.round(v * 100) / 100;
    return Number.isInteger(r) ? String(r) : String(r);
  };

  const tickNodes = guardedDynamic(ticksAlpha, (a) => {
    const out = [];
    for (let gx = Math.ceil(x[0] / xStep - 1e-6) * xStep; gx <= x[1] + 1e-6; gx += xStep) {
      if (Math.abs(gx) < 1e-6) continue;
      const sx = ox + gx * unit;
      out.push(
        line([sx, oy - 6], [sx, oy + 6], { stroke: axisColor, width: 2 }).opacity(0.8 * a),
        txt(fmtTick(gx), sx, oy + 28, 26, COSMOS.dim, 'mono', 'center').opacity(0.92 * a),
      );
    }
    for (let gy = Math.ceil(y[0] / yStep - 1e-6) * yStep; gy <= y[1] + 1e-6; gy += yStep) {
      if (Math.abs(gy) < 1e-6) continue;
      const sy = oy - gy * unit;
      out.push(
        line([ox - 6, sy], [ox + 6, sy], { stroke: axisColor, width: 2 }).opacity(0.8 * a),
        txt(fmtTick(gy), ox - 20, sy, 26, COSMOS.dim, 'mono', 'right').opacity(0.92 * a),
      );
    }
    return out;
  });

  const node = group(planeAura, gridLines, axesLines, tickNodes).zIndex(-10);

  const arrowOf = (from, to, color, style = {}) => {
    const a = live(from);
    const b = live(to);
    const c = live(color);
    return dynamic(() => {
      const p = P(a());
      const q = P(b());
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (len < 4) return [];
      const w = style.width ?? 6;
      const col = c();
      const op = style.opacity ?? 1;
      const arr = arrow(p, q, {
        stroke: col,
        width: w,
        tip: Math.min(w * 3.1, len * 0.58),
        dash: style.dash,
      }).opacity(op);
      const gl = style.glow ?? (col === ROLE.dim ? 0 : 8);
      if (gl > 0) arr.glow(gl, col);
      return [arr];
    });
  };

  const dotOf = (at, color, radius = 10, glow = 12) => {
    const a = live(at);
    const c = live(color);
    return dynamic(() => {
      const [sx, sy] = P(a());
      return glowDot(sx, sy, { radius, color: c(), glow });
    });
  };

  const ringOf = (at, color, radius = 18, width = 4) => {
    const a = live(at);
    const c = live(color);
    return dynamic(() => {
      const [sx, sy] = P(a());
      const col = c();
      return glowRing(sx, sy, radius, col, {
        width,
        glow: col === ROLE.dim ? 0 : 9,
        fillOpacity: 0.1,
      });
    });
  };

  const segmentOf = (from, to, color, style = {}) => {
    const a = live(from);
    const b = live(to);
    const c = live(color);
    const { lift = [0, 0], glow = 7, ...rest } = style;
    return dynamic(() => {
      const p = add(P(a()), lift);
      const q = add(P(b()), lift);
      if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 2) return [];
      const col = c();
      const seg = line(p, q, { stroke: col, width: 6, ...rest });
      if (glow > 0 && col !== ROLE.dim) seg.glow(glow, col);
      return [seg];
    });
  };

  const shadowOf = (at, direction, color, radius = 8) => {
    const a = live(at);
    const d = live(direction);
    const c = live(color);
    return dynamic(() => {
      const pt = a();
      const f = foot(pt, d());
      const p = P(pt);
      const q = P(f);
      const col = c();
      const mark = glowDot(q[0], q[1], { radius, color: col, glow: 10 });
      if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 3) return [mark];
      const drop = line(p, q, { stroke: col, width: 3, dash: [9, 8] }).opacity(0.85);
      return [drop, mark];
    });
  };

  const rulerOf = (direction, color, from, to, style = {}) => {
    const u = scale(direction, 1 / vec.length(direction));
    const l = line(P(scale(u, from)), P(scale(u, to)), { stroke: color, width: 3.5, ...style });
    if (style.glow !== 0) l.glow(style.glow ?? 6, color);
    return l;
  };

  const tagOf = (at, words, color, lift = [0, 0], options = {}) => {
    const a = live(at);
    const w = live(words);
    const c = live(color);
    const size = options.size ?? 28;
    const font = options.font ?? 'mono';
    const anchor = options.anchor ?? 'center';
    return dynamic(() => {
      const [sx, sy] = add(P(a()), lift);
      return txt(w(), sx, sy, size, c(), font, anchor);
    });
  };

  return {
    node,
    P,
    unit,
    foot,
    ticksAlpha,
    gridAlpha,
    bounds: { left, right, top, bottom, cx, cy, ox, oy },
    arrowOf,
    dotOf,
    ringOf,
    segmentOf,
    shadowOf,
    rulerOf,
    tagOf,
  };
}

/**
 * Glowing 5-slot sparse code bar spectrum with luminous bars, cut outlines,
 * directional column arrow glyphs underneath, and optional glowing threshold cut line.
 */
export function glowCodeStrip(
  s,
  {
    x = 510,
    y = -170,
    width = 640,
    height = 240,
    max = 2.5,
    colors = SLOT_COLOR,
    start = [0, 0, 0, 0, 0],
    read,
    readKeep,
    digits = 1,
    numbersOnTop = false,
  } = {},
) {
  const z = dictionary.map((_, i) => s.value(start[i]));
  const keep = dictionary.map(() => s.value(1));
  const threshold = s.value(0);
  const valueOf = (i) => read?.(i) ?? z[i].value;
  const keptOf = (i) => readKeep?.(i) ?? keep[i].value;
  const colOf = (i) => (typeof colors === 'function' ? colors(i) : colors[i]);

  const left = x - width / 2;
  const right = x + width / 2;
  const top = y - height / 2;
  const bottom = y + height / 2;
  const GLYPH = 56;
  const HEAD = 42;
  const slotW = width / dictionary.length;
  const barWidth = slotW * 0.56;
  const base = bottom - GLYPH;
  const perUnit = (base - top - HEAD) / max;
  const slotX = (i) => left + slotW * (i + 0.5);

  const rail = rule(left, base, right, base, '#485a82', 2.8);

  const glyphs = dictionary.map((d, i) => {
    const reach = 19;
    const gx = slotX(i);
    const gy = base + GLYPH / 2 + 4;
    const col = colOf(i);
    const arr = arrow(
      [gx - d[0] * reach, gy + d[1] * reach],
      [gx + d[0] * reach, gy - d[1] * reach],
      {
        stroke: col,
        width: 4.5,
        tip: 14,
      },
    );
    if (col !== ROLE.dim) arr.glow(5, col);
    return arr;
  });

  const bars = dynamic(() =>
    z.flatMap((_, i) => {
      const val = Math.max(0, valueOf(i));
      const h = val * perUnit;
      if (h < 2) return [];
      const cx = slotX(i);
      const cy = base - h / 2;
      const k = keptOf(i);
      const col = colOf(i);
      if (k < 0.05) {
        return [
          rect(barWidth, h, {
            fill: null,
            stroke: '#435275',
            width: 2.5,
            radius: 6,
            dash: [6, 5],
          }).at(cx, cy),
        ];
      }
      return [
        lumBar(cx, cy, barWidth, h, {
          color: col,
          fillOpacity: 0.36 * k,
          strokeWidth: 2.5,
          glow: col === ROLE.dim ? 0 : 9 * k,
          radius: 6,
          opacity: 0.3 + 0.7 * k,
        }),
      ];
    }),
  );

  const numbers = dynamic(() =>
    z.flatMap((_, i) => {
      const val = valueOf(i);
      if (Number(val.toFixed(digits)) === 0) return [];
      const k = keptOf(i);
      const col = k > 0.5 ? colOf(i) : ROLE.dim;
      const ny = numbersOnTop ? top + 16 : base - Math.max(0, val) * perUnit - 24;
      return [txt(val.toFixed(digits), slotX(i), ny, 28, col, 'mono', 'center')];
    }),
  );

  const cut = dynamic(() => {
    const cy = base - threshold.value * perUnit;
    const l = line([left - 8, cy], [right + 8, cy], {
      stroke: ROLE.mark,
      width: 3.5,
      dash: [12, 9],
    });
    l.glow(8, ROLE.mark);
    return [l];
  });

  return {
    z,
    keep,
    threshold,
    rail,
    glyphs,
    bars,
    numbers,
    cut,
    x: slotX,
    base,
    perUnit,
    barWidth,
    slotW,
    bounds: { left, right, top, bottom, cx: x, cy: y },
    valueOf,
  };
}

/** Sleek glowing horizontal slider with luminous orb knob and floating mono value readout. */
export function glowSlider({
  x = 420,
  y = 40,
  width = 320,
  value,
  min = 0,
  max = 1,
  color = ROLE.mark,
  prefix = '',
  digits = 2,
  labelX,
} = {}) {
  const left = x - width / 2;
  const right = x + width / 2;
  const pos = (v) => left + ((v - min) / (max - min)) * width;
  const rail = rule(left, y, right, y, '#3b4a70', 5);
  const activeTrack = dynamic(() => {
    const px = pos(value.value);
    if (px - left < 2) return [];
    return [line([left, y], [px, y], { stroke: color, width: 5.5 }).glow(8, color)];
  });
  const knob = dynamic(() => glowDot(pos(value.value), y, { radius: 13, color, glow: 14 }));
  const readout = dynamic(() =>
    txt(
      `${prefix}${value.value.toFixed(digits)}`,
      labelX ?? right + 28,
      y,
      34,
      color,
      'mono',
      'left',
    ).glow(6, color),
  );
  return { rail, activeTrack, knob, readout, pos };
}

/** Rebuild helper connecting a live 2-feature code to the glowing activation plane. */
export function cinemaRebuild(b, read) {
  const first = () => scale(dictionary[0], read()[0]);
  const tip = () => add(first(), scale(dictionary[1], read()[1]));
  return {
    first,
    tip,
    blue: b.arrowOf([0, 0], first, ROLE.first, { width: 7 }),
    pink: b.arrowOf(first, tip, ROLE.second, { width: 7 }),
    point: b.dotOf(target, ROLE.activation, 11, 14),
    rebuilt: b.ringOf(tip, ROLE.activation, 21, 4),
    error: b.segmentOf(tip, target, ROLE.residual, { width: 7, glow: 10 }),
  };
}

/** Luminous horizontal readout bars with floating names above and live mono numbers to the right. */
export function glowReadoutBars({
  left = 200,
  top = 60,
  width = 520,
  rowGap = 112,
  items = [],
  max = 2,
  digits = 2,
} = {}) {
  const barAreaW = width - 120;
  const perUnit = barAreaW / max;
  const names = items.map((item, i) =>
    txt(item.name, left, top + i * rowGap, 28, item.color, 'sans', 'left'),
  );
  const bars = dynamic(() =>
    items.flatMap((item, i) => {
      const val = item.read();
      const w = Math.max(0, Math.min(barAreaW, val * perUnit));
      const by = top + i * rowGap + 44;
      const track = rule(left, by, left + barAreaW, by, '#273452', 3);
      const num = txt(val.toFixed(digits), left + width, by, 30, item.color, 'mono', 'right');
      if (w < 3) return [track, num];
      return [
        track,
        lumBar(left + w / 2, by, w, 30, {
          color: item.color,
          fillOpacity: 0.42,
          strokeWidth: 2.2,
          glow: 8,
          radius: 6,
        }),
        num,
      ];
    }),
  );
  return { names, bars };
}

/**
 * Glowing loss-recovered ruler shared by `coverage` and `training-evidence`.
 * Clean, rebuilt, and movable ablation baseline stand on one luminous horizontal axis.
 */
export function glowLossRuler(
  s,
  { left = 190, right = 820, y = 120, clean, rebuilt, ablated, max },
) {
  const baseline = s.value(ablated);
  const numbered = s.value(3);
  const width = right - left;
  const perUnit = width / max;
  const xOf = (loss) => left + loss * perUnit;
  const recovered = () => 1 - (rebuilt - clean) / (baseline.value - clean);
  const whole = (v) => Math.abs(v - Math.round(v)) < 0.05;

  const base = rule(left, y, right, y, '#4e628e', 3.5);
  const ticks = [0, 5, 10]
    .filter((v) => v <= max)
    .flatMap((v) => [
      line([xOf(v), y], [xOf(v), y + 14], { stroke: '#4e628e', width: 2.5 }),
      txt(String(v), xOf(v), y + 42, 26, COSMOS.dim, 'mono', 'center'),
    ]);

  const cleanMark = [
    line([xOf(clean), y], [xOf(clean), y - 34], { stroke: COSMOS.muted, width: 3 }),
    dynamic(() =>
      txt(
        numbered.value > 0.5 ? `clean ${clean}` : 'clean',
        xOf(clean) + 6,
        y - 58,
        28,
        COSMOS.ink,
        'mono',
        'right',
      ),
    ),
  ];

  const rebuiltMark = [
    line([xOf(rebuilt), y], [xOf(rebuilt), y - 82], { stroke: ROLE.wrong, width: 3 }),
    dynamic(() =>
      txt(
        numbered.value > 1.5 ? `rebuilt ${rebuilt}` : 'rebuilt',
        xOf(rebuilt) - 6,
        y - 108,
        28,
        ROLE.wrong,
        'mono',
        'left',
      ),
    ),
    line([xOf(clean), y], [xOf(rebuilt), y], { stroke: ROLE.wrong, width: 16 }).glow(9, ROLE.wrong),
  ];

  const baselineMark = dynamic(() => {
    const bx = xOf(baseline.value);
    const recEnd = xOf(Math.max(rebuilt, baseline.value));
    const lblX = Math.max(bx, xOf(rebuilt) + 170);
    return [
      ...(recEnd - xOf(rebuilt) > 2
        ? [
            line([xOf(rebuilt), y], [recEnd, y], { stroke: ROLE.residual, width: 16 }).glow(
              9,
              ROLE.residual,
            ),
          ]
        : []),
      line([bx, y + 18], [bx, y - 36], { stroke: ROLE.mark, width: 4.5 }).glow(8, ROLE.mark),
      glowDot(bx, y, { radius: 8, color: ROLE.mark, glow: 12 }),
      txt(
        numbered.value > 2.5
          ? `ablated ${baseline.value.toFixed(whole(baseline.value) ? 0 : 1)}`
          : 'ablated',
        lblX,
        y - 60,
        28,
        ROLE.mark,
        'mono',
        'center',
      ),
    ];
  });

  const shareWords = () =>
    Math.abs(baseline.value - clean) < 0.03 ? 'undefined' : `${Math.round(recovered() * 100)}%`;

  const share = dynamic(() => {
    const r = recovered();
    const ok = Math.abs(baseline.value - clean) >= 0.03 && r >= 0 && r <= 1;
    const col = ok ? ROLE.residual : ROLE.wrong;
    return txt(
      `Loss recovered: ${shareWords()}`,
      (left + right) / 2,
      y + 135,
      40,
      col,
      'mono',
      'center',
    ).glow(7, col);
  });

  const damage = txt(
    `damage ${(rebuilt - clean).toFixed(1)}`,
    xOf(clean) - 10,
    y + 82,
    28,
    ROLE.wrong,
    'mono',
    'left',
  );

  return {
    baseline,
    numbered,
    recovered,
    axis: [base, ...ticks, ...cleanMark, ...rebuiltMark],
    parts: baselineMark,
    share,
    damage,
    x: xOf,
    y,
  };
}

/**
 * Deterministic 3D overcomplete feature dictionary / superposition ray-fan inside a glowing
 * celestial unit sphere. Uses `cinematic3d`, `curve3d`, `line3d`, and `points3d`.
 */
export function buildOvercomplete3d({
  x = 460,
  y = 40,
  radius = 2.3,
  rayCount = 14,
  activeIndices = [0, 1],
  activeColors = [ROLE.first, ROLE.second],
  unit = 96,
  theta = -0.76,
  phi = 1.06,
} = {}) {
  const view = cinematic3d({
    theta,
    phi,
    distance: 13.8,
    unit,
    focus: [0, 0, 0],
  }).at(x, y);

  // Subtle glowing meridian & equator wireframe rings on the unit sphere
  const rings = [
    curve3d((t) => [radius * Math.cos(t), radius * Math.sin(t), 0], 0, Math.PI * 2, {
      color: '#3c5285',
      width: 1.8,
      opacity: 0.45,
      samples: 56,
    }),
    curve3d((t) => [radius * Math.cos(t), 0, radius * Math.sin(t)], 0, Math.PI * 2, {
      color: '#3c5285',
      width: 1.5,
      opacity: 0.32,
      samples: 56,
    }),
    curve3d((t) => [0, radius * Math.cos(t), radius * Math.sin(t)], 0, Math.PI * 2, {
      color: '#3c5285',
      width: 1.5,
      opacity: 0.32,
      samples: 56,
    }),
  ];

  // Deterministic Fibonacci-sphere overcomplete unit directions
  const golden = Math.PI * (3 - Math.sqrt(5));
  const dirs = [];
  for (let i = 0; i < rayCount; i++) {
    const z = 1 - ((i + 0.5) / rayCount) * 1.75;
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    const a = i * golden;
    dirs.push([r * Math.cos(a) * radius, r * Math.sin(a) * radius, z * radius]);
  }
  // Anchor active indices 0 and 1 cleanly so they visually suggest credential & urgency
  if (dirs.length >= 2) {
    dirs[0] = [radius, 0, 0];
    dirs[1] = [0.76 * radius, 0.56 * radius, 0.32 * radius];
  }

  const rayNodes = dirs.map((pt, idx) => {
    const activePos = activeIndices.indexOf(idx);
    const isAct = activePos >= 0;
    const col = isAct ? activeColors[activePos % activeColors.length] : '#5c78ad';
    return line3d([0, 0, 0], pt, {
      color: col,
      width: isAct ? 4.4 : 1.7,
      glow: isAct ? 10 : 0,
      opacity: isAct ? 0.96 : 0.44,
      blend: isAct ? 'screen' : undefined,
      onTop: isAct,
    });
  });

  const tipPoints = points3d(dirs, {
    colorAt: (idx) => {
      const p = activeIndices.indexOf(idx);
      return p >= 0 ? activeColors[p % activeColors.length] : ROLE.other;
    },
    radius: 5.5,
    glow: 10,
    blend: 'screen',
    onTop: true,
  });

  view.add(...rings, ...rayNodes, tipPoints);
  return { view, dirs };
}
