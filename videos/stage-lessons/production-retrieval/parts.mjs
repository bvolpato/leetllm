// Shared pure-cinema math invariants, semantic COSMOS roles, and 2D/3D builders
// for the 22-scene Production Retrieval stage lesson (vizmatic@0.10.0).
import {
  arrow,
  circle,
  curve3d,
  delay,
  gridPlane3d,
  group,
  line,
  line3d,
  linear,
  par,
  parametricSurface,
  points3d,
  rect,
  seq,
  surface,
} from 'vizmatic/stage';
import {
  governingRecall,
  halfOpenCurrent,
  isCurrent,
  lexicalScore,
  sourceHash,
  unknownSourceLabels,
} from '../../films/production-retrieval/arithmetic.mjs';
import {
  CORPUS,
  EVAL_DATE,
  PARENTS,
  REQUIRED_RAG_GATES,
  REVIEWED_PARENT,
  ROTATION_RULE,
} from '../../films/production-retrieval/fixtures.mjs';
import {
  allowedRecords,
  answerFromEvidence,
  completeRequestBudget,
  currentAuthorityDecision,
  filteredRecallFixture,
  injectionFixture,
  packParents,
  parentAdmission,
  parentPackingFixture,
  ragReleaseGate,
  rankAllowed,
  releaseCases,
  requestPath,
  retrieve,
  serialRequestTrace,
  toyTargetTokens,
  versionedBundle,
  zeroScoreFixture,
} from '../../films/production-retrieval/model.mjs';
import { validateModel } from '../../films/production-retrieval/validation.mjs';
import {
  CINEMA_FRAME,
  COSMOS,
  assertEqual,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  markDecoration,
  metricReadout,
  morphEquation,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  CINEMA_FRAME,
  CORPUS,
  COSMOS,
  EVAL_DATE,
  PARENTS,
  REQUIRED_RAG_GATES,
  REVIEWED_PARENT,
  ROTATION_RULE,
  allowedRecords,
  answerFromEvidence,
  assertEqual,
  aura,
  cinematic3d,
  completeRequestBudget,
  currentAuthorityDecision,
  filteredRecallFixture,
  glowDot,
  glowTex,
  glowingTrail,
  governingRecall,
  guardedDynamic,
  halfOpenCurrent,
  heroTitle,
  injectionFixture,
  isCurrent,
  lexicalScore,
  markDecoration,
  metricReadout,
  morphEquation,
  orbitScene,
  packParents,
  parentAdmission,
  parentPackingFixture,
  ragReleaseGate,
  rankAllowed,
  releaseCases,
  requestPath,
  retrieve,
  rule,
  serialRequestTrace,
  sourceHash,
  toyTargetTokens,
  txt,
  unknownSourceLabels,
  verifyApprox,
  verifyInvariant,
  versionedBundle,
  wireframeSlab3d,
  zeroScoreFixture,
};

/** Locked semantic roles across all 22 scenes: one color carries one meaning. */
export const ROLE = Object.freeze({
  request: COSMOS.blue, // Luna's request, caller identity, query vectors
  policy: COSMOS.cyan, // Governing EU key policy (E1), trusted boundaries
  admitted: COSMOS.emerald, // Permitted records, passing gates, feasible region
  session: COSMOS.rose, // Session policy (E2), expired/revoked items, distractors
  focus: COSMOS.gold, // Active highlights, predictions, clocks, thresholds
  violet: COSMOS.violet, // Index bundles, 3D surfaces, audit/metadata layers
  warn: COSMOS.amber, // Overruns, near-matches, candidate warnings
  danger: '#ff4d6d', // Hard denials, ACL rejections, tombstones, blocked releases
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
});

export const RUN = requestPath();

const limitsMatch = REVIEWED_PARENT.match(/up to (\d+) days[\s\S]*?at most (\d+) hours/);
const agesMatch = RUN.answer.text.match(/stale age (\d+) days[\s\S]*?signal age (\d+) hours/);
const outsideMatch = releaseCases()
  .find((row) => row.id === 'outside-window')
  .result.text.match(/stale age (\d+) days/);

