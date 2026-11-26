// Shared cinematic palette, verified invariants, and 3D bit-grid / Hessian error manifolds
// for the 31-scene Quantization stage film.
import { arrow, circle, dot, group, line, rect, seq, surface } from 'vizmatic/stage';
import {
  affineGrid,
  awqError,
  awqReconstruct,
  cachePool,
  calibrationHessian,
  decodeTeachingCodec,
  deferredBlockUpdate,
  freshQuantizationBudget,
  gptqFrame,
  groupedReduction,
  introLayer,
  nominalRoofline,
  precisionExperiment,
  quantizationMemory,
  roundEven,
  squaredOutputError,
  teachingCodec,
  trailingPlacement,
} from '../../films/quantization/arithmetic.mjs';
import {
  AWQ_INPUTS,
  CALIBRATION,
  HELD_OUT,
  QUANT_WEIGHTS,
} from '../../films/quantization/fixtures.mjs';
import { validateModel } from '../../films/quantization/model.mjs';
import {
  requestedDock,
  routeReplies,
  routingTrial,
} from '../../films/quantization/routing-example.mjs';
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
  AWQ_INPUTS,
  CALIBRATION,
  COSMOS,
  HELD_OUT,
  QUANT_WEIGHTS,
  affineGrid,
  arrow,
  aura,
  awqError,
  awqReconstruct,
  cachePool,
  calibrationHessian,
  cinematic3d,
  circle,
  decodeTeachingCodec,
  deferredBlockUpdate,
  dot,
  freshQuantizationBudget,
  glowDot,
  glowTex,
  gptqFrame,
  group,
  groupedReduction,
  guardedDynamic,
  heroTitle,
  introLayer,
  line,
  nominalRoofline,
  orbitScene,
  precisionExperiment,
  quantizationMemory,
  rect,
  requestedDock,
  roundEven,
  routeReplies,
  routingTrial,
  seq,
  squaredOutputError,
  surface,
  teachingCodec,
  trailingPlacement,
  txt,
  wireframeSlab3d,
};

export const ROLE = Object.freeze({
  grid: COSMOS.cyan,
  weight: COSMOS.blue,
  code: COSMOS.violet,
  err: COSMOS.rose,
  ok: COSMOS.emerald,
  gold: COSMOS.gold,
  amber: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
});

export const INTRO_EX = introLayer(1.5);
export const AFFINE_EX = affineGrid([-2, -1, 0, 0.73, 2, 3]);
export const CODEC_EX = teachingCodec();
export const GROUP_SUM_EX = groupedReduction(1);
export const HESSIAN_EX = calibrationHessian();
export const GPTQ_NEAR = gptqFrame({ nearest: 1 })[0];
export const GPTQ_COMP = gptqFrame({ first: 1, compensation: 1 })[1];
export const GPTQ_FINAL = gptqFrame({ first: 1, compensation: 1, last: 1 })[1];
export const PREC_2 = precisionExperiment(2);
export const PREC_4 = precisionExperiment(4);
export const ROOF_A100 = nominalRoofline('A100');
export const ROOF_H100 = nominalRoofline('H100');
export const POOL_BF16 = cachePool(54, false);
export const POOL_Q4 = cachePool(13.92, false);
export const POOL_Q4_HYB = cachePool(13.92, true);
export const MEM_2G = quantizationMemory(2);
export const MEM_4G = quantizationMemory(4);
export const PLACE_12_5 = trailingPlacement(12, 5);
export const FRESH_4 = freshQuantizationBudget(4);
export const FRESH_3875 = freshQuantizationBudget(3.875);
export const DEFERRED_EX = deferredBlockUpdate(1);

