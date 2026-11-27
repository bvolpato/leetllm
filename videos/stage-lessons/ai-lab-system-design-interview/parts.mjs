// Shared cinema building blocks, semantic color roles, 3D helpers, and verified math
// invariants for the AI Lab System Design Interview stage lesson (27 scenes).
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
import { DOCS, TRANSITIONS } from '../../films/ai-lab-system-design-interview/fixtures.mjs';
import {
  canTransition,
  dualResourceAdmission,
  eligibleDocuments,
  memoryBudget,
  queueAdmission,
  releaseGate,
  retryMode,
  servingSnapshot,
  trafficBudget,
} from '../../films/ai-lab-system-design-interview/model.mjs';
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
  DOCS,
  TRANSITIONS,
  aura,
  canTransition,
  cinematic3d,
  dualResourceAdmission,
  eligibleDocuments,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  memoryBudget,
  metricReadout,
  orbitScene,
  queueAdmission,
  releaseGate,
  retryMode,
  rule,
  servingSnapshot,
  trafficBudget,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
};

/**
 * Semantic color roles held constant across all 27 ai-lab-system-design-interview scenes:
 *   request / prefill / data plane -> cyan
 *   ok / admitted / safe / GQA     -> emerald
 *   quota / limit / focus / receipt -> gold
 *   control plane / policy / cache -> violet
 *   overload / 503 / leak / fail   -> rose
 *   caution / 429 / stale / wait   -> amber
 *   worker / cluster / decode      -> blue
 */
export const ROLE = Object.freeze({
  req: COSMOS.cyan,
  ok: COSMOS.emerald,
  focus: COSMOS.gold,
  policy: COSMOS.violet,
  fail: COSMOS.rose,
  warn: COSMOS.amber,
  worker: COSMOS.blue,
});

export const MEM_BUDGET = memoryBudget();
export const TRAFFIC_BASE = trafficBudget();
export const TRAFFIC_DOUBLE = trafficBudget({ outputTokens: 900 });
export const OPEN_ADM = queueAdmission(50_000, 125_000, 0.25);
export const LIGHT_ADM = queueAdmission(20_000, 125_000, 0.25);
export const FRESH_ADM = queueAdmission(25_000, 125_000, 0.25);
export const CLAIM_ADM = dualResourceAdmission();
export const ELIGIBLE_DOCS = eligibleDocuments(DOCS, ['employees']);
export const GATE_BASE = releaseGate();

/** Build-time mathematical invariant suite covering every spoken value in ai-lab-system-design-interview. */
export function verifyInterviewInvariants() {
  verifyApprox(OPEN_ADM.estimatedWait, 0.4, 1e-9, 'opening wait 400 ms');
  verifyInvariant(OPEN_ADM.admitted === false, 'opening 400ms rejected > 250ms');
  verifyApprox(LIGHT_ADM.estimatedWait, 0.16, 1e-9, 'R-104 wait 160 ms');
  verifyInvariant(LIGHT_ADM.admitted === true, 'R-104 160ms admitted');
  verifyInvariant(servingSnapshot(0.16).requestStarted === true, 'R-104 starts at 160ms');
  verifyInvariant(servingSnapshot(0.2).requestComplete === true, 'R-104 finishes at 200ms');
  verifyApprox(MEM_BUDGET.weightsGb, 16, 1e-9, '8B BF16 weights 16 GB');
  verifyInvariant(MEM_BUDGET.perTokenGqa === 131_072, 'GQA per-token 128 KiB');
  verifyApprox(MEM_BUDGET.mhaGb, 17.179869184, 1e-4, 'MHA KV ~17.2 GB');
  verifyApprox(MEM_BUDGET.gqaGb, 4.294967296, 1e-4, 'GQA KV ~4.3 GB');
  verifyApprox(TRAFFIC_BASE.tokensPerSecond, 110_000, 1e-9, 'base demand 110k tok/s');
  verifyApprox(TRAFFIC_BASE.headroom, 15_000, 1e-9, 'base headroom 15k tok/s (12%)');
  verifyApprox(TRAFFIC_DOUBLE.tokensPerSecond, 140_000, 1e-9, 'double output 140k tok/s');
  verifyApprox(TRAFFIC_DOUBLE.headroom, -15_000, 1e-9, 'double output short by 15k tok/s');
  verifyApprox(CLAIM_ADM.prefill.estimatedWait, 0.125, 1e-9, 'concurrent claim wait 125ms');
  verifyInvariant(CLAIM_ADM.admitted === true, 'concurrent claim initial check passes');
  verifyInvariant(
    ELIGIBLE_DOCS.length === 1 && ELIGIBLE_DOCS[0].id === 'public-access-policy',
    'only public-access-policy crosses ACL gate',
  );
  verifyInvariant(canTransition('blocked', 'running') === true, 'blocked -> running legal');
  verifyInvariant(canTransition('complete', 'running') === false, 'complete is terminal');
  verifyInvariant(retryMode('repo_read') === 'automatic', 'repo_read auto retries');
  verifyInvariant(
    retryMode('create_commit', true) === 'automatic-with-idempotency',
    'idempotent write',
  );
  verifyInvariant(
    retryMode('create_commit', false) === 'reconcile-or-review',
    'unsafe write reconciles',
  );
  verifyInvariant(
    GATE_BASE.launchAllowed === false && GATE_BASE.failures.join(',') === 'faithfulness',
    'release gate stops for citation faithfulness (93 < 95)',
  );
  verifyApprox(FRESH_ADM.estimatedWait, 0.2, 1e-9, 'R-205 wait 200ms <= 250ms');
  verifyInvariant(FRESH_ADM.admitted === true, 'R-205 capacity accepts');
}

export function cinemaHeader(
  eyebrow,
  line1,
  line2,
  { x = -860, y = -445, accent = COSMOS.cyan, size = 46, anchor = 'left' } = {},
) {
  const parts = [
    txt(eyebrow, x, y, 26, accent, 'mono', anchor),
    txt(line1, x, y + 56, size, COSMOS.ink, 'serif', anchor),
  ];
  if (line2) {
    parts.push(txt(line2, x, y + 116, size, accent, 'serif', anchor).glow(6, accent));
  }
  return group(...parts);
}

export function clampDur(c, startTime, desired, margin = 0.4) {
  const available = c.end - startTime - margin;
  if (available <= 0.08) return 0.08;
  return Math.min(desired, available);
}

export function driftValue(s, c, val, target, { startOffset = 0.1, endMargin = 0.45 } = {}) {
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

export function beamWithPhotons(pts, color, _phaseVal, { width = 3.6, glow = 9, alpha = 1 } = {}) {
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

/** Auto-sized circular architecture node guaranteeing >= 12px interior padding around text. */
export function sysNode(
  x,
  y,
  label,
  color,
  { radius = 50, sub = null, opacity = 1, glow = 8, size = 26 } = {},
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
    parts.push(txt(sub, x, y + r + 36, 26, COSMOS.muted, 'mono', 'center').opacity(opacity));
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
