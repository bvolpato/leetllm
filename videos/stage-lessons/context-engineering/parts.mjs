// Shared palette, verified fixtures and glowing primitives for the 28-scene
// Context Engineering stage film. Every number on screen comes from
// videos/films/context-engineering/ and is asserted at build time.
import {
  arrow,
  circle,
  dot,
  gridPlane3d,
  group,
  line,
  line3d,
  point3d,
  rect,
  seq,
  surface,
} from 'vizmatic/stage';
import {
  commonContextPrefix,
  contextPrefixExample,
  contextRelease,
  pruneContextResults,
  requiredPacking,
} from '../../films/context-engineering/arithmetic.mjs';
import {
  freshContextState,
  recheckCollection,
} from '../../films/context-engineering/construction.mjs';
import {
  COMPLETE_TOOL_POLICY,
  CONTEXT_FRESH,
  CONTEXT_RELEASE_CASES,
  CONTEXT_REQUIRED,
  TRACE_EXCHANGE,
  allocations,
  answers,
  questions,
  sources,
  tools,
} from '../../films/context-engineering/fixtures.mjs';
import { completeWorkerBoundary, verifyHandoff } from '../../films/context-engineering/handoff.mjs';
import {
  completeToolIntersection,
  evaluatePacket,
  findings,
  recoverySnapshot,
  selectTools,
} from '../../films/context-engineering/model.mjs';
import {
  completeResume,
  contextFreshResumeFixture,
  contextOperationLedger,
  contextResumeFixture,
  hash,
  originalArtifact,
  originalInputs,
  receipt,
  verifyReceipt,
} from '../../films/context-engineering/recovery.mjs';
import { validateModel } from '../../films/context-engineering/validation.mjs';
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

export {
  COMPLETE_TOOL_POLICY,
  CONTEXT_FRESH,
  CONTEXT_RELEASE_CASES,
  CONTEXT_REQUIRED,
  COSMOS,
  TRACE_EXCHANGE,
  allocations,
  answers,
  arrow,
  aura,
  cinematic3d,
  circle,
  commonContextPrefix,
  completeResume,
  completeToolIntersection,
  completeWorkerBoundary,
  contextFreshResumeFixture,
  contextOperationLedger,
  contextPrefixExample,
  contextRelease,
  contextResumeFixture,
  dot,
  evaluatePacket,
  findings,
  freshContextState,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  guardedDynamic,
  hash,
  heroTitle,
  line,
  line3d,
  metricReadout,
  orbitScene,
  originalArtifact,
  originalInputs,
  point3d,
  pruneContextResults,
  questions,
  receipt,
  recheckCollection,
  recoverySnapshot,
  rect,
  requiredPacking,
  rule,
  selectTools,
  seq,
  sources,
  surface,
  tools,
  txt,
  verifyApprox,
  verifyHandoff,
  verifyInvariant,
  verifyReceipt,
  wireframeSlab3d,
};

/** One semantic color per role across all 28 scenes. */
export const ROLE = Object.freeze({
  evidence: COSMOS.cyan,
  note: COSMOS.emerald,
  poison: COSMOS.rose,
  tool: COSMOS.violet,
  units: COSMOS.gold,
  cache: COSMOS.blue,
  warn: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
});

export const fmt = (n) => Number(n).toLocaleString('en-US');
export const short = (digest, n = 8) => String(digest).slice(0, n);

// ---------------------------------------------------------------------------
// Verified fixtures shared by several scenes.
// ---------------------------------------------------------------------------
export const TRACE = sources['trace-17'];
export const LOCK = sources['lock-check'];
export const FINDINGS = findings();

export const PREFIX_FIRST = contextPrefixExample(false);
export const PREFIX_MOVED = contextPrefixExample(true);

export const PACK_3000 = requiredPacking(CONTEXT_REQUIRED, 3000);
export const RESERVES = Object.freeze({
  total: 4096,
  instructions: 420,
  framing: 180,
  output: 1024,
});
export const RESERVED_BUDGET =
  RESERVES.total - RESERVES.instructions - RESERVES.framing - RESERVES.output;
