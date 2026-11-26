// Shared cinematic visual components, math helpers, and build-time invariants for the
// Optimizers stage lesson (23 scenes). All numbers are computed from videos/films/optimizers/.
import {
  Node,
  arrow,
  circle,
  dot,
  dynamic,
  group,
  line,
  linear,
  linearGradient,
  polyPath,
  radialGradient,
  rect,
  text,
} from 'vizmatic/stage';
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
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';
import {
  SETTINGS,
  clamp,
  fmt,
  gradient,
  loss,
  optimizerFirstStep,
  pair,
  point,
  scalarAdamWStep,
  scheduledRate,
  simulate,
  texPair,
  trajectory,
  vector,
} from '../../films/optimizers/arithmetic.mjs';
import {
  ACCUMULATION,
  COLD,
  COUPLED,
  CPU_LOOP_TRACE,
  CPU_RESUME_TRACE,
  DECAY,
  DIAGNOSTIC_RUNS,
  EIGHTY,
  FRESH_RECIPE,
  HELD_OUT_TRIALS,
  PATHS,
  PRESCRIBED,
  PRESCRIBED_GRADIENTS,
  RUNS,
  SCHEDULED,
  UNSAFE,
  ZERO_DECAY,
} from '../../films/optimizers/fixtures.mjs';

export {
  ACCUMULATION,
  COLD,
  COSMOS,
  COUPLED,
  CPU_LOOP_TRACE,
  CPU_RESUME_TRACE,
  DECAY,
  DIAGNOSTIC_RUNS,
  EIGHTY,
  FRESH_RECIPE,
  HELD_OUT_TRIALS,
  PATHS,
  PRESCRIBED,
  PRESCRIBED_GRADIENTS,
  RUNS,
  SCHEDULED,
  SETTINGS,
  UNSAFE,
  ZERO_DECAY,
  cinematic3d,
  clamp,
  fmt,
  glowDot,
  glowTex,
  glowingTrail,
  gradient,
  guardedDynamic,
  heroTitle,
  linear,
  linearGradient,
  loss,
  metricReadout,
  optimizerFirstStep,
  orbitScene,
  pair,
  point,
  polyPath,
  radialGradient,
  scalarAdamWStep,
  scheduledRate,
  simulate,
  texPair,
  text,
  trajectory,
  txt,
  vector,
};

/** Precomputed exact transfer first-steps from (-0.5, +0.5). */
export const TRANSFER_START = Object.freeze([-0.5, 0.5]);
export const TRANSFER_STEPS = Object.freeze({
  sgd: optimizerFirstStep('sgd', TRANSFER_START),
  momentum: optimizerFirstStep('momentum', TRANSFER_START),
  adam: optimizerFirstStep('adam', TRANSFER_START),
});

/** Precomputed exact AMSGrad 3-gradient squared-buffer sequence [4, 0, 3]. */
export const AMSGRAD_SEQUENCE = Object.freeze(
  (() => {
    const inputs = [4, 0, 3];
    const squared = [0];
    const maximum = [0];
    for (const g of inputs) {
      const next = (squared.at(-1) + g * g) / 2;
      squared.push(next);
      maximum.push(Math.max(maximum.at(-1), next));
    }
    return { inputs, squared, maximum };
  })(),
);

/** Clean signed number formatting using true minus sign (U+2212, never em dash). */
export function signed(value, digits = 3) {
  const s = fmt(value, digits);
  if (s === '0') return '0';
  return value > 0 ? `+${s}` : s.replace('-', '−');
}

/** Clean unsigned or signed formatting replacing ASCII hyphen with true minus sign. */
export function num(value, digits = 3) {
  return fmt(value, digits).replace('-', '−');
}

/** Clean formatted coordinate pair using true minus signs. */
export function pairText(w, digits = 3) {
  return `(${num(w[0], digits)}, ${num(w[1], digits)})`;
}

