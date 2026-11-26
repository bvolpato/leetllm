// Shared cinema building blocks, semantic color roles, 3D helpers, and verified math
// invariants for the LLM-as-a-Judge narrated stage lesson.
import {
  circle,
  curve3d,
  fadeIn,
  fadeOut,
  group,
  line,
  line3d,
  linear,
  par,
  parametricSurface,
  point3d,
  rect,
} from 'vizmatic/stage';
import {
  aggregateSwaps,
  belowOnePercent,
  identity,
  receipt,
  upperAfterZero,
} from '../../films/llm-judge/arithmetic.mjs';
import { coverageFrame } from '../../films/llm-judge/construction.mjs';
import {
  anchors,
  candidates,
  conflictingSwap,
  human,
  judge,
  judgeRun,
  labels,
  policy,
  records,
  restoreReplies,
  restoreTie,
  restoreVotes,
  stableSwap,
} from '../../films/llm-judge/fixtures.mjs';
import {
  attempts,
  counts,
  exactFields,
  expected,
  humanCounts,
  judgeCounts,
  judgeReport,
  kappa,
  matches,
  observed,
  resolved,
  review,
  unresolved,
} from '../../films/llm-judge/model.mjs';
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
  aggregateSwaps,
  anchors,
  attempts,
  aura,
  belowOnePercent,
  candidates,
  cinematic3d,
  conflictingSwap,
  counts,
  coverageFrame,
  exactFields,
  expected,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  human,
  humanCounts,
  identity,
  judge,
  judgeCounts,
  judgeReport,
  judgeRun,
  kappa,
  labels,
  matches,
  metricReadout,
  observed,
  orbitScene,
  policy,
  receipt,
  records,
  resolved,
  restoreReplies,
  restoreTie,
  restoreVotes,
  review,
  rule,
  stableSwap,
  txt,
  unresolved,
  upperAfterZero,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
};

/**
 * Semantic color roles held constant across all 18 llm-judge scenes:
 *   compact / ok / match / verified -> emerald
 *   stepwise / judge / trace        -> cyan
 *   policy / host / reference       -> blue
 *   verdict / focus / tie / dial    -> gold
 *   bias / conflict / fail / miss   -> rose
 *   review / caution / queued       -> amber
 *   human / reviewer ground truth   -> violet
 */
export const ROLE = Object.freeze({
  compact: COSMOS.emerald,
  ok: COSMOS.emerald,
  verified: COSMOS.emerald,
  stepwise: COSMOS.cyan,
  judge: COSMOS.cyan,
  trace: COSMOS.cyan,
  policy: COSMOS.blue,
  host: COSMOS.blue,
  verdict: COSMOS.gold,
  focus: COSMOS.gold,
  tie: COSMOS.gold,
  conflict: COSMOS.rose,
  fail: COSMOS.rose,
  bias: COSMOS.rose,
  review: COSMOS.amber,
  caution: COSMOS.amber,
  human: COSMOS.violet,
});

// Derived verified constants used across scenes.
export const PAIRWISE_N = 6;
export const PAIRWISE_PAIRS = (PAIRWISE_N * (PAIRWISE_N - 1)) / 2;
export const PAIRWISE_CALLS = PAIRWISE_PAIRS * 2;
export const BASELINE_PAIRS = PAIRWISE_N - 1;
export const BASELINE_CALLS = BASELINE_PAIRS * 2;
export const SHORT_INPUT_TOKENS = BASELINE_CALLS * 200;
export const LONG_INPUT_TOKENS = BASELINE_CALLS * 800;

export const EXTRA_PARSE_REPORT = judgeReport({
  attempted: attempts + 1,
  resolved,
  comparable: resolved,
  matches,
});

export const FRESH_BASE_REPORT = judgeReport({
  attempted: 20,
  resolved: 14,
  comparable: 14,
  matches: 10,
});

export const FRESH_PARSE_REPORT = judgeReport({
  attempted: 21,
  resolved: 14,
  comparable: 14,
  matches: 10,
});

export const PREVALENCE = Object.freeze({
  total: 100,
  acceptable: 90,
  knownBad: 10,
  observed: 0.9,
  expected: 0.9,
  kappa: 0,
});

export const BUDGET = Object.freeze({
  cases: 200,
  orders: 2,
  repeats: 3,
  totalCalls: 200 * 2 * 3,
  upper50: upperAfterZero(50),
  upper298: upperAfterZero(298),
  upper299: upperAfterZero(299),
});

export const TRANSFER_OLD = Object.freeze([...judge]);
export const TRANSFER_NEW = Object.freeze([
  'compact',
  'compact',
  'compact',
  'stepwise',
  'stepwise',
  'stepwise', // Case 6: gain (matches human stepwise)
  'stepwise',
  'compact', // Case 8: loss (human tie)
]);