export const PACK_RESERVED = requiredPacking(CONTEXT_REQUIRED, RESERVED_BUDGET);

const unitsOf = (kinds) =>
  allocations.filter((a) => kinds.includes(a.kind)).reduce((n, a) => n + a.units, 0);
export const LEDGER = Object.freeze({
  raw: allocations.reduce((n, a) => n + a.units, 0),
  kept: unitsOf(['evidence', 'active', 'findings']),
  removed: unitsOf(['raw', 'unused', 'hypothesis']),
  afterExport: allocations.filter((a) => a.kind !== 'raw').reduce((n, a) => n + a.units, 0),
  afterTools: unitsOf(['evidence', 'active', 'findings', 'hypothesis']),
});
export const LEDGER_PERCENT = (100 * LEDGER.removed) / LEDGER.raw;

export const POSITION_PROBE = Object.freeze({ cases: 12, beginning: 10, middle: 7 });
export const POSITION_PCT = Object.freeze({
  beginning: (100 * POSITION_PROBE.beginning) / POSITION_PROBE.cases,
  middle: (100 * POSITION_PROBE.middle) / POSITION_PROBE.cases,
});
export const POSITION_DELTA = POSITION_PCT.beginning - POSITION_PCT.middle;
export const INPUT_LIMIT = 128000;

export const SKILL_UNITS = Object.freeze({
  skills: 6,
  metadataEach: 80,
  body: 2200,
  reference: 400,
  output: 120,
});
export const SKILL_METADATA = SKILL_UNITS.skills * SKILL_UNITS.metadataEach;
export const SKILL_TOTAL =
  SKILL_METADATA + SKILL_UNITS.body + SKILL_UNITS.reference + SKILL_UNITS.output;

export const RELEASE_FIRST = contextRelease();
export const RELEASE_CASES_REPAIRED = Object.freeze(
  CONTEXT_RELEASE_CASES.map((r) => (r.id === 'C2' ? { ...r, curated: true } : r)),
);
export const RELEASE_REPAIRED = contextRelease(RELEASE_CASES_REPAIRED);

export const FRESH_PACK = requiredPacking(CONTEXT_FRESH, 2600);

export const PRUNE_FLAGS = Object.freeze([true, false, true, true]);
export const PRUNED = pruneContextResults(
  PRUNE_FLAGS.map((recorded, i) => ({
    id: 'call' + i,
    source: 'S' + i,
    raw: 'raw' + i,
    finding: 'checked' + i,
    recorded,
  })),
  2,
);

export const LIMITS_TRACE = TRACE;
export const LIMITS = (() => {
  const log = { id: 'Error log', units: 600, priority: 2, required: false };
  const map = { id: 'Route map', units: 300, priority: 1, required: false };
  const directory = { id: 'Service directory', units: 300, priority: 1, required: false };
  return Object.freeze({
    capacity: 600,
    smaller: 500,
    log,
    map,
    directory,
    service: 'Identity',
    owner: 'Access team',
    greedy: requiredPacking([log, map, directory], 600),
    bundle: requiredPacking([map, directory], 600),
  });
})();

export const ISOLATE_PAYLOADS = Object.freeze([
  { claim: 'auth error', source: 'trace-17' },
  { claim: 'auth error', source: 'missing' },
  { claim: 'trace succeeded', source: 'trace-17' },
]);
export const ISOLATE_RESULTS = ISOLATE_PAYLOADS.map((p) => verifyHandoff(JSON.stringify(p)));

/** Envelope from the strict handoff scene: a JSON body padded with spaces to a byte count. */
export const HANDOFF_LIMIT = 1600;
export function statusEnvelope(status, extraSpaces = 0) {
  const body = JSON.stringify({
    claim: 'HTTP ' + status,
    source_ids: ['trace-17'],
    next_check: 'Inspect callback dependency',
  });
  const padding = HANDOFF_LIMIT - 1 - Buffer.byteLength(body, 'utf8') + extraSpaces;
  const wire = Buffer.from(body + ' '.repeat(padding), 'utf8');
  const result = completeWorkerBoundary(wire, new Set(['trace-17']), HANDOFF_LIMIT);
  const record = result.accepted ? sources[result.item.source_ids[0]] : null;
  const supported = record === null ? null : result.item.claim === 'HTTP ' + record.status;
  return { result, record, supported, bytes: wire.byteLength };
}
export const ENVELOPE_200 = statusEnvelope(200);
export const ENVELOPE_PADDED = statusEnvelope(200, 2);
export const ENVELOPE_403 = statusEnvelope(403);

