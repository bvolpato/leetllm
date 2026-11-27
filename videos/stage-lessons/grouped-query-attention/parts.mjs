// Shared math models, invariants, semantic palette, and 3D/2D cinema primitives
// for the 20-scene Grouped-Query Attention (GQA) Pure Cinema stage film.
import {
  Node,
  arrow,
  circle,
  curve3d,
  dot,
  dynamic,
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
  seq,
} from 'vizmatic/stage';
import { dot as dotProd, softmax } from '../../films/grouped-query-attention/arithmetic.mjs';
import { ATTENTION, chapterModel } from '../../films/grouped-query-attention/construction.mjs';
import {
  HEADS,
  KV_KEYS,
  KV_VALUES,
  QUERY_VECTORS,
} from '../../films/grouped-query-attention/fixtures.mjs';
import {
  cacheBytes,
  groupSize,
  kvGroupForQuery,
  meanVisible,
  physicalHeads,
} from '../../films/grouped-query-attention/model.mjs';
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
  markDecoration,
  metricReadout,
  morphEquation,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  ATTENTION,
  CINEMA_FRAME,
  COSMOS,
  HEADS,
  KV_KEYS,
  KV_VALUES,
  Node,
  QUERY_VECTORS,
  aura,
  cacheBytes,
  chapterModel,
  circle,
  cinematic3d,
  curve3d,
  dot,
  dotProd,
  dynamic,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  groupSize,
  guardedDynamic,
  heroTitle,
  kvGroupForQuery,
  line,
  line3d,
  linear,
  linearGradient,
  markDecoration,
  meanVisible,
  metricReadout,
  morphEquation,
  orbitScene,
  parametricSurface,
  physicalHeads,
  points3d,
  polyPath,
  radialGradient,
  rect,
  rule,
  seq,
  softmax,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
};

/** One stable semantic color per conceptual role across all 20 scenes. */
export const ROLE = Object.freeze({
  query: COSMOS.cyan,
  key: COSMOS.blue,
  value: COSMOS.emerald,
  pos: COSMOS.violet,
  gold: COSMOS.gold,
  alert: COSMOS.rose,
  amber: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
  surface: COSMOS.surface,
  surfaceAlt: COSMOS.surfaceAlt,
});

export const range = (n) => Array.from({ length: n }, (_, i) => i);

/** Shared reference-call dimensions used by kernel-route and synthesis. */
export const REFERENCE_CALL = Object.freeze({
  layers: 1,
  batch: 2,
  tokens: 1024,
  width: 64,
  bytes: 2,
});
export const COMPACT_MIB = cacheBytes({ ...REFERENCE_CALL, kvHeads: HEADS.gqaKV }) / 2 ** 20;
export const REPEATED_MIB = cacheBytes({ ...REFERENCE_CALL, kvHeads: HEADS.queries }) / 2 ** 20;
export const PEAK_MIB = COMPACT_MIB + REPEATED_MIB;

/** H100 SXM dense BF16 roofline constants. */
export const H100 = Object.freeze({
  sparseTflops: 1979,
  denseTflops: 989.5,
  hbmTbs: 3.35,
  ridge: 989.5 / 3.35,
});

/** Large 72B-style model dimensions (L=80, Hq=64, d=128, P=2). */
export const LARGE_MODEL = Object.freeze({
  layers: 80,
  queries: 64,
  width: 128,
  bytes: 2,
  batch: 32,
  tokens: 4096,
});

/** MLA content & RoPE algebra fixtures. */
export const MLA = Object.freeze({
  contentDims: 512,
  posDims: 64,
  totalDims: 576,
  scoreWidth: 192,
  W: [
    [1, 2],
    [0, 1],
  ],
  WT: [
    [1, 0],
    [2, 1],
  ],
  q: [1, 0],
  c0: [1, 2],
  c1: [3, 0],
});

