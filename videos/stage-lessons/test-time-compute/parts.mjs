// Shared cinematic palette, verified invariants, and 3D compute-frontier / search-pruning manifolds
// for the 27-scene Test-Time Compute stage film.
import { arrow, circle, dot, group, line, rect, seq, surface } from 'vizmatic/stage';
import { coverage, promptCoverage, rawKVBytes } from '../../films/test-time-compute/arithmetic.mjs';
import {
  checkedRevisionLedger,
  pruningSnapshot,
  testTimeCoreFrame,
} from '../../films/test-time-compute/construction.mjs';
import {
  answer,
  budgets,
  candidates,
  extras,
  finalRequest,
  kvPerToken,
  latency,
  prune,
  quality,
  scored,
  scores,
  seats,
  tables,
} from '../../films/test-time-compute/fixtures.mjs';
import {
  chooseBudget,
  chooseFeasible,
  plurality,
  retainedBranchLedger,
} from '../../films/test-time-compute/model.mjs';
import { verifiedChairs } from '../../films/test-time-compute/seating.mjs';
import { validateModel } from '../../films/test-time-compute/validation.mjs';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  COSMOS,
  answer,
  arrow,
  aura,
  budgets,
  candidates,
  checkedRevisionLedger,
  chooseBudget,
  chooseFeasible,
  cinematic3d,
  circle,
  coverage,
  dot,
  extras,
  finalRequest,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  kvPerToken,
  latency,
  line,
  orbitScene,
  plurality,
  promptCoverage,
  prune,
  pruningSnapshot,
  quality,
  rawKVBytes,
  rect,
  retainedBranchLedger,
  scored,
  scores,
  seats,
  seq,
  surface,
  tables,
  testTimeCoreFrame,
  txt,
  verifiedChairs,
  wireframeSlab3d,
};

export const ROLE = Object.freeze({
  search: COSMOS.cyan,
  draft: COSMOS.blue,
  score: COSMOS.violet,
  err: COSMOS.rose,
  ok: COSMOS.emerald,
  gold: COSMOS.gold,
  amber: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
});

export const COV_4 = coverage(4);
export const COV_16 = coverage(16);
export const SEL_4 = COV_4 * 0.8;
export const REV_LEDGER_4 = checkedRevisionLedger(4);
export const DIST_BEFORE = promptCoverage([0.8, 0.2], 4);
export const DIST_AFTER = promptCoverage([0.99, 0.05], 4);
export const ROUTER_FRAME = testTimeCoreFrame('router-feasible');
export const SEARCH_BOUND_FRAME = testTimeCoreFrame('search-bound');
export const TTFT_FRAME = testTimeCoreFrame('hidden-ttft');
export const USAGE_FRAME = testTimeCoreFrame('provider-usage');
export const TRAIN_FRAME = testTimeCoreFrame('train-time-axis');
export const FRESH_6 = retainedBranchLedger(6);
export const FRESH_5 = retainedBranchLedger(5);
export const FRESH_4 = retainedBranchLedger(4);

export function verifyTestTimeComputeInvariants() {
  verifyInvariant(validateModel() === true, 'test-time-compute film model validates');
  verifyInvariant(answer === 44, '4 tables x 8 seats + 12 wall = 44');
  verifyInvariant(plurality(candidates) === 32, 'plurality vote returns 32');
  verifyInvariant(verifiedChairs(candidates)[0] === 44, 'verifier finds 44');
  verifyInvariant(verifiedChairs([32, 32, 40, 48]).length === 0, 'empty verified pool');
  verifyApprox(COV_4, 0.68359375, 1e-12, '4-attempt coverage ~68.36%');
  verifyApprox(SEL_4, 0.546875, 1e-12, 'selected 4-attempt ~54.69%');
  verifyApprox(DIST_BEFORE.mean, 0.7944, 1e-12, 'before training mean pass@4 = 0.7944');
  verifyApprox(DIST_AFTER.mean, 0.59274687, 1e-12, 'after training mean pass@4 = 0.5927');
  verifyInvariant(budgets[chooseBudget(1000)] === 512, 'best under 1000ms = 512');
  verifyInvariant(budgets[chooseBudget(400)] === 128, 'best under 400ms = 128');
  verifyInvariant(kvPerToken === 131072, '128 KiB per KV position');
  verifyInvariant(FRESH_6.positions === 6000 && FRESH_4.positions === 5000, 'fresh positions');
  verifyInvariant(!FRESH_6.fits && !FRESH_5.fits && FRESH_4.fits, 'fresh 4 tails fit 256 MiB');
}

export function safeDur(c, startTime, desired = 0.65, margin = 0.44) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.12, Math.min(desired, remaining));
}

