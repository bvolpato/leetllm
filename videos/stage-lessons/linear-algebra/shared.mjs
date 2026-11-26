// Shared cinematic visual components, linear-algebra math helpers, and build-time
// invariants for the Linear Algebra stage lesson (28 scenes).
// All math is imported directly from videos/films/linear-algebra/.
import {
  Node,
  arrow,
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
  rightAngle,
  text,
} from 'vizmatic/stage';
import { dotProduct, normalizeVector } from 'vizmatic';
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
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';
import {
  apply,
  clamp,
  complete,
  mix,
  solvePair,
  sum,
} from '../../films/linear-algebra/arithmetic.mjs';
import {
  A,
  B,
  U,
  V,
  common,
  conditioningMatrix,
  contrast,
  dispatchWeights,
  labels,
  mean,
  severity,
  strengths,
} from '../../films/linear-algebra/fixtures.mjs';
import {
  basisFrame,
  compressionFrame,
  conditioningResult,
  conditioningState,
  decisionFrame,
  duplicateFitFrame,
  gramCalculation,
  gramConstruction,
  gramProductCues,
  leastSquaresFit,
  leastSquaresFrame,
  pairedSignFrame,
  pcaFrame,
  rankFrame,
  retrievalFrame,
  solverRoundingExample,
  sparseFrame,
  spreadFrame,
  strengthFrame,
  svdBuild,
  svdFrame,
  ticketMeasurement,
} from '../../films/linear-algebra/model.mjs';

export {
  A,
  B,
  COSMOS,
  U,
  V,
  apply,
  basisFrame,
  cinematic3d,
  clamp,
  common,
  complete,
  compressionFrame,
  conditioningMatrix,
  conditioningResult,
  conditioningState,
  contrast,
  decisionFrame,
  dispatchWeights,
  dotProduct,
  duplicateFitFrame,
  glowDot,
  glowTex,
  glowingTrail,
  gramCalculation,
  gramConstruction,
  gramProductCues,
  guardedDynamic,
  heroTitle,
  labels,
  leastSquaresFit,
  leastSquaresFrame,
  linear,
  linearGradient,
  mean,
  metricReadout,
  mix,
  normalizeVector,
  orbitScene,
  pairedSignFrame,
  pcaFrame,
  polyPath,
  radialGradient,
  rankFrame,
  retrievalFrame,
  severity,
  solvePair,
  solverRoundingExample,
  sparseFrame,
  spreadFrame,
  strengthFrame,
  strengths,
  sum,
  svdBuild,
  svdFrame,
  text,
  ticketMeasurement,
  txt,
};

/** Semantic color roles kept strictly consistent across all 28 scenes. */
export const LA = Object.freeze({
  slow: COSMOS.blue,
  common: COSMOS.blue,
  rollback: COSMOS.rose,
  contrast: COSMOS.rose,
  both: COSMOS.emerald,
  fit: COSMOS.emerald,
  gold: COSMOS.gold,
  cyan: COSMOS.cyan,
  violet: COSMOS.violet,
  amber: COSMOS.amber,
  tickets: [COSMOS.blue, COSMOS.rose, COSMOS.emerald],
  ticketNames: ['Slow pages', 'Rollback', 'Both issues'],
});

/** Precomputed exact fixtures reused across scenes. */
export const GRAM_DATA = gramCalculation(A);
export const LS_FIT = leastSquaresFit(A);
export const DUP_FIT = leastSquaresFit(B);
export const SOLVER_EXACT = solverRoundingExample(3, 0);
export const SOLVER_ROUNDED = solverRoundingExample(3, 1);

