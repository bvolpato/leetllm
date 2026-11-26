// Shared cinematic visual primitives, verified math model, and timing helpers for `training-loop`.
// All numerical values derive directly from videos/films/training-loop/ and are asserted at load time.
import {
  Node,
  circle,
  dot,
  group,
  line,
  linear,
  linearGradient,
  polyPath,
  rect,
} from 'vizmatic/stage';
import { stableSoftmax } from 'vizmatic';
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
  morphEquation,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';
import {
  epochMean,
  loopAmpOrder,
  loopClip,
  loopMicrobatch,
  loopMomentum,
} from '../../films/training-loop/arithmetic.mjs';
import { checkpointSnapshot, heldOutUpdate } from '../../films/training-loop/construction.mjs';
import {
  FEATURES,
  LABELS,
  LR,
  fitInputs,
  fitTargets,
  measuredValidation,
} from '../../films/training-loop/fixtures.mjs';
import { LOOP_BIGRAM, fitHistory, oneTrainingStep } from '../../films/training-loop/model.mjs';
import { scoreTicket } from '../../films/training-loop/route-ruler.mjs';

export {
  CINEMA_FRAME,
  COSMOS,
  FEATURES,
  LABELS,
  LOOP_BIGRAM,
  LR,
  aura,
  checkpointSnapshot,
  cinematic3d,
  epochMean,
  fitHistory,
  fitInputs,
  fitTargets,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heldOutUpdate,
  heroTitle,
  loopAmpOrder,
  loopClip,
  loopMicrobatch,
  loopMomentum,
  measuredValidation,
  metricReadout,
  morphEquation,
  oneTrainingStep,
  orbitScene,
  rule,
  scoreTicket,
  stableSoftmax,
  txt,
};

/** One semantic color role per concept across all 26 scenes of Training Loop. */
export const ROLE = Object.freeze({
  standard: COSMOS.blue,
  escalate: COSMOS.emerald,
  forward: COSMOS.cyan,
  grad: COSMOS.gold,
  stale: COSMOS.rose,
  momentum: COSMOS.violet,
  warn: COSMOS.amber,
});

/** Precomputed canonical fixtures shared across scenes. */
export const STEP_ONE = Object.freeze(oneTrainingStep());

export const TENSOR_ROWS = Object.freeze([
  { id: 101, urgency: -2.0, severity: -1.2, label: 0, route: 'standard' },
  { id: 102, urgency: -1.3, severity: -0.8, label: 0, route: 'standard' },
  { id: 103, urgency: -0.8, severity: -1.4, label: 0, route: 'standard' },
  { id: 104, urgency: 0.9, severity: 1.1, label: 1, route: 'escalate' },
  { id: 105, urgency: 1.4, severity: 0.8, label: 1, route: 'escalate' },
  { id: 106, urgency: 1.8, severity: 1.6, label: 1, route: 'escalate' },
]);

export const SCORE_FIXTURE = Object.freeze(
  (() => {
    const raw = [
      [2.0, -1.0],
      [-0.5, 1.5],
    ];
    const targets = [0, 1];
    const probs = raw.map((r) => stableSoftmax(r));
    const losses = probs.map((p, i) => -Math.log(p[targets[i]]));
    const meanLoss = (losses[0] + losses[1]) / 2;
    return { raw, targets, probs, losses, meanLoss };
  })(),
);

export const DROPOUT_FIXTURE = Object.freeze({
  input: [1, 2, 3, 4],
  mask: [1, 0, 1, 0],
  trainOut: [2, 0, 6, 0],
  evalOut: [1, 2, 3, 4],
});

export const BIGRAM_TOY = Object.freeze(
  (() => {
    const obs = ['a', 'a', 'a', 'b'];
    const pA = 3 / 4;
    const pB = 1 / 4;
    const floor = -(pA * Math.log(pA) + pB * Math.log(pB));
    return { obs, pA, pB, floor };
  })(),
);

export const AMP_BOUNDS = Object.freeze({
  fp16MinSubnormal: 2 ** -24,
  fp16MinNormal: 2 ** -14,
  sampleValue: 1e-5,
  initScale: 65536,
  growthInterval: 2000,
});

