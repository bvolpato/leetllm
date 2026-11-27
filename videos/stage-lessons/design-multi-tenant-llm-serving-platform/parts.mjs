// Shared cinema building blocks, semantic color roles, 3D helpers, reusable KV page-pool
// and conservation-ledger constructions, and build-time math invariants for the
// Design a Multi-Tenant LLM Serving Platform stage film (32 scenes).
import {
  circle,
  curve3d,
  group,
  line,
  line3d,
  linear,
  parametricSurface,
  point3d,
  rect,
} from 'vizmatic/stage';
import {
  clamp,
  deficit,
  deficitPlayback,
  mix,
  quota,
  reserveWholePages,
  sum,
} from '../../films/design-multi-tenant-llm-serving-platform/arithmetic.mjs';
import {
  MULTITENANT_REQUESTS,
  quotaReceipt,
  recoveryIdentity,
} from '../../films/design-multi-tenant-llm-serving-platform/fixtures.mjs';
import { multiTenantConstructionModel } from '../../films/design-multi-tenant-llm-serving-platform/model.mjs';
import { sampleModel } from '../../films/design-multi-tenant-llm-serving-platform/observations.mjs';
import {
  locatePosition,
  privateHistory,
} from '../../films/design-multi-tenant-llm-serving-platform/page-pool.mjs';
import {
  applyQuotaCompletion,
  reconcileRecovery,
  recoveryCompletionEvidence,
  recoveryRetryDecision,
} from '../../films/design-multi-tenant-llm-serving-platform/protocols.mjs';
import { validateModel } from '../../films/design-multi-tenant-llm-serving-platform/validation.mjs';
import {
  CINEMA_FRAME,
  COSMOS,
  aura as kitAura,
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
  MULTITENANT_REQUESTS,
  applyQuotaCompletion,
  cinematic3d,
  clamp,
  deficit,
  deficitPlayback,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  locatePosition,
  metricReadout,
  mix,
  multiTenantConstructionModel,
  orbitScene,
  privateHistory,
  quota,
  quotaReceipt,
  reconcileRecovery,
  recoveryCompletionEvidence,
  recoveryIdentity,
  recoveryRetryDecision,
  reserveWholePages,
  rule,
  sampleModel,
  sum,
  txt,
  validateModel,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
};

/**
 * Semantic color roles held constant across all 32 multi-tenant serving scenes:
 *   tenant A / Alice / primary / input -> blue
 *   tenant B / Bob / secondary / deny  -> rose
 *   tenant C / adapter / model / policy -> violet
 *   shared infra / worker / KV / stream -> cyan
 *   ok / pass / settled / free / safe  -> emerald
 *   held / focus / credit / gate       -> gold
 *   pending / caution / overhead       -> amber
 */
export const ROLE = Object.freeze({
  A: COSMOS.blue,
  B: COSMOS.rose,
  C: COSMOS.violet,
  shared: COSMOS.cyan,
  kv: COSMOS.cyan,
  worker: COSMOS.cyan,
  stream: COSMOS.cyan,
  ok: COSMOS.emerald,
  free: COSMOS.emerald,
  settled: COSMOS.emerald,
  held: COSMOS.gold,
  focus: COSMOS.gold,
  gate: COSMOS.gold,
  credit: COSMOS.gold,
  warn: COSMOS.amber,
  pending: COSMOS.amber,
  deny: COSMOS.rose,
  fail: COSMOS.rose,
  model: COSMOS.violet,
  adapter: COSMOS.violet,
  policy: COSMOS.violet,
});

