// Shared cinema building blocks, semantic color roles, 3D helpers, and verified math
// invariants for the KV Cache & PagedAttention narrated lesson.
import {
  Node,
  arrow,
  curve3d,
  dot,
  fadeIn,
  fadeOut,
  group,
  line,
  line3d,
  linear,
  linearGradient,
  par,
  parametricSurface,
  point3d,
  polyPath,
  rect,
} from 'vizmatic/stage';
import {
  BIG_LAYERS,
  BIG_PER_TOKEN,
  BIG_QUERY_HEADS,
  BYTES,
  CONVERSATION,
  C_TABLE,
  EIGHTY,
  FULL_BLOCKS,
  GIB,
  HEADS,
  HEAD_SIZE,
  HOLES,
  KIB,
  LAYERS,
  MIB,
  NEEDED,
  NO_SHARING,
  PAGED_READ,
  PAIRS,
  PAST_THE_END,
  PER_TOKEN,
  PREFIX_BLOCK,
  PROMPT_TOKENS,
  QUERY,
  QUERY_HEADS,
  REQUESTS,
  RESERVED,
  SENTINEL,
  SLOTS,
  STEPS,
  TABLE,
  TAIL_TOKENS,
  TRAPPED,
  USED,
  WARM,
  attend,
  billFor,
  blocksFor,
  bytesPerToken,
  fmt,
  hashOf,
  human,
  readThrough,
  showPair,
  storage,
} from '../../films/kv-cache/model.mjs';
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
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

// Re-export every model constant and helper so scenes import from one place.
export {
  BIG_LAYERS,
  BIG_PER_TOKEN,
  BIG_QUERY_HEADS,
  BYTES,
  CINEMA_FRAME,
  CONVERSATION,
  COSMOS,
  C_TABLE,
  EIGHTY,
  FULL_BLOCKS,
  GIB,
  HEADS,
  HEAD_SIZE,
  HOLES,
  KIB,
  LAYERS,
  MIB,
  NEEDED,
  NO_SHARING,
  PAGED_READ,
  PAIRS,
  PAST_THE_END,
  PER_TOKEN,
  PREFIX_BLOCK,
  PROMPT_TOKENS,
  QUERY,
  QUERY_HEADS,
  REQUESTS,
  RESERVED,
  SENTINEL,
  SLOTS,
  STEPS,
  TABLE,
  TAIL_TOKENS,
  TRAPPED,
  USED,
  WARM,
  attend,
  aura,
  billFor,
  blocksFor,
  bytesPerToken,
  cinematic3d,
  fmt,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  hashOf,
  heroTitle,
  human,
  metricReadout,
  orbitScene,
  readThrough,
  rule,
  showPair,
  storage,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
};

/**
 * Semantic color roles held constant across all 17 scenes:
 *   key / reqA     -> cyan
 *   value / reqB   -> violet
 *   new / reqC / ok -> emerald
 *   query / shared / focus -> gold
 *   waste / error / full   -> rose
 *   link / swap / caution  -> amber
 *   prefill / logical      -> blue
 */
export const ROLE = Object.freeze({
  key: COSMOS.cyan,
  value: COSMOS.violet,
  query: COSMOS.gold,
  shared: COSMOS.gold,
  focus: COSMOS.gold,
  reqA: COSMOS.cyan,
  reqB: COSMOS.violet,
  reqC: COSMOS.emerald,
  ok: COSMOS.emerald,
  fresh: COSMOS.emerald,
  waste: COSMOS.rose,
  error: COSMOS.rose,
  link: COSMOS.amber,
  caution: COSMOS.amber,
  prefill: COSMOS.blue,
  logical: COSMOS.blue,
});

// Additional verified numbers spoken in batching, recovery-cost, shrink, and your-turn scenes.
export const FOX_WORDS = Object.freeze(['The', 'fox', 'ran', 'straight', 'past', 'us']);

export const RECOVERY = Object.freeze({
  tokens: 6400,
  kibPerToken: BIG_PER_TOKEN / KIB,
  totalMib: (6400 * (BIG_PER_TOKEN / KIB)) / 1024,
  replayRate: 8000,
  replaySec: 6400 / 8000,
  fastLinkMibs: 10000,
  fastLegSec: 2000 / 10000,
  fastTotalSec: (2 * 2000) / 10000,
  slowLinkMibs: 4000,
  slowLegSec: 2000 / 4000,
  slowTotalSec: (2 * 2000) / 4000,
});

