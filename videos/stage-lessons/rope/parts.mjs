// Shared cinematic primitives, semantic color roles, and verified math model for `rope`.
import {
  Node,
  arc,
  arrow,
  circle,
  curve3d,
  dot,
  group,
  label3d,
  line,
  line3d,
  linearGradient,
  parametricSurface,
  point3d,
  polyPath,
  rect,
  surface,
} from 'vizmatic/stage';
import {
  absoluteExpansion,
  absoluteRow,
  alibiSlopes,
  blend,
  bound,
  dot as dotVec,
  frequencySchedules,
  permissionMask,
  rotaryScore,
  rotateHead,
  rotatePair,
  softmax,
  toBfloat16,
} from '../../films/rope/arithmetic.mjs';
import { freshPositionFrame } from '../../films/rope/construction.mjs';
import {
  CACHE_K,
  CACHE_POSITIONS,
  CACHE_Q,
  CLOCK_FREQUENCIES,
  TAU,
  content,
} from '../../films/rope/fixtures.mjs';
import {
  cacheChunkInSlots,
  cacheFixture,
  cachePositionFrame,
  contentOutputs,
  contentWeights,
  pairingTrace,
} from '../../films/rope/model.mjs';
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
  nebula,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';

export {
  CACHE_K,
  CACHE_POSITIONS,
  CACHE_Q,
  CINEMA_FRAME,
  CLOCK_FREQUENCIES,
  COSMOS,
  TAU,
  absoluteExpansion,
  absoluteRow,
  alibiSlopes,
  aura,
  blend,
  bound,
  cacheChunkInSlots,
  cacheFixture,
  cachePositionFrame,
  cinematic3d,
  content,
  contentOutputs,
  contentWeights,
  dotVec,
  frequencySchedules,
  freshPositionFrame,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout,
  morphEquation,
  nebula,
  orbitScene,
  pairingTrace,
  permissionMask,
  rotaryScore,
  rotateHead,
  rotatePair,
  rule,
  softmax,
  toBfloat16,
  txt,
};

/** One semantic color per concept across all 32 scenes of RoPE. */
export const ROLE = Object.freeze({
  query: COSMOS.cyan,
  key: COSMOS.gold,
  score: COSMOS.emerald,
  shift: COSMOS.violet,
  value: COSMOS.blue,
  danger: COSMOS.rose,
  alibi: COSMOS.amber,
  bands: Object.freeze([COSMOS.cyan, COSMOS.blue, COSMOS.violet, COSMOS.gold]),
});

/** Precomputed 4-pair rotary frequencies and RoPE constructive-interference kernel. */
export const KERNEL_FREQS = Array.from({ length: 16 }, (_, i) => Math.pow(10000, (-2 * i) / 32));

export function ropeKernel(delta, freqs = KERNEL_FREQS) {
  let sum = 0;
  for (let i = 0; i < freqs.length; i++) sum += Math.cos(delta * freqs[i]);
  return sum / freqs.length;
}