export const EVAL_BASELINE = evaluatePacket(['D0', 'D1', 'D2', 'D4']);
export const EVAL_CANDIDATE = evaluatePacket(['D0', 'D1', 'D2', 'D3', 'D5']);

export const RESUME_CHANGED_INPUT = verifyReceipt(originalArtifact, {
  deploy: JSON.stringify({ revision: 8 }),
});
export const RESUME_OK = verifyReceipt(originalArtifact, originalInputs);
export const RESUME_CHANGED_ARTIFACT = verifyReceipt(`${originalArtifact} changed`, originalInputs);

export const THRASH_OPS = Object.freeze(['fetch', 'summarize', 'drop', 'fetch again', 'summarize']);

export const OPERATION_EVENTS = Object.freeze([
  { key: 'key-17', fence: 12, confirmed: false, label: 'rollback sent' },
  { key: 'key-17', fence: 12, confirmed: false, label: 'retry same key' },
  { key: 'key-18', fence: 11, confirmed: true, label: 'expired worker' },
]);
export const OPERATION_LEDGER = contextOperationLedger(OPERATION_EVENTS);

/** Verify every spoken number against the lesson model at build time. */
export function verifyContextInvariants() {
  validateModel();
  verifyInvariant(TRACE.status === 403 && TRACE.trace === 'R17' && TRACE.at === 100, 'trace-17');
  verifyInvariant(LOCK.locked === false && LOCK.trace === TRACE.trace, 'lock-check same request');
  verifyInvariant(FINDINGS.length === 2, 'two checked findings');
  verifyInvariant(TRACE_EXCHANGE.call.id === TRACE_EXCHANGE.result.call_id, 'call/result pairing');

  verifyApprox(POSITION_PCT.beginning, 83.3333333333, 1e-6, '10 of 12 is 83 and one third');
  verifyApprox(POSITION_PCT.middle, 58.3333333333, 1e-6, '7 of 12 is 58 and one third');
  verifyApprox(POSITION_DELTA, 25, 1e-9, 'twenty-five percentage points');

  verifyInvariant(PREFIX_FIRST.common === 96, 'root, header, document shares 96');
  verifyInvariant(PREFIX_MOVED.common === 352, 'moved header shares 352');
  verifyInvariant(PREFIX_FIRST.length === 364 && PREFIX_MOVED.length === 364, '364 tokens');

  verifyInvariant(LEDGER.raw === 12436, 'raw allocation 12,436');
  verifyInvariant(LEDGER.kept === 3346, 'retained 3,346');
  verifyInvariant(2400 + 760 + 186 === LEDGER.kept && 90 + 96 === 186, 'retained sum');
  verifyInvariant(LEDGER.removed === 9090 && 8200 + 770 + 120 === 9090, 'removed 9,090');
  verifyInvariant(LEDGER.afterExport === 4236 && LEDGER.afterTools === 3466, 'compression stages');
  verifyApprox(Math.round(LEDGER_PERCENT * 10) / 10, 73.1, 1e-9, '73.1 percent omitted');

  verifyInvariant(PACK_3000.used === 2400 && 180 + 420 === 600, 'packer 600 then 2,400');
  verifyInvariant(PACK_3000.selected.join() === 'alert,trace,runbook', 'packer selection');
  verifyInvariant(RESERVED_BUDGET === 2472, 'reserved budget 2,472');
  verifyInvariant(PACK_RESERVED.remaining === 72, '72 units unused');

  verifyInvariant(SKILL_METADATA === 480 && SKILL_TOTAL === 3200, 'skill units 480 and 3,200');

  verifyInvariant(RELEASE_FIRST.raw === 7 && RELEASE_FIRST.curated === 8, 'seven to eight');
  verifyInvariant(RELEASE_FIRST.gains === 2 && RELEASE_FIRST.regressions === 1, 'two up, one down');
  verifyInvariant(!RELEASE_FIRST.approved, 'first candidate held at C2');
  verifyInvariant(RELEASE_REPAIRED.curated === 9 && RELEASE_REPAIRED.approved, 'repaired passes');

  const fresh = FRESH_PACK.events;
  verifyInvariant(fresh[2].used === 1000, 'required records use 1,000');
  verifyInvariant(fresh[3].attempted === 2800 && !fresh[3].fits, 'old export would take 2,800');
  verifyInvariant(FRESH_PACK.used === 2200 && FRESH_PACK.remaining === 400, 'runbook 2,200');
  const freshEnd = freshContextState({ beat: 3, beatP: 1 });
  verifyInvariant(freshEnd.next === 'verify cause', 'restart next task');

  verifyInvariant(LIMITS.greedy.selected.join() === 'Error log', 'error log fills 600');
  verifyInvariant(LIMITS.bundle.used === 600 && LIMITS.bundle.used > LIMITS.smaller, 'pair 600');

  verifyInvariant(PRUNED.cutoff === 2, 'cutoff index two');
  verifyInvariant(
    PRUNED.rows
      .filter((r) => r.replaced)
      .map((r) => r.index)
      .join() === '0',
    'only index zero replaced',
  );

  verifyInvariant(ENVELOPE_200.bytes === 1599 && ENVELOPE_200.result.accepted, '1,599 bytes open');
  verifyInvariant(ENVELOPE_PADDED.bytes === 1601 && !ENVELOPE_PADDED.result.size, '1,601 stops');
  verifyInvariant(ENVELOPE_200.supported === false, 'HTTP 200 contradicted by trace');
  verifyInvariant(ENVELOPE_403.bytes === 1599 && ENVELOPE_403.supported === true, '403 matches');

  verifyInvariant(
    ISOLATE_RESULTS.map((r) => r.accepted).join() === 'true,false,false',
    'isolate: one admitted, two rejected',
  );
  verifyInvariant(
    ISOLATE_RESULTS.every((r) => r.bytes <= 200),
    'replies under 200 bytes',
  );

  verifyInvariant(EVAL_BASELINE.score === 4 && EVAL_CANDIDATE.score === 5, 'four then five');
  verifyInvariant(EVAL_BASELINE.criticalPass && !EVAL_CANDIDATE.criticalPass, 'critical row');

  verifyInvariant(
    completeToolIntersection('investigate').join() === 'deploy_lookup,runbook_search,trace_lookup',
    'three investigation tools',
  );
  verifyInvariant(
    completeToolIntersection('propose').join() === 'rollback_advisor,runbook_search',
    'two proposal tools',
  );
  verifyInvariant(completeToolIntersection('unknown').length === 0, 'unknown phase is empty');
  verifyInvariant(
    completeToolIntersection(
      'investigate',
      tools.filter((t) => t !== 'trace_lookup'),
    ).join() === 'deploy_lookup,runbook_search',
    'unavailable trace_lookup removed',
  );
  verifyInvariant(selectTools('investigate').join() === 'deploy_lookup,trace_lookup', 'two tools');

  verifyInvariant(RESUME_OK.passed, 'unchanged receipt passes');
  verifyInvariant(
    RESUME_CHANGED_INPUT.artifactMatch && !RESUME_CHANGED_INPUT.inputMatch,
    'changed input fails input check',
  );
  verifyInvariant(
    !RESUME_CHANGED_ARTIFACT.artifactMatch && RESUME_CHANGED_ARTIFACT.inputMatch,
    'changed artifact fails artifact check',
  );

  verifyInvariant(THRASH_OPS.length === 5, 'five context operations');
  verifyInvariant(
    OPERATION_LEDGER.map((e) => e.status).join('|') ===
      'unknown; reconcile|already pending; reconcile|stale fence',
    'operation key and fence ledger',
  );
  verifyInvariant(OPERATION_LEDGER.at(-1).effects === 0, 'no confirmed effects');
}

