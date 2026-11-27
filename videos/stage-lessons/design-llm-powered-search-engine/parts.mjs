// Shared cinema building blocks, semantic color roles, 3D helpers, and verified math
// invariants for the Designing an LLM-Powered Search Engine stage lesson (29 scenes).
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
  clamp,
  fuse,
  mix,
  rrfContributions,
  searchCosine,
  searchWords,
  sourceDigest,
  sum,
  wordCount,
} from '../../films/design-llm-powered-search-engine/arithmetic.mjs';
import {
  SEARCH_TEXT,
  exception,
  policy,
} from '../../films/design-llm-powered-search-engine/fixtures.mjs';
import {
  generalWindow,
  migrationDecision,
} from '../../films/design-llm-powered-search-engine/migration-window.mjs';
import {
  apply,
  checkedClocks,
  freshSearchState,
  fusionTeachingState,
  lexicalScores,
  publicationTeachingState,
  quoteReceipt,
  sampleModel,
  searchCapacity,
  searchMetrics,
  searchRoutePlan,
  sharedFleet,
  strictPublication,
  validateModel,
} from '../../films/design-llm-powered-search-engine/model.mjs';
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
  SEARCH_TEXT,
  apply,
  aura,
  checkedClocks,
  cinematic3d,
  clamp,
  exception,
  freshSearchState,
  fuse,
  fusionTeachingState,
  generalWindow,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lexicalScores,
  metricReadout,
  migrationDecision,
  mix,
  orbitScene,
  policy,
  publicationTeachingState,
  quoteReceipt,
  rrfContributions,
  rule,
  sampleModel,
  searchCapacity,
  searchCosine,
  searchMetrics,
  searchRoutePlan,
  searchWords,
  sharedFleet,
  sourceDigest,
  strictPublication,
  sum,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
  wordCount,
};

/**
 * Semantic color roles held constant across all 29 search-engine scenes:
 *   policy / lexical / primary  -> blue
 *   exception / valid / publish -> emerald
 *   query / dense / stream / kv -> cyan
 *   focus / clock / budget / rrf -> gold
 *   deny / stale / omit / fail  -> rose
 *   rewrite / model / rerank    -> violet
 *   pending / buffer / replay   -> amber
 */
export const ROLE = Object.freeze({
  policy: COSMOS.blue,
  lexical: COSMOS.blue,
  exception: COSMOS.emerald,
  valid: COSMOS.emerald,
  ok: COSMOS.emerald,
  query: COSMOS.cyan,
  dense: COSMOS.cyan,
  kv: COSMOS.cyan,
  stream: COSMOS.cyan,
  focus: COSMOS.gold,
  budget: COSMOS.gold,
  clock: COSMOS.gold,
  rrf: COSMOS.gold,
  deny: COSMOS.rose,
  stale: COSMOS.rose,
  fail: COSMOS.rose,
  rewrite: COSMOS.violet,
  model: COSMOS.violet,
  rerank: COSMOS.violet,
  pending: COSMOS.amber,
  caution: COSMOS.amber,
  replay: COSMOS.amber,
});

export const CAPACITY_DATA = searchCapacity();
export const CLOCK_OVERLAP = checkedClocks({ dependent: false });
export const CLOCK_DEPENDENT = checkedClocks({ dependent: true });
export const ECON_ROUTES = sampleModel('economics', { beat: 0, beatP: 0 }).routes;
export const ECON_BASE_MEAN = sum(ECON_ROUTES.map((r) => r.share * r.cost));
export const ECON_REROUTED_MEAN =
  0.7 * ECON_ROUTES[0].cost + 0.2 * ECON_ROUTES[1].cost + 0.1 * ECON_ROUTES[2].cost;
export const ECON_DELTA = ECON_ROUTES[0].cost - ECON_ROUTES[1].cost;
export const ROUTE_MODEL_COST = ((1500 + 400) * 3) / 1e6;
export const ROUTE_FULL_COST = ROUTE_MODEL_COST + 0.002 + 0.001 + 0.001;
export const MINUTE_COST = ECON_BASE_MEAN * 1000 * 60;

