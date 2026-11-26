// Shared cinematic visual primitives, verified math model, and timing helpers for `hypothesis-testing`.
// All numerical values derive directly from videos/films/hypothesis-testing/ and are asserted at load time.
import {
  Node,
  circle,
  dot,
  group,
  line,
  linear,
  linearGradient,
  polyPath,
  rect,
} from 'vizmatic/stage';
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
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';
import {
  BOOTSTRAP_BIN_EDGES,
  binomialMasses,
  bootstrapBins,
  clamp,
  estimatorExpectation,
  estimatorFactors,
  exactRightTail,
  exactSignPower,
  jointDifferenceMoments,
  mix,
  passAtK,
  subsets,
  usefulLiftDecision,
  waldMeanDifference,
} from '../../films/hypothesis-testing/arithmetic.mjs';
import {
  candidateSubsets,
  developmentBootstrap,
  holdoutBootstrap,
  holdoutRows,
  macroTaskInterval,
  macroTaskResamples,
  macroTaskScores,
  paired,
  pairedIntervalStudies,
  passingCandidates,
  peeking,
  sortedDevelopmentMeans,
  studies,
  taskRows,
  variantStudies,
} from '../../films/hypothesis-testing/fixtures.mjs';
import { joinTaskResults } from '../../films/hypothesis-testing/model.mjs';
import { validateModel } from '../../films/hypothesis-testing/validation.mjs';

export {
  BOOTSTRAP_BIN_EDGES,
  CINEMA_FRAME,
  COSMOS,
  aura,
  binomialMasses,
  bootstrapBins,
  candidateSubsets,
  cinematic3d,
  clamp,
  developmentBootstrap,
  estimatorExpectation,
  estimatorFactors,
  exactRightTail,
  exactSignPower,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  holdoutBootstrap,
  holdoutRows,
  joinTaskResults,
  jointDifferenceMoments,
  macroTaskInterval,
  macroTaskResamples,
  macroTaskScores,
  metricReadout,
  mix,
  morphEquation,
  orbitScene,
  paired,
  pairedIntervalStudies,
  passAtK,
  passingCandidates,
  peeking,
  rule,
  sortedDevelopmentMeans,
  studies,
  subsets,
  taskRows,
  txt,
  usefulLiftDecision,
  variantStudies,
  waldMeanDifference,
};

/** One semantic color role per concept across all 20 scenes of Hypothesis Testing. */
export const ROLE = Object.freeze({
  modelA: COSMOS.blue,
  modelB: COSMOS.emerald,
  lift: COSMOS.cyan,
  threshold: COSMOS.gold,
  danger: COSMOS.rose,
  violet: COSMOS.violet,
  warning: COSMOS.amber,
});

export const MIN_USEFUL_LIFT = 0.02;
export const DISAGREEMENTS = Object.freeze(taskRows.filter((r) => r.difference !== 0));
export const BINOMIAL_13 = Object.freeze(binomialMasses(13, 0.5));
export const FIVE_SUBSETS = Object.freeze(subsets(10, 5));
export const FIVE_ALL_FAILING = FIVE_SUBSETS.filter((ids) =>
  ids.every((id) => !passingCandidates.includes(id)),
).length;

/** Deterministic enumeration order of all 8,192 sign assignments starting from studies.null[0]. */
export const NULL_WIN_COUNTS = (() => {
  const firstAssignment = studies.null[0].signs;
  const total = 2 ** DISAGREEMENTS.length;
  const firstMask = firstAssignment.reduce((mask, sign, i) => mask + sign * 2 ** i, 0);
  const arr = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    let pattern = i ^ firstMask;
    let wins = 0;
    while (pattern) {
      wins += pattern & 1;
      pattern >>>= 1;
    }
    arr[i] = wins;
  }
  return arr;
})();

