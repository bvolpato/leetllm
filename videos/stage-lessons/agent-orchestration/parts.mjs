// Shared pure-cinema invariants, semantic COSMOS palette, 3D DAG/barrier/vault rigs,
// and luminous primitives for the 11-scene `agent-orchestration` stage film (vizmatic@0.10.0).
import {
  Node,
  arrow,
  circle,
  curve3d,
  delay,
  dot,
  dynamic,
  gridPlane3d,
  group,
  line,
  line3d,
  linear,
  par,
  points3d,
  polyPath,
  rect,
  seq,
} from 'vizmatic/stage';
import {
  digest,
  readSchedule,
  waitingJoinTrace,
} from '../../films/agent-orchestration/arithmetic.mjs';
import {
  RECEIPTS as RAW_RECEIPTS,
  REQUEST,
  values,
} from '../../films/agent-orchestration/fixtures.mjs';
import {
  canWrite,
  merge,
  operationTarget,
  validateModel,
} from '../../films/agent-orchestration/model.mjs';
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
import {
  BRANCHES,
  FRESH_SECONDS,
  RATE_LIMITS,
  RECEIPTS,
  V4_RECEIPTS,
  canonicalDigest,
  freshPacket,
  proposal,
  reconciled,
  reconciledEffects,
  recorded,
  recordedEffects,
} from './packet.mjs';

export {
  BRANCHES,
  CINEMA_FRAME,
  COSMOS,
  FRESH_SECONDS,
  Node,
  RATE_LIMITS,
  RAW_RECEIPTS,
  RECEIPTS,
  REQUEST,
  V4_RECEIPTS,
  arrow,
  aura,
  canWrite,
  canonicalDigest,
  cinematic3d,
  circle,
  curve3d,
  delay,
  digest,
  dot,
  dynamic,
  freshPacket,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  line,
  line3d,
  linear,
  markDecoration,
  merge,
  metricReadout,
  morphEquation,
  operationTarget,
  orbitScene,
  par,
  points3d,
  polyPath,
  proposal,
  readSchedule,
  reconciled,
  reconciledEffects,
  recorded,
  recordedEffects,
  rect,
  rule,
  seq,
  txt,
  values,
  verifyApprox,
  verifyInvariant,
  waitingJoinTrace,
  wireframeSlab3d,
};

/** Locked semantic COSMOS palette across all 11 `agent-orchestration` scenes. */
export const ROLE = Object.freeze({
  triage: COSMOS.blue,
  eval: COSMOS.cyan,
  health: COSMOS.violet,
  policy: COSMOS.amber,
  merge: COSMOS.gold,
  review: COSMOS.gold,
  writer: COSMOS.emerald,
  pass: COSMOS.emerald,
  reject: COSMOS.rose,
  mark: COSMOS.gold,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
  surface: COSMOS.surface,
});

export const V3_PACKET = Object.freeze(proposal(RECEIPTS, REQUEST));
export const V3_CHANGED_EVAL_SOURCES = Object.freeze({
  ...values,
  eval: { failures: 1, cases: 100 },
});
export const V3_CHANGED_RECEIPTS = Object.freeze(
  RECEIPTS.map((row) =>
    row.branch === 'eval'
      ? {
          ...row,
          value: V3_CHANGED_EVAL_SOURCES.eval,
          digest: canonicalDigest(V3_CHANGED_EVAL_SOURCES.eval),
        }
      : row,
  ),
);
export const V3_CHANGED_PACKET = Object.freeze(
  proposal(V3_CHANGED_RECEIPTS, REQUEST, V3_CHANGED_EVAL_SOURCES),
);

export const DURATIONS = Object.freeze({
  eval: 2,
  health: 3,
  policy: 1,
  merge: 0.5,
  serialReads: 6,
  serialTotal: 6.5,
  parallelReads: 3,
  parallelTotal: 3.5,
  deadline: 4,
});

export const INITIAL_AGE_S = 10;
export const STALE_AGE_S = 210;
export const ARTICLE_FRESH_S = 300;

export function shortHash(hex, len = 8) {
  return String(hex ?? '').slice(0, len);
}

