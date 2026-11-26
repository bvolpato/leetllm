// Shared math imports, build-time invariants, palette, and cinema helpers for feature-engineering.
import {
  circle,
  curve3d,
  dynamic,
  group,
  line,
  line3d,
  linear,
  point3d,
  rect,
  surface,
  text,
} from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';
import {
  cutoff,
  events,
  featureNames,
  featureWeights,
  freshFeatureEvents,
  targetRows,
  waitTimes,
} from '../../films/feature-engineering/fixtures.mjs';
import {
  clock,
  encode,
  heartbeatAge,
  quantile,
  scoreForCap,
} from '../../films/feature-engineering/arithmetic.mjs';
import {
  eligible,
  heartbeatAgeHours,
  iqr,
  mean,
  median,
  robustFortyTwo,
  robustOutlier,
  scaleRows,
  smoothed,
  standardFortyTwo,
  std,
} from '../../films/feature-engineering/construction.mjs';
import {
  allowedTargetMean,
  eligibleFeatureEvent,
  featureSum,
  featureTransfer,
  featureVector,
  lagRoute,
  validateModel,
  welfordTrace,
} from '../../films/feature-engineering/model.mjs';

export {
  COSMOS,
  allowedTargetMean,
  cinematic3d,
  clock,
  curve3d,
  cutoff,
  eligible,
  eligibleFeatureEvent,
  encode,
  events,
  featureNames,
  featureSum,
  featureTransfer,
  featureVector,
  featureWeights,
  freshFeatureEvents,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heartbeatAge,
  heartbeatAgeHours,
  heroTitle,
  iqr,
  lagRoute,
  line3d,
  mean,
  median,
  orbitScene,
  point3d,
  quantile,
  robustFortyTwo,
  robustOutlier,
  scaleRows,
  scoreForCap,
  smoothed,
  standardFortyTwo,
  std,
  surface,
  targetRows,
  txt,
  waitTimes,
  welfordTrace,
};

export const ROLE = {
  clock: COSMOS.gold,
  eligible: COSMOS.cyan,
  leak: COSMOS.rose,
  good: COSMOS.emerald,
  vector: COSMOS.violet,
  warm: COSMOS.amber,
};

export const INTRO_JOBS = [
  { id: 1, backlog: 18, escalation: true, missed: true },
  { id: 2, backlog: 3, escalation: false, missed: false },
  { id: 3, backlog: 9, escalation: true, missed: true },
  { id: 4, backlog: 22, escalation: false, missed: false },
];

export const REVISION_RECORDS = [
  { job: 'J-204', event: 510, available: 511, revision: 1 },
  { job: 'J-204', event: 510, available: 545, revision: 2 },
  { job: 'J-204', event: 530, available: 555, revision: 1 },
  { job: 'J-peer', event: 525, available: 526, revision: 1 },
  { job: 'J-204', event: 560, available: 561, revision: 1 },
];

export const PARITY_AGE = 0.5;
export const parityLogit = (backlog) => 0.02 * PARITY_AGE + 0.01 * backlog - 4;
export const sigmoid = (z) => 1 / (1 + Math.exp(-z));

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const mix = (a, b, t) => a + (b - a) * clamp01(t);

// Non-overlapping crossfade (P5 compliant: old fades to 0 by 0.42, new enters at 0.58)
export const fadeOut = (t) => clamp01(1 - t / 0.42);
export const fadeIn = (t) => clamp01((t - 0.58) / 0.42);

export function verifyFeatureEngineeringInvariants() {
  validateModel();
  verifyInvariant(heartbeatAgeHours === 0.5, 'J-204 08:30 heartbeat at 09:00 is 0.5 h');
  verifyApprox(standardFortyTwo, -0.374, 0.001, '42m z-score');
  verifyApprox(robustFortyTwo, 0.522, 0.001, '42m robust score');
  verifyApprox(robustOutlier, 416.452, 0.001, '12000m robust score');
  verifyApprox(quantile(0.25), 16.5, 1e-9, 'Q1 inclusive');
  verifyApprox(quantile(0.75), 45.25, 1e-9, 'Q3 inclusive');
  verifyApprox(iqr, 28.75, 1e-9, 'IQR inclusive');
  verifyApprox(smoothed, 11 / 16, 1e-12, 'Full-data L4 smoothed target encoding');
  verifyApprox(encode(targetRows, [1, 3, 5, 7], 7), 0.75, 1e-12, 'Cross-fit L4 held-out encoding');
  const flipped = targetRows.map((row, idx) => (idx === 7 ? { ...row, missed: 0 } : row));
  verifyApprox(encode(flipped, [], 7), 5 / 12, 1e-12, 'Flipped T8 full-data encoding');
  verifyApprox(encode(flipped, [1, 3, 5, 7], 7), 0.75, 1e-12, 'Flipped T8 cross-fit stays 3/4');
  const trace = welfordTrace([2, 4, 6]);
  verifyInvariant(trace[2].mean === 4 && trace[2].m2 === 8, 'Welford [2,4,6] mean=4, M2=8');
  verifyApprox(trace[2].population, 8 / 3, 1e-12, 'Welford population variance 8/3');
  verifyApprox(trace[2].sample, 4, 1e-12, 'Welford sample variance 4');
  verifyApprox(scoreForCap(180), 0.445, 0.001, 'Cap 180 score');
  verifyApprox(scoreForCap(360), 0.545, 0.001, 'Cap 360 score');
  const v = featureVector({
    pool: 'a100-pool',
    queued: 42,
    heartbeat: 0.5,
    backlog: 18,
    priority: false,
  });
  verifyApprox(featureSum(v).total[0], 0.61, 1e-12, 'Ordered vector dot product 0.61');
  const sw = [...v];
  [sw[3], sw[4]] = [sw[4], sw[3]];
  verifyApprox(featureSum(sw).total[0], 1.025, 1e-12, 'Swapped vector dot product 1.025');
  verifyApprox(parityLogit(0), -3.99, 1e-12, 'Captured parity logit');
  verifyApprox(parityLogit(18), -3.81, 1e-12, 'Source parity logit');
  verifyInvariant(lagRoute(15) === 'normal' && lagRoute(45) === 'fallback', 'Lag route bounds');
  verifyInvariant(lagRoute(45.1) === 'abstain' && lagRoute(false) === 'abstain', 'Lag abstain');
  verifyApprox(featureTransfer(0).score, 13 / 60, 1e-12, 'Fresh transfer captured score');
  verifyApprox(featureTransfer(7).score, 43 / 150, 1e-12, 'Fresh transfer eligible score');
}