/** Build-time mathematical verification of every spoken number across all 20 scenes. */
export function verifyHypothesisInvariants() {
  verifyInvariant(
    validateModel() === true,
    'films/hypothesis-testing/validation.mjs validateModel()',
  );

  // 6-task opening & paired design
  const aSix = paired.reduce((sum, r) => sum + r.a, 0);
  const bSix = paired.reduce((sum, r) => sum + r.b, 0);
  verifyInvariant(aSix === 3 && bSix === 4, '6-task scores A=3, B=4');
  verifyApprox((bSix - aSix) / paired.length, 1 / 6, 1e-12, '6-task observed lift 1/6');

  // 40-task planned study
  const b40 = taskRows.filter((r) => r.difference > 0).length;
  const a40 = taskRows.filter((r) => r.difference < 0).length;
  const ties40 = taskRows.filter((r) => r.difference === 0).length;
  verifyInvariant(b40 === 8 && a40 === 5 && ties40 === 27, '40-task split 27 ties, 8 B, 5 A');
  verifyApprox((b40 - a40) / taskRows.length, 0.075, 1e-12, '40-task lift +7.5 pp');

  // Exact sign test & null model
  verifyApprox(exactRightTail(1, 1, 0.5), 0.5, 1e-12, 'single disagreement tail 1/2');
  verifyInvariant(NULL_WIN_COUNTS.length === 8192, '2^13 = 8192 assignments');
  verifyApprox(exactRightTail(8, 13, 0.5), 2380 / 8192, 1e-12, 'P0(W >= 8) = 2380/8192');
  verifyApprox(2 * exactRightTail(8, 13, 0.5), 4760 / 8192, 1e-12, 'two-sided p = 4760/8192');
  verifyApprox(1 / 2 ** 4, 0.0625, 1e-12, '4-disagreement sweep 1/16 > 0.05');
  verifyApprox(1 / 2 ** 5, 0.03125, 1e-12, '5-disagreement sweep 1/32 < 0.05');

  // Errors, power & multiple comparisons
  const p13 = exactSignPower(13, 0.65, 0.05);
  const p64 = exactSignPower(64, 0.65, 0.05);
  const pBonf = exactSignPower(13, 0.65, 0.05 / 20);
  verifyInvariant(p13.critical === 10, 'n=13 critical count 10');
  verifyApprox(p13.size, 0.046142578125, 1e-9, 'n=13 exact size ~4.61%');
  verifyApprox(p13.power, 0.2783, 1e-3, 'n=13 power at 65% ~27.8%');
  verifyInvariant(p64.critical === 40, 'n=64 critical count 40');
  verifyApprox(p64.power, 0.7119, 0.002, 'n=64 power at 65% ~71.2%');
  verifyApprox(1 - (1 - p13.size) ** 20, 0.611, 0.005, '20-variant family risk ~61.1%');
  verifyInvariant(pBonf.critical === 12, 'Bonferroni n=13 critical count 12');
  verifyApprox(20 * (14 / 8192), 0.03418, 0.001, 'Bonferroni union bound < 0.05');

  // Paired variance reduction
  const vm = jointDifferenceMoments(0.45, 40);
  verifyApprox(vm.cov, 0.2, 1e-12, 'covariance 0.20');
  verifyApprox(vm.paired, 0.0025, 1e-12, 'paired variance 0.0025');
  verifyApprox(vm.independent, 0.0125, 1e-12, 'independent variance 0.0125');
  verifyApprox(vm.independent / vm.paired, 5, 1e-12, '5x variance reduction');
  verifyApprox(1.96 * vm.pairedSE, 0.098, 1e-3, 'paired margin +-9.8 pp');
  verifyApprox(1.96 * vm.independentSE, 0.2191, 1e-3, 'independent margin +-21.9 pp');

  // Bootstrap & interval contract
  verifyApprox(developmentBootstrap.interval[0], -0.1, 1e-12, 'dev bootstrap low -10 pp');
  verifyApprox(developmentBootstrap.interval[1], 0.25, 1e-12, 'dev bootstrap high +25 pp');
  const wald34 = 0.75 + 1.96 * Math.sqrt((0.75 * 0.25) / 4);
  verifyApprox(wald34, 1.17435, 0.001, 'Wald 3/4 overshoots 100% to 117.4%');

  // pass@k, bias & macro-averaging
  verifyApprox(passAtK(2, 10, 3), 64 / 120, 1e-12, 'pass@3 = 64/120');
  verifyInvariant(
    FIVE_SUBSETS.length === 252 && FIVE_ALL_FAILING === 56,
    'C(10,5)=252, 56 failing',
  );
  verifyApprox(passAtK(2, 10, 5), 7 / 9, 1e-12, 'pass@5 = 7/9');
  verifyApprox(1 - 0.8 ** 5, 0.67232, 1e-5, 'plug-in pass@5 = 67.23%');
  const expBias = estimatorExpectation(0.2, 10, 5);
  verifyApprox(expBias.combinatorial, expBias.target, 1e-12, 'unbiased expectation equals target');
  verifyInvariant(expBias.plugin < expBias.target, 'plug-in strictly downward biased');
  const macroMean = macroTaskScores.reduce((a, b) => a + b, 0) / macroTaskScores.length;
  verifyApprox(macroMean, 0.56349, 0.001, 'macro pass@5 ~0.563');
  verifyApprox(1 - 0.5 ** 5, 0.96875, 1e-12, 'pooled 50/50 mirage 96.875%');
  verifyApprox(passAtK(1, 4, 2), 0.5, 1e-12, '4-draw pass@2 = 1/2');
  verifyApprox(passAtK(1, 3, 2), 2 / 3, 1e-12, 'deduplicated 3-draw pass@2 = 2/3');

  // Holdout finale
  const hb = holdoutRows.filter((r) => r.difference > 0).length;
  const ha = holdoutRows.filter((r) => r.difference < 0).length;
  verifyInvariant(hb === 52 && ha === 12 && holdoutRows.length === 400, 'holdout 52 B, 12 A, 400');
  verifyApprox((hb - ha) / 400, 0.1, 1e-12, 'holdout lift +10 pp');
  verifyApprox(holdoutBootstrap.interval[0], 0.0625, 1e-12, 'holdout CI low +6.25 pp');
  verifyApprox(holdoutBootstrap.interval[1], 0.1375, 1e-12, 'holdout CI high +13.75 pp');
  verifyInvariant(
    usefulLiftDecision(holdoutBootstrap.interval, MIN_USEFUL_LIFT) === 'clears-useful-lift',
    'holdout clears +2 pp useful lift bar',
  );
}

