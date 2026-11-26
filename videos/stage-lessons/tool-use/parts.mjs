// Shared cinema building blocks, semantic color roles, 3D helpers, and verified math
// invariants for the Function Calling & Tool Use narrated stage lesson (28 scenes).
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
  polyPath,
  rect,
  Node,
} from 'vizmatic/stage';
import {
  proposalFingerprint,
  safeToolCosine,
  stableToolJson,
} from '../../films/tool-use/arithmetic.mjs';
import {
  budgetSnapshot,
  envelopeSnapshot,
  observationSnapshot,
  retrySnapshot,
  writeGateSnapshot,
} from '../../films/tool-use/construction.mjs';
import {
  RETRY_TRACE,
  TOOL_GOOD_TRACE,
  TOOL_RECEIPTS,
  operationService,
} from '../../films/tool-use/fixtures.mjs';
import {
  admitToolResult,
  answerFromObservation,
  authorize,
  dispatchReaderEvaluation,
  observationTrace,
  parseUniqueToolJson,
  permittedToolRanking,
  releaseCall,
  releasePromotionTarget,
  requiredToolComparison,
  sameSuiteToolComparison,
  scopedReleaseRead,
  scoreToolTrajectory,
  strictReleaseArguments,
  typedToolRelease,
  validArgs,
  validatedReleaseCalls,
} from '../../films/tool-use/model.mjs';
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
  RETRY_TRACE,
  TOOL_GOOD_TRACE,
  TOOL_RECEIPTS,
  admitToolResult,
  answerFromObservation,
  aura,
  authorize,
  budgetSnapshot,
  cinematic3d,
  dispatchReaderEvaluation,
  envelopeSnapshot,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout,
  observationSnapshot,
  observationTrace,
  operationService,
  orbitScene,
  parseUniqueToolJson,
  permittedToolRanking,
  proposalFingerprint,
  releaseCall,
  releasePromotionTarget,
  requiredToolComparison,
  retrySnapshot,
  rule,
  safeToolCosine,
  sameSuiteToolComparison,
  scopedReleaseRead,
  scoreToolTrajectory,
  stableToolJson,
  strictReleaseArguments,
  txt,
  typedToolRelease,
  validArgs,
  validatedReleaseCalls,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
  writeGateSnapshot,
};

/**
 * Semantic color roles held constant across all 28 tool-use scenes:
 *   proposal / call / model       -> blue
 *   runtime / gate / host / link  -> cyan
 *   ok / allowed / server / clean -> emerald
 *   focus / budget / key / prompt -> gold
 *   denied / reject / fail / err  -> rose
 *   caution / untrusted / pending -> amber
 *   session / approval / mcp      -> violet
 */
export const ROLE = Object.freeze({
  proposal: COSMOS.blue,
  call: COSMOS.blue,
  model: COSMOS.blue,
  runtime: COSMOS.cyan,
  gate: COSMOS.cyan,
  host: COSMOS.cyan,
  link: COSMOS.cyan,
  ok: COSMOS.emerald,
  allowed: COSMOS.emerald,
  server: COSMOS.emerald,
  clean: COSMOS.emerald,
  focus: COSMOS.gold,
  budget: COSMOS.gold,
  key: COSMOS.gold,
  prompt: COSMOS.gold,
  denied: COSMOS.rose,
  reject: COSMOS.rose,
  fail: COSMOS.rose,
  conflict: COSMOS.rose,
  caution: COSMOS.amber,
  untrusted: COSMOS.amber,
  pending: COSMOS.amber,
  deferred: COSMOS.amber,
  session: COSMOS.violet,
  approval: COSMOS.violet,
  mcp: COSMOS.violet,
});

// Verified derived fixtures used across the 28 scenes.
export const RELEASE_OBS = Object.freeze({
  releaseId: 'reranker-v16',
  callId: 'status-1',
  itemId: 'fc_item_1',
  status: 'canary_failed',
  budgetPct: 2.0,
  observedPct: 8.1,
  excessPct: 6.1,
  budgetRate: 0.02,
  observedRate: 0.081,
});