export function markDecor(node) {
  if (!node) return node;
  if (!node.data) node.data = {};
  node.data.decoration = true;
  if (Array.isArray(node.children)) {
    for (const child of node.children) markDecor(child);
  }
  return node;
}

export function safeDur(clockObj, startTime, desired = 0.65, margin = 0.34) {
  const avail = clockObj.end - startTime - margin;
  return Math.max(0.08, Math.min(desired, avail));
}

export function cueTo(s, c, cueId, val, target, opts = {}) {
  const { dur = 0.65, after = false, ease } = opts;
  const info = c.cue(cueId);
  const t0 = after ? info.end : info.start;
  const duration = safeDur(c, t0, dur);
  const playOpts = ease ? { duration, ease } : { duration };
  if (after) {
    c.after(cueId, () => s.play(val.to(target, playOpts)));
  } else {
    c.on(cueId, () => s.play(val.to(target, playOpts)));
  }
  return info;
}

export function beatTo(s, c, beatIdx, val, target, opts = {}) {
  const { dur = 0.65, ease } = opts;
  const b = c.beats?.[beatIdx];
  if (!b) return;
  const duration = safeDur(c, b.start, dur);
  const playOpts = ease ? { duration, ease } : { duration };
  c.onBeat(beatIdx, () => s.play(val.to(target, playOpts)));
}

export function livingDrift(s, c, val, target = 1, { startOffset = 0.05, endMargin = 0.45 } = {}) {
  const span = c.end - c.start;
  const duration = Math.max(0.3, span - startOffset - endMargin);
  c.at(startOffset, () => s.play(val.to(target, { duration, ease: linear })));
  return duration;
}

export function cinemaGrid({ accent = COSMOS.cyan, seed = 1 } = {}) {
  const nodes = [];
  for (let x = -840; x <= 840; x += 240) {
    nodes.push(line([x, -540], [x, 540], { stroke: '#121a30', width: 1 }).opacity(0.14));
  }
  for (let y = -420; y <= 420; y += 210) {
    nodes.push(line([-960, y], [960, y], { stroke: '#121a30', width: 1 }).opacity(0.14));
  }
  for (let i = 0; i < 16; i += 1) {
    const h1 = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
    const h2 = Math.sin((i + 1) * 93.9898 + seed * 19.13) * 24634.6345;
    const px = ((h1 - Math.floor(h1)) * 2 - 1) * 900;
    const py = ((h2 - Math.floor(h2)) * 2 - 1) * 490;
    const r = 1.4 + ((i + seed) % 3) * 0.7;
    nodes.push(
      circle(r, { fill: i % 3 === 0 ? accent : '#8da2cf' })
        .at(px, py)
        .opacity(0.18),
    );
  }
  return markDecor(group(...nodes).zIndex(-60));
}

export function decorAura(x, y, radius, innerHex, outerHex = '#07091000') {
  return markDecor(aura(x, y, radius, innerHex, outerHex));
}

export function rule(x0, y0, x1, y1, color = '#2a3759', width = 2) {
  return line([x0, y0], [x1, y1], { stroke: color, width });
}

export function glowBar(x, y, w, h, color, { glow = 8, radius = 6, opacity = 1 } = {}) {
  const bar = rect(Math.max(2, w), h, { fill: color, radius }).at(x + Math.max(2, w) / 2, y);
  if (glow > 0) bar.glow(glow, color);
  return bar.opacity(opacity);
}

export function glowDot(x, y, { radius = 10, color = COSMOS.cyan, glow = 10, opacity = 1 } = {}) {
  const dot = circle(radius, { fill: color }).at(x, y);
  if (glow > 0) dot.glow(glow, color);
  return dot.opacity(opacity);
}

export function numCell(val, x, y, opts = {}) {
  const {
    w = 104,
    h = 62,
    fill = '#10182b',
    stroke = '#2b3b60',
    textColor = COSMOS.ink,
    size = 30,
    glow = 0,
    opacity = 1,
  } = opts;
  const box = rect(w, h, { fill, stroke, width: 2.4, radius: 10 }).at(x, y);
  if (glow > 0) box.glow(glow, stroke);
  const label = text(String(val), {
    font: 'mono',
    size,
    color: textColor,
    align: 'center',
  }).at(x, y + 2);
  return group(box, label).opacity(opacity);
}

export function glowBadge(label, x, y, color, { w = 210, h = 50, size = 26, opacity = 1 } = {}) {
  const box = rect(w, h, {
    fill: `${color}1e`,
    stroke: color,
    width: 2.2,
    radius: h / 2,
  })
    .at(x, y)
    .glow(6, color);
  const t = text(label, { font: 'mono', size, color, align: 'center' }).at(x, y + 2);
  return group(box, t).opacity(opacity);
}
