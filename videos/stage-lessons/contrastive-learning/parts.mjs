// Shared math models, invariants, color semantics, and 3D/2D Pure Cinema helpers for contrastive-learning.
import {
  Node,
  arc,
  arrow,
  circle,
  curve3d,
  dot,
  group,
  label3d,
  line,
  line3d,
  linear,
  linearGradient,
  parametricSurface,
  point3d,
  points3d,
  polyPath,
  radialGradient,
  rect,
  seq,
} from 'vizmatic/stage';
import {
  ANGLES,
  MINING_FIXTURE,
  NESTED_D,
  NESTED_Q,
  START,
  TAU,
} from '../../films/contrastive-learning/fixtures.mjs';
import {
  clip,
  comparisonRow,
  evaluate,
  finiteUnit,
  formatValue,
  maskedMean,
  miningCandidates,
  nestedLoss,
  shortlistMetrics,
  steps,
  tokenMaxSim,
  vector,
} from '../../films/contrastive-learning/arithmetic.mjs';
import {
  denominatorSnapshot,
  negativePoolSnapshot,
  scoreTemperature,
  validateModel,
} from '../../films/contrastive-learning/model.mjs';
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
  markDecoration,
  metricReadout,
  morphEquation,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';

export {
  ANGLES,
  CINEMA_FRAME,
  COSMOS,
  MINING_FIXTURE,
  NESTED_D,
  NESTED_Q,
  START,
  TAU,
  aura,
  cinematic3d,
  clip,
  comparisonRow,
  denominatorSnapshot,
  evaluate,
  finiteUnit,
  formatValue,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  markDecoration,
  maskedMean,
  metricReadout,
  miningCandidates,
  morphEquation,
  negativePoolSnapshot,
  nestedLoss,
  orbitScene,
  rule,
  scoreTemperature,
  shortlistMetrics,
  steps,
  tokenMaxSim,
  txt,
  vector,
  verifyApprox,
  verifyInvariant,
};

/** One semantic color per conceptual role across all 30 scenes of contrastive-learning. */
export const ROLE = Object.freeze({
  anchor: COSMOS.cyan,
  positive: COSMOS.emerald,
  competitor: COSMOS.rose,
  unrelated: COSMOS.blue,
  focus: COSMOS.gold,
  invalid: COSMOS.rose,
  violet: COSMOS.violet,
  amber: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
});

export const NAMES = Object.freeze(['puppy runs', 'dog sleeps', 'sky is blue']);
export const COLORS = Object.freeze([ROLE.positive, ROLE.competitor, ROLE.unrelated]);