/** Build-time mathematical & contract invariant suite backed by `videos/films/agent-orchestration/`. */
export function verifyOrchestrationInvariants() {
  validateModel();

  // Timing & critical path arithmetic
  verifyApprox(DURATIONS.eval + DURATIONS.health + DURATIONS.policy, 6, 1e-12, 'serial reads = 6s');
  verifyApprox(
    Math.max(DURATIONS.eval, DURATIONS.health, DURATIONS.policy),
    3,
    1e-12,
    'parallel critical path = 3s',
  );
  verifyApprox(
    DURATIONS.parallelReads + DURATIONS.merge,
    3.5,
    1e-12,
    'parallel + 0.5s merge = 3.5s',
  );
  verifyApprox(DURATIONS.serialReads + DURATIONS.merge, 6.5, 1e-12, 'serial + 0.5s merge = 6.5s');
  verifyInvariant(
    readSchedule(1).branches.filter((b) => b.complete).length === 1 &&
      !readSchedule(2.5).allReads &&
      readSchedule(3).allReads &&
      !readSchedule(3).mergeComplete &&
      readSchedule(3.5).mergeComplete,
    'readSchedule milestones match 1s / 2.5s / 3s / 3.5s',
  );

  // Unequal-depth fan-in trace
  const w2 = waitingJoinTrace(2);
  const w4 = waitingJoinTrace(4);
  verifyInvariant(
    w2.separateMerges.length === 1 && w2.waitingMerges.length === 0,
    'at t=2: 1 partial separate merge, 0 waiting merges',
  );
  verifyInvariant(
    w4.separateMerges.length === 2 && w4.waitingMerges.length === 1,
    'at t=4: 2 separate merges, 1 complete waiting merge',
  );

  // Fixture rates & limits
  verifyApprox(
    values.eval.failures / values.eval.cases,
    0.02,
    1e-12,
    'eval failure rate 2/100 = 2%',
  );
  verifyInvariant(
    values.eval.failures / values.eval.cases <= RATE_LIMITS.eval,
    'eval 2% <= 3% limit',
  );
  verifyApprox(
    values.health.errors / values.health.requests,
    0.0004,
    1e-12,
    'health error rate 4/10000 = 0.04%',
  );
  verifyApprox(
    values.health.errors / values.health.requests / RATE_LIMITS.health,
    0.4,
    1e-12,
    'health burn share = 40% (0.4x allowance)',
  );
  verifyInvariant(
    REQUEST.traffic === 25 && values.policy.maxTraffic === 25,
    'requested traffic 25% equals policy ceiling 25%',
  );

  // Freshness & age math
  verifyInvariant(FRESH_SECONDS === 60, 'film freshness ceiling is 60s');
  verifyInvariant(1000 - RECEIPTS[0].time === INITIAL_AGE_S, 'initial receipt age is 10s');
  verifyInvariant(1200 - RECEIPTS[0].time === STALE_AGE_S, 'paused receipt age is 210s');

  // Canonicalization & digest binding
  verifyInvariant(
    canonicalDigest({ cases: 100, failures: 2 }) === canonicalDigest({ failures: 2, cases: 100 }),
    'canonical key sorting yields identical JSON digest',
  );
  verifyInvariant(
    proposal([...RECEIPTS].reverse()).evidenceDigest === V3_PACKET.evidenceDigest,
    'proposal digest is independent of arrival order',
  );
  verifyInvariant(
    V3_CHANGED_PACKET.evidenceDigest !== V3_PACKET.evidenceDigest,
    'changing eval failures 2 -> 1 changes proposal evidenceDigest',
  );

  // Negative traffic lower-bound & writer idempotency invariants
  verifyInvariant(merge(RAW_RECEIPTS, 1000, { ...REQUEST, traffic: -1 }) === false, '-1 rejected');
  verifyInvariant(
    freshPacket.version === 4 &&
      recorded.change === 'change-1' &&
      reconciled.change === 'change-1' &&
      recordedEffects === 1 &&
      reconciledEffects === 1,
    'op-18 replay returns change-1 with 1 effect',
  );
  verifyInvariant(
    canWrite({ ...V3_PACKET, approved: true }, 3, V3_PACKET) &&
      !canWrite({ ...V3_PACKET, approved: true }, 4, V3_PACKET),
    'v3 approval passes at live v3 and blocks at live v4',
  );
}