export const LEXICAL_QUERY = 'parser-v2 SDK migration policy for service-account exceptions';
export const LEXICAL_DOCS = Object.freeze([
  { id: 'Policy', text: SEARCH_TEXT.policy },
  { id: 'Exception', text: SEARCH_TEXT.exception },
]);
export const LEXICAL_RESULTS = lexicalScores(LEXICAL_QUERY, LEXICAL_DOCS);

export const IDF_ELIGIBLE = Math.log(1 + (2 - 1 + 0.5) / (1 + 0.5));
export const IDF_GLOBAL = Math.log(1 + (4 - 1 + 0.5) / (1 + 0.5));

export const RRF_BASE_LISTS = Object.freeze([
  ['Policy', 'Policy', 'Exception'],
  ['Exception', 'Policy'],
]);
export const RRF_BASE_ROWS = rrfContributions(RRF_BASE_LISTS, 60);
export const RRF_TIE_SCORE = 1 / 61 + 1 / 62;
export const RRF_THREE_SCORES = fuse([
  ['Policy', 'Exception'],
  ['Exception', 'Policy'],
  ['Exception', 'Policy'],
]);

export const PACK_EXCEPTION_WORDS = wordCount(exception);
export const PACK_POLICY_WORDS = wordCount(policy);
export const PACK_TOTAL_WORDS = PACK_EXCEPTION_WORDS + PACK_POLICY_WORDS;
export const PACK_INITIAL_BUDGET = 18;
export const PACK_EXTRA_WORDS = PACK_TOTAL_WORDS - PACK_INITIAL_BUDGET;

export const EXCEPTION_CUT_72 = SEARCH_TEXT.exception.indexOf(' only');
export const FRESH_CUT_BEFORE_RECORDED = SEARCH_TEXT.fresh.indexOf(' recorded');

export const METRICS_HALF = searchMetrics(['Policy', 'FAQ'], ['Policy', 'Exception'], 2);
export const METRICS_FULL = searchMetrics(['Policy', 'Exception'], ['Policy', 'Exception'], 2);