/** Browser-safe build-time mathematical invariants covering all 23 scenes. */
export function verifyOptimizersInvariants() {
  // Core 100:1 valley & first step
  const g0 = gradient([1, 1]);
  verifyApprox(g0[0], 100, 1e-12, 'initial gradient a');
  verifyApprox(g0[1], 1, 1e-12, 'initial gradient b');
  verifyApprox(loss([1, 1]), 50.5, 1e-12, 'initial loss');
  verifyApprox(RUNS.sgd.records[0].next[0], -0.8, 1e-12, 'SGD step 1 a');
  verifyApprox(RUNS.sgd.records[0].next[1], 0.982, 1e-12, 'SGD step 1 b');
  verifyApprox(RUNS.sgd.records[0].loss, 32.482162, 1e-6, 'SGD step 1 loss');

  // Stability cliff (lr = 0.021 -> multiplier -1.1)
  verifyApprox(1 - 100 * 0.021, -1.1, 1e-12, 'unsafe multiplier -1.1');
  verifyInvariant(UNSAFE.records.at(-1).loss > loss([1, 1]), 'unsafe SGD diverges');
  verifyApprox(UNSAFE.records.at(-1).next[0], 2.14358881, 1e-6, 'unsafe step 8 a');

  // Momentum step 5 uphill move
  const m5 = RUNS.momentum.records[4];
  verifyInvariant(
    m5.gradient[0] < 0 && m5.mean[0] > 0 && m5.update[0] < 0 && m5.loss > loss(m5.before),
    'momentum step 5 moves uphill when memory opposes current gradient',
  );

  // Validate all trajectories stay finite and satisfy gradient/update identity
  for (const run of [
    ...Object.values(RUNS),
    SCHEDULED,
    COLD,
    ...Object.values(EIGHTY),
    ...Object.values(DIAGNOSTIC_RUNS),
  ]) {
    for (const r of run.records) {
      verifyInvariant(r.next.every(Number.isFinite), `${run.kind} step ${r.t} finite`);
      const gCheck = gradient(r.before);
      verifyApprox(r.gradient[0], gCheck[0], 1e-12, `${run.kind} step ${r.t} grad a`);
      verifyApprox(r.gradient[1], gCheck[1], 1e-12, `${run.kind} step ${r.t} grad b`);
      verifyApprox(r.next[0], r.before[0] + r.update[0], 1e-12, `${run.kind} step ${r.t} next a`);
      verifyApprox(r.next[1], r.before[1] + r.update[1], 1e-12, `${run.kind} step ${r.t} next b`);
    }
  }

  // Cold zero-rate Adam checks
  verifyInvariant(
    COLD.records.every((r) => r.next[0] === 1 && r.next[1] === 1),
    'zero-rate Adam holds weights fixed',
  );

  // Prescribed 4-gradient trace (Momentum / RMSProp / Adam)
  verifyApprox(PRESCRIBED[0].mean[0], 10, 1e-12, 'prescribed t=1 m_a');
  verifyApprox(PRESCRIBED[1].mean[0], 1, 1e-12, 'prescribed t=2 m_a');
  verifyApprox(PRESCRIBED[1].square[0], 16.39, 1e-12, 'prescribed t=2 v_a');
  verifyApprox(PRESCRIBED[1].rms[0], 1540, 1e-12, 'prescribed t=2 s_a');
  verifyApprox(PRESCRIBED[2].mean[0], 7.9, 1e-12, 'prescribed t=3 m_a');
  verifyApprox(PRESCRIBED[3].mean[0], 1.11, 1e-12, 'prescribed t=4 m_a');
  verifyApprox(PRESCRIBED[3].mean[1], 0.33268, 1e-6, 'prescribed t=4 m_b');
  verifyInvariant(
    PRESCRIBED[1].rmsUpdate[0] < 0 && PRESCRIBED[1].adamUpdate[0] > 0,
    'step 2 RMSProp and Adam move opposite ways',
  );
  verifyApprox(PRESCRIBED[0].rmsUpdate[0], 0.0316227766, 1e-5, 'RMSProp step 1 magnitude');
  verifyApprox(PRESCRIBED[3].adamUpdate[0], 0.000409, 1e-5, 'Adam step 4 steep update');
  verifyApprox(PRESCRIBED[3].adamUpdate[1], 0.00997, 1e-4, 'Adam step 4 shallow update');
  verifyApprox(1 - 0.9 ** 3, 0.271, 1e-12, '3-step observed weight 0.271');

  // Schedule vs constant Adam
  verifyInvariant(
    SCHEDULED.records.at(-1).loss > RUNS.adam.records.at(-1).loss,
    'decayed schedule finishes with higher residual loss here',
  );

  // Accumulation unequal batches
  verifyApprox(ACCUMULATION.gradients[0], 2, 1e-12, 'accum g0');
  verifyApprox(ACCUMULATION.gradients[1], -2, 1e-12, 'accum g1');
  verifyApprox(ACCUMULATION.gradients[2], -6, 1e-12, 'accum g2');
  verifyApprox(ACCUMULATION.means[0], 2, 1e-12, 'accum batch 1 mean');
  verifyApprox(ACCUMULATION.means[1], -4, 1e-12, 'accum batch 2 mean');
  verifyApprox(ACCUMULATION.wrong, -1, 1e-12, 'accum equal-batch mean');
  verifyApprox(ACCUMULATION.weighted, -2, 1e-12, 'accum item-weighted mean');
  verifyApprox(ACCUMULATION.start - 0.1 * ACCUMULATION.wrong, 1.1, 1e-12, 'accum wrong SGD');
  verifyApprox(ACCUMULATION.start - 0.1 * ACCUMULATION.weighted, 1.2, 1e-12, 'accum correct SGD');

  // Zero-data AdamW vs coupled L2
  verifyApprox(ZERO_DECAY.cold.weight, 9.99, 1e-12, 'AdamW zero-data weight 9.99');
  verifyApprox(ZERO_DECAY.absent.weight, 10, 1e-12, 'grad=None skipped at 10');
  verifyInvariant(ZERO_DECAY.absent.skipped === true, 'grad=None flagged skipped');

  // 80-step cosine race
  verifyApprox(EIGHTY.sgd.records.at(-1).loss, 0.11730161152690877, 1e-10, '80-step SGD loss');
  verifyApprox(EIGHTY.adamw.records.at(-1).loss, 0.023508846755599614, 1e-10, '80-step AdamW loss');

  // 60-step CPU PyTorch loop & resume trace
  verifyInvariant(CPU_LOOP_TRACE.length === 60, 'CPU trace length 60');
  verifyInvariant(
    CPU_LOOP_TRACE.filter((r) => r.preclipNorm > 20).length === 11,
    '11 clipped CPU steps',
  );
  verifyApprox(CPU_LOOP_TRACE[0].preclipNorm, 100.005, 1e-3, 'CPU step 1 norm');
  verifyApprox(CPU_LOOP_TRACE.at(-1).after[0], 0.03062, 1e-4, 'CPU final weight a');
  for (let i = 0; i < 3; i++) {
    verifyApprox(
      CPU_RESUME_TRACE.original[i].weights[0],
      CPU_RESUME_TRACE.complete[i].weights[0],
      1e-12,
      `complete resume step ${i + 4} exact match`,
    );
    verifyInvariant(
      CPU_RESUME_TRACE.original[i].weights[0] !== CPU_RESUME_TRACE.weightsOnly[i].weights[0],
      `weights-only step ${i + 4} diverges`,
    );
  }

  // Diagnostic crossing & held-out trials
  verifyInvariant(
    DIAGNOSTIC_RUNS.high.records[7].loss > DIAGNOSTIC_RUNS.lower.records[7].loss,
    'high peak trails at update 8',
  );
  verifyInvariant(
    DIAGNOSTIC_RUNS.high.records[11].loss < DIAGNOSTIC_RUNS.lower.records[11].loss,
    'high peak leads at update 12',
  );
  verifyInvariant(HELD_OUT_TRIALS[0].train > HELD_OUT_TRIALS[1].train, 'AdamW lower train loss');
  verifyInvariant(HELD_OUT_TRIALS[0].held < HELD_OUT_TRIALS[1].held, 'SGD lower held-out loss');

  // AMSGrad 3-step sequence
  verifyApprox(AMSGRAD_SEQUENCE.squared[1], 8, 1e-12, 'AMSGrad v1=8');
  verifyApprox(AMSGRAD_SEQUENCE.squared[2], 4, 1e-12, 'AMSGrad v2=4');
  verifyApprox(AMSGRAD_SEQUENCE.squared[3], 6.5, 1e-12, 'AMSGrad v3=6.5');
  verifyApprox(AMSGRAD_SEQUENCE.maximum[3], 8, 1e-12, 'AMSGrad max=8');

  // Transfer (-0.5, 0.5)
  verifyApprox(TRANSFER_STEPS.sgd.next[0], 0.4, 1e-12, 'transfer SGD crosses zero to +0.4');
  verifyApprox(TRANSFER_STEPS.momentum.next[0], -0.41, 1e-12, 'transfer Momentum to -0.41');
  verifyApprox(TRANSFER_STEPS.adam.next[0], -0.42, 1e-6, 'transfer Adam to -0.42');

  // Fresh recipe capstone
  verifyApprox(FRESH_RECIPE.weighted, -4, 1e-12, 'fresh weighted -4');
  verifyApprox(FRESH_RECIPE.wrong, -10 / 3, 1e-12, 'fresh wrong -10/3');
  verifyApprox(FRESH_RECIPE.clipped, -3, 1e-12, 'fresh clipped -3');
  verifyApprox(FRESH_RECIPE.wrongClipped, -3, 1e-12, 'fresh wrong clipped -3');
  verifyApprox(FRESH_RECIPE.update.shrink, 0.002, 1e-12, 'fresh decay shrink 0.002');
  verifyApprox(FRESH_RECIPE.update.weight, 2.048, 1e-12, 'fresh final weight 2.048');
  verifyInvariant(FRESH_RECIPE.update.count === 1, 'fresh update count 1');
}