/** Build-time mathematical invariants asserting every spoken number across all 28 scenes. */
export function verifyLinearAlgebraInvariants() {
  // Core matrix A and orthonormal basis V = [common, contrast]
  verifyInvariant(A.length === 3 && A[0].length === 2, 'A must be 3x2');
  verifyApprox(dotProduct(common, common), 1, 1e-12, 'common unit length');
  verifyApprox(dotProduct(contrast, contrast), 1, 1e-12, 'contrast unit length');
  verifyApprox(dotProduct(common, contrast), 0, 1e-12, 'common perp contrast');

  // Basis projection of [3, 1] onto common -> [2, 2], residual [1, -1]
  const bf = basisFrame({ beat: 2 });
  verifyApprox(bf.projected[0], 2, 1e-12, 'basis projection x');
  verifyApprox(bf.projected[1], 2, 1e-12, 'basis projection y');
  verifyApprox(dotProduct([1, -1], common), 0, 1e-12, 'basis residual orthogonal');

  // Common and contrast output strengths: sqrt(3) and 1
  const sf = strengthFrame({ beat: 2 });
  verifyApprox(sum(sf.squaredTerms[0]), 3, 1e-12, 'common squared norm = 3');
  verifyApprox(sum(sf.squaredTerms[1]), 1, 1e-12, 'contrast squared norm = 1');
  verifyApprox(sf.norms[0], Math.sqrt(3), 1e-12, 'sigma_1 = sqrt(3)');
  verifyApprox(sf.norms[1], 1, 1e-12, 'sigma_2 = 1');

  // Gram matrix A^T A = [[2,1],[1,2]] and eigenvalues [3, 1]
  verifyApprox(GRAM_DATA.gram[0][0], 2, 1e-12, 'G[0,0] = 2');
  verifyApprox(GRAM_DATA.gram[0][1], 1, 1e-12, 'G[0,1] = 1');
  verifyApprox(GRAM_DATA.gram[1][0], 1, 1e-12, 'G[1,0] = 1');
  verifyApprox(GRAM_DATA.gram[1][1], 2, 1e-12, 'G[1,1] = 2');
  verifyApprox(GRAM_DATA.directions[0].eigenvalue, 3, 1e-12, 'lambda_1 = 3');
  verifyApprox(GRAM_DATA.directions[1].eigenvalue, 1, 1e-12, 'lambda_2 = 1');

  // SVD reconstruction and paired sign invariance
  for (const sign of [1, -1]) {
    const svd = svdBuild(1, sign);
    verifyApprox(svd.output[0], 1, 1e-12, `svd output[0] sign=${sign}`);
    verifyApprox(svd.output[1], 0, 1e-12, `svd output[1] sign=${sign}`);
    verifyApprox(svd.output[2], 1, 1e-12, `svd output[2] sign=${sign}`);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        verifyApprox(svd.reconstruction[i][j], A[i][j], 1e-12, `svd A[${i},${j}] sign=${sign}`);
      }
    }
  }

  // Rank-1 truncation error = 1 and collision of slow/rollback at [0.5, 0.5]
  const comp = compressionFrame({ beat: 1 });
  verifyApprox(comp.error, 1, 1e-12, 'rank-1 Frobenius error = 1');
  verifyApprox(comp.rows[0][0], 0.5, 1e-12, 'rank-1 row 0 col 0');
  verifyApprox(comp.rows[1][0], 0.5, 1e-12, 'rank-1 row 1 col 0');

  // Retrieval cosine ties after dropping contrast
  const ret = retrievalFrame({ beat: 1 });
  verifyApprox(ret.scores[0], 1, 1e-12, 'collapsed cosine 0');
  verifyApprox(ret.scores[1], 1, 1e-12, 'collapsed cosine 1');
  verifyApprox(ret.scores[2], 1, 1e-12, 'collapsed cosine 2');

  // PCA centering & spread: mean = [2/3, 2/3], common energy 1/3, contrast energy 1, cross sum 0
  const pca = pcaFrame({ beat: 3 });
  verifyApprox(mean[0], 2 / 3, 1e-12, 'mean x = 2/3');
  verifyApprox(mean[1], 2 / 3, 1e-12, 'mean y = 2/3');
  verifyApprox(pca.energies[0], 1 / 3, 1e-12, 'centered common energy = 1/3');
  verifyApprox(pca.energies[1], 1, 1e-12, 'centered contrast energy = 1');
  verifyApprox(dotProduct(pca.scores[0], pca.scores[1]), 0, 1e-12, 'centered cross sum = 0');
  verifyApprox(
    dotProduct(pca.currentQuery, contrast),
    -1 / Math.SQRT2,
    1e-12,
    'new ticket [2,1] centered contrast score',
  );

  // Sparse matrix densification: 6 nonzeros -> 36 nonzeros
  verifyInvariant(
    sparseFrame({ beat: 0, cues: { 'sparse-center': { phase: 'before' } } }).nonzeros === 6,
    'sparse 6 nonzeros',
  );
  verifyInvariant(sparseFrame({ beat: 1 }).nonzeros === 36, 'dense 36 nonzeros');

  // Least squares full-rank: w = [2/3, 5/3], pred = [2/3, 5/3, 7/3], residual = [1/3, 1/3, -1/3], SSE = 1/3
  verifyApprox(LS_FIT.weights[0], 2 / 3, 1e-12, 'ls w0 = 2/3');
  verifyApprox(LS_FIT.weights[1], 5 / 3, 1e-12, 'ls w1 = 5/3');
  verifyApprox(LS_FIT.squaredError, 1 / 3, 1e-12, 'ls SSE = 1/3');
  verifyApprox(dotProduct(LS_FIT.columns[0], LS_FIT.residual), 0, 1e-12, 'residual perp col 0');
  verifyApprox(dotProduct(LS_FIT.columns[1], LS_FIT.residual), 0, 1e-12, 'residual perp col 1');

  // Rank-1 duplicate columns & nullspace: pred = [1.5, 0, 1.5], min-norm w = [0.75, 0.75]
  verifyApprox(DUP_FIT.weightSum, 1.5, 1e-12, 'duplicate weight sum = 1.5');
  verifyApprox(DUP_FIT.weights[0], 0.75, 1e-12, 'min-norm w0 = 0.75');
  verifyApprox(DUP_FIT.weights[1], 0.75, 1e-12, 'min-norm w1 = 0.75');
  verifyApprox(dotProduct(apply(B, [1, -1]), apply(B, [1, -1])), 0, 1e-12, 'nullspace [1,-1]');

  // Conditioning: kappa = 100, output 0.002 + 0.001 = 0.003 -> input 0.30 (error 0.10)
  const cond = conditioningState({ beat: 2 });
  verifyApprox(cond.conditionNumber, 100, 1e-12, 'kappa = 100');
  verifyApprox(cond.measuredOutput[1], 0.003, 1e-12, 'measured output 0.003');
  verifyApprox(cond.recovered[1], 0.3, 1e-12, 'recovered input 0.3');

  // Solver rounding: exact w2 = 2.025 vs rounded normal-eq w2 = 1.15
  verifyApprox(SOLVER_EXACT.normalWeights[1], 2.025, 1e-10, 'exact w2 = 2.025');
  verifyApprox(SOLVER_ROUNDED.normalWeights[1], 1.15, 1e-10, 'rounded normal-eq w2 = 1.15');
  verifyApprox(SOLVER_EXACT.storedTarget[0], 6.081, 1e-12, 'rhs[0] = 6.081');
  verifyApprox(SOLVER_EXACT.storedTarget[1], 6.20424, 1e-12, 'rhs[1] = 6.20424');

  // Energy cutoff [6, 3, 1] -> squares [36, 9, 1], total 46, 45/46 >= 95%
  verifyInvariant(6 ** 2 + 3 ** 2 + 1 ** 2 === 46, 'energy total 46');
  verifyInvariant(36 + 9 === 45, 'top-2 energy 45');
  verifyInvariant(45 / 46 > 0.95 && 36 / 46 < 0.95, 'rank 2 smallest >= 95%');

  // LoRA parameter counts: 4096^2 = 16,777,216 vs 2 * 4096 * 8 = 65,536
  verifyInvariant(4096 * 4096 === 16777216, 'full layer 16,777,216');
  verifyInvariant(2 * 4096 * 8 === 65536, 'LoRA rank-8 65,536');

  // New routing objective & decision dispatch codes [1, 2, 3, 0]
  const counters = ticketMeasurement(
    [
      [0, 0],
      [4, 4],
    ],
    0,
  );
  verifyApprox(counters.scores[0] * Math.SQRT2, 0, 1e-12, 'total [0,0] = 0');
  verifyApprox(counters.scores[1] * Math.SQRT2, 8, 1e-12, 'total [4,4] = 8');
  const codes = [...A, [0, 0]].map((row) => dotProduct(row, dispatchWeights));
  verifyInvariant(codes.join(',') === '1,2,3,0', '4 distinct dispatch codes');
}

