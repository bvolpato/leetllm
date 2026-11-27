// Shared cinema building blocks, semantic color roles, 3D helpers, and verified math
// invariants for the Agent Architectures (ReAct & Plan-and-Execute) stage lesson.
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
  clock,
  contextLedger,
  submittedTokens,
  uctRows,
} from '../../films/agent-architectures/arithmetic.mjs';
import {
  AGENT_DAG,
  BUS_ROUTE,
  LATER_BUS_ROUTE,
  VISIT_HOURS,
} from '../../films/agent-architectures/fixtures.mjs';
import {
  changedItinerary,
  nextAction,
  planSnapshot,
  reactTrace,
  ready,
  recommendationState,
  visitSchedule,
} from '../../films/agent-architectures/model.mjs';
import {
  approvalReplay,
  canonicalAgentAction,
  dependencyState,
  periodicWithoutProgress,
  recoveryVerdict,
} from '../../films/agent-architectures/protocols.mjs';
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
  AGENT_DAG,
  BUS_ROUTE,
  CINEMA_FRAME,
  COSMOS,
  LATER_BUS_ROUTE,
  VISIT_HOURS,
  approvalReplay,
  aura,
  canonicalAgentAction,
  changedItinerary,
  cinematic3d,
  clock,
  contextLedger,
  dependencyState,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout,
  nextAction,
  orbitScene,
  periodicWithoutProgress,
  planSnapshot,
  reactTrace,
  ready,
  recommendationState,
  recoveryVerdict,
  rule,
  submittedTokens,
  txt,
  uctRows,
  verifyApprox,
  verifyInvariant,
  visitSchedule,
  wireframeSlab3d,
};

/**
 * Semantic color roles held constant across all 34 agent-architectures scenes:
 *   policy / model / thought     -> violet
 *   host / runtime / plan / gate -> blue
 *   action / tool / route        -> cyan
 *   ok / open / valid / feasible -> emerald
 *   focus / clock / bonus / cue  -> gold
 *   fail / closed / stale / deny -> rose
 *   caution / pending / review   -> amber
 */
export const ROLE = Object.freeze({
  policy: COSMOS.violet,
  model: COSMOS.violet,
  host: COSMOS.blue,
  plan: COSMOS.blue,
  action: COSMOS.cyan,
  tool: COSMOS.cyan,
  route: COSMOS.cyan,
  ok: COSMOS.emerald,
  valid: COSMOS.emerald,
  focus: COSMOS.gold,
  clock: COSMOS.gold,
  bonus: COSMOS.gold,
  fail: COSMOS.rose,
  closed: COSMOS.rose,
  stale: COSMOS.rose,
  caution: COSMOS.amber,
  review: COSMOS.amber,
});

export const FULL_LEDGER = contextLedger(2000, 1500, 10, Infinity);
export const BOUNDED_LEDGER = contextLedger(2000, 1500, 10, 2);
export const UCT_DATA = uctRows();
export const VISIT_MAIN = visitSchedule(VISIT_HOURS, BUS_ROUTE, 90, 1020);
export const VISIT_LATE_90 = changedItinerary(90);
export const VISIT_LATE_70 = changedItinerary(70);

export const CRITICAL_PATH = Object.freeze({
  plan: 120,
  health: 150,
  ci: 200,
  diff: 350,
  join: 50,
  parallel: 120 + 350 + 50,
  serial: 120 + 150 + 200 + 350 + 50,
  serialNoHealth: 120 + 200 + 350 + 50,
  parallelNoHealth: 120 + 350 + 50,
});

