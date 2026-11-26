// Shared cinema building blocks, semantic color roles, 3D helpers, and verified
// security/math invariants for the Prompt Injection narrated stage lesson (28 scenes).
import {
  Node,
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
  polyPath,
  rect,
} from 'vizmatic/stage';
import { wilsonBounds } from '../../films/prompt-injection/arithmetic.mjs';
import {
  APPROVAL,
  CASES,
  FRESH_EVALUATION,
  PI_APPROVAL,
  PI_SOURCE,
  PROPOSAL,
  REFUSAL_EVENTS,
  REPORT,
  TRUSTED,
} from '../../films/prompt-injection/fixtures.mjs';
import {
  disclosureAllowed,
  escapeWrapperText,
  exactApprovalDecision,
  freshAuthorityDecision,
  linkResourceAllowed,
  localPromotionCases,
  localWriteLedger,
  promotionAllowed,
  reportEligibility,
  simulateCase,
  typedEvidenceDecision,
  validProposal,
  validateDecodedAction,
} from '../../films/prompt-injection/model.mjs';
import { DETECTOR_EXAMPLES, RESULTS } from '../../films/prompt-injection/observations.mjs';
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
  APPROVAL,
  CASES,
  CINEMA_FRAME,
  COSMOS,
  DETECTOR_EXAMPLES,
  FRESH_EVALUATION,
  PI_APPROVAL,
  PI_SOURCE,
  PROPOSAL,
  REFUSAL_EVENTS,
  REPORT,
  RESULTS,
  TRUSTED,
  aura,
  cinematic3d,
  disclosureAllowed,
  escapeWrapperText,
  exactApprovalDecision,
  freshAuthorityDecision,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  linkResourceAllowed,
  localPromotionCases,
  localWriteLedger,
  metricReadout,
  orbitScene,
  promotionAllowed,
  reportEligibility,
  rule,
  simulateCase,
  txt,
  typedEvidenceDecision,
  validProposal,
  validateDecodedAction,
  verifyApprox,
  verifyInvariant,
  wilsonBounds,
  wireframeSlab3d,
};

/**
 * Semantic color roles held constant across all 28 prompt-injection scenes:
 *   attack / denied / fail / unsafe  -> rose
 *   untrusted / proposal / caution   -> amber
 *   evidence / source / report       -> blue
 *   host / gate / policy / verify    -> cyan
 *   ok / allowed / clean / safe      -> emerald
 *   focus / question / highlight     -> gold
 *   approval / session / principal   -> violet
 */
export const ROLE = Object.freeze({
  attack: COSMOS.rose,
  denied: COSMOS.rose,
  fail: COSMOS.rose,
  unsafe: COSMOS.rose,
  conflict: COSMOS.rose,
  untrusted: COSMOS.amber,
  proposal: COSMOS.amber,
  caution: COSMOS.amber,
  canary: COSMOS.amber,
  evidence: COSMOS.blue,
  source: COSMOS.blue,
  report: COSMOS.blue,
  model: COSMOS.blue,
  host: COSMOS.cyan,
  gate: COSMOS.cyan,
  policy: COSMOS.cyan,
  runtime: COSMOS.cyan,
  verify: COSMOS.cyan,
  ok: COSMOS.emerald,
  allowed: COSMOS.emerald,
  clean: COSMOS.emerald,
  safe: COSMOS.emerald,
  committed: COSMOS.emerald,
  focus: COSMOS.gold,
  question: COSMOS.gold,
  highlight: COSMOS.gold,
  approval: COSMOS.violet,
  session: COSMOS.violet,
  reviewer: COSMOS.violet,
  principal: COSMOS.violet,
});

// Derived verified fixtures shared across scenes.
export const SUITE_REGEX = /^R\d{1,6}$/;
export const VALID_SUITE_ID = 'R42';
export const OVERLONG_SUITE_ID = 'R1234567';

export const RAW_CLOSING_TAG = '</retrieved-eval>';
export const ESCAPED_CLOSING_TAG = escapeWrapperText(RAW_CLOSING_TAG);

export const PARSER_VALID_PAIRS = Object.freeze([
  ['action', 'request_promotion'],
  ['candidate_id', 'C17'],
  ['eval_suite', 'R42'],
]);