// Verified shared constants derived from the film math modules
export const DENSE_WEIGHT_GB = (72e9 * 2) / 1e9;
export const HUNDRED_COPIES_TB = (72e9 * 2 * 100) / 1e12;
export const KV_FACTORS = Object.freeze([
  ['K and V', 2, ROLE.A],
  ['Layers', 80, ROLE.kv],
  ['KV heads', 8, ROLE.focus],
  ['Head dim', 128, ROLE.B],
  ['Bytes/val', 2, ROLE.ok],
]);
export const KV_BYTES_PER_TOKEN = 2 * 80 * 8 * 128 * 2;
export const KV_MIB_PER_TOKEN = KV_BYTES_PER_TOKEN / 2 ** 20;
export const KV_4000_GIB = (KV_BYTES_PER_TOKEN * 4000) / 2 ** 30;
export const KV_PAGE_MIB = KV_MIB_PER_TOKEN * 16;
export const STEP_GPU_SECONDS = 4 * 0.2;
export const STEP_TOTAL_COST = (STEP_GPU_SECONDS * 2) / 3600;
export const STEP_SHARE_A = STEP_TOTAL_COST * 0.25;
export const STEP_SHARE_B = STEP_TOTAL_COST * 0.75;
export const STEP_WRONG_DOUBLE = (STEP_GPU_SECONDS * 8) / 3600;
export const RETRIEVAL_DOCS = Object.freeze([
  Object.freeze({ id: 'B-secret', tenant: 'B', reader: 'Bob', score: 0.99 }),
  Object.freeze({ id: 'A-private', tenant: 'A', reader: 'Carol', score: 0.95 }),
  Object.freeze({ id: 'A-public', tenant: 'A', reader: 'Alice', score: 0.8 }),
]);