export const RULE = Object.freeze({
  days: Number(limitsMatch[1]),
  hours: Number(limitsMatch[2]),
  requestDays: Number(agesMatch[1]),
  requestHours: Number(agesMatch[2]),
  outsideDays: Number(outsideMatch[1]),
});

/** Build-time mathematical invariant suite covering every spoken number in all 22 scenes. */
export function verifyRetrievalInvariants() {
  verifyInvariant(validateModel(), 'production-retrieval validateModel() must pass');

  // Core policy limits and request ages
  verifyInvariant(RULE.days === 14 && RULE.hours === 48, 'policy limits are 14 days and 48 hours');
  verifyInvariant(
    RULE.requestDays === 10 && RULE.requestHours === 48,
    'Luna request is 10 days and 48 hours',
  );
  verifyInvariant(RULE.outsideDays === 15, 'outside-window age is 15 days');

  // Authorized retrieval & lexical scores
  verifyInvariant(RUN.allowedCount === 2 && RUN.excludedCount === 3, '2 allowed, 3 excluded');
  verifyInvariant(RUN.hits[0].score === 7 && RUN.hits[1].score === 2, 'lexical scores are 7 and 2');

  // Paraphrase zero-score counterexample
  const zero = zeroScoreFixture();
  verifyInvariant(
    zero.hits[0].score === 0 && zero.hits[1].score === 0,
    'paraphrase scores are 0 and 0',
  );
  verifyInvariant(zero.answer.decision === 'eligible', 'unfiltered tie yields eligible');
  verifyInvariant(
    retrieve(zero.query, RUN.caller).length === 0,
    'minTerms=2 returns 0 passages on paraphrase',
  );

  // Filtered recall (global top-3 vs allowed top-3)
  const filt = filteredRecallFixture();
  verifyInvariant(
    filt.redacted.length === 1 && filt.allowed.length === 3,
    'global cut redacts to 1, allowed cut yields 3',
  );

  // Context character and toy token budgets
  const pack = parentPackingFixture();
  const srcLine = (e) => `[${e.sourceId}] ${e.parentId} (${e.version}): ${e.text}`;
  const keyChars = srcLine(pack.packed[0]).length;
  const sessionChars = srcLine(pack.packed[1]).length + 1;
  verifyInvariant(keyChars === 217, `E1 section is 217 chars (got ${keyChars})`);
  verifyInvariant(sessionChars === 121, `E2 + newline is 121 chars (got ${sessionChars})`);
  verifyInvariant(keyChars + sessionChars === 338, 'total packed chars = 338');
  verifyInvariant(pack.budget.total === 501, `toy input tokens = 501 (got ${pack.budget.total})`);
  verifyInvariant(pack.budget.reservedOutput === 256, 'reserved output = 256 tokens');

  // Appendix trial check (297 chars > 183 remaining)
  const appendix = {
    ...PARENTS['eu-access-v2'],
    id: 'eu-access-history',
    text: 'Current key rule: ' + CORPUS[0].text + '\nHistorical key rule: ' + CORPUS[1].text,
  };
  const [, cand] = packParents(
    [pack.run.hits[0], { record: { ...CORPUS[0], id: 'history-span', parentId: appendix.id } }],
    pack.run.caller,
    EVAL_DATE,
    1000,
    { ...PARENTS, [appendix.id]: appendix },
  );
  const appendixChars = 1 + srcLine(cand).length;
  verifyInvariant(appendixChars === 297, `appendix needs 297 chars (got ${appendixChars})`);
  verifyInvariant(400 - keyChars === 183, 'remaining room after E1 is 183 chars');

  // Half-open logical time boundary at 20
  verifyInvariant(halfOpenCurrent({ start: 0, end: 20 }, 20) === false, '[0, 20) excludes 20');
  verifyInvariant(halfOpenCurrent({ start: 20, end: null }, 20) === true, '[20, inf) includes 20');

  // Recall contracts
  const exact = ['1', '2', '3', '4', '5', '6', '7', '8', 'R', '10'];
  const approx = [...exact.slice(0, 8), 'X', 'Y'];
  const rec = governingRecall(exact, approx, ['R']);
  verifyApprox(rec.ann, 0.8, 1e-12, 'ANN recall = 0.8');
  verifyApprox(rec.task, 0.0, 1e-12, 'candidate/task recall = 0.0');

  // Serial latency & cumulative deadline
  const trace = serialRequestTrace();
  verifyInvariant(trace.callerTTFT === 341 && trace.modelTTFT === 320, 'TTFT 341 vs 320');
  verifyInvariant(trace.completion === 751 && trace.traceComplete === 754, '751 ms / 754 ms');
  verifyInvariant(trace.localTotal === 1050, 'stage caps sum to 1050 ms');

  // Independent stage tail probability and 6 gates
  verifyApprox(0.95 ** 5, 0.7737809375, 1e-12, '0.95^5 ~ 0.774');
  verifyInvariant(REQUIRED_RAG_GATES.length === 6, '6 required release gates');

  // Fresh evidence boundary (13d/47h vs tombstone vs 13d/49h)
  verifyInvariant(
    currentAuthorityDecision({ staleDays: 13, signalHours: 47 }) === 'eligible',
    '13d/47h eligible',
  );
  verifyInvariant(
    currentAuthorityDecision({ deleted: true, staleDays: 13, signalHours: 47 }) === 'abstain',
    'tombstone abstains',
  );
  verifyInvariant(
    currentAuthorityDecision({ staleDays: 13, signalHours: 49 }) === 'ineligible',
    '13d/49h ineligible',
  );
}

