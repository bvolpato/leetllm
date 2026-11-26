// Shared semantic palette, math invariants, and reusable glowing primitives
// for the 18-scene Perplexity & Model Evaluation stage film.
import { arrow, circle, dot, group, line, rect, seq } from 'vizmatic/stage';
import {
  answerChecks,
  corpusLoss,
  freshReport,
  shiftedTargetCount,
} from '../../films/perplexity/arithmetic.mjs';
import {
  ANSWERS,
  ANSWER_CONTRACT,
  FRESH_ANSWERS,
  FRESH_CONTRACT,
  FRESH_PROBABILITIES,
  freshPieces,
  logits,
  nll,
  ppl,
  probabilities,
  scoredRuns,
  stable,
  subwordPieces,
  text as tokenizerText,
  total,
  windows,
  words,
} from '../../films/perplexity/fixtures.mjs';
import {
  aggregationSnapshot,
  introSnapshot,
  logSpaceSnapshot,
  meanSnapshot,
  surpriseSnapshot,
} from '../../films/perplexity/model.mjs';
import {
  COSMOS,
  aura,
  glowDot,
  glowingTrail,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';

export {
  ANSWERS,
  ANSWER_CONTRACT,
  FRESH_ANSWERS,
  FRESH_CONTRACT,
  FRESH_PROBABILITIES,
  aggregationSnapshot,
  answerChecks,
  corpusLoss,
  freshPieces,
  freshReport,
  introSnapshot,
  logSpaceSnapshot,
  logits,
  meanSnapshot,
  nll,
  ppl,
  probabilities,
  scoredRuns,
  shiftedTargetCount,
  stable,
  subwordPieces,
  surpriseSnapshot,
  tokenizerText,
  total,
  windows,
  words,
};

/** One semantic color per conceptual role across all 18 scenes. */
export const ROLE = Object.freeze({
  observed: COSMOS.gold,
  prob: COSMOS.cyan,
  context: COSMOS.blue,
  good: COSMOS.emerald,
  warn: COSMOS.rose,
  masked: COSMOS.violet,
  amber: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
  surface: COSMOS.surface,
  surfaceAlt: COSMOS.surfaceAlt,
});

export const INTRO_PREFIX = Object.freeze(['The', 'cat', 'sat']);
export const INTRO_TARGETS = Object.freeze(['on', 'the', 'mat']);

export const INTRO_CANDIDATES = Object.freeze([
  Object.freeze([
    ['on', probabilities[0]],
    ['under', 0.3],
    ['near', 0.15],
    ['other', 0.05],
  ]),
  Object.freeze([
    ['the', probabilities[1]],
    ['a', 0.45],
    ['some', 0.3],
    ['other', 0.15],
  ]),
  Object.freeze([
    ['mat', probabilities[2]],
    ['rug', 0.1],
    ['floor', 0.05],
    ['other', 0.05],
  ]),
]);

export const AGG_WINDOWS = Object.freeze([
  { name: 'Window A', count: 2, loss: 0.5 },
  { name: 'Window B', count: 8, loss: 2.0 },
]);

export const fmt = (n, digits = 2) => Number(n).toFixed(digits);
export const pct = (n, digits = 0) => `${(Number(n) * 100).toFixed(digits)}%`;

export function utf8Length(str) {
  return new TextEncoder().encode(str).length;
}

export function utf8Bytes(str) {
  return [...new TextEncoder().encode(str)];
}

/** Verify all mathematical invariants imported from films/perplexity at film build time. */
export function verifyPerplexityModel() {
  verifyApprox(total, -Math.log(0.5) - Math.log(0.1) - Math.log(0.8), 1e-12, 'intro total nll');
  verifyApprox(ppl, 2.924017738, 1e-7, 'intro perplexity');
  verifyApprox(Math.exp(-total / 3), 0.341995189, 1e-6, 'equivalent geometric probability');

  const agg = corpusLoss(AGG_WINDOWS);
  verifyInvariant(agg.count === 10, 'aggregation total count');
  verifyApprox(agg.sum, 17, 1e-12, 'aggregation total nats');
  verifyApprox(agg.mean, 1.7, 1e-12, 'aggregation mean');
  verifyApprox(agg.perplexity, 5.473947392, 1e-7, 'aggregation perplexity');

  const naiveAgg =
    AGG_WINDOWS.reduce((acc, row) => acc + Math.exp(row.loss), 0) / AGG_WINDOWS.length;
  verifyApprox(naiveAgg, 4.518889, 1e-4, 'naive window ppl mean');

  const fresh = freshReport();
  verifyInvariant(fresh.bytes === 16, 'fresh case byte count');
  verifyInvariant(fresh.count === 4, 'fresh case token count');
  verifyApprox(fresh.sum, Math.log(100), 1e-12, 'fresh total nll');
  verifyApprox(fresh.ppl, Math.sqrt(10), 1e-12, 'fresh ppl');
  verifyApprox(fresh.bpb, 0.41524101186, 1e-9, 'fresh bpb');

  verifyInvariant(utf8Length(tokenizerText) === 14, 'Rain falls now byte count');
  verifyInvariant(scoredRuns[0].pieces.length === 4, 'subword piece count');
  verifyInvariant(scoredRuns[1].pieces.length === 14, 'char piece count');
  verifyApprox(Math.exp(scoredRuns[0].nats / 4), 8.1661699, 1e-4, 'subword token ppl');
  verifyApprox(Math.exp(scoredRuns[1].nats / 14), 1.9019084, 1e-4, 'char token ppl');
  verifyApprox(scoredRuns[0].nats / (14 * Math.LN2), 0.865617, 1e-4, 'subword bpb');
  verifyApprox(scoredRuns[1].nats / (14 * Math.LN2), 0.927447, 1e-4, 'char bpb');

  verifyInvariant(utf8Length('Ａ  a') === 6, 'wide raw bytes');
  verifyInvariant(utf8Length('a a') === 3, 'normalized bytes');
  verifyApprox(1.2 / (6 * Math.LN2), 0.288539, 1e-5, 'raw bpb');
  verifyApprox(1.2 / (3 * Math.LN2), 0.577078, 1e-5, 'scored bpb');

  verifyInvariant(
    windows.reduce((acc, w) => acc + (w[3] - w[2]), 0) === 9,
    'strided distinct target count',
  );
  verifyInvariant(
    shiftedTargetCount([
      [-100, 1, 2],
      [-100, -100, 3],
    ]) === 3,
    'shifted target count',
  );
  verifyApprox(
    corpusLoss([
      { loss: 0.2, count: 2 },
      { loss: 2.0, count: 1 },
    ]).mean,
    0.8,
    1e-12,
    'uneven batch token mean',
  );

  verifyApprox(stable[0] + stable[1] + stable[2], 1, 1e-12, 'stable softmax sum');
  verifyApprox(-Math.log(stable[0]), 0.169846, 1e-5, 'stable observed nll');
  verifyInvariant(logSpaceSnapshot(0.99).product === 0, 'underflow product hits zero');
  verifyInvariant(Number.isFinite(logSpaceSnapshot(0.99).sum), 'log-space sum stays finite');

  const aChk = answerChecks(ANSWERS[0], ANSWER_CONTRACT);
  const bChk = answerChecks(ANSWERS[1], ANSWER_CONTRACT);
  verifyInvariant(aChk[0] && !aChk[1] && !aChk[2], 'checkpoint A checks');
  verifyInvariant(bChk[0] && bChk[1] && bChk[2], 'checkpoint B checks');

  const cedarChk = answerChecks(FRESH_ANSWERS[0], FRESH_CONTRACT);
  const pineChk = answerChecks(FRESH_ANSWERS[1], FRESH_CONTRACT);
  verifyInvariant(cedarChk[0] && !cedarChk[1] && !cedarChk[2], 'Cedar checks');
  verifyInvariant(pineChk[0] && pineChk[1] && pineChk[2], 'Pine checks');

  verifyApprox(-Math.log(0.2) + Math.log(0.8), Math.log(4), 1e-12, 'protocol clue delta');
  verifyApprox(surpriseSnapshot(2, 0.5).bits, -Math.log2(0.02), 1e-12, 'surprise bits snapshot');
  verifyInvariant(aggregationSnapshot(1, 0.5).sum === 17, 'aggregation snapshot sum');
  verifyApprox(meanSnapshot(1, 0.5).perplexity, ppl, 1e-9, 'mean snapshot ppl');
  verifyInvariant(introSnapshot(2, 0.5).count === 3, 'intro snapshot count');
}

/** Clamp a play duration so an animation never runs past the scene's narration. */
export function safeDur(c, startTime, desired = 0.75, margin = 0.42) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.12, Math.min(desired, remaining));
}