// ---------------------------------------------------------------------------
// Timing helpers.
// ---------------------------------------------------------------------------

/** Clamp a play duration so an animation never runs past the scene's narration. */
export function safeDur(c, startTime, desired = 0.6, margin = 0.44) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.12, Math.min(desired, remaining));
}

/** Schedule an animation at a declared cue (start, or end with `after`). */
export function playCue(
  s,
  c,
  cueId,
  build,
  { after = false, offset = 0, dur = 0.6, margin = 0.44 } = {},
) {
  const info = c.cue(cueId);
  const startAt = (after ? info.end : info.start) + offset;
  const d = safeDur(c, startAt, dur, margin);
  if (after) c.after(cueId, () => build(d), offset);
  else c.on(cueId, () => build(d), offset);
  return d;
}

/** Schedule an animation at the start of a beat that declares no cue. */
export function playBeat(s, c, index, build, { offset = 0, dur = 0.6, margin = 0.44 } = {}) {
  const beat = c.beats[index];
  const startAt = (beat?.start ?? c.start) + offset;
  const d = safeDur(c, startAt, dur, margin);
  c.onBeat(index, () => build(d), offset);
  return d;
}

/** Tween a value at a cue: `tweenCue(s, c, 'cue', v, 1, { after: true })`. */
export function tweenCue(s, c, cueId, value, target, options = {}) {
  return playCue(s, c, cueId, (d) => s.play(value.to(target, { duration: d })), options);
}