/** Non-overlapping two-phase crossfade helpers (P5: old view drops to 0 before new view rises). */
export const fadeOut = (t) => Math.max(0, Math.min(1, 1 - t / 0.42));
export const fadeIn = (t) => Math.max(0, Math.min(1, (t - 0.58) / 0.42));

/** Three-phase non-overlapping stage visibility for multi-beat scenes (stepIdx in 0..N-1). */
export function stageVis(phaseVal, idx) {
  const d = Math.abs(phaseVal - idx);
  if (d >= 0.42) return 0;
  return Math.max(0, Math.min(1, 1 - d / 0.42));
}

/** Clamp an animation duration so it strictly ends before `c.end - margin`. */
export function safeDur(clock, startTime, desired, margin = 0.32) {
  const avail = clock.end - startTime - margin;
  return Math.max(0.08, Math.min(desired, avail));
}

/** Schedule a Value transition cleanly on or after a declared cue without ever overrunning. */
export function cueTo(s, c, cueId, val, target, { after = false, dur = 0.65, ease } = {}) {
  const info = c.cue(cueId);
  const t0 = after ? info.end : info.start;
  const duration = safeDur(c, t0, dur);
  const opts = ease ? { duration, ease } : { duration };
  if (after) {
    c.after(cueId, () => s.play(val.to(target, opts)));
  } else {
    c.on(cueId, () => s.play(val.to(target, opts)));
  }
  return info;
}

