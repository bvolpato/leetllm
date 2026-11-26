// Shared cinematic palette, verified math invariants, and 3D multimodal primitives
// for the 26-scene Multimodal Fusion stage film.
import {
  arrow,
  circle,
  dot,
  group,
  line,
  line3d,
  parametricSurface,
  rect,
  seq,
} from 'vizmatic/stage';
import {
  originalKey,
  risingRow,
  secondKey,
  traceAtHour,
} from '../../films/multimodal-fusion/chart-reading.mjs';
import {
  attentionConstruction,
  budgetSnapshot,
  freshIncidentState,
} from '../../films/multimodal-fusion/construction.mjs';
import {
  CONTEXT_LIMIT,
  CROP_CANDIDATES,
  DASHBOARD,
  FRESH_CLOCK,
  IMAGE_224,
  IMAGE_336,
  MAX_PREFIX,
  OUTPUT_RESERVE,
  PATCH_SIZE,
  TEXT_STATE,
  TEXT_TOKENS,
  VIEWS,
  VISUAL_KEYS,
  VISUAL_TOKENS_224,
  VISUAL_TOKENS_336,
  VISUAL_VALUES,
} from '../../films/multimodal-fusion/fixtures.mjs';
import {
  attentionStates,
  cacheWorkAt,
  chartEvidence,
  cropSelection,
  crossAttentionFixture,
  eventOrder,
  fusionScoreFixture,
  multimodalReservation,
  prefixPlan,
  releaseBlockers,
} from '../../films/multimodal-fusion/model.mjs';
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
  CONTEXT_LIMIT,
  COSMOS,
  CROP_CANDIDATES,
  DASHBOARD,
  FRESH_CLOCK,
  IMAGE_224,
  IMAGE_336,
  MAX_PREFIX,
  OUTPUT_RESERVE,
  PATCH_SIZE,
  TEXT_STATE,
  TEXT_TOKENS,
  VIEWS,
  VISUAL_KEYS,
  VISUAL_TOKENS_224,
  VISUAL_TOKENS_336,
  VISUAL_VALUES,
  arrow,
  attentionConstruction,
  attentionStates,
  aura,
  budgetSnapshot,
  cacheWorkAt,
  chartEvidence,
  cinematic3d,
  circle,
  cropSelection,
  crossAttentionFixture,
  dot,
  eventOrder,
  freshIncidentState,
  fusionScoreFixture,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  line3d,
  metricReadout,
  multimodalReservation,
  orbitScene,
  originalKey,
  parametricSurface,
  prefixPlan,
  rect,
  releaseBlockers,
  risingRow,
  rule,
  secondKey,
  seq,
  traceAtHour,
  txt,
  wireframeSlab3d,
};

export const ROLE = Object.freeze({
  vision: COSMOS.cyan,
  bridge: COSMOS.violet,
  text: COSMOS.blue,
  audio: COSMOS.amber,
  ok: COSMOS.emerald,
  gold: COSMOS.gold,
  warn: COSMOS.rose,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
});

export const CHART_EVIDENCE = chartEvidence();
export const FULL_PREFIX = prefixPlan(VISUAL_TOKENS_336);
export const REDUCED_PREFIX = prefixPlan(32);
export const ATTN_ZERO = crossAttentionFixture(0);
export const ATTN_OPEN = crossAttentionFixture(0.35);
export const FUSION_SCORE = fusionScoreFixture();
export const FRESH_BASE = freshIncidentState(0);

export const BYTES_PER_TOKEN = 2 * 32 * 8 * 128 * 2;
export const VISUAL_DIRECT_MIB = (FULL_PREFIX.visualTokens * BYTES_PER_TOKEN) / 2 ** 20;
export const VISUAL_REDUCED_MIB = (REDUCED_PREFIX.visualTokens * BYTES_PER_TOKEN) / 2 ** 20;
export const FULL_REDUCED_MIB = (REDUCED_PREFIX.total * BYTES_PER_TOKEN) / 2 ** 20;
export const VIDEO_120_TOKENS = 120 * VISUAL_TOKENS_224;
export const MIXED_SCORES = REDUCED_PREFIX.prefix ** 2;
export const TEXT_SCORES = TEXT_TOKENS ** 2;
export const CROSS_SCORES = TEXT_TOKENS * REDUCED_PREFIX.visualTokens;

