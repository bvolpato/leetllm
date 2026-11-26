// Shared cinema building blocks, semantic color roles, 3D helpers, and verified math
// invariants for the Token Economics narrated stage lesson (all 25 scenes).
import {
  arrow,
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
  acceptedTaskCost,
  contextTierPrice,
  historyUsage,
  rateContentDigest,
  reservationTransition,
} from '../../films/token-economics/arithmetic.mjs';
import {
  USAGE_RECEIPT,
  actualDailyMicro,
  batch,
  budgetMicro,
  citedAnswersPassed,
  coldEvaluationMicro,
  coldMicro,
  coldNightExtraMicro,
  conciseMicro,
  dailySlices,
  dailyTotalMicro,
  evaluationMicro,
  forecastWithColdNights,
  growthMonthlyMicro,
  headroomMicro,
  monthlyMicro,
  nightlyCalls,
  optimizedDailyMicro,
  prefixMicro,
  priceMicroDollars,
  qualityRate,
  reviewedAnswers,
  reviewedHits,
  semanticHits,
  standard,
  unsafeHits,
  verboseMicro,
} from '../../films/token-economics/fixtures.mjs';
import { usd } from '../../films/token-economics/forecast-calendar.mjs';
import { validateChapterModels, validateModel } from '../../films/token-economics/model.mjs';
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
  USAGE_RECEIPT,
  acceptedTaskCost,
  actualDailyMicro,
  aura,
  batch,
  budgetMicro,
  cinematic3d,
  citedAnswersPassed,
  coldEvaluationMicro,
  coldMicro,
  coldNightExtraMicro,
  conciseMicro,
  contextTierPrice,
  dailySlices,
  dailyTotalMicro,
  evaluationMicro,
  forecastWithColdNights,
  glowDot,
  glowTex,
  glowingTrail,
  growthMonthlyMicro,
  guardedDynamic,
  headroomMicro,
  heroTitle,
  historyUsage,
  metricReadout,
  monthlyMicro,
  nightlyCalls,
  optimizedDailyMicro,
  orbitScene,
  prefixMicro,
  priceMicroDollars,
  qualityRate,
  rateContentDigest,
  reservationTransition,
  reviewedAnswers,
  reviewedHits,
  rule,
  semanticHits,
  standard,
  txt,
  unsafeHits,
  usd,
  verboseMicro,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
};

/**
 * Semantic color roles held constant across all 25 scenes:
 *   input / support / fresh      -> cyan
 *   cached / prefix / focus      -> gold
 *   output / fail / breach       -> rose
 *   ok / stored / saved / pass   -> emerald
 *   batch / verbose / baseline   -> blue
 *   reasoning / write / held     -> amber
 *   meta / digest / trace        -> violet
 */
export const ROLE = Object.freeze({
  input: COSMOS.cyan,
  cached: COSMOS.gold,
  focus: COSMOS.gold,
  output: COSMOS.rose,
  fail: COSMOS.rose,
  breach: COSMOS.rose,
  ok: COSMOS.emerald,
  stored: COSMOS.emerald,
  saved: COSMOS.emerald,
  batch: COSMOS.blue,
  verbose: COSMOS.blue,
  reasoning: COSMOS.amber,
  write: COSMOS.amber,
  held: COSMOS.amber,
  meta: COSMOS.violet,
});

export const TERRA = Object.freeze({
  input: 2.0,
  write30m: 2.5,
  read: 0.2,
  output: 12.0,
  ordinaryTokens: 520,
  prefixTokens: 1280,
  outputTokens: 180,
  writeCallMicro: 520 * 2.0 + 1280 * 2.5 + 180 * 12.0,
  readCallMicro: 520 * 2.0 + 1280 * 0.2 + 180 * 12.0,
  coldCallMicro: 1800 * 2.0 + 180 * 12.0,
});