/**
 * Schedule an animation at a declared cue (start or end), clamping its duration
 * safely inside the scene window.
 */
export function playCue(
  s,
  c,
  cueId,
  build,
  { after = false, offset = 0, dur = 0.75, margin = 0.42 } = {},
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

/** Sequential fade-out then fade-in across two dynamic view values (zero overlap). */
export function swapVis(outVal, inVal, d = 0.6) {
  const half = Math.max(0.12, d * 0.46);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

/** Smooth quadratic Bezier polyline points between two 2D points with perpendicular lift. */
export function arcPts(p0, p1, lift = -120, steps = 28) {
  const mx = (p0[0] + p1[0]) / 2;
  const my = (p0[1] + p1[1]) / 2 + lift;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
    ]);
  }
  return pts;
}

/** Ambient multi-aura cosmic atmosphere pinned behind scene geometry. */
export function cinemaAtmosphere(primary = ROLE.prob, secondary = ROLE.observed) {
  return group(
    aura(-540, -240, 560, `${primary}24`, '#07091000'),
    aura(480, 150, 620, `${secondary}20`, '#07091000'),
    aura(0, 20, 740, '#22336624', '#07091000'),
  ).zIndex(-80);
}

/** Luminous translucent bar with crisp glowing border (for data bars, strips, cells). */
export function lumBar(
  x,
  y,
  w,
  h,
  {
    color = ROLE.context,
    fillOpacity = 0.28,
    strokeWidth = 2.4,
    glow = 8,
    radius = 8,
    opacity = 1,
  } = {},
) {
  const safeW = Math.max(4, w);
  const safeH = Math.max(4, h);
  const body = rect(safeW, safeH, {
    fill: color,
    stroke: color,
    width: strokeWidth,
    radius,
  })
    .at(x, y)
    .opacity(fillOpacity * opacity);
  const edge = rect(safeW, safeH, {
    fill: null,
    stroke: color,
    width: strokeWidth,
    radius,
  })
    .at(x, y)
    .opacity(0.92 * opacity);
  if (glow > 0) edge.glow(glow, color);
  return group(body, edge);
}

