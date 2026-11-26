// Shared cinematic palette, math models, build-time invariants, and reusable glowing
// 2D/3D primitives for the 20-scene RNN Memory stage film.
import {
  arrow,
  circle,
  curve3d,
  dot,
  group,
  line,
  line3d,
  linear,
  parametricSurface,
  points3d,
  rect,
  seq,
  surface,
} from 'vizmatic/stage';
import {
  discountedTrace,
  mv,
  norm,
  scalarTrace,
  sigmoid,
  sum,
} from '../../films/rnn-memory/arithmetic.mjs';
import {
  cell,
  eventNames,
  hidden,
  inputs,
  openingWords,
  padded,
  scalar,
  states,
  wh,
  wx,
} from '../../films/rnn-memory/fixtures.mjs';
import {
  actorMemoryTrace,
  gruResetComparison,
  incidentModel,
} from '../../films/rnn-memory/model.mjs';
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
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  COSMOS,
  actorMemoryTrace,
  aura,
  cell,
  cinematic3d,
  discountedTrace,
  eventNames,
  glowDot,
  glowTex,
  glowingTrail,
  gruResetComparison,
  guardedDynamic,
  heroTitle,
  hidden,
  incidentModel,
  inputs,
  metricReadout,
  mv,
  norm,
  openingWords,
  orbitScene,
  padded,
  rule,
  scalar,
  scalarTrace,
  sigmoid,
  states,
  sum,
  txt,
  wh,
  wireframeSlab3d,
  wx,
};

/** One semantic color per conceptual role across all 20 scenes. */
export const ROLE = Object.freeze({
  state: COSMOS.cyan,
  dog: COSMOS.cyan,
  grad: COSMOS.rose,
  cat: COSMOS.rose,
  warn: COSMOS.rose,
  input: COSMOS.blue,
  cell: COSMOS.emerald,
  keep: COSMOS.emerald,
  safe: COSMOS.emerald,
  gold: COSMOS.gold,
  focus: COSMOS.gold,
  gate: COSMOS.violet,
  alt: COSMOS.violet,
  amber: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
  surface: COSMOS.surface,
  surfaceAlt: COSMOS.surfaceAlt,
});

export const EVENTS = Object.freeze([...eventNames]);
export const MODEL = incidentModel();
export const DOG_TRACE = actorMemoryTrace('dog');
export const CAT_TRACE = actorMemoryTrace('cat');
export const IDENTITY_GRU = gruResetComparison({
  recurrent: [
    [1, 0],
    [0, 1],
  ],
});
export const SIGMA_MAX_W = (1 + Math.sqrt(2)) / 2;
export const FRESH_EVENTS = Object.freeze([0.2, 0.8, 0]);
export const FRESH_CHANGED = Object.freeze([0.2, 0.8, 0.9]);
export const FRESH_PREFIX = Object.freeze(scalarTrace(FRESH_EVENTS.slice(0, 2)));
export const FRESH_LONG = Object.freeze(scalarTrace(FRESH_EVENTS));
export const FRESH_WRONG = Object.freeze(scalarTrace(FRESH_CHANGED));

export const fmt = (v, digits = 3) => Number(v).toFixed(digits);
export const fmtSigned = (v, digits = 3) => (v >= 0 ? `+${fmt(v, digits)}` : fmt(v, digits));
export const vecStr = (v, digits = 3) => `[${v.map((x) => fmt(x, digits)).join(', ')}]`;