export const HIDDEN_OUT = Object.freeze({
  totalTokens: 1186,
  reasoningTokens: 1024,
  otherTokens: 162,
  singleMicro: 1186 * standard.output,
  doubleMicro: (1186 + 1024) * standard.output,
  incompleteInputMicro: 1800 * standard.input,
  incompleteOutputMicro: 1024 * standard.output,
  incompleteTotalMicro: 1800 * standard.input + 1024 * standard.output,
});

export const FRESH_ATTEMPTS = Object.freeze([
  { id: 'X1', task: 'X', costMicro: 2000, accepted: false, outcome: 'Failed' },
  { id: 'X2', task: 'X', costMicro: 3000, accepted: true, outcome: 'Accepted' },
  { id: 'Y1', task: 'Y', costMicro: 4000, accepted: false, outcome: 'Abandoned' },
  { id: 'Z1', task: 'Z', costMicro: 5000, accepted: true, outcome: 'Accepted' },
]);

export const FRESH_COST = Object.freeze(acceptedTaskCost(FRESH_ATTEMPTS));

export const WRAP_BASELINE = Object.freeze(
  acceptedTaskCost([
    { id: 'V-A1', task: 'A', accepted: true, costMicro: verboseMicro },
    { id: 'V-B1', task: 'B', accepted: true, costMicro: verboseMicro },
  ]),
);

export const WRAP_ATTEMPTS = Object.freeze([
  { id: 'C-A1', task: 'A', accepted: true, costMicro: conciseMicro },
  { id: 'C-B1', task: 'B', accepted: false, costMicro: conciseMicro },
  { id: 'C-B2', task: 'B', accepted: true, costMicro: conciseMicro },
]);

export const WRAP_CONCISE = Object.freeze(acceptedTaskCost(WRAP_ATTEMPTS));

export const cents = (micro) => `${Number((micro / 10000).toFixed(3))}¢`;
export const fmtInt = (n) => Math.round(n).toLocaleString('en-US');

