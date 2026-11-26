// Shared math models, invariants, color semantics, and 3D/vector cinema helpers for low-precision-kernels.
import {
  Node,
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
import { delayedScaleReplay } from '../../films/low-precision-kernels/construction.mjs';
import {
  additions,
  blockScale,
  decode8,
  encode8,
  even,
  floatAdds,
  grids,
  halfAdds,
  hexByte,
  prefixes,
  roundHalf,
  roundTrip,
  roundedOverflow,
  stochasticNeighbor,
  sum,
} from '../../films/low-precision-kernels/encoding.mjs';
import {
  large,
  rows,
  small,
  weightPattern,
  weights,
} from '../../films/low-precision-kernels/fixtures.mjs';
import {
  blockContraction,
  experiment,
  freshGroupWorksheet,
  orientationWorksheet,
  projection,
  scaleExperiment,
} from '../../films/low-precision-kernels/model.mjs';
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

// Precomputed verified mathematical constants from the lesson model.
export const STALE_RT = roundTrip(500, 10 / 448);
export const CURRENT_RT = roundTrip(500, 500 / 448);
export const OVF_449 = roundedOverflow(449);
export const OVF_465_SAT = roundedOverflow(465, { saturate: true, format: 'e4m3' });
export const OVF_465_NONSAT = roundedOverflow(465, { saturate: false, format: 'e4m3' });
export const OVF_E5M2_65536 = roundedOverflow(65536, { saturate: false, format: 'e5m2' });
export const SR_101 = stochasticNeighbor(1.01, 1, 1.125);
export const PROJ_MIXED = projection(false);
export const PROJ_ONEHOT = projection(true);
export const BLOCK_CONTRACT = blockContraction();
export const ORIENT_WS = orientationWorksheet();
export const FRESH_TOGETHER = freshGroupWorksheet(false);
export const FRESH_SEPARATE = freshGroupWorksheet(true);
export const DELAYED_DONE = delayedScaleReplay(1);

export const E4M3_D = 2 ** -9;
export const E5M2_D = 2 ** -16;
export const LAYERNORM_SPIKE = Math.sqrt(1023);

/** Build-time mathematical verification of every core identity in low-precision-kernels. */
export function verifyLowPrecisionInvariants() {
  verifyApprox(decode8(0x38, 'ocp'), 1, 1e-12, 'OCP 0x38 decodes to 1');
  verifyApprox(decode8(0x7e, 'ocp'), 448, 1e-12, 'OCP 0x7e decodes to 448');
  verifyApprox(decode8(1, 'ocp'), E4M3_D, 1e-12, 'OCP min subnormal = 2^-9');
  verifyInvariant(Number.isNaN(decode8(0x7f, 'ocp')), 'OCP 0x7f is NaN');
  verifyInvariant(Object.is(decode8(0x80, 'ocp'), -0), 'OCP 0x80 is -0');
  verifyInvariant(Number.isNaN(decode8(0x80, 'fnuz')), 'FNUZ 0x80 is NaN');
  verifyApprox(decode8(0x38, 'fnuz'), 0.5, 1e-12, 'FNUZ 0x38 decodes to 0.5');
  verifyInvariant(encode8(1.0625).code === 0x38, '1.0625 ties to even 1.0 (0x38)');
  verifyInvariant(encode8(1.1875).code === 0x3a, '1.1875 ties to even 1.25 (0x3a)');
  verifyInvariant(encode8(500).value === 448, '500 saturates to 448');
  verifyInvariant(encode8(1, 'fnuz').code === 0x40, 'FNUZ encodes 1 as 0x40');

  verifyApprox(STALE_RT.scaled, 22400, 1e-9, '500 / (10/448) = 22400');
  verifyApprox(STALE_RT.reconstructed, 10, 1e-12, 'stale reconstruction returns 10');
  verifyApprox((500 - STALE_RT.reconstructed) / 500, 0.98, 1e-12, '98% relative loss');
  verifyApprox(CURRENT_RT.scaled, 448, 1e-12, '500 / (500/448) = 448');
  verifyApprox(CURRENT_RT.reconstructed, 500, 1e-12, 'current reconstruction returns 500');

  verifyInvariant(
    OVF_449.rounded === 448 && !OVF_449.overflow,
    '449 rounds to 448 without overflow',
  );
  verifyInvariant(
    OVF_465_SAT.rounded === 480 && OVF_465_SAT.overflow && OVF_465_SAT.result === 448,
    '465 rounds to 480 and saturates to 448',
  );
  verifyInvariant(Number.isNaN(OVF_465_NONSAT.result), 'non-saturating E4M3 overflow gives NaN');
  verifyInvariant(OVF_E5M2_65536.result === Infinity, 'non-saturating E5M2 65536 gives +Inf');

  verifyApprox(SR_101.p, 0.08, 1e-12, 'stochastic upper probability for 1.01 is 0.08');
  verifyApprox(SR_101.expected, 1.01, 1e-12, 'stochastic expectation equals 1.01');

  verifyInvariant(experiment.scales[0] === 2 ** -8 && experiment.scales[1] === 2, 'row scales');
  verifyInvariant(experiment.tensor[0][0].reconstructed === 0, 'tensor scale wipes 0.001');
  verifyApprox(experiment.block[0][0].reconstructed, 0.0009765625, 1e-12, 'MX rescues 0.001');
  verifyInvariant(experiment.block[1][3].reconstructed === 512, 'MX rounds 500 to 512');
  verifyInvariant(experiment.block[1][7].reconstructed === -256, 'MX rounds -250 to -256');
  verifyApprox(experiment.reference[1], 7.75, 1e-12, 'original row 1 dot = 7.75');
  verifyApprox(experiment.blockOutput[1], 7.75, 1e-12, 'reconstructed row 1 dot = 7.75');
  verifyApprox(PROJ_ONEHOT.original.at(-1), 500, 1e-12, 'one-hot original = 500');
  verifyApprox(PROJ_ONEHOT.reconstructed.at(-1), 512, 1e-12, 'one-hot reconstructed = 512');

  verifyInvariant(
    BLOCK_CONTRACT.correct === 34 && BLOCK_CONTRACT.wrong === 25,
    'block contraction',
  );
  verifyInvariant(halfAdds[4] === 1024 && floatAdds[4] === 1025, 'FP16 vs FP32 accumulation');
  verifyInvariant(
    ORIENT_WS.rowScales[0] === 2 && ORIENT_WS.columnScales[1] === 2 ** -8,
    'orient scales',
  );
  verifyInvariant(ORIENT_WS.rowTiny.reconstructed === 0, 'row orientation wipes 0.001');
  verifyApprox(ORIENT_WS.columnTiny.reconstructed, 0.0009765625, 1e-12, 'column rescues 0.001');

  verifyInvariant(
    FRESH_TOGETHER.scale === 2 &&
      FRESH_TOGETHER.tiny.reconstructed === 0 &&
      FRESH_TOGETHER.spike.reconstructed === 704 &&
      FRESH_TOGETHER.zeroScale === 1,
    'fresh group joined invariants',
  );
  verifyInvariant(
    FRESH_SEPARATE.scales[0] === 2 ** -18 &&
      FRESH_SEPARATE.scales[1] === 2 &&
      FRESH_SEPARATE.tiny.reconstructed === 0.0009765625 &&
      FRESH_SEPARATE.spike.reconstructed === 704,
    'fresh group split invariants',
  );
  verifyInvariant(
    DELAYED_DONE.observedMax === 700 && DELAYED_DONE.history[0] === 700,
    'delayed replay',
  );
}

/** Safe duration inside a scene window so an animation never outruns narration. */
export function safeDuration(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

/** Safe duration from a specific cue start to the scene end. */
export function remainDuration(c, cueId, maxDur = 2.0, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.25, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

/** Safe duration from a cue end (`after`) to the scene end. */
export function afterDuration(c, cueId, maxDur = 0.55, endMargin = 0.45) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.2, c.end - cue.end - endMargin);
  return Math.min(maxDur, avail);
}

/** Schedule a continuous ambient phase animation across the whole scene. */
export function runPhase(s, c, phaseVal, target = 12, startOffset = 0.08) {
  const dur = safeDuration(c, startOffset, 0.55);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/** Clean translucent dark-glass container cell (no slide chrome). */
export function glassCell(
  x,
  y,
  w,
  h,
  strokeColor = COSMOS.cyan,
  { fill = '#0d1426', radius = 10, glow = 6, opacity = 0.92, dash } = {},
) {
  const r = rect(w, h, { fill, stroke: strokeColor, width: 2.2, radius, dash })
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

/** Shaded glowing 3D silicon tier slab (for HBM / Tensor Core / CUDA Core hierarchy views). */
export function siliconSlab3d(
  halfX,
  halfY,
  zTop,
  thickness,
  fillColor,
  edgeColor,
  meshColor,
  opacity = 0.62,
) {
  const zBot = zTop - thickness;
  const topFace = parametricSurface(
    (u, v) => [(u * 2 - 1) * halfX, (v * 2 - 1) * halfY, zTop],
    [0, 1],
    [0, 1],
    {
      resolution: [8, 6],
      color: fillColor,
      mesh: meshColor,
      meshOpacity: 0.28,
      meshWidth: 0.7,
      opacity,
      shaded: true,
    },
  );
  const frontFace = parametricSurface(
    (u, v) => [(u * 2 - 1) * halfX, -halfY, zBot + v * thickness],
    [0, 1],
    [0, 1],
    { resolution: [6, 2], color: fillColor, mesh: false, opacity: opacity * 0.75, shaded: true },
  );
  const rightFace = parametricSurface(
    (u, v) => [halfX, (u * 2 - 1) * halfY, zBot + v * thickness],
    [0, 1],
    [0, 1],
    { resolution: [6, 2], color: fillColor, mesh: false, opacity: opacity * 0.62, shaded: true },
  );
  const edges = wireframeSlab3d([0, 0, zTop - thickness * 0.5], halfX, halfY, thickness * 0.5, {
    color: edgeColor,
    width: 2.6,
    glow: 7,
  });
  return [topFace, frontFace, rightFace, ...edges];
}

/** Shaded 3D rectangular prism for tensor blocks, scale tiles, and systolic MMA arrays. */
export function box3d(x0, y0, z0, dx, dy, dz, fillColor, edgeColor, opacity = 0.72) {
  const opts = { resolution: [1, 1], color: fillColor, opacity, mesh: false, shaded: true };
  const edges = wireframeSlab3d(
    [x0 + dx * 0.5, y0 + dy * 0.5, z0 + dz * 0.5],
    dx * 0.5,
    dy * 0.5,
    dz * 0.5,
    {
      color: edgeColor,
      width: 2.2,
      glow: 6,
    },
  );
  return [
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z0 + dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + dx, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
    ...edges,
  ];
}

/** Render an 8-bit FP8 or E8M0 glowing bit-cell register centered at (cx, cy). */
export function bitStrip8(
  code,
  cx,
  cy,
  {
    cellW = 58,
    cellH = 60,
    gap = 6,
    mode = 'e4m3',
    highlightIndices = [],
    opacity = 1,
    showFieldLabels = true,
  } = {},
) {
  const bits = code.toString(2).padStart(8, '0').split('');
  const totalW = 8 * cellW + 7 * gap;
  const x0 = cx - totalW * 0.5;
  const nodes = [];
  for (let i = 0; i < 8; i++) {
    const bx = x0 + i * (cellW + gap) + cellW * 0.5;
    let stroke = COSMOS.cyan;
    let fill = '#0f2336';
    if (mode === 'e8m0') {
      stroke = COSMOS.blue;
      fill = '#111e3b';
    } else if (i === 0) {
      stroke = COSMOS.rose;
      fill = '#2a1224';
    } else if (mode === 'e5m2' ? i <= 5 : i <= 4) {
      stroke = COSMOS.blue;
      fill = '#111e3b';
    }
    const isHl = highlightIndices.includes(i);
    if (isHl) {
      stroke = COSMOS.gold;
      fill = '#2c2210';
    }
    nodes.push(
      rect(cellW, cellH, { fill, stroke, width: isHl ? 3.2 : 2.0, radius: 7 })
        .at(bx, cy)
        .glow(isHl ? 9 : 4, stroke)
        .opacity(opacity),
      txt(bits[i], bx, cy, 30, isHl ? COSMOS.gold : COSMOS.ink, 'mono').opacity(opacity),
    );
  }
  if (showFieldLabels) {
    const labelY = cy + cellH * 0.5 + 32;
    if (mode === 'e8m0') {
      nodes.push(
        txt('8 exponent bits (unsigned)', cx, labelY, 26, COSMOS.blue, 'mono').opacity(opacity),
      );
    } else if (mode === 'e5m2') {
      const signX = x0 + cellW * 0.5;
      const expX = x0 + 3 * (cellW + gap) + cellW * 0.5;
      const fracX = x0 + 6.5 * (cellW + gap) + cellW * 0.5;
      nodes.push(
        txt('S', signX, labelY, 26, COSMOS.rose, 'mono').opacity(opacity),
        txt('5 exp', expX, labelY, 26, COSMOS.blue, 'mono').opacity(opacity),
        txt('2 frac', fracX, labelY, 26, COSMOS.cyan, 'mono').opacity(opacity),
      );
    } else {
      const signX = x0 + cellW * 0.5;
      const expX = x0 + 2.5 * (cellW + gap) + cellW * 0.5;
      const fracX = x0 + 6 * (cellW + gap) + cellW * 0.5;
      nodes.push(
        txt('S', signX, labelY, 26, COSMOS.rose, 'mono').opacity(opacity),
        txt('4 exp', expX, labelY, 26, COSMOS.blue, 'mono').opacity(opacity),
        txt('3 frac', fracX, labelY, 26, COSMOS.cyan, 'mono').opacity(opacity),
      );
    }
  }
  return group(...nodes);
}

/** Smooth 3D saturation cliff terrain for intro & overflow scenes. */
export function buildSaturationCliff3d(pulseVal, { x = 350, y = 20, capProgressVal } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.2,
    unit: 102,
    focus: [0, 0, 0.85],
  }).at(x, y);

  // Smooth ramp rising along x from -2.8 to 2.8, flattening sharply at the E4M3 448 ceiling plateau
  const cliffSurface = surface(
    (wx, wy) => {
      const u = (wx + 2.8) / 5.6; // 0..1
      const raw = Math.min(1, u * 1.45);
      const flatTop = raw >= 0.68 ? 1.85 : 1.85 * Math.pow(raw / 0.68, 1.35);
      const ridge = 0.14 * Math.cos(wy * 1.35);
      return Math.max(0.08, flatTop + ridge);
    },
    {
      x: [-2.8, 2.8],
      y: [-2.0, 2.0],
      resolution: [38, 24],
      colors: ['#091229', '#1c3b73', '#2e8bc0', '#5ce1e6', '#ffd166', '#ff6b8b'],
      mesh: '#80e5ff',
      meshOpacity: 0.18,
      meshWidth: 0.55,
      opacity: 0.88,
    },
  );

  // Glowing ceiling plane wire at z = 1.92 (the 448 saturation wall)
  const wallX = -2.8 + (0.68 / 1.45) * 5.6;
  const ceilingWall = wireframeSlab3d([wallX + 1.4, 0, 1.92], 1.4, 2.0, 0.08, {
    color: COSMOS.gold,
    width: 3.0,
    glow: 9,
  });

  // Streaming activation photons riding up the ramp and colliding with the 448 plateau
  const photons = points3d(
    () => {
      const p = pulseVal.value;
      const capped = capProgressVal ? capProgressVal.value : 1;
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const u = ((p * 0.42 + i / 6) % 1) * (0.45 + 0.55 * capped);
        const wx = -2.8 + u * 5.6;
        const wy = -1.35 + i * 0.54;
        const raw = Math.min(1, u * 1.45);
        const z =
          (raw >= 0.68 ? 1.88 : 1.85 * Math.pow(raw / 0.68, 1.35)) +
          0.14 * Math.cos(wy * 1.35) +
          0.14;
        pts.push([wx, wy, z]);
      }
      return pts;
    },
    {
      colorAt: (i) => (i % 2 === 0 ? COSMOS.gold : COSMOS.cyan),
      radius: 6.2,
      glow: 12,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(cliffSurface, ...ceilingWall, photons);
  return view;
}

export {
  COSMOS,
  Node,
  additions,
  aura,
  blockContraction,
  blockScale,
  circle,
  cinematic3d,
  curve3d,
  decode8,
  delayedScaleReplay,
  dot,
  encode8,
  even,
  experiment,
  floatAdds,
  freshGroupWorksheet,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  grids,
  group,
  guardedDynamic,
  halfAdds,
  heroTitle,
  hexByte,
  large,
  line,
  line3d,
  linear,
  linearGradient,
  metricReadout,
  orbitScene,
  orientationWorksheet,
  parametricSurface,
  points3d,
  polyPath,
  prefixes,
  projection,
  radialGradient,
  rect,
  roundHalf,
  roundTrip,
  roundedOverflow,
  rows,
  rule,
  scaleExperiment,
  small,
  stochasticNeighbor,
  sum,
  surface,
  txt,
  weightPattern,
  weights,
  wireframeSlab3d,
};