export const SHRINK_NUMS = Object.freeze({
  totalUnits: 1600,
  budgetUnits: 960,
  tailPerReq: 24,
  reqCount: 3,
  trimmed: 3 * 24,
  liveUnits: 1600 - 3 * 24,
  mhaKib: billFor(BIG_QUERY_HEADS),
  gqaKib: billFor(HEADS),
  mqaKib: billFor(1),
  int8GqaKib: bytesPerToken({ layers: BIG_LAYERS, heads: HEADS, bytes: 1 }) / KIB,
  longContextTokens: 131072,
  longContextGib: (131072 * BIG_PER_TOKEN) / GIB,
  tpGpus: 2,
  tpHeadsPerGpu: HEADS / 2,
});

export const YOUR_TURN = Object.freeze({
  blockSize: 32,
  aTokens: 100,
  aBlocks: blocksFor(100, 32),
  aEmpty: blocksFor(100, 32) * 32 - 100,
  bTokens: 32,
  bBlocks: blocksFor(32, 32),
  round1Total: blocksFor(100, 32) + blocksFor(32, 32),
  cTokens: 70,
  cBlocks: blocksFor(70, 32),
  round2Total: blocksFor(32, 32) + blocksFor(70, 32),
  pos: 40,
  logicalBlock: Math.floor(40 / 32),
  slotOffset: 40 % 32,
  physicalBlock: C_TABLE[Math.floor(40 / 32)],
});

export const BATCH_POOL = Object.freeze({
  blockSize: 4,
  aTokens: 8,
  bTokensBefore: 5,
  aBlocks: blocksFor(8, 4),
  bBlocks: blocksFor(5, 4),
  beforeTotal: blocksFor(8, 4) + blocksFor(5, 4),
  cTokens: 3,
  bTokensAfter: 6,
  cBlocks: blocksFor(3, 4),
  bBlocksAfter: blocksFor(6, 4),
  afterTotal: blocksFor(3, 4) + blocksFor(6, 4),
});

/** Build-time mathematical invariant suite covering every displayed value in the lesson. */
export function verifyKvCacheInvariants() {
  verifyInvariant(PER_TOKEN === 131072, '8B bytes per token = 131,072');
  verifyInvariant(PER_TOKEN / KIB === 128, '8B KiB per token = 128');
  verifyInvariant(CONVERSATION / MIB === 512, '8B 4096-token conversation = 512 MiB');
  verifyInvariant(EIGHTY === 80, '40 GiB / 512 MiB = 80 conversations');
  verifyInvariant(BIG_PER_TOKEN / KIB === 320, '70B KiB per token = 320');
  verifyApprox((BIG_PER_TOKEN * 4096) / GIB, 1.25, 1e-9, '70B 4096-token conversation GiB');
  verifyApprox((128 * BIG_PER_TOKEN * 4096) / GIB, 160, 1e-9, '70B 128 conversations GiB');
  verifyInvariant((STEPS * (STEPS + 1)) / 2 === 21, '6-step quadratic sum = 21');
  verifyInvariant(TRAPPED === 3796, '4096 - 300 = 3796 trapped slots');
  verifyInvariant(
    HOLES.reduce((a, b) => a + b, 0) === 36 && Math.max(...HOLES) < NEEDED,
    'external fragmentation holes sum to 36 > 20 with max < 20',
  );
  verifyInvariant(Math.floor(5 / SLOTS) === 1 && 5 % SLOTS === 1, '5 / 4 = 1 rem 1');
  verifyInvariant(showPair(PAGED_READ) === '(1.91, 1.53)', 'paged read rounds to (1.91, 1.53)');
  verifyInvariant(showPair(PAST_THE_END) === '(999.00, 999.00)', 'sentinel read -> (999, 999)');
  verifyInvariant(BATCH_POOL.beforeTotal === 4 && BATCH_POOL.afterTotal === 3, 'batch pool 4 -> 3');
  verifyInvariant(
    FULL_BLOCKS === 31 && TAIL_TOKENS === 4 && NO_SHARING === 6400 && WARM === 231,
    'prefix sharing 6400 -> 231',
  );
  verifyInvariant(Math.round(100 * (1 - WARM / NO_SHARING)) === 96, '96% fewer prefix blocks');
  verifyApprox(RECOVERY.totalMib, 2000, 1e-9, 'recovery total MiB');
  verifyApprox(RECOVERY.replaySec, 0.8, 1e-9, 'replay recovery seconds');
  verifyApprox(RECOVERY.fastTotalSec, 0.4, 1e-9, 'fast link round-trip seconds');
  verifyApprox(RECOVERY.slowTotalSec, 1.0, 1e-9, 'slow link round-trip seconds');
  verifyInvariant(
    SHRINK_NUMS.trimmed === 72 && SHRINK_NUMS.liveUnits === 1528,
    'shrink trims 72 to 1528',
  );
  verifyInvariant(
    SHRINK_NUMS.mhaKib === 2560 &&
      SHRINK_NUMS.gqaKib === 320 &&
      SHRINK_NUMS.mqaKib === 40 &&
      SHRINK_NUMS.int8GqaKib === 160,
    'MHA/GQA/MQA/INT8 per-token KiB',
  );
  verifyApprox(SHRINK_NUMS.longContextGib, 40, 1e-9, '131072 tokens at 70B = 40 GiB');
  verifyInvariant(SHRINK_NUMS.tpHeadsPerGpu === 4, '8 KV heads / 2 GPUs = 4');
  verifyInvariant(
    YOUR_TURN.round1Total === 5 &&
      YOUR_TURN.aEmpty === 28 &&
      YOUR_TURN.round2Total === 4 &&
      YOUR_TURN.logicalBlock === 1 &&
      YOUR_TURN.slotOffset === 8 &&
      YOUR_TURN.physicalBlock === 11,
    'your-turn answers verified',
  );
}