/** Build-time mathematical invariant suite covering every spoken and displayed number. */
export function verifySearchEngineInvariants() {
  verifyInvariant(validateModel() === true, 'original search-engine model validates');

  // Migration window decisions (intro & fresh-search)
  verifyInvariant(generalWindow === 30, 'general migration window is 30 days');
  const dIntroPending = migrationDecision(1, 45, { granted: false });
  verifyInvariant(dIntroPending.deadline === 30 && !dIntroPending.fits, 'pending -> 30d outside');
  const dIntroGranted = migrationDecision(1, 45, { granted: true });
  verifyInvariant(dIntroGranted.deadline === 60 && dIntroGranted.fits, 'granted -> 60d inside');
  const dFreshFri = migrationDecision(2, 40, { granted: true, beforeFriday: false });
  verifyInvariant(dFreshFri.deadline === 30 && !dFreshFri.fits, 'Friday approval -> 30d outside');
  const dFreshThu = migrationDecision(2, 40, { granted: true, beforeFriday: true });
  verifyInvariant(dFreshThu.deadline === 45 && dFreshThu.fits, 'Thursday approval -> 45d inside');

  // Normalized text spans and offsets
  verifyInvariant(SEARCH_TEXT.policy.length === 80, 'policy@2 length is 80 chars');
  verifyInvariant(SEARCH_TEXT.exception.length === 101, 'exception@1 length is 101 chars');
  verifyInvariant(SEARCH_TEXT.fresh.length === 124, 'exception@2 length is 124 chars');
  verifyInvariant(EXCEPTION_CUT_72 === 72, 'exception@1 cut before only is offset 72');
  verifyInvariant(FRESH_CUT_BEFORE_RECORDED === 100, 'exception@2 cut before recorded is 100');
  verifyInvariant(
    Buffer.byteLength('<p>' + SEARCH_TEXT.policy.slice(0, 12)) === 15,
    'HTML <p> shifts char 12 to raw byte 15',
  );
  verifyInvariant(
    sourceDigest(SEARCH_TEXT.exception) !== sourceDigest(SEARCH_TEXT.fresh),
    'revised exception produces distinct SHA-256 digest',
  );

  // Authority scope IDF side-channel
  verifyApprox(IDF_ELIGIBLE, 0.693147, 1e-5, 'eligible N=2 IDF for df=1');
  verifyApprox(IDF_GLOBAL, 1.203973, 1e-5, 'global N=4 IDF for df=1');

  // Source router and HyDE cosine
  const plan = searchRoutePlan('build-1042 status and current migration policy');
  verifyInvariant(
    plan.routes.includes('authorized live API') &&
      plan.routes.includes('authorized hybrid search') &&
      plan.current === true,
    'router opens both live API and hybrid search with current=true',
  );
  verifyApprox(searchCosine([0.5, 1], [0.5, 1]), 1.0, 1e-9, 'HyDE cos(h, exception) = 1.0');
  verifyApprox(searchCosine([0.5, 1], [1, 0.5]), 0.8, 1e-9, 'HyDE cos(h, policy) = 0.8');

  // Retrieval arithmetic (BM25 + cosine tie)
  verifyInvariant(LEXICAL_RESULTS[0].terms[0].term === 'parser-v2', 'first query term parser-v2');
  verifyInvariant(
    LEXICAL_RESULTS[0].terms[0].tf === 1 && LEXICAL_RESULTS[1].terms[0].tf === 0,
    'only policy contains parser-v2',
  );
  verifyInvariant(
    LEXICAL_RESULTS[0].score > LEXICAL_RESULTS[1].score,
    'BM25 ranks policy above exception',
  );
  verifyApprox(
    searchCosine([1, 1], [1, 0.5]),
    1.5 / Math.sqrt(2 * 1.25),
    1e-9,
    'policy cosine 1.5 / sqrt(2.5)',
  );
  verifyApprox(
    searchCosine([1, 1], [0.5, 1]),
    searchCosine([1, 1], [1, 0.5]),
    1e-12,
    'policy and exception cosine scores tie',
  );
  verifyInvariant(searchCosine([0, 0], [1, 1]) === 0, 'zero-norm vector returns 0');

  // RRF fusion
  const baseFused = fuse(RRF_BASE_LISTS);
  verifyApprox(baseFused.Policy, RRF_TIE_SCORE, 1e-12, 'RRF policy 1/61 + 1/62');
  verifyApprox(baseFused.Exception, RRF_TIE_SCORE, 1e-12, 'RRF exception 1/61 + 1/62');
  verifyApprox(RRF_THREE_SCORES.Exception, 1 / 61 + 1 / 62 + 1 / 61, 1e-12, '3-branch exception');
  verifyApprox(RRF_THREE_SCORES.Policy, 1 / 61 + 1 / 62 + 1 / 62, 1e-12, '3-branch policy');
  verifyInvariant(
    RRF_THREE_SCORES.Exception > RRF_THREE_SCORES.Policy,
    'rewrite branch breaks tie in favor of exception',
  );

  // Word budget packing
  verifyInvariant(PACK_EXCEPTION_WORDS === 15, 'exception has 15 regex words');
  verifyInvariant(PACK_POLICY_WORDS === 12, 'policy has 12 regex words');
  verifyInvariant(PACK_TOTAL_WORDS === 27, 'total words = 27');
  verifyInvariant(PACK_EXTRA_WORDS === 9, '9 more words needed beyond 18');

  // Exact span & publication receipts
  verifyInvariant(
    !quoteReceipt(SEARCH_TEXT.exception, 1, { end: EXCEPTION_CUT_72 }).valid,
    'shortened [0,72) exception receipt invalid',
  );
  verifyInvariant(quoteReceipt(SEARCH_TEXT.exception, 1).valid, 'full exception receipt valid');
  verifyInvariant(
    !quoteReceipt(SEARCH_TEXT.policy, 2, { current: 3 }).valid,
    'stale policy@2 against current@3 invalid',
  );
  verifyInvariant(!freshSearchState(0).valid, 'Pack A stale exception invalid');
  verifyInvariant(!freshSearchState(1).valid, 'Pack B shortened exception@2 invalid');
  verifyInvariant(freshSearchState(2).valid, 'Complete current exception@2 pack valid');

  // Typed reducer & verdict gate
  const baseEv = {
    id: 7,
    revision: 2,
    request: 'request-a',
    draft: 'draft-2',
    kind: 'check',
    accepted: true,
  };
  const mal = strictPublication([
    { ...baseEv, id: true },
    { ...baseEv, id: 4, revision: 2.5 },
    { ...baseEv, id: 5, accepted: 1 },
    { ...baseEv, id: 6, accepted: 'false' },
  ]);
  verifyInvariant(
    mal.emitted === 0 && mal.decisions.every((d) => d.reason === 'malformed'),
    'all 4 malformed events rejected',
  );
  const trace = strictPublication([
    { ...baseEv, id: 3, draft: 'draft-1', revision: 1 },
    baseEv,
    { ...baseEv },
    { ...baseEv, id: 8, accepted: false },
  ]);
  verifyInvariant(
    trace.status === 'checked' &&
      trace.emitted === 1 &&
      trace.decisions.map((d) => d.reason).join(',') === 'stale,checked,duplicate,inert',
    'typed reducer trace stale -> checked -> duplicate -> inert',
  );

  // Latency clocks
  verifyInvariant(
    CLOCK_OVERLAP.draft === 800 && CLOCK_OVERLAP.checked === 980,
    'overlap clocks: 800ms draft, 980ms checked',
  );
  verifyInvariant(
    CLOCK_DEPENDENT.draft === 840 && CLOCK_DEPENDENT.checked === 1020,
    'dependent clocks: 840ms draft, 1020ms checked',
  );

  // Capacity & KV tensor
  verifyInvariant(CAPACITY_DATA.inflight === 1500, '1500 in-flight requests');
  verifyInvariant(CAPACITY_DATA.resident === 1158, '1158 KV-resident requests');
  verifyInvariant(CAPACITY_DATA.bytesPerPosition === 131072, '131072 bytes/position');
  verifyApprox(CAPACITY_DATA.gib, 220.52, 0.01, '220.52 GiB total KV');
  verifyInvariant(CAPACITY_DATA.memory === 19, '19 memory-bound devices');
  verifyInvariant(CAPACITY_DATA.decode === 12, '12 decode-throughput devices');

  // Economics & route costs
  verifyApprox(ROUTE_MODEL_COST, 0.0057, 1e-9, 'model cost $0.0057');
  verifyApprox(ROUTE_FULL_COST, 0.0097, 1e-9, 'full route cost $0.0097');
  verifyApprox(ECON_BASE_MEAN, 0.00601, 1e-9, 'baseline mean $0.00601 (0.601c)');
  verifyApprox(ECON_REROUTED_MEAN, 0.00695, 1e-9, 'rerouted mean $0.00695 (0.695c)');
  verifyApprox(ECON_DELTA, 0.0094, 1e-9, 'reroute delta 0.94c');
  verifyApprox(MINUTE_COST, 360.6, 1e-6, '$360.60 per minute at 1000 req/s');

  // Labeled retrieval metrics
  verifyApprox(METRICS_HALF.recall, 0.5, 1e-9, 'Policy+FAQ recall = 0.5');
  verifyApprox(METRICS_HALF.ndcg, 0.613147, 1e-4, 'Policy+FAQ nDCG = 0.6131');
  verifyApprox(METRICS_FULL.recall, 1.0, 1e-9, 'Policy+Exception recall = 1.0');
  verifyApprox(METRICS_FULL.ndcg, 1.0, 1e-9, 'Policy+Exception nDCG = 1.0');
  verifyInvariant(
    searchMetrics(['Policy'], [], 2).recall === null,
    'empty gold set returns null (not applicable)',
  );
}

