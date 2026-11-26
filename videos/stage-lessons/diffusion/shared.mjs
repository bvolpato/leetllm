// Shared cinematic visual components, math helpers, and build-time invariants for the
// Diffusion stage lesson (33 scenes). All numbers are computed from videos/films/diffusion/.
import {
  Node,
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
  glowTex,
  guardedDynamic,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';
import { forwardValue, mixture, unit } from '../../films/diffusion/arithmetic.mjs';
import { valueColor } from '../../films/diffusion/defaults.mjs';
import {
  CENTERS,
  CLEAN_VARIANCE,
  MAX_ADDED_VARIANCE,
  SCORE_PROBE,
  SHADOW_PIXEL,
  TOP_PIXEL,
} from '../../films/diffusion/fixtures.mjs';
import {
  crossReadFixture,
  densityContours,
  image,
  imageNoise,
  posteriorFixture,
  releaseJob,
  scalarReverseTrace,
  trajectories,
  trajectoryPoint,
} from '../../films/diffusion/model.mjs';
import {
  blend,
  ddimTerms,
  decimal,
  exposure,
  recoverClean,
  worksheet,
} from '../../films/diffusion/pixel-study.mjs';
import { fileDecision } from '../../films/diffusion/release-study.mjs';

export {
  CENTERS,
  CLEAN_VARIANCE,
  COSMOS,
  MAX_ADDED_VARIANCE,
  SCORE_PROBE,
  SHADOW_PIXEL,
  TOP_PIXEL,
  blend,
  crossReadFixture,
  ddimTerms,
  decimal,
  densityContours,
  exposure,
  fileDecision,
  forwardValue,
  image,
  imageNoise,
  mixture,
  posteriorFixture,
  recoverClean,
  releaseJob,
  scalarReverseTrace,
  trajectories,
  trajectoryPoint,
  unit,
  valueColor,
  worksheet,
};

/** Precomputed exact worksheets reused across scenes. */
export const TOP_JUMP = worksheet(0.5, 0.9);
export const SHADOW_JUMP = worksheet(0.36, 0.64);
export const SCALAR_TRACE = scalarReverseTrace();
export const POSTERIOR = posteriorFixture();

/** Build-time mathematical invariants (A1). */
export function verifyDiffusionInvariants() {
  verifyInvariant(image.length === 256, 'tabletop image must be 16x16');
  verifyInvariant(image.filter((v) => v === 1).length === 60, 'tabletop bright pixel count');
  verifyApprox(image[TOP_PIXEL], 1, 1e-12, 'TOP_PIXEL clean brightness');
  verifyApprox(imageNoise[TOP_PIXEL], -0.4, 1e-12, 'TOP_PIXEL noise draw');
  verifyApprox(image[SHADOW_PIXEL], -0.8, 1e-12, 'SHADOW_PIXEL clean brightness');
  verifyApprox(imageNoise[SHADOW_PIXEL], 0.6, 1e-12, 'SHADOW_PIXEL noise draw');

  for (const alphaBar of [0, 0.1, 0.5, 0.9, 1]) {
    const a = forwardValue(1, 0, alphaBar);
    const b = forwardValue(0, 1, alphaBar);
    verifyApprox(a * a + b * b, 1, 1e-12, `unit circle at alphaBar=${alphaBar}`);
  }

  verifyApprox(TOP_JUMP.input[TOP_PIXEL], 0.4242640687, 1e-6, 'TOP_PIXEL at 0.5');
  verifyApprox(TOP_JUMP.scaled[TOP_PIXEL], 0.9486832981, 1e-6, 'TOP_PIXEL scaled to 0.9');
  verifyApprox(TOP_JUMP.destination[TOP_PIXEL], 0.8221921916, 1e-6, 'TOP_PIXEL destination 0.9');
  verifyApprox(
    TOP_JUMP.destination[TOP_PIXEL],
    TOP_JUMP.reference[TOP_PIXEL],
    1e-12,
    'TOP_PIXEL exact DDIM match',
  );

  verifyApprox(SHADOW_JUMP.input[SHADOW_PIXEL], 0, 1e-12, 'SHADOW_PIXEL at 0.36');
  verifyApprox(SHADOW_JUMP.scaled[SHADOW_PIXEL], -0.64, 1e-12, 'SHADOW_PIXEL scaled');
  verifyApprox(SHADOW_JUMP.destination[SHADOW_PIXEL], -0.28, 1e-12, 'SHADOW_PIXEL destination');

  const fork = ddimTerms(image[TOP_PIXEL], imageNoise[TOP_PIXEL], 0.5, 0.9, 1);
  verifyApprox(
    fork.sigma,
    Math.sqrt(0.1 / 0.5) * Math.sqrt(1 - 0.5 / 0.9),
    1e-12,
    'DDIM eta=1 sigma',
  );
  verifyApprox(
    fork.center,
    Math.sqrt(0.9) + Math.sqrt(0.1 - fork.sigma ** 2) * -0.4,
    1e-12,
    'DDIM eta=1 center',
  );
  verifyInvariant(
    (fork.center - fork.sigma).toFixed(3) === '0.608',
    'DDIM eta=1 z=-1 rounds to 0.608',
  );
  verifyInvariant(
    (fork.center + fork.sigma).toFixed(3) === '1.205',
    'DDIM eta=1 z=+1 rounds to 1.205',
  );

  verifyApprox(0.98 * 0.97 * 0.96, 0.912576, 1e-12, '3-step alpha bar product');
  verifyApprox(POSTERIOR.total, 5 / 9, 1e-12, 'posterior total variance 5/9');

  verifyInvariant(SCALAR_TRACE.rows[0].next.toFixed(3) === '1.141', 'scalar trace row 0');
  verifyInvariant(SCALAR_TRACE.rows[1].next.toFixed(3) === '1.174', 'scalar trace row 1');
  verifyInvariant(SCALAR_TRACE.final.toFixed(3) === '1.111', 'scalar trace final');
  verifyInvariant(SCALAR_TRACE.resetNext !== SCALAR_TRACE.restoredNext, 'reset seed diverges');

  const cr = crossReadFixture();
  verifyApprox(cr.output[0], 0.589, 1e-3, 'cross-read output x');
  verifyApprox(cr.output[1], 0.311, 1e-3, 'cross-read output y');

  verifyInvariant(trajectories.length === 72, '72 exact probability flow trajectories');
  verifyInvariant(
    releaseJob.variants * releaseJob.steps * releaseJob.branches === 48,
    'release job work count 48',
  );
  verifyInvariant(
    fileDecision(releaseJob.candidates[0], releaseJob.currentAttempt, true) === 'fenced',
    'expired attempt fenced',
  );
  verifyInvariant(
    fileDecision(releaseJob.candidates[1], releaseJob.currentAttempt, true) === 'hold',
    'resized file held',
  );
}

/** Non-overlapping two-phase crossfade helpers (P5: old view drops to 0 before new view rises). */
export const fadeOut = (t) => Math.max(0, Math.min(1, 1 - t / 0.42));
export const fadeIn = (t) => Math.max(0, Math.min(1, (t - 0.58) / 0.42));

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

/** Schedule a gentle pulse on a Value when a cue starts (also marks the cue used). */
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

/** Smooth 3D height for the 3-mode Gaussian mixture manifold (used in score & transport). */
export function manifoldZ(wx, wy, addedVariance) {
  const d = mixture([wx, wy], addedVariance).density;
  // Smooth soft-cap elevation so low-variance peaks soar gracefully without clipping flat
  return 2.65 * (1 - Math.exp(-d * 7.2)) + 0.04;
}

/** Render a 16x16 (or NxN) pixel study grid centered at (cx, cy) with glowing target crosshair. */
export function pixelGrid(
  pixels,
  {
    cx = 0,
    cy = 0,
    size = 420,
    selected = TOP_PIXEL,
    frameColor = COSMOS.cyan,
    markColor = COSMOS.gold,
    grayscale = false,
    opacity = 1,
  } = {},
) {
  const side = Math.round(Math.sqrt(pixels.length));
  const pad = 6;
  const pitch = (size - 2 * pad) / side;
  const left = cx - size / 2 + pad;
  const top = cy - size / 2 + pad;
  const cells = [
    rect(size + 8, size + 8, {
      fill: '#0a0f1f',
      stroke: frameColor,
      width: 2.4,
      radius: 10,
    })
      .at(cx, cy)
      .glow(8, frameColor),
  ];
  for (let i = 0; i < pixels.length; i++) {
    const col = i % side;
    const row = Math.floor(i / side);
    const px = left + (col + 0.5) * pitch;
    const py = top + (row + 0.5) * pitch;
    const fill = grayscale ? `rgb(${pixels[i]},${pixels[i]},${pixels[i]})` : valueColor(pixels[i]);
    cells.push(rect(pitch + 0.6, pitch + 0.6, { fill, stroke: null }).at(px, py));
  }
  if (selected != null && selected >= 0 && selected < pixels.length) {
    const col = selected % side;
    const row = Math.floor(selected / side);
    const sx = left + (col + 0.5) * pitch;
    const sy = top + (row + 0.5) * pitch;
    cells.push(
      rect(pitch + 2, pitch + 2, { fill: null, stroke: '#070910', width: 4.5 }).at(sx, sy),
      rect(pitch, pitch, { fill: null, stroke: markColor, width: 2.6 })
        .at(sx, sy)
        .glow(10, markColor),
      line([sx - pitch * 1.15, sy], [sx - pitch * 0.62, sy], {
        stroke: markColor,
        width: 2.8,
      }).glow(6, markColor),
      line([sx + pitch * 0.62, sy], [sx + pitch * 1.15, sy], {
        stroke: markColor,
        width: 2.8,
      }).glow(6, markColor),
    );
  }
  return group(...cells).opacity(opacity);
}

/** Luminous horizontal brightness ruler with cyan reference ring and gold live orb. */
export function brightnessRuler({
  cx = 0,
  cy = 345,
  width = 1380,
  left = -1,
  right = 1.25,
  ticks = [-1, -0.5, 0, 0.5, 1],
  reference,
  current,
  caption = 'Normalized pixel brightness',
  opacity = 1,
} = {}) {
  const x0 = cx - width / 2;
  const mapX = (v) => x0 + ((v - left) / (right - left)) * width;
  const parts = [
    line([x0, cy], [x0 + width, cy], { stroke: '#4d6089', width: 3.2 }),
    line([x0, cy], [x0 + width, cy], { stroke: COSMOS.cyan, width: 1.4 }).opacity(0.45),
  ];
  for (const t of ticks) {
    const tx = mapX(t);
    parts.push(
      line([tx, cy - 10], [tx, cy + 12], { stroke: '#7b8eb8', width: 2.4 }),
      txt(String(t).replace('-', '−'), tx, cy + 44, 26, COSMOS.muted, 'mono'),
    );
  }
  if (reference !== undefined && reference !== null) {
    const rx = mapX(reference);
    parts.push(
      circle(19, { fill: COSMOS.bg, stroke: COSMOS.cyan, width: 4.8 })
        .at(rx, cy)
        .glow(12, COSMOS.cyan),
    );
  }
  if (current !== undefined && current !== null) {
    const curX = mapX(current);
    parts.push(
      dot(11, COSMOS.gold).at(curX, cy).glow(14, COSMOS.gold),
      dot(4.5, '#ffffff').at(curX, cy),
    );
  }
  if (caption) {
    parts.push(txt(caption, cx, cy + 88, 26, COSMOS.muted, 'sans'));
  }
  return group(...parts).opacity(opacity);
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

/** Helper to format a 1D vector cleanly with minus signs. */
export function vecLabel(vals, digits = 2) {
  return '[' + vals.map((v) => decimal(v, digits)).join(', ') + ']';
}

export {
  decorAura as aura,
  glowTex,
  guardedDynamic,
  linear,
  linearGradient,
  polyPath,
  radialGradient,
  text,
  txt,
};