/** Build-time mathematical verification of every core number spoken across the 32 scenes. */
export function verifyRopeInvariants() {
  verifyApprox(contentOutputs[0][0], 0.802, 0.001, 'dogs unmasked output[0]');
  for (const angle of [0, 0.5, Math.PI, -2]) {
    const [x, y] = rotatePair([0.8, 0.6], angle);
    verifyApprox(Math.hypot(x, y), 1, 1e-12, `unit norm at angle ${angle}`);
  }
  const q4 = [0.3, 0.7, -0.8, 0.1];
  const k4 = [0.6, -0.2, 0.4, 0.9];
  const baseScore = rotaryScore(q4, k4, 5, 3, [0.5, 0.05]);
  for (const shift of [1, 8, 17, 100]) {
    verifyApprox(
      rotaryScore(q4, k4, 5 + shift, 3 + shift, [0.5, 0.05]),
      baseScore,
      1e-12,
      `shared shift invariance +${shift}`,
    );
  }
  verifyApprox(Math.cos(-1), 0.540302, 1e-5, 'cos(-1) score');
  verifyApprox(2 * Math.cos(-1), 1.080605, 1e-5, 'doubled query score');
  const unitHead = CLOCK_FREQUENCIES.flatMap(() => [1, 0]);
  const headDot = rotaryScore(unitHead, unitHead, 4, 2, CLOCK_FREQUENCIES);
  verifyApprox(headDot, 2.564, 0.001, '4-pair head dot product');
  verifyApprox(headDot / Math.sqrt(8), 0.906, 0.001, '4-pair scaled logit');
  verifyApprox(Math.cos(-2), -0.416, 0.001, 'fast pair cos(-2)');

  const abs2 = absoluteRow(2);
  verifyApprox(abs2[0], 0.909, 0.001, 'sin(2)');
  verifyApprox(abs2[1], -0.416, 0.001, 'cos(2)');

  const pair = pairingTrace();
  verifyApprox(pair.adjacent, -0.76, 0.001, 'adjacent pairing score');
  verifyApprox(pair.wrong, -1.616, 0.001, 'wrong split pairing score');
  verifyApprox(pair.converted, pair.adjacent, 1e-12, 'converted split pairing score');

  const axialScore = Math.cos(0.5) + 1;
  verifyApprox(axialScore, 1.878, 0.001, '2D axial score');

  const slopes8 = alibiSlopes(8);
  verifyApprox(slopes8[0], 0.5, 1e-12, 'ALiBi 8-head steepest');
  verifyApprox(slopes8[7], 1 / 256, 1e-12, 'ALiBi 8-head gentlest');
  const slopes3 = alibiSlopes(3);
  verifyApprox(slopes3[0], 1 / 16, 1e-12, 'ALiBi 3-head [0]');
  verifyApprox(slopes3[1], 1 / 256, 1e-12, 'ALiBi 3-head [1]');
  verifyApprox(slopes3[2], 1 / 4, 1e-12, 'ALiBi 3-head [2]');
  verifyApprox(softmax([4, 3.75])[1], 0.4378, 0.001, 'ALiBi gentle head share');
  verifyApprox(softmax([0, 1])[1], 0.7311, 0.001, 'ALiBi far content win');

  verifyInvariant(toBfloat16(4096) === 4096, 'BF16(4096) exact');
  verifyInvariant(toBfloat16(4097) === 4096, 'BF16(4097) collapses to 4096');
  verifyApprox(Math.cos(4096), 0.804, 0.001, 'FP32 cos(4096)');
  verifyApprox(Math.cos(4097), 0.935, 0.001, 'FP32 cos(4097)');

  const sched = frequencySchedules(4, 8, 10000, 4096);
  verifyApprox(sched.ntk[1] / sched.original[1], 0.63, 0.001, 'NTK 8D ratio 1');
  verifyApprox(sched.ntk[2] / sched.original[2], 0.397, 0.001, 'NTK 8D ratio 2');
  verifyApprox(sched.yarn[2], 0.003835, 1e-5, 'YaRN blended band 2');
  const yarnAmp = 1 + 0.1 * Math.log(4);
  verifyApprox(yarnAmp, 1.1386, 0.001, 'YaRN amplitude s=4');
  verifyApprox(yarnAmp * yarnAmp, 1.2965, 0.001, 'YaRN logit factor s=4');
  verifyApprox(1 / (yarnAmp * yarnAmp), 0.7713, 0.001, 'YaRN temperature s=4');

  const cache = cacheFixture();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      verifyApprox(cache.full[i][j], cache.incremental[i][j], 1e-12, `cache[${i}][${j}]`);
    }
  }
  const chunkMasked = cacheChunkInSlots([1, 2], [2, 0, 1], true);
  const chunkUnmasked = cacheChunkInSlots([1, 2], [2, 0, 1], false);
  verifyApprox(chunkMasked.outputs[0][2], 0, 1e-12, 'masked chunk hides future 802');
  verifyApprox(chunkUnmasked.outputs[0][2], 0.538, 0.001, 'unmasked chunk leaks 0.538');
  verifyApprox(chunkMasked.outputs[1][2], 0.568, 0.001, 'query 802 weight on 802');

  verifyApprox(Math.cos(-5), 0.2837, 0.001, 'stale key cos(-5)');
  verifyApprox(Math.cos(-1.2), 0.3624, 0.001, 'fresh position cos(-1.2)');
  verifyApprox(Math.cos(-7.6), 0.2508, 0.001, 'slot index wrong cos(-7.6)');
  verifyApprox(Math.cos((36 - 21) * 0.4), 0.9602, 0.001, 'double-rotated key cos(6)');
}

