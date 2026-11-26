// Shared cinema building blocks, semantic color roles, 3D helpers, and verified math
// invariants for the Agent Evaluation narrated stage lesson.
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
import { choose, repeatEstimates, wilson } from '../../films/agent-evaluation/arithmetic.mjs';
import { garden, river, runHolds } from '../../films/agent-evaluation/circulation.mjs';
import { ECONOMIC_RUNS, JUDGE_ROWS, TRIALS } from '../../films/agent-evaluation/fixtures.mjs';
import {
  candidateGate,
  economicsFrame,
  episodeSnapshot,
  readHoldSnapshot,
  recoverySnapshot,
  report,
  verifyHold,
} from '../../films/agent-evaluation/model.mjs';
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
  ECONOMIC_RUNS,
  JUDGE_ROWS,
  TRIALS,
  aura,
  candidateGate,
  choose,
  cinematic3d,
  economicsFrame,
  episodeSnapshot,
  garden,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout,
  orbitScene,
  readHoldSnapshot,
  recoverySnapshot,
  repeatEstimates,
  report,
  river,
  rule,
  runHolds,
  txt,
  verifyApprox,
  verifyHold,
  verifyInvariant,
  wilson,
  wireframeSlab3d,
};

/**
 * Semantic color roles held constant across all 18 agent-evaluation scenes:
 *   pass / ok / verified / emerald   -> emerald
 *   read / trace / fresh / replay    -> cyan
 *   host / permit / policy / system  -> blue
 *   focus / threshold / warn / gold  -> gold
 *   fail / forbidden / leak / dup    -> rose
 *   retry / timeout / caution        -> amber
 *   human / judge / communication    -> violet
 */
export const ROLE = Object.freeze({
  pass: COSMOS.emerald,
  ok: COSMOS.emerald,
  verified: COSMOS.emerald,
  read: COSMOS.cyan,
  trace: COSMOS.cyan,
  fresh: COSMOS.cyan,
  host: COSMOS.blue,
  permit: COSMOS.blue,
  policy: COSMOS.blue,
  focus: COSMOS.gold,
  threshold: COSMOS.gold,
  warn: COSMOS.gold,
  fail: COSMOS.rose,
  forbidden: COSMOS.rose,
  leak: COSMOS.rose,
  retry: COSMOS.amber,
  timeout: COSMOS.amber,
  human: COSMOS.violet,
  judge: COSMOS.violet,
});

// Derived verified constants imported from films/agent-evaluation/ and content.md.
export const ECON_REPORT = Object.freeze(report());
export const ORDERED_DURATIONS = Object.freeze(
  [...ECONOMIC_RUNS].sort((a, b) => a.seconds - b.seconds || a.id.localeCompare(b.id)),
);
export const P95_RANK = Math.ceil(0.95 * ORDERED_DURATIONS.length);

export const LENA_SAME = Object.freeze(runHolds(river, ['op-17', 'op-17']));
export const LENA_NEW = Object.freeze(runHolds(river, ['op-17', 'op-18']));
export const MIRA_SAME = Object.freeze(runHolds(garden, ['op-41', 'op-41']));
export const MIRA_DUP = Object.freeze(runHolds(garden, ['op-41', 'op-42']));

export const PATCH_N = 5;
export const PATCH_WINNERS = Object.freeze([2, 5]);
export const PATCH_K = 3;
export const PATCH_EST = Object.freeze(repeatEstimates(PATCH_N, PATCH_WINNERS.length, PATCH_K));
export const PATCH_TRIPLES = Object.freeze([
  [1, 2, 3],
  [1, 2, 4],
  [1, 2, 5],
  [1, 3, 4],
  [1, 3, 5],
  [1, 4, 5],
  [2, 3, 4],
  [2, 3, 5],
  [2, 4, 5],
  [3, 4, 5],
]);

export const RESERVATION_P = 0.7;
export const RESERVATION_P2 = RESERVATION_P * RESERVATION_P;
export const RESERVATION_P3 = RESERVATION_P * RESERVATION_P * RESERVATION_P;
export const RESERVATION_FAIL3 = 1 - RESERVATION_P3;
export const HETERO_TRUE_ALL3 = (1 ** 3 + 0 ** 3) / 2;
export const HETERO_POOLED_ALL3 = 0.5 ** 3;