export function verifyMultimodalInvariants() {
  verifyInvariant(VISUAL_TOKENS_224 === 256, '224px / 14px squared = 256 tokens');
  verifyInvariant(VISUAL_TOKENS_336 === 576, '336px / 14px squared = 576 tokens');
  verifyInvariant(VIDEO_120_TOKENS === 30720, '120 frames x 256 patches = 30720 tokens');
  verifyApprox(VIDEO_120_TOKENS / CONTEXT_LIMIT, 7.5, 1e-9, '30720 / 4096 = 7.5 windows');
  verifyInvariant(CHART_EVIDENCE.name === 'Line B', 'rising series is Line B');
  verifyApprox(CHART_EVIDENCE.before.y, 5.2, 1e-9, 'Line B starts at 5.2');
  verifyApprox(CHART_EVIDENCE.after.y, 9.0, 1e-9, 'Line B ends at 9.0');
  verifyInvariant(originalKey[risingRow] === 'Checkout', 'original rising service is Checkout');
  verifyInvariant(secondKey[risingRow] === 'Search', 'swapped rising service is Search');
  verifyApprox(FUSION_SCORE.score, 0.6, 1e-9, 'late fusion dot product 0.6');
  verifyInvariant(FULL_PREFIX.visualTokens === 2880, '5 full views = 2880 tokens');
  verifyInvariant(FULL_PREFIX.prefix === 5080, '5 full views + 2200 text = 5080 prefix');
  verifyInvariant(FULL_PREFIX.total === 5380, '5 full views total = 5380');
  verifyInvariant(FULL_PREFIX.total - CONTEXT_LIMIT === 1284, 'overflow by 1284 tokens');
  verifyInvariant(FULL_PREFIX.fits === false, 'full views overflow 4096');
  verifyInvariant(REDUCED_PREFIX.visualTokens === 160, '5 x 32 reduced views = 160');
  verifyInvariant(REDUCED_PREFIX.prefix === 2360, 'reduced prefix = 2360');
  verifyInvariant(REDUCED_PREFIX.total === 2660, 'reduced total = 2660');
  verifyInvariant(REDUCED_PREFIX.fits === true, 'reduced views fit 4096');
  verifyInvariant(MIXED_SCORES === 5569600, '2360^2 = 5,569,600 mixed scores');
  verifyInvariant(CROSS_SCORES === 352000, '2200 x 160 = 352,000 cross scores');
  verifyInvariant(TEXT_SCORES === 4840000, '2200^2 = 4,840,000 text scores');
  verifyApprox(ATTN_ZERO.logits[0] * Math.sqrt(3), 0.57, 1e-9, 'slot 0 dot product = 0.57');
  verifyApprox(ATTN_ZERO.logits[0], 0.3291, 0.002, 'slot 0 scaled score ~ 0.33');
  verifyApprox(ATTN_ZERO.weights[0], 0.384, 0.002, 'slot 0 softmax weight ~ 0.384');
  verifyApprox(ATTN_ZERO.weights[1], 0.317, 0.002, 'slot 1 softmax weight ~ 0.317');
  verifyApprox(ATTN_ZERO.weights[2], 0.299, 0.002, 'slot 2 softmax weight ~ 0.299');
  verifyApprox(ATTN_ZERO.attended[0], 0.322, 0.002, 'attended coord 0 ~ 0.322');
  verifyApprox(ATTN_OPEN.gateStrength, 0.336, 0.002, 'tanh(0.35) ~ 0.336');
  verifyApprox(ATTN_OPEN.fused[0], 0.308, 0.002, 'fused coord 0 ~ 0.308');
  verifyApprox(ATTN_OPEN.fused[1], 0.191, 0.002, 'fused coord 1 ~ 0.191');
  verifyApprox(ATTN_OPEN.fused[2], 0.837, 0.002, 'fused coord 2 ~ 0.837');
  verifyInvariant(cropSelection(3).join(',') === 'global,axis,badge', '3-slot crop selection');
  verifyInvariant(cropSelection(2).join(',') === 'global,axis', '2-slot crop selection');
  verifyInvariant(eventOrder([105, 135], [90, 270]) === 'unresolved', 'wide interval unresolved');
  verifyInvariant(eventOrder([105, 135], [170, 190]) === 'after', 'narrow interval after');
  verifyInvariant(BYTES_PER_TOKEN === 131072, '128 KiB per cached token');
  verifyApprox(VISUAL_DIRECT_MIB, 360, 1e-9, '2880 tokens = 360 MiB');
  verifyApprox(VISUAL_REDUCED_MIB, 20, 1e-9, '160 tokens = 20 MiB');
  verifyApprox(FULL_REDUCED_MIB, 332.5, 1e-9, '2660 tokens = 332.5 MiB');
  verifyInvariant(
    releaseBlockers({ helpfulness: 0.91, OCR: 0.72, IoU: 0.68 }).join(',') === 'OCR',
    'OCR 0.72 blocks release',
  );
  verifyInvariant(
    releaseBlockers({ helpfulness: 0.9, OCR: Number.NaN, IoU: 0.7 }).join(',') === 'OCR',
    'NaN OCR blocks release',
  );
  verifyInvariant(FRESH_BASE.direct.total === 6152, 'fresh direct total = 6152');
  verifyInvariant(FRESH_BASE.reduced.total === 2184, 'fresh reduced total = 2184');
  verifyApprox(FRESH_BASE.reduced.kvMiB, 273, 1e-9, 'fresh reduced KV = 273 MiB');
  verifyInvariant(
    eventOrder(FRESH_CLOCK.deploy, FRESH_CLOCK.firstRise) === 'after',
    'fresh 220 vs 221 is after',
  );
  verifyInvariant(
    eventOrder(FRESH_CLOCK.deploy, FRESH_CLOCK.revisedRise) === 'unresolved',
    'fresh 220 vs 220 is unresolved',
  );
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

export function swapVis(outVal, inVal, d = 0.6) {
  const half = Math.max(0.12, d * 0.46);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

export function chipPill(
  label,
  x,
  y,
  {
    w = 190,
    h = 62,
    color = ROLE.vision,
    fill = '#10182d',
    size = 26,
    glow = 8,
    opacity = 1,
    textColor = COSMOS.ink,
  } = {},
) {
  const frame = rect(w, h, { fill, stroke: color, width: 2.6, radius: 12 })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) frame.glow(glow, color);
  return group(frame, txt(label, x, y, size, textColor, 'mono', 'center').opacity(opacity));
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
        .opacity(0.68 * opacity),
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
      glowDot(x0 + w, y, {
        radius: Math.min(7, height * 0.28),
        color,
        glow: glow + 2,
        opacity,
      }),
    );
  }
  return group(...items);
}