/** Build-time mathematical invariant suite asserting every spoken value in the lesson. */
export function verifyMultiTenantInvariants() {
  verifyInvariant(validateModel() === true, 'original multi-tenant model validates');

  // Sharing contract weights
  verifyApprox(DENSE_WEIGHT_GB, 144, 1e-9, '72B x 2 bytes = 144 decimal GB');
  verifyApprox(HUNDRED_COPIES_TB, 14.4, 1e-9, '100 copies = 14.4 TB');

  // Stream clocks
  const sc = multiTenantConstructionModel('stream-clocks', { beat: 1, beatP: 1 });
  verifyInvariant(sc.gap === 120, 'observed event gap 220 - 100 = 120 ms');
  verifyInvariant(sc.elapsed === 140, 'completion - first = 240 - 100 = 140 ms');
  verifyInvariant(sc.tpot === 35, 'TPOT 140 / 4 = 35 ms');
  verifyInvariant(sc.overhead === 20, 'completion overhead 240 - 220 = 20 ms');

  // Goodput contract
  const gp = multiTenantConstructionModel('goodput-contract', { beat: 1, beatP: 1 });
  verifyInvariant(gp.passed === 3 && gp.total === 5, 'goodput 3 of 5 = 60%');
  verifyApprox((gp.passed / gp.total) * 100, 60, 1e-9, 'goodput percentage 60%');

  // Quota conservation & replay
  const q0 = quota(0);
  const q1 = quota(1);
  const q2 = quota(2);
  verifyInvariant(q0.available === 1000 && q0.held === 0 && q0.settled === 0, 'quota initial 1000');
  verifyInvariant(q1.available === 300 && q1.held === 700 && q1.settled === 0, 'quota hold 700');
  verifyInvariant(q2.available === 580 && q2.held === 0 && q2.settled === 420, 'quota settle 420');
  verifyInvariant(700 - 420 === 280, 'unused release 280');

  // Admission race & idempotency 1200 example
  verifyInvariant(700 + 700 === 1400 && 1400 - 1000 === 400, 'race overpromise 1400 / 400 excess');
  verifyInvariant(1200 - 700 === 500, '1200 example hold 700 leaves 500');
  verifyInvariant(200 + 150 === 350 && 700 - 350 === 350 && 1200 - 350 === 850, '1200 settle 350');

  // Pages & private history
  const hist0 = privateHistory({ bTokens: 31 });
  verifyInvariant(hist0.tokens.A === 47 && hist0.tokens.B === 31, '47 A + 31 B = 78 slots');
  verifyInvariant(sum(hist0.pages.map((p) => p.used)) === 78, '78 occupied of 80 total slots');
  const pos32 = locatePosition(hist0.tables.B, 32);
  verifyInvariant(pos32.page === 3 && pos32.slot === 15, 'position 32 fills P3 slot 15');
  const histClose = privateHistory({ bTokens: 33, retired: true, reassigned: true });
  const pos33 = locatePosition(histClose.tables.B, 33);
  verifyInvariant(pos33.page === 4 && pos33.slot === 0, 'position 33 writes P4 slot 0');

  // KV byte shape & growth
  verifyInvariant(KV_BYTES_PER_TOKEN === 327680, '2 x 80 x 8 x 128 x 2 = 327,680 B');
  verifyApprox(KV_MIB_PER_TOKEN, 0.3125, 1e-12, '0.3125 MiB per token');
  verifyApprox(KV_4000_GIB, 1.220703125, 1e-6, '4000 tokens ~ 1.2207 GiB');
  verifyApprox(KV_PAGE_MIB, 5, 1e-12, '16-token page = 5 MiB');
  verifyInvariant(reserveWholePages(16n, 1n) === 2n, 'ceil(17 / 16) = 2 pages');
  const huge = 2n ** 54n + 1n;
  verifyInvariant(
    reserveWholePages(huge, 0n) === 2n ** 50n + 1n &&
      BigInt(Math.ceil(Number(huge) / 16)) === 2n ** 50n,
    '2^54+1 exact BigInt vs float underreservation',
  );

  // Remote KV timing
  const rkv = multiTenantConstructionModel('remote-kv', { beat: 2, beatP: 1 });
  verifyInvariant(
    rkv.lookup === 18 && rkv.transfer === 42 && rkv.remote === 60,
    'remote 18 + 42 = 60 ms',
  );
  verifyInvariant(
    rkv.recompute === 45 && rkv.deadline === 70 && rkv.spare === 25,
    'rebuild 45 ms leaves 25 ms spare',
  );

  // Deficit round-robin fairness
  const d1 = deficit(1);
  const d2 = deficit(2);
  const d3 = deficit(3);
  verifyInvariant(d1.credit.A === 1 && d1.jobs.A === 1 && d1.jobs.B === 2, 'DRR round 1');
  verifyInvariant(d2.credit.A === 2 && d2.jobs.A === 2 && d2.jobs.B === 4, 'DRR round 2');
  verifyInvariant(
    d3.served.A === 12 && d3.served.B === 6 && d3.jobs.A === 4 && d3.jobs.B === 6,
    'DRR round 3: 12:6 work, 4:6 chunks',
  );

  // Chunked prefill 8-slot step
  verifyInvariant(3 + 5 === 8, '3 decode + 5 prefill = 8 slot step');

  // Cost accounting
  verifyApprox(STEP_GPU_SECONDS, 0.8, 1e-12, '4 GPUs x 0.2 s = 0.8 GPU-s');
  verifyApprox(STEP_TOTAL_COST, 0.0004444444444, 1e-9, '0.8 GPU-s at $2/hr');
  verifyApprox((0.2 * 8) / 3600, STEP_TOTAL_COST, 1e-15, '0.2 node-s at $8/node-hr matches');
  verifyApprox(STEP_SHARE_A + STEP_SHARE_B, STEP_TOTAL_COST, 1e-15, '25% + 75% conserves cost');
  verifyApprox(STEP_WRONG_DOUBLE / STEP_TOTAL_COST, 4, 1e-12, 'GPU-s x node-rate double counts 4x');

  // Fresh design gate (Workspace C)
  verifyInvariant(240 + 360 === 600 && 1500 - 600 === 900, 'C holds 600 leaves 900');
  verifyInvariant(
    37 * 16 === 592 && Number(reserveWholePages(240n, 360n)) === 38,
    '37 -> 592, 38 -> 608',
  );
  verifyInvariant(38 * 16 - 600 === 8, '8 spare slots on page 38');
  verifyInvariant(
    240 + 90 === 330 && 600 - 330 === 270 && 1500 - 330 === 1170,
    'C settles 330, returns 270, 1170 left',
  );
}

/** Translucent screen-blended aura (enforces 8-digit hex alpha so it never washes out canvas). */
export function aura(x, y, radius, innerHex, midHex = '#07091000') {
  const c1 = typeof innerHex === 'string' && innerHex.length === 7 ? `${innerHex}18` : innerHex;
  const c2 =
    midHex === COSMOS.bg
      ? '#07091000'
      : typeof midHex === 'string' && midHex.length === 7
        ? `${midHex}0a`
        : midHex;
  return kitAura(x, y, radius, c1, c2);
}

/** Floating cinema header without any top banner bar, horizontal divider, or card chrome. */
export function cinemaHeader(
  eyebrow,
  line1,
  line2,
  { x = -860, y = -450, accent = COSMOS.cyan, size = 46, anchor = 'left' } = {},
) {
  const parts = [
    txt(eyebrow, x, y, 26, accent, 'mono', anchor),
    txt(line1, x, y + 56, size, COSMOS.ink, 'serif', anchor),
  ];
  if (line2) {
    parts.push(txt(line2, x, y + 114, size, accent, 'serif', anchor).glow(6, accent));
  }
  return group(...parts);
}

