// Shared cinematic palette, verified math invariants, and 3D patch/grid primitives
// for the 23-scene Vision Transformers (ViT, CLIP, SigLIP, DINOv2/v3 & VLM Bridges) stage film.
import { arrow, circle, dot, group, line, line3d, rect, seq, surface } from 'vizmatic/stage';
import {
  attend,
  loss,
  placed,
  visionCandidateRanking,
  visionPadding,
  visionPrefixBudget,
  visionPreln,
  visionProject,
  visionRotary,
  visionSiglip,
} from '../../films/vision-transformers/arithmetic.mjs';
import {
  E,
  imageVecs,
  patches,
  pos,
  ps,
  textVecs,
  tokens,
} from '../../films/vision-transformers/fixtures.mjs';
import {
  labeledId,
  nativeStrip,
  nextId,
  nextStrip,
  proposedId,
  resizedStrip,
} from '../../films/vision-transformers/incident.mjs';
import {
  a,
  clip,
  embedded,
  logits,
  out,
  sw,
  weights,
} from '../../films/vision-transformers/model.mjs';
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
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  COSMOS,
  E,
  a,
  arrow,
  attend,
  aura,
  cinematic3d,
  circle,
  clip,
  dot,
  embedded,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  imageVecs,
  labeledId,
  line,
  line3d,
  logits,
  loss,
  metricReadout,
  nativeStrip,
  nextId,
  nextStrip,
  orbitScene,
  out,
  patches,
  placed,
  pos,
  proposedId,
  ps,
  rect,
  resizedStrip,
  rule,
  seq,
  surface,
  sw,
  textVecs,
  tokens,
  txt,
  visionCandidateRanking,
  visionPadding,
  visionPrefixBudget,
  visionPreln,
  visionProject,
  visionRotary,
  visionSiglip,
  weights,
  wireframeSlab3d,
};

export const ROLE = Object.freeze({
  patch: COSMOS.cyan,
  pos: COSMOS.gold,
  attn: COSMOS.blue,
  ok: COSMOS.emerald,
  warn: COSMOS.rose,
  bridge: COSMOS.violet,
  amber: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
});

export const PRELN = visionPreln();
export const PAD_0 = visionPadding(0, true);
export const PAD_UNMASKED = visionPadding(4, false);
export const PAD_MASKED = visionPadding(4, true);
export const SIGLIP = visionSiglip();
export const RANK_2 = visionCandidateRanking(false);
export const RANK_3 = visionCandidateRanking(true);
export const BUDGET_224 = visionPrefixBudget(224);
export const BUDGET_448 = visionPrefixBudget(448);
export const BUDGET_896 = visionPrefixBudget(896);
export const BUDGET_4IMG = visionPrefixBudget(448, 512, 4, 1);
export const BUDGET_4IMG_MERGED = visionPrefixBudget(448, 512, 4, 4);