/** Build-time mathematical invariant suite covering every displayed value in llm-judge. */
export function verifyLlmJudgeInvariants() {
  verifyInvariant(
    PAIRWISE_PAIRS === 15 && PAIRWISE_CALLS === 30,
    '6 revisions -> 15 pairs / 30 calls',
  );
  verifyInvariant(BASELINE_PAIRS === 5 && BASELINE_CALLS === 10, 'baseline -> 5 pairs / 10 calls');
  verifyInvariant(
    SHORT_INPUT_TOKENS === 2000 && LONG_INPUT_TOKENS === 8000,
    'input token budget 2k -> 8k',
  );

  verifyInvariant(
    exactFields({ policyVersion: 'DEP-27', actions: ['stop_rollout', 'run_rollback'] }),
    'exactFields matches DEP-27',
  );
  verifyInvariant(
    !exactFields({ policyVersion: 'DEP-27', actions: ['run_rollback', 'stop_rollout'] }),
    'exactFields rejects reversed actions',
  );

  verifyInvariant(aggregateSwaps(...stableSwap) === 'stepwise', 'B then A -> stepwise');
  verifyInvariant(aggregateSwaps(...conflictingSwap) === 'unresolved', 'B then B -> unresolved');
  verifyInvariant(aggregateSwaps(receipt('tie'), receipt('tie', true)) === 'tie', 'tie/tie -> tie');
  verifyInvariant(
    aggregateSwaps(receipt('tie'), receipt('A', true)) === 'unresolved',
    'tie/A -> unresolved',
  );
  verifyInvariant(
    aggregateSwaps(receipt('B'), receipt('review', true)) === 'review',
    'B/review -> review',
  );
  verifyInvariant(aggregateSwaps(...restoreVotes) === 'alpha', 'restore A then B -> alpha');
  verifyInvariant(
    aggregateSwaps(restoreVotes[0], restoreTie) === 'unresolved',
    'restore A then tie -> unresolved',
  );

  verifyInvariant(
    humanCounts.compact === 3 && humanCounts.stepwise === 3 && humanCounts.tie === 2,
    'human counts (3,3,2)',
  );
  verifyInvariant(
    judgeCounts.compact === 4 && judgeCounts.stepwise === 3 && judgeCounts.tie === 1,
    'judge counts (4,3,1)',
  );
  verifyInvariant(matches === 6 && observed === 0.75, '6/8 = 0.75 observed agreement');
  verifyApprox(expected, 23 / 64, 1e-12, 'expected agreement 23/64');
  verifyApprox(kappa, 25 / 41, 1e-12, 'Cohen kappa 25/41');

  verifyInvariant(
    attempts === 10 && resolved === 8 && unresolved === 1 && review === 1,
    '10-case split',
  );
  verifyApprox(EXTRA_PARSE_REPORT.coverage, 8 / 11, 1e-12, 'extra parse coverage 8/11');
  verifyApprox(EXTRA_PARSE_REPORT.agreement, 6 / 8, 1e-12, 'extra parse agreement 6/8');
  verifyApprox(FRESH_BASE_REPORT.coverage, 14 / 20, 1e-12, 'fresh base coverage 70%');
  verifyApprox(FRESH_BASE_REPORT.agreement, 10 / 14, 1e-12, 'fresh base agreement 71.4%');
  verifyApprox(FRESH_PARSE_REPORT.coverage, 14 / 21, 1e-12, 'fresh parse coverage 66.7%');

  verifyApprox(BUDGET.upper50 * 100, 5.8155, 1e-3, 'upperAfterZero(50) ~ 5.82%');
  verifyInvariant(belowOnePercent === 299, 'belowOnePercent = 299');
  verifyInvariant(BUDGET.upper298 > 0.01 && BUDGET.upper299 < 0.01, '298 > 1% > 299');
  verifyInvariant(BUDGET.totalCalls === 1200, '200 x 2 x 3 = 1200 calls');
  verifyInvariant(
    judgeRun.tools.length === 0 && judgeRun.secrets.length === 0,
    'isolated judge run',
  );

  const oldMatches = TRANSFER_OLD.filter((v, i) => v === human[i]).length;
  const newMatches = TRANSFER_NEW.filter((v, i) => v === human[i]).length;
  verifyInvariant(oldMatches === 6 && newMatches === 6, 'transfer both 6/8');
}