/** Floating cinematic header without top banner bar, horizontal divider, or card chrome. */
export function cinemaHeader(
  eyebrow,
  line1,
  line2,
  { x = -860, y = -445, accent = COSMOS.cyan, size = 48, anchor = 'left' } = {},
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

export function clampDur(c, startTime, desired, margin = 0.45) {
  const available = c.end - startTime - margin;
  if (available <= 0.08) return 0.08;
  return Math.min(desired, available);
}

export const fadeOutHalf = (v) => Math.max(0, Math.min(1, 1 - v * 2.5));
export const fadeInHalf = (v) => Math.max(0, Math.min(1, (v - 0.6) * 2.5));

export function driftValue(s, c, val, target, { startOffset = 0.1, endMargin = 0.5 } = {}) {
  const span = Math.max(0.4, c.end - c.start - startOffset - endMargin);
  c.at(startOffset, () => {
    s.play(val.to(target, { duration: span, ease: linear }));
  });
  return span;
}

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
    .opacity(0.92 * opacity);
  if (glow > 0) bar.glow(glow, fill);
  return group(track, bar);
}

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

export function beamWithPhotons(pts, color, _phaseVal, { width = 3.4, glow = 9, alpha = 1 } = {}) {
  return glowingTrail(pts, { color, width, glow, opacity: 0.9 * alpha });
}

