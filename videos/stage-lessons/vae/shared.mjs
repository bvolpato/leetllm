// Shared cinematic helpers and verified math imports for Autoencoders & VAEs.
import { circle, dynamic, group, line, rect, text } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowTex,
  glowingTrail,
  heroTitle,
  orbitScene,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';

export function markDecor(node) {
  if (!node) return node;
  if (!node.data) node.data = {};
  node.data.decoration = true;
  if (Array.isArray(node.children)) node.children.forEach(markDecor);
  return node;
}
import {
  collapseCaption,
  collapseProgress,
  gaussianPixelLoss,
  kl,
} from '../../films/vae/arithmetic.mjs';
import {
  TRAINED_AE,
  TRAINED_VAE,
  book,
  center,
  collapseCodes,
  coordinateSwapStudy,
  enc,
  eps,
  lower,
  lv,
  mu,
  noise,
  pixels,
  priorDraw,
} from '../../films/vae/fixtures.mjs';
import {
  binaryInformationState,
  codeSwapFrame,
  collapseDifference,
  collapseOutputs,
  decode,
  dist,
  encode,
  freeBitsState,
  freshCollisionState,
  gaussianEvidenceState,
  mse,
  probeCode,
  probePixels,
  recon,
  sample,
  sig,
  vqGradientSnapshot,
  z,
} from '../../films/vae/model.mjs';
import { validateModel } from '../../films/vae/validation.mjs';

export {
  COSMOS,
  TRAINED_AE,
  TRAINED_VAE,
  binaryInformationState,
  book,
  center,
  cinematic3d,
  codeSwapFrame,
  collapseCaption,
  collapseCodes,
  collapseDifference,
  collapseOutputs,
  collapseProgress,
  coordinateSwapStudy,
  decode,
  dist,
  enc,
  encode,
  eps,
  freeBitsState,
  freshCollisionState,
  gaussianEvidenceState,
  gaussianPixelLoss,
  glowTex,
  glowingTrail,
  heroTitle,
  kl,
  lower,
  lv,
  mse,
  mu,
  noise,
  orbitScene,
  pixels,
  priorDraw,
  probeCode,
  probePixels,
  recon,
  sample,
  sig,
  txt,
  vqGradientSnapshot,
  z,
};

export const ROLE = {
  pixel: COSMOS.cyan,
  code: COSMOS.gold,
  post: COSMOS.violet,
  good: COSMOS.emerald,
  warn: COSMOS.rose,
  blue: COSMOS.blue,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
};

export function verifyVaeInvariants() {
  validateModel();
  verifyApprox(z[0], 0.8875, 1e-6, 'encoded z[0]');
  verifyApprox(z[1], 0.17, 1e-6, 'encoded z[1]');
  verifyApprox(mse, 0.0027, 1e-4, 'crafted recon MSE');
  verifyApprox(kl(mu, lv), 0.200878, 1e-5, 'KL(mu, lv)');
  verifyApprox(sample[0], 0.752344, 1e-5, 'reparam sample[0]');
  verifyApprox(sample[1], -1.251271, 1e-5, 'reparam sample[1]');
  verifyInvariant(dist.indexOf(Math.min(...dist)) === 1, 'VQ nearest entry is index 1');
  verifyInvariant((512 * 512) / (64 * 64) === 64, '64x spatial reduction');
  const col = freshCollisionState(2, 1);
  verifyApprox(col.codes[0][0], 0.7, 1e-9, 'collision code[0][0]');
  verifyApprox(col.codes[1][0], 0.7, 1e-9, 'collision code[1][0]');
}

export const mix = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

export const fadeOut = (p) => clamp(1 - p * 2.2);
export const fadeIn = (p) => clamp((p - 0.52) * 2.2);

export function guardedDynamic(visFn, buildFn) {
  return dynamic(() => {
    const vis = visFn();
    if (vis < 0.02) return group();
    return buildFn(vis);
  });
}

export function rule(x1, y1, x2, y2, color = '#2a3759', width = 2.4) {
  return line([x1, y1], [x2, y2], { stroke: color, width });
}

export function decorAura(x, y, radius, inner, outer = '#07091000') {
  return markDecor(aura(x, y, radius, inner, outer));
}