/** Bound any clip duration safely inside the scene window so it never runs past narration. */
export function safeDur(c, startTime, desired = 0.8, margin = 0.22) {
  const avail = c.end - startTime - margin;
  return Math.max(0.08, Math.min(desired, avail));
}

/** Run an animation safely on a cue start, clamped to the remaining scene window. */
export function playOn(s, c, cueId, makeAnim, desired = 0.75, offset = 0) {
  const cue = c.cue(cueId);
  const t = cue.start + offset;
  const dur = safeDur(c, t, desired);
  c.on(cueId, () => s.play(makeAnim(dur)), offset);
  return cue;
}

/** Run an animation safely after a cue finishes, clamped to the remaining scene window. */
export function playAfter(s, c, cueId, makeAnim, desired = 0.55, offset = 0) {
  const cue = c.cue(cueId);
  const t = cue.end + offset;
  const dur = safeDur(c, t, desired);
  c.after(cueId, () => s.play(makeAnim(dur)), offset);
  return cue;
}

/**
 * Bind every listed cue to a smooth `step` Value so every narration phrase advances the scene
 * without ever leaving an unused cue or overflowing the scene window.
 */
export function bindStepCues(s, c, stepVal, cueIds, desired = 0.45) {
  cueIds.forEach((id, index) => {
    const target = index + 1;
    const cue = c.cue(id);
    const dur = safeDur(c, cue.start, desired);
    c.on(id, () => s.play(stepVal.to(target, { duration: dur })));
  });
}

/** Mark purely atmospheric backdrop elements (stars, soft radial auras) so checkFilm knows they are backdrop. */
export function markDecoration(node) {
  node.data.decoration = true;
  return node;
}

/** Soft decorative radial aura behind hero 3D/2D constructions (never triggers false text_crowded). */
export function cinemaAura(x, y, radius, innerHex, midHex = '#07091000') {
  return markDecoration(aura(x, y, radius, innerHex, midHex));
}

/** Deterministic deep-space starfield marked as backdrop decoration. */
export function cinemaStars(count = 130, seed = 1, accentHex = COSMOS.gold) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const sx = Math.sin((i + seed * 19) * 127.1 + 3.7) * 43758.5453;
    const sy = Math.sin((i + seed * 31) * 269.5 + 9.1) * 19642.349;
    const x = -940 + (sx - Math.floor(sx)) * 1880;
    const y = -520 + (sy - Math.floor(sy)) * 1040;
    const r = 0.7 + (i % 4) * 0.32;
    const op = 0.14 + (i % 5) * 0.055;
    out.push(
      dot(r, i % 11 === 0 ? accentHex : '#8ea4d2')
        .opacity(op)
        .at(x, y),
    );
  }
  return markDecoration(group(...out).zIndex(-99));
}

