// Shared cinema building blocks, semantic color roles, 3D helpers, and verified math
// invariants for the Structured Generation narrated stage lesson (30 scenes).
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
import { stableSoftmax } from 'vizmatic';
import {
  maskStepTime,
  normalizedWeights,
  retryBudget,
} from '../../films/structured-generation/arithmetic.mjs';
import {
  maskScheduleClock,
  recursiveConstructionState,
} from '../../films/structured-generation/construction.mjs';
import {
  CI_RUN,
  EOS,
  FAIL_PREFIX,
  LANGUAGE,
  OPENING_REPLIES,
  RUN_LOG,
  SUFFIX,
  TOKEN_SCORES,
  VALUE_PREFIX,
} from '../../films/structured-generation/fixtures.mjs';
import {
  ciOutcome,
  decode,
  digestIdentity,
  legal,
  masked,
  nullableRecord,
  rankedSteps,
  recursiveCandidate,
  recursivePrefix,
  tokenTrace,
  treeRelationships,
} from '../../films/structured-generation/model.mjs';
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
  CI_RUN,
  COSMOS,
  EOS,
  FAIL_PREFIX,
  LANGUAGE,
  OPENING_REPLIES,
  RUN_LOG,
  SUFFIX,
  TOKEN_SCORES,
  VALUE_PREFIX,
  aura,
  ciOutcome,
  cinematic3d,
  decode,
  digestIdentity,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  legal,
  maskScheduleClock,
  maskStepTime,
  masked,
  metricReadout,
  normalizedWeights,
  nullableRecord,
  orbitScene,
  rankedSteps,
  recursiveCandidate,
  recursiveConstructionState,
  recursivePrefix,
  retryBudget,
  rule,
  stableSoftmax,
  tokenTrace,
  treeRelationships,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
};

/**
 * Semantic color roles held constant across all 30 structured-generation scenes:
 *   legal / ok / commit / allow      -> emerald
 *   fsm / token / stream / active    -> cyan
 *   schema / host / gpu              -> blue
 *   prefix / focus / mask / stack    -> gold
 *   prune / reject / deny / error    -> rose
 *   review / caution / retry         -> amber
 *   cfg / pda / trie / envelope      -> violet
 */
export const ROLE = Object.freeze({
  legal: COSMOS.emerald,
  ok: COSMOS.emerald,
  commit: COSMOS.emerald,
  allow: COSMOS.emerald,
  fsm: COSMOS.cyan,
  token: COSMOS.cyan,
  stream: COSMOS.cyan,
  active: COSMOS.cyan,
  schema: COSMOS.blue,
  host: COSMOS.blue,
  gpu: COSMOS.blue,
  prefix: COSMOS.gold,
  focus: COSMOS.gold,
  mask: COSMOS.gold,
  stack: COSMOS.gold,
  warn: COSMOS.gold,
  prune: COSMOS.rose,
  reject: COSMOS.rose,
  deny: COSMOS.rose,
  error: COSMOS.rose,
  review: COSMOS.amber,
  caution: COSMOS.amber,
  retry: COSMOS.amber,
  cfg: COSMOS.violet,
  pda: COSMOS.violet,
  trie: COSMOS.violet,
  envelope: COSMOS.violet,
});

// Verified fixtures & derived values shared across scenes.
export const FIRST_TOKENS = Object.freeze(['The', '{', 'Sure', 'JSON']);
export const FIRST_LOGITS = Object.freeze([0.45, 0.3, 0.15, 0.1]);
export const FIRST_RAW_PROBS = Object.freeze(stableSoftmax([...FIRST_LOGITS]));
export const FIRST_MASKED_PROBS = Object.freeze(masked([...FIRST_LOGITS], '', [...FIRST_TOKENS]));