/** Build-time mathematical invariant suite covering every displayed value across all 25 scenes. */
export function verifyTokenEconomicsInvariants() {
  validateModel();
  validateChapterModels();

  // Intro & nightly batch receipts
  const nightlyOutputMicro = nightlyCalls * 80 * batch.output;
  verifyInvariant(nightlyOutputMicro === 1_200_000, 'nightly output charge = $1.20');
  verifyInvariant(evaluationMicro === 2_820_000, 'warm nightly eval = $2.82');
  verifyInvariant(coldEvaluationMicro === 5_700_000, 'cold nightly eval = $5.70');
  verifyInvariant(coldNightExtraMicro === 2_880_000, 'cold night delta = $2.88');

  // One answer & prefix reuse
  verifyInvariant(coldMicro === 7200, 'cold policy answer = $0.00720');
  verifyInvariant(prefixMicro === 4320, 'warm policy answer = $0.00432');
  verifyInvariant(1280 * standard.cached === 320, '1,280 cached read = $0.00032');
  verifyInvariant(520 * standard.input === 1300, '520 ordinary suffix = $0.00130');
  verifyInvariant(180 * standard.output === 2700, '180 output = $0.00270');

  // Hidden reasoning output
  verifyInvariant(HIDDEN_OUT.otherTokens === 162, '1186 - 1024 = 162 other tokens');
  verifyInvariant(HIDDEN_OUT.singleMicro === 17790, '1186 * $15/M = $0.01779');
  verifyInvariant(HIDDEN_OUT.doubleMicro === 33150, 'double counted = $0.03315');
  verifyInvariant(HIDDEN_OUT.incompleteTotalMicro === 19860, 'incomplete call = $0.01986');

  // Context tier cliff
  verifyApprox(contextTierPrice(272000).cost, 0.68, 1e-9, '272k short tier');
  verifyApprox(contextTierPrice(272001).cost, 1.360005, 1e-9, '272,001 long tier');
  verifyApprox(contextTierPrice(300000, 1000).cost, 1.5225, 1e-9, '300k + 1k long tier');

  // GPT-5.6 Terra cache write
  verifyInvariant(TERRA.writeCallMicro === 6400, 'Terra write call = $0.006400');
  verifyInvariant(TERRA.readCallMicro === 3456, 'Terra read call = $0.003456');
  verifyInvariant(TERRA.coldCallMicro === 5760, 'Terra uncached call = $0.005760');
  verifyInvariant(
    TERRA.writeCallMicro + TERRA.readCallMicro === 9856,
    'Terra write + read pair = $0.009856',
  );
  verifyInvariant(2 * TERRA.coldCallMicro === 11520, 'Terra uncached pair = $0.011520');
  verifyInvariant(
    2 * TERRA.coldCallMicro - (TERRA.writeCallMicro + TERRA.readCallMicro) === 1664,
    'Terra pair saves $0.001664',
  );

  // Daily replay & monthly budget
  verifyInvariant(
    dailySlices[1].requests * dailySlices[1].cost === 11_025_000,
    'live orders $11.025',
  );
  verifyInvariant(500 * (verboseMicro - conciseMicro) === 675_000, 'exception savings $0.675/day');
  verifyInvariant(dailyTotalMicro === 23_906_000, 'daily total = $23.906');
  verifyInvariant(monthlyMicro === 717_180_000, 'monthly base = $717.18');
  verifyInvariant(headroomMicro === 32_820_000, 'monthly headroom = $32.82');
  verifyApprox(headroomMicro / 12 / 1e6, 2.735, 1e-9, '12-night allowance = $2.735');
  verifyInvariant(forecastWithColdNights(11) === 748_860_000, '11 cold nights = $748.86');
  verifyInvariant(forecastWithColdNights(12) === 751_740_000, '12 cold nights = $751.74');
  verifyInvariant(forecastWithColdNights(30) === 803_580_000, '30 cold nights = $803.58');
  verifyApprox(growthMonthlyMicro / 1e6, 780.438, 1e-3, '+10% support monthly forecast');

  // History loop
  const coldHist = historyUsage(false);
  const warmHist = historyUsage(true);
  verifyApprox(coldHist.cost, 0.065, 1e-9, '5-turn cold history = 6.5 cents');
  verifyApprox(warmHist.cost, 0.0335, 1e-9, '5-turn cached history = 3.35 cents');
  verifyInvariant(
    warmHist.cached === 14000 && warmHist.ordinary === 6000,
    '14k read + 6k ordinary',
  );

  // Wrap accepted task cost
  verifyInvariant(WRAP_CONCISE.spend === 13710, '3 concise attempts = $0.01371');
  verifyInvariant(WRAP_CONCISE.costPerAccepted === 6855, 'concise per accepted = $0.006855');
  verifyInvariant(WRAP_BASELINE.spend === 11840, '2 verbose attempts = $0.01184');
  verifyInvariant(WRAP_BASELINE.costPerAccepted === 5920, 'verbose per accepted = $0.005920');

  // Trace digest integrity
  verifyInvariant(
    rateContentDigest(15) !== rateContentDigest(16),
    'SHA-256 rate digest changes on $15 -> $16 edit',
  );

  // Quality evidence
  verifyApprox(qualityRate, 0.997, 1e-9, '1994/2000 = 99.7%');
  verifyApprox(1 - Math.pow(0.05, 1 / 1200), 0.0024933, 1e-5, 'exact 95% upper bound at n=1200');

  // Cold reservation & atomic settlement
  verifyInvariant(priceMicroDollars(2200, 0, 300) === 10000, '2200 cold + 300 cap = $0.01000');
  verifyInvariant(priceMicroDollars(2300, 0, 300) === 10250, '2300 cold + 300 cap = $0.01025');
  verifyInvariant(reservationTransition(16000, 10000).free === 6000, 'atomic claim leaves $0.006');
  verifyInvariant(
    reservationTransition(16000, 10000, 'settled', conciseMicro).free === 11430,
    'settlement releases to $0.01143',
  );

  // Fresh economics
  verifyInvariant(FRESH_COST.spend === 14000, 'fresh 4 attempts = $0.014');
  verifyInvariant(FRESH_COST.accepted === 2, 'fresh accepted tasks = 2');
  verifyInvariant(FRESH_COST.costPerAccepted === 7000, 'fresh per accepted = $0.007');
  verifyInvariant(priceMicroDollars(1600, 0, 400) === 10000, '1600 cold + 400 cap = $0.010');
}