/** Glowing 2D rotary compass dial with optional query, key, orthogonal projection, and wake arcs. */
export function clockDial({
  cx,
  cy,
  radius = 180,
  queryAngle = 0,
  keyAngle = null,
  queryLength = 1,
  keyLength = 1,
  showProj = false,
  showAngleArc = false,
  showAxes = true,
  showWake = true,
  queryColor = ROLE.query,
  keyColor = ROLE.key,
  projColor = ROLE.score,
  ringColor = '#3f5484',
  auraColor = '#5ce1e61c',
  title = '',
  subtitle = '',
  titleColor = COSMOS.ink,
  subColor = COSMOS.muted,
} = {}) {
  const nodes = [];
  void auraColor;
  nodes.push(
    circle(radius, { fill: null, stroke: ringColor, width: 2.4 }).at(cx, cy),
    circle(radius * 0.52, { fill: null, stroke: '#273558', width: 1.4, dash: [5, 8] }).at(cx, cy),
  );
  if (showAxes) {
    nodes.push(
      line([cx - radius - 22, cy], [cx + radius + 22, cy], { stroke: '#304066', width: 1.5 }),
      line([cx, cy - radius - 22], [cx, cy + radius + 22], { stroke: '#304066', width: 1.5 }),
    );
  }
  for (let t = 0; t < 12; t++) {
    const a = (t * Math.PI) / 6;
    nodes.push(
      line(
        [cx + Math.cos(a) * (radius - 7), cy + Math.sin(a) * (radius - 7)],
        [cx + Math.cos(a) * (radius + 6), cy + Math.sin(a) * (radius + 6)],
        { stroke: '#6d83b8', width: 1.8 },
      ).opacity(0.65),
    );
  }

  // Standard mathematical angles (CCW positive -> inverted screen y)
  const pt = (ang, len) => [cx + Math.cos(ang) * radius * len, cy - Math.sin(ang) * radius * len];
  const [qx, qy] = pt(queryAngle, queryLength);
  const qScreenAng = -queryAngle;

  if (showWake && Math.abs(queryAngle) > 0.05) {
    const trail = Math.min(0.75, Math.abs(queryAngle));
    const fromA = queryAngle >= 0 ? qScreenAng : qScreenAng - trail;
    const toA = queryAngle >= 0 ? qScreenAng + trail : qScreenAng;
    nodes.push(
      arc(radius, fromA, toA, { fill: null, stroke: queryColor, width: 5.5 })
        .at(cx, cy)
        .opacity(0.68)
        .glow(10, queryColor)
        .set('blend', 'screen'),
    );
  }

  if (keyAngle !== null) {
    const [kx, ky] = pt(keyAngle, keyLength);
    const kScreenAng = -keyAngle;
    if (showWake && Math.abs(keyAngle) > 0.05) {
      const trail = Math.min(0.65, Math.abs(keyAngle));
      const fromA = keyAngle >= 0 ? kScreenAng : kScreenAng - trail;
      const toA = keyAngle >= 0 ? kScreenAng + trail : kScreenAng;
      nodes.push(
        arc(radius, fromA, toA, { fill: null, stroke: keyColor, width: 5.0 })
          .at(cx, cy)
          .opacity(0.62)
          .glow(10, keyColor)
          .set('blend', 'screen'),
      );
    }

    if (showAngleArc) {
      let delta = keyAngle - queryAngle;
      while (delta <= -Math.PI) delta += TAU;
      while (delta > Math.PI) delta -= TAU;
      const a0 = -queryAngle;
      const a1 = -(queryAngle + delta);
      const lo = Math.min(a0, a1);
      const hi = Math.max(a0, a1);
      if (hi - lo > 0.03) {
        nodes.push(
          arc(radius * 0.44, lo, hi, { fill: null, stroke: projColor, width: 5.0 })
            .at(cx, cy)
            .opacity(0.92)
            .glow(10, projColor)
            .set('blend', 'screen'),
        );
      }
    }

    if (showProj) {
      // Orthogonal projection of key onto query unit axis
      const proj = keyLength * Math.cos(keyAngle - queryAngle);
      const [fx, fy] = pt(queryAngle, proj);
      const [negX, negY] = pt(queryAngle, -1);
      const [posX, posY] = pt(queryAngle, Math.max(1, queryLength));
      nodes.push(
        line([negX, negY], [posX, posY], { stroke: '#4d608e', width: 1.8, dash: [4, 6] }),
        line([kx, ky], [fx, fy], { stroke: projColor, width: 2.2, dash: [5, 5] }).opacity(0.82),
        line([cx, cy], [fx, fy], { stroke: projColor, width: 6.0 })
          .glow(10, projColor)
          .set('blend', 'screen'),
        glowDot(fx, fy, { radius: 7, color: projColor, glow: 12 }),
      );
    }

    nodes.push(
      arrow([cx, cy], [kx, ky], { stroke: keyColor, width: 4.4, tip: 16 }).glow(8, keyColor),
      glowDot(kx, ky, { radius: 6.5, color: '#ffffff', glow: 12 }),
    );
  }

  nodes.push(
    arrow([cx, cy], [qx, qy], { stroke: queryColor, width: 4.8, tip: 17 }).glow(9, queryColor),
    glowDot(qx, qy, { radius: 6.5, color: '#ffffff', glow: 12 }),
    glowDot(cx, cy, { radius: 5.5, color: '#ffffff', glow: 10 }),
  );

  if (title) {
    nodes.push(txt(title, cx, cy + radius + 50, 28, titleColor, 'mono'));
  }
  if (subtitle) {
    nodes.push(txt(subtitle, cx, cy + radius + 88, 26, subColor, 'mono'));
  }
  return group(...nodes);
}