/** Safe duration clamp so no animation ever runs past `c.end`. */
export function clampDur(c, startTime, desired, margin = 0.25) {
  const available = c.end - startTime - margin;
  if (available <= 0.06) return Math.max(0.03, Math.min(desired, c.end - startTime - 0.04));
  return Math.min(desired, available);
}

/** Schedule a smooth animation when a declared cue starts. */
export function playOn(s, c, id, val, target = 1, desired = 0.35) {
  c.on(id, () => {
    s.play(val.to(target, { duration: clampDur(c, c.cue(id).start, desired) }));
  });
}

/** Schedule an animation strictly AFTER a declared cue finishes (prediction withholding). */
export function playAfter(s, c, id, val, target = 1, desired = 0.22) {
  c.after(id, () => {
    s.play(val.to(target, { duration: clampDur(c, c.cue(id).end, desired) }));
  });
}

/** Fast boolean flip strictly AFTER a declared cue finishes (zero intermediate flash). */
export function stepAfter(s, c, id, val, target = 1) {
  c.after(id, () => {
    s.play(val.to(target, { duration: clampDur(c, c.cue(id).end, 0.06, 0.08) }));
  });
}

/** Fast boolean flip when a declared cue starts. */
export function stepOn(s, c, id, val, target = 1) {
  c.on(id, () => {
    s.play(val.to(target, { duration: clampDur(c, c.cue(id).start, 0.06, 0.08) }));
  });
}

/** Continuous smooth drift bounded safely inside the scene window. */
export function driftValue(s, c, val, target, { startOffset = 0.1, endMargin = 0.45 } = {}) {
  const span = Math.max(0.4, c.end - c.start - startOffset - endMargin);
  c.at(startOffset, () => {
    s.play(val.to(target, { duration: span, ease: linear }));
  });
  return span;
}

/** Luminous horizontal meter bar. */
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

/** Quadratic bezier polyline points between `a` and `b` with perpendicular `bend`. */
export function quadArcPts(a, b, bend = 0, steps = 18) {
  const mx = (a[0] + b[0]) * 0.5;
  const my = (a[1] + b[1]) * 0.5;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx - (dy / len) * bend;
  const cy = my + (dx / len) * bend;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * a[0] + 2 * u * t * cx + t * t * b[0],
      u * u * a[1] + 2 * u * t * cy + t * t * b[1],
    ]);
  }
  return pts;
}

/** Glowing beam along polyline `pts`. */
export function beamWithPhotons(pts, color, _phaseVal, { width = 3.4, glow = 8, alpha = 1 } = {}) {
  return glowingTrail(pts, { color, width, glow, opacity: 0.9 * alpha });
}

/** Trim segment endpoints by padA / padB so connectors never collide with labels or node borders. */
export function trimSeg(a, b, padA = 56, padB = 56) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [
    [a[0] + (dx / len) * padA, a[1] + (dy / len) * padA],
    [b[0] - (dx / len) * padB, b[1] - (dy / len) * padB],
  ];
}

/** Shaded glowing 3D box slab added directly to a `cinematic3d` view. */
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

/** Elevated 3D arc with optional moving photon dot. */
export function addArc3D(
  view,
  p0,
  p1,
  color,
  { lift = 0.7, width = 2.6, glow = 8, pulseVal = null, phaseOffset = 0 } = {},
) {
  const posAt = (t) => [
    p0[0] + (p1[0] - p0[0]) * t,
    p0[1] + (p1[1] - p0[1]) * t,
    p0[2] + (p1[2] - p0[2]) * t + Math.sin(Math.PI * t) * lift,
  ];
  const arc = curve3d(posAt, [0, 1], { color, width, glow, blend: 'screen', samples: 26 });
  view.add(arc);
  if (pulseVal) {
    const pt = point3d(
      () => {
        const u = (((pulseVal.value + phaseOffset) % 1) + 1) % 1;
        return posAt(u);
      },
      { color: '#ffffff', radius: 4.5, glow: 10, blend: 'screen' },
    );
    view.add(pt);
  }
  return arc;
}