export function verifyVitInvariants() {
  verifyApprox(embedded[0][0], 2.5, 1e-9, 'patch 0 mean brightness 2.5');
  verifyApprox(embedded[0][1], 1.0, 1e-9, 'patch 0 contrast 1.0');
  verifyApprox(visionProject([1, 1, 3, 5])[0], 2.5, 1e-9, 'null direction keeps mean 2.5');
  verifyApprox(visionProject([1, 1, 3, 5])[1], 1.0, 1e-9, 'null direction keeps contrast 1.0');
  verifyApprox(visionProject([1, 0, 4, 5])[1], 0.0, 1e-9, 'across-column contrast drops to 0');
  verifyApprox(visionRotary([0, 0], [0, 0]).score, 2.0, 1e-9, '2D RoPE same cell score 2');
  verifyApprox(visionRotary([0, 0], [1, 0]).score, 1.0, 1e-9, '2D RoPE row+1 score 1');
  verifyApprox(visionRotary([2, 3], [3, 3]).score, 1.0, 1e-9, '2D RoPE shift invariance');
  verifyApprox(PRELN.output[0], 2.341, 0.005, 'Pre-LN output[0] ~ 2.341');
  verifyApprox(PRELN.output[1], 4.341, 0.005, 'Pre-LN output[1] ~ 4.341');
  verifyApprox(PAD_0.output[0], 1.606, 0.005, 'valid 2-patch readout x');
  verifyApprox(PAD_UNMASKED.output[0], 0.913, 0.005, 'unmasked 4 zero keys readout x');
  verifyApprox(PAD_MASKED.output[0], PAD_0.output[0], 1e-9, 'masked padding restores readout');
  verifyApprox(SIGLIP.objective, 0.56, 0.01, 'SigLIP paper-normalized objective ~0.56');
  verifyApprox(RANK_2.probabilities[0], 0.98, 0.015, '2-candidate failure share ~98%');
  verifyApprox(RANK_3.probabilities[0], 0.494, 0.01, 'duplicated failure share ~49.4%');
  verifyApprox(BUDGET_224.mib, 96, 1e-9, '224px + 512 text = 96 MiB');
  verifyApprox(BUDGET_448.mib, 192, 1e-9, '448px + 512 text = 192 MiB');
  verifyApprox(BUDGET_896.mib, 576, 1e-9, '896px + 512 text = 576 MiB');
  verifyInvariant(BUDGET_4IMG_MERGED.visual === 1024, '4 merged 448px images = 1024 visual slots');
  verifyApprox(visionProject([2, 3, 6, 7], true)[2], -4, 1e-9, 'fresh ref 3rd coord -4');
  verifyApprox(visionProject([3, 3, 5, 7], true)[2], -2, 1e-9, 'fresh edit 3rd coord -2');
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
      dur: 0.32,
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
  { w = 160, h = 66, color = ROLE.patch, fill = '#10182d', size = 28, glow = 8, opacity = 1 } = {},
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

/** Orbiting 3D patch-grid tokenization slab (subdivides 14x14 -> 28x28 showing 4x patches / 16x pairs). */
export function buildPatchGrid3d(densityVal, { x = 400, y = 40 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 14.5,
    unit: 118,
    focus: [0, 0, 0.35],
  }).at(x, y);

  const surf = surface(
    (px, py) => {
      const freq = 1.6 + densityVal.value * 1.6;
      const radial = Math.exp(-0.08 * (px * px + py * py));
      return (
        0.25 +
        (0.75 + 0.65 * densityVal.value) *
          radial *
          (0.55 + 0.45 * Math.cos(px * freq) * Math.cos(py * freq))
      );
    },
    {
      x: [-2.6, 2.6],
      y: [-2.6, 2.6],
      resolution: [26, 26],
      colors: ['#101c3a', '#1d4d7c', '#5ce1e6', '#ffd166', '#ff6b8b'],
      opacity: 0.88,
      mesh: '#7ce8ff',
      meshOpacity: 0.24,
      meshWidth: 0.8,
      animate: true,
    },
  );

  const activeTile = wireframeSlab3d([0, 0, 0.85], 1.25, 1.25, 0.65, {
    color: COSMOS.gold,
    width: 2.8,
    glow: 9,
  });

  view.add(surf, ...activeTile);
  return view;
}

/** Render a binary/grayscale pixel strip (e.g. resizedStrip / nativeStrip / nextStrip) on dark cosmos. */
export function pixelStripNodes(
  values,
  x0,
  y0,
  cellW,
  cellH,
  { tint = COSMOS.cyan, opacity = 1 } = {},
) {
  const rows = values.length;
  const cols = values[0].length;
  const totalW = cols * cellW;
  const totalH = rows * cellH;
  const nodes = [
    rect(totalW + 8, totalH + 8, {
      fill: '#0c1324',
      stroke: '#2b3f6b',
      width: 2,
      radius: 8,
    })
      .at(x0 + totalW * 0.5, y0 + totalH * 0.5)
      .opacity(opacity),
  ];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = values[r][c];
      if (v <= 0.04) continue;
      const cx = x0 + (c + 0.5) * cellW;
      const cy = y0 + (r + 0.5) * cellH;
      nodes.push(
        rect(cellW - 0.8, cellH - 0.8, { fill: tint, stroke: null, radius: 1 })
          .at(cx, cy)
          .opacity(opacity * (0.18 + 0.82 * v)),
      );
    }
  }
  return group(...nodes);
}