/** Floating scene eyebrow + 2-line serif headline (zero box chrome). */
export function cinemaHeader(
  eyebrow,
  line1,
  line2,
  { x = -860, y = -430, accent = COSMOS.cyan, size = 50, anchor = 'left' } = {},
) {
  const parts = [
    txt(eyebrow, x, y, 26, accent, 'mono', anchor),
    txt(line1, x, y + 60, size, COSMOS.ink, 'serif', anchor),
  ];
  if (line2) {
    parts.push(txt(line2, x, y + 126, size, accent, 'serif', anchor).glow(6, accent));
  }
  return group(...parts);
}

/** Clamp an animation duration so it finishes strictly before `c.end - margin`. */
export function clampDur(c, startTime, desired, margin = 0.45) {
  const available = c.end - startTime - margin;
  if (available <= 0.08) return 0.08;
  return Math.min(desired, available);
}

/** Non-overlapping crossfade curves over 0 -> 1 mode value `v`. */
export const fadeOutHalf = (v) => Math.max(0, Math.min(1, 1 - v * 2.5));
export const fadeInHalf = (v) => Math.max(0, Math.min(1, (v - 0.6) * 2.5));

/** Schedule a continuous linear value drift safely inside the scene window. */
export function driftValue(s, c, val, target, { startOffset = 0.1, endMargin = 0.5 } = {}) {
  const span = Math.max(0.4, c.end - c.start - startOffset - endMargin);
  c.at(startOffset, () => {
    s.play(val.to(target, { duration: span, ease: linear }));
  });
  return span;
}

/** Glowing horizontal meter bar (zero card chrome, pure visual gauge). */
export function glowMeter(
  xLeft,
  y,
  totalW,
  h,
  frac,
  {
    fill = COSMOS.cyan,
    bg = '#0f1629',
    border = '#2c3d66',
    glow = 8,
    radius = 8,
    opacity = 1,
  } = {},
) {
  const clamped = Math.max(0, Math.min(1, frac));
  const cx = xLeft + totalW * 0.5;
  const track = rect(totalW, h, { fill: bg, stroke: border, width: 2, radius })
    .at(cx, y)
    .opacity(opacity);
  if (clamped <= 0.004) return track;
  const innerW = Math.max(8, (totalW - 6) * clamped);
  const bar = rect(innerW, h - 6, { fill, stroke: null, radius: Math.max(4, radius - 2) })
    .at(xLeft + 3 + innerW * 0.5, y)
    .opacity(0.9 * opacity);
  if (glow > 0) bar.glow(glow, fill);
  return group(track, bar);
}

/** Glowing precision calibration dial with rotating needle and tick ring. */
export function calibrationDial(
  cx,
  cy,
  radius,
  angleRad,
  {
    color = COSMOS.gold,
    ringColor = '#2b3b64',
    needleColor = COSMOS.gold,
    opacity = 1,
    ticks = 16,
  } = {},
) {
  const nodes = [
    circle(radius, { fill: '#0b1020', stroke: ringColor, width: 2.6 })
      .at(cx, cy)
      .opacity(0.92 * opacity),
    circle(radius * 0.86, { fill: null, stroke: color, width: 1.6, dash: [6, 8] })
      .at(cx, cy)
      .opacity(0.5 * opacity),
  ];
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2;
    const major = i % 4 === 0;
    const r0 = radius * (major ? 0.78 : 0.85);
    const r1 = radius * 0.96;
    nodes.push(
      line(
        [cx + Math.cos(a) * r0, cy + Math.sin(a) * r0],
        [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1],
        { stroke: major ? color : '#3f527d', width: major ? 2.6 : 1.4 },
      ).opacity(opacity * (major ? 0.9 : 0.55)),
    );
  }
  const nx = cx + Math.cos(angleRad) * (radius * 0.74);
  const ny = cy + Math.sin(angleRad) * (radius * 0.74);
  const needle = line([cx, cy], [nx, ny], { stroke: needleColor, width: 4.2 })
    .glow(9, needleColor)
    .opacity(opacity);
  nodes.push(
    needle,
    glowDot(nx, ny, { radius: 6, color: needleColor, glow: 12, opacity }),
    glowDot(cx, cy, { radius: 7, color: '#ffffff', glow: 8, opacity }),
  );
  return group(...nodes);
}

/** Smooth 2D quadratic Bezier curve points. */
export function quadArcPts(a, b, liftY = -80, steps = 28) {
  const mx = (a[0] + b[0]) * 0.5;
  const my = (a[1] + b[1]) * 0.5 + liftY;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * a[0] + 2 * u * t * mx + t * t * b[0],
      u * u * a[1] + 2 * u * t * my + t * t * b[1],
    ]);
  }
  return pts;
}