/** Schedule a gentle pulse on a Value when a cue starts or ends (also marks the cue used). */
export function pulseCue(s, c, cueId, val, peak = 1, { dur = 0.45, after = false } = {}) {
  const info = c.cue(cueId);
  const t0 = after ? info.end : info.start;
  const duration = safeDur(c, t0, dur);
  const run = () => s.play(val.to(peak, { duration }));
  if (after) c.after(cueId, run);
  else c.on(cueId, run);
  return info;
}

/** Continuous living scene-wide phase drift [0 -> target] bounded strictly inside the scene. */
export function livingDrift(s, c, val, target = 1, { startOffset = 0.05, endMargin = 0.45 } = {}) {
  const span = c.end - c.start;
  const duration = Math.max(0.3, span - startOffset - endMargin);
  c.at(startOffset, () => s.play(val.to(target, { duration, ease: linear })));
  return duration;
}

/** Mark a node (and its children recursively) as backdrop decoration so checkFilm ignores it. */
export function markDecor(node) {
  if (!node) return node;
  if (!node.data) node.data = {};
  node.data.decoration = true;
  if (Array.isArray(node.children)) {
    for (const child of node.children) markDecor(child);
  }
  return node;
}

/** Decorative aura wrapper marked so text over glowing auras never triggers false crowding. */
export function decorAura(x, y, radius, innerHex, midHex = '#07091000') {
  return markDecor(aura(x, y, radius, innerHex, midHex));
}