/**
 * Reusable luminous conservation bar for fixed-period allowance ledgers:
 * Available + Held + Settled = Total.
 */
export function buildLedgerNodes({
  available,
  held,
  settled,
  total,
  xLeft = -820,
  yBar = 140,
  width = 1640,
  height = 68,
  showEquation = true,
  equationY = 265,
}) {
  const nodes = [];
  const colX = [xLeft + width * 0.16, xLeft + width * 0.5, xLeft + width * 0.84];
  const meta = [
    ['AVAILABLE', available, COSMOS.ink],
    ['HELD RESERVATION', held, ROLE.held],
    ['SETTLED USAGE', settled, ROLE.ok],
  ];
  meta.forEach(([label, val, color], i) => {
    nodes.push(
      txt(label, colX[i], yBar - 144, 26, i === 0 ? COSMOS.muted : color, 'mono', 'center'),
      txt(val.toLocaleString('en-US'), colX[i], yBar - 88, 48, color, 'mono', 'center').glow(
        i === 0 ? 3 : 8,
        color,
      ),
    );
  });

  // Track frame
  const cx = xLeft + width * 0.5;
  nodes.push(
    rect(width, height, { fill: '#0c1324', stroke: '#2c3d66', width: 2.2, radius: 10 }).at(
      cx,
      yBar,
    ),
  );

  // Segments
  let cursor = xLeft + 4;
  const innerW = width - 8;
  const segs = [
    [available, '#475a82', 0],
    [held, ROLE.held, 8],
    [settled, ROLE.ok, 8],
  ];
  for (const [val, color, glow] of segs) {
    if (val <= 0) continue;
    const w = Math.max(6, (innerW * val) / total);
    const bar = rect(w - 2, height - 8, { fill: color, stroke: null, radius: 6 }).at(
      cursor + w * 0.5,
      yBar,
    );
    if (glow > 0) bar.glow(glow, color);
    nodes.push(bar);
    cursor += w;
  }

  if (showEquation) {
    nodes.push(
      txt(
        `${available.toLocaleString('en-US')} available  +  ${held.toLocaleString('en-US')} held  +  ${settled.toLocaleString('en-US')} settled  =  ${total.toLocaleString('en-US')} units`,
        cx,
        equationY,
        30,
        ROLE.ok,
        'mono',
        'center',
      ),
    );
  }
  return nodes;
}

/**
 * Reusable 16-slot (4x4) physical KV page tile.
 */
export function buildKvPageTile({
  id,
  cx,
  cy,
  used,
  owner,
  color,
  borderColor,
  markedSlot = -1,
  markedLabel = '',
  reservedEmpty = false,
  footerText = null,
}) {
  const nodes = [];
  const cardW = 296;
  const cardH = 264;
  const stroke = borderColor ?? color;
  nodes.push(
    txt(id, cx, cy - cardH * 0.5 - 40, 34, stroke, 'mono', 'center').glow(6, stroke),
    rect(cardW, cardH, { fill: '#0b1224', stroke, width: 3.0, radius: 14 })
      .at(cx, cy)
      .glow(borderColor && borderColor !== color ? 10 : 5, stroke),
  );
  const slotW = 54;
  const slotH = 44;
  const gapX = 12;
  const gapY = 12;
  const gridW = 4 * slotW + 3 * gapX;
  const gridH = 4 * slotH + 3 * gapY;
  const x0 = cx - gridW * 0.5 + slotW * 0.5;
  const y0 = cy - gridH * 0.5 + slotH * 0.5;

  for (let i = 0; i < 16; i++) {
    const sx = x0 + (i % 4) * (slotW + gapX);
    const sy = y0 + Math.floor(i / 4) * (slotH + gapY);
    const isMarked = i === markedSlot;
    const isFilled = i < used;
    const fill = isMarked ? ROLE.focus : isFilled ? color : reservedEmpty ? '#241e10' : '#0d1526';
    const slotStroke = isMarked
      ? ROLE.focus
      : isFilled
        ? null
        : reservedEmpty
          ? ROLE.held
          : '#2c3d66';
    const tile = rect(slotW, slotH, { fill, stroke: slotStroke, width: 1.6, radius: 5 }).at(sx, sy);
    if (isMarked) tile.glow(10, ROLE.focus);
    nodes.push(tile);
    if (isMarked && markedLabel) {
      nodes.push(txt(markedLabel, sx, sy, 26, COSMOS.bg, 'mono', 'center'));
    }
  }

  const label = footerText ?? (owner ? `${owner} · ${used} / 16` : 'free page');
  nodes.push(
    txt(label, cx, cy + cardH * 0.5 + 46, 28, owner ? color : ROLE.free, 'mono', 'center'),
  );
  return nodes;
}