/** Add a glowing, depth-sorted 3D rectangular prism (6 shaded faces + 12 edges) to a Scene3D. */
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
  { faceOpacity = 0.74, edgeWidth = 2.0, edgeGlow = 6, edgeOpacity = 0.92, blend = 'screen' } = {},
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

/** Add a wireframe-only 3D box (12 edges) for empty/pending/ceiling volumes. */
export function addWireBox3D(
  view,
  x0,
  y0,
  z0,
  dx,
  dy,
  dz,
  color = ROLE.breach,
  { width = 1.8, opacity = 0.72, glow = 5, blend = 'screen' } = {},
) {
  const x1 = x0 + dx;
  const y1 = y0 + dy;
  const z1 = z0 + dz;
  const es = { color, width, opacity, glow, ...(blend ? { blend } : {}) };
  const objs = [
    line3d([x0, y0, z0], [x1, y0, z0], es),
    line3d([x1, y0, z0], [x1, y1, z0], es),
    line3d([x1, y1, z0], [x0, y1, z0], es),
    line3d([x0, y1, z0], [x0, y0, z0], es),
    line3d([x0, y0, z1], [x1, y0, z1], es),
    line3d([x1, y0, z1], [x1, y1, z1], es),
    line3d([x1, y1, z1], [x0, y1, z1], es),
    line3d([x0, y1, z1], [x0, y0, z1], es),
    line3d([x0, y0, z0], [x0, y0, z1], es),
    line3d([x1, y0, z0], [x1, y0, z1], es),
    line3d([x1, y1, z0], [x1, y1, z1], es),
    line3d([x0, y1, z0], [x0, y1, z1], es),
  ];
  view.add(...objs);
  return objs;
}

/** Evaluate a quadratic 3D Bezier curve at parameter t in [0, 1]. */
export function evalQuadBezier3D(a, mid, b, t) {
  const u = 1 - t;
  return [
    u * u * a[0] + 2 * u * t * mid[0] + t * t * b[0],
    u * u * a[1] + 2 * u * t * mid[1] + t * t * b[1],
    u * u * a[2] + 2 * u * t * mid[2] + t * t * b[2],
  ];
}

/** Add a glowing 3D Bezier energy arc with optional streaming photons. */
export function addPointerArc3D(
  view,
  a,
  b,
  color,
  { lift = 0.65, width = 3.0, glow = 8, pulseVal = null, phaseOffset = 0, opacity = 0.92 } = {},
) {
  const mid = [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, Math.max(a[2], b[2]) + lift];
  const objs = [
    curve3d((t) => evalQuadBezier3D(a, mid, b, t), 0, 1, {
      color,
      width,
      glow,
      blend: 'screen',
      samples: 36,
      opacity,
    }),
    point3d(a, { color: '#ffffff', radius: 4.8, glow: 8, blend: 'screen' }),
    point3d(b, { color, radius: 5.4, glow: 8, blend: 'screen' }),
  ];
  if (pulseVal) {
    objs.push(
      point3d(() => evalQuadBezier3D(a, mid, b, (pulseVal.value + phaseOffset) % 1), {
        color: '#ffffff',
        radius: 6.4,
        glow: 12,
        blend: 'screen',
      }),
      point3d(() => evalQuadBezier3D(a, mid, b, (pulseVal.value + phaseOffset + 0.5) % 1), {
        color,
        radius: 5.2,
        glow: 10,
        blend: 'screen',
      }),
    );
  }
  view.add(...objs);
  return objs;
}

/** Hide an array of Object3D/Node items initially. */
export function hideNodes(nodes) {
  for (const n of nodes) n.hide();
  return nodes;
}

