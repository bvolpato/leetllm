// Shared cinema building blocks, semantic color roles, 3D helpers, and verified math
// invariants for Design Reasoning Agent & Test-Time Compute (27 scenes).
import { circle, group, line, line3d, linear, parametricSurface, rect } from 'vizmatic/stage';
import {
  advise,
  coverage,
  eligible,
  memory,
  puctWorksheet,
  stopReason,
  visitScore,
} from '../../films/design-reasoning-agent-test-time-compute/arithmetic.mjs';
import {
  branches,
  candidates,
  complete,
  invalid,
  observation,
  scores,
  steps,
} from '../../films/design-reasoning-agent-test-time-compute/fixtures.mjs';
import {
  budgetTrace,
  inspect,
  search,
} from '../../films/design-reasoning-agent-test-time-compute/model.mjs';
import {
  TokenBudget,
  deadlineLedger,
} from '../../films/design-reasoning-agent-test-time-compute/tokens.mjs';
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
  TokenBudget,
  advise,
  branches,
  budgetTrace,
  candidates,
  cinematic3d,
  complete,
  coverage,
  deadlineLedger,
  eligible,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  inspect,
  invalid,
  memory,
  observation,
  orbitScene,
  puctWorksheet,
  rule,
  scores,
  search,
  steps,
  stopReason,
  txt,
  verifyApprox,
  verifyInvariant,
  visitScore,
  wireframeSlab3d,
};

/**
 * Semantic color roles held constant across all 27 scenes:
 *   agent / search / token -> cyan
 *   verified / pass / hold -> emerald
 *   budget / focus / gate  -> gold
 *   model / policy / tree  -> violet
 *   block / prune / fail   -> rose
 *   warn / stale / pending -> amber
 *   tool / metric / kv     -> blue
 */
export const ROLE = Object.freeze({
  agent: COSMOS.cyan,
  ok: COSMOS.emerald,
  focus: COSMOS.gold,
  model: COSMOS.violet,
  fail: COSMOS.rose,
  warn: COSMOS.amber,
  tool: COSMOS.blue,
});

export const MEM_STATS = memory();
export const TREE_RUN = search(2);
export const BUDGET_ROWS = budgetTrace();
export const DEADLINE_ROWS = deadlineLedger();
export const PUCT_INIT_A = visitScore(0.5, 0.2, 16, 1);
export const PUCT_INIT_B = visitScore(0.5, 0.15, 16, 1);
export const PUCT_GOOD_A = puctWorksheet(true, 1);
export const PUCT_ZERO_A = puctWorksheet(true, 0);
export const PUCT_AFTER_B = visitScore(0.5, 0.15, 17, 1);

export function verifyTestTimeInvariants() {
  verifyInvariant(advise(observation, 110) === 'HOLD', 'rev7 240ms age 10s -> HOLD');
  verifyInvariant(
    advise({ ...observation, revision: 6 }, 110) === 'REJECT RECORD',
    'rev6 -> REJECT RECORD',
  );
  verifyInvariant(
    advise({ ...observation, latency: 300 }, 110) === 'ROLLBACK',
    '300ms boundary -> ROLLBACK',
  );
  verifyInvariant(
    advise({ ...observation, latency: 300 }, 131) === 'REFRESH EVIDENCE',
    'age 31s -> REFRESH EVIDENCE',
  );
  verifyInvariant(advise(observation, 130) === 'HOLD', 'age 30s inclusive -> HOLD');
  verifyInvariant(
    advise({ ...observation, observedAt: 99 }, 130) === 'REFRESH EVIDENCE',
    'observedAt 99 at t=130 -> REFRESH EVIDENCE',
  );
  verifyInvariant(eligible(candidates[0].path) === false, 'candidate A blocked');
  verifyInvariant(eligible(candidates[1].path) === true, 'candidate B eligible');
  verifyApprox(coverage(0.3, 5), 1 - 0.7 ** 5, 1e-9, '5-attempt coverage ~83.2%');
  verifyApprox(coverage(1e-20, 100), 1e-18, 1e-20, 'stable tiny coverage 1e-18');
  verifyInvariant(TREE_RUN.winner?.name === 'Patch sanitizer', 'beam winner Patch sanitizer');
  verifyApprox(PUCT_INIT_A.total, 0.9, 1e-9, 'PUCT init A = 0.9');
  verifyApprox(PUCT_INIT_B.total, 0.8, 1e-9, 'PUCT init B = 0.8');
  verifyInvariant(PUCT_GOOD_A.total > PUCT_AFTER_B.total, 'PUCT good A leads B');
  verifyInvariant(PUCT_ZERO_A.total < PUCT_AFTER_B.total, 'PUCT zero A trails B');
  const pr = inspect(steps);
  verifyInvariant(pr.decision === 'PRUNE' && pr.checked.length === 3, 'step checker prunes at 3');
  verifyInvariant(
    BUDGET_ROWS[0].free === 1000 && BUDGET_ROWS[1].free === 1600 && BUDGET_ROWS[2].free === 100,
    '4000-token ledger 1000 -> 1600 -> 100',
  );
  verifyInvariant(MEM_STATS.bytesPerToken === 327680, '320 KiB per token');
  verifyApprox(MEM_STATS.unshared, 40, 1e-9, 'unshared 40 GiB');
  verifyApprox(MEM_STATS.shared, 13.75, 1e-9, 'shared 13.75 GiB');
  verifyInvariant(
    DEADLINE_ROWS.initial.free === 1100 &&
      DEADLINE_ROWS.receipt.free === 1700 &&
      DEADLINE_ROWS.admitted.free === 200,
    '6000-token deadline ledger 1100 -> 1700 -> 200',
  );
  verifyInvariant(
    stopReason({ scores: [0.72, 0.68, 0.71, 0.7] }) === 'NO RECENT IMPROVEMENT',
    'plateau rule stops at 0.71 <= 0.72',
  );
}

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

export function metricReadout(
  caption,
  value,
  x,
  y,
  { color = COSMOS.gold, size = 42, anchor = 'center', glow = 8, sub } = {},
) {
  const parts = [
    txt(caption, x, y - 34, 26, COSMOS.muted, 'mono', anchor),
    txt(value, x, y + 18, size, color, 'mono', anchor).glow(glow, color),
  ];
  if (sub) {
    parts.push(txt(sub, x, y + 72, 26, COSMOS.muted, 'mono', anchor));
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

export function pillNode(x, y, w, label, color, { sub = null, opacity = 1, glow = 7 } = {}) {
  const parts = [
    rect(w, 56, { fill: '#0b1224', stroke: color, width: 2.8, radius: 10 })
      .at(x, y)
      .glow(glow, color)
      .opacity(opacity),
    txt(label, x, y, 26, color, 'mono', 'center').opacity(opacity),
  ];
  if (sub) {
    parts.push(txt(sub, x, y + 54, 26, COSMOS.muted, 'mono', 'center').opacity(opacity));
  }
  return group(...parts);
}

export function dotItem(x, y, label, color, { opacity = 1 } = {}) {
  return group(
    glowDot(x, y, { radius: 7, color, glow: 7, opacity }),
    txt(label, x + 24, y, 26, color, 'mono', 'left').opacity(opacity),
  );
}