export function verifyQuantizationInvariants() {
  verifyInvariant(validateModel() === true, 'quantization film model validates');
  verifyInvariant(INTRO_EX.code === 7, '0.73 rounds to code 7');
  verifyApprox(INTRO_EX.reconstructed, 1.05, 1e-12, '0.7 * 1.5 = 1.05');
  verifyInvariant(AFFINE_EX.zero === 5, 'affine zero-point = 5');
  verifyApprox(GROUP_SUM_EX.total, 5.5, 1e-12, 'grouped sum = 5.5');
  verifyApprox(GPTQ_NEAR.error, 0.5402, 1e-12, 'nearest squared error = 0.5402');
  verifyApprox(GPTQ_COMP.weights[1], 1.51, 1e-12, 'compensated w2 = 1.51');
  verifyApprox(GPTQ_FINAL.error, 0.5002, 1e-12, 'GPTQ final error = 0.5002');
  verifyApprox(awqError(1), 0.016734693877551, 1e-12, 'AWQ s=1 error');
  verifyApprox(awqError(8), 0.003265306122449, 1e-12, 'AWQ s=8 error');
  verifyInvariant(
    POOL_BF16.users === 53 && POOL_Q4.users === 173 && POOL_Q4_HYB.users === 119,
    'cache pools',
  );
  verifyInvariant(
    PLACE_12_5.gpuBlocks.join(',') === '8,9,10,11',
    'trailing placement 12 blocks 5 slots',
  );
  verifyApprox(FRESH_4.totalA, 7.9375, 1e-12, 'fresh total A = 7.9375 GB');
  verifyApprox(FRESH_4.totalB, 8.125, 1e-12, 'fresh total B = 8.125 GB');
  verifyApprox(FRESH_3875.totalB, 8.0, 1e-12, 'fresh total B at 3.875 GB cache = 8.0 GB');
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
  { w = 180, h = 66, color = ROLE.grid, fill = '#10182d', size = 28, glow = 8, opacity = 1 } = {},
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

/** Orbiting 3D bit-grid snapping manifold: morphs smooth weight wave into discrete quantized terraces. */
export function buildQuantGrid3d(snapVal, { x = 445, y = 25 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 14.6,
    unit: 112,
    focus: [0, 0, 0.35],
  }).at(x, y);

  const surf = surface(
    (px, py) => {
      const smooth = 0.85 + 0.52 * Math.sin(px * 0.95) * Math.cos(py * 0.85) + 0.22 * (px * 0.25);
      const step = 0.32;
      const quantized = Math.round(smooth / step) * step;
      const t = Math.max(0, Math.min(1, snapVal.value));
      return smooth * (1 - t) + quantized * t;
    },
    {
      x: [-2.4, 2.4],
      y: [-2.4, 2.4],
      resolution: [26, 26],
      colors: ['#101c3a', '#1d4d7c', '#5ce1e6', '#ffd166', '#ff6b8b'],
      opacity: 0.9,
      mesh: '#7ce8ff',
      meshOpacity: 0.24,
      meshWidth: 0.75,
      animate: true,
    },
  );

  const clampCage = wireframeSlab3d([0, 0, 1.48], 2.2, 2.2, 0.04, {
    color: COSMOS.gold,
    width: 2.4,
    glow: 9,
  });

  view.add(surf, ...clampCage);
  return view;
}

/** Orbiting 3D anisotropic calibration-error Hessian valley E(w1, w2) = (5dw1+4dw2)^2 + (dw1+dw2)^2. */
export function buildHessianBowl3d(shiftVal, { x = 450, y = 30 } = {}) {
  const view = cinematic3d({
    theta: -0.85,
    phi: 1.0,
    distance: 14.8,
    unit: 110,
    focus: [0, 0, 0.5],
  }).at(x, y);

  const surf = surface(
    (px, py) => {
      const dw1 = px * 0.32;
      const dw2 = py * 0.42;
      const e = (5 * dw1 + 4 * dw2) ** 2 + (dw1 + dw2) ** 2;
      const focusBoost = 1 + 0.12 * shiftVal.value;
      return Math.min(2.3, Math.log1p(e * focusBoost) * 0.58);
    },
    {
      x: [-2.3, 2.3],
      y: [-2.3, 2.3],
      resolution: [24, 24],
      colors: ['#0c2b26', '#165a6e', '#5ce1e6', '#ffd166', '#ff6b8b'],
      opacity: 0.9,
      mesh: '#7ce8ff',
      meshOpacity: 0.22,
      meshWidth: 0.72,
      animate: true,
    },
  );

  const valleyFrame = wireframeSlab3d([0, 0, 0.28], 2.1, 0.65, 0.05, {
    color: COSMOS.emerald,
    width: 2.4,
    glow: 9,
  });

  view.add(surf, ...valleyFrame);
  return view;
}
