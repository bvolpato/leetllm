// Shared cinema building blocks, semantic color roles, 3D helpers, and verified math
// invariants for the Persistent Memory (Agent Memory & Persistence) stage lesson.
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
  ARCHIVED_TURNS,
  RECENT_TURNS,
  WINDOW_CAPACITY,
  WINDOW_SUMMARY,
  WINDOW_TURNS,
} from '../../films/persistent-memory/fixtures.mjs';
import {
  admitMemoryWrite,
  eligibleMemories,
  memoryAccessFixture,
  retrievalCandidates,
  sourceProjectionState,
  validateModel,
} from '../../films/persistent-memory/model.mjs';
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
  ARCHIVED_TURNS,
  CINEMA_FRAME,
  COSMOS,
  RECENT_TURNS,
  WINDOW_CAPACITY,
  WINDOW_SUMMARY,
  WINDOW_TURNS,
  admitMemoryWrite,
  aura,
  cinematic3d,
  eligibleMemories,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  memoryAccessFixture,
  metricReadout,
  orbitScene,
  retrievalCandidates,
  rule,
  sourceProjectionState,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
};

/**
 * Semantic color roles held constant across all 11 persistent-memory scenes:
 *   prompt / working / active -> cyan
 *   profile / semantic / ok   -> emerald
 *   episodic / log / archive  -> blue
 *   procedural / policy       -> violet
 *   focus / score / clock     -> gold
 *   stale / revoked / blocked -> rose
 *   pending / caution / warn  -> amber
 */
export const ROLE = Object.freeze({
  prompt: COSMOS.cyan,
  working: COSMOS.cyan,
  ok: COSMOS.emerald,
  profile: COSMOS.emerald,
  semantic: COSMOS.emerald,
  episodic: COSMOS.blue,
  archive: COSMOS.blue,
  procedural: COSMOS.violet,
  policy: COSMOS.violet,
  focus: COSMOS.gold,
  score: COSMOS.gold,
  fail: COSMOS.rose,
  stale: COSMOS.rose,
  revoked: COSMOS.rose,
  caution: COSMOS.amber,
  pending: COSMOS.amber,
});

export const RANKING = retrievalCandidates();
export const ACCESS_FIXTURE = memoryAccessFixture();
export const UNBOUNDED_FREQ = 0.2 * Math.log1p(1_000_000);

/** Build-time mathematical invariant suite covering every computed value in persistent-memory. */
export function verifyPersistentMemoryInvariants() {
  validateModel();
  verifyApprox(RANKING[0].score, 0.8817, 1e-3, 'recent replay score ~0.882');
  verifyApprox(RANKING[1].score, 0.61, 1e-9, 'older similar retry score 0.610');
  verifyApprox(RANKING[1].contributions.recency, 0.075, 1e-9, 'older age contribution 0.075');
  verifyApprox(UNBOUNDED_FREQ, 2.7631, 1e-2, 'unbounded log(1+1e6)*0.2 ~ 2.76');
  verifyInvariant(ACCESS_FIXTURE.eligible.length === 2, 'only 2 billing replays eligible');
  verifyInvariant(WINDOW_CAPACITY === 3 && WINDOW_TURNS.length === 5, '5 turns into 3 slots');
  verifyInvariant(
    admitMemoryWrite({
      tenant: 'billing',
      source: 'developer_statement',
      field: 'verification_command',
      content: 'pnpm test --run billing',
      retentionDays: 90,
    }) === 'admitted',
    'verification_command admitted',
  );
  verifyInvariant(
    admitMemoryWrite({
      tenant: 'billing',
      source: 'developer_statement',
      field: 'merge_approved',
      content: 'true',
      retentionDays: 90,
    }) === 'blocked: authorization field',
    'merge_approved blocked',
  );
  verifyInvariant(
    sourceProjectionState({
      sourceVersion: 2,
      projectionVersion: 1,
      grant: true,
      tombstone: false,
      queuedRefresh: true,
    }).readable === false,
    'stale projection not readable',
  );
  verifyInvariant(
    sourceProjectionState({
      sourceVersion: 2,
      projectionVersion: 2,
      grant: false,
      tombstone: true,
      queuedRefresh: true,
    }).refreshAdmitted === false,
    'revoked refresh refused',
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

export function trimSeg(a, b, padA = 56, padB = 56) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [
    [a[0] + (dx / len) * padA, a[1] + (dy / len) * padA],
    [b[0] - (dx / len) * padB, b[1] - (dy / len) * padB],
  ];
}

/** Auto-sized circular memory node guaranteeing >= 12px interior margin around any label. */
export function memNode(
  x,
  y,
  label,
  color,
  { radius = 48, sub = null, opacity = 1, glow = 8, size = 26 } = {},
) {
  const r = Math.max(radius, Math.ceil(String(label).length * 9.2 + 20));
  const parts = [
    circle(r, { fill: '#0b1224', stroke: color, width: 3.4 })
      .at(x, y)
      .glow(glow, color)
      .opacity(opacity),
    txt(label, x, y, size, color, 'mono', 'center').opacity(opacity),
  ];
  if (sub) {
    parts.push(txt(sub, x, y + r + 34, 26, COSMOS.muted, 'mono', 'center').opacity(opacity));
  }
  return { node: group(...parts), r };
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