export const EVAL_ROWS = Object.freeze([
  dispatchReaderEvaluation({
    call_id: 'c17',
    name: 'get_eval',
    arguments: JSON.stringify({ version: 'reranker-v17' }),
  }),
  dispatchReaderEvaluation({
    call_id: 'c16',
    name: 'get_eval',
    arguments: JSON.stringify({ version: 'reranker-v16' }),
  }),
]);

export const EVAL_COMPARISON = Object.freeze(sameSuiteToolComparison(EVAL_ROWS));

export const RANKING_CATALOG = Object.freeze([
  {
    name: 'A',
    fullName: 'get_release_status',
    label: 'Status read',
    role: 'triage',
    vector: [0.6, 0.8, 0],
  },
  {
    name: 'B',
    fullName: 'search_release_policy',
    label: 'Policy read',
    role: 'triage',
    vector: [0.8, 0.6, 0],
  },
  { name: 'C', fullName: 'promote_model', label: 'Write', role: 'ops-admin', vector: [1, 0, 0] },
  {
    name: 'D',
    fullName: 'restart_cluster',
    label: 'Cluster reboot',
    role: 'ops-admin',
    vector: [0.1, 0.2, 0.97],
  },
]);

export const RANKING_QUERY = Object.freeze([1, 0, 0]);

export const FANIN_EXPECTED = Object.freeze({
  'call-1': 'reranker-v16',
  'call-2': 'reranker-v17',
});

export const FANIN_V16 = Object.freeze({
  call_id: 'call-1',
  ok: true,
  release_id: 'reranker-v16',
  status: 'canary_failed',
  error_rate: 0.081,
  budget: 0.02,
  perThousand: 81,
});

export const FANIN_V17 = Object.freeze({
  call_id: 'call-2',
  ok: true,
  release_id: 'reranker-v17',
  status: 'canary_clean',
  error_rate: 0.009,
  budget: 0.02,
  perThousand: 9,
});

export const FANIN_TIMEOUT = Object.freeze({
  call_id: 'call-1',
  ok: false,
  error: 'timeout',
});

export const TYPED_EVIDENCE_SUMMARY = Object.freeze(typedToolRelease(TOOL_RECEIPTS));

export const MCP_COUNTS = Object.freeze({
  hosts: 3,
  services: 4,
  direct: 3 * 4,
  factored: 3 + 4,
});

export const FRESH_DATA = Object.freeze({
  a: { release: 'A', call_id: 'c31', suite: 'Q1', score: 0.86 },
  bQ2: { release: 'B', call_id: 'c32', suite: 'Q2', score: 0.89 },
  bQ1: { release: 'B', call_id: 'c33', suite: 'Q1', score: 0.83, gate: 'passed' },
});

export const FRESH_COMPARE_BAD = Object.freeze(
  sameSuiteToolComparison([FRESH_DATA.a, FRESH_DATA.bQ2]),
);
export const FRESH_COMPARE_GOOD = Object.freeze(
  sameSuiteToolComparison([FRESH_DATA.a, FRESH_DATA.bQ1]),
);