/** Non-overlapping two-phase crossfade helpers (old drops to 0 at 0.42 before new rises at 0.58). */
export const fadeOut = (t) => Math.max(0, Math.min(1, 1 - t / 0.42));
export const fadeIn = (t) => Math.max(0, Math.min(1, (t - 0.58) / 0.42));

/** Smooth Hermite ease for numeric motion. */
export const smooth = (t) => {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
};

/** Clamp duration so an animation strictly finishes before `clock.end - margin`. */
export function safeDur(clock, startTime, desired, margin = 0.34) {
  const avail = clock.end - startTime - margin;
  return Math.max(0.08, Math.min(desired, avail));
}

/** Schedule a Value transition cleanly on or after a declared cue without overrunning. */
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

/** Schedule a Value transition cleanly at the start of a beat without overrunning. */
export function beatTo(s, c, beatIndex, val, target, { dur = 0.72, ease } = {}) {
  const beat = c.beats[beatIndex];
  const t0 = beat ? beat.start : c.start;
  const duration = safeDur(c, t0, dur);
  const opts = ease ? { duration, ease } : { duration };
  c.onBeat(beatIndex, () => s.play(val.to(target, opts)));
  return beat;
}

/** Continuous living scene-wide drift [0 -> target] bounded strictly inside the scene. */
export function livingDrift(s, c, val, target = 1, { startOffset = 0.05, endMargin = 0.45 } = {}) {
  const span = c.end - c.start;
  const duration = Math.max(0.3, span - startOffset - endMargin);
  c.at(startOffset, () => s.play(val.to(target, { duration, ease: linear })));
  return duration;
}

/** Mark a node (and its children) as non-occluding backdrop decoration. */
export function markDecor(node) {
  if (!node) return node;
  if (!node.data) node.data = {};
  node.data.decoration = true;
  if (Array.isArray(node.children)) {
    for (const child of node.children) markDecor(child);
  }
  return node;
}

/** Decorative aura wrapper so text over ambient glow never trips text_crowded. */
export function decorAura(x, y, radius, innerHex, midHex = '#07091000') {
  return markDecor(aura(x, y, radius, innerHex, midHex));
}