/** Format a number with proper typographic minus sign. */
export function fmt(val, digits = 2) {
  const n = Math.abs(val) < 5e-10 ? 0 : val;
  const str = n.toFixed(digits);
  return str.startsWith('-') ? '\u2212' + str.slice(1) : str;
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
  color = '#334674',
  accent = COSMOS.cyan,
  opacity = 0.62,
  yOffset = 0,
  seed = 1,
} = {}) {
  const lines = [];
  for (let x = -800; x <= 800; x += 160) {
    lines.push(line([x, -460 + yOffset], [x, 460 + yOffset], { stroke: color, width: 1.3 }));
  }
  for (let y = -400; y <= 400; y += 160) {
    lines.push(line([-880, y + yOffset], [880, y + yOffset], { stroke: color, width: 1.3 }));
  }
  const arcs = [
    circle(560, { fill: null, stroke: accent, width: 1.4, dash: [10, 14] }).opacity(0.32),
    circle(820, { fill: null, stroke: '#5c7dc4', width: 1.2, dash: [6, 18] }).opacity(0.26),
  ];
  const stars = [];
  for (let i = 0; i < 110; i++) {
    const sx = Math.sin((i + seed * 19) * 127.1 + 3.7) * 43758.5453;
    const sy = Math.sin((i + seed * 31) * 269.5 + 9.1) * 19642.349;
    const x = -930 + (sx - Math.floor(sx)) * 1860;
    const y = -510 + (sy - Math.floor(sy)) * 1020;
    const r = 0.9 + (i % 4) * 0.36;
    const op = 0.18 + (i % 5) * 0.055;
    stars.push(
      dot(r, i % 9 === 0 ? accent : '#98afd9')
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
  return markDecor(
    group(
      new Node(path).stroke(color, width, 0.72).glow(glow, color),
      dot(6.5, '#ffffff').at(px, py).glow(14, color),
    ),
  );
}

/** Safe glowing arrow helper that avoids degenerate zero-length arrows. */
export function vecArrow(
  from,
  to,
  { color = COSMOS.cyan, width = 5.2, tip = 14, glow = 10, opacity = 1 } = {},
) {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  if (len < 3) return dot(Math.max(4, width), color).at(from[0], from[1]).opacity(opacity);
  const node = arrow(from, to, { stroke: color, width, tip }).opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/**
 * 3Blue1Brown-style luminous 2D vector plane with optional live linear transformation matrix M.
 * Grid and warped mesh lines are marked decorative so labels never trigger text_crowded.
 */
export function vectorPlane2d({
  originX = 0,
  originY = 0,
  scale = 180,
  xRange = [-2, 2],
  yRange = [-2, 2],
  step = 1,
  matrix = null,
  xLabel = '',
  yLabel = '',
  unitCircle = false,
  circleColor = COSMOS.cyan,
  opacity = 1,
} = {}) {
  const toScreen = (wx, wy) => [originX + wx * scale, originY - wy * scale];
  const applyM = (wx, wy) =>
    matrix
      ? [matrix[0][0] * wx + matrix[0][1] * wy, matrix[1][0] * wx + matrix[1][1] * wy]
      : [wx, wy];

  const decorParts = [];
  // Faint static reference grid
  for (let gx = Math.ceil(xRange[0]); gx <= Math.floor(xRange[1]); gx += step) {
    decorParts.push(
      line(toScreen(gx, yRange[0]), toScreen(gx, yRange[1]), {
        stroke: gx === 0 ? '#50648f' : '#253357',
        width: gx === 0 ? 2.4 : 1.3,
      }),
    );
  }
  for (let gy = Math.ceil(yRange[0]); gy <= Math.floor(yRange[1]); gy += step) {
    decorParts.push(
      line(toScreen(xRange[0], gy), toScreen(xRange[1], gy), {
        stroke: gy === 0 ? '#50648f' : '#253357',
        width: gy === 0 ? 2.4 : 1.3,
      }),
    );
  }

  // Optional transformed 3b1b lattice when a 2x2 matrix is supplied
  if (matrix) {
    for (let gx = Math.ceil(xRange[0]); gx <= Math.floor(xRange[1]); gx += step) {
      const p0 = toScreen(...applyM(gx, yRange[0]));
      const p1 = toScreen(...applyM(gx, yRange[1]));
      decorParts.push(
        line(p0, p1, {
          stroke: gx === 0 ? COSMOS.cyan : '#3a7bb8',
          width: gx === 0 ? 3 : 1.8,
        }).opacity(gx === 0 ? 0.72 : 0.45),
      );
    }
    for (let gy = Math.ceil(yRange[0]); gy <= Math.floor(yRange[1]); gy += step) {
      const p0 = toScreen(...applyM(xRange[0], gy));
      const p1 = toScreen(...applyM(xRange[1], gy));
      decorParts.push(
        line(p0, p1, {
          stroke: gy === 0 ? COSMOS.cyan : '#3a7bb8',
          width: gy === 0 ? 3 : 1.8,
        }).opacity(gy === 0 ? 0.72 : 0.45),
      );
    }
  }

  // Optional unit circle (transformed by matrix if supplied)
  if (unitCircle) {
    const pts = [];
    const N = 72;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      pts.push(toScreen(...applyM(Math.cos(a), Math.sin(a))));
    }
    decorParts.push(new Node(polyPath(pts)).stroke(circleColor, 2.8, 0.85).glow(8, circleColor));
  }

  const parts = [markDecor(group(...decorParts))];
  if (xLabel) {
    const [ex, ey] = toScreen(xRange[1], 0);
    parts.push(txt(xLabel, ex, ey + 42, 26, COSMOS.muted, 'mono', 'right'));
  }
  if (yLabel) {
    const [tx, ty] = toScreen(0, yRange[1]);
    parts.push(txt(yLabel, tx + 22, ty + 6, 26, COSMOS.muted, 'mono', 'left'));
  }

  return {
    node: group(...parts).opacity(opacity),
    pt: toScreen,
    applyM,
  };
}

/** Crisp glowing bracketed matrix without heavy card chrome. */
export function bracketMatrix(
  rows,
  {
    cx = 0,
    cy = 0,
    cellW = 104,
    cellH = 74,
    textSize = 36,
    bracketColor = COSMOS.cyan,
    cellColor = () => COSMOS.ink,
    cellFill = null,
    highlightCell = null,
    formatCell = (v) => (typeof v === 'string' ? v : fmt(v, 0)),
    opacity = 1,
  } = {},
) {
  const nRows = rows.length;
  const nCols = rows[0].length;
  const totalW = nCols * cellW + 34;
  const totalH = nRows * cellH + 22;
  const xL = cx - totalW / 2;
  const xR = cx + totalW / 2;
  const yT = cy - totalH / 2;
  const yB = cy + totalH / 2;
  const arm = 18;

  const parts = [
    markDecor(
      group(
        line([xL + arm, yT], [xL, yT], { stroke: bracketColor, width: 3.2 }),
        line([xL, yT], [xL, yB], { stroke: bracketColor, width: 3.2 }),
        line([xL, yB], [xL + arm, yB], { stroke: bracketColor, width: 3.2 }),
        line([xR - arm, yT], [xR, yT], { stroke: bracketColor, width: 3.2 }),
        line([xR, yT], [xR, yB], { stroke: bracketColor, width: 3.2 }),
        line([xR, yB], [xR - arm, yB], { stroke: bracketColor, width: 3.2 }),
      ).glow(5, bracketColor),
    ),
  ];

  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      const px = cx + (c - (nCols - 1) / 2) * cellW;
      const py = cy + (r - (nRows - 1) / 2) * cellH;
      const isHi = highlightCell && highlightCell[0] === r && highlightCell[1] === c;
      const bg = cellFill ? cellFill(r, c, rows[r][c]) : isHi ? '#ffd16628' : null;
      if (bg || isHi) {
        parts.push(
          markDecor(
            rect(cellW - 10, cellH - 10, {
              fill: bg ?? '#ffd16628',
              stroke: isHi ? COSMOS.gold : null,
              width: isHi ? 2.4 : 0,
              radius: 10,
            }).at(px, py),
          ),
        );
      }
      const col = cellColor(r, c, rows[r][c]);
      const tNode = txt(formatCell(rows[r][c], r, c), px, py, textSize, col, 'mono');
      if (isHi) tNode.glow(8, col);
      parts.push(tNode);
    }
  }
  return group(...parts).opacity(opacity);
}

