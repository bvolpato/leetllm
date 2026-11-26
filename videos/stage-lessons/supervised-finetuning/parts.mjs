// Shared math models, invariants, color semantics, and 3D/vector cinema helpers for supervised-finetuning.
import {
  Node,
  arrow,
  circle,
  curve3d,
  dot,
  gridPlane3d,
  group,
  line,
  line3d,
  linear,
  linearGradient,
  parametricSurface,
  points3d,
  polyPath,
  radialGradient,
  rect,
  surface,
} from 'vizmatic/stage';
import {
  bounded,
  packedAttention,
  sftExposure,
  targetLoss,
} from '../../films/supervised-finetuning/arithmetic.mjs';
import {
  MASK,
  PACKED_TOKENS,
  REPLY_PROBS,
  SFT_CHECKPOINTS,
  TOKENS,
} from '../../films/supervised-finetuning/fixtures.mjs';
import {
  lossTrace,
  maskSnapshot,
  packingImplementationState,
  packingSnapshot,
  paddingLabels,
  sftBoundaryRepair,
  sftCheckpointGate,
  sftResume,
  validateModel,
} from '../../films/supervised-finetuning/model.mjs';
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
  morphEquation,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

// Precomputed model constants derived directly from videos/films/supervised-finetuning/
export const LOSS_FULL = lossTrace(1, 1);
export const LOSS_CLIPPED = lossTrace(3, 1);

export const PAD_TOKENS = Object.freeze(['ASSIST', 'open', 'ticket', 'END', 'PAD', 'PAD']);
export const PAD_IDS = Object.freeze([43, 7, 8, 2, 2, 2]);
export const PAD_LABELS_BY_POS = Object.freeze(paddingLabels(true));
export const PAD_LABELS_BY_ID = Object.freeze(paddingLabels(false));

export const PACK_SNAP = packingSnapshot(1, 1);
export const PACK_ORIG_VALUES = Object.freeze(packingImplementationState(0, 0).values);
export const PACK_PERTURBED_VALUES = Object.freeze(packingImplementationState(2, 1).values);
export const PACK_ISO_BEFORE = packedAttention(PACK_ORIG_VALUES, 4, true);
export const PACK_ISO_AFTER = packedAttention(PACK_PERTURBED_VALUES, 4, true);
export const PACK_GLOB_BEFORE = packedAttention(PACK_ORIG_VALUES, 4, false);
export const PACK_GLOB_AFTER = packedAttention(PACK_PERTURBED_VALUES, 4, false);

export const PROMPT_LOSSES = Object.freeze([0.03, 0.04, 0.02, 0.05, 0.03]);
export const ANSWER_LOSSES = Object.freeze([2.2, 1.8]);
export const ANSWER_MEAN = ANSWER_LOSSES.reduce((a, b) => a + b, 0) / ANSWER_LOSSES.length;
export const COMBINED_PROMPT_SUM =
  PROMPT_LOSSES.reduce((a, b) => a + b, 0) + ANSWER_LOSSES.reduce((a, b) => a + b, 0);
export const COMBINED_PROMPT_MEAN =
  COMBINED_PROMPT_SUM / (PROMPT_LOSSES.length + ANSWER_LOSSES.length);
export const SCALE_PROMPT_TOKENS = 800;
export const SCALE_REPLY_TOKENS = 30;
export const SCALE_PROMPT_SHARE = SCALE_PROMPT_TOKENS / (SCALE_PROMPT_TOKENS + SCALE_REPLY_TOKENS);

export const MICROBATCH_A = Object.freeze([4]);
export const MICROBATCH_B = Object.freeze(Array(9).fill(1));
export const MICROBATCH_SUM_A = MICROBATCH_A.reduce((a, b) => a + b, 0);
export const MICROBATCH_SUM_B = MICROBATCH_B.reduce((a, b) => a + b, 0);
export const MICROBATCH_COUNT = MICROBATCH_A.length + MICROBATCH_B.length;
export const MICROBATCH_TOKEN_MEAN = (MICROBATCH_SUM_A + MICROBATCH_SUM_B) / MICROBATCH_COUNT;
export const MICROBATCH_MEAN_OF_MEANS =
  (MICROBATCH_SUM_A / MICROBATCH_A.length + MICROBATCH_SUM_B / MICROBATCH_B.length) / 2;