/** Subtle deep-space inference lattice marked as non-occluding decoration. */
export function cinemaGrid({
  color = '#24345a',
  accent = COSMOS.cyan,
  opacity = 0.46,
  seed = 1,
} = {}) {
  const lines = [];
  for (let x = -800; x <= 800; x += 160) {
    lines.push(line([x, -460], [x, 460], { stroke: color, width: 1.1 }));
  }
  for (let y = -400; y <= 400; y += 160) {
    lines.push(line([-880, y], [880, y], { stroke: color, width: 1.1 }));
  }
  const arcs = [
    circle(520, { fill: null, stroke: accent, width: 1.2, dash: [10, 14] }).opacity(0.22),
    circle(790, { fill: null, stroke: '#4d6cb3', width: 1, dash: [6, 18] }).opacity(0.16),
  ];
  const stars = [];
  for (let i = 0; i < 65; i++) {
    const sx = Math.sin((i + seed * 17) * 127.1 + 3.7) * 43758.5453;
    const sy = Math.sin((i + seed * 29) * 269.5 + 9.1) * 19642.349;
    const x = -930 + (sx - Math.floor(sx)) * 1860;
    const y = -510 + (sy - Math.floor(sy)) * 1020;
    stars.push(
      dot(0.8 + (i % 4) * 0.3, i % 9 === 0 ? accent : '#8ea4d2')
        .opacity(0.15 + (i % 5) * 0.05)
        .at(x, y),
    );
  }
  return markDecor(
    group(...lines, ...arcs, ...stars)
      .opacity(opacity)
      .zIndex(-60),
  );
}

/** Glowing proportional horizontal bar anchored from its left edge at (x, y). */
export function glowBar(x, y, w, h, color, { glow = 8, radius = 8, opacity = 1 } = {}) {
  const safeW = Math.max(4, w);
  const bar = rect(safeW, h, { fill: color, stroke: null, radius })
    .at(x + safeW / 2, y)
    .opacity(opacity);
  if (glow > 0) bar.glow(glow, color);
  return bar;
}

/** Vertical glowing column rising upward from baseline (cx, baseY). */
export function glowCol(cx, baseY, w, h, color, { glow = 8, radius = 6, opacity = 1 } = {}) {
  const safeH = Math.max(3, h);
  const bar = rect(w, safeH, { fill: color, stroke: null, radius })
    .at(cx, baseY - safeH / 2)
    .opacity(opacity);
  if (glow > 0) bar.glow(glow, color);
  return bar;
}

/** Subtle quantitative scale track (no card chrome). */
export function scaleTrack(x, y, w, h, { stroke = '#334670', fill = '#0f162a', radius = 10 } = {}) {
  return rect(w, h, { fill, stroke, width: 1.6, radius }).at(x + w / 2, y);
}

/** Glowing smooth curve from [x, y] points using gradient polyPath. */
export function neonCurve(pts, colors, { width = 4, glow = 10, opacity = 0.96 } = {}) {
  if (pts.length < 2) return group();
  const path = polyPath(pts);
  const paint =
    Array.isArray(colors) && colors.length >= 2
      ? linearGradient(pts[0], pts.at(-1), colors)
      : colors;
  const glowColVal = Array.isArray(colors) ? colors.at(-1) : colors;
  const outer = new Node(path)
    .stroke(paint, width, opacity)
    .glow(glow, glowColVal)
    .set('blend', 'screen');
  const core = new Node(path).stroke('#ffffff', 1.2, 0.38).set('blend', 'screen');
  return group(outer, core);
}

/** Format signed percentage points cleanly with Unicode minus. */
export function formatPoints(v) {
  const scaled = Number((100 * v).toFixed(2));
  if (scaled > 0) return `+${scaled}`;
  if (scaled < 0) return `−${Math.abs(scaled)}`;
  return '0';
}