/** Build-time mathematical verification of every core identity in the GQA lesson. */
export function verifyGqaInvariants() {
  // Group mapping
  verifyInvariant(groupSize(HEADS.queries, HEADS.gqaKV) === 4, 'GQA group size must be 4');
  verifyInvariant(kvGroupForQuery(5, HEADS.queries, HEADS.gqaKV) === 1, 'Q5 maps to KV1');
  verifyInvariant(kvGroupForQuery(19, 48, 6) === 2, 'Q19 in 48Q/6KV maps to KV2');

  // Shared-KV two-reader worked example
  verifyApprox(ATTENTION[0].scores[0], 2 / Math.SQRT2, 1e-9, 'Q0 scaled score Rain');
  verifyApprox(ATTENTION[0].scores[1], 0, 1e-9, 'Q0 scaled score fell');
  verifyApprox(ATTENTION[0].weights[0], 0.8044, 1e-3, 'Q0 weight on Rain');
  verifyApprox(ATTENTION[1].weights[1], 0.8044, 1e-3, 'Q1 weight on fell');
  verifyApprox(ATTENTION[0].output[0], ATTENTION[0].weights[0], 1e-9, 'Q0 output x');
  verifyApprox(ATTENTION[1].output[1], ATTENTION[1].weights[1], 1e-9, 'Q1 output y');

  // Small-scale cache byte budget (2 layers, width 4, 2 bytes)
  verifyInvariant(cacheBytes({ kvHeads: 1, tokens: 1 }) === 32, '1 head 1 pos = 32 B');
  verifyInvariant(cacheBytes({ kvHeads: 8, tokens: 3 }) === 768, 'MHA 3 pos = 768 B');
  verifyInvariant(cacheBytes({ kvHeads: 2, tokens: 3 }) === 192, 'GQA 3 pos = 192 B');
  verifyInvariant(cacheBytes({ kvHeads: 1, tokens: 3 }) === 96, 'MQA 3 pos = 96 B');
  verifyInvariant(cacheBytes({ kvHeads: 8, tokens: 4 }) === 1024, 'MHA 4 pos = 1024 B');
  verifyInvariant(cacheBytes({ kvHeads: 2, tokens: 4 }) === 256, 'GQA 4 pos = 256 B');
  verifyInvariant(cacheBytes({ kvHeads: 1, tokens: 4 }) === 128, 'MQA 4 pos = 128 B');

  // Roofline & H100 ridge
  const cm = chapterModel('roofline');
  verifyInvariant(cm.intensity === 8, 'GQA-8 operational intensity = 8');
  verifyApprox(H100.ridge, 295.373, 0.05, 'H100 dense ridge ~295.4');

  // Large 72B-style payloads and 10 GiB pool capacities
  const large = [64, 8, 1].map((kvHeads) => cacheBytes({ ...LARGE_MODEL, kvHeads }));
  verifyApprox(large[0] / 1e9, 343.6, 0.1, '72B MHA 32x4K ~343.6 GB');
  verifyApprox(large[1] / 1e9, 42.95, 0.05, '72B GQA-8 32x4K ~42.95 GB');
  verifyApprox(large[2] / 1e9, 5.37, 0.05, '72B MQA 32x4K ~5.37 GB');
  const pool = 10 * 2 ** 30;
  verifyInvariant(Math.floor(pool / (large[0] / 32)) === 1, '10 GiB holds 1 MHA req');
  verifyInvariant(Math.floor(pool / (large[1] / 32)) === 8, '10 GiB holds 8 GQA-8 req');
  verifyInvariant(Math.floor(pool / (large[2] / 32)) === 64, '10 GiB holds 64 MQA req');
  const oneMiMha = cacheBytes({
    layers: 80,
    batch: 1,
    tokens: 1024 * 1024,
    kvHeads: 64,
    width: 128,
    bytes: 2,
  });
  verifyApprox(oneMiMha / 1e12, 2.75, 0.01, '1Mi MHA ~2.75 TB');

  // Tensor-parallel physical heads
  const tp4 = physicalHeads(64, 8, 4);
  const tp16 = physicalHeads(64, 8, 16);
  verifyInvariant(tp4.queriesPerRank === 16 && tp4.kvPerRank === 2 && tp4.copies === 8, 'TP4');
  verifyInvariant(
    tp16.queriesPerRank === 4 && tp16.kvPerRank === 1 && tp16.copies === 16 && tp16.replicas === 2,
    'TP16',
  );
  verifyInvariant(physicalHeads(24, 6, 4) === null, '24Q/6KV on 4 ranks invalid');

  // Read-only tradeoff bounds
  verifyInvariant(48 + 16 === 64 && 48 + 16 / 8 === 50, 'read-only 64ms -> 50ms');
  verifyApprox(64 / 50, 1.28, 1e-9, 'read-only speedup ratio 1.28');

  // Mean-pooling failure
  verifyInvariant(meanVisible([1, 3, 3, 5]) === 3, 'pooled coordinate = 3');
  verifyApprox(10 / (1 + Math.exp(-2)), 8.808, 1e-3, 'original opposing head output ~8.808');
  verifyInvariant(meanVisible([5, 5]) === 5, 'pooled opposing output = 5');

  // MLA latent store & absorption & RoPE non-commutation
  verifyInvariant(MLA.contentDims + MLA.posDims === MLA.totalDims, 'MLA 512+64=576');
  verifyApprox((2 * 128 * 128) / MLA.totalDims, 56.889, 1e-2, 'MHA/MLA ratio ~56.9');
  verifyApprox((2 * 8 * 128) / MLA.totalDims, 3.556, 1e-2, 'GQA-8/MLA ratio ~3.56');
  const k0 = MLA.W.map((row) => dotProd(row, MLA.c0));
  const qPrime = MLA.WT.map((row) => dotProd(row, MLA.q));
  verifyInvariant(k0[0] === 5 && k0[1] === 2, 'expanded k0 = (5, 2)');
  verifyInvariant(qPrime[0] === 1 && qPrime[1] === 2, 'absorbed qPrime = (1, 2)');
  verifyInvariant(dotProd(MLA.q, k0) === 5 && dotProd(qPrime, MLA.c0) === 5, 'score pos0 = 5');
  verifyInvariant(dotProd(qPrime, MLA.c1) === 3, 'score pos1 = 3');
  const kRot = [-k0[1], k0[0]];
  const qRotAbs = MLA.WT.map((row) => dotProd(row, [MLA.q[1], -MLA.q[0]]));
  verifyInvariant(kRot[0] === -2 && kRot[1] === 5, 'rotated k0 = (-2, 5)');
  verifyInvariant(qRotAbs[0] === 0 && qRotAbs[1] === -1, 'rotated absorbed q = (0, -1)');
  verifyInvariant(dotProd(MLA.q, kRot) === -2 && dotProd(qRotAbs, MLA.c0) === -2, 'rot score = -2');

  // Kernel route & synthesis live memory
  verifyInvariant(COMPACT_MIB === 1 && REPEATED_MIB === 4 && PEAK_MIB === 5, '1+4=5 MiB');

  // Causal repair
  verifyInvariant(meanVisible([1, 2, 9]) === 4, 'latest query mean = 4');

  // Earned transfer
  const endTp = physicalHeads(48, 6, 12);
  verifyInvariant(endTp.queriesPerRank === 4 && endTp.copies === 12 && endTp.replicas === 2, 'end');
  const endHeadMiB =
    cacheBytes({ layers: 32, batch: 1, tokens: 1024, kvHeads: 1, width: 64, bytes: 2 }) / 2 ** 20;
  verifyInvariant(endHeadMiB === 8, '1 physical head = 8 MiB');
  verifyInvariant(12 * endHeadMiB === 96 && 48 * endHeadMiB === 384, '96 vs 384 MiB');
}

