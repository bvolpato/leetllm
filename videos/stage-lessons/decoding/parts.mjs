// Shared semantic palette, math invariants, glowing 2D/3D primitives, and cue helpers
// for the 33-scene Decoding Strategies dark-cinema stage film.
import {
  arrow,
  circle,
  dot,
  gridPlane3d,
  group,
  line,
  parametricSurface,
  rect,
  seq,
} from 'vizmatic/stage';
import {
  decodeLengthScore,
  decodeNormalize,
  decodeRepetition,
  decodeSoftmax,
  decodeSupport,
  nucleus,
} from '../../films/decoding/arithmetic.mjs';
import { DRAW_STREAM, categoricalDraws } from '../../films/decoding/construction.mjs';
import {
  BASE,
  BRANCHES,
  LEAVES,
  STATUS_IDS,
  STATUS_ROW,
  WORDS,
} from '../../films/decoding/fixtures.mjs';
import {
  decodingFreshModel,
  drawSnapshot,
  searchTrace,
  transferExperiment,
  treeDistribution,
  truncationState,
  validateDecodingCore,
  validateModel,
} from '../../films/decoding/model.mjs';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowingTrail,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';

export {
  BASE,
  BRANCHES,
  DRAW_STREAM,
  LEAVES,
  STATUS_IDS,
  STATUS_ROW,
  WORDS,
  categoricalDraws,
  decodeLengthScore,
  decodeNormalize,
  decodeRepetition,
  decodeSoftmax,
  decodeSupport,
  decodingFreshModel,
  drawSnapshot,
  nucleus,
  searchTrace,
  transferExperiment,
  treeDistribution,
  truncationState,
  validateDecodingCore,
  validateModel,
};

/** One semantic color per conceptual role across all 33 scenes. */
export const ROLE = Object.freeze({
  winner: COSMOS.gold,
  active: COSMOS.cyan,
  base: COSMOS.blue,
  valid: COSMOS.emerald,
  pruned: COSMOS.rose,
  alt: COSMOS.violet,
  heat: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
  surface: COSMOS.surface,
  surfaceAlt: COSMOS.surfaceAlt,
});

export const STRIP_PALETTE = Object.freeze([
  ROLE.base,
  ROLE.valid,
  ROLE.alt,
  ROLE.active,
  ROLE.heat,
]);

export const ADAPTIVE_ROWS = Object.freeze([
  Object.freeze([0.72, 0.2, 0.05, 0.02, 0.01]),
  Object.freeze([0.4, 0.2, 0.15, 0.115, 0.035, ...Array(10).fill(0.01)]),
]);

export const EVAL_OUTCOMES = Object.freeze([
  Object.freeze([1, 0, 1, 0]),
  Object.freeze([0, 0, 0, 0]),
  Object.freeze([0, 1, 0, 0]),
]);

export const FRESH_NAMES = Object.freeze(['ready', 'waiting', 'paused', 'checking', 'unknown']);
export const FRESH_ROLLOUT = Object.freeze({ time: '10:42', phase: 'paused' });
export const SAMPLER_NAMES = Object.freeze(['degraded', 'in', 'on', 'broken']);
export const SAMPLER_RAW = Object.freeze([2.4, 2.1, 1.2, 0.3]);
export const SAMPLER_SEED0_U = 0.8444218515250481;

export const fmt = (n, digits = 2) => Number(n).toFixed(digits);
export const pct = (n, digits = 0) => `${(Number(n) * 100).toFixed(digits)}%`;
export const pctTrim = (n, digits = 1) => `${Number((Number(n) * 100).toFixed(digits))}%`;

export function shannonEntropyBits(probs) {
  return -probs.reduce((acc, p) => (p > 0 ? acc + p * Math.log2(p) : acc), 0);
}