/** Subtle luminous cosmic coordinate lattice + orbital arcs + starfield marked as decoration. */
export function cinemaGrid({
  color = '#2b3b63',
  accent = COSMOS.cyan,
  opacity = 0.55,
  yOffset = 0,
  seed = 1,
} = {}) {
  const lines = [];
  for (let x = -800; x <= 800; x += 160) {
    lines.push(line([x, -460 + yOffset], [x, 460 + yOffset], { stroke: color, width: 1.2 }));
  }
  for (let y = -400; y <= 400; y += 160) {
    lines.push(line([-880, y + yOffset], [880, y + yOffset], { stroke: color, width: 1.2 }));
  }
  const arcs = [
    circle(560, { fill: null, stroke: accent, width: 1.3, dash: [10, 14] }).opacity(0.28),
    circle(820, { fill: null, stroke: '#5573b8', width: 1.1, dash: [6, 18] }).opacity(0.22),
  ];
  const stars = [];
  for (let i = 0; i < 95; i++) {
    const sx = Math.sin((i + seed * 19) * 127.1 + 3.7) * 43758.5453;
    const sy = Math.sin((i + seed * 31) * 269.5 + 9.1) * 19642.349;
    const x = -930 + (sx - Math.floor(sx)) * 1860;
    const y = -510 + (sy - Math.floor(sy)) * 1020;
    const r = 0.8 + (i % 4) * 0.35;
    const op = 0.16 + (i % 5) * 0.05;
    stars.push(
      dot(r, i % 9 === 0 ? accent : '#8ea4d2')
        .opacity(op)
        .at(x, y),
    );
  }
  return markDecor(
    group(...lines, ...arcs, ...stars)
      .opacity(opacity)
      .zIndex(-60),
  );
}

/** Soft glowing translucent instrument plate (no heavy opaque card walls). */
export function glassPlate(
  cx,
  cy,
  w,
  h,
  { stroke = COSMOS.cyan, fill = '#10182ccc', radius = 14, strokeWidth = 2.2, glow = 6 } = {},
) {
  const box = rect(w, h, { fill, stroke, width: strokeWidth, radius }).at(cx, cy);
  if (glow > 0) box.glow(glow, stroke);
  return box;
}

/** Glowing connector wire with an animated photon packet riding along it. */
export function photonWire(pts, progress, { color = COSMOS.cyan, width = 3.2, glow = 8 } = {}) {
  const path = polyPath(pts);
  const segs = [];
  let totalLen = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    segs.push({ a: pts[i], b: pts[i + 1], len });
    totalLen += len;
  }
  const u = ((progress % 1) + 1) % 1;
  let dist = u * totalLen;
  let px = pts[0][0];
  let py = pts[0][1];
  for (const seg of segs) {
    if (dist <= seg.len || seg === segs.at(-1)) {
      const f = seg.len > 0 ? Math.min(1, Math.max(0, dist / seg.len)) : 0;
      px = seg.a[0] + (seg.b[0] - seg.a[0]) * f;
      py = seg.a[1] + (seg.b[1] - seg.a[1]) * f;
      break;
    }
    dist -= seg.len;
  }
  return group(
    new Node(path).stroke(color, width, 0.72).glow(glow, color),
    dot(6.5, '#ffffff').at(px, py).glow(14, color),
  );
}

/**
 * Smooth cinematic 3D elevation for the 100:1 ill-conditioned valley L(a, b) = 50a^2 + 0.5b^2.
 * Uses smooth log compression so both the steep canyon walls along `a` and the long shallow floor
 * along `b` remain dramatic and readable in 3D perspective without clipping flat.
 */
export function valleyZ(a, b, { scale = 0.62, maxZ = 2.75 } = {}) {
  const L = loss([a, b]);
  return Math.min(maxZ, scale * Math.log1p(L * 0.42));
}

/** Map 2D world coordinates (a, b) onto a centered 3D surface domain (x in [-2.6, 2.6], y in [-2.4, 2.4]). */
export function valley3dPoint(a, b, { aScale = 1.6, bScale = 1.9, zLift = 0.08 } = {}) {
  return [a * aScale, b * bScale, valleyZ(a, b) + zLift];
}

/**
 * Sample a continuous interpolated position along a simulated optimizer run `run.points`
 * where `progress` in [0, 1] maps smoothly from `fromStep` to `toStep`.
 */