/** Luminous horizontal number scale with ticks, zero axis, and custom marks. */
export function numberRuler({
  cx = 0,
  cy = 0,
  width = 1100,
  min = 0,
  max = 2,
  ticks = [0, 1, 2],
  caption = '',
  opacity = 1,
} = {}) {
  const x0 = cx - width / 2;
  const mapX = (v) => x0 + ((v - min) / (max - min)) * width;
  const parts = [
    markDecor(
      group(
        line([x0, cy], [x0 + width, cy], { stroke: '#4d618f', width: 3.5 }),
        line([x0, cy], [x0 + width, cy], { stroke: COSMOS.cyan, width: 1.5 }).opacity(0.5),
      ),
    ),
  ];
  for (const t of ticks) {
    const tx = mapX(t);
    const isZero = Math.abs(t) < 1e-9;
    parts.push(
      markDecor(
        line([tx, cy - (isZero ? 16 : 11)], [tx, cy + (isZero ? 16 : 11)], {
          stroke: isZero ? COSMOS.ink : '#7d92bf',
          width: isZero ? 3 : 2.2,
        }),
      ),
      txt(fmt(t, Number.isInteger(t) ? 0 : 1), tx, cy + 58, 26, COSMOS.muted, 'mono'),
    );
  }
  if (caption) {
    parts.push(txt(caption, cx, cy + 108, 26, COSMOS.muted, 'sans'));
  }
  return {
    node: group(...parts).opacity(opacity),
    mapX,
  };
}

export { decorAura as aura, rightAngle };