/** Lightweight 2D mathematical coordinate mapper + clean axes with phone-readable ticks. */
export function makeAxes({
  x0,
  y0,
  w,
  h,
  xDom,
  yDom,
  xTicks = [],
  yTicks = [],
  xLabel = '',
  yLabel = '',
  grid = true,
  xFmt,
  yFmt,
}) {
  const px = (xv) => x0 + ((xv - xDom[0]) / (xDom[1] - xDom[0])) * w;
  const py = (yv) => y0 + h - ((yv - yDom[0]) / (yDom[1] - yDom[0])) * h;
  const pt = (xv, yv) => [px(xv), py(yv)];

  const nodes = [];
  if (grid) {
    for (const tx of xTicks) {
      const gx = px(tx);
      nodes.push(markDecor(line([gx, y0], [gx, y0 + h], { stroke: '#1d2947', width: 1.2 })));
    }
    for (const ty of yTicks) {
      const gy = py(ty);
      nodes.push(markDecor(line([x0, gy], [x0 + w, gy], { stroke: '#1d2947', width: 1.2 })));
    }
  }
  nodes.push(
    line([x0, y0 + h], [x0 + w, y0 + h], { stroke: '#4d6499', width: 2.6 }),
    line([x0, y0], [x0, y0 + h], { stroke: '#4d6499', width: 2.6 }),
  );
  for (const tx of xTicks) {
    const gx = px(tx);
    const label = xFmt
      ? xFmt(tx)
      : Number.isInteger(tx)
        ? String(tx)
        : tx.toFixed(Math.abs(tx * 10 - Math.round(tx * 10)) < 1e-6 ? 1 : 2);
    nodes.push(
      line([gx, y0 + h], [gx, y0 + h + 8], { stroke: '#5d77b0', width: 2 }),
      txt(label, gx, y0 + h + 34, 26, COSMOS.muted, 'mono'),
    );
  }
  for (const ty of yTicks) {
    const gy = py(ty);
    const label = yFmt ? yFmt(ty) : Number.isInteger(ty) ? String(ty) : ty.toFixed(2);
    nodes.push(
      line([x0 - 8, gy], [x0, gy], { stroke: '#5d77b0', width: 2 }),
      txt(label, x0 - 18, gy, 26, COSMOS.muted, 'mono', 'right'),
    );
  }
  if (xLabel) {
    nodes.push(txt(xLabel, x0 + w / 2, y0 + h + 78, 26, COSMOS.muted, 'sans'));
  }
  if (yLabel) {
    nodes.push(txt(yLabel, x0, y0 - 30, 26, COSMOS.muted, 'sans', 'left'));
  }

  return { px, py, pt, node: group(...nodes) };
}

/** Sample a function f(x) over [a, b] into screen coordinates using an axes helper. */
export function sampleCurve(ax, fn, a, b, n = 90) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const xv = a + ((b - a) * i) / n;
    pts.push(ax.pt(xv, fn(xv)));
  }
  return pts;
}

/**
 * Shared dark-cinema precision lift ruler (-15 pp to +30 pp) with vertical No-Change (0)
 * and Minimum Useful Lift (+2 pp) guides. Used across useful-lift, report-contract, and holdout.
 */