/**
 * Glowing multi-series latency chart from DASHBOARD.series (reused across opening, patches, closing).
 * Returns a group positioned inside [x0, x0 + w] x [y0, y0 + h].
 */
export function dashboardChartNodes(
  x0,
  y0,
  w,
  h,
  {
    hour = 6,
    showReadings = false,
    highlightGreen = false,
    opacity = 1,
    gridN = 0,
    caption = '',
  } = {},
) {
  const padL = 62;
  const padR = 32;
  const padT = 26;
  const padB = 48;
  const pw = w - padL - padR;
  const ph = h - padT - padB;
  const sx = (hr) => x0 + padL + ((hr - 1) / 5) * pw;
  const sy = (val) => y0 + padT + (1 - val / 10) * ph;

  const toneColor = {
    blue: ROLE.text,
    green: ROLE.ok,
    pink: ROLE.warn,
  };

  const nodes = [
    rect(w, h, { fill: '#0b1224', stroke: '#2b3f6b', width: 2.2, radius: 14 })
      .at(x0 + w * 0.5, y0 + h * 0.5)
      .opacity(opacity * 0.92),
  ];

  // Subtle horizontal gridlines
  [0, 5, 10].forEach((val) => {
    const yy = sy(val);
    nodes.push(
      line([sx(1), yy], [sx(6), yy], { stroke: '#223152', width: 1.5 }).opacity(opacity * 0.75),
      txt(String(val), sx(1) - 18, yy, 26, COSMOS.muted, 'mono', 'right').opacity(opacity),
    );
  });

  // Vertical 3 pm marker
  const x3 = sx(3);
  nodes.push(
    line([x3, sy(0)], [x3, sy(10)], { stroke: ROLE.gold, width: 2.2 }).opacity(opacity * 0.55),
  );

  // X ticks
  [1, 3, 6].forEach((hr) => {
    nodes.push(
      txt(`${hr}pm`, sx(hr), sy(0) + 28, 26, COSMOS.muted, 'mono', 'center').opacity(opacity),
    );
  });

  // Series glowing trails
  DASHBOARD.series.forEach(({ values, tone }) => {
    const pts = traceAtHour(values, Math.max(1.05, hour)).map((p) => [sx(p.x), sy(p.y)]);
    if (pts.length >= 2) {
      const col = toneColor[tone] ?? ROLE.vision;
      const isGreen = tone === 'green';
      const wStroke = isGreen && highlightGreen ? 5.6 : 3.6;
      const opTrail = isGreen || !highlightGreen ? opacity : opacity * 0.52;
      nodes.push(
        glowingTrail(pts, {
          color: col,
          width: wStroke,
          glow: isGreen ? 12 : 6,
          opacity: opTrail,
          core: isGreen,
        }),
      );
      if (isGreen) {
        const tip = pts.at(-1);
        nodes.push(glowDot(tip[0], tip[1], { radius: 8, color: ROLE.ok, glow: 14, opacity }));
      }
    }
  });

  // Optional patch grid overlay
  if (gridN > 0) {
    const stepX = pw / gridN;
    const stepY = ph / gridN;
    const drawLines = Math.min(gridN, 12);
    for (let i = 0; i <= drawLines; i++) {
      const gx = sx(1) + (i / drawLines) * pw;
      const gy = sy(10) + (i / drawLines) * ph;
      nodes.push(
        line([gx, sy(10)], [gx, sy(0)], { stroke: ROLE.vision, width: 1.2 }).opacity(
          opacity * 0.48,
        ),
        line([sx(1), gy], [sx(6), gy], { stroke: ROLE.vision, width: 1.2 }).opacity(opacity * 0.48),
      );
    }
    void stepX;
    void stepY;
  }

  // Optional 5.2 and 9.0 readings
  if (showReadings) {
    const p3 = [sx(3), sy(5.2)];
    const p6 = [sx(6), sy(9.0)];
    nodes.push(
      glowDot(p3[0], p3[1], { radius: 7, color: ROLE.ok, glow: 12, opacity }),
      glowDot(p6[0], p6[1], { radius: 7, color: ROLE.ok, glow: 12, opacity }),
      txt('5.2', p3[0] - 18, p3[1] - 28, 28, ROLE.ok, 'mono', 'right').opacity(opacity),
      txt('9.0', p6[0] - 10, p6[1] - 30, 28, ROLE.ok, 'mono', 'right').opacity(opacity),
    );
  }

  if (caption) {
    nodes.push(
      txt(caption, x0 + w * 0.5, y0 - 26, 26, COSMOS.muted, 'mono', 'center').opacity(opacity),
    );
  }

  return group(...nodes);
}