/** Clamp an animation duration so it finishes strictly before `c.end - margin`. */
export function clampDur(c, startTime, desired, margin = 0.45) {
  const available = c.end - startTime - margin;
  if (available <= 0.08) return 0.08;
  return Math.min(desired, available);
}

/** Fade in an array of Object3D/Node items safely within scene end bounds. */
export function fadeInNodes(s, c, triggerTime, nodes, desired = 0.35) {
  const duration = clampDur(c, triggerTime, desired, 0.45);
  s.play(par(...nodes.map((n) => fadeIn(n, { duration }))));
}

/** Fade out an array of Object3D/Node items safely within scene end bounds. */
export function fadeOutNodes(s, c, triggerTime, nodes, desired = 0.3) {
  const duration = clampDur(c, triggerTime, desired, 0.45);
  s.play(par(...nodes.map((n) => fadeOut(n, { duration }))));
}

/** Non-overlapping crossfade curves for a 0 -> 1 mode value `v`. */
export const fadeOutHalf = (v) => Math.max(0, Math.min(1, 1 - v * 2.5));
export const fadeInHalf = (v) => Math.max(0, Math.min(1, (v - 0.6) * 2.5));

/** Schedule a continuous linear value drift bounded before `c.end - endMargin`. */
export function driftValue(s, c, val, target, { startOffset = 0.1, endMargin = 0.5 } = {}) {
  const span = Math.max(0.4, c.end - c.start - startOffset - endMargin);
  c.at(startOffset, () => {
    s.play(val.to(target, { duration: span, ease: linear }));
  });
  return span;
}