export const COND_TOKENS = Object.freeze(['passed', 'fa', 'chatty']);
export const COND_WEIGHTS = Object.freeze([2, 3, 5]);
export const COND_ALLOWED = Object.freeze(
  COND_TOKENS.flatMap((token, i) => (legal(VALUE_PREFIX, token) ? [i] : [])),
);
export const COND_PROBS = Object.freeze(normalizedWeights([...COND_WEIGHTS], [...COND_ALLOWED]));
export const BRANCH_DOUBLED_PROBS = Object.freeze(normalizedWeights([2, 6], [0, 1]));

export const SHOP_TRIAL = Object.freeze({
  name: 'Shop status',
  language: Object.freeze(['{"status":"open"}', '{"status":"closed"}']),
  prefix: VALUE_PREFIX + 'clo',
  suffix: 'sed"}',
});

export const CI_TRIAL = Object.freeze({
  name: 'CI token index',
  language: LANGUAGE,
  prefix: FAIL_PREFIX,
  suffix: SUFFIX,
  nextBuffer: rankedSteps(3).join(''),
});

export const DECODER_STEPS_4 = Object.freeze(rankedSteps(4));
export const DECODER_STEPS_3 = Object.freeze(rankedSteps(3));

export const RETRY_LIMITS = Object.freeze({
  status: 'length',
  output: 500,
  modelLimit: 600,
  call: 3,
  validation: 1,
  spent: 4,
  cost: 3,
  deadline: 12,
  limit: 8,
});

export const RETRY_CASE_A = Object.freeze(retryBudget({ ...RETRY_LIMITS, elapsed: 7 }));
export const RETRY_CASE_B = Object.freeze(retryBudget({ ...RETRY_LIMITS, elapsed: 8.5 }));

export const MASK_METRICS = Object.freeze({
  xgrammarUs: 40,
  tokPerSec: 100,
  usPerTok: 1_000_000 / 100,
  sharePct: (40 / (1_000_000 / 100)) * 100,
});

export const FRESH_INCIDENT = Object.freeze({
  project: 'project-gamma',
  altScope: 'project-delta',
  record: Object.freeze({ run_id: 'RUN-915', status: 'failed', failing_job: null }),
  snapshot: Object.freeze({ 'project-gamma/RUN-915': 'failed' }),
  proposal: Object.freeze({ run_id: 'RUN-915', action: 'rollback', approved: true }),
  approvals: Object.freeze([]),
});