/** Tween a value at the start of a beat. */
export function tweenBeat(s, c, index, value, target, options = {}) {
  return playBeat(s, c, index, (d) => s.play(value.to(target, { duration: d })), options);
}

/** Sequential fade-out then fade-in across two visibility values (zero overlap). */
export function swapVis(outVal, inVal, d = 0.6) {
  const half = Math.max(0.12, d * 0.46);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

/** Smoothstep easing of a 0..1 progress value. */
export const ease = (q) => {
  const t = Math.max(0, Math.min(1, q));
  return t * t * (3 - 2 * t);
};
export const lerp = (a, b, q) => a + (b - a) * q;

// ---------------------------------------------------------------------------
// Glowing 2D primitives (no cards, no banners).
// ---------------------------------------------------------------------------

/** Luminous horizontal bar with an optional quiet track behind it. */
export function lumBar(
  x0,
  y,
  width,
  height,
  color,
  { opacity = 0.92, glow = 10, track = 0, trackOpacity = 0.6 } = {},
) {
  const items = [];
  if (track > 0) {
    items.push(
      rect(track, height, { fill: '#12192e', stroke: '#2a3a63', width: 1.5, radius: 6 })
        .at(x0 + track * 0.5, y)
        .opacity(trackOpacity * opacity),
    );
  }
  const w = Math.max(4, width);
  const bar = rect(w, height, { fill: color, stroke: null, radius: 6 })
    .at(x0 + w * 0.5, y)
    .opacity(opacity);
  if (glow > 0) bar.glow(glow, color).set('blend', 'screen');
  items.push(bar);
  return group(...items);
}

/**
 * A context-window rail: segments laid left to right in proportion to `total`.
 * Each segment: { units, color, alpha = 1, dy = 0, outline = false }.
 */
export function tokenRail({
  x0,
  y,
  width,
  total,
  segments,
  height = 58,
  gap = 4,
  opacity = 1,
  track = true,
}) {
  const nodes = [];
  if (track) {
    nodes.push(
      rect(width, height + 14, { fill: '#0d1426', stroke: '#2a3a63', width: 1.6, radius: 10 })
        .at(x0 + width / 2, y)
        .opacity(0.75 * opacity),
    );
  }
  let cursor = x0;
  for (const seg of segments) {
    const w = (seg.units / total) * width;
    const a = (seg.alpha ?? 1) * opacity;
    if (w > gap + 2 && a > 0.01) {
      const body = rect(w - gap, height, {
        fill: seg.outline ? '#0d1426' : seg.color,
        stroke: seg.color,
        width: seg.outline ? 2.4 : 1.2,
        radius: 7,
      })
        .at(cursor + w / 2, y + (seg.dy ?? 0))
        .opacity(seg.outline ? a : 0.82 * a);
      if (!seg.outline) body.glow(seg.glow ?? 8, seg.color);
      nodes.push(body);
    }
    cursor += w;
  }
  return group(...nodes);
}

/** A vertical limit line with a label above it, kept clear of the line. */
export function limitMarker(x, yTop, yBottom, color, label, { size = 28, opacity = 1 } = {}) {
  const parts = [
    line([x, yTop], [x, yBottom], { stroke: color, width: 4 }).glow(8, color).opacity(opacity),
  ];
  if (label) parts.push(txt(label, x, yTop - 30, size, color, 'mono', 'center').opacity(opacity));
  return group(...parts);
}

/** Four glowing corner brackets that frame a region without drawing a box. */
export function cornerBrackets(cx, cy, w, h, color, { arm = 30, width = 3, opacity = 1 } = {}) {
  const l = cx - w / 2,
    r = cx + w / 2,
    t = cy - h / 2,
    b = cy + h / 2;
  const corner = (pts) =>
    glowingTrail(pts, { color, width, glow: 6, core: false, opacity: 0.9 * opacity });
  return group(
    corner([
      [l, t + arm],
      [l, t],
      [l + arm, t],
    ]),
    corner([
      [r - arm, t],
      [r, t],
      [r, t + arm],
    ]),
    corner([
      [l, b - arm],
      [l, b],
      [l + arm, b],
    ]),
    corner([
      [r - arm, b],
      [r, b],
      [r, b - arm],
    ]),
  );
}

/** Rounded token chip sized to its label so the text always sits inside with margin. */
export function chip(
  label,
  x,
  y,
  {
    color = ROLE.evidence,
    size = 28,
    h = 62,
    minW = 120,
    fill = '#0f1830',
    glow = 7,
    opacity = 1,
    textColor = COSMOS.ink,
    font = 'mono',
  } = {},
) {
  const w = Math.max(minW, String(label).length * size * 0.62 + 48);
  const frame = rect(w, h, { fill, stroke: color, width: 2.4, radius: 14 })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) frame.glow(glow, color);
  return group(frame, txt(label, x, y, size, textColor, font, 'center').opacity(opacity));
}