/** Build-time mathematical verification of every core number spoken across all 30 scenes. */
export function verifyContrastiveInvariants() {
  verifyInvariant(validateModel() === true, 'contrastive-learning model invariants must hold');

  // Running dog archive scores, InfoNCE loss, and 30-step angular trajectory
  const base = evaluate();
  const fullRow = comparisonRow(base.scores, TAU);
  const easyRow = comparisonRow(base.scores, TAU, 0, [true, false, true]);
  const noSkyRow = comparisonRow(base.scores, TAU, 0, [true, true, false]);
  verifyApprox(fullRow.probs[0] * 100, 57.4, 0.1, 'full-pool puppy share (~57.4%)');
  verifyApprox(easyRow.probs[0] * 100, 99.7, 0.1, 'puppy + sky share (~99.7%)');
  verifyApprox(fullRow.loss, 0.555, 0.002, 'full-pool InfoNCE loss (~0.555 nats)');
  verifyInvariant(noSkyRow.loss < fullRow.loss && easyRow.loss < noSkyRow.loss, 'loss ordering');

  const path = steps(30);
  verifyApprox(evaluate(path[1]).probs[0] * 100, 68.2, 0.1, 'step 1 puppy share (~68.2%)');
  verifyApprox(evaluate(path.at(-1)).probs[0] * 100, 96.4, 0.1, 'step 30 puppy share (~96.4%)');

  // Order collision static mean
  const staticVecs = [
    [0.9, 0.1, 0],
    [0.8, 0.2, 0.1],
    [0.7, 0.1, 0.2],
  ];
  const staticMean = staticVecs[0].map((_, j) => staticVecs.reduce((a, v) => a + v[j], 0) / 3);
  verifyApprox(staticMean[0], 0.8, 1e-12, 'static mean x');
  verifyApprox(staticMean[1], 0.4 / 3, 1e-12, 'static mean y');
  verifyApprox(staticMean[2], 0.1, 1e-12, 'static mean z');

  // Masked pooling and 2x2 InfoNCE
  const mA = maskedMean(
    [
      [1, 0],
      [0, 1],
      [99, 99],
    ],
    [1, 1, 0],
  );
  const mB = maskedMean(
    [
      [0, 2],
      [0, 0],
      [99, 99],
    ],
    [1, 0, 0],
  );
  verifyApprox(mA[0], 0.5, 1e-12, 'masked mean A[0]');
  verifyApprox(mB[1], 2.0, 1e-12, 'masked mean B[1]');
  const qUnit = [mA, mB].map(finiteUnit);
  const poolLoss =
    (comparisonRow(qUnit[0], 0.2, 0).loss + comparisonRow(qUnit[1], 0.2, 1).loss) / 2;
  verifyApprox(poolLoss, 0.349931, 1e-5, '2x2 masked pooling InfoNCE loss');

  // Loss numerics and tied huge logits
  const row05 = comparisonRow([0.9, 0.2], 0.05);
  const swap05 = comparisonRow([0.2, 0.9], 0.05);
  verifyInvariant(row05.loss < 1e-6, 'easy row loss < 1e-6');
  verifyApprox(swap05.loss, 14.0, 0.01, 'swapped row loss ~14 nats');
  verifyApprox(comparisonRow([1e308, 1e308], 1).loss, Math.log(2), 1e-12, 'tied huge logits ln 2');

  // Triplet margin
  verifyApprox(Math.max(0, 0.2 - 0.5 + 0.1), 0, 1e-12, 'satisfied triplet loss 0');
  verifyApprox(Math.max(0, 0.5 - 0.3 + 0.1), 0.3, 1e-12, 'active triplet loss 0.3');

  // Temperature gradient and exponential ratio
  const gradAt = (t) => Math.exp(-0.7 / t) / (1 + Math.exp(-0.7 / t)) / t;
  verifyApprox(gradAt(1.0), 0.3318, 0.001, 'grad at tau=1');
  verifyApprox(gradAt(0.1), 0.00911, 0.0001, 'grad at tau=0.1');
  verifyApprox(gradAt(0.05), 1.663e-5, 1e-6, 'grad at tau=0.05');
  verifyApprox(Math.exp((0.72 - 0.2) / 0.05), 32859.6, 1.0, 'negative gradient ratio ~32860');

  // False negatives
  const dupFull = comparisonRow([0.8, 0.8, 0.1], 0.2);
  const dupMask = comparisonRow([0.8, 0.8, 0.1], 0.2, 0, [true, false, true]);
  verifyApprox(dupFull.gradients[1], 2.463, 0.005, 'duplicate copy gradient +2.463');
  verifyApprox(dupMask.probs[0] * 100, 97.1, 0.1, 'masked target share ~97.1%');
  verifyInvariant(dupMask.gradients[1] === 0, 'masked copy gradient 0');

  // Multiple positives
  const mpProbs = [0.999, 0.0005, 0.0005];
  const mpSumLoss = -Math.log(mpProbs[0] + mpProbs[1]);
  const mpMeanLoss = (-Math.log(mpProbs[0]) - Math.log(mpProbs[1])) / 2;
  verifyApprox(mpSumLoss, 0.0005, 1e-4, 'sum-before-log loss');
  verifyApprox(mpMeanLoss, 3.80095, 1e-4, 'mean-log loss');

  // Mining loop
  const mined = miningCandidates('How do I rotate an API key?');
  verifyInvariant(mined.length === 2 && mined[0].id === 'service account', 'mined order');
  verifyApprox(comparisonRow([0.9, 0.2, 0.72], 0.05).loss, 0.026958, 1e-5, 'mined hard neg loss');

  // Teacher margin
  verifyApprox((3.5 - 2) ** 2, 2.25, 1e-12, 'cosine margin bound floor 2.25');

  // MaxSim and payload
  verifyApprox(
    tokenMaxSim([
      [0.12, 0.93, 0.08],
      [0.19, 0.07, 0.91],
    ]).sum,
    1.84,
    1e-12,
    'MaxSim sum 1.84',
  );
  verifyApprox((100 * 128) / 768, 16.667, 0.01, 'ColBERT raw coord ratio ~16.7x');

  // Matryoshka nested losses and payload
  verifyApprox(nestedLoss(2), 0.0088, 0.0002, 'nested width 2 loss');
  verifyApprox(nestedLoss(4), 0.0147, 0.0002, 'nested width 4 loss');
  verifyApprox(nestedLoss(6), 0.0225, 0.0002, 'nested width 6 loss');
  verifyApprox((10_000_000 * 64 * 4) / 1e9, 2.56, 1e-9, '64-d 10M raw GB');
  verifyApprox((10_000_000 * 768 * 4) / 1e9, 30.72, 1e-9, '768-d 10M raw GB');

  // Transfer and fresh-embedding
  verifyApprox((fullRow.probs[1] - 0.5) / TAU, -0.379, 0.002, 'transfer sleeping dog derivative');
  const freshFull = comparisonRow([0.65, 0.65, 0.05], 0.15);
  const freshMask = comparisonRow([0.65, 0.65, 0.05], 0.15, 0, [true, false, true]);
  verifyApprox(freshFull.gradients[1], 3.303, 0.002, 'fresh wheel mirror gradient +3.303');
  verifyApprox(freshMask.loss, 0.01815, 0.0002, 'fresh masked loss ~0.018');
}