/** Convert `#rrggbb` + alpha in [0, 1] into `#rrggbbaa` for Vizmatic rect fills. */
export function hexAlpha(hex, alpha = 1) {
  if (typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) return hex;
  const byte = Math.max(0, Math.min(255, Math.round(alpha * 255)))
    .toString(16)
    .padStart(2, '0');
  return `${hex}${byte}`;
}

/** Clamp a tween duration safely inside the scene window so narration is never overrun. */
export function safeDur(c, startTime, desired = 0.55, margin = 0.25) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.08, Math.min(desired, remaining));
}

/** Schedule a smooth Value tween on a cue (`after: true` gates strictly until clause end). */
export function tweenCue(s, c, cueId, val, to, { duration = 0.45, after = false, ease } = {}) {
  const info = c.cue(cueId);
  const startAt = after ? info.end : info.start;
  const remaining = c.end - startAt - 0.16;
  const fire = () => {
    if (remaining <= 0.12) {
      val.set(to);
      return;
    }
    const d = Math.max(0.08, Math.min(duration, remaining));
    const opts = ease ? { duration: d, ease } : { duration: d };
    s.play(val.to(to, opts));
  };
  if (after) c.after(cueId, fire);
  else c.on(cueId, fire);
}

/** Non-overlapping sequential cross-swap between two visibility values (zero text overlap). */
export function crossSwap(s, c, cueId, outVal, inVal, { duration = 0.44, after = false } = {}) {
  const info = c.cue(cueId);
  const startAt = after ? info.end : info.start;
  const remaining = c.end - startAt - 0.16;
  const fire = () => {
    if (remaining <= 0.18) {
      outVal.set(0);
      inVal.set(1);
      return;
    }
    const d = Math.max(0.16, Math.min(duration, remaining));
    const half = d * 0.45;
    s.play(
      par(outVal.to(0, { duration: half }), delay(inVal.to(1, { duration: half }), half * 1.08)),
    );
  };
  if (after) c.after(cueId, fire);
  else c.on(cueId, fire);
}

/** Continuous ambient phase oscillator spanning the full scene window. */
export function runAmbientPhase(s, c, phaseVal, cycles = 2.0) {
  const dur = Math.max(0.5, c.end - c.start - 0.4);
  c.at(0.05, () => {
    s.play(phaseVal.to(cycles * Math.PI * 2, { duration: dur, ease: linear }));
  });
}

/** Subtle non-occluding multi-aura cosmic atmosphere. */
export function cinemaAtmosphere(primary = ROLE.eval, secondary = ROLE.health) {
  return markDecoration(
    group(
      aura(-540, -220, 580, hexAlpha(primary, 0.13), '#07091000'),
      aura(500, 150, 620, hexAlpha(secondary, 0.12), '#07091000'),
      aura(0, 10, 740, '#1c2b591e', '#07091000'),
    ).zIndex(-80),
  );
}

/** Translucent luminous bar (for timelines, gauges, and compact packet tokens). */
export function lumBar(
  cx,
  cy,
  w,
  h,
  {
    color = ROLE.eval,
    fillOpacity = 0.24,
    strokeWidth = 2.2,
    glow = 8,
    radius = 8,
    opacity = 1,
    dash,
  } = {},
) {
  const node = rect(Math.max(4, w), Math.max(4, h), {
    fill: fillOpacity > 0.005 ? hexAlpha(color, fillOpacity) : null,
    stroke: color,
    width: strokeWidth,
    radius,
    dash,
  })
    .at(cx, cy)
    .opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Luminous circular boundary ring. */
export function glowRing(
  cx,
  cy,
  r,
  color = ROLE.eval,
  { width = 3, glow = 8, fillOpacity = 0, opacity = 1, dash } = {},
) {
  const node = circle(r, {
    fill: fillOpacity > 0.005 ? hexAlpha(color, fillOpacity) : null,
    stroke: color,
    width,
    dash,
  })
    .at(cx, cy)
    .opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Glowing directional arrow. */
export function glowArrow(
  from,
  to,
  color = ROLE.eval,
  { width = 3.2, tip = 13, opacity = 1, dash, glow = 7 } = {},
) {
  const node = arrow(from, to, { stroke: color, width, tip, dash }).opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Smooth 2D quadratic Bezier curve rendered as a glowing trail. */
export function glowingArc(
  from,
  to,
  bend = -40,
  { color = ROLE.mark, width = 3.2, glow = 8, opacity = 0.9, steps = 22 } = {},
) {
  const mx = (from[0] + to[0]) * 0.5;
  const my = (from[1] + to[1]) * 0.5 + bend;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * from[0] + 2 * u * t * mx + t * t * to[0],
      u * u * from[1] + 2 * u * t * my + t * t * to[1],
    ]);
  }
  return glowingTrail(pts, { color, width, glow, opacity, core: false });
}