export function trimSeg(a, b, padA = 44, padB = 44) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [
    [a[0] + (dx / len) * padA, a[1] + (dy / len) * padA],
    [b[0] - (dx / len) * padB, b[1] - (dy / len) * padB],
  ];
}

export function orbNode(
  x,
  y,
  label,
  color,
  { radius = 48, sub = null, opacity = 1, glow = 8, size = 26 } = {},
) {
  const r = Math.max(radius, Math.ceil(String(label).length * 9.5 + 22));
  const parts = [
    circle(r, { fill: '#0b1224', stroke: color, width: 3.4 })
      .at(x, y)
      .glow(glow, color)
      .opacity(opacity),
    txt(label, x, y, size, color, 'mono', 'center').opacity(opacity),
  ];
  if (sub) {
    parts.push(txt(sub, x, y + r + 38, 26, COSMOS.muted, 'mono', 'center').opacity(opacity));
  }
  return group(...parts);
}

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
  { faceOpacity = 0.78, edgeWidth = 2.0, edgeGlow = 6, edgeOpacity = 0.92, blend = 'screen' } = {},
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
    curve3d(evalPt, 0, 1, { color, width, glow, blend: 'screen', samples: 32, opacity }),
    point3d(a, { color: '#ffffff', radius: 4.8, glow: 8, blend: 'screen' }),
    point3d(b, { color, radius: 5.4, glow: 8, blend: 'screen' }),
  ];
  if (pulseVal) {
    objs.push(
      point3d(() => evalPt((pulseVal.value + phaseOffset) % 1), {
        color: '#ffffff',
        radius: 6.2,
        glow: 10,
        blend: 'screen',
      }),
    );
  }
  view.add(...objs);
  return objs;
}

/**
 * Reusable luminous migration-window ruler shared by `intro` and `fresh-search`.
 * Geometry sits cleanly around `rulerY` with generous vertical separation so no text collides.
 */