/**
 * Add a glowing, depth-sorted 3D rectangular prism (6 shaded faces + 12 edges) to a Scene3D.
 * Returns the array of Object3D nodes so callers can hide/fade individual slabs.
 */
export function addBox3D(
  view,
  x0,
  y0,
  z0,
  dx,
  dy,
  dz,
  fillColor,
  edgeColor = fillColor,
  { faceOpacity = 0.74, edgeWidth = 2.0, edgeGlow = 6, edgeOpacity = 0.92, blend = 'screen' } = {},
) {
  const x1 = x0 + dx;
  const y1 = y0 + dy;
  const z1 = z0 + dz;
  const faceOpts = {
    resolution: [1, 1],
    color: fillColor,
    opacity: faceOpacity,
    mesh: false,
    shaded: true,
  };
  const edgeOpts = {
    color: edgeColor,
    width: edgeWidth,
    opacity: edgeOpacity,
    glow: edgeGlow,
    ...(blend ? { blend } : {}),
  };
  const objs = [
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z1], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z0], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0 + u * dx, y1, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x1, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    line3d([x0, y0, z0], [x1, y0, z0], edgeOpts),
    line3d([x1, y0, z0], [x1, y1, z0], edgeOpts),
    line3d([x1, y1, z0], [x0, y1, z0], edgeOpts),
    line3d([x0, y1, z0], [x0, y0, z0], edgeOpts),
    line3d([x0, y0, z1], [x1, y0, z1], edgeOpts),
    line3d([x1, y0, z1], [x1, y1, z1], edgeOpts),
    line3d([x1, y1, z1], [x0, y1, z1], edgeOpts),
    line3d([x0, y1, z1], [x0, y0, z1], edgeOpts),
    line3d([x0, y0, z0], [x0, y0, z1], edgeOpts),
    line3d([x1, y0, z0], [x1, y0, z1], edgeOpts),
    line3d([x1, y1, z0], [x1, y1, z1], edgeOpts),
    line3d([x0, y1, z0], [x0, y1, z1], edgeOpts),
  ];
  view.add(...objs);
  return objs;
}

/** Add a wireframe-only 3D box (12 edges) for empty/unallocated/reserved slots. */
export function addWireBox3D(
  view,
  x0,
  y0,
  z0,
  dx,
  dy,
  dz,
  color = COSMOS.rose,
  { width = 1.8, opacity = 0.72, glow = 5, blend = 'screen' } = {},
) {
  const x1 = x0 + dx;
  const y1 = y0 + dy;
  const z1 = z0 + dz;
  const es = { color, width, opacity, glow, ...(blend ? { blend } : {}) };
  const objs = [
    line3d([x0, y0, z0], [x1, y0, z0], es),
    line3d([x1, y0, z0], [x1, y1, z0], es),
    line3d([x1, y1, z0], [x0, y1, z0], es),
    line3d([x0, y1, z0], [x0, y0, z0], es),
    line3d([x0, y0, z1], [x1, y0, z1], es),
    line3d([x1, y0, z1], [x1, y1, z1], es),
    line3d([x1, y1, z1], [x0, y1, z1], es),
    line3d([x0, y1, z1], [x0, y0, z1], es),
    line3d([x0, y0, z0], [x0, y0, z1], es),
    line3d([x1, y0, z0], [x1, y0, z1], es),
    line3d([x1, y1, z0], [x1, y1, z1], es),
    line3d([x0, y1, z0], [x0, y1, z1], es),
  ];
  view.add(...objs);
  return objs;
}