/** Glowing horizontal signed score ruler with optional reference tick and glowing score orb. */
export function signedRuler({
  x,
  y,
  width = 560,
  min = -1,
  max = 1,
  value = null,
  reference = null,
  color = ROLE.score,
  label = '',
  valueText = '',
} = {}) {
  const mapX = (v) => x + ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * width;
  const zeroX = mapX(0);
  const nodes = [
    line([x, y], [x + width, y], { stroke: '#3c4d75', width: 3 }),
    line([x, y - 12], [x, y + 12], { stroke: '#5d72a4', width: 2.4 }),
    line([zeroX, y - 14], [zeroX, y + 14], { stroke: '#7b91c4', width: 2.6 }),
    line([x + width, y - 12], [x + width, y + 12], { stroke: '#5d72a4', width: 2.4 }),
    txt(String(min), x, y + 40, 26, COSMOS.dim, 'mono'),
    txt('0', zeroX, y + 40, 26, COSMOS.muted, 'mono'),
    txt(String(max), x + width, y + 40, 26, COSMOS.dim, 'mono'),
  ];
  if (label) {
    nodes.push(txt(label, x, y - 42, 26, COSMOS.muted, 'mono', 'left'));
  }
  if (reference !== null) {
    const rx = mapX(reference);
    nodes.push(
      line([rx, y - 28], [rx, y + 18], { stroke: '#ffffff', width: 3.6 })
        .glow(8, '#ffffff')
        .set('blend', 'screen'),
    );
  }
  if (value !== null) {
    const vx = mapX(value);
    nodes.push(
      line([zeroX, y], [vx, y], { stroke: color, width: 6.5 })
        .glow(10, color)
        .set('blend', 'screen'),
      glowDot(vx, y, { radius: 9, color: '#ffffff', glow: 14 }),
    );
    if (valueText) {
      nodes.push(txt(valueText, x + width, y - 42, 28, color, 'mono', 'right').glow(5, color));
    }
  }
  return group(...nodes);
}

/** Glowing vertical projection gauge (+1 / 0 / -1) modeled on vizmatic-public-videos clocks.ts. */
export function verticalGauge({
  x = 760,
  top = -205,
  bot = 215,
  value = 0,
  color = ROLE.score,
  caption = 'cos(Δθ)',
  tag = '',
} = {}) {
  const mid = (top + bot) * 0.5;
  const half = (bot - top) * 0.5;
  const clamped = Math.max(-1, Math.min(1, value));
  const gy = mid - clamped * half;
  const barH = Math.max(4, Math.abs(mid - gy));
  const barCy = (mid + gy) * 0.5;
  const nodes = [
    rect(44, bot - top + 16, {
      fill: '#0e1529',
      stroke: '#2d3d64',
      width: 2.0,
      radius: 12,
    }).at(x, mid),
    line([x - 28, mid], [x + 28, mid], { stroke: '#4d608e', width: 1.6 }),
    line([x - 24, top], [x + 24, top], { stroke: '#3a4a70', width: 1.4 }),
    line([x - 24, bot], [x + 24, bot], { stroke: '#3a4a70', width: 1.4 }),
    txt('+1', x + 38, top, 26, COSMOS.dim, 'mono', 'left'),
    txt('0', x + 38, mid, 26, COSMOS.dim, 'mono', 'left'),
    txt('-1', x + 38, bot, 26, COSMOS.dim, 'mono', 'left'),
    rect(26, barH, { fill: color, stroke: null, radius: 6 })
      .at(x, barCy)
      .opacity(0.66)
      .glow(10, color)
      .set('blend', 'screen'),
    line([x - 26, gy], [x + 26, gy], { stroke: '#ffffff', width: 3.0 })
      .glow(10, color)
      .set('blend', 'screen'),
    glowDot(x, gy, { radius: 6.5, color: '#ffffff', glow: 12 }),
    txt(caption, x, top - 52, 26, color, 'mono').glow(4, color),
    txt(value.toFixed(2), x, bot + 50, 30, color, 'mono').glow(5, color),
  ];
  if (tag) {
    nodes.push(txt(tag, x, bot + 88, 26, COSMOS.muted, 'mono'));
  }
  return group(...nodes);
}