/** Evaluate a 2D quadratic Bezier curve into an array of sample points. */
export function quadArcPts(a, b, liftY = -80, steps = 28) {
  const mx = (a[0] + b[0]) * 0.5;
  const my = Math.min(a[1], b[1]) + liftY;
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

/** Glowing 2D vector arrow with screen blend. */
export function glowArrow(
  from,
  to,
  color = COSMOS.gold,
  { width = 3.6, tip = 14, glow = 8, opacity = 1 } = {},
) {
  const a = arrow(from, to, { stroke: color, width, tip }).set('blend', 'screen').opacity(opacity);
  if (glow > 0) a.glow(glow, color);
  return a;
}

/** Glowing horizontal progress / allocation bar with bright active fill. */
export function glowBar(
  xLeft,
  y,
  totalW,
  h,
  frac,
  {
    fill = COSMOS.cyan,
    bg = '#0e1528',
    border = '#29385d',
    glow = 8,
    radius = 9,
    opacity = 1,
  } = {},
) {
  const clamped = Math.max(0, Math.min(1, frac));
  const cx = xLeft + totalW * 0.5;
  const track = rect(totalW, h, { fill: bg, stroke: border, width: 1.8, radius })
    .at(cx, y)
    .opacity(opacity);
  if (clamped <= 0.004) return track;
  const innerW = Math.max(6, (totalW - 6) * clamped);
  const bar = rect(innerW, Math.max(6, h - 6), {
    fill,
    stroke: null,
    radius: Math.max(3, radius - 3),
  })
    .at(xLeft + 3 + innerW * 0.5, y)
    .opacity(0.9 * opacity);
  if (glow > 0) bar.glow(glow, fill);
  return group(track, bar);
}

/** Multi-segment horizontal glowing bar (for stacked input/read/output or spent/held/free). */
export function glowStackedBar(
  xLeft,
  y,
  totalW,
  h,
  segments,
  { bg = '#0e1528', border = '#29385d', radius = 9, opacity = 1, glow = 7 } = {},
) {
  const nodes = [
    rect(totalW, h, { fill: bg, stroke: border, width: 1.8, radius })
      .at(xLeft + totalW * 0.5, y)
      .opacity(opacity),
  ];
  let cursor = xLeft + 3;
  const usableW = totalW - 6;
  for (const seg of segments) {
    const f = Math.max(0, Math.min(1, seg.frac ?? 0));
    if (f <= 0.003) continue;
    const w = Math.max(5, usableW * f - 2);
    const r = rect(w, Math.max(6, h - 6), {
      fill: seg.color,
      stroke: null,
      radius: Math.max(3, radius - 4),
    })
      .at(cursor + w * 0.5, y)
      .opacity((seg.opacity ?? 0.9) * opacity);
    if (glow > 0) r.glow(glow, seg.color);
    nodes.push(r);
    cursor += usableW * f;
  }
  return group(...nodes);
}

/** Smooth glowing curve trail with optional animated traveling photon dots. */
export function beamWithPhotons(
  pts,
  color,
  phaseVal,
  { width = 3.6, glow = 10, photonCount = 2, alpha = 1 } = {},
) {
  const nodes = [glowingTrail(pts, { color, width, glow, opacity: 0.9 * alpha })];
  if (phaseVal !== null && phaseVal !== undefined && photonCount > 0) {
    const last = pts.length - 1;
    for (let i = 0; i < photonCount; i++) {
      const u = (phaseVal + i / photonCount) % 1;
      const idx = u * last;
      const k = Math.min(last - 1, Math.floor(idx));
      const f = idx - k;
      const px = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f;
      const py = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f;
      nodes.push(glowDot(px, py, { radius: 5.5, color: '#ffffff', glow: 12, opacity: alpha }));
    }
  }
  return group(...nodes);
}

/** Floating scene eyebrow + 2-line serif headline with generous spacing (>= 0.3 text-gap). */
export function cinemaHeader(
  eyebrow,
  line1,
  line2,
  { x = -860, y = -420, accent = COSMOS.cyan, size = 52, anchor = 'left' } = {},
) {
  const parts = [
    txt(eyebrow, x, y, 26, accent, 'mono', anchor),
    txt(line1, x, y + 64, size, COSMOS.ink, 'serif', anchor),
  ];
  if (line2) {
    parts.push(txt(line2, x, y + 138, size, accent, 'serif', anchor).glow(6, accent));
  }
  return group(...parts);
}

/** Subtle dashed separator / threshold line. */
export function dashedRule(
  x1,
  y1,
  x2,
  y2,
  color = '#2b3b60',
  { width = 2.0, dash = [7, 7], opacity = 0.72 } = {},
) {
  return line([x1, y1], [x2, y2], { stroke: color, width, dash }).opacity(opacity);
}

/** Luminous 30-night evaluation calendar (10 columns x 3 rows) with zero card chrome. */
export function buildNightCalendar({
  xLeft = -840,
  yTop = -135,
  colStep = 94,
  rowStep = 104,
  coldCount = 0,
  markedCount = 0,
  breachNight = 0,
  alpha = 1,
} = {}) {
  const nodes = [];
  for (let night = 1; night <= 30; night++) {
    const col = (night - 1) % 10;
    const row = Math.floor((night - 1) / 10);
    const cx = xLeft + col * colStep + 38;
    const cy = yTop + row * rowStep + 38;
    const isBreach = breachNight > 0 && night === breachNight;
    const isCold = night <= coldCount;
    const isMarked = night <= markedCount;
    const stroke = isBreach ? ROLE.breach : isMarked ? ROLE.cached : ROLE.batch;
    const fill = isBreach ? '#381322' : isCold ? '#342a12' : '#0f182e';
    const tile = rect(76, 76, {
      fill,
      stroke,
      width: isBreach || isMarked ? 2.8 : 1.8,
      radius: 12,
      ...(isMarked && !isCold && !isBreach ? { dash: [6, 5] } : {}),
    })
      .at(cx, cy)
      .opacity(alpha);
    if (isBreach) tile.glow(11, ROLE.breach);
    else if (isCold) tile.glow(8, ROLE.cached);
    else if (isMarked) tile.glow(6, ROLE.cached);
    nodes.push(
      tile,
      txt(
        String(night),
        cx,
        cy,
        28,
        isBreach ? ROLE.breach : isCold ? ROLE.cached : isMarked ? COSMOS.ink : ROLE.batch,
        'mono',
      ).opacity(alpha),
    );
  }
  return group(...nodes);
}