/** Smooth horizontal S-curve for clean routing wires. */
export function conduitPts(p0, p1, steps = 20) {
  const [x0, y0] = p0;
  const [x1, y1] = p1;
  const dx = x1 - x0;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    const cx0 = x0 + dx * 0.46;
    const cx1 = x1 - dx * 0.46;
    return [
      u * u * u * x0 + 3 * u * u * t * cx0 + 3 * u * t * t * cx1 + t * t * t * x1,
      u * u * u * y0 + 3 * u * u * t * y0 + 3 * u * t * t * y1 + t * t * t * y1,
    ];
  });
}

/** Sample point along a polyline at normalized t in [0, 1]. */
export function samplePolyline(pts, t) {
  const clamped = Math.max(0, Math.min(1, t));
  const pos = clamped * (pts.length - 1);
  const idx = Math.min(pts.length - 2, Math.floor(pos));
  const frac = pos - idx;
  return [
    pts[idx][0] + (pts[idx + 1][0] - pts[idx][0]) * frac,
    pts[idx][1] + (pts[idx + 1][1] - pts[idx][1]) * frac,
  ];
}

/**
 * Luminous horizontal progress gauge with cap marker and optional overflow flare.
 * Returns { nodes, capX } for use inside `guardedDynamic`.
 */
export function renderGauge(
  left,
  cy,
  width,
  height,
  level,
  {
    cap = 0.8,
    color = ROLE.eval,
    overColor = ROLE.reject,
    limitColor = COSMOS.ink,
    opacity = 1,
    showLimit = true,
  } = {},
) {
  const clamped = Math.max(0, Math.min(1, level));
  const capX = left + width * cap;
  const nodes = [
    lumBar(left + width * 0.5, cy, width, height, {
      color: COSMOS.rule,
      fillOpacity: 0.28,
      strokeWidth: 1.8,
      glow: 0,
      radius: 7,
      opacity,
    }),
  ];
  const fillW = Math.min(clamped, cap) * width;
  if (fillW > 3) {
    nodes.push(
      lumBar(left + fillW * 0.5, cy, fillW, height - 6, {
        color,
        fillOpacity: 0.72,
        strokeWidth: 1.8,
        glow: 8,
        radius: 5,
        opacity,
      }),
    );
  }
  if (clamped > cap + 0.005) {
    const overW = (clamped - cap) * width;
    nodes.push(
      lumBar(capX + overW * 0.5, cy, overW, height - 6, {
        color: overColor,
        fillOpacity: 0.85,
        strokeWidth: 2,
        glow: 11,
        radius: 5,
        opacity,
      }),
    );
  }
  if (showLimit) {
    nodes.push(
      line([capX, cy - height * 0.5 - 10], [capX, cy + height * 0.5 + 10], {
        stroke: limitColor,
        width: 3.5,
      })
        .glow(6, limitColor)
        .opacity(opacity),
    );
  }
  return { nodes, capX };
}