export function cinemaGrid({ accent = ROLE.pixel, seed = 1 } = {}) {
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

export function glowDot(x, y, { radius = 12, color = ROLE.code, glow = 10, opacity = 1 } = {}) {
  return circle(radius, { fill: color, stroke: '#070910', width: 2.2 })
    .at(x, y)
    .glow(glow, color)
    .opacity(opacity);
}

export function glowBar(x, y, w, h, color, { glow = 8, radius = 8, opacity = 1 } = {}) {
  const safeW = Math.max(4, w);
  return rect(safeW, h, { fill: color, radius })
    .at(x + safeW / 2, y)
    .glow(glow, color)
    .opacity(opacity);
}

export function glowBadge(
  label,
  x,
  y,
  color = ROLE.pixel,
  { w = 220, h = 56, size = 26, fill = '#0d1529', opacity = 1 } = {},
) {
  return group(
    rect(w, h, { fill, stroke: color, width: 2.6, radius: 14 }).at(x, y).glow(8, color),
    txt(label, x, y, size, color, 'mono'),
  ).opacity(opacity);
}

export function numCell(
  val,
  x,
  y,
  {
    w = 132,
    h = 62,
    size = 28,
    fill = '#0f1830',
    stroke = '#2b3b60',
    textColor = COSMOS.ink,
    glow = 0,
  } = {},
) {
  const box = rect(w, h, { fill, stroke, width: 2.6, radius: 12 }).at(x, y);
  return group(glow > 0 ? box.glow(glow, stroke) : box, txt(val, x, y, size, textColor, 'mono'));
}

// Luminous 5x5 grayscale pixel crop renderer (zero tiny text; pure intensity + glowing highlights)
export function pixelPatch5x5(
  values,
  cx,
  cy,
  {
    cell = 52,
    gap = 6,
    highlightCenter = false,
    highlightLower = false,
    alertCut = null,
    selectedIdx = -1,
    tint = 'cyan',
    opacity = 1,
  } = {},
) {
  const step = cell + gap;
  const start = -2 * step;
  const nodes = [
    rect(5 * step + 18, 5 * step + 18, {
      fill: '#0a1020',
      stroke: '#253559',
      width: 2.4,
      radius: 14,
    }).at(cx, cy),
  ];
  for (let i = 0; i < 25; i += 1) {
    const r = Math.floor(i / 5);
    const col = i % 5;
    const x = cx + start + col * step;
    const y = cy + start + r * step;
    const v = clamp(values[i] ?? 0);
    const isCenter = center.includes(i);
    const isLower = lower.includes(i);
    const isAlert = alertCut !== null && v > alertCut;
    const isSel = i === selectedIdx;

    // Map intensity [0,1] into rich cinema luminance
    const lum = Math.round(16 + v * 215);
    const rCh = tint === 'gold' ? Math.min(255, Math.round(lum * 1.05)) : Math.round(lum * 0.72);
    const gCh = tint === 'gold' ? Math.round(lum * 0.88) : Math.min(255, Math.round(lum * 0.96));
    const bCh = tint === 'gold' ? Math.round(lum * 0.45) : Math.min(255, Math.round(lum * 1.06));
    const fill = `rgb(${rCh},${gCh},${bCh})`;

    let stroke = '#1e2c4a';
    let sw = 1.6;
    let gl = 0;
    if (isSel) {
      stroke = ROLE.code;
      sw = 3.6;
      gl = 10;
    } else if (isAlert) {
      stroke = ROLE.warn;
      sw = 3.6;
      gl = 10;
    } else if (highlightCenter && isCenter) {
      stroke = ROLE.code;
      sw = 3.2;
      gl = 8;
    } else if (highlightLower && isLower) {
      stroke = ROLE.post;
      sw = 3.2;
      gl = 8;
    }

    const tile = rect(cell, cell, { fill, stroke, width: sw, radius: 6 }).at(x, y);
    nodes.push(gl > 0 ? tile.glow(gl, stroke) : tile);
  }
  return group(...nodes).opacity(opacity);
}

export function cueTo(s, c, cueId, val, target = 1, { dur = 0.7, after = false } = {}) {
  const fn = () => s.play(val.to(target, { duration: dur }));
  if (after) c.after(cueId, fn);
  else c.on(cueId, fn);
}

export function beatTo(s, c, beatIdx, val, target = 1, { dur = 0.7 } = {}) {
  c.onBeat(beatIdx, () => s.play(val.to(target, { duration: dur })));
}

export function livingDrift(s, c, drift, target = 1) {
  c.onBeat(0, () => {
    const dur = Math.max(8, (c.duration || 30) - 0.5);
    s.play(drift.to(target, { duration: dur, ease: 'linear' }));
  });
}