/** Clamp a play duration so an animation never runs past the scene narration window. */
export function safeDur(c, startTime, desired = 0.72, margin = 0.45) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.12, Math.min(desired, remaining));
}

/** Safe continuous duration spanning a scene window. */
export function safeSceneDur(c, startOffset = 0.08, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

/** Schedule an animation at a declared cue (start or end), clamped safely inside the scene. */
export function playCue(
  s,
  c,
  cueId,
  build,
  { after = false, offset = 0, dur = 0.72, margin = 0.45 } = {},
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

/** Schedule a continuous ambient phase animation across the entire scene. */
export function runPhase(s, c, phaseVal, target = 12, startOffset = 0.08) {
  const dur = safeSceneDur(c, startOffset, 0.55);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/** Sequential fade-out then fade-in across two dynamic view values (zero overlap). */
export function swapVis(outVal, inVal, d = 0.6) {
  const half = Math.max(0.12, d * 0.45);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

/** Ambient multi-aura cosmic atmosphere pinned behind scene geometry. */
export function cinemaAtmosphere(primary = ROLE.query, secondary = ROLE.gold) {
  return markDecoration(
    group(
      aura(-540, -240, 560, `${primary}22`, '#07091000'),
      aura(480, 140, 620, `${secondary}1c`, '#07091000'),
      aura(0, 0, 740, '#22346e1f', '#07091000'),
    ).zIndex(-80),
  );
}

/** Smooth 2D quadratic Bezier curve sampled as a glowingTrail. */
export function glowingArc(p0, p1, liftY = 0, opts = {}) {
  const mx = (p0[0] + p1[0]) * 0.5;
  const my = (p0[1] + p1[1]) * 0.5 + liftY;
  const pts = Array.from({ length: 24 }, (_, i) => {
    const t = i / 23;
    const u = 1 - t;
    return [
      u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
    ];
  });
  return glowingTrail(pts, opts);
}

/** Smooth horizontal S-curve (cubic Hermite) between two points for crisp routing wires. */
export function conduitPts(p0, p1, steps = 22) {
  const [x0, y0] = p0;
  const [x1, y1] = p1;
  const dx = x1 - x0;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    const cx0 = x0 + dx * 0.46;
    const cx1 = x1 - dx * 0.46;
    const x = u * u * u * x0 + 3 * u * u * t * cx0 + 3 * u * t * t * cx1 + t * t * t * x1;
    const y = u * u * u * y0 + 3 * u * u * t * y0 + 3 * u * t * t * y1 + t * t * t * y1;
    return [x, y];
  });
}

/** Luminous bar / data cell with translucent glow fill and bright edge stroke. */
export function lumBar(
  x,
  y,
  w,
  h,
  {
    color = ROLE.key,
    fillOpacity = 0.28,
    strokeWidth = 2.4,
    glow = 8,
    radius = 8,
    opacity = 1,
    dash,
  } = {},
) {
  const safeW = Math.max(4, w);
  const safeH = Math.max(4, h);
  const body = rect(safeW, safeH, {
    fill: color,
    stroke: null,
    radius,
  })
    .at(x, y)
    .opacity(fillOpacity * opacity);
  const edge = rect(safeW, safeH, {
    fill: null,
    stroke: color,
    width: strokeWidth,
    radius,
    dash,
  })
    .at(x, y)
    .opacity(0.92 * opacity);
  if (glow > 0) edge.glow(glow, color);
  return group(body, edge);
}

/** Luminous ring marker for orbital nodes, callout badges, and focal points. */
export function glowRing(
  x,
  y,
  radius,
  color = ROLE.gold,
  { width = 3.2, glow = 9, fillOpacity = 0.14, opacity = 1 } = {},
) {
  const fill = circle(radius, { fill: color, stroke: null })
    .at(x, y)
    .opacity(fillOpacity * opacity);
  const ring = circle(radius, { fill: null, stroke: color, width }).at(x, y).opacity(opacity);
  if (glow > 0) ring.glow(glow, color);
  return group(fill, ring);
}

/** Glowing vector arrow from origin to tip with tip photon. */
export function glowVector(
  origin,
  tip,
  { color = ROLE.query, width = 5.5, tipSize = 16, glow = 9, opacity = 1, dotRadius = 5 } = {},
) {
  const len = Math.hypot(tip[0] - origin[0], tip[1] - origin[1]);
  if (len < 2) {
    return glowDot(origin[0], origin[1], { radius: dotRadius, color, glow, opacity });
  }
  const vec = arrow(origin, tip, { stroke: color, width, tip: tipSize }).opacity(opacity);
  if (glow > 0) vec.glow(glow, color);
  const head = glowDot(tip[0], tip[1], { radius: dotRadius, color, glow: glow + 2, opacity });
  return group(vec, head);
}

/**
 * Clean 2D coordinate plane with glowing axes, subtle hairlines, and unit ticks.
 * Returns { node, toScreen(vx, vy), origin }.
 */
export function buildVectorPlane({
  originX = 0,
  originY = 0,
  scale = 120,
  xMin = -0.5,
  xMax = 2.4,
  yMin = -0.5,
  yMax = 2.4,
  step = 1,
  axisColor = '#556894',
  gridColor = '#233052',
  xLabel = 'x₁',
  yLabel = 'x₂',
  showTicks = true,
} = {}) {
  const toScreen = (vx, vy) => [originX + vx * scale, originY - vy * scale];
  const left = originX + xMin * scale;
  const right = originX + xMax * scale;
  const bottom = originY - yMin * scale;
  const top = originY - yMax * scale;

  const parts = [];
  for (let gx = Math.ceil(xMin / step) * step; gx <= xMax + 1e-6; gx += step) {
    const sx = originX + gx * scale;
    const isZero = Math.abs(gx) < 1e-6;
    parts.push(
      line([sx, bottom], [sx, top], {
        stroke: isZero ? axisColor : gridColor,
        width: isZero ? 2.4 : 1.2,
      }).opacity(isZero ? 0.9 : 0.6),
    );
  }
  for (let gy = Math.ceil(yMin / step) * step; gy <= yMax + 1e-6; gy += step) {
    const sy = originY - gy * scale;
    const isZero = Math.abs(gy) < 1e-6;
    parts.push(
      line([left, sy], [right, sy], {
        stroke: isZero ? axisColor : gridColor,
        width: isZero ? 2.4 : 1.2,
      }).opacity(isZero ? 0.9 : 0.6),
    );
  }

  parts.push(
    arrow([left, originY], [right + 14, originY], { stroke: axisColor, width: 2.4, tip: 11 }),
    arrow([originX, bottom], [originX, top - 14], { stroke: axisColor, width: 2.4, tip: 11 }),
    dot(4, COSMOS.ink).at(originX, originY),
  );
  if (xLabel) parts.push(txt(xLabel, right + 34, originY, 26, COSMOS.muted, 'mono', 'left'));
  if (yLabel) parts.push(txt(yLabel, originX, top - 34, 26, COSMOS.muted, 'mono', 'center'));

  if (showTicks) {
    for (let ix = Math.ceil(xMin); ix <= Math.floor(xMax); ix += Math.max(1, Math.round(step))) {
      if (ix === 0) continue;
      parts.push(
        txt(String(ix), originX + ix * scale, bottom + 28, 26, COSMOS.dim, 'mono', 'center'),
      );
    }
    for (let iy = Math.ceil(yMin); iy <= Math.floor(yMax); iy += Math.max(1, Math.round(step))) {
      if (iy === 0) continue;
      parts.push(txt(String(iy), left - 20, originY - iy * scale, 26, COSMOS.dim, 'mono', 'right'));
    }
  }

  return { node: group(...parts), toScreen, origin: [originX, originY] };
}

/** Shaded 3D rectangular prism for KV cache volumes, tiles, and memory slabs. */
export function box3d(x0, y0, z0, dx, dy, dz, fillColor, edgeColor, opacity = 0.68) {
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
 * Signature orbiting 3D GQA Head-Sharing Manifold.
 * 8 glowing cyan Query crystals on the left connect via live 3D Bezier conduits and
 * streaming photons to 3D Key (blue) + Value (emerald) cache slabs on the right.
 * `mode` continuously morphs 0 (MHA: 8 slabs) -> 1 (GQA: 2 slabs) -> 2 (MQA: 1 slab).
 */
export function buildHeadManifold3d(
  modeVal,
  phaseVal,
  {
    x = 300,
    y = 20,
    tokenSlots = 3,
    litVal = null,
    theta = -0.68,
    phi = 1.06,
    distance = 14.8,
    unit = 112,
  } = {},
) {
  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    focus: [0.1, 0, 0],
  }).at(x, y);

  const heads = HEADS.queries;
  const qX = -2.75;
  const kvStartX = 0.25;
  const slotPitch = 1.08;
  const ySpan = 4.6;
  const yOf = (idx) => -ySpan * 0.5 + ((idx + 0.5) / heads) * ySpan;

  const targetY = (i) => {
    const m = modeVal.value;
    const g = kvGroupForQuery(i);
    const yMha = yOf(i);
    const yGqa = -ySpan * 0.5 + (((g + 0.5) * heads) / HEADS.gqaKV / heads) * ySpan;
    if (m <= 1) return yMha * (1 - m) + yGqa * m;
    return yGqa * (2 - m) + 0 * (m - 1);
  };

  // Left plane: 8 glowing cyan Query head nodes
  for (let i = 0; i < heads; i++) {
    const qy = yOf(i);
    view.add(
      ...wireframeSlab3d([qX, qy, 0], 0.22, 0.18, 0.24, {
        color: ROLE.query,
        width: 2.3,
        glow: 7,
      }),
    );
  }

  // Live 3D routing conduits from each Query crystal to its compressed KV slab anchor
  for (let i = 0; i < heads; i++) {
    const qy = yOf(i);
    const qPt = [qX + 0.24, qy, 0];
    const kPt = () => [kvStartX - 0.36, targetY(i), 0];
    view.add(
      line3d(qPt, kPt, {
        color: ROLE.query,
        width: 2.6,
        glow: 7,
        blend: 'screen',
        onTop: true,
      }),
    );
  }

  // Right: 8 reactive KV token-strip slabs that coalesce cleanly into 2 (GQA) or 1 (MQA)
  for (let i = 0; i < heads; i++) {
    for (let t = 0; t < tokenSlots; t++) {
      const cx = kvStartX + t * slotPitch;
      const kCenter = () => [cx, targetY(i), 0.22];
      const vCenter = () => [cx, targetY(i), -0.22];
      view.add(
        ...wireframeSlab3d(kCenter, 0.38, 0.19, 0.14, {
          color: ROLE.key,
          width: 2.1,
          glow: 5,
        }),
        ...wireframeSlab3d(vCenter, 0.38, 0.19, 0.14, {
          color: ROLE.value,
          width: 2.1,
          glow: 5,
        }),
      );
    }
  }

  // Animated streaming photons racing along the 8 routing conduits
  const photons = points3d(
    () => {
      const ph = phaseVal.value;
      const pts = [];
      for (let i = 0; i < heads; i++) {
        const qy = yOf(i);
        const ky = targetY(i);
        const u = (ph * 0.42 + i * 0.13) % 1;
        pts.push([qX + 0.24 + (kvStartX - 0.36 - (qX + 0.24)) * u, qy + (ky - qy) * u, 0.05]);
      }
      return pts;
    },
    {
      colorAt: (idx) =>
        litVal && Math.round(litVal.value) === idx ? ROLE.gold : idx < 4 ? ROLE.query : '#9ef6fa',
      radius: 5.5,
      glow: 11,
      blend: 'screen',
      onTop: true,
    },
  );

  // Subtle floor reference plane
  const floor = parametricSurface(
    (u, v) => [-3.3 + u * 6.8, -2.9 + v * 5.8, -0.78],
    [0, 1],
    [0, 1],
    {
      resolution: [6, 6],
      color: '#0e1730',
      mesh: '#364d85',
      meshOpacity: 0.22,
      meshWidth: 0.7,
      opacity: 0.32,
      shaded: false,
    },
  );

  view.add(floor, photons);
  return { view };
}

/**
 * Clean, luminous 2D GQA Head-Routing Rack (zero slide boxes).
 * Renders Q0..Q7 ports on the left, smooth glowing cubic routing conduits in the middle,
 * and glowing Key (blue) + Value (emerald) stored token slots on the right.
 */
export function renderGqaRack2d({
  left = -840,
  top = -180,
  width = 740,
  height = 560,
  mode = 1,
  tokens = 2,
  slots = 4,
  lit = -1,
  cursor = -1,
  phase = 0,
  colNames = ['Rain', 'fell', '2', '3'],
  alpha = 1,
} = {}) {
  const nodes = [];
  const heads = HEADS.queries;
  const qX = left + 36;
  const wireStartX = left + 92;
  const wireEndX = left + 275;
  const gridLeft = wireEndX + 20;
  const gridW = left + width - gridLeft;
  const pitch = gridW / slots;
  const cellW = pitch * 0.84;
  const spacing = height / heads;
  const cellH = spacing * (0.56 + 0.52 * Math.min(mode, 1));

  // Column headers
  for (let t = 0; t < slots; t++) {
    const cx = gridLeft + (t + 0.5) * pitch;
    nodes.push(
      txt(colNames[t] ?? String(t), cx, top - 34, 26, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
    );
  }

  // Target Y coordinates per query head
  const ys = range(heads).map((i) => {
    const g = kvGroupForQuery(i);
    const mid = ((g + 0.5) * heads) / HEADS.gqaKV;
    const r =
      mode <= 1 ? (i + 0.5) * (1 - mode) + mid * mode : mid * (2 - mode) + (heads / 2) * (mode - 1);
    return top + r * spacing;
  });

  // Query labels, conduits, and flowing photon pulses
  for (let i = 0; i < heads; i++) {
    const y = top + (i + 0.5) * spacing;
    const isLit = Math.round(lit) === i;
    const col = isLit ? ROLE.gold : ROLE.query;
    const pts = conduitPts([wireStartX, y], [wireEndX, ys[i]]);
    nodes.push(
      txt(`Q${i}`, qX, y, 26, col, 'mono', 'center').opacity((isLit ? 1 : 0.82) * alpha),
      glowingTrail(pts, {
        color: col,
        width: isLit ? 4.2 : 2.5,
        glow: isLit ? 10 : 4,
        core: isLit,
        opacity: (isLit ? 1 : 0.72) * alpha,
      }),
      glowDot(wireStartX, y, {
        radius: isLit ? 6 : 4.5,
        color: col,
        glow: isLit ? 10 : 5,
        opacity: alpha,
      }),
    );
  }

  // Unique stored K/V rows
  const uniqueYs = [];
  for (const y of ys) {
    if (!uniqueYs.some((uy) => Math.abs(uy - y) < 2)) uniqueYs.push(y);
  }

  for (const y of uniqueYs) {
    nodes.push(glowDot(wireEndX, y, { radius: 6, color: ROLE.key, glow: 8, opacity: alpha }));
    for (let t = 0; t < slots; t++) {
      const cx = gridLeft + (t + 0.5) * pitch;
      const frac = Math.max(0, Math.min(1, tokens - t));
      nodes.push(
        rect(cellW, cellH, { fill: '#0e1528', stroke: '#29385d', width: 1.6, radius: 6 })
          .at(cx, y)
          .opacity(0.85 * alpha),
      );
      if (frac > 0.01) {
        const w = Math.max(4, (cellW - 8) * frac);
        const lx = cx - (cellW - 8) / 2 + w / 2;
        const barH = Math.max(6, cellH * 0.34);
        nodes.push(
          lumBar(lx, y - cellH * 0.22, w, barH, {
            color: ROLE.key,
            fillOpacity: 0.48,
            strokeWidth: 1.8,
            glow: 5,
            radius: 4,
            opacity: alpha,
          }),
          lumBar(lx, y + cellH * 0.22, w, barH, {
            color: ROLE.value,
            fillOpacity: 0.48,
            strokeWidth: 1.8,
            glow: 5,
            radius: 4,
            opacity: alpha,
          }),
        );
      }
    }
  }

  // Active column cursor halo
  if (cursor >= 0 && cursor < slots) {
    const cx = gridLeft + (Math.round(cursor) + 0.5) * pitch;
    const topY = Math.min(...uniqueYs) - cellH * 0.72;
    const botY = Math.max(...uniqueYs) + cellH * 0.72;
    nodes.push(
      rect(pitch * 0.94, botY - topY, {
        fill: null,
        stroke: ROLE.gold,
        width: 3.2,
        radius: 9,
      })
        .at(cx, (topY + botY) * 0.5)
        .glow(10, ROLE.gold)
        .opacity(alpha),
    );
  }

  // Clean bottom legend (floating, no box)
  const legY = top + height + 46;
  nodes.push(
    lumBar(gridLeft + 18, legY, 26, 14, { color: ROLE.key, glow: 5, radius: 3, opacity: alpha }),
    txt('Key', gridLeft + 44, legY, 26, ROLE.key, 'sans', 'left').opacity(alpha),
    lumBar(gridLeft + 168, legY, 26, 14, { color: ROLE.value, glow: 5, radius: 3, opacity: alpha }),
    txt('Value', gridLeft + 194, legY, 26, ROLE.value, 'sans', 'left').opacity(alpha),
  );

  return nodes;
}