/** Circular gauge / dial arc rendered as glowing polylines (no text crowding). */
export function renderArcDial(
  cx,
  cy,
  radius,
  fraction,
  {
    color = ROLE.eval,
    trackColor = COSMOS.rule,
    capFraction = null,
    capColor = ROLE.policy,
    startAngle = Math.PI * 0.78,
    sweep = Math.PI * 1.44,
    width = 10,
    opacity = 1,
  } = {},
) {
  const arcPts = (a0, a1, steps = 32) =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const a = a0 + ((a1 - a0) * i) / steps;
      return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
    });
  const nodes = [
    glowingTrail(arcPts(startAngle, startAngle + sweep, 32), {
      color: trackColor,
      width,
      glow: 0,
      opacity: opacity * 0.55,
      core: false,
      blend: null,
    }),
  ];
  const f = Math.max(0.01, Math.min(1, fraction));
  nodes.push(
    glowingTrail(arcPts(startAngle, startAngle + sweep * f, 28), {
      color,
      width,
      glow: 10,
      opacity,
      core: true,
      coreWidth: 2.2,
    }),
  );
  if (capFraction !== null) {
    const ca = startAngle + sweep * Math.max(0, Math.min(1, capFraction));
    nodes.push(
      line(
        [cx + (radius - 14) * Math.cos(ca), cy + (radius - 14) * Math.sin(ca)],
        [cx + (radius + 16) * Math.cos(ca), cy + (radius + 16) * Math.sin(ca)],
        { stroke: capColor, width: 4.5 },
      )
        .glow(8, capColor)
        .opacity(opacity),
    );
  }
  return nodes;
}

/** Bounded retry / budget circuit-breaker pip strip (drawn object, zero card boxes). */
export function renderRetryPips(
  left,
  cy,
  total,
  used,
  {
    color = ROLE.policy,
    spentColor = ROLE.reject,
    emptyColor = COSMOS.rule,
    gap = 34,
    radius = 10,
    opacity = 1,
  } = {},
) {
  const nodes = [];
  for (let i = 0; i < total; i++) {
    const cx = left + i * gap;
    const isSpent = i < used;
    const col = isSpent ? (i === total - 1 && used >= total ? spentColor : color) : emptyColor;
    nodes.push(
      glowRing(cx, cy, radius, col, {
        width: 2.6,
        fillOpacity: isSpent ? 0.65 : 0.12,
        glow: isSpent ? 9 : 0,
        opacity,
      }),
    );
  }
  return nodes;
}

/** Glowing circular DAG station with label placed cleanly outside the ring. */
export function renderStation(
  cx,
  cy,
  label,
  color,
  {
    radius = 24,
    active = false,
    labelOffset = 46,
    labelPos = 'below', // 'below' | 'above' | 'right' | 'left'
    sub = null,
    opacity = 1,
    dash,
  } = {},
) {
  const nodes = [
    glowRing(cx, cy, radius, color, {
      width: active ? 4 : 2.8,
      fillOpacity: active ? 0.36 : 0.14,
      glow: active ? 13 : 6,
      opacity,
      dash,
    }),
    glowDot(cx, cy, {
      radius: active ? 7 : 4.5,
      color,
      glow: active ? 12 : 6,
      opacity,
    }),
  ];
  let lx = cx;
  let ly = cy + labelOffset;
  let anchor = 'center';
  if (labelPos === 'above') {
    ly = cy - labelOffset;
  } else if (labelPos === 'right') {
    lx = cx + Math.max(radius + 20, labelOffset);
    ly = cy;
    anchor = 'left';
  } else if (labelPos === 'left') {
    lx = cx - Math.max(radius + 20, labelOffset);
    ly = cy;
    anchor = 'right';
  }
  nodes.push(
    txt(label, lx, ly, 26, active ? COSMOS.ink : color, 'mono', anchor)
      .glow(active ? 6 : 0, color)
      .opacity(opacity),
  );
  if (sub) {
    const sy = labelPos === 'above' ? ly - 32 : ly + 32;
    nodes.push(txt(sub, lx, sy, 26, COSMOS.muted, 'sans', anchor).opacity(opacity));
  }
  return nodes;
}

/**
 * Signature orbiting 3D Multi-Agent DAG Topology (`cinematic3d`).
 * Triage -> Eval / Health / Policy -> Merge -> Review -> Writer with live flying receipt photons.
 */