/** Luminous circular ring beacon. */
export function glowRing(
  x,
  y,
  radius,
  color,
  { width = 3.2, glow = 10, fillOpacity = 0.14, opacity = 1 } = {},
) {
  const fill = circle(radius, { fill: color, stroke: null })
    .at(x, y)
    .opacity(fillOpacity * opacity);
  const ring = circle(radius, { fill: null, stroke: color, width })
    .at(x, y)
    .glow(glow, color)
    .opacity(opacity);
  return group(fill, ring);
}

/** Glowing vector arrow with tip photon. */
export function glowVector(
  origin,
  tip,
  { color = ROLE.observed, width = 4.5, tipSize = 16, glow = 10, opacity = 1, dotRadius = 5 } = {},
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
 * Full-bleed luminous probability distribution strip with crisp external labels
 * positioned cleanly above (word) and below (percentage) so labels never collide.
 */
export function probStrip({
  left = -780,
  y = 140,
  width = 1560,
  height = 72,
  segments = [],
  unroll = 1,
  highlightIndex = -1,
  highlightColor = ROLE.observed,
  opacity = 1,
  labelOffsetAbove = 76,
  labelOffsetBelow = 70,
} = {}) {
  const nodes = [];
  const totalVisible = Math.max(0, Math.min(1, unroll)) * width;

  // Base luminous rail under the strip
  nodes.push(
    lumBar(left + width / 2, y, width, height, {
      color: '#344775',
      fillOpacity: 0.14,
      strokeWidth: 2,
      glow: 4,
      radius: 10,
      opacity,
    }),
  );

  let cursor = 0;
  segments.forEach((seg, i) => {
    const segW = seg.share * width;
    const visW = Math.max(0, Math.min(segW, totalVisible - cursor));
    const isHi = i === highlightIndex;
    const col = isHi ? highlightColor : (seg.color ?? ROLE.context);
    if (visW > 4) {
      nodes.push(
        lumBar(left + cursor + visW / 2, y, Math.max(4, visW - 4), height - 6, {
          color: col,
          fillOpacity: isHi ? 0.56 : (seg.fillOpacity ?? 0.24),
          strokeWidth: isHi ? 3 : 2,
          glow: isHi ? 12 : 5,
          radius: 7,
          opacity,
        }),
      );
    }
    if (cursor + segW * 0.35 <= totalVisible) {
      const cx = left + cursor + segW / 2;
      const lblCol = isHi ? highlightColor : (seg.labelColor ?? COSMOS.ink);
      const sz = segW < 110 ? 26 : 32;
      if (seg.word) {
        const wNode = txt(
          seg.word,
          cx,
          y - labelOffsetAbove,
          sz,
          lblCol,
          'serif',
          'center',
        ).opacity(opacity);
        if (isHi) wNode.glow(7, highlightColor);
        nodes.push(wNode);
      }
      if (seg.showPct !== false) {
        nodes.push(
          txt(
            pct(seg.share),
            cx,
            y + labelOffsetBelow,
            Math.max(26, sz - 2),
            isHi ? highlightColor : COSMOS.muted,
            'mono',
            'center',
          ).opacity(opacity),
        );
      }
    }
    cursor += segW;
  });

  // Unrolling leading photon when strip is still revealing
  if (unroll > 0.02 && unroll < 0.99) {
    const edgeX = left + totalVisible;
    nodes.push(
      line([edgeX, y - height / 2 - 8], [edgeX, y + height / 2 + 8], {
        stroke: COSMOS.ink,
        width: 4,
      })
        .glow(10, ROLE.prob)
        .opacity(opacity),
    );
  }

  return group(...nodes);
}

/** Sample -ln(p) surprise curve on screen coordinates. */
export function negLogCurvePts({
  x0,
  y0,
  w,
  h,
  pMin = 0.015,
  pMax = 1.0,
  yMax = 4.5,
  steps = 110,
}) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Denser sampling near pMin for smooth steep rise
    const p = pMin * Math.pow(pMax / pMin, t);
    const loss = -Math.log(p);
    const sx = x0 + ((p - pMin) / (pMax - pMin)) * w;
    const sy = y0 - (Math.min(yMax, loss) / yMax) * h;
    pts.push([sx, sy]);
  }
  return pts;
}

/** Sample exponential curve PPL = exp(L) on screen coordinates. */
export function expCurvePts({ x0, y0, w, h, lMax = 3.0, pplMax = 20, steps = 80 }) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const l = (i / steps) * lMax;
    const val = Math.min(pplMax, Math.exp(l));
    pts.push([x0 + (l / lMax) * w, y0 - (val / pplMax) * h]);
  }
  return pts;
}