/** Convert `#rrggbb` + alpha in [0, 1] to 8-digit `#rrggbbaa` (Vizmatic `rect` safe). */
export function hexAlpha(hex, alpha = 1) {
  if (typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 7) return hex;
  const clean = hex.slice(0, 7);
  const byte = Math.max(0, Math.min(255, Math.round(alpha * 255)))
    .toString(16)
    .padStart(2, '0');
  return `${clean}${byte}`;
}

/** Clamp a play duration so an animation never outruns the scene narration window. */
export function safeDur(c, startTime, desired = 0.7, margin = 0.45) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.12, Math.min(desired, remaining));
}

/** Safe duration spanning the full scene window. */
export function safeSceneDur(c, startOffset = 0.08, endMargin = 0.5) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

/** Schedule an animation at a declared cue (start or end), clamped safely inside the scene. */
export function playCue(
  s,
  c,
  cueId,
  build,
  { after = false, offset = 0, dur = 0.7, margin = 0.45 } = {},
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

/** Schedule a smooth value tween at a cue (`after: true` strictly withholds until clause end). */
export function tweenCue(
  s,
  c,
  cueId,
  val,
  to,
  { dur = 0.55, after = false, offset = 0, ease } = {},
) {
  return playCue(
    s,
    c,
    cueId,
    (d) => {
      const opts = ease ? { duration: d, ease } : { duration: d };
      s.play(val.to(to, opts));
    },
    { after, offset, dur },
  );
}

/** Non-overlapping crossfade weights for swapping text at the same coordinates (zero text_overlap). */
export function crossFade(v) {
  const clamped = Math.max(0, Math.min(1, v));
  return {
    outOp: Math.max(0, 1 - clamped * 2.6),
    inOp: Math.max(0, (clamped - 0.45) / 0.55),
  };
}

/** Sequential fade-out then fade-in across two dynamic Values (strict zero-overlap). */
export function crossSwap(s, c, cueId, outVal, inVal, { dur = 0.55, after = false } = {}) {
  return playCue(
    s,
    c,
    cueId,
    (d) => {
      const half = Math.max(0.1, d * 0.46);
      s.play(
        par(outVal.to(0, { duration: half }), delay(inVal.to(1, { duration: half }), half * 1.02)),
      );
    },
    { after, dur },
  );
}

/** Drive a continuous subtle ambient oscillation across the entire scene window. */
export function runPhase(s, c, phaseVal, target = 12, startOffset = 0.08) {
  const dur = safeSceneDur(c, startOffset, 0.5);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/** Ambient radial energy fields behind scene geometry (marked decoration so never trips checks). */
export function cinemaAtmosphere(primary = ROLE.policy, secondary = ROLE.request) {
  return markDecoration(
    group(
      aura(-520, -210, 560, hexAlpha(primary, 0.14), '#07091000'),
      aura(480, 140, 620, hexAlpha(secondary, 0.13), '#07091000'),
      aura(0, 30, 740, '#1e306224', '#07091000'),
    ).zIndex(-80),
  );
}

/** Luminous dark-glass conduit bar or frame (8-digit hex translucent fill + bright edge glow). */
export function lumBar(
  cx,
  cy,
  w,
  h,
  {
    color = ROLE.policy,
    fillAlpha = 0.16,
    strokeWidth = 2.2,
    glow = 7,
    radius = 8,
    opacity = 1,
    dash,
  } = {},
) {
  const node = rect(Math.max(4, w), Math.max(4, h), {
    fill: fillAlpha > 0.005 ? hexAlpha(color, fillAlpha) : null,
    stroke: strokeWidth > 0 ? color : null,
    width: strokeWidth,
    radius,
    dash,
  })
    .at(cx, cy)
    .opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Glowing open or softly filled orbital ring. */
export function glowRing(
  cx,
  cy,
  r,
  color = ROLE.focus,
  { width = 3, glow = 9, fillAlpha = 0.08, opacity = 1, dash } = {},
) {
  const node = circle(r, {
    fill: fillAlpha > 0.005 ? hexAlpha(color, fillAlpha) : null,
    stroke: color,
    width,
    dash,
  })
    .at(cx, cy)
    .opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Glowing directional vector arrow. */
export function glowArrow(
  from,
  to,
  color = ROLE.policy,
  { width = 3.6, tip = 14, glow = 7, opacity = 1, pad = 0 } = {},
) {
  const node = arrow(from, to, { stroke: color, width, tip, pad }).opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Smooth glowing quadratic Bezier arc between two 2D points. */
export function glowBezier(
  from,
  to,
  bendY = -42,
  { color = ROLE.policy, width = 3.4, glow = 8, opacity = 0.9, steps = 26, core = false } = {},
) {
  const mx = (from[0] + to[0]) * 0.5;
  const my = (from[1] + to[1]) * 0.5 + bendY;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * from[0] + 2 * u * t * mx + t * t * to[0],
      u * u * from[1] + 2 * u * t * my + t * t * to[1],
    ]);
  }
  return glowingTrail(pts, { color, width, glow, opacity, core });
}

/** Word-wrap prose cleanly to a maximum character width for floating cinema excerpts. */
export function wrapLines(str, maxChars = 40) {
  const words = String(str).split(/\s+/);
  const out = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ' ' + word;
    } else {
      out.push(current);
      current = word;
    }
  }
  if (current) out.push(current);
  return out;
}