/** Orbiting 3D multi-frequency helical ribbons with racing phase beads (adapted from helix3d.ts). */
export const HELIX_BANDS = Object.freeze([
  { freq: 1.0, radius: 0.92, color: COSMOS.cyan, width: 4.4, glow: 10 },
  { freq: 0.45, radius: 1.48, color: COSMOS.blue, width: 3.8, glow: 9 },
  { freq: 0.22, radius: 2.02, color: COSMOS.violet, width: 3.8, glow: 9 },
  { freq: 0.115, radius: 2.55, color: COSMOS.gold, width: 4.6, glow: 11 },
]);

export function buildHelix3d({
  x = 275,
  y = 10,
  raceT,
  theta = -0.92,
  phi = 1.12,
  distance = 17.6,
  unit = 100,
  scaleVal = null,
} = {}) {
  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    ambient: 0.42,
    shine: 0.32,
    brightness: 1.1,
    fog: 0.12,
    focus: [0, 0, 0],
  }).at(x, y);

  // Translucent 2D clock dial end-cap at m = 0 (x = -4.5)
  view.add(
    parametricSurface((r, a) => [-4.5, r * Math.cos(a), r * Math.sin(a)], [0.08, 2.75], [0, TAU], {
      resolution: [6, 36],
      color: '#1e2c54',
      opacity: 0.24,
      mesh: '#5ce1e6',
      meshOpacity: 0.14,
      meshWidth: 0.65,
      shaded: false,
    }),
  );
  for (const band of HELIX_BANDS) {
    view.add(
      curve3d(
        (t) => [-4.5, Math.cos(t * TAU) * band.radius, Math.sin(t * TAU) * band.radius],
        0,
        1,
        {
          color: band.color,
          width: 2.0,
          opacity: 0.55,
          glow: 5,
          blend: 'screen',
          samples: 64,
        },
      ),
    );
  }
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    view.add(
      line3d(
        [-4.5, Math.cos(a) * 2.52, Math.sin(a) * 2.52],
        [-4.5, Math.cos(a) * 2.82, Math.sin(a) * 2.82],
        { color: '#93c5fd', width: 2.0, opacity: 0.72 },
      ),
    );
  }

  // Central spine axis m = 0 -> N
  view.add(
    line3d([-4.8, 0, 0], [4.8, 0, 0], {
      color: '#ffffff',
      width: 3.6,
      opacity: 0.92,
      glow: 8,
      blend: 'screen',
    }),
    label3d('m = 0', [-4.5, 0, 3.05], { size: 26, color: COSMOS.gold, math: false }),
    label3d('m = N', [5.15, 0, 0.15], {
      size: 26,
      color: COSMOS.cyan,
      math: false,
      offset: [24, -22],
    }),
  );

  for (let k = 0; k <= 8; k++) {
    const sx = -4.5 + (9.0 * k) / 8;
    view.add(point3d([sx, 0, 0], { color: COSMOS.gold, radius: 5.5, glow: 8, blend: 'screen' }));
  }

  for (let bIdx = 0; bIdx < HELIX_BANDS.length; bIdx++) {
    const band = HELIX_BANDS[bIdx];
    const freqScale = scaleVal ? () => 1 / Math.max(1, scaleVal.value) : () => 1;
    view.add(
      curve3d(
        (t) => {
          const m = t * 48;
          const px = -4.5 + t * 9.0;
          const ang = m * band.freq * (scaleVal ? 1 / Math.max(1, scaleVal.value) : 1);
          return [px, Math.cos(ang) * band.radius, Math.sin(ang) * band.radius];
        },
        0,
        1,
        {
          color: band.color,
          width: band.width,
          glow: band.glow,
          blend: 'screen',
          samples: 260,
          opacity: 0.94,
        },
      ),
      line3d(
        () => [-4.5 + ((raceT.value + bIdx * 0.06) % 1) * 9.0, 0, 0],
        () => {
          const t = (raceT.value + bIdx * 0.06) % 1;
          const m = t * 48;
          const px = -4.5 + t * 9.0;
          const ang = m * band.freq * freqScale();
          return [px, Math.cos(ang) * band.radius, Math.sin(ang) * band.radius];
        },
        { color: band.color, width: 2.2, opacity: 0.72, glow: 6, blend: 'screen' },
      ),
      point3d(
        () => {
          const t = (raceT.value + bIdx * 0.06) % 1;
          const m = t * 48;
          const px = -4.5 + t * 9.0;
          const ang = m * band.freq * freqScale();
          return [px, Math.cos(ang) * band.radius, Math.sin(ang) * band.radius];
        },
        { color: '#ffffff', radius: 8.0, glow: 12, blend: 'screen' },
      ),
      point3d(
        () => {
          const t = (raceT.value + 0.5 + bIdx * 0.06) % 1;
          const m = t * 48;
          const px = -4.5 + t * 9.0;
          const ang = m * band.freq * freqScale();
          return [px, Math.cos(ang) * band.radius, Math.sin(ang) * band.radius];
        },
        { color: band.color, radius: 6.5, glow: 12, blend: 'screen' },
      ),
      line3d([-4.5, 0, 0], [-4.5, band.radius, 0], {
        color: band.color,
        width: 2.4,
        opacity: 0.75,
        glow: 6,
        blend: 'screen',
      }),
      point3d([-4.5, band.radius, 0], {
        color: '#ffffff',
        radius: 5.5,
        glow: 10,
        blend: 'screen',
      }),
    );
  }
  return view;
}