/** Build-time mathematical verification of every core identity in the RNN Memory film. */
export function verifyRnnInvariants() {
  verifyInvariant(DOG_TRACE.final > 0 && CAT_TRACE.final < 0, 'dog vs cat opposite signs');
  verifyApprox(DOG_TRACE.final, -CAT_TRACE.final, 1e-12, 'symmetric actor trace');
  verifyInvariant(DOG_TRACE.padded > 0 && DOG_TRACE.padded < DOG_TRACE.final, 'padding decay');

  verifyApprox(sum(inputs), 2.3, 1e-12, 'raw event sum = 2.3');
  verifyApprox(MODEL.discount.at(-1), 1.5, 1e-12, 'forward discounted trace = 1.500');
  verifyApprox(MODEL.reverseDiscount.at(-1), 1.564, 1e-12, 'reverse discounted trace = 1.564');

  verifyApprox(scalar[1], 0.664037, 1e-5, 'scalar h1');
  verifyApprox(scalar[2], 0.573026, 1e-5, 'scalar h2');
  verifyApprox(scalar[3], 0.764316, 1e-5, 'scalar h3');

  verifyApprox(states[1][0], 0.664, 1e-3, 'vector h1[0]');
  verifyApprox(states[1][1], 0.1, 1e-3, 'vector h1[1]');
  verifyApprox(states[2][0], 0.494, 1e-3, 'vector h2[0]');
  verifyApprox(states[2][1], 0.641, 1e-3, 'vector h2[1]');
  verifyApprox(states[3][0], 0.39, 1e-3, 'vector h3[0]');
  verifyApprox(states[3][1], 0.655, 1e-3, 'vector h3[1]');

  verifyApprox(MODEL.logits[1], 0.368, 1e-3, 'rollback logit');
  verifyApprox(MODEL.probabilities[1], 0.389, 2e-3, 'rollback probability ~38.9%');
  verifyApprox(sum(MODEL.probabilities), 1, 1e-12, 'softmax probabilities sum to 1');

  verifyApprox(MODEL.sensitivities.at(-1), 0.019517, 1e-5, 'scalar sensitivity h3/h0');
  verifyApprox(MODEL.weightGradient, 0.331003, 1e-5, 'shared weight gradient');
  verifyApprox(MODEL.inputGradient[0], 0.031227, 1e-5, 'input grad 0');
  verifyApprox(MODEL.inputGradient[2], 0.332657, 1e-5, 'input grad 2');

  verifyApprox(0.6 ** 12, 0.00217678, 1e-6, '0.6^12 vanishing');
  verifyApprox(1.4 ** 12, 56.6939, 1e-3, '1.4^12 exploding');
  verifyApprox(norm(MODEL.matrixPowers[1]), Math.sqrt(1.25), 1e-9, 'Jordan step 1 norm');
  verifyApprox(norm(MODEL.matrixPowers[2]), Math.sqrt(1.0625), 1e-9, 'Jordan step 2 norm');
  verifyApprox(norm(MODEL.matrixPowers[9]), 0.0352, 1e-3, 'Jordan step 9 norm');
  verifyApprox(SIGMA_MAX_W, 1.2071, 1e-3, 'largest singular value');
  verifyApprox(0.75 ** 5, 0.2373, 1e-3, 'uniform bound 0.75^5');
  verifyInvariant(
    Math.fround(1 - Math.fround(0.6 ** 50)) === 1,
    'float32 rounds tiny update back to 1',
  );

  verifyApprox(norm(MODEL.rawGradient), 72.604, 1e-2, 'raw gradient norm');
  verifyApprox(norm(MODEL.clippedGradient), 5, 1e-9, 'clipped gradient norm = 5');

  verifyApprox(cell, 0.8399, 1e-9, 'LSTM stored cell');
  verifyApprox(hidden, 0.5486, 1e-3, 'LSTM exposed hidden o=0.8');
  verifyApprox(0.1 * Math.tanh(cell), 0.0686, 1e-3, 'LSTM exposed hidden o=0.1');
  verifyApprox(MODEL.lstm.nextCell[0], 0.749338, 1e-5, 'learned LSTM c1');
  verifyApprox(MODEL.lstm.nextCell[1], 0.037754, 1e-5, 'learned LSTM c2');
  verifyApprox(MODEL.lstm.written[1], 0, 1e-12, 'learned LSTM coord 2 zero write');

  verifyInvariant(0.98 ** 30 > 0.545 && 0.5 ** 30 < 1e-9, 'retention separation at t=30');
  verifyApprox(0.95 * 0.8 + 0.05 * -0.2, 0.75, 1e-9, 'GRU z=0.95');
  verifyApprox(0.5 * 0.8 + 0.5 * -0.2, 0.3, 1e-9, 'GRU z=0.50');
  verifyApprox(0.05 * 0.8 + 0.95 * -0.2, -0.15, 1e-9, 'GRU z=0.05');
  verifyInvariant(IDENTITY_GRU.before[1] === IDENTITY_GRU.after[1], 'identity GRU routes agree');
  verifyInvariant(
    MODEL.gru.beforeHidden[1] < 0 && MODEL.gru.afterHidden[1] > 0,
    'mixing GRU routes disagree in sign',
  );

  verifyApprox(padded[0], 0.302, 1e-3, 'zero-padded vector[0]');
  verifyApprox(padded[1], 0.367, 1e-3, 'zero-padded vector[1]');
  verifyApprox(MODEL.junk[0], 1.0, 1e-3, 'junk-padded vector[0]');
  verifyApprox(MODEL.junk[1], -0.889, 1e-3, 'junk-padded vector[1]');
  verifyApprox(MODEL.resetNext, 0.3095, 1e-3, 'reset next state');
  verifyApprox(MODEL.leakedNext, 0.6057, 1e-3, 'leaked next state');

  verifyApprox(FRESH_PREFIX.at(-1), 0.616491, 1e-5, 'fresh prefix state');
  verifyApprox(FRESH_LONG.at(-1), 0.29884, 1e-5, 'fresh real-zero state');
  verifyInvariant(
    FRESH_PREFIX.at(-1) >= 0.5 && FRESH_LONG.at(-1) < 0.5 && FRESH_WRONG.at(-1) >= 0.5,
    'fresh transfer threshold separation',
  );
}