export function buildMigrationRulerNodes({
  decision,
  rulerY = 140,
  x0 = -760,
  x1 = 760,
  baseFrac = 1,
  offerFrac = 1,
  extFrac = 0,
  recordText = '',
  recordColor = COSMOS.muted,
  bottomText = '',
  bottomColor = ROLE.focus,
  showVerdict = false,
  showRuleLabels = false,
}) {
  const nodes = [];
  const mapDay = (day) => x0 + (day / 60) * (x1 - x0);
  const bandH = 54;
  const xProp = mapDay(decision.proposedDay);
  const x30 = mapDay(generalWindow);
  const xExc = mapDay(decision.exceptionDays);

  // Base ruler rail and ticks
  nodes.push(line([x0, rulerY + 38], [x1, rulerY + 38], { stroke: '#3a4f7c', width: 3 }));
  for (const day of [0, 15, 30, 45, 60]) {
    const tx = mapDay(day);
    nodes.push(
      line([tx, rulerY + 38], [tx, rulerY + 54], { stroke: '#5570a8', width: 2.5 }),
      txt(
        day === 0 ? 'Notice (day 0)' : `day ${day}`,
        tx,
        rulerY + 86,
        26,
        COSMOS.muted,
        'mono',
        day === 0 ? 'left' : day === 60 ? 'right' : 'center',
      ),
    );
  }

  // Proposed start day pin (gold)
  nodes.push(
    line([xProp, rulerY - 62], [xProp, rulerY - 28], { stroke: ROLE.focus, width: 4 }).glow(
      8,
      ROLE.focus,
    ),
    glowDot(xProp, rulerY - 28, { radius: 6, color: ROLE.focus, glow: 10 }),
    txt(
      `Proposed start: day ${decision.proposedDay}`,
      xProp,
      rulerY - 94,
      30,
      ROLE.focus,
      'mono',
      'center',
    ).glow(6, ROLE.focus),
  );

  // Base 30-day policy band (blue)
  if (baseFrac > 0.02) {
    const w = Math.max(8, (x30 - x0) * baseFrac);
    nodes.push(
      rect(w, bandH, { fill: ROLE.policy, stroke: '#93c5fd', width: 1.5, radius: 7 })
        .at(x0 + w * 0.5, rulerY)
        .glow(8, ROLE.policy)
        .opacity(0.88),
    );
    if (showRuleLabels) {
      nodes.push(
        txt(`policy@2: ${generalWindow} days`, x0, rulerY + 132, 26, ROLE.policy, 'mono', 'left'),
      );
    }
  }

  // Conditional exception band (hollow outline -> emerald fill when granted)
  if (offerFrac > 0.02) {
    const startX = x30 + 6;
    const fullW = Math.max(12, xExc - startX);
    const curW = Math.max(10, fullW * offerFrac);
    nodes.push(
      rect(curW, bandH, {
        fill: '#0b1824',
        stroke: ROLE.exception,
        width: 3,
        dash: extFrac > 0.85 ? undefined : [8, 6],
        radius: 7,
      })
        .at(startX + curW * 0.5, rulerY)
        .opacity(0.92),
    );
    if (extFrac > 0.02) {
      const fw = Math.max(8, (fullW - 4) * extFrac);
      nodes.push(
        rect(fw, bandH - 6, { fill: ROLE.exception, stroke: null, radius: 5 })
          .at(startX + 2 + fw * 0.5, rulerY)
          .glow(10, ROLE.exception)
          .opacity(0.9),
      );
    }
    if (showRuleLabels) {
      const label =
        decision.revision === 2
          ? `exception@2: ${decision.exceptionDays} days (before Friday)`
          : `exception@1: ${decision.exceptionDays} days (with approval)`;
      nodes.push(txt(label, x30 + 10, rulerY + 132, 26, ROLE.exception, 'mono', 'left'));
    }
  }

  // Approval record status line
  if (recordText) {
    nodes.push(
      txt(recordText, x0, rulerY + (showRuleLabels ? 192 : 158), 30, recordColor, 'mono', 'left'),
    );
  }

  // Verdict or prediction prompt
  if (showVerdict) {
    const col = decision.fits ? ROLE.ok : ROLE.deny;
    const msg = decision.fits
      ? `Day ${decision.proposedDay} is INSIDE the ${decision.deadline}-day window`
      : `Day ${decision.proposedDay} is OUTSIDE the ${decision.deadline}-day window`;
    nodes.push(
      txt(msg, x0, rulerY + (showRuleLabels ? 256 : 230), 38, col, 'serif', 'left').glow(8, col),
      txt(
        `APPLICABLE DEADLINE: DAY ${decision.deadline}`,
        x1,
        rulerY + (showRuleLabels ? 256 : 230),
        28,
        col,
        'mono',
        'right',
      ),
    );
  } else if (bottomText) {
    nodes.push(
      txt(
        bottomText,
        x0,
        rulerY + (showRuleLabels ? 256 : 230),
        36,
        bottomColor,
        'serif',
        'left',
      ).glow(6, bottomColor),
    );
  }

  return nodes;
}