/** Width that `chip` gives a label, so scenes can lay chips out without collisions. */
export const chipWidth = (label, size = 28, minW = 120) =>
  Math.max(minW, String(label).length * size * 0.62 + 48);

/**
 * A floating record glyph: a glowing accent rule, a mono name, a large value and a mono subline.
 * No box. Text stays clear of the rule.
 */
export function recordGlyph(
  x,
  y,
  {
    name,
    value,
    sub,
    color = ROLE.evidence,
    valueColor = COSMOS.ink,
    valueSize = 64,
    opacity = 1,
    nameSize = 28,
  } = {},
) {
  const parts = [
    line([x - 30, y - 88], [x - 30, y + 96], { stroke: color, width: 5 })
      .glow(9, color)
      .opacity(opacity),
    txt(name, x, y - 66, nameSize, color, 'mono', 'left').opacity(opacity),
    txt(value, x, y + 6, valueSize, valueColor, 'serif', 'left').opacity(opacity),
  ];
  if (sub) parts.push(txt(sub, x, y + 74, 28, COSMOS.muted, 'mono', 'left').opacity(opacity));
  return group(...parts);
}

/** Stroke-drawn check mark (no font glyph needed). */
export function checkMark(x, y, size = 30, color = ROLE.note, opacity = 1) {
  return glowingTrail(
    [
      [x - size * 0.5, y],
      [x - size * 0.12, y + size * 0.4],
      [x + size * 0.55, y - size * 0.45],
    ],
    { color, width: 5, glow: 8, core: false, opacity },
  );
}