/** Build-time mathematical & contract invariant suite covering every displayed value in tool-use. */
export function verifyToolUseInvariants() {
  // 1. Library lookup & observation trace
  const trace = observationTrace();
  verifyInvariant(trace.call.call_id === 'read-7', 'library call_id = read-7');
  verifyInvariant(trace.serviceResult.available_copies === 3, 'River Walk available copies = 3');
  verifyInvariant(
    admitToolResult(trace.call, { ...trace.serviceResult, call_id: 'read-8' }) === null,
    'mismatched call_id read-8 rejected',
  );
  verifyInvariant(
    answerFromObservation(trace.observation) === 'River Walk has 3 copies available.',
    'observation answer matches 3 copies',
  );

  // 2. Release observation error budget
  verifyApprox(
    RELEASE_OBS.observedPct - RELEASE_OBS.budgetPct,
    RELEASE_OBS.excessPct,
    1e-9,
    '8.1% - 2.0% = 6.1 pp',
  );
  verifyApprox(
    (RELEASE_OBS.observedRate - RELEASE_OBS.budgetRate) * 100,
    6.1,
    1e-9,
    '0.081 - 0.02 = 6.1 pp',
  );

  // 3. Schema & strict contract
  verifyInvariant(validArgs({ book_id: 'B7' }), 'B7 valid');
  verifyInvariant(!validArgs({ book_id: 7 }), 'numeric book_id rejected');
  verifyInvariant(!validArgs({ book_id: 'B7', place_hold: true }), 'extra place_hold rejected');

  const okStrict = strictReleaseArguments({ release_id: 'reranker-v16', include_gates: true });
  verifyInvariant(okStrict.include_gates === true, 'strict bool true passes');
  const okNull = strictReleaseArguments({ release_id: 'reranker-v16', include_gates: null });
  verifyInvariant(okNull.include_gates === null, 'strict null passes');
  let strictRejectedInt = false;
  try {
    strictReleaseArguments({ release_id: 'reranker-v16', include_gates: 1 });
  } catch {
    strictRejectedInt = true;
  }
  verifyInvariant(strictRejectedInt, 'strict mode rejects numeric 1 for include_gates');

  let dupRejected = false;
  try {
    parseUniqueToolJson('{"version":"reranker-v17","version":"reranker-v16"}');
  } catch {
    dupRejected = true;
  }
  verifyInvariant(dupRejected, 'parseUniqueToolJson rejects duplicate keys');

  // 4. Whole-batch validation
  const goodBatch = { status: 'completed', output: [releaseCall('status-1', 'reranker-v16')] };
  verifyInvariant(validatedReleaseCalls(goodBatch).length === 1, 'complete batch passes');
  let lateIncompleteRejected = false;
  try {
    validatedReleaseCalls({
      status: 'completed',
      output: [
        releaseCall('status-1', 'reranker-v16'),
        {
          type: 'function_call',
          status: 'incomplete',
          id: 'fc_item_2',
          call_id: 'status-2',
          name: 'get_release_status',
          arguments: '{"release_id":',
        },
      ],
    });
  } catch {
    lateIncompleteRejected = true;
  }
  verifyInvariant(lateIncompleteRejected, 'late incomplete call rejects whole batch');

  // 5. Authorization & scoped read
  verifyInvariant(authorize({ reader: 'lena' }, 'lookup', 'B7'), 'lena lookup B7 allowed');
  verifyInvariant(!authorize({ reader: 'lena' }, 'hold', 'B7'), 'lena hold without grant denied');
  verifyInvariant(
    authorize({ reader: 'lena', holdGrant: true }, 'hold', 'B7'),
    'lena hold with grant allowed',
  );
  verifyInvariant(
    !authorize({ reader: 'lena', holdGrant: true }, 'hold', 'B8'),
    'wrong target B8 denied',
  );

  const searchRead = scopedReleaseRead({ project_id: 'search' }, 'reranker-v16');
  const adsRead = scopedReleaseRead({ project_id: 'ads' }, 'reranker-v16');
  const missingRead = scopedReleaseRead({ project_id: 'search' }, 'reranker-v99');
  verifyInvariant(searchRead.ok === true, 'search reads own release');
  verifyInvariant(
    adsRead.ok === false &&
      missingRead.ok === false &&
      adsRead.error === 'not_found_or_not_authorized' &&
      missingRead.error === adsRead.error,
    'foreign and missing reads return uniform denial',
  );

  // 6. Same-suite reader
  verifyInvariant(EVAL_COMPARISON.ok === true, 'same-suite comparison passes');
  verifyApprox(EVAL_COMPARISON.delta, 0.03, 1e-9, '0.84 - 0.81 = 0.03');

  // 7. Promotion policy & intent ledger
  const promo = releasePromotionTarget();
  const alice = { principal: 'alice', project: 'search', can_promote: true };
  const firstPromo = promo.apply(alice, { release_id: 'reranker-v17' }, 'a', {
    loseResponse: true,
  });
  verifyInvariant(
    firstPromo.unknown === true && firstPromo.effects === 1,
    'op-A recorded 1 effect',
  );
  promo.setReleaseGate('reranker-v17', false);
  const blockedRetry = promo.apply(alice, { release_id: 'reranker-v17' }, 'a');
  verifyInvariant(
    blockedRetry.ok === false && blockedRetry.reason === 'release policy failed',
    'failed live gate blocks replay',
  );
  promo.setReleaseGate('reranker-v17', true);
  const replayedPromo = promo.apply(alice, { release_id: 'reranker-v17' }, 'a');
  verifyInvariant(
    replayedPromo.ok === true && replayedPromo.replayed === true && replayedPromo.effects === 1,
    'restored gate replays op-A with 1 effect',
  );
  const secondPromo = promo.apply(alice, { release_id: 'reranker-v17' }, 'b');
  verifyInvariant(secondPromo.ok === true && secondPromo.effects === 2, 'op-B applies 2nd effect');
  const collisionPromo = promo.apply(alice, { release_id: 'reranker-v18' }, 'collision');
  verifyInvariant(
    collisionPromo.ok === false && collisionPromo.effects === 2,
    'collision rejected, effects stay 2',
  );

  // 8. Retry identity fork (same key vs fresh key vs conflict)
  verifyInvariant(RETRY_TRACE.replayed.effects === 1, 'reused op-17 keeps 1 hold');
  verifyInvariant(RETRY_TRACE.conflictRejected === true, 'op-17 conflict on B8 rejected');
  const freshFork = operationService();
  freshFork.apply('op-17', { book_id: 'B7' });
  freshFork.apply('op-18', { book_id: 'B7' });
  verifyInvariant(freshFork.snapshot().effects === 2, 'fresh key op-18 creates 2 holds');

  // 9. Repeated proposal canonical fingerprint
  const fp1 = proposalFingerprint({
    id: 'call-1',
    name: 'get_release_status',
    args: { run_id: 'reranker-v16', flag: true },
  });
  const fp2 = proposalFingerprint({
    id: 'call-2',
    name: 'get_release_status',
    args: { flag: true, run_id: 'reranker-v16' },
  });
  verifyInvariant(fp1 === fp2, 'canonical fingerprint ignores call_id and key order');

  // 10. Required fan-in comparison
  const partialComp = requiredToolComparison(FANIN_EXPECTED, [FANIN_TIMEOUT, FANIN_V17]);
  const fullComp = requiredToolComparison(FANIN_EXPECTED, [FANIN_V16, FANIN_V17]);
  const dupComp = requiredToolComparison(FANIN_EXPECTED, [FANIN_V16, { ...FANIN_V16 }]);
  verifyInvariant(partialComp.ok === false, 'partial fan-in blocked');
  verifyInvariant(fullComp.ok === true && fullComp.release_id === 'reranker-v17', 'v17 qualifies');
  verifyInvariant(dupComp.ok === false, 'duplicate call_id blocked');

  // 11. Permission before ranking & cosine
  verifyApprox(safeToolCosine(RANKING_QUERY, RANKING_CATALOG[0].vector), 0.6, 1e-9, 'cos(q,A)=0.6');
  verifyApprox(safeToolCosine(RANKING_QUERY, RANKING_CATALOG[1].vector), 0.8, 1e-9, 'cos(q,B)=0.8');
  const [top1] = permittedToolRanking(RANKING_QUERY, RANKING_CATALOG, ['triage'], 1);
  verifyInvariant(top1.name === 'B', 'top-1 permitted triage tool is B');
  let zeroRejected = false;
  try {
    safeToolCosine(RANKING_QUERY, [0, 0, 0]);
  } catch {
    zeroRejected = true;
  }
  verifyInvariant(zeroRejected, 'zero vector rejected');

  // 12. Trajectory contract & typed release evidence
  verifyInvariant(scoreToolTrajectory(TOOL_GOOD_TRACE).ok === true, 'good trace passes');
  const badTextTrace = TOOL_GOOD_TRACE.map((e, i) =>
    i === 2 ? { ...e, text: 'Release reranker-v16 succeeded.' } : e,
  );
  verifyInvariant(scoreToolTrajectory(badTextTrace).ok === false, 'contradicted text rejected');
  verifyInvariant(
    TYPED_EVIDENCE_SUMMARY.passed === 3 &&
      TYPED_EVIDENCE_SUMMARY.total === 4 &&
      TYPED_EVIDENCE_SUMMARY.rate === 0.75 &&
      TYPED_EVIDENCE_SUMMARY.rounds === 3 &&
      TYPED_EVIDENCE_SUMMARY.latency === 680 &&
      TYPED_EVIDENCE_SUMMARY.cost === 3.8 &&
      TYPED_EVIDENCE_SUMMARY.approved === false,
    'typed release evidence 3/4, 680ms, 3.8c -> rejected',
  );

  // 13. MCP counts & Fresh comparison
  verifyInvariant(MCP_COUNTS.direct === 12 && MCP_COUNTS.factored === 7, '3x4=12 vs 3+4=7');
  verifyInvariant(FRESH_COMPARE_BAD.ok === false, 'Q1 vs Q2 rejected');
  verifyInvariant(FRESH_COMPARE_GOOD.ok === true, 'Q1 vs Q1 accepted');
  verifyApprox(FRESH_COMPARE_GOOD.delta, 0.03, 1e-9, '0.86 - 0.83 = 0.03');
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

/** Trim a 2D line segment by `padA` / `padB` so strokes never cross circle/gate labels. */
export function trimSeg(a, b, padA = 44, padB = 44) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [
    [a[0] + (dx / len) * padA, a[1] + (dy / len) * padA],
    [b[0] - (dx / len) * padB, b[1] - (dy / len) * padB],
  ];
}