export function buildLiftRuler({
  xLeft = -740,
  xRight = 780,
  axisY = 235,
  guideTop = -175,
  guideBottom = 235,
  guideBreaks = [],
  showThreshold = 1,
} = {}) {
  const xOf = (lift) => mix(xLeft, xRight, (lift + 0.15) / 0.45);
  const x0 = xOf(0);
  const xMin = xOf(MIN_USEFUL_LIFT);

  // Split vertical guides cleanly around endpoint-label bands so strokes never cross text.
  const segments = [];
  let cursor = guideTop;
  for (const [bTop, bBot] of [...guideBreaks].sort((a, b) => a[0] - b[0])) {
    if (bTop > cursor + 2) segments.push([cursor, Math.min(bTop, guideBottom)]);
    cursor = Math.max(cursor, bBot);
  }
  if (guideBottom > cursor + 2) segments.push([cursor, guideBottom]);

  const nodes = [
    ...segments.map(([y1, y2]) =>
      markDecor(
        line([x0, y1], [x0, y2], {
          stroke: '#586d99',
          width: 2.2,
          dash: [8, 8],
        }),
      ),
    ),
    txt('No change (0)', x0 - 20, guideTop - 32, 26, COSMOS.muted, 'mono', 'right'),
    // Main horizontal ruler
    line([xLeft, axisY], [xRight, axisY], { stroke: '#52689c', width: 3 }),
  ];

  if (showThreshold > 0.02) {
    nodes.push(
      group(
        ...segments.map(([y1, y2]) =>
          markDecor(
            line([xMin, y1], [xMin, y2], {
              stroke: ROLE.threshold,
              width: 3.4,
            }).glow(8, ROLE.threshold),
          ),
        ),
        txt(
          'Min useful lift (+2 pp)',
          xMin + 20,
          guideTop - 32,
          28,
          ROLE.threshold,
          'mono',
          'left',
        ),
      ).opacity(showThreshold),
    );
  }

  for (const val of [-0.1, 0, 0.1, 0.2, 0.25]) {
    const tx = xOf(val);
    nodes.push(
      line([tx, axisY - 10], [tx, axisY + 10], { stroke: '#6c84ba', width: 2.4 }),
      txt(formatPoints(val), tx, axisY + 42, 26, COSMOS.muted, 'mono'),
    );
  }
  nodes.push(
    txt(
      'B minus A  (percentage points)',
      (xLeft + xRight) / 2,
      axisY + 90,
      28,
      COSMOS.muted,
      'sans',
    ),
  );

  return { xOf, node: group(...nodes) };
}

/** Render one glowing confidence interval span on a lift ruler. */
export function liftIntervalNodes(
  xOf,
  {
    name,
    y,
    interval,
    estimate,
    progress = 1,
    color = ROLE.lift,
    highlightLower = false,
    clearance = 0,
    showEndpoints = true,
  },
) {
  const nodes = [txt(name, -740, y - 54, 28, color, 'mono', 'left')];
  if (estimate !== undefined) {
    nodes.push(glowDot(xOf(estimate), y, { radius: 11, color, glow: 14 }));
  }
  if (progress > 0.02) {
    const origin = estimate ?? (interval[0] + interval[1]) / 2;
    const loVal = mix(origin, interval[0], progress);
    const hiVal = mix(origin, interval[1], progress);
    const lx = xOf(loVal);
    const hx = xOf(hiVal);
    nodes.push(
      line([lx, y], [hx, y], { stroke: color, width: 7 }).glow(9, color),
      line([lx, y - 18], [lx, y + 18], {
        stroke: highlightLower ? ROLE.threshold : color,
        width: 4.5,
      }),
      line([hx, y - 18], [hx, y + 18], { stroke: color, width: 4.5 }),
    );
    if (highlightLower && progress > 0.9) {
      nodes.push(glowDot(lx, y, { radius: 9, color: ROLE.threshold, glow: 14 }));
    }
    if (showEndpoints && progress > 0.92) {
      nodes.push(
        txt(
          `${formatPoints(interval[0])} pp`,
          lx,
          y + 48,
          28,
          highlightLower ? ROLE.threshold : color,
          'mono',
        ),
        txt(`${formatPoints(interval[1])} pp`, hx, y + 48, 28, color, 'mono'),
      );
    }
    if (clearance > 0.02 && interval[0] > MIN_USEFUL_LIFT && progress > 0.92) {
      const xMin = xOf(MIN_USEFUL_LIFT);
      const tipX = mix(xMin, lx, clearance);
      nodes.push(
        line([xMin, y - 34], [tipX, y - 34], { stroke: ROLE.threshold, width: 4.5 }).glow(
          10,
          ROLE.threshold,
        ),
        glowDot(tipX, y - 34, { radius: 7, color: ROLE.threshold, glow: 12 }),
      );
    }
  }
  return group(...nodes);
}

/** Exact human-readable lift verdict matching usefulLiftDecision. */
export function liftVerdictText(interval) {
  return {
    'clears-useful-lift': 'Switch to B  ·  Lower bound clears +2 pp',
    'positive-size-unestablished': 'Positive lift, useful size unconfirmed  ·  Hold',
    regression: 'Evidence of regression  ·  Hold the switch',
    inconclusive: 'Interval crosses zero  ·  Hold the switch',
  }[usefulLiftDecision(interval, MIN_USEFUL_LIFT)];
}