/** Verify every mathematical invariant used across all 33 scenes at build time. */
export function verifyDecodingModel() {
  verifyInvariant(validateModel() === true, 'films/decoding/model.mjs validateModel()');

  // Dog tree products
  verifyApprox(0.6 * 0.7, 0.42, 1e-12, 'ran home initial product');
  verifyApprox(0.4 * 0.9, 0.36, 1e-12, 'slept soundly product');
  verifyApprox(0.6 * 0.35, 0.21, 1e-12, 'ran home / ran outside split product');

  // Status model and EOS completion
  verifyApprox(0.45 * 0.4, 0.18, 1e-12, 'degraded period prefix');
  verifyApprox(0.3 * 0.9, 0.27, 1e-12, 'in recovery prefix');
  verifyApprox(0.18 * 0.9, 0.162, 1e-12, 'degraded period EOS product');
  verifyApprox(0.27 * 0.5, 0.135, 1e-12, 'in recovery EOS product');

  // Pruned prefix & per-parent top-B shortcut
  verifyApprox(0.45 / 10, 0.045, 1e-12, 'degraded 10-way split child');
  verifyApprox(0.15 * 1.0, 0.15, 1e-12, 'pruned on track product');
  verifyApprox(0.45 * 0.5, 0.225, 1e-12, 'parent 0 top child');
  verifyApprox(0.3 * 0.7, 0.21, 1e-12, 'parent 1 top child');

  // GNMT length normalization and normalized stop
  verifyApprox(decodeLengthScore(-1, 2, 0.6), -0.9117, 0.0002, 'GNMT S score');
  verifyApprox(decodeLengthScore(-1.08, 5, 0.6), -0.7949, 0.0002, 'GNMT L score');
  verifyApprox(
    decodeLengthScore(-1 + Math.log(0.99), 2, 0.6),
    -0.9209,
    0.0005,
    'normalized stop improvement',
  );

  // Search quality batch cost
  verifyInvariant(8 * 50000 === 400000, 'beam width 8 x 50k vocab = 400k continuations');

  // Temperature scaling, odds, and tail mass
  const baseLogits = BASE.map(Math.log);
  const t1Row = decodeSoftmax(baseLogits, 1);
  const t2Row = decodeSoftmax(baseLogits, 2);
  verifyInvariant(t1Row[0] > 0.4, 'T=1 ran contains 0.40');
  verifyInvariant(t2Row[0] < 0.4 && t2Row[0] + t2Row[1] > 0.4, 'T=2 slept contains 0.40');
  verifyApprox(Math.exp(2 / 1), 7.389, 0.002, 'odds gap 2 at T=1');
  verifyApprox(Math.exp(2 / 0.5), 54.598, 0.002, 'odds gap 2 at T=0.5');
  verifyApprox(Math.exp(2 / 1.5), 3.794, 0.002, 'odds gap 2 at T=1.5');

  const statusLogits = STATUS_ROW.map(Math.log);
  const statusCold = decodeSoftmax(statusLogits, 0.3);
  const statusHot = decodeSoftmax(statusLogits, 1.5);
  verifyApprox(statusCold[0], 0.7785, 0.001, 'status T=0.3 degraded');
  verifyApprox(
    statusHot.slice(4).reduce((a, b) => a + b, 0),
    0.2107,
    0.001,
    'status T=1.5 8-token tail',
  );
  const groupedFirst = [...STATUS_ROW.slice(0, 4), STATUS_ROW.slice(4).reduce((a, b) => a + b, 0)];
  const wrongTail = decodeSoftmax(groupedFirst.map(Math.log), 1.5).at(-1);
  verifyApprox(wrongTail, 0.11773, 0.0001, 'merged-first wrong tail');
  verifyApprox(shannonEntropyBits(statusCold), 0.86, 0.02, 'status T=0.3 entropy');
  verifyApprox(shannonEntropyBits(STATUS_ROW), 2.09, 0.02, 'status T=1.0 entropy');
  verifyApprox(shannonEntropyBits(statusHot), 2.75, 0.02, 'status T=1.5 entropy');

  // Adaptive support
  verifyInvariant(decodeSupport(ADAPTIVE_ROWS[0], 'p', 0.9).ids.length === 2, 'peaked top-p=0.9');
  verifyInvariant(decodeSupport(ADAPTIVE_ROWS[1], 'p', 0.9).ids.length === 5, 'flat top-p=0.9');
  verifyInvariant(decodeSupport(ADAPTIVE_ROWS[0], 'min', 0.1).ids.length === 2, 'peaked min-p');
  verifyInvariant(decodeSupport(ADAPTIVE_ROWS[1], 'min', 0.1).ids.length === 4, 'flat min-p');

  // Min-p relative and uniform counterexample
  verifyApprox(0.1 * 0.8, 0.08, 1e-12, 'min-p peak floor');
  verifyApprox(0.1 * 0.05, 0.005, 1e-12, 'min-p flat floor');
  verifyInvariant(
    [0, -2, -4].filter((z) => z >= Math.log(0.1)).length === 2,
    'min-p logit floor T=1 keeps 2',
  );
  verifyInvariant(
    [0, -2, -4].filter((z) => z >= 2 * Math.log(0.1)).length === 3,
    'min-p logit floor T=2 keeps 3',
  );
  verifyInvariant(
    decodeSupport(Array(8).fill(1), 'min', 0.1).ids.length === 8,
    'uniform 8 min-p keeps 8',
  );
  verifyInvariant(
    decodeSupport(Array(8).fill(1), 'p', 0.75).ids.length === 6,
    'uniform 8 top-p 0.75 keeps 6',
  );

  // Centering order probability rise & count penalties
  const pBefore = decodeSoftmax([2, 10, 0]);
  const pAfter = decodeSoftmax(decodeRepetition([2, 10, 0], [0, 1], 2));
  verifyApprox(pBefore[0], 0.000335, 0.00001, 'seen A probability before');
  verifyApprox(pAfter[0], 0.017868, 0.0001, 'seen A probability after');

  const countOut = [2.4, 2.1, 1.2].map(
    (z, i) => z - [3, 1, 0][i] * 0.4 - ([3, 1, 0][i] > 0 ? 0.2 : 0),
  );
  verifyApprox(countOut[0], 1.0, 1e-12, 'count penalty token 0');
  verifyApprox(countOut[1], 1.5, 1e-12, 'count penalty token 1');
  verifyApprox(countOut[2], 1.2, 1e-12, 'count penalty token 2');

  // Ordered filters & hot status nucleus
  verifyInvariant(decodeSupport(STATUS_ROW, 'p', 0.9).ids.length === 3, 'status T=1 top-p=0.9');
  verifyInvariant(decodeSupport(statusHot, 'p', 0.9).ids.length === 9, 'status T=1.5 top-p=0.9');

  // Grammar first
  const gRow = [0.6, 0.3, 0.1];
  verifyInvariant(
    !decodeSupport(gRow, 'p', 0.8).ids.includes(2),
    'cutoff-first drops sole legal token 2',
  );
  const gLegal = decodeNormalize([0, 0, 0.1]);
  verifyApprox(gLegal[2], 1.0, 1e-12, 'grammar-first keeps token 2 at 1.0');

  // Actual sampler trace
  const sLogits = decodeRepetition(SAMPLER_RAW, [0], 1.2);
  const sProbs = decodeSoftmax(sLogits);
  const sSup = decodeSupport(sProbs, 'p', 0.9);
  verifyApprox(sSup.mass, 0.933, 0.002, 'actual sampler retained mass');
  const firstTwoCdf = sSup.values[sSup.ids[0]] + sSup.values[sSup.ids[1]];
  verifyApprox(firstTwoCdf, 0.824, 0.002, 'actual sampler first two CDF');
  verifyInvariant(SAMPLER_SEED0_U > firstTwoCdf, 'seed 0 draw lands in third token on');

  // Evaluation protocol
  verifyInvariant(EVAL_OUTCOMES.flat().filter(Boolean).length === 3, '3 of 12 drafts correct');
  verifyInvariant(
    EVAL_OUTCOMES.filter((r) => r.some(Boolean)).length === 2,
    '2 of 3 prompts have any correct draft',
  );
}