export const UTF8_SAMPLE_CHARS = 300;
export const UTF8_SAMPLE_BYTES = new TextEncoder().encode('é'.repeat(UTF8_SAMPLE_CHARS)).length;
export const CHAR_LIMIT = 512;

export const LINK_ALLOWED = 'https://evals.mlplatform.example/runs/R42';
export const LINK_EVIL_HOST = 'https://evals.mlplatform.example.evil.test/runs/R42';
export const LINK_QUERY = 'https://evals.mlplatform.example/runs/R42?secret=PRIVATE';
export const LINK_FRAGMENT = 'https://evals.mlplatform.example/runs/R42#x';
export const LINK_HTTP = 'http://evals.mlplatform.example/runs/R42';

export const CANARY_BYTES = 16;
export const CANARY_BITS = CANARY_BYTES * 8;
export const CANARY_TOKEN = 'CANARY_Z9';
export const CANARY_CHUNKS = Object.freeze(['CAN', 'ARY_Z9']);

export const ASR_SAMPLE = Object.freeze({
  k: 10,
  n: 100,
  rate: 10 / 100,
  bounds: Object.freeze(wilsonBounds(10, 100)),
});

export const FRR_SAMPLE = Object.freeze({
  k: 40,
  n: 1000,
  rate: 40 / 1000,
  bounds: Object.freeze(wilsonBounds(40, 1000)),
});

export const ZERO_BOUND_250 = wilsonBounds(0, 250)[1];
export const ZERO_BOUND_20 = wilsonBounds(0, 20)[1];
export const POLICY_LIMIT = 0.02;

export const REPORT_GOOD = Object.freeze(reportEligibility());
export const REPORT_NO_TOOL = Object.freeze(reportEligibility({ paths: [50, 50, 0, 50, 50] }));
export const REPORT_SMALL = Object.freeze(
  reportEligibility({ attacks: 20, paths: [4, 4, 4, 4, 4] }),
);
export const REPORT_BLOCKED = Object.freeze(reportEligibility({ blocked: 200 }));

export const PATH_LABELS = Object.freeze([
  'Direct',
  'Retrieved',
  'Tool Result',
  'Multi-Turn',
  'Multimodal',
]);

export const LOCAL_PROMO_CASES = Object.freeze(localPromotionCases());

export const FRESH_REQUEST = Object.freeze({
  user: 'user-26',
  candidate: FRESH_EVALUATION.candidate,
  suite: FRESH_EVALUATION.suite,
  target: 'staging',
  operation: 'OP12',
});

export const FRESH_PREV_GRANT = Object.freeze({
  ...FRESH_REQUEST,
  operation: 'OP11',
});

const freshPermits = (req, grant) => freshAuthorityDecision(req, grant) === 'execute';
export const FRESH_RUN1 = Object.freeze(
  localWriteLedger([FRESH_REQUEST], FRESH_PREV_GRANT, freshPermits),
);
export const FRESH_RUN2_ONCE = Object.freeze(
  localWriteLedger([FRESH_REQUEST], FRESH_REQUEST, freshPermits),
);
export const FRESH_RUN2_REPLAY = Object.freeze(
  localWriteLedger([FRESH_REQUEST, FRESH_REQUEST], FRESH_REQUEST, freshPermits),
);