/** Glowing horizontal meter bar (pure gauge, zero card chrome). */
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

/** Illuminated circular optical station node (label floats cleanly above, sub below: zero stroke crossing). */
export function gateNode(
  x,
  y,
  label,
  color,
  { radius = 34, sub = null, opacity = 1, glow = 9, size = 26 } = {},
) {
  const r = Math.min(34, Math.max(24, radius * 0.62));
  const parts = [
    circle(r + 10, { fill: null, stroke: color, width: 1.5, dash: [5, 7] })
      .at(x, y)
      .opacity(0.48 * opacity),
    circle(r, { fill: '#0b1224', stroke: color, width: 3.4 })
      .at(x, y)
      .glow(glow, color)
      .opacity(opacity),
    glowDot(x, y, { radius: 7, color, glow: glow + 4, opacity }),
    txt(label, x, y - r - 30, size, color, 'mono', 'center').opacity(opacity),
  ];
  if (sub) {
    parts.push(txt(sub, x, y + r + 32, 26, COSMOS.muted, 'mono', 'center').opacity(opacity));
  }
  return group(...parts);
}

/** Glowing hexagonal schema / authorization energy gate with generous text clearance. */
export function hexGate(
  cx,
  cy,
  radius,
  color = COSMOS.cyan,
  { label = null, sub = null, opacity = 1, glow = 10, width = 3.2 } = {},
) {
  const minR = label ? Math.ceil(String(label).length * 11.2) + 30 : radius;
  const r = Math.max(radius, minR);
  const pts = [];
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  const outer = new Node(polyPath(pts))
    .fill('#0b1326', 0.88 * opacity)
    .stroke(color, width, opacity)
    .glow(glow, color);
  const parts = [outer];
  if (label) {
    parts.push(txt(label, cx, cy, 26, color, 'mono', 'center').opacity(opacity));
  }
  if (sub) {
    parts.push(txt(sub, cx, cy + r + 38, 26, COSMOS.muted, 'mono', 'center').opacity(opacity));
  }
  return group(...parts);
}

/** Animated optical circuit breaker switch (openFrac: 0 = closed/pass, 1 = tripped/open). */
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
  const angle = -openFrac * 0.48;
  const armLen = openFrac > 0.1 ? span * 0.78 : span;
  const tip = [left[0] + Math.cos(angle) * armLen, left[1] + Math.sin(angle) * armLen];
  const armColor = openFrac > 0.35 ? COSMOS.rose : color;
  return group(
    circle(8, { fill: '#0b1224', stroke: armColor, width: 3 })
      .at(left[0], left[1])
      .opacity(opacity),
    circle(8, { fill: '#0b1224', stroke: color, width: 3 }).at(right[0], right[1]).opacity(opacity),
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

/** Add a wireframe-only 3D prism (12 edges) for pending/unallocated slots. */
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
