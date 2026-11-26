// Shared math models, invariants, color semantics, and 3D/vector cinema helpers for gpu-primitives.
import {
  Node,
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
  parametricSurface,
  points3d,
  polyPath,
  radialGradient,
  rect,
  surface,
} from 'vizmatic/stage';
import {
  A,
  B,
  R,
  blellochTrace,
  exclusive,
  f,
  hierarchyCounts,
  onlineSoftmax,
  reductionLevels,
  scanLevels,
  scanWork,
  shuffleLevels,
  shuffleRead,
} from '../../films/gpu-primitives/arithmetic.mjs';
import {
  ALL,
  ARTICLE_INPUT,
  ARTICLE_PREFIX,
  ATTENTION,
  BLELLOCH,
  FIRST,
  INPUT,
  LEFT,
  ODD_ROW,
  REDUCTION,
  RIGHT,
  SCAN,
  SHUFFLE,
  SWAPPED_ROW,
} from '../../films/gpu-primitives/fixtures.mjs';
import {
  freshPrefixSnapshot,
  onlineRescale,
  scanTeachingSnapshot,
} from '../../films/gpu-primitives/model.mjs';
import { boundaries, number, signed } from '../../films/gpu-primitives/score-trace.mjs';
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

export const ARTICLE_INCLUSIVE = Object.freeze(ARTICLE_INPUT.map((v, i) => ARTICLE_PREFIX[i] + v));
export const ARTICLE_SCORES = Object.freeze(boundaries(ARTICLE_INPUT));
export const ODD_SCORES = Object.freeze(boundaries(ODD_ROW));
export const SWAPPED_SCORES = Object.freeze(boundaries(SWAPPED_ROW));
export const ZERO_FIRST_BLOCK = Object.freeze(ARTICLE_INPUT.map((v, i) => (i === 3 ? -6 : v)));

export const GRID_N = 4194304;
export const GRID_HIERARCHY = Object.freeze([GRID_N, ...hierarchyCounts(GRID_N)]);
export const RECURSION_262144 = Object.freeze([262144, ...hierarchyCounts(262144)]);
export const RECURSION_262145 = Object.freeze([262145, ...hierarchyCounts(262145)]);

export const SCAN_WORK_32 = Object.freeze(scanWork(32));
export const SCAN_WORK_512 = Object.freeze(scanWork(512));

export const LOOKBACK_RECORDS = Object.freeze([7, 4, 3, 2]);
export const LOOKBACK_RUNNING = Object.freeze([2, 5, 9, 16]);
export const LOOKBACK_OFFSET = LOOKBACK_RUNNING[3] - LOOKBACK_RECORDS[3];

export const KEEP_FLAGS = Object.freeze(ARTICLE_INPUT.map((v) => Number(v > 0)));
export const KEEP_ADDR = Object.freeze(exclusive(KEEP_FLAGS));
export const COMPACTED_POS = Object.freeze(ARTICLE_INPUT.filter((v) => v > 0));
export const SEGMENT_SUMS = Object.freeze([
  ARTICLE_INPUT.slice(0, 4).reduce((a, b) => a + b, 0),
  0,
  ARTICLE_INPUT.slice(4).reduce((a, b) => a + b, 0),
]);

export const SOFTMAX_LOGITS = Object.freeze([2, 1, 4, 0]);
export const SOFTMAX_PROBS = Object.freeze(
  SOFTMAX_LOGITS.map((x) => Math.exp(x - ALL.maximum) / ALL.denominator),
);
export const SOFTMAX_RESCALE_FINAL = Object.freeze(onlineRescale(1));

export const FP32_1E8_LOST = f(f(f(1e8) + 1) + f(-1e8));
export const FP32_1E8_EXACT = f(f(f(1e8) + f(-1e8)) + 1);