/** Orbiting 3D constructive-interference K(Delta) decay surface (adapted from helix3d.ts). */
const DELTA_MAX = 36;
const WX_HALF = 4.2;
const WY_HALF = 2.6;

function surfaceHeight(wx, wy) {
  const u = Math.max(0, Math.min(1, (wx + WX_HALF) / (2 * WX_HALF)));
  const v = Math.max(0, Math.min(1, (wy + WY_HALF) / (2 * WY_HALF)));
  const delta = u * DELTA_MAX;
  const theta = Math.pow(10000, -0.16 - v * 0.78);
  const wave = Math.cos(delta * theta) * Math.exp(-delta * 0.032);
  const kernelVal = ropeKernel(delta, KERNEL_FREQS);
  return 0.48 * wave + 1.42 * kernelVal;
}

export function buildDecaySurface3d({
  x = 295,
  y = -24,
  theta = -0.82,
  phi = 1.04,
  distance = 20.2,
  unit = 92,
} = {}) {
  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    ambient: 0.38,
    shine: 0.34,
    brightness: 1.1,
    fog: 0.1,
    focus: [0, 0, 0.45],
  }).at(x, y);

  const decaySurface = surface((wx, wy) => surfaceHeight(wx, wy), {
    x: [-WX_HALF, WX_HALF],
    y: [-WY_HALF, WY_HALF],
    resolution: [56, 44],
    colors: ['#090d22', '#1e2761', '#4c2f8a', '#2180c2', '#5ce1e6', '#ffd166'],
    mesh: '#7ce8ff',
    meshOpacity: 0.2,
    meshWidth: 0.65,
    opacity: 0.84,
  });

  const baseZ = -0.35;
  const axisLines = [
    line3d([-WX_HALF, -WY_HALF, baseZ], [WX_HALF + 0.4, -WY_HALF, baseZ], {
      color: '#7084b4',
      width: 2.2,
      opacity: 0.85,
    }),
    line3d([-WX_HALF, -WY_HALF, baseZ], [-WX_HALF, WY_HALF + 0.4, baseZ], {
      color: '#7084b4',
      width: 2.2,
      opacity: 0.85,
    }),
    line3d([-WX_HALF, -WY_HALF, baseZ], [-WX_HALF, -WY_HALF, 2.45], {
      color: COSMOS.gold,
      width: 2.4,
      opacity: 0.88,
      glow: 6,
      blend: 'screen',
    }),
    label3d('Δ', [WX_HALF + 0.85, -WY_HALF - 0.55, baseZ], {
      size: 28,
      color: COSMOS.cyan,
      math: false,
    }),
    label3d('Band i', [-WX_HALF - 1.65, WY_HALF + 2.05, 0.75], {
      size: 26,
      color: COSMOS.violet,
      math: false,
      offset: [-32, -24],
    }),
    label3d('K(Δ)', [-WX_HALF, -WY_HALF, 2.85], {
      size: 28,
      color: COSMOS.gold,
      math: false,
    }),
  ];

  const sliceSpecs = [
    { bandFrac: 0.14, color: COSMOS.cyan },
    { bandFrac: 0.42, color: COSMOS.blue },
    { bandFrac: 0.7, color: COSMOS.violet },
    { bandFrac: 0.92, color: COSMOS.rose },
  ];
  const cosineSlices = sliceSpecs.map((sl) => {
    const wy = -WY_HALF + sl.bandFrac * (2 * WY_HALF);
    return curve3d(
      (t) => {
        const wx = -WX_HALF + t * (2 * WX_HALF);
        return [wx, wy, surfaceHeight(wx, wy) + 0.04];
      },
      0,
      1,
      {
        color: sl.color,
        width: 2.8,
        glow: 8,
        blend: 'screen',
        samples: 140,
        opacity: 0.88,
        bias: 0.08,
      },
    );
  });

  const kernelRidge = curve3d(
    (t) => {
      const delta = t * DELTA_MAX;
      const wx = -WX_HALF + t * (2 * WX_HALF);
      const k = ropeKernel(delta, KERNEL_FREQS);
      return [wx, -WY_HALF - 0.14, 0.42 + k * 1.85];
    },
    0,
    1,
    {
      color: COSMOS.gold,
      width: 5.6,
      glow: 14,
      blend: 'screen',
      samples: 180,
      opacity: 1,
      bias: 0.12,
    },
  );

  view.add(
    decaySurface,
    ...axisLines,
    ...cosineSlices,
    kernelRidge,
    point3d([-WX_HALF, -WY_HALF - 0.14, 2.27], {
      color: '#ffffff',
      radius: 8.5,
      glow: 14,
      blend: 'screen',
    }),
  );
  return view;
}