/** Build-time mathematical and security invariant suite covering every displayed value. */
export function verifyPromptInjectionInvariants() {
  // 1. Core report, proposal, and approval invariants
  verifyInvariant(validProposal(PROPOSAL), 'PROPOSAL is valid');
  verifyInvariant(!promotionAllowed(PROPOSAL, TRUSTED), 'missing approval denied');
  verifyInvariant(
    promotionAllowed(PROPOSAL, { ...TRUSTED, approval: APPROVAL }),
    'matching Casey approval permits promotion',
  );
  verifyInvariant(PROPOSAL.traffic === 25 && PROPOSAL.revision === 3, 'C17 25% rev 3');

  // 2. Wrapper escaping and suite regex extraction
  verifyInvariant(ESCAPED_CLOSING_TAG === '&lt;/retrieved-eval&gt;', 'closing tag escaped');
  verifyInvariant(SUITE_REGEX.test(VALID_SUITE_ID), 'R42 matches bounded suite regex');
  verifyInvariant(!SUITE_REGEX.test(OVERLONG_SUITE_ID), '7-digit R1234567 rejected');

  // 3. Typed evidence & schema falsehood checks
  verifyInvariant(
    typedEvidenceDecision({
      candidate: 'C17',
      suite: 'R42',
      gate: 'passed',
      tool: 'promote',
      approved: true,
    }).reason === 'extra-or-missing-fields',
    'extra fields reject entire sheet',
  );
  verifyInvariant(
    typedEvidenceDecision({ candidate: 'C17', suite: 'R42', gate: 'passed' }).record.source_id ===
      PI_SOURCE.source_id,
    'clean 3-field record gets host source_id',
  );
  verifyInvariant(
    typedEvidenceDecision(
      { candidate: 'C17', suite: 'R42', gate: 'passed' },
      { ...PI_SOURCE, gate: 'failed' },
    ).reason === 'source-mismatch',
    'schema-valid lie rejected by source check',
  );

  // 4. Strict proposal parser & UTF-8 byte vs char count
  verifyInvariant(validateDecodedAction(PARSER_VALID_PAIRS, 80).accepted, 'valid 3-key action');
  verifyInvariant(
    validateDecodedAction([...PARSER_VALID_PAIRS, ['action', 'answer_eval']], 90).reason ===
      'duplicate-key',
    'duplicate action key rejected',
  );
  verifyInvariant(
    validateDecodedAction([PARSER_VALID_PAIRS[0], PARSER_VALID_PAIRS[1], ['eval_suite', true]], 80)
      .reason === 'type',
    'boolean suite rejected',
  );
  verifyInvariant(
    validateDecodedAction(PARSER_VALID_PAIRS, 513).reason === 'character-limit',
    '513 chars exceeds 512 limit',
  );
  verifyInvariant(UTF8_SAMPLE_CHARS === 300 && UTF8_SAMPLE_BYTES === 600, '300 accented -> 600 B');

  // 5. Approval bindings & local promotion sequence
  verifyInvariant(
    LOCAL_PROMO_CASES.length === 8 &&
      LOCAL_PROMO_CASES.slice(0, 7).every((row) => row.decision !== 'allow') &&
      LOCAL_PROMO_CASES[7].decision === 'allow',
    '7 failures then 1 matching allow',
  );
  verifyInvariant(
    exactApprovalDecision({ ...PI_APPROVAL }, PI_APPROVAL, { consumed: true }) === 'approval',
    'consumed APR-9 rejects replay',
  );

  // 6. Protected sinks & outbound URL contract
  verifyInvariant(
    !disclosureAllowed({
      field: 'private-red-team-notes',
      destination: 'outside.example',
      caller: 'release-worker',
    }),
    'private notes to outside.example blocked',
  );
  verifyInvariant(linkResourceAllowed(LINK_ALLOWED), 'exact HTTPS R42 allowed');
  verifyInvariant(!linkResourceAllowed(LINK_EVIL_HOST), 'evil.test host denied');
  verifyInvariant(!linkResourceAllowed(LINK_QUERY), 'secret query denied');
  verifyInvariant(!linkResourceAllowed(LINK_FRAGMENT), 'fragment denied');
  verifyInvariant(!linkResourceAllowed(LINK_HTTP), 'plain HTTP denied');

  // 7. Canary entropy & cross-chunk split buffer
  verifyInvariant(CANARY_BITS === 128, '16 bytes = 128 random bits');
  verifyInvariant(
    !CANARY_CHUNKS.some((chunk) => chunk.includes(CANARY_TOKEN)) &&
      CANARY_CHUNKS.join('').includes(CANARY_TOKEN),
    'split canary missed per-chunk, caught when assembled',
  );

  // 8. Detector examples & attack evaluation results
  verifyInvariant(
    DETECTOR_EXAMPLES.length === 3 &&
      DETECTOR_EXAMPLES[0].flagged === true &&
      DETECTOR_EXAMPLES[1].flagged === false &&
      DETECTOR_EXAMPLES[2].flagged === true,
    'detector TP, FN paraphrase, FP manual',
  );
  verifyInvariant(
    RESULTS.filter((r) => r.privateEscaped).length === 0 &&
      RESULTS.filter((r) => r.unauthorizedChange).length === 0 &&
      RESULTS.filter((r, i) => r.rejected && CASES[i].kind === 'benign').length === 1,
    'evaluation counts: 0 escaped, 0 unauthorized, 1 false rejection',
  );
  verifyInvariant(
    REFUSAL_EVENTS.length === 3 && REFUSAL_EVENTS[1].revision === 4,
    'refusal counterexample committed rev 4 before declining',
  );

  // 9. Wilson intervals & uncertainty gate
  verifyApprox(ASR_SAMPLE.bounds[0] * 100, 5.52, 0.05, '10/100 Wilson lower ~ 5.5%');
  verifyApprox(ASR_SAMPLE.bounds[1] * 100, 17.44, 0.05, '10/100 Wilson upper ~ 17.4%');
  verifyApprox(FRR_SAMPLE.bounds[0] * 100, 2.95, 0.05, '40/1000 Wilson lower ~ 3.0%');
  verifyApprox(FRR_SAMPLE.bounds[1] * 100, 5.4, 0.05, '40/1000 Wilson upper ~ 5.4%');
  verifyApprox(ZERO_BOUND_250 * 100, 1.5134, 0.01, '0/250 Wilson upper ~ 1.51%');
  verifyApprox(ZERO_BOUND_20 * 100, 16.113, 0.01, '0/20 Wilson upper ~ 16.11%');
  verifyInvariant(ZERO_BOUND_250 <= POLICY_LIMIT && ZERO_BOUND_20 > POLICY_LIMIT, '2% gate split');

  // 10. Report eligibility & fresh authority synthesis
  verifyInvariant(
    REPORT_GOOD.eligible &&
      !REPORT_NO_TOOL.eligible &&
      !REPORT_SMALL.eligible &&
      !REPORT_BLOCKED.eligible,
    'report eligibility 1 pass / 3 fails',
  );
  verifyInvariant(
    FRESH_RUN1.entries.length === 0 &&
      FRESH_RUN2_ONCE.entries.length === 1 &&
      FRESH_RUN2_REPLAY.entries.length === 1 &&
      FRESH_RUN2_REPLAY.added[0] === 1 &&
      FRESH_RUN2_REPLAY.added[1] === 0,
    'fresh authority OP11 denied, OP12 executes once, replay adds 0',
  );
}