export const HELD_OUT_STALE = Object.freeze(heldOutUpdate(false));
export const HELD_OUT_CLEARED = Object.freeze(heldOutUpdate(true));

/** Linear interpolation helper. */
export const mix = (a, b, t) => a + (b - a) * t;

/** Clamp t into [0, 1]. */
export const clamp01 = (t) => Math.max(0, Math.min(1, t));

/** Signed numeric formatter using Unicode minus. */
export function signed(value, digits = 2) {
  if (Math.abs(value) < 1e-9) return digits === 0 ? '0' : '0.' + '0'.repeat(digits);
  return (value < 0 ? '\u2212' : '+') + Math.abs(value).toFixed(digits);
}

/** Non-overlapping two-phase crossfade helpers (old reaches 0 at 0.42; new starts at 0.58). */
export const fadeOut = (t) => clamp01(1 - t / 0.42);
export const fadeIn = (t) => clamp01((t - 0.58) / 0.42);

/** Clamp duration so an animation strictly finishes before `clock.end - margin`. */
export function safeDur(clock, startTime, desired, margin = 0.34) {
  const avail = clock.end - startTime - margin;
  return Math.max(0.08, Math.min(desired, avail));
}

/** Schedule a Value transition cleanly on or after a declared cue without overrunning. */
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

/** Continuous living scene-wide drift [0 -> target] bounded strictly inside the scene. */
export function livingDrift(s, c, val, target = 1, { startOffset = 0.05, endMargin = 0.45 } = {}) {
  const span = c.end - c.start;
  const duration = Math.max(0.3, span - startOffset - endMargin);
  c.at(startOffset, () => s.play(val.to(target, { duration, ease: linear })));
  return duration;
}

/** Mark a node (and its children) as non-occluding backdrop decoration. */
export function markDecor(node) {
  if (!node) return node;
  if (!node.data) node.data = {};
  node.data.decoration = true;
  if (Array.isArray(node.children)) {
    for (const child of node.children) markDecor(child);
  }
  return node;
}

/** Decorative aura wrapper so text over ambient glow never trips text_crowded. */
export function decorAura(x, y, radius, innerHex, midHex = '#07091000') {
  return markDecor(aura(x, y, radius, innerHex, midHex));
}

/** Subtle deep-space lattice marked as non-occluding decoration. */
export function cinemaGrid({
  color = '#24345a',
  accent = COSMOS.cyan,
  opacity = 0.46,
  seed = 1,
} = {}) {
  const lines = [];
  for (let x = -800; x <= 800; x += 160) {
    lines.push(line([x, -460], [x, 460], { stroke: color, width: 1.1 }));
  }
  for (let y = -400; y <= 400; y += 160) {
    lines.push(line([-880, y], [880, y], { stroke: color, width: 1.1 }));
  }
  const arcs = [
    circle(520, { fill: null, stroke: accent, width: 1.2, dash: [10, 14] }).opacity(0.22),
    circle(780, { fill: null, stroke: '#4d6cb3', width: 1, dash: [6, 18] }).opacity(0.16),
  ];
  const stars = [];
  for (let i = 0; i < 65; i++) {
    const sx = Math.sin((i + seed * 17) * 127.1 + 3.7) * 43758.5453;
    const sy = Math.sin((i + seed * 29) * 269.5 + 9.1) * 19642.349;
    const x = -930 + (sx - Math.floor(sx)) * 1860;
    const y = -510 + (sy - Math.floor(sy)) * 1020;
    stars.push(
      dot(0.8 + (i % 4) * 0.3, i % 9 === 0 ? accent : '#8ea4d2')
        .opacity(0.15 + (i % 5) * 0.05)
        .at(x, y),
    );
  }
  return markDecor(
    group(...lines, ...arcs, ...stars)
      .opacity(opacity)
      .zIndex(-60),
  );
}