/** Build-time mathematical verification of every core identity in the gpu-primitives lesson. */
export function verifyGpuPrimitivesInvariants() {
  // Pairwise reduction & prefixes
  verifyInvariant(REDUCTION[0].length === 8, '8 input plays');
  verifyInvariant(REDUCTION[1].join(',') === '2,5,-4,8', 'reduction level 1');
  verifyInvariant(REDUCTION[2].join(',') === '7,4', 'reduction level 2');
  verifyInvariant(REDUCTION[3][0] === 11, 'reduction root is 11');
  verifyInvariant(ARTICLE_PREFIX.join(',') === '0,3,2,6,7,12,3,5', 'exclusive prefix');
  verifyInvariant(ARTICLE_INCLUSIVE.join(',') === '3,2,6,7,12,3,5,11', 'inclusive prefix');
  verifyInvariant(
    ARTICLE_SCORES[4] === 7 && ARTICLE_SCORES[5] === 12,
    'score before penalty is 12',
  );
  verifyInvariant(ARTICLE_SCORES[6] === 3 && ARTICLE_SCORES[8] === 11, 'score after penalty is 3');

  // Warp shuffles & absent source
  verifyInvariant(
    SHUFFLE.at(-1).every((v) => v === 11),
    'XOR shuffle broadcasts 11',
  );
  verifyInvariant(
    shuffleRead(INPUT, 6, 1, new Set([0, 1, 2, 3, 4, 5, 6])) === undefined,
    'exited lane 7 makes lane 6 read undefined',
  );
  verifyInvariant(
    shuffleRead(INPUT, 6, 1, new Set([0, 1, 2, 3, 4, 5, 6, 7])) === 6,
    'live lane 7 supplies 6',
  );

  // Grid hierarchy & recursion boundaries
  verifyInvariant(GRID_HIERARCHY.join(',') === '4194304,8192,16,1', '4M grid hierarchy');
  verifyInvariant(RECURSION_262144.join(',') === '262144,512,1', '512^2 fits 1 metadata tile');
  verifyInvariant(RECURSION_262145.join(',') === '262145,513,2,1', '512^2 + 1 adds a level');

  // Floating-point non-associativity & int64 overflow
  verifyApprox(LEFT, 3.14, 1e-5, 'FP32 (1e20 - 1e20) + 3.14');
  verifyInvariant(RIGHT === 0, 'FP32 1e20 + (-1e20 + 3.14) === 0');
  verifyInvariant(FP32_1E8_LOST === 0, 'FP32 (1e8 + 1) - 1e8 === 0');
  verifyInvariant(FP32_1E8_EXACT === 1, 'FP32 (1e8 - 1e8) + 1 === 1');
  verifyInvariant(2n ** 63n - 1n + 1n === 2n ** 63n, 'signed int64 MAX + 1 overflows');

  // Hillis-Steele & Blelloch scans
  verifyInvariant(SCAN.levels[1].join(',') === '3,2,3,5', 'Hillis-Steele stride 1');
  verifyInvariant(SCAN.levels[2].join(',') === '3,2,6,7', 'Hillis-Steele stride 2');
  verifyInvariant(SCAN.additions === 5, '4-lane Hillis-Steele uses 5 additions');
  verifyInvariant(BLELLOCH.total === 7, 'Blelloch 4-play block total is 7');
  verifyInvariant(BLELLOCH.states.at(-1).values.join(',') === '0,3,2,6', 'Blelloch exclusive');
  verifyInvariant(SCAN_WORK_32.hillis === 129 && SCAN_WORK_32.blelloch === 62, 'N=32 scan work');
  verifyInvariant(SCAN_WORK_512.hillis === 4097 && SCAN_WORK_512.blelloch === 1022, 'N=512 work');
  verifyInvariant(
    scanTeachingSnapshot(1, 0.43).round1 === 1 && scanTeachingSnapshot(1, 0.94).round2 === 1,
    'scan teaching snapshot stages',
  );

  // Decoupled look-back & selection contracts
  verifyInvariant(LOOKBACK_RUNNING[3] === 16 && LOOKBACK_OFFSET === 14, 'lookback 16 / offset 14');
  verifyInvariant(KEEP_ADDR.join(',') === '0,1,1,2,3,4,4,5', 'compaction addresses');
  verifyInvariant(COMPACTED_POS.join(',') === '3,4,1,5,2,6', 'compacted positive plays');
  verifyInvariant(SEGMENT_SUMS.join(',') === '7,0,4', 'segmented sums with empty group');

  // Online softmax & attention accumulator
  verifyInvariant(FIRST.maximum === 2 && ALL.maximum === 4, 'online softmax maxima');
  verifyApprox(FIRST.denominator, 1 + Math.exp(-1), 1e-12, 'first chunk denominator');
  verifyApprox(
    SOFTMAX_RESCALE_FINAL.oldContribution + SOFTMAX_RESCALE_FINAL.newContribution,
    ALL.denominator,
    1e-12,
    'rescaled online denominator matches dense',
  );
  verifyApprox(ALL.denominator, 1.203419, 1e-4, 'combined denominator ~1.203');
  verifyApprox(SOFTMAX_PROBS[0], 0.112457, 1e-4, 'first softmax prob ~11.2%');
  verifyApprox(
    SOFTMAX_PROBS.reduce((a, b) => a + b, 0),
    1.0,
    1e-12,
    'softmax probs sum to 1',
  );
  verifyApprox(ATTENTION.output[0], 0.15382791, 1e-6, 'attention horizontal output ~15.4%');
  verifyApprox(ATTENTION.output[1], 0.84617209, 1e-6, 'attention vertical output ~84.6%');

  // Transfer & fresh odd row
  verifyInvariant(
    ZERO_FIRST_BLOCK.slice(0, 4).reduce((a, b) => a + b, 0) === 0,
    'zero-sum first block masks missing offset',
  );
  verifyInvariant(ODD_SCORES.join(',') === '0,2,-1,4,5,3,7,13', 'odd row boundaries');
  verifyInvariant(SWAPPED_SCORES.join(',') === '0,2,-1,4,8,6,7,13', 'swapped row boundaries');
  verifyInvariant(freshPrefixSnapshot(0, 0.99).output === null, 'fresh output withheld in beat 0');
  verifyInvariant(freshPrefixSnapshot(1, 0.9).total === 13, 'fresh total is 13');
}