export function buildOrchestrationDag3d(
  phaseVal,
  stageVal = null,
  {
    x = 460,
    y = 0,
    theta = -0.68,
    phi = 1.04,
    distance = 15.2,
    unit = 104,
    showCycle = false,
  } = {},
) {
  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    focus: [0, 0, 0.25],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-2.4, 2.4],
      z: -1.0,
      step: 0.8,
      color: '#1b2847',
      opacity: 0.38,
    }),
  );

  // 3D DAG stations along X axis: Triage -> 3 parallel branches -> Merge -> Review -> Writer
  const pts = {
    triage: [-2.7, 0, 0.35],
    eval: [-1.1, 1.35, 0.75],
    health: [-1.1, 0, 0.15],
    policy: [-1.1, -1.35, 0.75],
    merge: [0.55, 0, 0.45],
    review: [1.75, 0, 0.65],
    writer: [2.85, 0, 0.35],
  };

  // Wireframe slabs for each station
  const slabs = [
    [pts.triage, 0.38, 0.38, 0.28, ROLE.triage],
    [pts.eval, 0.42, 0.36, 0.28, ROLE.eval],
    [pts.health, 0.42, 0.36, 0.28, ROLE.health],
    [pts.policy, 0.42, 0.36, 0.28, ROLE.policy],
    [pts.merge, 0.45, 0.52, 0.36, ROLE.merge],
    [pts.review, 0.38, 0.42, 0.32, ROLE.review],
    [pts.writer, 0.42, 0.42, 0.36, ROLE.writer],
  ];
  for (const [pos, hx, hy, hz, col] of slabs) {
    view.add(...wireframeSlab3d(pos, hx, hy, hz, { color: col, width: 2.6, glow: 9 }));
  }

  // Glowing 3D DAG conduits
  const links = [
    [pts.triage, pts.eval, ROLE.eval],
    [pts.triage, pts.health, ROLE.health],
    [pts.triage, pts.policy, ROLE.policy],
    [pts.eval, pts.merge, ROLE.eval],
    [pts.health, pts.merge, ROLE.health],
    [pts.policy, pts.merge, ROLE.policy],
    [pts.merge, pts.review, ROLE.merge],
    [pts.review, pts.writer, ROLE.writer],
  ];
  for (const [a, b, col] of links) {
    view.add(
      line3d(a, b, {
        color: col,
        width: 2.8,
        glow: 8,
        opacity: 0.85,
        blend: 'screen',
      }),
    );
  }

  // Optional 3D overhead re-review state-machine cycle arc
  if (showCycle) {
    view.add(
      curve3d(
        (t) => {
          const u = 1 - t;
          const xPos = u * pts.review[0] + t * pts.merge[0];
          const yPos = 1.45 * Math.sin(t * Math.PI);
          const zPos = 0.65 + 1.15 * Math.sin(t * Math.PI);
          return [xPos, yPos, zPos];
        },
        {
          t: [0, 1],
          samples: 36,
          color: ROLE.reject,
          width: 3.0,
          glow: 9,
          blend: 'screen',
        },
      ),
    );
  }

  // Flying receipt photons along parallel fan-out/fan-in and downstream lanes
  view.add(
    points3d(
      () => {
        const ph = phaseVal.value;
        const st = stageVal ? stageVal.value : 1;
        const lerp3 = (a, b, t) => [
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t,
          a[2] + (b[2] - a[2]) * t,
        ];
        const t1 = (ph * 0.22) % 1;
        const t2 = (ph * 0.16 + 0.33) % 1;
        const t3 = (ph * 0.28 + 0.66) % 1;
        const t4 = (ph * 0.2 + 0.15) % 1;
        const out = [
          lerp3(pts.triage, pts.eval, t1),
          lerp3(pts.triage, pts.health, t2),
          lerp3(pts.triage, pts.policy, t3),
          lerp3(pts.eval, pts.merge, t3),
          lerp3(pts.health, pts.merge, t1),
          lerp3(pts.policy, pts.merge, t2),
        ];
        if (st > 0.3) {
          out.push(lerp3(pts.merge, pts.review, t4));
          out.push(lerp3(pts.review, pts.writer, (t4 + 0.5) % 1));
        }
        return out;
      },
      {
        colorAt: (idx) =>
          [
            ROLE.eval,
            ROLE.health,
            ROLE.policy,
            ROLE.eval,
            ROLE.health,
            ROLE.policy,
            ROLE.merge,
            ROLE.writer,
          ][idx] ?? ROLE.mark,
        radius: 6.4,
        glow: 12,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  return { view, pts };
}

/**
 * Orbiting 3D Pregel Superstep Barrier (`cinematic3d`).
 * Three parallel worker lanes converging onto a glowing synchronization barrier ring.
 */
export function buildSuperstepBarrier3d(
  phaseVal,
  statusVal = null,
  { x = 480, y = 20, theta = -0.74, phi = 1.06, distance = 14.8, unit = 104 } = {},
) {
  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    focus: [0, 0, 0.2],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-2.6, 2.6],
      y: [-2.6, 2.6],
      z: -1.35,
      step: 0.65,
      color: '#1b2847',
      opacity: 0.36,
    }),
  );

  // Synchronization barrier ring at z = 0
  view.add(
    curve3d((t) => [1.95 * Math.cos(t), 1.95 * Math.sin(t), 0], {
      t: [0, Math.PI * 2],
      samples: 56,
      color: ROLE.merge,
      width: 3.6,
      glow: 10,
      blend: 'screen',
    }),
    curve3d((t) => [1.25 * Math.cos(t), 1.25 * Math.sin(t), 0], {
      t: [0, Math.PI * 2],
      samples: 44,
      color: ROLE.eval,
      width: 2.2,
      glow: 6,
      blend: 'screen',
    }),
  );

  // Three parallel worker shafts above barrier (z = 1.45 -> 0) and single merged core below (0 -> -1.1)
  const lanes = [
    { a: Math.PI / 2, col: ROLE.eval },
    { a: (7 * Math.PI) / 6, col: ROLE.health },
    { a: (11 * Math.PI) / 6, col: ROLE.policy },
  ];
  for (const lane of lanes) {
    const lx = 1.4 * Math.cos(lane.a);
    const ly = 1.4 * Math.sin(lane.a);
    view.add(
      line3d([lx, ly, 1.45], [lx, ly, 0], {
        color: lane.col,
        width: 3.4,
        glow: 9,
        blend: 'screen',
      }),
      line3d([lx, ly, 0], [0, 0, -0.85], {
        color: ROLE.merge,
        width: 2.4,
        opacity: 0.72,
        glow: 6,
        blend: 'screen',
      }),
    );
  }

  // Output proposal core slab below the barrier
  view.add(
    ...wireframeSlab3d([0, 0, -0.88], 0.56, 0.56, 0.28, {
      color: ROLE.writer,
      width: 2.8,
      glow: 9,
    }),
  );

  // Falling receipts & orbiting barrier telemetry photons
  view.add(
    points3d(
      () => {
        const ph = phaseVal.value;
        const pts = [];
        lanes.forEach((lane, i) => {
          const prog = (ph * (0.18 + i * 0.05) + i * 0.31) % 1;
          const lx = 1.4 * Math.cos(lane.a);
          const ly = 1.4 * Math.sin(lane.a);
          pts.push([lx, ly, 1.45 * (1 - prog)]);
        });
        for (let i = 0; i < 4; i++) {
          const a = ph * 0.55 + (i * Math.PI) / 2;
          pts.push([1.95 * Math.cos(a), 1.95 * Math.sin(a), 0.04]);
        }
        return pts;
      },
      {
        colorAt: (idx) => {
          if (idx === 0) return ROLE.eval;
          if (idx === 1) return ROLE.health;
          if (idx === 2) return ROLE.policy;
          const st = statusVal ? statusVal.value : 0;
          return st < -0.3 ? ROLE.reject : st > 0.3 ? ROLE.pass : ROLE.merge;
        },
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
 * Orbiting 3D Single-Writer Atomic Vault (`cinematic3d`).
 * Protected commit core surrounded by concentric Approval, Version, and Idempotency rings.
 */
export function buildWriterVault3d(
  phaseVal,
  stateVal = null,
  { x = 490, y = 10, theta = -0.7, phi = 1.06, distance = 14.6, unit = 106 } = {},
) {
  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    focus: [0, 0, 0.2],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-2.6, 2.6],
      y: [-2.6, 2.6],
      z: -1.25,
      step: 0.65,
      color: '#1b2847',
      opacity: 0.36,
    }),
    ...wireframeSlab3d([0, 0, 0.15], 0.68, 0.68, 0.68, {
      color: ROLE.writer,
      width: 3.0,
      glow: 10,
    }),
  );

  const ringSpecs = [
    { r: 1.45, z: 0.15, tilt: 0.25, col: ROLE.eval },
    { r: 1.85, z: 0.15, tilt: -0.35, col: ROLE.merge },
    { r: 2.25, z: 0.15, tilt: 0.12, col: ROLE.writer },
  ];
  for (const rs of ringSpecs) {
    view.add(
      curve3d(
        (t) => [
          rs.r * Math.cos(t),
          rs.r * Math.sin(t) * Math.cos(rs.tilt),
          rs.z + rs.r * Math.sin(t) * Math.sin(rs.tilt),
        ],
        {
          t: [0, Math.PI * 2],
          samples: 56,
          color: rs.col,
          width: 3.0,
          glow: 9,
          blend: 'screen',
        },
      ),
    );
  }

  view.add(
    points3d(
      () => {
        const ph = phaseVal.value;
        const pts = [];
        ringSpecs.forEach((rs, idx) => {
          const a = ph * (0.5 + idx * 0.18) + idx * 2.1;
          pts.push([
            rs.r * Math.cos(a),
            rs.r * Math.sin(a) * Math.cos(rs.tilt),
            rs.z + rs.r * Math.sin(a) * Math.sin(rs.tilt),
          ]);
          const b = a + Math.PI;
          pts.push([
            rs.r * Math.cos(b),
            rs.r * Math.sin(b) * Math.cos(rs.tilt),
            rs.z + rs.r * Math.sin(b) * Math.sin(rs.tilt),
          ]);
        });
        return pts;
      },
      {
        colorAt: (idx) => {
          const st = stateVal ? stateVal.value : 0;
          if (st < -0.3) return idx % 2 === 0 ? ROLE.reject : ROLE.merge;
          if (st > 0.3) return ROLE.pass;
          return [ROLE.eval, ROLE.eval, ROLE.merge, ROLE.merge, ROLE.writer, ROLE.writer][idx];
        },
        radius: 6.4,
        glow: 12,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  return { view };
}

/**
 * Orbiting 3D Routing Constellation (`cinematic3d`) for topology ownership & hop latency.
 */
export function buildTopologyOrbit3d(
  phaseVal,
  { x = 510, y = 10, theta = -0.72, phi = 1.05, distance = 15.0, unit = 102 } = {},
) {
  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    focus: [0, 0, 0.25],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-2.6, 2.6],
      y: [-2.6, 2.6],
      z: -1.2,
      step: 0.65,
      color: '#1b2847',
      opacity: 0.36,
    }),
  );

  const hub = [0, 0, 0.95];
  const peers = [
    [1.8, 0.2, 0.1],
    [-1.4, 1.35, 0.1],
    [-1.4, -1.35, 0.1],
    [0.4, -1.85, -0.55],
  ];
  const cols = [ROLE.eval, ROLE.health, ROLE.policy, ROLE.writer];

  view.add(...wireframeSlab3d(hub, 0.44, 0.44, 0.36, { color: ROLE.merge, width: 3.0, glow: 10 }));
  peers.forEach((p, i) => {
    view.add(
      ...wireframeSlab3d(p, 0.34, 0.34, 0.24, { color: cols[i], width: 2.4, glow: 8 }),
      line3d(hub, p, { color: cols[i], width: 2.4, glow: 7, opacity: 0.78, blend: 'screen' }),
    );
  });
  // Peer handoff ribbon between first two specialists
  view.add(
    curve3d(
      (t) => [
        peers[0][0] * (1 - t) + peers[1][0] * t,
        peers[0][1] * (1 - t) + peers[1][1] * t + 0.55 * Math.sin(t * Math.PI),
        0.1 + 0.45 * Math.sin(t * Math.PI),
      ],
      {
        t: [0, 1],
        samples: 32,
        color: ROLE.eval,
        width: 2.8,
        glow: 8,
        blend: 'screen',
      },
    ),
  );

  view.add(
    points3d(
      () => {
        const ph = phaseVal.value;
        return peers.map((p, i) => {
          const t = 0.5 + 0.5 * Math.sin(ph * (0.65 + i * 0.15) + i * 1.4);
          return [
            hub[0] + (p[0] - hub[0]) * t,
            hub[1] + (p[1] - hub[1]) * t,
            hub[2] + (p[2] - hub[2]) * t,
          ];
        });
      },
      {
        colorAt: (idx) => cols[idx] ?? ROLE.mark,
        radius: 6.4,
        glow: 12,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  return { view };
}