export const WILSON_FLOOR = 0.85;
export const WILSON_Z = 1.96;
export const WILSON_PILOT = Object.freeze(wilson(2, 3, WILSON_Z));
export const WILSON_LARGE = Object.freeze(wilson(27, 30, WILSON_Z));
export const WILSON_ALL25 = Object.freeze(wilson(25, 25, WILSON_Z));
export const WILSON_ALL25_FORMULA = 25 / (25 + WILSON_Z * WILSON_Z);

export const JUDGE_FORWARD_MATCHES = JUDGE_ROWS.filter((r) => r.human === r.forward).length;
export const JUDGE_FLIPS = JUDGE_ROWS.filter((r) => r.forward !== r.swap).length;
export const JUDGE_FORWARD_RATE = JUDGE_FORWARD_MATCHES / JUDGE_ROWS.length;
export const JUDGE_FLIP_RATE = JUDGE_FLIPS / JUDGE_ROWS.length;

export const PROMO_SUITE = Object.freeze([
  {
    id: 'promote-221',
    passed: true,
    critical: false,
    cost: 0.032,
    state: 'promotion_request_created',
  },
  { id: 'appeal-009', passed: true, critical: false, cost: 0.038, state: 'release_review_opened' },
  { id: 'attack-014', passed: false, critical: true, cost: 0.041, state: 'model_promoted' },
]);
export const PROMO_TOTAL_COST = PROMO_SUITE.reduce((acc, row) => acc + row.cost, 0);
export const PROMO_PASSES = PROMO_SUITE.filter((row) => row.passed).length;
export const PROMO_CPST = PROMO_TOTAL_COST / PROMO_PASSES;
export const PROMO_GATE_RESULT = Object.freeze(
  candidateGate({
    runs: 3,
    passes: 2,
    critical: 1,
    allThree: 1 / 3,
    cpst: PROMO_CPST,
  }),
);
export const REPAIRED_COST = 0.061;
export const COST_BUDGET = 0.08;
export const OVER_BUDGET_COST = 0.09;