export function sampleRun(run, progress, fromStep = 0, toStep = run.records.length) {
  const pos = fromStep + clamp(progress) * (toStep - fromStep);
  const completed = Math.min(toStep, Math.floor(pos + 1e-9));
  const frac = completed >= toStep ? 0 : pos - completed;
  const cur = vector(run.points[completed]);
  const next = completed < toStep ? vector(run.points[completed + 1]) : cur;
  const interp = [cur[0] + (next[0] - cur[0]) * frac, cur[1] + (next[1] - cur[1]) * frac];
  return {
    completed,
    frac,
    current: cur,
    interp,
    currentLoss: loss(cur),
    interpLoss: loss(interp),
    pending: completed < toStep ? run.records[completed] : null,
  };
}

/**
 * Luminous 2D elliptical contour bowl for L(a, b) = 50a^2 + 0.5b^2.
 * Returns { node, map(a, b) } so scenes can overlay glowing trails, gradient arrows, and markers.
 */
export function contourBowl({
  cx = -240,
  cy = 20,
  width = 1040,
  height = 640,
  aDomain = [-1.25, 1.25],
  bDomain = [-0.25, 1.25],
  levels = [0.5, 2, 8, 32, 50.5, 128],
  aTicks = [-1, 0, 1],
  bTicks = [0, 0.5, 1],
  accent = COSMOS.cyan,
} = {}) {
  const left = cx - width / 2;
  const bottom = cy + height / 2;
  const mapA = (a) => left + ((a - aDomain[0]) / (aDomain[1] - aDomain[0])) * width;
  const mapB = (b) => bottom - ((b - bDomain[0]) / (bDomain[1] - bDomain[0])) * height;
  const map = (a, b) => [mapA(a), mapB(b)];

  const parts = [
    rect(width, height, {
      fill: '#0a0f1f88',
      stroke: '#2c3d66',
      width: 1.8,
      radius: 14,
    }).at(cx, cy),
  ];

  // Zero crosshairs
  if (aDomain[0] <= 0 && aDomain[1] >= 0) {
    const x0 = mapA(0);
    parts.push(
      line([x0, cy - height / 2], [x0, cy + height / 2], {
        stroke: '#3c5080',
        width: 1.6,
        dash: [6, 8],
      }),
    );
  }
  if (bDomain[0] <= 0 && bDomain[1] >= 0) {
    const y0 = mapB(0);
    parts.push(
      line([cx - width / 2, y0], [cx + width / 2, y0], {
        stroke: '#3c5080',
        width: 1.6,
        dash: [6, 8],
      }),
    );
  }

  // Elliptical level sets of 50a^2 + 0.5b^2 = L, clipped cleanly inside the box
  const inBox = (a, b) => a >= aDomain[0] && a <= aDomain[1] && b >= bDomain[0] && b <= bDomain[1];
  for (const L of levels) {
    const ra = Math.sqrt(L / 50);
    const rb = Math.sqrt(2 * L);
    let seg = [];
    const flush = () => {
      if (seg.length >= 2) {
        parts.push(new Node(polyPath(seg)).stroke('#385386', 1.9, L === 50.5 ? 0.8 : 0.55));
      }
      seg = [];
    };
    const N = 160;
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * Math.PI * 2;
      const a = ra * Math.cos(th);
      const b = rb * Math.sin(th);
      if (inBox(a, b)) seg.push(map(a, b));
      else flush();
    }
    flush();
  }

  // Axis ticks & >= 26px labels
  for (const t of aTicks) {
    if (t < aDomain[0] || t > aDomain[1]) continue;
    const tx = mapA(t);
    parts.push(
      line([tx, bottom], [tx, bottom + 10], { stroke: '#7b8eb8', width: 2.2 }),
      txt(num(t, 1), tx, bottom + 36, 26, COSMOS.muted, 'mono'),
    );
  }
  for (const t of bTicks) {
    if (t < bDomain[0] || t > bDomain[1]) continue;
    const ty = mapB(t);
    parts.push(
      line([left - 10, ty], [left, ty], { stroke: '#7b8eb8', width: 2.2 }),
      txt(num(t, 1), left - 20, ty, 26, COSMOS.muted, 'mono', 'right'),
    );
  }
  parts.push(
    txt('a  (steep error)', cx, bottom + 78, 26, accent, 'sans'),
    txt('b  (shallow)', left - 18, cy - height / 2 - 28, 26, COSMOS.emerald, 'sans', 'left'),
  );

  // Target origin beacon
  const [zx, zy] = map(0, 0);
  parts.push(
    circle(12, { fill: null, stroke: COSMOS.gold, width: 2.4 }).at(zx, zy).glow(8, COSMOS.gold),
    dot(4.5, '#ffffff').at(zx, zy),
  );

  return { node: group(...parts), map, mapA, mapB };
}