/** Clamp a play duration so an animation never outruns narration. */
export function safeDur(c, startTime, desired = 0.75, margin = 0.35) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.1, Math.min(desired, remaining));
}

/** Schedule an animation at a declared cue start, safely bounded inside the scene window. */
export function playOn(s, c, cueId, makeAnim, desired = 0.75, offset = 0) {
  const info = c.cue(cueId);
  const startAt = info.start + offset;
  const d = safeDur(c, startAt, desired);
  c.on(
    cueId,
    () => {
      const anim = makeAnim(d);
      if (Array.isArray(anim)) s.play(...anim);
      else s.play(anim);
    },
    offset,
  );
  return d;
}

/** Schedule an animation after a declared cue ends (for prediction reveals), safely bounded. */
export function playAfter(s, c, cueId, makeAnim, desired = 0.6, offset = 0) {
  const info = c.cue(cueId);
  const startAt = info.end + offset;
  const d = safeDur(c, startAt, desired);
  c.after(
    cueId,
    () => {
      const anim = makeAnim(d);
      if (Array.isArray(anim)) s.play(...anim);
      else s.play(anim);
    },
    offset,
  );
  return d;
}

/** Sequential fade-out then fade-in across two dynamic view values (zero overlap). */
export function swapVis(outVal, inVal, d = 0.65) {
  const half = Math.max(0.12, d * 0.46);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

/** Schedule a continuous ambient phase across the scene without exceeding c.end. */
export function runPhase(s, c, phaseVal, target = 1, startOffset = 0.08, endMargin = 0.45) {
  const dur = Math.max(0.4, c.end - c.start - startOffset - endMargin);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/** Append an alpha hex byte (0..1) to a 6-digit #rrggbb color string. */
export function hexAlpha(hex, alpha = 0.22) {
  const clean = hex.startsWith('#') ? hex.slice(1, 7) : hex.slice(0, 6);
  const byte = Math.max(0, Math.min(255, Math.round(alpha * 255)))
    .toString(16)
    .padStart(2, '0');
  return `#${clean}${byte}`;
}

/** Full-canvas decorative cosmic aura glow (marked as decoration). */
export function cinemaAtmosphere(primary = ROLE.anchor, secondary = ROLE.positive) {
  return markDecoration(
    group(
      aura(-540, -220, 560, hexAlpha(primary, 0.14), '#07091000'),
      aura(480, 150, 620, hexAlpha(secondary, 0.12), '#07091000'),
      aura(0, 20, 740, '#24356818', '#07091000'),
    ).zIndex(-80),
  );
}

/**
 * Luminous translucent bar or matrix cell using 8-digit hex fill (since Vizmatic rect ignores fillOpacity).
 * Use ONLY for geometric bars, heat-grid cells, token slots, and visual instruments (never prose cards).
 */
export function lumBar(
  x,
  y,
  w,
  h,
  {
    color = ROLE.anchor,
    fillAlpha = 0.24,
    strokeWidth = 2.2,
    glow = 7,
    radius = 8,
    opacity = 1,
    dash,
  } = {},
) {
  const safeW = Math.max(4, w);
  const safeH = Math.max(4, h);
  const fill = fillAlpha > 0 ? hexAlpha(color, fillAlpha) : null;
  const node = rect(safeW, safeH, {
    fill,
    stroke: strokeWidth > 0 ? color : null,
    width: strokeWidth,
    radius,
    dash,
  })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0 && strokeWidth > 0) node.glow(glow, color);
  return node;
}

/** Luminous circular ring marker (for orbital hubs, Venn sets, focus targets). */
export function glowRing(
  x,
  y,
  radius,
  color,
  { width = 3.2, glow = 9, fillAlpha = 0.12, opacity = 1, dash } = {},
) {
  const fill = fillAlpha > 0 ? hexAlpha(color, fillAlpha) : null;
  const node = circle(radius, { fill, stroke: color, width, dash }).at(x, y).opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Glowing vector arrow with luminous tip photon. */
export function glowVector(
  origin,
  tip,
  { color = ROLE.anchor, width = 4.6, tipSize = 17, glow = 9, opacity = 1, dotRadius = 5.5 } = {},
) {
  const len = Math.hypot(tip[0] - origin[0], tip[1] - origin[1]);
  if (len < 3) {
    return glowDot(origin[0], origin[1], { radius: dotRadius, color, glow, opacity });
  }
  const vec = arrow(origin, tip, { stroke: color, width, tip: tipSize }).opacity(opacity);
  if (glow > 0) vec.glow(glow, color);
  const head = glowDot(tip[0], tip[1], {
    radius: dotRadius,
    color: '#ffffff',
    glow: glow + 2,
    opacity,
  });
  return group(vec, head);
}

/** Smooth 2D quadratic Bezier glowing arc between two endpoints. */
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

/** Bracketed luminous matrix or heat-grid with clean external row/column labels. */
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
  bracketColor = '#5e76ab',
  opacity = 1,
} = {}) {
  const totalW = cols * cellW + (cols - 1) * gap;
  const totalH = rows * cellH + (rows - 1) * gap;
  const left = cx - totalW / 2;
  const top = cy - totalH / 2;
  const parts = [];

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
      { color: bracketColor, width: 2.8, glow: 4, core: false, opacity: 0.78 * opacity },
    ),
    glowingTrail(
      [
        [bxR - 14, byT],
        [bxR, byT],
        [bxR, byB],
        [bxR - 14, byB],
      ],
      { color: bracketColor, width: 2.8, glow: 4, core: false, opacity: 0.78 * opacity },
    ),
  );

  for (let r = 0; r < rows; r++) {
    const ry = top + r * (cellH + gap) + cellH / 2;
    if (rowLabels[r]) {
      parts.push(
        txt(rowLabels[r], bxL - 22, ry, 28, COSMOS.muted, 'sans', 'right').opacity(opacity),
      );
    }
    for (let k = 0; k < cols; k++) {
      const rx = left + k * (cellW + gap) + cellW / 2;
      if (r === 0 && colLabels[k]) {
        parts.push(
          txt(colLabels[k], rx, byT - 32, 28, COSMOS.muted, 'sans', 'center').opacity(opacity),
        );
      }
      const val = values[r]?.[k] ?? '';
      const isHi = highlight(r, k);
      const isDim = dim(r, k);
      const col = colors[r]?.[k] ?? (isHi ? ROLE.focus : ROLE.anchor);
      const alpha = (isDim ? 0.25 : 1) * opacity;
      parts.push(
        lumBar(rx, ry, cellW, cellH, {
          color: col,
          fillAlpha: isHi ? 0.34 : 0.16,
          strokeWidth: isHi ? 3 : 1.7,
          glow: isHi ? 9 : 3,
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

/**
 * Reusable orbiting 3D unit hypersphere S^2 wireframe with translucent luminous shell,
 * meridian & latitude rings, equator highlight, and coordinate axes.
 */
export function buildHypersphere3d({
  x = 280,
  y = 20,
  radius = 2.6,
  theta = -0.78,
  phi = 1.06,
  distance = 13.8,
  unit = 112,
  accent = ROLE.anchor,
  showAxes = true,
} = {}) {
  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    ambient: 0.42,
    shine: 0.32,
    brightness: 1.1,
    fog: 0.08,
    focus: [0, 0, 0],
  }).at(x, y);

  // Subtle translucent cosmic sphere shell
  view.add(
    parametricSurface(
      (u, v) => {
        const lat = (v - 0.5) * Math.PI;
        const lon = u * Math.PI * 2;
        return [
          radius * Math.cos(lat) * Math.cos(lon),
          radius * Math.cos(lat) * Math.sin(lon),
          radius * Math.sin(lat),
        ];
      },
      [0, 1],
      [0.04, 0.96],
      {
        resolution: [28, 16],
        color: '#182752',
        opacity: 0.18,
        mesh: '#5ce1e6',
        meshOpacity: 0.11,
        meshWidth: 0.5,
        shaded: true,
      },
    ),
  );

  // Equator glowing ring + 2 latitude parallels
  for (const lat of [-Math.PI / 4, 0, Math.PI / 4]) {
    const isEq = lat === 0;
    const rLat = radius * Math.cos(lat);
    const zLat = radius * Math.sin(lat);
    view.add(
      curve3d(
        (t) => [rLat * Math.cos(t * 2 * Math.PI), rLat * Math.sin(t * 2 * Math.PI), zLat],
        0,
        1,
        {
          color: isEq ? accent : '#4a6499',
          width: isEq ? 2.6 : 1.3,
          opacity: isEq ? 0.68 : 0.32,
          glow: isEq ? 6 : 0,
          blend: 'screen',
          samples: 72,
        },
      ),
    );
  }

  // 4 meridian great circles
  for (let m = 0; m < 4; m++) {
    const lon = (m * Math.PI) / 4;
    view.add(
      curve3d(
        (t) => {
          const a = t * 2 * Math.PI;
          return [
            radius * Math.cos(a) * Math.cos(lon),
            radius * Math.cos(a) * Math.sin(lon),
            radius * Math.sin(a),
          ];
        },
        0,
        1,
        { color: '#455c8f', width: 1.2, opacity: 0.28, samples: 64 },
      ),
    );
  }

  if (showAxes) {
    const axLen = radius * 1.18;
    view.add(
      line3d([-axLen, 0, 0], [axLen, 0, 0], { color: '#475b88', width: 1.5, opacity: 0.45 }),
      line3d([0, -axLen, 0], [0, axLen, 0], { color: '#475b88', width: 1.5, opacity: 0.45 }),
      line3d([0, 0, -axLen], [0, 0, axLen], { color: '#475b88', width: 1.5, opacity: 0.45 }),
      point3d([0, 0, 0], { color: '#ffffff', radius: 4.5, glow: 8, blend: 'screen' }),
    );
  }

  return {
    view,
    radius,
    ptOnSphere: (lon, lat) => [
      radius * Math.cos(lat) * Math.cos(lon),
      radius * Math.cos(lat) * Math.sin(lon),
      radius * Math.sin(lat),
    ],
  };
}

/** Great-circle geodesic arc between two 3D unit points on a sphere of radius R. */
export function sphereGeodesic(
  pA,
  pB,
  radius,
  { color = ROLE.positive, width = 3.2, glow = 9, lift = 1.03 } = {},
) {
  return curve3d(
    (t) => {
      const x = pA[0] * (1 - t) + pB[0] * t;
      const y = pA[1] * (1 - t) + pB[1] * t;
      const z = pA[2] * (1 - t) + pB[2] * t;
      const n = Math.hypot(x, y, z) || 1;
      const r = radius * (1 + (lift - 1) * Math.sin(Math.PI * t));
      return [(x / n) * r, (y / n) * r, (z / n) * r];
    },
    0,
    1,
    { color, width, glow, blend: 'screen', samples: 36, opacity: 0.92, onTop: true },
  );
}

/** Crisp 2D unit-circle dial for contrastive cosine geometry (zero label collisions). */
export function unitCircleDial({
  cx = -320,
  cy = 40,
  radius = 250,
  queryAngle = START,
  dashAngle = null,
  candidates = ANGLES.map((a, i) => ({ angle: a, name: NAMES[i], color: COLORS[i] })),
  showQuery = true,
  labelOffsets,
  opacity = 1,
} = {}) {
  const tip = (a, r = radius) => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  const nodes = [
    markDecoration(aura(cx, cy, radius * 1.45, '#5ce1e61a', '#07091000')),
    circle(radius, { fill: '#0d152a55', stroke: '#465e91', width: 2.6 })
      .at(cx, cy)
      .opacity(opacity),
    circle(radius * 0.5, { fill: null, stroke: '#283659', width: 1.4, dash: [5, 8] })
      .at(cx, cy)
      .opacity(opacity),
    line([cx - radius - 22, cy], [cx + radius + 22, cy], { stroke: '#32436c', width: 1.5 }).opacity(
      opacity,
    ),
    line([cx, cy - radius - 22], [cx, cy + radius + 22], { stroke: '#32436c', width: 1.5 }).opacity(
      opacity,
    ),
  ];

  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    nodes.push(
      line(
        [cx + (radius - 7) * Math.cos(a), cy - (radius - 7) * Math.sin(a)],
        [cx + (radius + 6) * Math.cos(a), cy - (radius + 6) * Math.sin(a)],
        { stroke: '#6d84b8', width: 1.8 },
      ).opacity(0.6 * opacity),
    );
  }

  if (dashAngle !== null) {
    nodes.push(
      line([cx, cy], tip(dashAngle), { stroke: COSMOS.muted, width: 3, dash: [9, 8] }).opacity(
        0.75 * opacity,
      ),
    );
  }

  const defaultOffsets = [
    [22, 24, 'left'],
    [0, -40, 'center'],
    [-22, -26, 'right'],
  ];
  candidates.forEach((cand, i) => {
    const p = tip(cand.angle);
    nodes.push(
      line([cx, cy], p, { stroke: cand.color, width: 3.8 }).glow(7, cand.color).opacity(opacity),
      glowDot(p[0], p[1], { radius: 8, color: cand.color, glow: 12, opacity }),
    );
    if (cand.name) {
      const [dx, dy, anch] = (labelOffsets && labelOffsets[i]) ||
        defaultOffsets[i] || [16, -24, 'left'];
      nodes.push(
        txt(cand.name, p[0] + dx, p[1] + dy, 28, cand.color, 'sans', anch).opacity(opacity),
      );
    }
  });

  if (showQuery) {
    const qp = tip(queryAngle);
    nodes.push(
      glowVector([cx, cy], qp, { color: ROLE.anchor, width: 5.5, tipSize: 19, glow: 11, opacity }),
    );
  }

  nodes.push(glowDot(cx, cy, { radius: 5.5, color: '#ffffff', glow: 10, opacity }));
  return group(...nodes);
}

/** Glowing horizontal ruler with tick marks, zero reference, and named orbs. */
export function glowRuler({
  x = -680,
  y = 0,
  width = 1360,
  min = 0,
  max = 1,
  ticks = [0, 0.2, 0.4, 0.6, 0.8, 1.0],
  formatTick = (v) => v.toFixed(1),
  points = [],
  band = null,
  title = '',
  titleColor = COSMOS.muted,
  opacity = 1,
} = {}) {
  const mapX = (v) => x + ((v - min) / (max - min)) * width;
  const nodes = [];
  if (title) {
    nodes.push(txt(title, x, y - 78, 28, titleColor, 'mono', 'left').opacity(opacity));
  }
  nodes.push(line([x, y], [x + width, y], { stroke: '#4c6294', width: 3.2 }).opacity(opacity));
  if (band) {
    const bx0 = mapX(band.from);
    const bx1 = mapX(band.to);
    nodes.push(
      lumBar((bx0 + bx1) / 2, y, Math.abs(bx1 - bx0), band.height ?? 26, {
        color: band.color ?? ROLE.focus,
        fillAlpha: band.fillAlpha ?? 0.28,
        strokeWidth: 2,
        glow: 8,
        radius: 6,
        opacity,
      }),
    );
    if (band.label) {
      nodes.push(
        txt(
          band.label,
          (bx0 + bx1) / 2,
          y - (band.height ?? 26) / 2 - 34,
          26,
          band.color ?? ROLE.focus,
          'mono',
          'center',
        ).opacity(opacity),
      );
    }
  }
  for (const tVal of ticks) {
    const tx = mapX(tVal);
    nodes.push(
      line([tx, y - 10], [tx, y + 10], { stroke: '#6c82b4', width: 2.2 }).opacity(opacity),
      txt(formatTick(tVal), tx, y + 36, 26, COSMOS.dim, 'mono', 'center').opacity(opacity),
    );
  }
  for (const pt of points) {
    const px = mapX(pt.value);
    const col = pt.color ?? ROLE.anchor;
    nodes.push(
      glowDot(px, y, { radius: pt.radius ?? 10, color: col, glow: 13, opacity }),
      dot(4.5, '#ffffff').at(px, y).opacity(opacity),
    );
    if (pt.label) {
      const ly = pt.below ? y + 74 : y - 42;
      nodes.push(
        txt(
          pt.label,
          px + (pt.dx ?? 0),
          ly + (pt.dy ?? 0),
          28,
          col,
          'sans',
          pt.anchor ?? 'center',
        ).opacity(opacity),
      );
    }
  }
  return { node: group(...nodes), mapX };
}

export {
  Node,
  arc,
  arrow,
  circle,
  curve3d,
  dot,
  group,
  label3d,
  line,
  line3d,
  linear,
  linearGradient,
  parametricSurface,
  point3d,
  points3d,
  polyPath,
  radialGradient,
  rect,
  seq,
};