/** Stroke-drawn cross mark (no font glyph needed). */
export function crossMark(x, y, size = 30, color = ROLE.poison, opacity = 1) {
  const h = size * 0.45;
  return group(
    glowingTrail(
      [
        [x - h, y - h],
        [x + h, y + h],
      ],
      { color, width: 5, glow: 8, core: false, opacity },
    ),
    glowingTrail(
      [
        [x - h, y + h],
        [x + h, y - h],
      ],
      { color, width: 5, glow: 8, core: false, opacity },
    ),
  );
}

/** Glowing arrow between two points with a bright tip photon. */
export function glowArrow(
  from,
  to,
  color = ROLE.evidence,
  { width = 4, tip = 16, opacity = 1 } = {},
) {
  const a = arrow(from, to, { stroke: color, width, tip }).opacity(opacity).glow(8, color);
  return a;
}

/** A quiet row of dots, filled up to `filled`, such as 10 of 12 probe successes. */
export function dotRow(
  x0,
  y,
  count,
  filled,
  { spacing = 46, radius = 13, on = ROLE.note, off = ROLE.poison, opacity = 1, reveal = 1 } = {},
) {
  const nodes = [];
  for (let i = 0; i < count; i++) {
    const shown = reveal >= 1 || i < Math.round(count * reveal);
    const col = !shown ? '#2a3a63' : i < filled ? on : off;
    const d = circle(radius, { fill: col, stroke: null })
      .at(x0 + i * spacing, y)
      .opacity(opacity * (shown ? 0.95 : 0.6));
    if (shown) d.glow(7, col);
    nodes.push(d);
  }
  return group(...nodes);
}

// ---------------------------------------------------------------------------
// 3D builders.
// ---------------------------------------------------------------------------

/**
 * Orbiting lost-in-the-middle manifold: recall height over evidence depth (x, beginning to end)
 * and input length (y, short to long). Recall dips in the middle and falls as inputs grow.
 * `probe` (0..1) slides a glowing needle through depth at the long-input edge.
 */
export function buildRotManifold3d({ x = 430, y = 30, unit = 92, probe, rot, focusZ = 0.6 } = {}) {
  const view = cinematic3d({
    theta: -0.9,
    phi: 1.08,
    distance: 15.6,
    unit,
    focus: [0, 0, focusZ],
  }).at(x, y);
  const rotOf = () => (rot ? rot.value : 1);
  const height = (u, v) => {
    const len = (v + 2) / 4; // 0 short .. 1 long
    const k = rotOf();
    const edge = (u / 2.6) ** 2;
    return 1.95 - 0.55 * len * k - (0.25 + 0.75 * len * k) * (1 - edge);
  };
  const surf = surface((u, v) => height(u, v), {
    x: [-2.6, 2.6],
    y: [-2, 2],
    resolution: [30, 22],
    colors: ['#3a1030', '#ff6b8b', '#fb923c', '#ffd166', '#5ce1e6'],
    opacity: 0.9,
    mesh: '#9ce9ff',
    meshOpacity: 0.22,
    meshWidth: 0.7,
    animate: true,
  });
  const floor = gridPlane3d({
    x: [-2.6, 2.6],
    y: [-2, 2],
    z: -0.2,
    step: 0.65,
    color: '#2c3d69',
    opacity: 0.5,
  });
  const probeU = () => -2.4 + 4.8 * (probe ? probe.value : 0.5);
  const tipOf = () => [probeU(), 1.8, height(probeU(), 1.8) + 0.08];
  const needle = line3d(() => [probeU(), 1.8, -0.2], tipOf, {
    color: COSMOS.ink,
    width: 2.6,
    glow: 8,
    onTop: true,
  });
  const tip = point3d(tipOf, {
    color: '#ffffff',
    radius: 9,
    glow: 14,
    blend: 'screen',
    onTop: true,
  });
  view.add(floor, surf, needle, tip);
  return { view, height };
}

/**
 * Orbiting 3D KV-cache prefix slab: a floor grid, glowing cached-prefix slab (whose right edge
 * slides smoothly with `boundary()`), a bright cache-reuse plane, and a recomputed suffix slab.
 */