/** Glowing proportional bar anchored from its left edge at (x, y). */
export function glowBar(x, y, w, h, color, { glow = 8, radius = 8, opacity = 1 } = {}) {
  const safeW = Math.max(4, w);
  const bar = rect(safeW, h, { fill: color, stroke: null, radius })
    .at(x + safeW / 2, y)
    .opacity(opacity);
  if (glow > 0) bar.glow(glow, color);
  return bar;
}

/** Subtle glowing quantitative track (pure scale groove, not a prose card). */
export function scaleTrack(x, y, w, h, { stroke = '#334670', fill = '#0f162a', radius = 10 } = {}) {
  return rect(w, h, { fill, stroke, width: 1.6, radius }).at(x + w / 2, y);
}

/** Glowing numeric tensor cell (rounded tile for matrix/vector math entries). */
export function tensorCell(
  cx,
  cy,
  w,
  h,
  value,
  color,
  { size = 34, glow = 6, fill = '#10182d', opacity = 1 } = {},
) {
  const frame = rect(w, h, { fill, stroke: color, width: 2.2, radius: 10 }).at(cx, cy);
  if (glow > 0) frame.glow(glow, color);
  const label = txt(String(value), cx, cy, size, color, 'mono');
  return group(frame, label).opacity(opacity);
}

/** Glowing smooth curve from [x, y] points using gradient polyPath. */
export function neonCurve(pts, colors, { width = 4, glow = 10, opacity = 0.96 } = {}) {
  if (pts.length < 2) return group();
  const path = polyPath(pts);
  const paint =
    Array.isArray(colors) && colors.length >= 2
      ? linearGradient(pts[0], pts.at(-1), colors)
      : colors;
  const glowCol = Array.isArray(colors) ? colors.at(-1) : colors;
  const outer = new Node(path)
    .stroke(paint, width, opacity)
    .glow(glow, glowCol)
    .set('blend', 'screen');
  const core = new Node(path).stroke('#ffffff', 1.2, 0.4).set('blend', 'screen');
  return group(outer, core);
}

/** Shared fixed-scale Route Ruler (-0.6 to +0.6) used in intro and fresh-stale-gradient. */
export function routeRulerNodes(y, marks = [], { xCenter = 0, halfSpan = 660 } = {}) {
  const xOf = (gap) => xCenter + (gap / 0.6) * halfSpan;
  const nodes = [
    txt('ESCALATION SCORE \u2212 STANDARD SCORE', xCenter, y - 108, 26, COSMOS.muted, 'mono'),
    line([xOf(-0.6), y], [xOf(0), y], { stroke: ROLE.standard, width: 6 }).glow(8, ROLE.standard),
    line([xOf(0), y], [xOf(0.6), y], { stroke: ROLE.escalate, width: 6 }).glow(8, ROLE.escalate),
  ];
  for (let tick = -6; tick <= 6; tick++) {
    const val = tick / 10;
    const x = xOf(val);
    const major = tick % 2 === 0;
    nodes.push(line([x, y + 6], [x, y + (major ? 22 : 13)], { stroke: COSMOS.dim, width: 2 }));
    if (major) {
      nodes.push(txt(signed(val, 1), x, y + 52, 26, COSMOS.muted, 'mono'));
    }
  }
  nodes.push(
    txt('Standard queue', xOf(-0.42), y + 104, 28, ROLE.standard, 'sans'),
    txt('Tie -> standard', xOf(0), y + 104, 26, COSMOS.muted, 'mono'),
    txt('Specialist escalation', xOf(0.42), y + 104, 28, ROLE.escalate, 'sans'),
  );
  for (const mark of marks) {
    const mx = xOf(mark.gap);
    const col = mark.color ?? ROLE.grad;
    const labelY = mark.labelY ?? y - 54;
    nodes.push(line([mx, y - 34], [mx, y - 12], { stroke: col, width: 3 }));
    if (mark.hollow) {
      nodes.push(circle(12, { fill: COSMOS.bg, stroke: col, width: 3 }).at(mx, y));
    } else {
      nodes.push(glowDot(mx, y, { radius: 13, color: col, glow: 14 }));
    }
    if (mark.label) {
      nodes.push(txt(mark.label, mx, labelY, 28, col, 'mono'));
    }
  }
  return group(...nodes);
}