export function playCue(
  s,
  c,
  cueId,
  build,
  { after = false, offset = 0, dur = 0.65, margin = 0.44 } = {},
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

export function bindCueBeat(s, c, accentVal, cueIds, { after = false } = {}) {
  cueIds.forEach((cueId, idx) => {
    const target = (idx + 1) * 0.35;
    playCue(s, c, cueId, (d) => s.play(accentVal.to(target, { duration: d })), {
      after,
      dur: 0.3,
    });
  });
}

export function swapVis(outVal, inVal, d = 0.6) {
  const half = Math.max(0.12, d * 0.46);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

export function chipPill(
  label,
  x,
  y,
  { w = 180, h = 66, color = ROLE.search, fill = '#10182d', size = 28, glow = 8, opacity = 1 } = {},
) {
  const frame = rect(w, h, { fill, stroke: color, width: 2.6, radius: 12 })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) frame.glow(glow, color);
  return group(frame, txt(label, x, y, size, COSMOS.ink, 'mono', 'center').opacity(opacity));
}

export function lumBar(
  x0,
  y,
  width,
  height,
  color,
  { opacity = 0.92, glow = 10, maxTrackW = 0 } = {},
) {
  const items = [];
  if (maxTrackW > 0) {
    items.push(
      rect(maxTrackW, height, { fill: '#12192e', stroke: '#253358', width: 1.5, radius: 6 })
        .at(x0 + maxTrackW * 0.5, y)
        .opacity(0.65 * opacity),
    );
  }
  const w = Math.max(4, width);
  const bar = rect(w, height, { fill: color, stroke: null, radius: 6 })
    .at(x0 + w * 0.5, y)
    .opacity(opacity);
  if (glow > 0) bar.glow(glow, color).set('blend', 'screen');
  items.push(bar);
  if (w > 12) {
    items.push(
      glowDot(x0 + w, y, { radius: Math.min(7, height * 0.28), color, glow: glow + 2, opacity }),
    );
  }
  return group(...items);
}

/** Orbiting 3D Test-Time Compute Frontier: pass@N coverage surface over (attempt count N x base hit rate p) with verifier recall plane. */
export function buildComputeFrontier3d(selectorVal, { x = 465, y = 20 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 14.8,
    unit: 112,
    focus: [0, 0, 0.45],
  }).at(x, y);

  const surf = surface(
    (px, py) => {
      const n = 1 + ((px + 2.4) / 4.8) * 15; // N in [1..16]
      const p = 0.08 + ((py + 2.4) / 4.8) * 0.45; // p in [0.08..0.53]
      const cov = 1 - Math.pow(1 - p, n);
      const recallScale = 1 - 0.2 * Math.max(0, Math.min(1, selectorVal.value));
      return cov * recallScale * 1.95;
    },
    {
      x: [-2.4, 2.4],
      y: [-2.4, 2.4],
      resolution: [24, 24],
      colors: ['#101c3a', '#1d4d7c', '#5ce1e6', '#ffd166', '#38d39f'],
      opacity: 0.9,
      mesh: '#7ce8ff',
      meshOpacity: 0.22,
      meshWidth: 0.72,
      animate: true,
    },
  );

  const frontierCage = wireframeSlab3d([0, 0, 1.35], 2.2, 2.2, 0.04, {
    color: COSMOS.gold,
    width: 2.4,
    glow: 9,
  });

  view.add(surf, ...frontierCage);
  return view;
}

/** Orbiting 3D Budget vs Latency Pareto Landscape: quality ridge across reasoning tokens & latency cap wall. */
export function buildBudgetPareto3d(tightVal, { x = 465, y = 20 } = {}) {
  const view = cinematic3d({
    theta: -0.82,
    phi: 1.0,
    distance: 14.8,
    unit: 110,
    focus: [0, 0, 0.45],
  }).at(x, y);

  const surf = surface(
    (px, py) => {
      const bFrac = (px + 2.4) / 4.8; // 0..1 reasoning budget
      const dFrac = (py + 2.4) / 4.8; // 0..1 problem difficulty
      const peak = 0.65 - 0.15 * tightVal.value;
      const qual =
        0.55 + 1.35 * Math.exp(-Math.pow((bFrac - peak) * 2.2, 2)) * (0.65 + 0.35 * dFrac);
      return Math.min(2.1, qual);
    },
    {
      x: [-2.4, 2.4],
      y: [-2.4, 2.4],
      resolution: [24, 24],
      colors: ['#101c3a', '#2b2260', '#5ce1e6', '#38d39f', '#ffd166'],
      opacity: 0.9,
      mesh: '#7ce8ff',
      meshOpacity: 0.22,
      meshWidth: 0.72,
      animate: true,
    },
  );

  const slaWall = wireframeSlab3d([0.55 - 0.85 * tightVal.value, 0, 1.05], 0.08, 2.2, 0.95, {
    color: COSMOS.rose,
    width: 2.5,
    glow: 9,
  });

  view.add(surf, ...slaWall);
  return view;
}