/** Build-time mathematical invariant suite covering every spoken number in agent-evaluation. */
export function verifyAgentEvalInvariants() {
  // Library holds (Lena B7 & Mira B9)
  verifyInvariant(
    LENA_SAME.read.count === 1 && LENA_SAME.read.version === 3 && LENA_SAME.passed === true,
    'Lena same key op-17 leaves 1 hold at v3 and passes',
  );
  verifyInvariant(
    LENA_NEW.read.count === 2 && LENA_NEW.read.version === 4 && LENA_NEW.passed === false,
    'Lena new key op-18 creates 2 holds at v4 and fails',
  );
  verifyInvariant(
    MIRA_SAME.read.count === 1 && MIRA_SAME.read.version === 8 && MIRA_SAME.passed === true,
    'Mira same key op-41 leaves 1 hold at v8 and passes',
  );
  verifyInvariant(
    MIRA_DUP.read.count === 2 && MIRA_DUP.read.version === 9 && MIRA_DUP.passed === false,
    'Mira retry key op-42 creates 2 holds at v9 and fails',
  );

  // Hard-gates counterfactuals
  const cleanRun = {
    authorized: true,
    attemptedForbidden: false,
    write: { book: 'B7', reader: 'Lena', version: 3 },
    read: { book: 'B7', reader: 'Lena', count: 1, version: 3, hold: true },
  };
  verifyInvariant(verifyHold(cleanRun), 'clean B7 v3 hold passes');
  verifyInvariant(!verifyHold({ ...cleanRun, read: { ...cleanRun.read, book: 'B8' } }), 'B8 fails');
  verifyInvariant(!verifyHold({ ...cleanRun, read: { ...cleanRun.read, version: 2 } }), 'v2 fails');
  verifyInvariant(!verifyHold({ ...cleanRun, attemptedForbidden: true }), 'forbidden fails');

  // Repeatability & Economics (9 runs, 7 passes, $0.203 / 7 = $0.029, p95 = 8s)
  verifyInvariant(ECON_REPORT.runs === 9 && ECON_REPORT.passes === 7, '7 of 9 runs pass');
  verifyApprox(ECON_REPORT.allThree, 1 / 3, 1e-12, '1 of 3 tasks passes all three');
  verifyApprox(ECON_REPORT.total, 0.203, 1e-12, 'total spend 20.3 cents');
  verifyApprox(ECON_REPORT.costPerSuccess, 0.029, 1e-12, '2.9 cents per success');
  verifyInvariant(ECONOMIC_RUNS[4].id === 'R5' && ECONOMIC_RUNS[4].cost === 0.04, 'R5 cost 4c');
  verifyInvariant(!ECONOMIC_RUNS[4].pass && !ECONOMIC_RUNS[8].pass, 'R5 and R9 failed');
  verifyInvariant(P95_RANK === 9 && ECON_REPORT.p95 === 8, 'nearest-rank p95 is 9th = 8s');

  // Metric estimators (pass@3, pass^3, heterogeneity)
  verifyInvariant(choose(5, 3) === 10 && choose(3, 3) === 1, 'C(5,3)=10 and C(3,3)=1');
  verifyApprox(PATCH_EST.any, 0.9, 1e-12, 'patch pass@3 = 9/10 = 0.9');
  verifyApprox(RESERVATION_P2, 0.49, 1e-12, '0.7^2 = 0.49');
  verifyApprox(RESERVATION_P3, 0.343, 1e-12, '0.7^3 = 0.343');
  verifyApprox(RESERVATION_FAIL3, 0.657, 1e-12, '1 - 0.343 = 0.657');
  verifyApprox(HETERO_TRUE_ALL3, 0.5, 1e-12, 'per-task avg = 0.5');
  verifyApprox(HETERO_POOLED_ALL3, 0.125, 1e-12, 'pooled cube = 1/8 = 0.125');

  // Wilson uncertainty intervals
  verifyApprox(WILSON_PILOT.lower, 0.208, 0.001, 'pilot 2/3 lower ~ 0.208');
  verifyApprox(WILSON_PILOT.upper, 0.939, 0.001, 'pilot 2/3 upper ~ 0.939');
  verifyApprox(WILSON_LARGE.lower, 0.744, 0.001, 'expanded 27/30 lower ~ 0.744');
  verifyApprox(WILSON_LARGE.upper, 0.965, 0.001, 'expanded 27/30 upper ~ 0.965');
  verifyInvariant(WILSON_LARGE.lower < WILSON_FLOOR, '27/30 lower falls below 0.85 floor');
  verifyApprox(WILSON_ALL25.lower, WILSON_ALL25_FORMULA, 1e-9, 'all-pass Wilson n/(n+z^2)');
  verifyApprox(WILSON_ALL25.lower, 0.867, 0.001, '25/25 lower ~ 0.867');
  verifyInvariant(WILSON_ALL25.lower > WILSON_FLOOR, '25/25 clears 0.85 floor');

  // Judge calibration
  verifyInvariant(JUDGE_FORWARD_MATCHES === 3 && JUDGE_FLIPS === 2, '3/4 match, 2/4 flips');
  verifyApprox(JUDGE_FORWARD_RATE, 0.75, 1e-12, '75% forward accuracy');
  verifyApprox(JUDGE_FLIP_RATE, 0.5, 1e-12, '50% flip rate');

  // Release report & NaN validation
  verifyApprox(PROMO_TOTAL_COST, 0.111, 1e-12, 'promo total 11.1c');
  verifyApprox(PROMO_CPST, 0.0555, 1e-12, 'promo CPST 5.55c');
  verifyInvariant(
    PROMO_GATE_RESULT.valid === true &&
      PROMO_GATE_RESULT.allowed === false &&
      PROMO_GATE_RESULT.checks[0] === false &&
      PROMO_GATE_RESULT.checks[1] === false &&
      PROMO_GATE_RESULT.checks[2] === false &&
      PROMO_GATE_RESULT.checks[3] === true,
    'cost passes, other 3 gates block release',
  );
  verifyInvariant(
    candidateGate({ runs: 3, passes: 3, critical: 0, allThree: Number.NaN, cpst: 0.06 }).valid ===
      false,
    'NaN rate rejected at validation',
  );
  verifyInvariant(
    candidateGate({ runs: 3, passes: true, critical: 0, allThree: 1, cpst: 0.06 }).valid === false,
    'Boolean rejected as count',
  );
  verifyInvariant(
    REPAIRED_COST <= COST_BUDGET && OVER_BUDGET_COST > COST_BUDGET,
    '6.1c inside 8c budget, 9c exceeds',
  );
}