/** Render multi-line floating cinema text with generous line spacing (zero overlap). */
export function textLines(
  lines,
  x,
  y,
  {
    size = 28,
    lineHeight = 42,
    color = COSMOS.ink,
    font = 'sans',
    anchor = 'left',
    opacity = 1,
    glow = 0,
  } = {},
) {
  return lines.map((lineText, idx) => {
    const n = txt(lineText, x, y + idx * lineHeight, size, color, font, anchor).opacity(opacity);
    if (glow > 0) n.glow(glow, color);
    return n;
  });
}

/** Floating translucent glowing status tag (sleek inline label, not a heavy slide card). */
export function statusPill(
  labelText,
  x,
  y,
  { color = ROLE.policy, width = 220, height = 46, size = 26, opacity = 1, glow = 7 } = {},
) {
  return group(
    lumBar(x, y, width, height, {
      color,
      fillAlpha: 0.16,
      strokeWidth: 2.0,
      glow,
      radius: 22,
      opacity,
    }),
    txt(labelText, x, y, size, color, 'mono', 'center').opacity(opacity),
  );
}

/** Subtle floating caller identity line tucked top-right (zero slide banner chrome). */
export function callerTag(opacity = 1, { x = 855, y = -445 } = {}) {
  return group(
    glowDot(x - 515, y, { radius: 6, color: ROLE.request, glow: 10, opacity }),
    txt('LUNA · EU SUPPORT · 2026-05-27', x, y, 26, ROLE.request, 'mono', 'right').opacity(opacity),
  );
}