/** Evaluate a quadratic 3D Bezier curve at parameter t in [0, 1]. */
export function evalQuadBezier3D(a, mid, b, t) {
  const u = 1 - t;
  return [
    u * u * a[0] + 2 * u * t * mid[0] + t * t * b[0],
    u * u * a[1] + 2 * u * t * mid[1] + t * t * b[1],
    u * u * a[2] + 2 * u * t * mid[2] + t * t * b[2],
  ];
}

/**
 * Add a glowing 3D Bezier pointer arc linking a logical sequence block to a physical cube,
 * optionally streaming glowing photons driven by `pulseVal`. Returns added Object3D nodes.
 */
export function addPointerArc3D(
  view,
  a,
  b,
  color,
  { lift = 0.65, width = 3.0, glow = 8, pulseVal = null, phaseOffset = 0, opacity = 0.92 } = {},
) {
  const mid = [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, Math.max(a[2], b[2]) + lift];
  const objs = [
    curve3d((t) => evalQuadBezier3D(a, mid, b, t), 0, 1, {
      color,
      width,
      glow,
      blend: 'screen',
      samples: 36,
      opacity,
    }),
    point3d(a, { color: '#ffffff', radius: 5.0, glow: 8, blend: 'screen' }),
    point3d(b, { color, radius: 5.5, glow: 8, blend: 'screen' }),
  ];
  if (pulseVal) {
    objs.push(
      point3d(() => evalQuadBezier3D(a, mid, b, (pulseVal.value + phaseOffset) % 1), {
        color: '#ffffff',
        radius: 6.8,
        glow: 12,
        blend: 'screen',
      }),
      point3d(() => evalQuadBezier3D(a, mid, b, (pulseVal.value + phaseOffset + 0.5) % 1), {
        color,
        radius: 5.4,
        glow: 10,
        blend: 'screen',
      }),
    );
  }
  view.add(...objs);
  return objs;
}

/** Hide an array of Object3D/Node items initially. */
export function hideNodes(nodes) {
  for (const n of nodes) n.hide();
  return nodes;
}

/** Fade in an array of Object3D/Node items safely within scene end bounds. */
export function fadeInNodes(s, c, triggerTime, nodes, desired = 0.35) {
  const duration = clampDur(c, triggerTime, desired, 0.25);
  s.play(par(...nodes.map((n) => fadeIn(n, { duration }))));
}

/** Fade out an array of Object3D/Node items safely within scene end bounds. */
export function fadeOutNodes(s, c, triggerTime, nodes, desired = 0.3) {
  const duration = clampDur(c, triggerTime, desired, 0.25);
  s.play(par(...nodes.map((n) => fadeOut(n, { duration }))));
}

/** Clamp an animation duration so it finishes strictly before `c.end - margin`. */
export function clampDur(c, startTime, desired, margin = 0.45) {
  const available = c.end - startTime - margin;
  if (available <= 0.08) return 0.08;
  return Math.min(desired, available);
}

/**
 * Non-overlapping crossfade curve helpers for a single 0 -> 1 mode value `v`:
 *   fadeOutHalf(v): 1 -> 0 over [0.0, 0.4]
 *   fadeInHalf(v):  0 -> 1 over [0.6, 1.0]
 * Guarantees old content drops completely to 0 before new content rises above 0.
 */
export const fadeOutHalf = (v) => Math.max(0, Math.min(1, 1 - v * 2.5));
export const fadeInHalf = (v) => Math.max(0, Math.min(1, (v - 0.6) * 2.5));

/** Schedule a continuous linear value drift across the active scene window. */
export function driftValue(s, c, val, target, { startOffset = 0.1, endMargin = 0.5 } = {}) {
  const span = Math.max(0.4, c.end - c.start - startOffset - endMargin);
  c.at(startOffset, () => {
    s.play(val.to(target, { duration: span, ease: linear }));
  });
  return span;
}