export const EXPOSURE_4W = sftExposure(4, 8, 4, 1560);
export const EXPOSURE_8W = sftExposure(2, 16, 8, 1560);
export const DDP_GRADS = Object.freeze([2, 4]);
export const DDP_TARGETS = 4;
export const DDP_INTENDED = (DDP_GRADS[0] + DDP_GRADS[1]) / DDP_TARGETS;
export const DDP_AVERAGED = DDP_INTENDED / DDP_GRADS.length;

export const RESUME_RESTORED = sftResume(true);
export const RESUME_FRESH = sftResume(false);
export const SGD_SAVED_V = 0.9 * 2 + 1;
export const SGD_SAVED_W = 0.8 - 0.1 * SGD_SAVED_V;
export const SGD_RESET_V = 0.9 * 0 + 1;
export const SGD_RESET_W = 0.8 - 0.1 * SGD_RESET_V;

export const CHECKPOINT_WIN_98 = sftCheckpointGate(SFT_CHECKPOINTS, 0.98);
export const CHECKPOINT_WIN_100 = sftCheckpointGate(SFT_CHECKPOINTS, 1.0);

export const REPAIR_BAD = sftBoundaryRepair(false);
export const REPAIR_GOOD = sftBoundaryRepair(true);

export const LOG_FOUR = Math.log(4);

/** Build-time mathematical verification of every core identity in the SFT lesson. */
export function verifySftInvariants() {
  verifyInvariant(validateModel() === true, 'legacy validateModel passes');

  // Token and mask invariants
  verifyInvariant(TOKENS.length === 8, '8 symbolic tokens');
  verifyInvariant(MASK.filter(Boolean).length === 3, '3 active response tokens');
  verifyInvariant(
    maskSnapshot(0, 1).labels.filter((l) => l === '−100').length === 5,
    '5 ignored context labels',
  );

  // Loss invariants
  verifyApprox(LOSS_FULL.losses[0], targetLoss(0.6), 1e-12, 'loss(open)');
  verifyApprox(LOSS_FULL.losses[1], targetLoss(0.7), 1e-12, 'loss(ticket)');
  verifyApprox(LOSS_FULL.losses[2], targetLoss(0.8), 1e-12, 'loss(END)');
  verifyApprox(LOSS_FULL.sum, 1.091, 1e-3, '3-target loss sum');
  verifyApprox(LOSS_FULL.mean, 0.364, 1e-3, '3-target mean loss');
  verifyApprox(LOSS_CLIPPED.mean, 0.434, 1e-3, '2-target mean loss without END');
  verifyApprox(LOG_FOUR, 1.386294, 1e-5, 'ln(4) uniform 4-vocab loss');

  // Padding invariants
  verifyInvariant(
    PAD_LABELS_BY_POS.filter((v) => v !== -100).length === 3,
    'position padding keeps 3',
  );
  verifyInvariant(PAD_LABELS_BY_ID.filter((v) => v !== -100).length === 2, 'id padding drops END');

  // Prompt dilution invariants
  verifyApprox(ANSWER_MEAN, 2.0, 1e-12, 'answer mean is 2.0');
  verifyApprox(COMBINED_PROMPT_MEAN, 0.5957, 1e-3, 'combined 7-token mean ~0.596');
  verifyApprox(SCALE_PROMPT_SHARE, 800 / 830, 1e-12, '800/830 prompt share ~96.4%');

  // Packing isolation invariants
  verifyApprox(PACK_ISO_BEFORE, 15.0, 1e-12, 'isolated B before = 15');
  verifyApprox(PACK_ISO_AFTER, 15.0, 1e-12, 'isolated B after = 15');
  verifyApprox(PACK_GLOB_BEFORE, 7.2, 1e-12, 'global causal B before = 7.2');
  verifyApprox(PACK_GLOB_AFTER, 67.2, 1e-12, 'global causal B after = 67.2');
  verifyApprox(PACK_GLOB_AFTER - PACK_GLOB_BEFORE, 60.0, 1e-12, 'global shift = +60');

  // Microbatch weighting & global budget invariants
  verifyApprox(MICROBATCH_TOKEN_MEAN, 1.3, 1e-12, 'equal-token mean = 1.3');
  verifyApprox(MICROBATCH_MEAN_OF_MEANS, 2.5, 1e-12, 'mean-of-means = 2.5');
  verifyInvariant(EXPOSURE_4W.items === 128, '4x8x4 = 128 items');
  verifyInvariant(EXPOSURE_4W.targets === 6240, '4x1560 = 6240 scored targets');
  verifyInvariant(EXPOSURE_8W.items === 256, '2x16x8 = 256 items');
  verifyApprox(DDP_INTENDED, 1.5, 1e-12, 'DDP intended grad = 1.5');
  verifyApprox(DDP_AVERAGED, 0.75, 1e-12, 'DDP double-divided grad = 0.75');

  // Resume optimizer invariants
  verifyApprox(RESUME_RESTORED.weight, 0.873366, 1e-5, 'AdamW restored weight ~0.873366');
  verifyApprox(RESUME_FRESH.weight, 1.0, 1e-5, 'AdamW fresh weight ~1.000000');
  verifyApprox(SGD_SAVED_W, 0.52, 1e-12, 'SGD saved velocity weight = 0.52');
  verifyApprox(SGD_RESET_W, 0.7, 1e-12, 'SGD reset velocity weight = 0.70');

  // Checkpoint selection invariants
  verifyInvariant(CHECKPOINT_WIN_98.step === 600, '98% format floor picks step 600');
  verifyInvariant(CHECKPOINT_WIN_100.step === 400, '100% format floor picks step 400');

  // Boundary repair invariants
  verifyInvariant(REPAIR_BAD.count === 3, 'broken join has 3 active targets');
  verifyInvariant(REPAIR_GOOD.count === 3, 'repaired join has 3 active targets');
  verifyApprox(REPAIR_BAD.mean, 1.461, 1e-3, 'broken join mean ~1.461');
  verifyApprox(REPAIR_GOOD.mean, 0.768, 1e-3, 'repaired join mean ~0.768');
}

