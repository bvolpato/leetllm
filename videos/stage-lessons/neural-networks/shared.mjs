// Shared math imports, build-time invariants, palette, and cinema helpers for neural-networks.
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
  CASES,
  OWNER_IDS,
  PARAMETERS,
  REQUESTS,
  REQUEST_IDS,
  TARGETS,
  activations,
} from '../../films/neural-networks/fixtures.mjs';
import {
  approximation,
  binaryMeanGradients,
  denseParameterCount,
  differenceLamp,
  finiteReluSecant,
  forward,
  gradientStep,
  sigmoid,
  signedChain,
  stableBce,
  standardize,
  targetCurve,
  triangle,
} from '../../films/neural-networks/arithmetic.mjs';
import {
  affineWitness,
  backward,
  batchGradient,
  freshGradient,
  requestForward,
  transposeExample,
} from '../../films/neural-networks/model.mjs';
import { validateConstruction, validateModel } from '../../films/neural-networks/validation.mjs';

export {
  CASES,
  COSMOS,
  OWNER_IDS,
  PARAMETERS,
  REQUESTS,
  REQUEST_IDS,
  TARGETS,
  activations,
  affineWitness,
  approximation,
  backward,
  batchGradient,
  binaryMeanGradients,
  cinematic3d,
  curve3d,
  denseParameterCount,
  differenceLamp,
  finiteReluSecant,
  forward,
  freshGradient,
  glowTex,
  glowingTrail,
  gradientStep,
  guardedDynamic,
  heroTitle,
  line3d,
  orbitScene,
  point3d,
  requestForward,
  sigmoid,
  signedChain,
  stableBce,
  standardize,
  surface,
  targetCurve,
  transposeExample,
  triangle,
  txt,
};

export const ROLE = {
  lit: COSMOS.gold,
  dark: COSMOS.cyan,
  grad: COSMOS.rose,
  good: COSMOS.emerald,
  gate: COSMOS.violet,
  warm: COSMOS.amber,
};

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const mix = (a, b, t) => a + (b - a) * clamp01(t);

// Non-overlapping crossfade (P5: old reaches 0 at 0.42, new enters at 0.58)
export const fadeOut = (t) => clamp01(1 - t / 0.42);
export const fadeIn = (t) => clamp01((t - 0.58) / 0.42);

export function verifyNeuralNetworksInvariants() {
  validateModel();
  validateConstruction();
  verifyApprox(sigmoid(2.6), 0.9308615796566533, 1e-6, 'scorer sigmoid(2.6)');
  const swigluActive = [1, -2].map(activations.SiLU.value);
  const swigluProd = [swigluActive[0] * 3, swigluActive[1] * -1];
  verifyApprox(0.5 * swigluProd[0] - swigluProd[1], 0.858, 0.002, 'SwiGLU readout ~0.86');
  const tr = transposeExample([2, 5]);
  verifyApprox(tr.right[0], 0.1, 1e-12, 'right multiply h0');
  verifyApprox(tr.right[1], 3.2, 1e-12, 'right multiply h1');
  verifyApprox(tr.wrong[0], 1.1, 1e-12, 'wrong multiply h0');
  verifyApprox(tr.wrong[1], 2.8, 1e-12, 'wrong multiply h1');
  const mGrads = binaryMeanGradients(
    [
      [0, 0, 0],
      [0, 0, 0],
    ],
    [
      [1, 0, 1],
      [0, 1, 0],
    ],
  );
  verifyApprox(mGrads[0][0], -1 / 12, 1e-12, '2x3 BCE mean gradient -1/12');
  verifyInvariant(
    denseParameterCount([784, 256, 128, 10]) === 235146,
    'dense MNIST params 235,146',
  );
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
  const safeW = Math.max(4, w);
  const bar = rect(safeW, h, { fill: color, radius }).at(x + safeW / 2, y);
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
    w = 116,
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

export function glowBadge(label, x, y, color, { w = 230, h = 52, size = 26, opacity = 1 } = {}) {
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