/** Build-time mathematical invariant suite covering every displayed value in structured-generation. */
export function verifyStructuredGenerationInvariants() {
  // Opening replies: A crashes json.loads, B parses as passed != CI failed
  let aCrashed = false;
  try {
    JSON.parse(OPENING_REPLIES[0]);
  } catch {
    aCrashed = true;
  }
  verifyInvariant(aCrashed, 'Opening reply A fails JSON.parse');
  verifyInvariant(
    JSON.parse(OPENING_REPLIES[1]).status === 'passed' && CI_RUN.status === 'failed',
    'Opening reply B says passed while CI_RUN says failed',
  );

  // Prefix & logit mask
  verifyInvariant(
    legal('', '{') && !legal('', 'The') && !legal('', 'Sure'),
    'Only { starts record',
  );
  verifyInvariant(!legal('', ''), 'Empty token is illegal');
  verifyInvariant(!legal(FAIL_PREFIX, EOS), 'EOS illegal before closing brace');
  verifyInvariant(legal(LANGUAGE[1], EOS), 'EOS legal at complete failed record');
  verifyApprox(FIRST_MASKED_PROBS[1], 1.0, 1e-12, 'Masked { prob = 1.0');
  verifyApprox(
    FIRST_RAW_PROBS.reduce((a, b) => a + b, 0),
    1.0,
    1e-12,
    'Raw softmax sums to 1',
  );

  // Conditional mask & branch doubling
  verifyApprox(COND_PROBS[0], 0.4, 1e-12, 'passed gets 40%');
  verifyApprox(COND_PROBS[1], 0.6, 1e-12, 'fa gets 60%');
  verifyApprox(COND_PROBS[2], 0.0, 1e-12, 'chatty gets 0%');
  verifyApprox(BRANCH_DOUBLED_PROBS[0], 0.25, 1e-12, 'doubled fa -> passed 25%');
  verifyApprox(BRANCH_DOUBLED_PROBS[1], 0.75, 1e-12, 'doubled fa -> fa 75%');

  // Whole token & decoder steps
  verifyInvariant(
    legal(SHOP_TRIAL.prefix, SHOP_TRIAL.suffix, SHOP_TRIAL.language) &&
      !legal(SHOP_TRIAL.prefix, SHOP_TRIAL.suffix + '!', SHOP_TRIAL.language),
    'Shop token sed"} accepted, sed"}! rejected',
  );
  verifyInvariant(tokenTrace(SUFFIX, SUFFIX.length).complete, 'CI suffix completes failed record');
  verifyInvariant(!tokenTrace(SUFFIX + '!', SUFFIX.length + 1).possible, 'CI suffix! fails on !');
  verifyInvariant(
    DECODER_STEPS_4.length === 4 && DECODER_STEPS_4[3] === EOS,
    '4-step decode finishes with EOS',
  );
  verifyInvariant(decode(DECODER_STEPS_4) === LANGUAGE[1], '4-step decode returns failed record');
  let budgetFailed = false;
  try {
    decode(DECODER_STEPS_3);
  } catch {
    budgetFailed = true;
  }
  verifyInvariant(budgetFailed, '3-step decode raises budget error');

  // Recursive stack & fresh nesting
  for (const depth of [3, 4]) {
    const p = '{"child":'.repeat(depth - 1) + '{';
    const good = recursiveCandidate(p, '}'.repeat(depth));
    verifyInvariant(
      good.accepted && good.committedFrames.length === 0 && good.eosAfter,
      `depth ${depth} closes`,
    );
  }
  const freshState = recursiveConstructionState(true, 1, 1);
  verifyInvariant(
    freshState.depth === 4 &&
      freshState.accepted &&
      freshState.rejected &&
      freshState.committed.frames.length === 0,
    'fresh nesting state verified',
  );

  // Mask schedule timing
  verifyInvariant(maskStepTime(8, 3, 1, false) === 12, 'serial 8+3+1 = 12 ms');
  verifyInvariant(maskStepTime(8, 3, 1, true) === 9, 'overlapped max(8,3)+1 = 9 ms');
  verifyInvariant(maskStepTime(8, 10, 1, true) === 11, 'slow mask max(8,10)+1 = 11 ms');

  // Nullable record, CI snapshot, flat tree, digest identities, retry budget, mask cost
  verifyInvariant(
    nullableRecord({ run_id: 'RUN-916', status: 'failed', failing_job: null }) &&
      !nullableRecord({ run_id: 'RUN-916', status: 'failed' }),
    'nullableRecord requires failing_job key and permits null',
  );
  const snap = { [CI_RUN.project + '/' + CI_RUN.run_id]: CI_RUN.status };
  verifyInvariant(
    ciOutcome(
      { project: 'project-beta', run_id: 'RUN-842', status: 'failed' },
      CI_RUN.project,
      snap,
    ).outcome === 'deny',
    'project-beta denied before lookup',
  );
  verifyInvariant(
    ciOutcome(
      { project: 'project-alpha', run_id: 'RUN-842', status: 'passed' },
      CI_RUN.project,
      snap,
    ).outcome === 'review',
    'project-alpha passed contradicts CI -> review',
  );
  verifyInvariant(
    ciOutcome(
      { project: 'project-alpha', run_id: 'RUN-842', status: 'failed' },
      CI_RUN.project,
      snap,
    ).outcome === 'show snapshot',
    'project-alpha failed matches CI -> show snapshot',
  );
  verifyInvariant(
    treeRelationships([
      { id: 'root', parent: null },
      { id: 'n1', parent: 'root' },
      { id: 'n2', parent: 'root' },
    ]).valid &&
      !treeRelationships([
        { id: 'root', parent: null },
        { id: 'a', parent: 'b' },
        { id: 'b', parent: 'a' },
      ]).valid,
    'flat tree valid vs disconnected cycle',
  );
  verifyInvariant(
    !digestIdentity([{ service: 'auth-api' }, { service: 'auth-api' }], ['auth-api']).valid,
    'duplicate auth-api rejected',
  );
  verifyApprox(MASK_METRICS.sharePct, 0.4, 1e-12, '40 us / 10000 us = 0.4%');
  verifyInvariant(
    RETRY_CASE_A.allowed &&
      RETRY_CASE_A.totalTime === 11 &&
      !RETRY_CASE_B.allowed &&
      RETRY_CASE_B.totalTime === 12.5,
    'retry budget A=11s allowed, B=12.5s denied',
  );
  verifyInvariant(
    ciOutcome(
      { ...FRESH_INCIDENT.record, project: FRESH_INCIDENT.project },
      FRESH_INCIDENT.altScope,
      FRESH_INCIDENT.snapshot,
    ).queried === false,
    'project-delta performs 0 gamma lookups',
  );
}