/** Clamp a play duration so an animation never runs past the scene's narration. */
export function safeDur(c, startTime, desired = 0.7, margin = 0.46) {
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
  { after = false, offset = 0, dur = 0.7, margin = 0.46 } = {},
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
export function swapVis(outVal, inVal, d = 0.56) {
  const half = Math.max(0.12, d * 0.46);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

/** Smooth quadratic Bezier polyline points between two 2D points with perpendicular lift. */
export function arcPts(p0, p1, lift = 0, steps = 26) {
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

/** Smooth cubic S-curve between two horizontal branch endpoints (for glowing probability trees). */
export function branchPts(p0, p1, steps = 28) {
  const dx = (p1[0] - p0[0]) * 0.48;
  const c1x = p0[0] + dx;
  const c1y = p0[1];
  const c2x = p1[0] - dx;
  const c2y = p1[1];
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * u * p0[0] + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * p1[0],
      u * u * u * p0[1] + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * p1[1],
    ]);
  }
  return pts;
}

/** Ambient multi-aura cosmic atmosphere pinned behind scene geometry. */
export function cinemaAtmosphere(primary = ROLE.active, secondary = ROLE.winner) {
  return group(
    aura(-540, -240, 560, `${primary}24`, '#07091000'),
    aura(480, 150, 620, `${secondary}20`, '#07091000'),
    aura(0, 20, 740, '#22336624', '#07091000'),
  ).zIndex(-80);
}