/** Glowing proportional probability strip (no slide-card clutter). */
export function shareStrip({
  x,
  y,
  width = 560,
  height = 46,
  shares = [0.5, 0.5],
  colors = [COSMOS.cyan, COSMOS.gold],
  labels = [],
} = {}) {
  const nodes = [
    rect(width, height, { fill: '#0d1324', stroke: '#29375a', width: 1.8, radius: 10 }).at(
      x + width / 2,
      y,
    ),
  ];
  let cursor = x;
  shares.forEach((share, i) => {
    const w = Math.max(0, share * width);
    const col = colors[i % colors.length];
    if (w > 2) {
      nodes.push(
        rect(w, height - 6, { fill: col, stroke: null, radius: 6 })
          .at(cursor + w / 2, y)
          .opacity(0.84)
          .glow(6, col)
          .set('blend', 'screen'),
      );
    }
    if (labels[i] && w > labels[i].length * 18 + 30) {
      nodes.push(txt(labels[i], cursor + w / 2, y, 26, '#070910', 'mono'));
    }
    cursor += w;
  });
  return group(...nodes);
}

/** Glowing wave curve helper for 2D cosine/interference plots. */
export function wavePath(x0, x1, yMid, amp, fn, samples = 140) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = x0 + (x1 - x0) * t;
    const y = yMid - amp * fn(t);
    pts.push([x, y]);
  }
  return pts;
}

export function glowingCurve(pts, color, { width = 4.2, glow = 10, gradientColors } = {}) {
  const path = polyPath(pts);
  const paint =
    Array.isArray(gradientColors) && gradientColors.length >= 2
      ? linearGradient(pts[0], pts.at(-1), gradientColors)
      : color;
  const gCol = Array.isArray(gradientColors) ? gradientColors.at(-1) : color;
  return group(
    new Node(path).stroke(paint, width, 0.94).glow(glow, gCol).set('blend', 'screen'),
    new Node(path).stroke('#ffffff', 1.2, 0.42).set('blend', 'screen'),
  );
}