/** Floating scene eyebrow + 2-line serif headline (zero box chrome). */
export function cinemaHeader(
  eyebrow,
  line1,
  line2,
  { x = -860, y = -432, accent = COSMOS.rose, size = 48, anchor = 'left' } = {},
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

/** Trim segment endpoints outside node circles so strokes never cross text. */
export function trimSeg(u, v, padA = 40, padB = padA) {
  const dx = v[0] - u[0];
  const dy = v[1] - u[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return [
    [u[0] + ux * padA, u[1] + uy * padA],
    [v[0] - ux * padB, v[1] - uy * padB],
  ];
}

/** Auto-size circular node radius so centered mono text always fits with clean clearance. */
export function autoNodeRadius(label, radius = 44) {
  return Math.max(radius, Math.ceil(String(label).length * 9.5 + 22));
}

/** Illuminated circular node auto-sized for label clearance. */
export function gateNode(
  x,
  y,
  label,
  color,
  { radius = 46, sub = null, opacity = 1, glow = 9, size = 26 } = {},
) {
  const r = autoNodeRadius(label, radius);
  const parts = [
    circle(r, { fill: '#0b1224', stroke: color, width: 3.4 })
      .at(x, y)
      .glow(glow, color)
      .opacity(opacity),
    circle(r + 10, { fill: null, stroke: color, width: 1.4, dash: [5, 7] })
      .at(x, y)
      .opacity(0.42 * opacity),
    txt(label, x, y, size, color, 'mono', 'center').opacity(opacity),
  ];
  if (sub) {
    parts.push(txt(sub, x, y + r + 34, 26, COSMOS.muted, 'mono', 'center').opacity(opacity));
  }
  return group(...parts);
}

/** Glowing hexagonal security / policy gate auto-sized for label clearance. */
export function hexGate(
  cx,
  cy,
  radius,
  color = COSMOS.cyan,
  { label = null, sub = null, opacity = 1, glow = 10, width = 3.2 } = {},
) {
  const r = label ? Math.max(radius, Math.ceil(String(label).length * 9.8 + 26)) : radius;
  const pts = [];
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  const outer = new Node(polyPath(pts))
    .fill('#0b1326', 0.88 * opacity)
    .stroke(color, width, opacity)
    .glow(glow, color);
  const innerPts = [];
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    innerPts.push([cx + Math.cos(a) * (r * 0.82), cy + Math.sin(a) * (r * 0.82)]);
  }
  const inner = new Node(polyPath(innerPts)).stroke(color, 1.4, 0.45 * opacity);
  const parts = [outer, inner];
  if (label) {
    parts.push(txt(label, cx, cy, 26, color, 'mono', 'center').opacity(opacity));
  }
  if (sub) {
    parts.push(txt(sub, cx, cy + r + 42, 26, COSMOS.muted, 'mono', 'center').opacity(opacity));
  }
  return group(...parts);
}

/** Animated optical circuit breaker switch (openFrac: 0 = closed, 1 = tripped/open). */
export function circuitBreaker(
  cx,
  cy,
  span = 110,
  openFrac = 0,
  color = COSMOS.cyan,
  { opacity = 1 } = {},
) {
  const left = [cx - span * 0.5, cy];
  const right = [cx + span * 0.5, cy];
  const angle = -openFrac * 0.78;
  const tip = [left[0] + Math.cos(angle) * span, left[1] + Math.sin(angle) * span];
  const armColor = openFrac > 0.35 ? COSMOS.rose : color;
  return group(
    circle(9, { fill: '#0b1224', stroke: armColor, width: 3 })
      .at(left[0], left[1])
      .opacity(opacity),
    circle(9, { fill: '#0b1224', stroke: color, width: 3 }).at(right[0], right[1]).opacity(opacity),
    line(left, tip, { stroke: armColor, width: 4.4 }).glow(10, armColor).opacity(opacity),
    glowDot(tip[0], tip[1], { radius: 5.5, color: armColor, glow: 12, opacity }),
  );
}

/** Vertical glowing optical channel rail (zero card boxes). */
export function energyRail(
  x,
  y0,
  y1,
  color = COSMOS.cyan,
  { width = 5, glow = 8, opacity = 1 } = {},
) {
  return line([x, y0], [x, y1], { stroke: color, width }).glow(glow, color).opacity(opacity);
}

/** Glowing horizontal meter bar (pure visual gauge, no card chrome). */
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

/** Signature 100-square (20 x 5) live production traffic matrix (1 square = 1% traffic). */
export function trafficMatrix(
  xLeft,
  yTop,
  pitch,
  percent,
  fillColor = COSMOS.emerald,
  { opacity = 1, glow = 6 } = {},
) {
  const lit = Math.max(0, Math.min(100, Math.round(percent)));
  const sz = Math.max(10, pitch - 6);
  const cells = [];
  for (let i = 0; i < 100; i++) {
    const col = i % 20;
    const row = Math.floor(i / 20);
    const active = i < lit;
    const cell = rect(sz, sz, {
      fill: active ? fillColor : '#0f162a',
      stroke: active ? fillColor : '#2c3c63',
      width: active ? 1.8 : 1.2,
      radius: 4,
    })
      .at(xLeft + col * pitch + sz * 0.5, yTop + row * pitch + sz * 0.5)
      .opacity(opacity * (active ? 0.92 : 0.72));
    if (active && glow > 0) cell.glow(glow, fillColor);
    cells.push(cell);
  }
  return group(...cells);
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

/** Add a wireframe-only 3D prism (12 edges) for quarantined or unallocated boundaries. */
export function addWireBox3D(
  view,
  x0,
  y0,
  z0,
  dx,
  dy,
  dz,
  color = COSMOS.rose,
  { width = 1.9, opacity = 0.78, glow = 6, blend = 'screen' } = {},
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

/** Add a glowing 3D quadratic Bezier pointer arc with traveling photon dot. */
export function addArc3D(
  view,
  a,
  b,
  color,
  { lift = 0.75, width = 3.0, glow = 8, pulseVal = null, phaseOffset = 0, opacity = 0.92 } = {},
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