/** Safe duration inside a scene window so an animation never outruns narration. */
export function safeDuration(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

/** Safe duration from a specific cue start to the scene end. */
export function remainDuration(c, cueId, maxDur = 1.6, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.22, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

/** Schedule a continuous ambient phase animation across the whole scene. */
export function runPhase(s, c, phaseVal, target = 12, startOffset = 0.08) {
  const dur = safeDuration(c, startOffset, 0.55);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/**
 * Clean P5-safe swap between two dynamic visibility Values:
 * drops `fromVal` to 0 before raising `toVal` to 1 so text never cross-fades at >= 25% opacity.
 */
export function swapViews(s, fromVal, toVal, fadeOut = 0.16, fadeIn = 0.22) {
  s.play(
    par(
      fromVal.to(0, { duration: fadeOut }),
      delay(toVal.to(1, { duration: fadeIn }), fadeOut + 0.04),
    ),
  );
}

/** Clean translucent dark-glass hardware cell (zero slide chrome). */
export function glassCell(
  x,
  y,
  w,
  h,
  strokeColor = COSMOS.cyan,
  { fill = '#0d1426', radius = 10, glow = 6, opacity = 0.94, dash, width = 2.2 } = {},
) {
  const r = rect(w, h, { fill, stroke: strokeColor, width, radius, dash })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) r.glow(glow, strokeColor);
  return r;
}

/** Smooth 2D quadratic Bezier curve sampled as a glowingTrail. */
export function glowingArc(p0, p1, liftY, opts = {}) {
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

/** Evaluate point along a 2D quadratic Bezier curve at parameter t in [0, 1]. */
export function evalArc2d(p0, p1, liftY, t) {
  const mx = (p0[0] + p1[0]) * 0.5;
  const my = (p0[1] + p1[1]) * 0.5 + liftY;
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
    u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
  ];
}

/** Shaded 3D rectangular prism for hardware register cubes, memory banks, and tiles. */
export function box3d(x0, y0, z0, dx, dy, dz, fillColor, edgeColor, opacity = 0.72) {
  const opts = { resolution: [1, 1], color: fillColor, opacity, mesh: false, shaded: true };
  const edges = wireframeSlab3d(
    [x0 + dx * 0.5, y0 + dy * 0.5, z0 + dz * 0.5],
    dx * 0.5,
    dy * 0.5,
    dz * 0.5,
    {
      color: edgeColor,
      width: 2.0,
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

/** Shaded glowing 3D silicon tier slab (for SM / shared memory / HBM hardware tiers). */
export function siliconSlab3d(
  halfX,
  halfY,
  zTop,
  thickness,
  fillColor,
  edgeColor,
  meshColor,
  opacity = 0.58,
) {
  const zBot = zTop - thickness;
  const topFace = parametricSurface(
    (u, v) => [(u * 2 - 1) * halfX, (v * 2 - 1) * halfY, zTop],
    [0, 1],
    [0, 1],
    {
      resolution: [8, 6],
      color: fillColor,
      mesh: meshColor,
      meshOpacity: 0.28,
      meshWidth: 0.65,
      opacity,
      shaded: true,
    },
  );
  const frontFace = parametricSurface(
    (u, v) => [(u * 2 - 1) * halfX, -halfY, zBot + v * thickness],
    [0, 1],
    [0, 1],
    { resolution: [6, 2], color: fillColor, mesh: false, opacity: opacity * 0.75, shaded: true },
  );
  const rightFace = parametricSurface(
    (u, v) => [halfX, (u * 2 - 1) * halfY, zBot + v * thickness],
    [0, 1],
    [0, 1],
    { resolution: [6, 2], color: fillColor, mesh: false, opacity: opacity * 0.62, shaded: true },
  );
  const edges = wireframeSlab3d([0, 0, zTop - thickness * 0.5], halfX, halfY, thickness * 0.5, {
    color: edgeColor,
    width: 2.6,
    glow: 7,
  });
  return [topFace, frontFace, rightFace, ...edges];
}

/** Smooth quadratic Bezier arc in 3D space with evaluator for traveling photons. */
export function bezier3d(a, b, lift, color, width = 3.0) {
  const mid = [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, Math.max(a[2], b[2]) + lift];
  const evalAt = (t) => {
    const u = 1 - t;
    return [
      u * u * a[0] + 2 * u * t * mid[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * mid[1] + t * t * b[1],
      u * u * a[2] + 2 * u * t * mid[2] + t * t * b[2],
    ];
  };
  return {
    evalAt,
    node: curve3d(evalAt, 0, 1, {
      color,
      width,
      glow: 8,
      blend: 'screen',
      samples: 30,
      opacity: 0.9,
      onTop: true,
    }),
  };
}

/**
 * Reusable score-trace chart helper (cinema dark-mode version of score-trace.mjs).
 * Draws glowing polyline trace, play chips, subtle horizontal score gridlines, and markers
 * inside a configurable 1920x1080 centered coordinate region.
 */
export function buildScoreTraceNodes({
  row,
  scores,
  x0 = -680,
  stepX = 178,
  zeroY = 175,
  pxPerPoint = 22,
  chipY = -175,
  ticks = [-4, 0, 4, 8, 12],
  markedPlays = [],
  split = false,
  pad = false,
  alpha = 1,
}) {
  const bx = (idx) => x0 + idx * stepX;
  const sy = (val) => zeroY - val * pxPerPoint;
  const nodes = [];

  // Horizontal score gridlines & right-anchored tick labels
  for (const tick of ticks) {
    const ty = sy(tick);
    nodes.push(
      line([bx(0) - 24, ty], [bx(8) + 28, ty], {
        stroke: tick === 0 ? '#4d5d82' : '#1e2842',
        width: tick === 0 ? 2.6 : 1.5,
      }).opacity(alpha),
      txt(number(tick), bx(0) - 42, ty, 26, COSMOS.muted, 'mono', 'right').opacity(alpha),
    );
  }

  // Play chips along the top
  const slots = pad ? [...row, null] : row;
  slots.forEach((val, i) => {
    const cx = bx(i) + stepX * 0.5;
    const isMarked = markedPlays.includes(i);
    const stroke = isMarked ? COSMOS.gold : val === null ? COSMOS.dim : COSMOS.blue;
    const fill = isMarked ? '#261e11' : val === null ? '#0e1320' : '#101a30';
    nodes.push(
      glassCell(cx, chipY, stepX - 24, 68, stroke, {
        fill,
        glow: isMarked ? 9 : 4,
        opacity: (val === null ? 0.65 : 0.94) * alpha,
        dash: val === null ? [6, 5] : undefined,
      }),
      txt(
        val === null ? 'pad 0' : signed(val),
        cx,
        chipY,
        val === null ? 26 : 34,
        isMarked ? COSMOS.gold : val === null ? COSMOS.dim : COSMOS.ink,
        'mono',
      ).opacity(alpha),
    );
  });

  if (split) {
    const sx = bx(4);
    nodes.push(
      line([sx, chipY - 56], [sx, sy(-4) + 22], {
        stroke: COSMOS.gold,
        width: 2.6,
        dash: [8, 6],
      }).opacity(0.8 * alpha),
      txt('BLOCK A', bx(2), chipY - 62, 26, COSMOS.blue, 'mono').opacity(alpha),
      txt('BLOCK B', bx(6), chipY - 62, 26, COSMOS.cyan, 'mono').opacity(alpha),
    );
  }

  return { nodes, bx, sy };
}

/** Sample a partial polyline of `scores` up to fractional `steps` and return a glowingTrail + dots. */
export function tracePolylineNodes(
  scores,
  bx,
  sy,
  {
    start = 0,
    offset = 0,
    steps = scores.length - 1,
    color = COSMOS.blue,
    dots = true,
    width = 5.5,
    alpha = 1,
    glow = 9,
    core = true,
  } = {},
) {
  const limit = Math.max(0, Math.min(steps, scores.length - 1));
  if (limit <= 0.001) return [];
  const pts = [[bx(start), sy(offset + scores[0])]];
  const fullSteps = Math.floor(limit);
  for (let i = 1; i <= fullSteps; i++) {
    pts.push([bx(start + i), sy(offset + scores[i])]);
  }
  const frac = limit - fullSteps;
  if (frac > 0.001 && fullSteps < scores.length - 1) {
    const endScore = scores[fullSteps] + frac * (scores[fullSteps + 1] - scores[fullSteps]);
    pts.push([bx(start + fullSteps + frac), sy(offset + endScore)]);
  }
  const out = [
    glowingTrail(pts, {
      color,
      width,
      opacity: 0.94 * alpha,
      glow,
      core,
    }),
  ];
  if (dots) {
    for (let i = 0; i <= fullSteps; i++) {
      out.push(
        glowDot(bx(start + i), sy(offset + scores[i]), {
          radius: 7,
          color,
          glow: 9,
          opacity: alpha,
        }),
      );
    }
  }
  return out;
}

/** Highlighted circular score beacon + crisp pill-free glowing label on a score trace. */
export function traceBeaconNodes(
  bx,
  sy,
  index,
  score,
  label,
  color,
  { below = false, dx = 0, dy, alpha = 1 } = {},
) {
  const x = bx(index);
  const y = sy(score);
  const ly = dy !== undefined ? y + dy : below ? y + 48 : y - 46;
  return [
    circle(13, { fill: COSMOS.bg, stroke: color, width: 4.2 })
      .at(x, y)
      .glow(10, color)
      .opacity(alpha),
    txt(label, x + dx, ly, 30, color, 'mono')
      .glow(6, color)
      .opacity(alpha),
  ];
}

export {
  A,
  ALL,
  ARTICLE_INPUT,
  ARTICLE_PREFIX,
  ATTENTION,
  B,
  BLELLOCH,
  COSMOS,
  FIRST,
  INPUT,
  LEFT,
  Node,
  ODD_ROW,
  R,
  REDUCTION,
  RIGHT,
  SCAN,
  SHUFFLE,
  SWAPPED_ROW,
  aura,
  blellochTrace,
  boundaries,
  circle,
  cinematic3d,
  curve3d,
  delay,
  dot,
  exclusive,
  f,
  freshPrefixSnapshot,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  hierarchyCounts,
  line,
  line3d,
  linear,
  linearGradient,
  metricReadout,
  number,
  onlineRescale,
  onlineSoftmax,
  orbitScene,
  par,
  parametricSurface,
  points3d,
  polyPath,
  radialGradient,
  rect,
  reductionLevels,
  rule,
  scanLevels,
  scanTeachingSnapshot,
  scanWork,
  shuffleLevels,
  shuffleRead,
  signed,
  surface,
  txt,
  wireframeSlab3d,
};