/**
 * Orbiting 3D Triple-Path Architecture (Ingestion / Request / Release concentric orbital rings
 * with moving photon beacons) for `three-paths`.
 */
export function buildTripleOrbit3d(phaseVal, { x = 390, y = 30 } = {}) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 1.04,
    distance: 14.6,
    unit: 112,
    focus: [0, 0, 0.95],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.0, 3.0],
      y: [-3.0, 3.0],
      z: -0.1,
      step: 0.75,
      color: '#1b2847',
      opacity: 0.36,
    }),
  );

  const rings = [
    { z: 2.1, r: 2.25, color: ROLE.policy, speed: 0.8 }, // Ingestion
    { z: 1.05, r: 2.0, color: ROLE.request, speed: 1.15 }, // Request
    { z: 0.05, r: 1.75, color: ROLE.admitted, speed: 0.95 }, // Release
  ];

  rings.forEach(({ z, r, color, speed }, idx) => {
    view.add(
      curve3d((t) => [r * Math.cos(t), r * Math.sin(t), z], 0, Math.PI * 2, {
        color,
        width: 3.4,
        glow: 9,
        blend: 'screen',
        samples: 72,
        onTop: true,
      }),
    );
    // 3 stage pillar ticks per ring (Parse/Version/Index etc.)
    for (let k = 0; k < 3; k++) {
      const a = (k * 2 * Math.PI) / 3 + idx * 0.35;
      view.add(
        line3d(
          [r * Math.cos(a), r * Math.sin(a), z - 0.14],
          [r * Math.cos(a), r * Math.sin(a), z + 0.14],
          {
            color,
            width: 4.0,
            glow: 8,
            blend: 'screen',
            onTop: true,
          },
        ),
      );
    }
    // Orbiting glowing photon
    view.add(
      points3d(
        () => {
          const a = phaseVal.value * speed + idx * 2.1;
          return [[r * Math.cos(a), r * Math.sin(a), z]];
        },
        {
          color: ROLE.focus,
          radius: 7.5,
          glow: 14,
          blend: 'screen',
          onTop: true,
        },
      ),
    );
  });

  // Central policy spine linking all 3 lifetimes
  view.add(
    line3d([0, 0, -0.05], [0, 0, 2.55], {
      color: ROLE.focus,
      width: 4.0,
      glow: 11,
      blend: 'screen',
      onTop: true,
    }),
    points3d(
      [
        [0, 0, 2.55],
        [0, 0, 2.1],
        [0, 0, 1.05],
        [0, 0, 0.05],
      ],
      {
        color: ROLE.focus,
        radius: 6.5,
        glow: 12,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  return { view };
}

/**
 * Orbiting 3D HNSW Graph inside a translucent trusted search sphere (`filtering-contract`).
 * Traverses Q -> R1 (restricted) -> P1 (permitted) alongside R2, P2, P3.
 */
export function buildHnswFilter3d(hopProgress, { x = 430, y = 20 } = {}) {
  const view = cinematic3d({
    theta: -0.72,
    phi: 1.06,
    distance: 14.0,
    unit: 112,
    focus: [0, 0, 0.2],
  }).at(x, y);

  const radius = 2.35;
  view.add(
    parametricSurface(
      (u, v) => [
        radius * Math.sin(v) * Math.cos(u),
        radius * Math.sin(v) * Math.sin(u),
        radius * Math.cos(v),
      ],
      [0, Math.PI * 2],
      [0.08, Math.PI - 0.08],
      {
        resolution: [24, 16],
        color: '#102140',
        mesh: ROLE.policy,
        meshOpacity: 0.14,
        meshWidth: 0.55,
        opacity: 0.2,
        shaded: true,
      },
    ),
  );

  const P = {
    Q: [-1.45, -0.8, 0.45],
    R1: [-0.25, -0.2, 0.65],
    R2: [-0.6, 0.95, -0.3],
    P1: [0.95, 0.25, 0.75],
    P2: [1.15, -0.75, -0.45],
    P3: [0.55, 1.1, 0.15],
  };

  const edges = [
    ['Q', 'R1', ROLE.warn],
    ['Q', 'R2', '#39527e'],
    ['R1', 'P1', ROLE.admitted],
    ['R1', 'P2', '#39527e'],
    ['R2', 'P3', '#39527e'],
    ['P1', 'P2', ROLE.policy],
    ['P1', 'P3', ROLE.policy],
  ];
  for (const [a, b, col] of edges) {
    view.add(
      line3d(P[a], P[b], {
        color: col,
        width: col === '#39527e' ? 2.0 : 3.6,
        opacity: col === '#39527e' ? 0.55 : 0.92,
        glow: col === '#39527e' ? 0 : 9,
        blend: 'screen',
        onTop: true,
      }),
    );
  }

  const pts = [P.Q, P.R1, P.R2, P.P1, P.P2, P.P3];
  const cols = [
    ROLE.request,
    ROLE.danger,
    ROLE.danger,
    ROLE.admitted,
    ROLE.admitted,
    ROLE.admitted,
  ];
  view.add(
    points3d(pts, {
      colorAt: (i) => cols[i],
      radius: 7.5,
      glow: 13,
      blend: 'screen',
      onTop: true,
    }),
  );

  // Traveling traversal photon: 0..0.5 Q -> R1, 0.5..1 R1 -> P1
  const lerp3 = (a, b, t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
  view.add(
    points3d(
      () => {
        const h = Math.max(0, Math.min(1, hopProgress.value));
        const pos = h <= 0.5 ? lerp3(P.Q, P.R1, h * 2) : lerp3(P.R1, P.P1, (h - 0.5) * 2);
        return [pos];
      },
      {
        color: ROLE.focus,
        radius: 9.5,
        glow: 16,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  return { view };
}

/**
 * Orbiting 3D BM25-vs-Dense Hybrid / RRF Score Fusion Surface (`lexical-counterexample` & `recall-contracts`).
 * x = lexical rank quality, y = dense semantic alignment, z = fused RRF / hybrid score.
 */
export function buildHybridSurface3d(queryPointFn, { x = 440, y = 25 } = {}) {
  const rrfZ = (lx, dy) => {
    const rLex = 1 + (2.6 - lx) * 2.2;
    const rDen = 1 + (2.6 - dy) * 2.2;
    const fused = 22 * (1 / (4 + Math.max(0.2, rLex)) + 1 / (4 + Math.max(0.2, rDen)));
    return Math.min(2.8, fused * 0.42);
  };

  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.0,
    unit: 108,
    focus: [0, 0, 0.9],
  }).at(x, y);

  view.add(
    surface((wx, wy) => rrfZ(wx, wy), {
      x: [-2.2, 2.4],
      y: [-2.2, 2.4],
      resolution: [30, 30],
      colors: ['#0c1c36', '#163860', '#1d658c', '#3ea6b8', '#6ee7b7', '#ffd166'],
      mesh: ROLE.policy,
      meshOpacity: 0.16,
      meshWidth: 0.55,
      opacity: 0.84,
    }),
  );

  // Diagonal ridge curve where hybrid fusion lifts paraphrases (low lexical, high dense)
  view.add(
    curve3d(
      (t) => {
        const lx = -1.8 + 3.8 * t;
        const dy = 1.9 - 0.4 * t;
        return [lx, dy, rrfZ(lx, dy) + 0.08];
      },
      0,
      1,
      {
        color: ROLE.focus,
        width: 3.6,
        glow: 10,
        blend: 'screen',
        samples: 44,
        onTop: true,
      },
    ),
  );

  // Live glowing query beacon on the surface
  view.add(
    line3d(
      () => {
        const [lx, dy] = queryPointFn();
        return [lx, dy, rrfZ(lx, dy)];
      },
      () => {
        const [lx, dy] = queryPointFn();
        return [lx, dy, rrfZ(lx, dy) + 0.9];
      },
      {
        color: ROLE.focus,
        width: 3.8,
        glow: 11,
        blend: 'screen',
        onTop: true,
      },
    ),
    points3d(
      () => {
        const [lx, dy] = queryPointFn();
        return [[lx, dy, rrfZ(lx, dy) + 0.12]];
      },
      {
        color: ROLE.focus,
        radius: 8,
        glow: 14,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  return { view, rrfZ };
}

/**
 * Orbiting 3D Twin Atomic Bundle Vaults (`pinned-bundle`): Bundle A (cyan) vs Bundle B (violet)
 * with animated serving pointer and child-to-parent link tether.
 */
export function buildBundleVault3d(linkMode, { x = 440, y = 20 } = {}) {
  // linkMode: 0 = pinned to A, 1 = broken cross-pointer to B, 2 = repaired to A
  const view = cinematic3d({
    theta: -0.72,
    phi: 1.05,
    distance: 15.2,
    unit: 106,
    focus: [0, 0, 0.8],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-2.4, 2.4],
      z: -0.2,
      step: 0.8,
      color: '#1b2847',
      opacity: 0.35,
    }),
  );

  // Bundle A (left, x=-1.45): 4 stacked slabs (child index, parent store, manifest, config)
  const layers = [0.25, 0.85, 1.45, 2.05];
  layers.forEach((z) => {
    view.add(
      ...wireframeSlab3d([-1.55, 0, z], 0.95, 0.72, 0.18, {
        color: ROLE.policy,
        width: 2.2,
        glow: 6,
      }),
    );
    view.add(
      ...wireframeSlab3d([1.55, 0, z], 0.95, 0.72, 0.18, {
        color: ROLE.violet,
        width: 2.2,
        glow: 6,
      }),
    );
  });

  // Child A node & dynamic tether to parent A or parent B
  const childA = [-1.55, 0, 2.05];
  const parentA = [-1.55, 0, 1.45];
  const parentB = [1.55, 0, 1.45];

  view.add(
    line3d(
      childA,
      () => {
        const m = linkMode.value;
        // smooth blend: 0..1 goes parentA -> parentB; 1..2 returns parentB -> parentA
        const t = m <= 1 ? m : Math.max(0, 2 - m);
        return [
          parentA[0] + (parentB[0] - parentA[0]) * t,
          parentA[1],
          parentA[2] + Math.sin(t * Math.PI) * 0.45,
        ];
      },
      {
        color: ROLE.focus,
        width: 5.0,
        glow: 13,
        blend: 'screen',
        onTop: true,
      },
    ),
    points3d(
      () => {
        const m = linkMode.value;
        const t = m <= 1 ? m : Math.max(0, 2 - m);
        const dst = [
          parentA[0] + (parentB[0] - parentA[0]) * t,
          parentA[1],
          parentA[2] + Math.sin(t * Math.PI) * 0.45,
        ];
        return [childA, dst];
      },
      {
        colorAt: (i) => (i === 0 ? ROLE.request : ROLE.focus),
        radius: 8,
        glow: 14,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  return { view };
}

export { delay, par, seq };