/** Floating scene eyebrow + 2-line serif headline (zero box chrome). */
export function cinemaHeader(
  eyebrow,
  line1,
  line2,
  { x = -860, y = -430, accent = COSMOS.cyan, size = 48, anchor = 'left' } = {},
) {
  const parts = [
    txt(eyebrow, x, y, 26, accent, 'mono', anchor),
    txt(line1, x, y + 58, size, COSMOS.ink, 'serif', anchor),
  ];
  if (line2) {
    parts.push(txt(line2, x, y + 122, size, accent, 'serif', anchor).glow(6, accent));
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

/** Trim a 2D segment by margin pixels from both ends so edges meet circular nodes cleanly. */
export function trimSeg(a, b, rA = 28, rB = 28) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  return [
    [a[0] + ux * rA, a[1] + uy * rA],
    [b[0] - ux * rB, b[1] - uy * rB],
  ];
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

/** Smooth glowing beam along a point path. */
export function beamWithPhotons(pts, color, _phaseVal, { width = 3.4, glow = 9, alpha = 1 } = {}) {
  return group(glowingTrail(pts, { color, width, glow, opacity: 0.9 * alpha }));
}

/** Glowing circular FSM / automaton state node (double ring when accepting). */
export function fsmNode(
  cx,
  cy,
  r,
  label,
  {
    color = COSMOS.cyan,
    fill = '#0c1326',
    accepting = false,
    size = 28,
    glow = 8,
    opacity = 1,
    textColor = null,
  } = {},
) {
  const outer = circle(r, { fill, stroke: color, width: 3.2 }).at(cx, cy).opacity(opacity);
  if (glow > 0) outer.glow(glow, color);
  const nodes = [outer];
  if (accepting) {
    nodes.push(
      circle(r - 9, { fill: null, stroke: color, width: 2.0 })
        .at(cx, cy)
        .opacity(opacity * 0.9),
    );
  }
  if (label !== undefined && label !== null && label !== '') {
    nodes.push(txt(label, cx, cy, size, textColor ?? color, 'mono', 'center').opacity(opacity));
  }
  return group(...nodes);
}

/** Compact luminous monospace token/byte cell (generous padding so glyph never touches border). */
export function tokenChip(
  label,
  x,
  y,
  {
    w = 72,
    h = 66,
    color = COSMOS.cyan,
    fill = '#0e162b',
    textColor = null,
    size = 30,
    glow = 6,
    opacity = 1,
    dash = null,
  } = {},
) {
  const box = rect(w, h, {
    fill,
    stroke: color,
    width: 2.4,
    radius: 10,
    ...(dash ? { dash } : {}),
  })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) box.glow(glow, color);
  return group(box, txt(label, x, y, size, textColor ?? color, 'mono', 'center').opacity(opacity));
}

/** Subtle vertical optical rail bar. */
export function opticalRail(
  x,
  y0,
  y1,
  color = COSMOS.cyan,
  { width = 5, glow = 8, opacity = 1 } = {},
) {
  const r = line([x, y0], [x, y1], { stroke: color, width }).opacity(opacity);
  if (glow > 0) r.glow(glow, color);
  return r;
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