/** Clamp play duration so no animation ever runs past its scene's narration. */
export function safeDur(c, startTime, desired = 0.75, margin = 0.44) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.12, Math.min(desired, remaining));
}

/** Schedule an animation at a declared cue (start or end) with clamped safe duration. */
export function playCue(
  s,
  c,
  cueId,
  build,
  { after = false, offset = 0, dur = 0.75, margin = 0.44 } = {},
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
export function swapVis(outVal, inVal, d = 0.6) {
  const half = Math.max(0.12, d * 0.46);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

/** Schedule a continuous ambient phase animation safely inside the scene window. */
export function runPhase(s, c, phaseVal, target = 8, startOffset = 0.08) {
  const dur = Math.max(0.4, c.end - c.start - startOffset - 0.52);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/** Full-canvas ambient energy field marked as decoration. */
export function cinemaAtmosphere(primary = ROLE.state, secondary = ROLE.gold) {
  return group(
    aura(-540, -230, 560, `${primary}24`, '#07091000'),
    aura(480, 150, 620, `${secondary}20`, '#07091000'),
    aura(0, 0, 720, '#2a3d7a22', '#07091000'),
  ).zIndex(-80);
}

/** Luminous horizontal/vertical bar with soft inner glow and crisp edge. */
export function lumBar(
  x,
  y,
  w,
  h,
  {
    color = ROLE.state,
    fillOpacity = 0.28,
    strokeWidth = 2.4,
    glow = 8,
    radius = 8,
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

/** Luminous token/event pill (compact capsule, never a prose card). */
export function tokenPill(
  label,
  x,
  y,
  color = ROLE.input,
  { w = 156, h = 56, size = 28, dash, opacity = 1, glow = 6, font = 'sans' } = {},
) {
  return group(
    lumBar(x, y, w, h, {
      color,
      fillOpacity: dash ? 0.08 : 0.2,
      strokeWidth: dash ? 2 : 2.4,
      glow,
      radius: h / 2,
      opacity,
      dash,
    }),
    txt(
      label,
      x,
      y,
      size,
      color === COSMOS.dim ? COSMOS.muted : COSMOS.ink,
      font,
      'center',
    ).opacity(opacity),
  );
}

/** Luminous ring marker for state nodes, focus targets, and gate valves. */
export function glowRing(
  x,
  y,
  radius,
  color,
  { width = 3.2, glow = 9, fillOpacity = 0.16, opacity = 1 } = {},
) {
  const fill = circle(radius, { fill: color, stroke: null })
    .at(x, y)
    .opacity(fillOpacity * opacity);
  const ring = circle(radius, { fill: null, stroke: color, width }).at(x, y).opacity(opacity);
  if (glow > 0) ring.glow(glow, color);
  return group(fill, ring);
}

/** Smooth 2D quadratic Bezier curve rendered as a glowingTrail. */
export function glowArc(p0, p1, liftY = -80, opts = {}) {
  const mx = (p0[0] + p1[0]) * 0.5;
  const my = (p0[1] + p1[1]) * 0.5 + liftY;
  const pts = Array.from({ length: 28 }, (_, i) => {
    const t = i / 27;
    const u = 1 - t;
    return [
      u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
    ];
  });
  return glowingTrail(pts, opts);
}

/** Glowing vector arrow with tip photon. */
export function glowVector(
  origin,
  tip,
  { color = ROLE.gold, width = 5, tipSize = 18, glow = 10, opacity = 1, dotRadius = 5 } = {},
) {
  const len = Math.hypot(tip[0] - origin[0], tip[1] - origin[1]);
  if (len < 3) {
    return glowDot(origin[0], origin[1], { radius: dotRadius, color, glow, opacity });
  }
  const vec = arrow(origin, tip, { stroke: color, width, tip: tipSize }).opacity(opacity);
  if (glow > 0) vec.glow(glow, color);
  const head = glowDot(tip[0], tip[1], { radius: dotRadius, color, glow: glow + 2, opacity });
  return group(vec, head);
}

/** Luminous matrix with glowing brackets and highlighted cells. */
export function glowMatrix({
  cx = 0,
  cy = 0,
  rows = 2,
  cols = 2,
  cellW = 112,
  cellH = 66,
  gap = 10,
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
  const bxL = left - 16;
  const bxR = left + totalW + 16;
  const byT = top - 10;
  const byB = top + totalH + 10;
  const parts = [
    glowingTrail(
      [
        [bxL + 12, byT],
        [bxL, byT],
        [bxL, byB],
        [bxL + 12, byB],
      ],
      { color: bracketColor, width: 2.8, glow: 5, core: false, opacity: 0.8 * opacity },
    ),
    glowingTrail(
      [
        [bxR - 12, byT],
        [bxR, byT],
        [bxR, byB],
        [bxR - 12, byB],
      ],
      { color: bracketColor, width: 2.8, glow: 5, core: false, opacity: 0.8 * opacity },
    ),
  ];
  for (let r = 0; r < rows; r++) {
    const ry = top + r * (cellH + gap) + cellH / 2;
    if (rowLabels[r]) {
      parts.push(
        txt(rowLabels[r], bxL - 20, ry, 26, COSMOS.muted, 'mono', 'right').opacity(opacity),
      );
    }
    for (let k = 0; k < cols; k++) {
      const rx = left + k * (cellW + gap) + cellW / 2;
      if (r === 0 && colLabels[k]) {
        parts.push(
          txt(colLabels[k], rx, byT - 28, 26, COSMOS.muted, 'sans', 'center').opacity(opacity),
        );
      }
      const val = values[r]?.[k] ?? '';
      const isHi = highlight(r, k);
      const isDim = dim(r, k);
      const col = colors[r]?.[k] ?? (isHi ? ROLE.gold : ROLE.state);
      const cellAlpha = (isDim ? 0.28 : 1) * opacity;
      parts.push(
        lumBar(rx, ry, cellW, cellH, {
          color: col,
          fillOpacity: isHi ? 0.34 : 0.16,
          strokeWidth: isHi ? 3 : 1.6,
          glow: isHi ? 10 : 4,
          radius: 8,
          opacity: cellAlpha,
        }),
      );
      if (val !== '') {
        parts.push(
          txt(String(val), rx, ry, fontSize, isHi ? COSMOS.ink : col, 'mono', 'center').opacity(
            cellAlpha,
          ),
        );
      }
    }
  }
  return group(...parts);
}

/**
 * Orbiting 3D Spectral-Radius / Eigenvalue Spiral Rig:
 * Displays the unit stability cylinder (|lambda| = 1), an inward vanishing helix (|lambda| < 1),
 * and an outward exploding helix (|lambda| > 1).
 */
export function buildSpectralSpiral3d(
  growReveal,
  { x = 510, y = 45, unit = 92, distance = 14.2 } = {},
) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.06,
    distance,
    unit,
    focus: [0, 0, 0.2],
  }).at(x, y);

  // Unit stability cylinder rings (z = -1.6 to +1.6)
  const unitRings = [-1.4, 0, 1.4].map((z) =>
    curve3d((t) => [Math.cos(t), Math.sin(t), z], 0, Math.PI * 2, {
      color: '#4e6396',
      width: z === 0 ? 2.6 : 1.5,
      opacity: z === 0 ? 0.72 : 0.35,
      samples: 48,
    }),
  );

  // Axis spine
  const axisZ = line3d([0, 0, -2.0], [0, 0, 2.2], {
    color: '#556894',
    width: 1.8,
    opacity: 0.55,
  });

  // Vanishing spiral: r(t) = 1.0 * 0.6^(t * 0.65)
  const vanishSpiral = curve3d(
    (t) => {
      const r = 1.05 * Math.pow(0.6, t * 0.65);
      const ang = t * 1.65;
      return [r * Math.cos(ang), r * Math.sin(ang), -1.5 + t * 0.34];
    },
    0,
    9,
    {
      color: ROLE.grad,
      width: 4.0,
      glow: 9,
      blend: 'screen',
      samples: 96,
      onTop: true,
    },
  );

  // Exploding spiral: full outward helix revealed cleanly by growReveal opacity
  const explodeSpiral = curve3d(
    (t) => {
      const u = t * 6.4;
      const r = 0.45 * Math.pow(1.24, u);
      const ang = u * 1.45 + 0.8;
      return [r * Math.cos(ang), r * Math.sin(ang), -1.4 + u * 0.46];
    },
    0,
    1,
    {
      color: ROLE.state,
      width: 4.0,
      glow: 10,
      blend: 'screen',
      samples: 84,
      onTop: true,
    },
  ).opacity(() => growReveal.value);

  // Orbiting photon tips
  const tips = points3d(
    () => {
      const pts = [];
      const tv = 9;
      const rv = 1.05 * Math.pow(0.6, tv * 0.65);
      pts.push([rv * Math.cos(tv * 1.65), rv * Math.sin(tv * 1.65), -1.5 + tv * 0.34]);
      const g = growReveal.value;
      if (g > 0.08) {
        const u = g * 6.4;
        const re = 0.45 * Math.pow(1.24, u);
        pts.push([re * Math.cos(u * 1.45 + 0.8), re * Math.sin(u * 1.45 + 0.8), -1.4 + u * 0.46]);
      }
      return pts;
    },
    {
      colorAt: (idx) => (idx === 0 ? ROLE.grad : ROLE.state),
      radius: 6.5,
      glow: 12,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(...unitRings, axisZ, vanishSpiral, explodeSpiral, tips);
  return view;
}

/**
 * Orbiting 3D Forget-Gate Retention Landscape: z(t, f) = f^t
 * Visually separates the high emerald highway (f -> 1) from the collapsing rose cliff (f = 0.5).
 */
export function buildRetentionSurface3d(probeStep, { x = 510, y = 40 } = {}) {
  const view = cinematic3d({
    theta: -0.92,
    phi: 1.08,
    distance: 15.2,
    unit: 96,
    focus: [0, 0, 0.7],
  }).at(x, y);

  const terrain = surface(
    (wx, wy) => {
      const t = ((wx + 2.4) / 4.8) * 30;
      const f = 0.45 + ((wy + 2.0) / 4.0) * 0.54;
      return 2.15 * Math.pow(Math.max(0.05, Math.min(1, f)), Math.max(0, t));
    },
    {
      x: [-2.4, 2.4],
      y: [-2.0, 2.0],
      resolution: [34, 28],
      colors: ['#0c1228', '#3c1f5c', '#c83e6c', '#2a7da8', '#6ee7b7'],
      mesh: '#80e5ff',
      meshOpacity: 0.2,
      meshWidth: 0.6,
      opacity: 0.88,
    },
  );

  // f = 0.98 emerald highway ridge
  const yHigh = -2.0 + ((0.98 - 0.45) / 0.54) * 4.0;
  const yLow = -2.0 + ((0.5 - 0.45) / 0.54) * 4.0;

  const highCurve = curve3d(
    (u) => {
      const t = u * 30;
      const wx = -2.4 + (t / 30) * 4.8;
      return [wx, yHigh, 2.15 * Math.pow(0.98, t) + 0.08];
    },
    0,
    1,
    { color: ROLE.cell, width: 4.5, glow: 10, blend: 'screen', samples: 60, onTop: true },
  );

  const lowCurve = curve3d(
    (u) => {
      const t = u * 30;
      const wx = -2.4 + (t / 30) * 4.8;
      return [wx, yLow, 2.15 * Math.pow(0.5, t) + 0.08];
    },
    0,
    1,
    { color: ROLE.grad, width: 4.5, glow: 10, blend: 'screen', samples: 60, onTop: true },
  );

  const probeSlice = line3d(
    () => {
      const wx = -2.4 + (probeStep.value / 30) * 4.8;
      return [wx, -2.0, 0.05];
    },
    () => {
      const wx = -2.4 + (probeStep.value / 30) * 4.8;
      return [wx, 2.0, 0.05];
    },
    { color: ROLE.gold, width: 3.0, glow: 8, blend: 'screen', onTop: true },
  );

  view.add(terrain, highCurve, lowCurve, probeSlice);
  return view;
}

/** Shaded 3D rectangular prism for tensor volumes and memory slices. */
export function box3d(x0, y0, z0, dx, dy, dz, fillColor, edgeColor, opacity = 0.72) {
  const opts = { resolution: [1, 1], color: fillColor, opacity, mesh: false, shaded: true };
  const edges = wireframeSlab3d(
    [x0 + dx * 0.5, y0 + dy * 0.5, z0 + dz * 0.5],
    dx * 0.5,
    dy * 0.5,
    dz * 0.5,
    {
      color: edgeColor,
      width: 2.2,
      glow: 6,
    },
  );
  return [
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z0 + dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + dx, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
    ...edges,
  ];
}