/** Build-time mathematical verification of every spoken number across all 26 scenes. */
export function verifyTrainingLoopInvariants() {
  // 1. One training step (intro, phases, transfer)
  const step = oneTrainingStep();
  verifyApprox(step.loss, Math.log(2), 1e-12, 'zero-weight initial CE loss ln(2)');
  verifyApprox(step.gradient[0][0], 0.5, 1e-12, 'dW standard urgency +0.5');
  verifyApprox(step.gradient[1][0], -0.5, 1e-12, 'dW escalate urgency -0.5');
  verifyApprox(step.updated[0][0], -0.1, 1e-12, 'W1 standard urgency -0.1');
  verifyApprox(step.updated[1][0], 0.1, 1e-12, 'W1 escalate urgency +0.1');
  const rescoredA = scoreTicket(step.updated, FEATURES[0]);
  verifyApprox(rescoredA.logits[0], -0.2, 1e-12, 'ticket A rescored standard -0.2');
  verifyApprox(rescoredA.logits[1], 0.2, 1e-12, 'ticket A rescored escalate +0.2');
  verifyApprox(rescoredA.gap, 0.4, 1e-12, 'ticket A score gap +0.4');

  // 2. Scores scene ([2, -1], [-0.5, 1.5])
  verifyApprox(SCORE_FIXTURE.losses[0], 0.04858735, 1e-5, 'ticket A loss');
  verifyApprox(SCORE_FIXTURE.losses[1], 0.12692801, 1e-5, 'ticket B loss');
  verifyApprox(SCORE_FIXTURE.meanLoss, 0.08775768, 1e-5, 'batch mean loss 0.0878');

  // 3. None vs zero gradient with momentum
  const momNone = loopMomentum(1, null);
  verifyApprox(momNone.weight, 0.9, 1e-12, 'grad=None skips step -> 0.9');
  verifyApprox(momNone.buffer, 1.0, 1e-12, 'grad=None keeps buffer 1.0');
  const momZero = loopMomentum(1, 0);
  verifyApprox(momZero.buffer, 0.9, 1e-12, 'grad=0 decays buffer to 0.9');
  verifyApprox(momZero.weight, 0.81, 1e-12, 'grad=0 moves weight to 0.81');

  // 4. Microbatch denominators
  const microRow = loopMicrobatch(false);
  const microEq = loopMicrobatch(true);
  verifyApprox(microRow.gradient[0], 2 / 3, 1e-12, 'row-weighted urgency grad 2/3');
  verifyApprox(microRow.gradient[1], 0.5, 1e-12, 'row-weighted severity grad 1/2');
  verifyApprox(microEq.gradient[0], 0.75, 1e-12, 'equal-chunk urgency grad 3/4');
  verifyApprox(microEq.gradient[1], 0.5, 1e-12, 'equal-chunk severity grad 1/2');

  // 5. Epoch mean batching
  verifyApprox(epochMean([0.2, 0.5], [4, 2]), 0.3, 1e-12, 'row-weighted epoch mean 0.30');
  verifyApprox((0.2 + 0.5) / 2, 0.35, 1e-12, 'unweighted batch mean 0.35');

  // 6. Fit-batch seeded 2-layer classifier (120 updates)
  verifyInvariant(fitHistory.length === 121, 'fitHistory has 121 snapshots');
  verifyApprox(fitHistory[0].loss, 0.6521, 1e-4, 'fitHistory[0] loss 0.6521');
  verifyApprox(fitHistory[120].loss, 0.0056, 1e-4, 'fitHistory[120] loss 0.0056');
  verifyInvariant(fitHistory[120].correct === 8, 'fitHistory[120] all 8 correct');

  // 7. Validation & checkpoint snapshot aliasing
  verifyInvariant(measuredValidation.bestEpoch === 60, 'validation best epoch 60');
  verifyApprox(measuredValidation.loss, 0.0118, 1e-6, 'validation best loss 0.0118');
  const snap = checkpointSnapshot(1);
  verifyInvariant(snap.live === snap.plain, 'plain state_dict aliases live');
  verifyInvariant(snap.live !== snap.copied, 'deepcopy isolates checkpoint');
  verifyApprox(snap.copied[0][0], 0, 1e-12, 'copied checkpoint stays at 0');

  // 8. Resumption momentum fork (w=0.9, g=-1, beta=0.9, lr=0.1)
  const resumed = loopMomentum(1, -1, 0.9, 0.1, 0.9);
  const fresh = loopMomentum(0, -1, 0.9, 0.1, 0.9);
  verifyApprox(resumed.buffer, -0.1, 1e-12, 'restored momentum buffer -0.1');
  verifyApprox(resumed.weight, 0.91, 1e-12, 'restored next weight 0.91');
  verifyApprox(fresh.buffer, -1.0, 1e-12, 'fresh momentum buffer -1.0');
  verifyApprox(fresh.weight, 1.0, 1e-12, 'fresh next weight 1.00');

  // 9. Global clipping & AMP scale-and-step ordering
  const clipped = loopClip([6, 8], 5);
  verifyApprox(clipped.norm, 10, 1e-12, 'clip original norm 10');
  verifyApprox(clipped.gradient[0], 3, 1e-12, 'clipped g0 = 3');
  verifyApprox(clipped.gradient[1], 4, 1e-12, 'clipped g1 = 4');
  verifyApprox(clipped.storedNorm, 5, 1e-12, 'clipped stored norm 5');
  const amp = loopAmpOrder();
  verifyApprox(amp.wrongNorm, 0.25, 1e-12, 'clip-before-unscale norm 0.25');
  verifyApprox(amp.correctNorm, 2.0, 1e-12, 'unscale-before-clip norm 2.0');

  // 10. FP16 bounds
  verifyApprox(AMP_BOUNDS.fp16MinNormal, 6.1035e-5, 1e-7, 'fp16 min normal ~6.1e-5');
  verifyApprox(AMP_BOUNDS.fp16MinSubnormal, 5.9605e-8, 1e-10, 'fp16 min subnormal ~5.96e-8');

  // 11. Bigram model, entropy floor, and validation selection
  verifyApprox(Math.log(21), 3.0445224, 1e-4, 'ln(21) ~ 3.045');
  verifyApprox(Math.log(16), 2.7725887, 1e-4, 'ln(16) ~ 2.773');
  verifyApprox(BIGRAM_TOY.floor, 0.5623351, 1e-4, '3/4, 1/4 entropy floor ~ 0.562');
  verifyInvariant(LOOP_BIGRAM.trainPairs === 108, '108 bigram train pairs');
  verifyInvariant(LOOP_BIGRAM.validationPairs === 75, '75 bigram validation pairs');
  verifyInvariant(LOOP_BIGRAM.unseen === 24, '24 unseen validation pairs');
  verifyInvariant(LOOP_BIGRAM.bestStep === 111, 'best bigram step 111');
  verifyApprox(LOOP_BIGRAM.floor, 1.015015, 1e-5, '108-pair floor 1.015');
  verifyApprox(LOOP_BIGRAM.bestLoss, 2.105, 1e-3, 'best val loss 2.105');
  verifyApprox(LOOP_BIGRAM.history[1000].train, 1.033, 1e-3, 'step 1000 train loss 1.033');
  verifyApprox(LOOP_BIGRAM.history[1000].validation, 2.392, 1e-3, 'step 1000 val loss 2.392');

  // 12. Fresh vs stale held-out gradient replay
  verifyApprox(HELD_OUT_STALE.gap, -0.5, 1e-12, 'stale gap -0.50');
  verifyApprox(HELD_OUT_CLEARED.gap, 0.5, 1e-12, 'cleared gap +0.50');
  verifyApprox(HELD_OUT_STALE.probabilities[1], 0.37754067, 1e-6, 'stale P(escalate) ~ 37.8%');
  verifyApprox(HELD_OUT_CLEARED.probabilities[1], 0.62245933, 1e-6, 'cleared P(escalate) ~ 62.2%');
}