/** Orbiting 3D patch-grid manifold (subdivides 16x16 -> 24x24). */
export function buildPatchGrid3d(densityVal, { x = 420, y = 40 } = {}) {
  const view = cinematic3d({
    theta: -0.82,
    phi: 1.04,
    distance: 15.2,
    unit: 112,
    focus: [0, 0, 0.35],
  }).at(x, y);

  const surf = parametricSurface(
    (u, v) => {
      const freq = 4 + densityVal.value * 3;
      const z =
        0.22 +
        (0.55 + 0.55 * densityVal.value) *
          (0.5 + 0.5 * Math.sin(u * freq * Math.PI) * Math.cos(v * freq * Math.PI));
      return [(u - 0.5) * 4.8, (v - 0.5) * 4.8, z];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [18, 18],
      colors: ['#101c3a', '#1d4d7c', '#5ce1e6', '#a78bfa', '#ffd166'],
      opacity: 0.86,
      mesh: '#7ce8ff',
      meshOpacity: 0.22,
      meshWidth: 0.7,
      animate: true,
    },
  );

  const activeTile = wireframeSlab3d([0, 0, 0.85], 1.1, 1.1, 0.52, {
    color: COSMOS.gold,
    width: 2.6,
    glow: 9,
  });

  view.add(surf, ...activeTile);
  return view;
}