/**
 * Luminous 2D coordinate plot for curves (loss, norm, schedule, response curves).
 * Returns { node, map(x, y), mapX(x), mapY(y) }.
 */
export function luminousPlot({
  cx = -160,
  cy = 20,
  width = 1080,
  height = 500,
  xDomain = [0, 40],
  yDomain = [0, 55],
  xTicks = [0, 10, 20, 30, 40],
  yTicks = [0, 25, 50],
  xLabel = '',
  yLabel = '',
  xFmt = (v) => num(v, 1),
  yFmt = (v) => num(v, 1),
  accent = COSMOS.cyan,
} = {}) {
  const left = cx - width / 2;
  const right = cx + width / 2;
  const top = cy - height / 2;
  const bottom = cy + height / 2;
  const mapX = (x) => left + ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * width;
  const mapY = (y) => bottom - ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * height;
  const map = (x, y) => [mapX(x), mapY(y)];

  const parts = [
    rect(width, height, {
      fill: '#0a0f1f80',
      stroke: '#2c3d66',
      width: 1.8,
      radius: 12,
    }).at(cx, cy),
  ];

  // Subtle interior grid lines
  for (const tx of xTicks) {
    const px = mapX(tx);
    parts.push(
      line([px, top], [px, bottom], { stroke: '#1f2c4a', width: 1.2 }),
      line([px, bottom], [px, bottom + 10], { stroke: '#7b8eb8', width: 2.2 }),
      txt(xFmt(tx), px, bottom + 36, 26, COSMOS.muted, 'mono'),
    );
  }
  for (const ty of yTicks) {
    const py = mapY(ty);
    parts.push(
      line([left, py], [right, py], { stroke: '#1f2c4a', width: 1.2 }),
      line([left - 10, py], [left, py], { stroke: '#7b8eb8', width: 2.2 }),
      txt(yFmt(ty), left - 20, py, 26, COSMOS.muted, 'mono', 'right'),
    );
  }

  // Axis lines
  parts.push(
    line([left, bottom], [right, bottom], { stroke: '#5a6f9c', width: 2.4 }),
    line([left, top], [left, bottom], { stroke: '#5a6f9c', width: 2.4 }),
  );
  if (xLabel) parts.push(txt(xLabel, cx, bottom + 78, 26, COSMOS.muted, 'sans'));
  if (yLabel) parts.push(txt(yLabel, left, top - 28, 26, accent, 'sans', 'left'));

  return { node: group(...parts), map, mapX, mapY };
}

/**
 * Luminous horizontal coordinate/parameter ruler with optional glowing arrow from `start` to `end`.
 */
export function coordRuler({
  cx = 0,
  cy = 0,
  width = 1280,
  domain = [-1.1, 1.1],
  ticks = [-1, 0, 1],
  tickFmt = (v) => num(v, 2),
  start,
  end,
  progress = 1,
  color = COSMOS.cyan,
  label,
  labelRight,
  showZero = true,
  opacity = 1,
} = {}) {
  const x0 = cx - width / 2;
  const mapX = (v) => x0 + ((v - domain[0]) / (domain[1] - domain[0])) * width;
  const parts = [
    line([x0, cy], [x0 + width, cy], { stroke: '#4d6089', width: 3 }),
    line([x0, cy], [x0 + width, cy], { stroke: color, width: 1.2 }).opacity(0.35),
  ];
  for (const t of ticks) {
    if (t < domain[0] - 1e-9 || t > domain[1] + 1e-9) continue;
    const tx = mapX(t);
    const isZero = showZero && Math.abs(t) < 1e-9;
    parts.push(
      line([tx, cy - (isZero ? 18 : 10)], [tx, cy + (isZero ? 18 : 10)], {
        stroke: isZero ? COSMOS.gold : '#7b8eb8',
        width: isZero ? 3 : 2.2,
      }),
      txt(tickFmt(t), tx, cy + 40, 26, isZero ? COSMOS.gold : COSMOS.muted, 'mono'),
    );
  }
  if (label) parts.push(txt(label, x0, cy - 42, 28, color, 'sans', 'left'));
  if (labelRight) parts.push(txt(labelRight, x0 + width, cy - 42, 28, color, 'mono', 'right'));
  if (start !== undefined && start !== null) {
    const sx = mapX(start);
    parts.push(circle(10, { fill: COSMOS.bg, stroke: COSMOS.ink, width: 3 }).at(sx, cy));
    if (end !== undefined && end !== null && progress > 0.005) {
      const cur = start + (end - start) * clamp(progress);
      const ex = mapX(cur);
      if (Math.abs(ex - sx) > 3) {
        parts.push(
          arrow([sx, cy], [ex, cy], { stroke: color, width: 5.5, tip: 14 }).glow(10, color),
        );
      }
      parts.push(glowDot(ex, cy, { radius: 8.5, color, glow: 12 }), dot(3.5, '#ffffff').at(ex, cy));
    }
  }
  return group(...parts).opacity(opacity);
}