/** Build-time mathematical invariant suite covering every computed value in agent-architectures. */
export function verifyAgentArchInvariants() {
  verifyInvariant(nextAction([]) === 'check-hours', 'empty obs -> check-hours');
  verifyInvariant(
    nextAction([{ status: 'closed' }]) === 'find-alternative',
    'closed -> find-alternative',
  );
  verifyInvariant(nextAction([{ status: 'open' }]) === 'check-journey', 'open -> check-journey');

  verifyInvariant(
    FULL_LEDGER.total === 87500 && FULL_LEDGER.written === 15500,
    'full ledger 87500 / 15500',
  );
  verifyInvariant(FULL_LEDGER.read === 72000, 'cached read tokens = 72000');
  verifyInvariant(BOUNDED_LEDGER.total === 45500, 'bounded 2-block ledger = 45500');

  verifyInvariant(
    CRITICAL_PATH.parallel === 520 && CRITICAL_PATH.serial === 870,
    'critical path 520 vs 870',
  );
  verifyInvariant(
    CRITICAL_PATH.serialNoHealth === 720 && CRITICAL_PATH.parallelNoHealth === 520,
    'drop health 720 vs 520',
  );

  const receipts = {
    ci: { revision: 'c1842', until: 1200, version: 1 },
    diff: { revision: 'c1842', until: 1200, version: 1 },
    health: { revision: 'c1842', until: 1100, version: 1 },
    decision: {
      revision: 'c1842',
      until: 1200,
      version: 1,
      consumed: { ci: 1, diff: 1, health: 1 },
    },
  };
  verifyInvariant(
    dependencyState(receipts, 'c1842', 1099).valid.decision === true,
    'valid at 1099',
  );
  verifyInvariant(
    dependencyState(receipts, 'c1842', 1100).ready[0] === 'health',
    'health expired at 1100',
  );
  const v2Receipts = { ...receipts, health: { ...receipts.health, until: 1200, version: 2 } };
  verifyInvariant(
    dependencyState(v2Receipts, 'c1842', 1100).valid.decision === false,
    'v2 invalidates v1 decision',
  );
  verifyInvariant(
    dependencyState(receipts, 'c1843', 1100).ready.length === 3,
    'new revision resets 3 reads',
  );

  verifyApprox(UCT_DATA[0].score, 1.373, 1e-2, 'UCT rollback score');
  verifyApprox(UCT_DATA[1].score, 1.86, 1e-2, 'UCT diff score');
  verifyApprox(UCT_DATA[2].score, 2.246, 1e-2, 'UCT retry score');
  verifyApprox((0.1 + 1.0) / 2, 0.55, 1e-9, 'backup new mean 0.55');

  const req = { type: 'request', key: 'op-17', actor: 'bot', release: 'R1842', revision: 'c1841' };
  const rep = approvalReplay([req, req, { ...req, release: 'R2099' }]);
  verifyInvariant(
    rep.outcomes[0] === 'created RB2041' &&
      rep.outcomes[1] === 'replay RB2041' &&
      rep.outcomes[2] === 'conflict',
    'idempotent replay RB2041',
  );
  verifyInvariant(rep.records.length === 1, 'proposal count stays 1');

  verifyInvariant(
    periodicWithoutProgress(['A', 'B', 'A', 'B'], ['m0', 'm0', 'm0', 'm0', 'm0']) === true,
    'ABAB no progress flagged',
  );
  verifyInvariant(
    periodicWithoutProgress(['A', 'B', 'A', 'B'], ['m0', 'm0', 'm0', 'm0', 'm1']) === false,
    'ABAB with progress continues',
  );

  verifyInvariant(
    recoveryVerdict(
      { region: 'eu-west', revision: 'def456', at: 990, p95: 120 },
      { approved: true },
    ) === 'wrong identity',
    'wrong region rejected',
  );
  verifyInvariant(
    recoveryVerdict(
      { region: 'us-east', revision: 'def456', at: 990, p95: 940 },
      { approved: true },
    ) === 'unhealthy',
    '940ms rejected',
  );
  verifyInvariant(
    recoveryVerdict(
      { region: 'us-east', revision: 'def456', at: 990, p95: 120 },
      { approved: false },
    ) === 'approval missing',
    'unapproved rejected',
  );
  verifyInvariant(
    recoveryVerdict(
      { region: 'us-east', revision: 'def456', at: 990, p95: 120 },
      { approved: true },
    ) === 'closed',
    'valid approved closes',
  );

  verifyInvariant(
    VISIT_MAIN.arrival === 875 && VISIT_MAIN.finish === 965 && VISIT_MAIN.feasible,
    '14:10 -> 16:05 ok',
  );
  verifyInvariant(
    VISIT_LATE_90.finish === 1035 && !VISIT_LATE_90.feasible,
    '15:20 + 90m -> 17:15 fails',
  );
  verifyInvariant(
    VISIT_LATE_70.finish === 1015 && VISIT_LATE_70.feasible,
    '15:20 + 70m -> 16:55 ok',
  );
}

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
    .opacity(0.9 * opacity);
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

/** Trim a 2D line segment by `padA` / `padB` so strokes never cross circle labels. */
export function trimSeg(a, b, padA = 44, padB = 44) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [
    [a[0] + (dx / len) * padA, a[1] + (dy / len) * padA],
    [b[0] - (dx / len) * padB, b[1] - (dy / len) * padB],
  ];
}

/** Illuminated circular graph/station node with auto-sized label clearance. */
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