/**
 * Shared living 5-page worker KV pool + logical page tables for `pages` and `boundary-close`.
 */
export function buildPagePoolStage({
  history,
  pendingPosition = null,
  markedPosition = null,
  tracedPage = -1,
  note = '',
  noteColor = COSMOS.ink,
  pulse = 0,
}) {
  const nodes = [];
  const ink = { A: ROLE.A, B: ROLE.B };

  // Logical page tables (top band y = -280, -196)
  nodes.push(txt('LOGICAL PAGE TABLES', -120, -334, 26, COSMOS.muted, 'mono', 'left'));
  ['A', 'B'].forEach((owner, row) => {
    const y = -278 + row * 82;
    const table = history.tables[owner];
    const col = ink[owner];
    nodes.push(
      circle(24, { fill: '#0b1224', stroke: col, width: 3 }).at(-820, y).glow(7, col),
      txt(owner, -820, y, 28, col, 'mono', 'center'),
      txt(
        table.length ? `${history.tokens[owner]} cached positions` : 'request retired',
        -770,
        y,
        30,
        table.length ? COSMOS.ink : COSMOS.muted,
        'sans',
        'left',
      ),
    );
    if (!table.length) {
      nodes.push(txt('no active page mappings', -120, y, 28, COSMOS.muted, 'mono', 'left'));
    } else {
      table.forEach((pid, idx) => {
        const px = -80 + idx * 146;
        const active = pid === tracedPage;
        const cCol = active ? ROLE.focus : col;
        nodes.push(
          rect(82, 48, { fill: '#0d1628', stroke: cCol, width: active ? 3 : 2, radius: 8 })
            .at(px, y)
            .glow(active ? 9 : 4, cCol),
          txt(`P${pid}`, px, y, 28, cCol, 'mono', 'center'),
        );
        if (idx < table.length - 1) {
          nodes.push(txt('->', px + 73, y, 26, col, 'mono', 'center'));
        }
      });
    }
  });

  // 5 interleaved physical pages on one shelf (y = 85)
  const mark = markedPosition ? locatePosition(history.tables.B, markedPosition) : null;
  const pageXs = [-688, -344, 0, 344, 688];
  history.pages.forEach((page, i) => {
    const cx = pageXs[i];
    const color = ink[page.owner] ?? '#52658d';
    const isTraced = page.id === tracedPage;
    nodes.push(
      ...buildKvPageTile({
        id: `P${page.id}`,
        cx,
        cy: 92,
        used: page.used,
        owner: page.owner,
        color,
        borderColor: isTraced ? ROLE.focus : page.owner ? color : ROLE.free,
        markedSlot: mark?.page === page.id ? mark.slot : -1,
        markedLabel: mark?.page === page.id ? String(markedPosition) : '',
      }),
    );
    // Subtle glowing trace pulse from logical table to traced physical page (stops cleanly above P-label)
    if (isTraced) {
      nodes.push(
        beamWithPhotons(
          quadArcPts(
            [page.owner === 'A' ? 200 : 120, page.owner === 'A' ? -252 : -170],
            [cx, -112],
            12,
          ),
          ROLE.focus,
          0,
          { width: 3.2, glow: 9 },
        ),
      );
    }
  });

  // Bottom status band (y = 338 and 420)
  nodes.push(
    txt(
      pendingPosition ? `B needs position ${pendingPosition}` : 'Worker physical KV page pool',
      -836,
      340,
      32,
      pendingPosition ? ROLE.B : COSMOS.ink,
      'mono',
      'left',
    ),
    txt(
      `Free pages: ${history.freePages} / 5`,
      836,
      340,
      32,
      history.freePages > 0 ? ROLE.free : ROLE.warn,
      'mono',
      'right',
    ),
  );
  if (note) {
    nodes.push(txt(note, -836, 420, 34, noteColor, 'sans', 'left'));
  }
  return nodes;
}