/**
 * Luminous proportional microbatch item-share ribbon for accumulation & fresh-recipe scenes.
 * Smoothly slides the divider from item-proportional share to 50/50 equal-batch share as `equalP` goes 0 -> 1.
 */
export function shareRibbon(
  win,
  {
    cx = 0,
    cy = -60,
    width = 1480,
    height = 146,
    equalP = 0,
    grouped = false,
    showGradients = false,
    showFractions = false,
    showMeans = false,
  } = {},
) {
  const x0 = cx - width / 2;
  const n = win.targets.length;
  const [leftCount, rightCount] = win.counts;
  const firstShare = leftCount / n + (0.5 - leftCount / n) * clamp(equalP);
  const divideX = x0 + width * firstShare;
  const parts = [];

  if (grouped) {
    const spans = [
      [x0, divideX, 0],
      [divideX, x0 + width, 1],
    ];
    for (const [from, to, gi] of spans) {
      const mid = (from + to) / 2;
      const count = win.counts[gi];
      const col = gi === 0 ? COSMOS.cyan : COSMOS.gold;
      parts.push(
        line([from + 8, cy - height / 2 - 22], [to - 8, cy - height / 2 - 22], {
          stroke: col,
          width: 2.8,
        }),
        line([from + 8, cy - height / 2 - 22], [from + 8, cy - height / 2 - 10], {
          stroke: col,
          width: 2.8,
        }),
        line([to - 8, cy - height / 2 - 22], [to - 8, cy - height / 2 - 10], {
          stroke: col,
          width: 2.8,
        }),
      );
      const shareStr =
        equalP > 0.96 ? ' · 1/2' : equalP < 0.04 && showFractions ? ` · ${count}/${n}` : '';
      const batchLabel = `Batch ${gi + 1} (${count} ${count === 1 ? 'item' : 'items'})${showFractions ? shareStr : ''}`;
      parts.push(txt(batchLabel, mid, cy - height / 2 - 52, 28, col, 'sans'));
      if (showMeans) {
        const g = win.means[gi];
        const vStr = Number.isInteger(g)
          ? signed(g, 0)
          : `${signed(Math.round(g * count), 0)}/${count}`;
        parts.push(txt(`Batch mean  ${vStr}`, mid, cy + height / 2 + 44, 28, col, 'mono'));
      }
    }
  }

  let curX = x0;
  for (let i = 0; i < n; i++) {
    const gi = i < leftCount ? 0 : 1;
    const span = width * (gi ? (1 - firstShare) / rightCount : firstShare / leftCount);
    const mid = curX + span / 2;
    const col = grouped && gi ? COSMOS.gold : COSMOS.cyan;
    parts.push(
      rect(span - 8, height, {
        fill: '#10182cdd',
        stroke: col,
        width: 2.8,
        radius: 10,
      })
        .at(mid, cy)
        .glow(6, col),
      txt(`y = ${win.targets[i]}`, mid, cy - 34, 28, COSMOS.ink, 'mono'),
    );
    if (showGradients) {
      parts.push(txt(`g = ${signed(win.gradients[i], 0)}`, mid, cy + 8, 32, col, 'mono'));
    }
    if (showFractions && (equalP < 0.04 || equalP > 0.96)) {
      const denom = equalP > 0.96 ? 2 * win.counts[gi] : n;
      parts.push(txt(`1/${denom}`, mid, cy + 48, 26, COSMOS.muted, 'mono'));
    }
    curX += span;
  }

  return group(...parts);
}

export { decorAura as aura };