/** Luminous translucent bar with crisp glowing border (for data bars, strips, gauges). */
export function lumBar(
  x,
  y,
  w,
  h,
  {
    color = ROLE.base,
    fillOpacity = 0.28,
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

/** Luminous circular ring beacon. */
export function glowRing(
  x,
  y,
  radius,
  color,
  { width = 3.2, glow = 10, fillOpacity = 0.14, opacity = 1 } = {},
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

/** Glowing vector arrow with tip photon. */
export function glowVector(
  origin,
  tip,
  { color = ROLE.winner, width = 4.2, tipSize = 16, glow = 10, opacity = 1, dotRadius = 5 } = {},
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

/**
 * Full-bleed luminous probability distribution strip with evenly slotted external labels
 * linked by fine luminous leaders so even thin 5% tail slices never collide.
 */
export function probStrip({
  left = -760,
  y = 50,
  width = 1520,
  height = 68,
  values = [],
  names = [],
  kept = null,
  colors = STRIP_PALETTE,
  showLabels = true,
  showPct = true,
  markerU = null,
  markerLabel = '',
  markerColor = ROLE.winner,
  labelOffsetY = 124,
  pctOffsetY = 166,
  opacity = 1,
} = {}) {
  const nodes = [];
  // Subtle luminous rail under the strip
  nodes.push(
    lumBar(left + width / 2, y, width, height, {
      color: '#344775',
      fillOpacity: 0.12,
      strokeWidth: 2,
      glow: 3,
      radius: 10,
      opacity,
    }),
  );

  const count = values.length;
  const slotW = count > 0 ? width / count : width;
  let cursor = left;

  values.forEach((v, i) => {
    const segW = Math.max(0, v) * width;
    const isKept = !kept || kept.includes(i);
    const col = isKept ? colors[i % colors.length] : COSMOS.dim;
    const cx = cursor + segW / 2;
    const slotX = left + slotW * (i + 0.5);

    if (segW > 3) {
      nodes.push(
        lumBar(cx, y, Math.max(4, segW - 4), height - 6, {
          color: col,
          fillOpacity: isKept ? 0.46 : 0.14,
          strokeWidth: isKept ? 2.6 : 1.6,
          glow: isKept ? 10 : 2,
          radius: 6,
          opacity,
        }),
      );
      if (showLabels) {
        nodes.push(
          line([cx, y + height / 2 + 6], [slotX, y + labelOffsetY - 28], {
            stroke: col,
            width: 2,
          }).opacity(0.65 * opacity),
        );
      }
    }

    if (showLabels && names[i] !== undefined) {
      const lblCol = segW > 0 && isKept ? col : COSMOS.dim;
      nodes.push(
        txt(names[i], slotX, y + labelOffsetY, 30, lblCol, 'serif', 'center').opacity(opacity),
      );
      if (showPct) {
        nodes.push(
          txt(
            v > 0 ? pctTrim(v, 1) : '0%',
            slotX,
            y + pctOffsetY,
            26,
            segW > 0 && isKept ? COSMOS.ink : COSMOS.dim,
            'mono',
            'center',
          ).opacity(opacity),
        );
      }
    }
    cursor += segW;
  });

  if (markerU !== null && markerU !== undefined) {
    const mx = left + Math.max(0, Math.min(1, markerU)) * width;
    nodes.push(
      glowVector([mx, y - height / 2 - 58], [mx, y - height / 2 - 8], {
        color: markerColor,
        width: 4.5,
        tipSize: 15,
        glow: 12,
        opacity,
      }),
      line([mx, y - height / 2], [mx, y + height / 2], {
        stroke: markerColor,
        width: 3.4,
        dash: [6, 5],
      })
        .glow(8, markerColor)
        .opacity(opacity),
    );
    if (markerLabel) {
      nodes.push(
        txt(markerLabel, mx, y - height / 2 - 86, 28, markerColor, 'mono', 'center')
          .glow(8, markerColor)
          .opacity(opacity),
      );
    }
  }

  return group(...nodes);
}

/**
 * Signature glowing branching probability tree for the two-word "The dog ..." scenes.
 * Pure dark-cinema Bezier trails, glowing orbital nodes, and right-aligned product bars.
 */
export function glowDogTree({
  values = [0.3, 0.35, 0.35, 0.9, 0.1],
  expanded = [],
  scores = [],
  selected = [],
  pruned = [],
  kept = [],
  cover = false,
  note = '',
  noteColor = COSMOS.ink,
  alpha = 1,
} = {}) {
  const leaves = BRANCHES.flatMap((b) => b.next);
  const rootPos = [-740, 20];
  const midX = -375;
  const midYs = [-130, 175];
  const leafX = 25;
  const leafYs = [-235, -130, -25, 130, 235];
  const barX = 335;
  const barMaxW = 345;
  const valX = 720;

  const nodes = [];

  // Column eyebrow captions cleanly above geometry
  nodes.push(
    txt('First word', midX, -320, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
    txt('Second word | first', leafX, -320, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
  );
  if (expanded.length > 0) {
    nodes.push(
      txt(
        'Two-word probability',
        barX + barMaxW / 2,
        -320,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );
  }

  // Glowing root orbital pill "The dog"
  nodes.push(
    lumBar(rootPos[0], rootPos[1], 196, 76, {
      color: ROLE.active,
      fillOpacity: 0.18,
      strokeWidth: 3.0,
      glow: 12,
      radius: 38,
      opacity: alpha,
    }),
    txt('The dog', rootPos[0], rootPos[1], 32, COSMOS.ink, 'serif', 'center')
      .glow(5, ROLE.active)
      .opacity(alpha),
  );

  // First-step branches ("ran 0.60", "slept 0.40")
  BRANCHES.forEach((branch, bi) => {
    const isPruned = pruned.includes(bi);
    const isKept = kept.includes(bi);
    const col = isPruned ? ROLE.pruned : isKept ? ROLE.winner : bi === 0 ? ROLE.base : ROLE.valid;
    const branchAlpha = isPruned ? 0.36 * alpha : alpha;
    const target = [midX - 96, midYs[bi]];

    nodes.push(
      glowingTrail(branchPts([rootPos[0] + 100, rootPos[1]], target), {
        color: col,
        width: isKept ? 5.0 : 3.6,
        glow: isPruned ? 2 : 10,
        opacity: branchAlpha,
      }),
      lumBar(midX, midYs[bi], 190, 66, {
        color: col,
        fillOpacity: isKept ? 0.34 : 0.18,
        strokeWidth: isKept ? 3.2 : 2.2,
        glow: isPruned ? 2 : 10,
        radius: 33,
        opacity: branchAlpha,
      }),
      txt(
        `${branch.word} ${fmt(branch.p, 2)}`,
        midX,
        midYs[bi],
        28,
        isPruned ? COSMOS.muted : COSMOS.ink,
        'mono',
        'center',
      ).opacity(branchAlpha),
    );

    // Optional covered "?" branch placeholder before expansion
    const hasChild = expanded.some((idx) => (idx < 3 ? 0 : 1) === bi);
    if (cover && !isPruned && !hasChild) {
      const covTarget = [leafX - 88, midYs[bi]];
      nodes.push(
        glowingTrail(branchPts([midX + 96, midYs[bi]], covTarget), {
          color: COSMOS.dim,
          width: 2.6,
          glow: 3,
          core: false,
          opacity: 0.65 * alpha,
        }),
        glowRing(leafX, midYs[bi], 34, COSMOS.dim, {
          width: 2.2,
          glow: 4,
          fillOpacity: 0.1,
          opacity: 0.8 * alpha,
        }),
        txt('?', leafX, midYs[bi], 32, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
    }
  });

  // Second-step leaves + product bars
  expanded.forEach((li) => {
    const bi = li < 3 ? 0 : 1;
    const parentP = BRANCHES[bi].p;
    const condP = values[li];
    const prod = parentP * condP;
    const isPruned = pruned.includes(bi);
    const isSelected = selected.includes(li);
    const col = isSelected
      ? ROLE.winner
      : isPruned
        ? ROLE.pruned
        : bi === 0
          ? ROLE.active
          : ROLE.valid;
    const rowAlpha = isPruned ? 0.34 * alpha : alpha;
    const ly = leafYs[li];

    nodes.push(
      glowingTrail(branchPts([midX + 96, midYs[bi]], [leafX - 115, ly]), {
        color: col,
        width: isSelected ? 4.8 : 3.0,
        glow: isSelected ? 13 : isPruned ? 2 : 7,
        opacity: rowAlpha,
      }),
      lumBar(leafX, ly, 230, 56, {
        color: col,
        fillOpacity: isSelected ? 0.36 : 0.16,
        strokeWidth: isSelected ? 3.0 : 2.0,
        glow: isSelected ? 12 : isPruned ? 2 : 6,
        radius: 28,
        opacity: rowAlpha,
      }),
      txt(
        `${leaves[li][0]} ${fmt(condP, 2)}`,
        leafX,
        ly,
        26,
        isSelected ? ROLE.winner : COSMOS.ink,
        'mono',
        'center',
      ).opacity(rowAlpha),
    );

    if (scores.includes(li)) {
      const w = Math.max(8, (prod / 0.45) * barMaxW);
      nodes.push(
        lumBar(barX + barMaxW / 2, ly, barMaxW, 30, {
          color: '#2b395e',
          fillOpacity: 0.18,
          strokeWidth: 1.4,
          glow: 2,
          radius: 6,
          opacity: rowAlpha,
        }),
        lumBar(barX + w / 2, ly, w, 28, {
          color: col,
          fillOpacity: isSelected ? 0.65 : 0.42,
          strokeWidth: isSelected ? 2.8 : 2.0,
          glow: isSelected ? 12 : 6,
          radius: 6,
          opacity: rowAlpha,
        }),
        txt(
          fmt(prod, 3),
          valX,
          ly,
          30,
          isSelected ? ROLE.winner : COSMOS.ink,
          'mono',
          'left',
        ).opacity(rowAlpha),
      );
    } else {
      nodes.push(
        txt(
          `${fmt(parentP, 2)} × ${fmt(condP, 2)} = ?`,
          barX + barMaxW / 2 + 40,
          ly,
          28,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(rowAlpha),
      );
    }
  });

  if (note) {
    nodes.push(
      txt(note, 0, 390, 34, noteColor, 'serif', 'center').glow(6, noteColor).opacity(alpha),
    );
  }

  return group(...nodes);
}

/**
 * Orbiting 3D probability-vs-temperature surface using cinematic3d + parametricSurface.
 * u in [0, 1] maps across token rank (0..4), v in [0, 1] maps temperature T in [0.4, 2.2].
 */
export function buildTempLandscape3d({ x = 440, y = -10, unit = 82, activeTempVal = null } = {}) {
  const baseLogits = BASE.map(Math.log);
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 15.8,
    unit,
    focus: [0, 0, 0.75],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-2.6, 2.6],
    y: [-2.4, 2.4],
    z: 0,
    step: 1,
    color: '#2b3d69',
    opacity: 0.42,
  });

  const surf = parametricSurface(
    (u, v) => {
      const T = 0.4 + v * 1.8;
      const probs = decodeSoftmax(baseLogits, T);
      const pos = u * (probs.length - 1);
      const i0 = Math.floor(pos);
      const i1 = Math.min(probs.length - 1, i0 + 1);
      const frac = pos - i0;
      const p = probs[i0] * (1 - frac) + probs[i1] * frac;
      const pulse = activeTempVal && Math.abs(T - activeTempVal.value) < 0.16 ? 0.18 : 0;
      return [(u - 0.5) * 4.8, (v - 0.5) * 4.4, p * 3.1 + pulse];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [18, 18],
      colors: ['#162140', ROLE.base, ROLE.active, ROLE.valid, ROLE.winner],
      opacity: 0.88,
      mesh: '#ffffff',
      meshOpacity: 0.16,
      meshWidth: 0.75,
      animate: Boolean(activeTempVal),
    },
  );

  view.add(floor, surf);
  return view;
}

/**
 * Orbiting 3D GNMT length-normalization surface: score(-1.08, L, alpha) across length L in [1..8]
 * and exponent alpha in [0..1].
 */
export function buildLengthSurface3d({ x = 450, y = 20, unit = 84 } = {}) {
  const view = cinematic3d({
    theta: -0.82,
    phi: 1.05,
    distance: 15.8,
    unit,
    focus: [0, 0, 0.75],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-2.6, 2.6],
    y: [-2.4, 2.4],
    z: 0,
    step: 1,
    color: '#2b3d69',
    opacity: 0.42,
  });

  const surf = parametricSurface(
    (u, v) => {
      const length = 1 + u * 7;
      const alpha = v;
      const factor = Math.pow((5 + length) / 6, alpha);
      // Higher relief where length penalty lifts score (normalized relief proportional to factor - 1)
      const z = 0.25 + (factor - 1) * 2.1;
      return [(u - 0.5) * 4.8, (v - 0.5) * 4.4, z];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [18, 18],
      colors: ['#162140', ROLE.base, ROLE.active, ROLE.valid, ROLE.winner],
      opacity: 0.86,
      mesh: '#ffffff',
      meshOpacity: 0.16,
      meshWidth: 0.75,
    },
  );

  view.add(floor, surf);
  return view;
}