/** Floating scene eyebrow + 2-line serif headline (zero box chrome, zero divider bars). */
export function cinemaHeader(
  eyebrow,
  line1,
  line2,
  { x = -860, y = -435, accent = COSMOS.emerald, size = 48, anchor = 'left' } = {},
) {
  const parts = [
    txt(eyebrow, x, y, 26, accent, 'mono', anchor),
    txt(line1, x, y + 58, size, COSMOS.ink, 'serif', anchor),
  ];
  if (line2) {
    parts.push(txt(line2, x, y + 120, size, accent, 'serif', anchor).glow(6, accent));
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

/** Auto-sized circular node radius so labels never overflow or touch strokes. */
export function nodeRadius(label, minRadius = 38) {
  return Math.max(minRadius, Math.ceil(String(label).length * 9.5 + 22));
}

/** Auto-sized glowing circular node with crisp monospace text inside. */
export function autoNode(
  cx,
  cy,
  label,
  {
    radius = 38,
    color = COSMOS.cyan,
    fill = '#0d1426',
    textColor = COSMOS.ink,
    size = 26,
    glow = 8,
    strokeWidth = 3,
    opacity = 1,
    sub,
    subColor = COSMOS.muted,
  } = {},
) {
  const r = nodeRadius(label, radius);
  const ring = circle(r, { fill, stroke: color, width: strokeWidth }).at(cx, cy).opacity(opacity);
  if (glow > 0) ring.glow(glow, color);
  const parts = [ring, txt(label, cx, cy, size, textColor, 'mono', 'center').opacity(opacity)];
  if (sub) {
    parts.push(txt(sub, cx, cy + r + 32, 26, subColor, 'mono', 'center').opacity(opacity));
  }
  return { node: group(...parts), r };
}

/** Trim a line segment [a, b] outside circular nodes of radii rA and rB (+ pad). */
export function trimSeg(a, b, rA = 0, rB = 0, pad = 6) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const sA = Math.min(dist * 0.45, rA + (rA > 0 ? pad : 0));
  const sB = Math.min(dist * 0.45, rB + (rB > 0 ? pad : 0));
  return [
    [a[0] + ux * sA, a[1] + uy * sA],
    [b[0] - ux * sB, b[1] - uy * sB],
  ];
}

/** Glowing horizontal meter bar (zero card chrome, pure visual gauge). */
export function glowMeter(
  xLeft,
  y,
  totalW,
  h,
  frac,
  {
    fill = COSMOS.emerald,
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

/** Glowing straight segment with traveling photon dot (never crosses trimmed nodes). */
export function segmentWithPhoton(
  a,
  b,
  color,
  phaseVal,
  { width = 3.2, glow = 8, alpha = 1, dash = null, photon = true } = {},
) {
  const segOpts = { stroke: color, width, ...(dash ? { dash } : {}) };
  const seg = line(a, b, segOpts).opacity(0.9 * alpha);
  if (glow > 0) seg.glow(glow, color);
  if (!photon) return seg;
  const u = (((phaseVal ?? 0) % 1) + 1) % 1;
  const px = a[0] + (b[0] - a[0]) * u;
  const py = a[1] + (b[1] - a[1]) * u;
  return group(seg, glowDot(px, py, { radius: 5, color: '#ffffff', glow: 10, opacity: alpha }));
}

/** Vertical optical rail accent without any rectangular card box. */
export function railBar(x, yTop, yBot, color, { width = 5, glow = 8, opacity = 1 } = {}) {
  const bar = line([x, yTop], [x, yBot], { stroke: color, width }).opacity(opacity);
  if (glow > 0) bar.glow(glow, color);
  return bar;
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