/** Glowing beam with traveling photon dots along a point path. */
export function beamWithPhotons(
  pts,
  color,
  phaseVal,
  { width = 3.4, glow = 9, photonCount = 2, alpha = 1 } = {},
) {
  const nodes = [glowingTrail(pts, { color, width, glow, opacity: 0.9 * alpha })];
  if (photonCount > 0) {
    const last = pts.length - 1;
    for (let i = 0; i < photonCount; i++) {
      const u = ((((phaseVal ?? 0) + i / photonCount) % 1) + 1) % 1;
      const idx = u * last;
      const k = Math.min(last - 1, Math.floor(idx));
      const f = idx - k;
      const px = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f;
      const py = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f;
      nodes.push(glowDot(px, py, { radius: 5.2, color: '#ffffff', glow: 11, opacity: alpha }));
    }
  }
  return group(...nodes);
}

/** Add a glowing shaded 3D rectangular prism to a Scene3D. */
export function addBox3D(
  view,
  x0,
  y0,
  z0,
  dx,
  dy,
  dz,
  fillColor,
  edgeColor = fillColor,
  { faceOpacity = 0.78, edgeWidth = 2.1, edgeGlow = 7, edgeOpacity = 0.92, blend = 'screen' } = {},
) {
  const x1 = x0 + dx;
  const y1 = y0 + dy;
  const z1 = z0 + dz;
  const faceOpts = {
    resolution: [1, 1],
    color: fillColor,
    opacity: faceOpacity,
    mesh: false,
    shaded: true,
  };
  const edgeOpts = {
    color: edgeColor,
    width: edgeWidth,
    opacity: edgeOpacity,
    glow: edgeGlow,
    ...(blend ? { blend } : {}),
  };
  const objs = [
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z1], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z0], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0 + u * dx, y1, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x1, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    line3d([x0, y0, z0], [x1, y0, z0], edgeOpts),
    line3d([x1, y0, z0], [x1, y1, z0], edgeOpts),
    line3d([x1, y1, z0], [x0, y1, z0], edgeOpts),
    line3d([x0, y1, z0], [x0, y0, z0], edgeOpts),
    line3d([x0, y0, z1], [x1, y0, z1], edgeOpts),
    line3d([x1, y0, z1], [x1, y1, z1], edgeOpts),
    line3d([x1, y1, z1], [x0, y1, z1], edgeOpts),
    line3d([x0, y1, z1], [x0, y0, z1], edgeOpts),
    line3d([x0, y0, z0], [x0, y0, z1], edgeOpts),
    line3d([x1, y0, z0], [x1, y0, z1], edgeOpts),
    line3d([x1, y1, z0], [x1, y1, z1], edgeOpts),
    line3d([x0, y1, z0], [x0, y1, z1], edgeOpts),
  ];
  view.add(...objs);
  return objs;
}

/** Add a glowing 3D quadratic Bezier pointer arc with traveling photon dot. */
export function addArc3D(
  view,
  a,
  b,
  color,
  { lift = 0.7, width = 3.0, glow = 8, pulseVal = null, phaseOffset = 0, opacity = 0.92 } = {},
) {
  const mid = [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, Math.max(a[2], b[2]) + lift];
  const evalPt = (t) => {
    const u = 1 - t;
    return [
      u * u * a[0] + 2 * u * t * mid[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * mid[1] + t * t * b[1],
      u * u * a[2] + 2 * u * t * mid[2] + t * t * b[2],
    ];
  };
  const objs = [
    curve3d(evalPt, 0, 1, {
      color,
      width,
      glow,
      blend: 'screen',
      samples: 32,
      opacity,
    }),
    point3d(a, { color: '#ffffff', radius: 4.8, glow: 8, blend: 'screen' }),
    point3d(b, { color, radius: 5.4, glow: 8, blend: 'screen' }),
  ];
  if (pulseVal) {
    objs.push(
      point3d(() => evalPt((pulseVal.value + phaseOffset) % 1), {
        color: '#ffffff',
        radius: 6.4,
        glow: 11,
        blend: 'screen',
      }),
    );
  }
  view.add(...objs);
  return objs;
}

export function hideNodes(nodes) {
  for (const n of nodes) n.hide();
  return nodes;
}

export function fadeInNodes(s, c, triggerTime, nodes, desired = 0.35) {
  const duration = clampDur(c, triggerTime, desired, 0.25);
  s.play(par(...nodes.map((n) => fadeIn(n, { duration }))));
}

export function fadeOutNodes(s, c, triggerTime, nodes, desired = 0.3) {
  const duration = clampDur(c, triggerTime, desired, 0.25);
  s.play(par(...nodes.map((n) => fadeOut(n, { duration }))));
}