/**
 * Reusable normalized character-offset ribbon for `exact-span` and `fresh-search`.
 * Keeps all text strings completely static (zero per-frame string slicing -> zero `text_brief`)
 * while smoothly animating the glowing highlight bar and bottom cursor pin.
 */
export function buildSpanRibbonNodes({
  textValue,
  revision,
  endOffset,
  displayEnd = endOffset,
  topY = -180,
  xLeft = -700,
  charW = 20.0,
}) {
  const nodes = [];
  const digest = sourceDigest(textValue).slice(0, 12);
  const starts = [0, textValue.indexOf(' within ') + 1, textValue.indexOf(' only ') + 1];
  const recordedSplit = textValue.indexOf(' recorded');

  nodes.push(
    txt(
      `ORIGINAL NORMALIZED TEXT: exception@${revision}`,
      -840,
      topY - 56,
      28,
      ROLE.query,
      'mono',
      'left',
    ),
    txt(`SHA-256 ${digest}...`, 840, topY - 56, 26, COSMOS.muted, 'mono', 'right'),
  );

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const stop = starts[i + 1] === undefined ? textValue.length : starts[i + 1] - 1;
    const rowY = topY + i * 86;
    const lineText = textValue.slice(start, stop);
    const count = Math.min(lineText.length, Math.max(0, endOffset - start));
    const selW = count * charW;

    nodes.push(txt(String(start), xLeft - 40, rowY, 26, COSMOS.dim, 'mono', 'right'));

    // Glowing highlight backdrop behind selected prefix (stroke: null so moving edge never crosses glyphs!)
    if (count > 0) {
      nodes.push(
        rect(selW + 12, 50, {
          fill: '#16374d',
          stroke: null,
          radius: 7,
        })
          .at(xLeft + selW * 0.5, rowY)
          .opacity(0.92),
      );
    }

    // Static text segments (split row 2 of exception@2 at static " recorded" boundary)
    if (i === 2 && recordedSplit > start) {
      const firstPart = textValue.slice(start, recordedSplit);
      const secondPart = textValue.slice(recordedSplit, stop);
      const tailIncluded = endOffset >= stop - 2;
      nodes.push(
        txt(firstPart, xLeft + 6, rowY, 30, COSMOS.ink, 'mono', 'left'),
        txt(
          secondPart,
          xLeft + 6 + firstPart.length * charW,
          rowY,
          30,
          tailIncluded ? COSMOS.ink : ROLE.deny,
          'mono',
          'left',
        ),
      );
    } else {
      const rowIncluded = count >= lineText.length - 1;
      nodes.push(
        txt(lineText, xLeft + 6, rowY, 30, rowIncluded ? COSMOS.ink : ROLE.deny, 'mono', 'left'),
      );
    }

    // Bottom cursor pin positioned cleanly below text baseline (never crosses text!)
    if (endOffset >= start && endOffset <= stop) {
      const cx = xLeft + selW + (count > 0 ? 6 : 0);
      nodes.push(
        line([cx, rowY + 28], [cx, rowY + 46], { stroke: ROLE.focus, width: 4 }).glow(
          8,
          ROLE.focus,
        ),
        glowDot(cx, rowY + 46, { radius: 5, color: ROLE.focus, glow: 9 }),
      );
    }
  }

  nodes.push(
    txt(`SELECTED SPAN: [0, ${displayEnd})`, -840, topY + 260, 28, ROLE.query, 'mono', 'left'),
    txt(
      `${textValue.length} chars in exception@${revision}`,
      840,
      topY + 260,
      26,
      COSMOS.muted,
      'mono',
      'right',
    ),
  );

  return nodes;
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