/** Orbiting 3D cross-modal fusion bridge manifold (vision cyan -> violet bridge -> text blue). */
export function buildFusionBridge3d(modeVal, { x = 430, y = 30 } = {}) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 1.02,
    distance: 15.4,
    unit: 110,
    focus: [0, 0, 0.4],
  }).at(x, y);

  const bridgeSurf = parametricSurface(
    (u, v) => {
      const m = modeVal.value;
      const x3 = (u - 0.5) * 5.2;
      const y3 = (v - 0.5) * 3.6;
      const arch = Math.sin(u * Math.PI) * (0.45 + 0.85 * Math.sin(m * 1.1 + 0.4));
      const ripple = 0.22 * Math.cos((v - 0.5) * Math.PI * 3 + m * 2.0);
      return [x3, y3, arch + ripple];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [18, 14],
      colors: ['#101c3a', '#5ce1e6', '#a78bfa', '#60a5fa', '#ffd166'],
      opacity: 0.84,
      mesh: '#c4b5fd',
      meshOpacity: 0.22,
      meshWidth: 0.7,
      animate: true,
    },
  );

  const visionSlab = wireframeSlab3d([-2.2, 0, 0.45], 0.55, 1.35, 0.45, {
    color: ROLE.vision,
    width: 2.4,
    glow: 8,
  });
  const textSlab = wireframeSlab3d([2.2, 0, 0.45], 0.55, 1.35, 0.45, {
    color: ROLE.text,
    width: 2.4,
    glow: 8,
  });

  view.add(bridgeSurf, ...visionSlab, ...textSlab);
  return view;
}

/** Orbiting 3D KV-cache memory slab that shrinks smoothly as visual tokens compress. */
export function buildKvSlab3d(shrinkVal, { x = 440, y = 30 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.05,
    distance: 15.0,
    unit: 108,
    focus: [0, 0, 0.3],
  }).at(x, y);

  const surf = parametricSurface(
    (u, v) => {
      const s = 1 - 0.78 * shrinkVal.value;
      const x3 = (u - 0.5) * (4.8 * s + 0.7);
      const y3 = (v - 0.5) * 3.6;
      const z3 = 0.3 + 0.35 * Math.sin(u * Math.PI * 2) * Math.cos(v * Math.PI);
      return [x3, y3, z3];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [16, 14],
      colors: ['#171d32', '#60a5fa', '#a78bfa', '#5ce1e6', '#6ee7b7'],
      opacity: 0.82,
      mesh: '#93c5fd',
      meshOpacity: 0.22,
      meshWidth: 0.7,
      animate: true,
    },
  );

  const outerSlab = wireframeSlab3d([0, 0, 0.5], 2.5, 1.85, 0.6, {
    color: ROLE.warn,
    width: 2.2,
    glow: 7,
  });

  const compactSlab = wireframeSlab3d(() => [0, 0, 0.5], 0.72, 1.85, 0.6, {
    color: ROLE.ok,
    width: 2.8,
    glow: 10,
  });

  view.add(surf, ...outerSlab, ...compactSlab);
  return view;
}

/** Orbiting 3D modality-gap embedding surface (two distinct cones on the hypersphere). */
export function buildModalityGap3d(gapVal, { x = 440, y = 40 } = {}) {
  const view = cinematic3d({
    theta: -0.8,
    phi: 1.06,
    distance: 15.2,
    unit: 108,
    focus: [0, 0, 0.35],
  }).at(x, y);

  const surf = parametricSurface(
    (u, v) => {
      const sep = 0.7 + 0.7 * gapVal.value;
      const x3 = (u - 0.5) * 5.0;
      const y3 = (v - 0.5) * 4.4;
      const lobe1 = Math.exp(-((x3 + sep) ** 2 + (y3 - 0.5) ** 2) * 0.9);
      const lobe2 = Math.exp(-((x3 - sep) ** 2 + (y3 + 0.5) ** 2) * 0.9);
      return [x3, y3, 0.15 + 1.4 * lobe1 + 1.25 * lobe2];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [18, 16],
      colors: ['#111626', '#5ce1e6', '#a78bfa', '#60a5fa', '#ffd166'],
      opacity: 0.85,
      mesh: '#a78bfa',
      meshOpacity: 0.22,
      meshWidth: 0.7,
      animate: true,
    },
  );

  const boundary = wireframeSlab3d([0, 0, 0.75], 0.12, 2.0, 0.75, {
    color: ROLE.gold,
    width: 2.4,
    glow: 9,
  });

  view.add(surf, ...boundary);
  return view;
}