export function buildKvRow3d({
  x = 340,
  y = 40,
  unit = 84,
  total = 364,
  boundary,
  span = 6.8,
  cached = ROLE.cache,
  fresh = ROLE.units,
  theta = -0.68,
  phi = 1.06,
} = {}) {
  const view = cinematic3d({ theta, phi, distance: 15.2, unit, focus: [0, 0, 0.35] }).at(x, y);
  const half = span / 2;
  const frac = () => Math.max(0.06, Math.min(0.96, boundary() / total));
  const cutX = () => -half + frac() * span;

  const floor = gridPlane3d({
    x: [-half - 0.3, half + 0.3],
    y: [-1.4, 1.4],
    z: 0,
    step: 0.68,
    color: '#2c3d69',
    opacity: 0.52,
  });

  // 12-edge box helper from reactive x0..x1
  const boxEdges = (x0Fn, x1Fn, color, width, glow) => {
    const p = (side, sy, sz) => () => [side < 0 ? x0Fn() : x1Fn(), sy * 0.95, 0.48 + sz * 0.44];
    const top = { color, width, glow, blend: 'screen', onTop: true };
    const low = { color, width: Math.max(1.4, width * 0.65), glow, blend: 'screen', opacity: 0.72 };
    return [
      line3d(p(-1, -1, 1), p(1, -1, 1), top),
      line3d(p(1, -1, 1), p(1, 1, 1), top),
      line3d(p(1, 1, 1), p(-1, 1, 1), top),
      line3d(p(-1, 1, 1), p(-1, -1, 1), top),
      line3d(p(-1, -1, -1), p(1, -1, -1), low),
      line3d(p(1, -1, -1), p(1, 1, -1), low),
      line3d(p(1, 1, -1), p(-1, 1, -1), low),
      line3d(p(-1, 1, -1), p(-1, -1, -1), low),
      line3d(p(-1, -1, -1), p(-1, -1, 1), low),
      line3d(p(1, -1, -1), p(1, -1, 1), low),
      line3d(p(1, 1, -1), p(1, 1, 1), low),
      line3d(p(-1, 1, -1), p(-1, 1, 1), low),
    ];
  };

  const cachedSlab = boxEdges(
    () => -half,
    () => cutX() - 0.08,
    cached,
    2.6,
    9,
  );
  const freshSlab = boxEdges(
    () => cutX() + 0.08,
    () => half,
    fresh,
    2.4,
    8,
  );
  const cutPlane = [
    line3d(
      () => [cutX(), -1.25, 0],
      () => [cutX(), -1.25, 1.3],
      { color: COSMOS.ink, width: 3.2, glow: 10, onTop: true },
    ),
    line3d(
      () => [cutX(), 1.25, 0],
      () => [cutX(), 1.25, 1.3],
      { color: COSMOS.ink, width: 3.2, glow: 10, onTop: true },
    ),
    line3d(
      () => [cutX(), -1.25, 1.3],
      () => [cutX(), 1.25, 1.3],
      { color: COSMOS.ink, width: 3.2, glow: 10, onTop: true },
    ),
  ];

  // Height surface representing KV reuse density across prefix vs recomputed tail
  const surf = surface(
    (u, v) => {
      const cut = cutX();
      const inCache = u <= cut ? 1 : 0;
      const ridge = 0.72 + 0.14 * Math.cos(u * 2.4) * Math.cos(v * 2.0);
      return inCache ? ridge : 0.24 + 0.08 * Math.sin(u * 3.1);
    },
    {
      x: [-half, half],
      y: [-0.92, 0.92],
      resolution: [28, 12],
      colors: ['#2b1810', '#fb923c', '#ffd166', '#5ce1e6', '#60a5fa'],
      opacity: 0.72,
      mesh: '#9ce9ff',
      meshOpacity: 0.2,
      meshWidth: 0.7,
      animate: true,
    },
  );

  view.add(floor, surf, ...cachedSlab, ...freshSlab, ...cutPlane);
  return view;
}

export { ROLE as CONTEXT_ROLE };