/** Evaluate a 2D quadratic Bezier curve into an array of sample points. */
export function quadArcPts(a, b, liftY = -80, steps = 28) {
  const mx = (a[0] + b[0]) * 0.5;
  const my = Math.min(a[1], b[1]) + liftY;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * a[0] + 2 * u * t * mx + t * t * b[0],
      u * u * a[1] + 2 * u * t * my + t * t * b[1],
    ]);
  }
  return pts;
}

/** Point on a 2D quadratic Bezier curve for animated particle traversal. */
export function quadArcPoint(a, b, liftY, t) {
  const mx = (a[0] + b[0]) * 0.5;
  const my = Math.min(a[1], b[1]) + liftY;
  const u = 1 - t;
  return [
    u * u * a[0] + 2 * u * t * mx + t * t * b[0],
    u * u * a[1] + 2 * u * t * my + t * t * b[1],
  ];
}

/** Luminous architectural token/memory cell (generous padding so text never touches borders). */
export function memCell(
  label,
  x,
  y,
  {
    w = 156,
    h = 68,
    fill = '#0f172a',
    stroke = COSMOS.cyan,
    textColor = COSMOS.ink,
    size = 28,
    font = 'mono',
    dash = null,
    glow = 6,
    radius = 12,
    opacity = 1,
  } = {},
) {
  const box = rect(w, h, {
    fill,
    stroke,
    width: 2.2,
    radius,
    ...(dash ? { dash } : {}),
  })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0 && stroke) box.glow(glow, stroke);
  if (!label) return box;
  return group(box, txt(label, x, y, size, textColor, font).opacity(opacity));
}

/** Glowing 2D vector arrow with screen blend. */
export function glowArrow(from, to, color = COSMOS.gold, { width = 3.6, tip = 14, glow = 8 } = {}) {
  const a = arrow(from, to, { stroke: color, width, tip }).set('blend', 'screen');
  if (glow > 0) a.glow(glow, color);
  return a;
}

/** Glowing horizontal progress / allocation bar with bright active fill. */
export function glowBar(
  xLeft,
  y,
  totalW,
  h,
  frac,
  {
    fill = COSMOS.cyan,
    bg = '#11182c',
    border = '#2c3c63',
    glow = 8,
    radius = 10,
    opacity = 1,
  } = {},
) {
  const clamped = Math.max(0, Math.min(1, frac));
  const cx = xLeft + totalW * 0.5;
  const track = rect(totalW, h, { fill: bg, stroke: border, width: 2.0, radius })
    .at(cx, y)
    .opacity(opacity);
  if (clamped <= 0.004) return track;
  const innerW = Math.max(8, (totalW - 8) * clamped);
  const bar = rect(innerW, h - 8, { fill, stroke: null, radius: Math.max(4, radius - 3) })
    .at(xLeft + 4 + innerW * 0.5, y)
    .opacity(0.88 * opacity);
  if (glow > 0) bar.glow(glow, fill);
  return group(track, bar);
}

/** Smooth glowing curve trail (keeps crisp trail without looping white photon dots). */
export function beamWithPhotons(pts, color, _phaseVal, { width = 3.6, glow = 10, alpha = 1 } = {}) {
  return group(glowingTrail(pts, { color, width, glow, opacity: 0.9 * alpha }));
}

/** Floating scene eyebrow + 2-line serif headline with generous spacing (>= 0.3 text-gap). */
export function cinemaHeader(
  eyebrow,
  line1,
  line2,
  { x = -860, y = -410, accent = COSMOS.cyan, size = 54, anchor = 'left' } = {},
) {
  const parts = [
    txt(eyebrow, x, y, 26, accent, 'mono', anchor),
    txt(line1, x, y + 66, size, COSMOS.ink, 'serif', anchor),
  ];
  if (line2) {
    parts.push(txt(line2, x, y + 142, size, accent, 'serif', anchor).glow(6, accent));
  }
  return group(...parts);
}

/** Subtle dashed vertical/horizontal separator line. */
export function dashedRule(x1, y1, x2, y2, color = '#263455', opacity = 0.65) {
  return line([x1, y1], [x2, y2], { stroke: color, width: 1.8, dash: [6, 8] }).opacity(opacity);
}