/** Safe duration inside a scene window so an animation never outruns narration. */
export function safeDuration(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

/** Safe duration from a specific cue start to the scene end. */
export function remainDuration(c, cueId, maxDur = 1.8, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.2, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

/** Schedule a continuous ambient phase animation across the whole scene. */
export function runPhase(s, c, phaseVal, target = 12, startOffset = 0.08) {
  const dur = safeDuration(c, startOffset, 0.55);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/** Clean translucent dark-glass token or metric capsule (no PowerPoint bullet chrome). */
export function glassCell(
  x,
  y,
  w,
  h,
  strokeColor = COSMOS.cyan,
  { fill = '#0d1426', radius = 12, glow = 6, opacity = 0.94, dash, width = 2.2 } = {},
) {
  const r = rect(w, h, { fill, stroke: strokeColor, width, radius, dash })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) r.glow(glow, strokeColor);
  return r;
}

/** Smooth 2D Bezier curve sampled as a glowingTrail. */
export function glowingArc(p0, p1, liftY, opts = {}) {
  const mx = (p0[0] + p1[0]) * 0.5;
  const my = (p0[1] + p1[1]) * 0.5 + liftY;
  const pts = Array.from({ length: 28 }, (_, i) => {
    const t = i / 27;
    const u = 1 - t;
    return [
      u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
    ];
  });
  return glowingTrail(pts, opts);
}

/** Horizontal slot X coordinate for the canonical 8-token T102 stream. */
export const streamX = (i) => -735 + i * 210;

/** Glowing chat-template token pill with optional index tag and semantic role glow. */
export function tokenPill(
  label,
  x,
  y,
  {
    w = 186,
    h = 84,
    color = COSMOS.blue,
    fill = '#10182b',
    textColor = COSMOS.ink,
    glow = 7,
    opacity = 1,
    dash,
    size = 28,
    index,
    indexColor = COSMOS.muted,
    indexOffsetY = -72,
  } = {},
) {
  const items = [
    glassCell(x, y, w, h, color, { fill, glow, opacity, dash }),
    txt(label, x, y, size, textColor, 'mono').opacity(opacity),
  ];
  if (index !== undefined) {
    items.push(txt(String(index), x, y + indexOffsetY, 26, indexColor, 'mono').opacity(opacity));
  }
  return group(...items);
}

/** Shaded 3D rectangular prism for memory tiers, LoRA tensors, and attention blocks. */
export function box3d(x0, y0, z0, dx, dy, dz, fillColor, edgeColor, opacity = 0.74) {
  const opts = { resolution: [1, 1], color: fillColor, opacity, mesh: false, shaded: true };
  const edges = wireframeSlab3d(
    [x0 + dx * 0.5, y0 + dy * 0.5, z0 + dz * 0.5],
    dx * 0.5,
    dy * 0.5,
    dz * 0.5,
    { color: edgeColor, width: 2.2, glow: 6 },
  );
  return [
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z0 + dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + dx, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
    ...edges,
  ];
}

/**
 * Orbiting 3D Block-Diagonal Causal Attention Matrix (6x6: Ex A 0..2, Ex B 3..5).
 * Highlights permitted causal triangles in glowing blue (A) and cyan (B),
 * with a pulsing golden divider wall and bright emerald query row 4.
 */
export function buildPackedMask3d(highlightRow4, { x = 320, y = 40 } = {}) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 1.02,
    distance: 15.2,
    unit: 108,
    focus: [0, 0, 0.4],
  }).at(x, y);

  const half = 2.7;
  const step = (2 * half) / 6;
  const mask = PACK_SNAP.mask;

  // Base floor grid
  for (let k = 0; k <= 6; k++) {
    const p = -half + k * step;
    const isWall = k === 3;
    view.add(
      line3d([p, -half, 0.02], [p, half, 0.02], {
        color: isWall ? COSMOS.gold : '#33446d',
        width: isWall ? 3.8 : 1.3,
        glow: isWall ? 8 : 0,
        opacity: isWall ? 0.95 : 0.45,
      }),
      line3d([-half, p, 0.02], [half, p, 0.02], {
        color: isWall ? COSMOS.gold : '#33446d',
        width: isWall ? 3.8 : 1.3,
        glow: isWall ? 8 : 0,
        opacity: isWall ? 0.95 : 0.45,
      }),
    );
  }

  // Block-causal prisms
  for (let r = 0; r < 6; r++) {
    for (let col = 0; col < 6; col++) {
      if (!mask[r][col]) continue;
      const x0 = -half + col * step + 0.07;
      const y0 = half - (r + 1) * step + 0.07;
      const isB = r >= 3;
      const isRow4 = r === 4;
      const h = isRow4 ? 1.15 : 0.52;
      const fillCol = isRow4 ? '#164d56' : isB ? '#133a54' : '#182b57';
      const edgeCol = isRow4 ? COSMOS.emerald : isB ? COSMOS.cyan : COSMOS.blue;
      view.add(...box3d(x0, y0, 0.04, step - 0.14, step - 0.14, h, fillCol, edgeCol, 0.84));
    }
  }

  // Golden cross-segment barrier wall between col 2 and col 3
  view.add(
    ...wireframeSlab3d([0, 0, 0.65], 0.04, half, 0.65, {
      color: COSMOS.gold,
      width: 2.8,
      glow: 9,
    }),
  );

  // Orbiting photon beacons above the two active reads of B:answer (r=4, cols 3 and 4)
  const beacons = points3d(
    () => {
      const lift = highlightRow4.value > 0.3 ? 1.55 : 0.95;
      const y4 = half - 4.5 * step;
      return [
        [-half + 3.5 * step, y4, lift],
        [-half + 4.5 * step, y4, lift],
      ];
    },
    {
      colorAt: () => COSMOS.gold,
      radius: 7.5,
      glow: 12,
      blend: 'screen',
      onTop: true,
    },
  );
  view.add(beacons);
  return view;
}

/** Cosine learning rate schedule from InstructGPT baseline (floor = 0.1). */
export function instructGptCosine(t, floor = 0.1) {
  return floor + ((1 - floor) / 2) * (1 + Math.cos(Math.PI * bounded(t)));
}

export {
  COSMOS,
  MASK,
  Node,
  PACKED_TOKENS,
  REPLY_PROBS,
  SFT_CHECKPOINTS,
  TOKENS,
  arrow,
  aura,
  bounded,
  circle,
  cinematic3d,
  curve3d,
  dot,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  line,
  line3d,
  linear,
  linearGradient,
  lossTrace,
  maskSnapshot,
  metricReadout,
  morphEquation,
  orbitScene,
  packedAttention,
  packingImplementationState,
  packingSnapshot,
  paddingLabels,
  parametricSurface,
  points3d,
  polyPath,
  radialGradient,
  rect,
  rule,
  sftBoundaryRepair,
  sftCheckpointGate,
  sftExposure,
  sftResume,
  surface,
  targetLoss,
  txt,
  wireframeSlab3d,
};
