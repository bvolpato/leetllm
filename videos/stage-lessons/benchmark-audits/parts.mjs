// Shared cinematic math, invariants, 3D domain-native surfaces, and luminous UI for `benchmark-audits`.
import {
  arrow,
  circle,
  curve3d,
  delay,
  gridPlane3d,
  line,
  line3d,
  linear,
  par,
  points3d,
  rect,
  surface,
} from 'vizmatic/stage';
import {
  binomialChoose,
  exactPairedP,
  preferenceProbability,
  rankedPrecision,
  strictMetricRecord,
  subsetCoverage,
  wilsonInterval,
} from '../../films/benchmark-audits/arithmetic.mjs';
import {
  CASES,
  PAIRS,
  PROGRAMS,
  RELEASES,
  exposureCases,
  probes,
} from '../../films/benchmark-audits/fixtures.mjs';
import {
  checkProbe,
  freshAuditDecision,
  releaseResult,
  scoreCases,
} from '../../films/benchmark-audits/model.mjs';
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
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  CASES,
  CINEMA_FRAME,
  COSMOS,
  PAIRS,
  PROGRAMS,
  RELEASES,
  aura,
  binomialChoose,
  checkProbe,
  cinematic3d,
  exactPairedP,
  exposureCases,
  freshAuditDecision,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout,
  morphEquation,
  orbitScene,
  preferenceProbability,
  probes,
  rankedPrecision,
  releaseResult,
  rule,
  scoreCases,
  strictMetricRecord,
  subsetCoverage,
  txt,
  verifyApprox,
  verifyInvariant,
  wilsonInterval,
  wireframeSlab3d,
};

/** Semantic color roles kept consistent across all 25 benchmark-audits scenes. */
export const ROLE = Object.freeze({
  A: COSMOS.cyan,
  B: COSMOS.blue,
  pass: COSMOS.emerald,
  fail: COSMOS.rose,
  exposed: COSMOS.violet,
  focus: COSMOS.gold,
  accent: COSMOS.amber,
});

/** Policy table shared across gold-contract, rag-stage, and judge-controls. */
export const POLICY = Object.freeze([
  { id: 'P1', question: 'freeze deployment', fact: 'commander approval' },
  { id: 'P2', question: 'threshold breach', fact: 'rollback runbook' },
  { id: 'P3', question: 'exposed tokens', fact: 'revoke within 15 min' },
]);

/** Build-time mathematical invariant suite covering every spoken number in benchmark-audits. */
export function verifyBenchmarkInvariants() {
  verifyInvariant(CASES.length === 100, 'library fixture must contain 100 cases');
  verifyInvariant(scoreCases('A').correct === 90, 'Assistant A overall = 90/100');
  verifyInvariant(scoreCases('B').correct === 90, 'Assistant B overall = 90/100');
  verifyInvariant(scoreCases('A', 'ordinary').correct === 88, 'Assistant A ordinary = 88/90');
  verifyInvariant(scoreCases('B', 'ordinary').correct === 81, 'Assistant B ordinary = 81/90');
  verifyInvariant(scoreCases('A', 'renewal').correct === 2, 'Assistant A renewals = 2/10');
  verifyInvariant(scoreCases('B', 'renewal').correct === 9, 'Assistant B renewals = 9/10');

  const probeLiterals = [0, 1, 2].map((i) => checkProbe(i).literal);
  const probeReviews = [0, 1, 2].map((i) => checkProbe(i).reviewed);
  verifyInvariant(
    probeLiterals.join(',') === 'true,true,false',
    'literal checker verdicts must be true,true,false',
  );
  verifyInvariant(
    probeReviews.join(',') === 'true,false,true',
    'reviewed checker verdicts must be true,false,true',
  );

  verifyApprox(rankedPrecision([1, 0, 1]), 5 / 6, 1e-12, 'AP([1, 0, 1]) = 5/6');
  verifyApprox(preferenceProbability(0), 0.5, 1e-12, 'Bradley-Terry delta=0 -> 0.5');
  verifyApprox(preferenceProbability(400), 10 / 11, 1e-12, 'Bradley-Terry delta=+400 -> 10/11');

  verifyInvariant(PAIRS.length === 28, '8 programs form 28 unordered pairs');
  const passingPairs = PAIRS.filter((p) => p.pass).length;
  const lowerIdxWins = PAIRS.filter((p) => PROGRAMS[p.a - 1].pass).length;
  verifyInvariant(passingPairs === 13, '13 of 28 pairs contain a passing program');
  verifyInvariant(lowerIdxWins === 8, '8 of 28 pairs return a passing lower index');
  verifyApprox(subsetCoverage(8, 2, 2), 13 / 28, 1e-12, 'pass@2(8, 2) = 13/28');

  const plugin10 = 1 - (1 - 20 / 100) ** 10;
  verifyApprox(plugin10, 0.8926258176, 1e-6, 'plug-in pass@10(100, 20) ~ 0.8926');
  verifyApprox(subsetCoverage(100, 20, 10), 0.904889, 1e-5, 'unbiased pass@10(100, 20) ~ 0.9049');
  verifyApprox(subsetCoverage(4, 4, 2), 1, 1e-12, 'Problem X pass@2 = 1');
  verifyApprox(subsetCoverage(4, 0, 2), 0, 1e-12, 'Problem Y pass@2 = 0');
  verifyApprox(subsetCoverage(8, 4, 2), 22 / 28, 1e-12, 'pooled pass@2(8, 4) = 22/28 ~ 0.786');

  verifyApprox(0.8 ** 3, 0.512, 1e-12, '0.8^3 = 0.512');
  verifyApprox(0.8 ** 30, 0.001237940039, 1e-9, '0.8^30 ~ 0.00124');

  verifyApprox(wilsonInterval(3, 3, 1.96).low, 0.43849391955, 1e-6, 'Wilson 3/3 low ~ 0.4385');
  verifyApprox(wilsonInterval(49, 50, 1.96).low, 0.895, 1e-3, 'Wilson 49/50 low ~ 0.895');
  verifyApprox(wilsonInterval(990, 1000, 1.96).low, 0.982, 1e-3, 'Wilson 990/1000 low ~ 0.982');

  verifyApprox(exactPairedP(9, 1), 0.021484375, 1e-12, 'McNemar(9, 1) = 22/1024');
  verifyApprox(exactPairedP(3, 1), 0.625, 1e-12, 'McNemar(3, 1) = 10/16');
  verifyApprox(exactPairedP(5, 0), 0.0625, 1e-12, 'McNemar(5, 0) = 2/32');
  verifyApprox(exactPairedP(10, 2), 0.03857421875, 1e-10, 'McNemar(10, 2) ~ 0.0386');

  const fresh = freshAuditDecision();
  verifyInvariant(fresh.baselinePass === 180, 'archive baseline = 180/200');
  verifyInvariant(fresh.candidatePass === 188, 'archive candidate = 188/200');
  verifyApprox(fresh.criticalLower, 0.5958436145, 1e-6, 'archive Wilson 9/10 low ~ 0.5958');
  verifyInvariant(fresh.ship === false, 'archive release must hold');

  verifyInvariant(
    RELEASES.map((r) => releaseResult(r, 2).eligible).join(',') === 'false,true,false',
    'only Balanced passes all four gates',
  );
  verifyInvariant(
    strictMetricRecord({ policy: 0.99, schema: 1, ms: 680, cost: 0.008 }),
    'valid balanced telemetry passes strict validator',
  );
  verifyInvariant(
    !strictMetricRecord({ policy: Number.NaN, schema: 1, ms: 680, cost: 0.008 }),
    'NaN policy must be rejected by strict validator',
  );
  verifyInvariant(
    !strictMetricRecord({ policy: 0.99, schema: 1, ms: -1, cost: 0.008 }),
    'negative latency must be rejected by strict validator',
  );
}

/** Convert `#rrggbb` + alpha in [0, 1] to `#rrggbbaa` for Vizmatic's `rect({ fill })`. */
export function hexAlpha(hex, alpha = 1) {
  if (typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) return hex;
  const byte = Math.max(0, Math.min(255, Math.round(alpha * 255)))
    .toString(16)
    .padStart(2, '0');
  return `${hex}${byte}`;
}

/** Soft luminous bar without heavy slide-card borders. */
export function lumBar(
  cx,
  cy,
  w,
  h,
  {
    color = COSMOS.cyan,
    fillOpacity = 0.28,
    strokeWidth = 2.2,
    glow = 8,
    radius = 8,
    opacity = 1,
    dash,
  } = {},
) {
  const node = rect(Math.max(2, w), Math.max(2, h), {
    fill: fillOpacity > 0.005 ? hexAlpha(color, fillOpacity) : null,
    stroke: strokeWidth > 0 ? color : null,
    width: strokeWidth,
    radius,
    dash,
  })
    .at(cx, cy)
    .opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Glowing open ring (orbital highlights, beacons, focus markers). */
export function glowRing(
  cx,
  cy,
  r,
  color = COSMOS.gold,
  { width = 3, glow = 8, opacity = 1, dash } = {},
) {
  const node = circle(Math.max(2, r), {
    fill: null,
    stroke: color,
    width,
    dash,
  })
    .at(cx, cy)
    .opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Glowing directional arrow helper. */
export function glowArrow(
  from,
  to,
  color = COSMOS.gold,
  { width = 3.4, tip = 12, opacity = 1 } = {},
) {
  return arrow(from, to, { stroke: color, width, tip }).glow(6, color).opacity(opacity);
}

/** Smooth quadratic arc between two points with screen glow. */
export function glowingArc(
  from,
  to,
  bend = -40,
  { color = COSMOS.gold, width = 3.2, glow = 8, opacity = 0.9, steps = 24 } = {},
) {
  const mx = (from[0] + to[0]) * 0.5;
  const my = (from[1] + to[1]) * 0.5 + bend;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * from[0] + 2 * u * t * mx + t * t * to[0],
      u * u * from[1] + 2 * u * t * my + t * t * to[1],
    ]);
  }
  return glowingTrail(pts, { color, width, glow, opacity, core: false });
}

/** Non-overlapping crossfade helper: outgoing drops to 0 before incoming crosses 0.02. */
export function fadeOut(v) {
  return Math.max(0, 1 - v * 2.6);
}

/** Non-overlapping crossfade helper: incoming rises only after outgoing has vanished. */
export function fadeIn(v) {
  return Math.max(0, (v - 0.45) / 0.55);
}

/** Schedule a smooth value tween at a cue (`after: true` withholds until clause end). */
export function tweenCue(s, c, cueId, val, to, { duration = 0.55, after = false, ease } = {}) {
  const fire = () => {
    const opts = ease ? { duration, ease } : { duration };
    s.play(val.to(to, opts));
  };
  if (after) c.after(cueId, fire);
  else c.on(cueId, fire);
}

/** Drive continuous subtle ambient phase across the entire scene window. */
export function runAmbientPhase(s, c, phaseVal, cycles = 2.2) {
  const dur = Math.max(0.5, c.end - c.start - 0.35);
  c.at(0.05, () => {
    s.play(phaseVal.to(cycles * Math.PI * 2, { duration: dur, ease: linear }));
  });
}

/** Smoothly cross-fade two visibility layers with zero P5 overlap. */
export function crossSwap(s, c, cueId, outVal, inVal, { duration = 0.55, after = false } = {}) {
  const fire = () => {
    const half = duration * 0.48;
    s.play(
      par(outVal.to(0, { duration: half }), delay(inVal.to(1, { duration: half }), half * 0.96)),
    );
  };
  if (after) c.after(cueId, fire);
  else c.on(cueId, fire);
}

/** Map 2D world coordinates in `[xMin, xMax] x [yMin, yMax]` to canvas box `(left, top, w, h)`. */
export function makePlot(left, top, w, h, { x = [0, 1], y = [0, 1] } = {}) {
  const px = (wx) => left + ((wx - x[0]) / (x[1] - x[0])) * w;
  const py = (wy) => top + h - ((wy - y[0]) / (y[1] - y[0])) * h;
  const pt = (p) => [px(p[0]), py(p[1])];
  const axesNodes = (opacity = 1) => [
    rule(left, top + h, left + w, top + h, COSMOS.muted, 2.4).opacity(opacity * 0.85),
    rule(left, top, left, top + h, COSMOS.muted, 2.4).opacity(opacity * 0.85),
  ];
  return { px, py, pt, axesNodes, left, top, w, h, right: left + w, bottom: top + h };
}

/**
 * Orbiting 3D Bradley-Terry Logistic Preference Surface `q(R_A, R_B) = 1 / (1 + 10^((R_B - R_A)/400))`
 * with a glowing rating-gap geodesic moving from delta = 0 to delta = +400.
 */
export function buildBradleyTerrySurface3d(
  gapFn,
  { x = 440, y = 25, theta = -0.74, phi = 1.04, distance = 15.0, unit = 104 } = {},
) {
  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    focus: [0, 0, 0.7],
  }).at(x, y);

  view.add(
    surface(
      (wx, wy) => {
        const delta = (wx - wy) * 260;
        return 1.85 * preferenceProbability(delta);
      },
      {
        x: [-2.4, 2.4],
        y: [-2.4, 2.4],
        resolution: [34, 34],
        colors: ['#16133a', '#1d356b', '#23668e', '#48a9c5', '#fb923c', '#ffd166'],
        mesh: '#5ce1e6',
        meshOpacity: 0.14,
        meshWidth: 0.5,
        opacity: 0.84,
      },
    ),
  );

  // Diagonal geodesic along R_B = 0 as R_A varies
  view.add(
    curve3d(
      (t) => {
        const delta = -400 + t * 1200;
        const wx = delta / 260;
        return [
          Math.max(-2.3, Math.min(2.3, wx * 0.72)),
          0,
          1.85 * preferenceProbability(delta) + 0.08,
        ];
      },
      {
        t: [0, 1],
        samples: 56,
        color: COSMOS.gold,
        width: 3.8,
        glow: 10,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  // Live glowing beacon at current rating gap
  view.add(
    line3d(
      () => {
        const d = gapFn();
        const wx = Math.max(-2.3, Math.min(2.3, (d / 260) * 0.72));
        return [wx, 0, 1.85 * preferenceProbability(d)];
      },
      () => {
        const d = gapFn();
        const wx = Math.max(-2.3, Math.min(2.3, (d / 260) * 0.72));
        return [wx, 0, 1.85 * preferenceProbability(d) + 0.75];
      },
      { color: COSMOS.gold, width: 3.6, glow: 10, blend: 'screen', onTop: true },
    ),
  );
  view.add(
    points3d(
      () => {
        const d = gapFn();
        const wx = Math.max(-2.3, Math.min(2.3, (d / 260) * 0.72));
        return [[wx, 0, 1.85 * preferenceProbability(d) + 0.78]];
      },
      { color: COSMOS.gold, radius: 7.5, glow: 14, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}

/**
 * Orbiting 3D All-Pass Probability Cliff `z(p, n) = p^n` illustrating how a 3/3 perfect run
 * stays plausible at p = 0.80 while a 30/30 run collapses toward zero.
 */
export function buildUncertaintySurface3d(
  nFn,
  { x = 445, y = 25, theta = -0.76, phi = 1.04, distance = 15.0, unit = 104 } = {},
) {
  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    focus: [0, 0, 0.75],
  }).at(x, y);

  // wx in [-2.3, 2.3] -> p in [0.15, 1.0], wy in [-2.0, 2.0] -> n in [1, 30]
  const toP = (wx) => 0.15 + ((wx + 2.3) / 4.6) * 0.85;
  const toN = (wy) => 1 + ((wy + 2.0) / 4.0) * 29;
  const fromP = (p) => -2.3 + ((p - 0.15) / 0.85) * 4.6;
  const fromN = (n) => -2.0 + ((n - 1) / 29) * 4.0;

  view.add(
    surface((wx, wy) => 2.15 * toP(wx) ** toN(wy), {
      x: [-2.3, 2.3],
      y: [-2.0, 2.0],
      resolution: [36, 32],
      colors: ['#0c1736', '#163b64', '#1d728a', '#6ee7b7', '#fb923c', '#ffd166'],
      mesh: '#5ce1e6',
      meshOpacity: 0.14,
      meshWidth: 0.5,
      opacity: 0.86,
    }),
  );

  // Iso-p ridge at p = 0.80 across n = 1..30
  view.add(
    curve3d(
      (t) => {
        const n = 1 + t * 29;
        return [fromP(0.8), fromN(n), 2.15 * 0.8 ** n + 0.08];
      },
      {
        t: [0, 1],
        samples: 56,
        color: COSMOS.amber,
        width: 4.0,
        glow: 10,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  // Live operating beacon at (p=0.80, n=nFn())
  view.add(
    line3d(
      () => {
        const n = nFn();
        return [fromP(0.8), fromN(n), 2.15 * 0.8 ** n];
      },
      () => {
        const n = nFn();
        return [fromP(0.8), fromN(n), 2.15 * 0.8 ** n + 0.72];
      },
      { color: COSMOS.gold, width: 3.6, glow: 10, blend: 'screen', onTop: true },
    ),
  );
  view.add(
    points3d(
      () => {
        const n = nFn();
        return [[fromP(0.8), fromN(n), 2.15 * 0.8 ** n + 0.75]];
      },
      { color: COSMOS.gold, radius: 7.5, glow: 14, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}

/**
 * Orbiting 3D Contamination & Proxy Inflation vs Unseen Generalization Surface.
 * Reveals how leaked/tuned benchmarks create a deceptive high-score ridge that drops on untouched holdouts.
 */
export function buildContaminationSurface3d(
  splitFn = () => 0,
  { x = 455, y = 25, theta = -0.78, phi = 1.05, distance = 15.2, unit = 100 } = {},
) {
  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    focus: [0, 0, 0.7],
  }).at(x, y);

  // wx: development exposure / overlap [-2.2..2.2], wy: task novelty [-2.0..2.0]
  view.add(
    surface(
      (wx, wy) => {
        const exposurePeak = 1.65 * Math.exp(-((wx + 0.9) ** 2) / 1.4 - (wy + 0.6) ** 2 / 1.8);
        const trueRidge =
          0.95 * (1 / (1 + Math.exp(-(wx - 0.5) * 1.1))) * Math.exp(-(wy * wy) / 3.2);
        return Math.min(2.1, 0.25 + exposurePeak + trueRidge);
      },
      {
        x: [-2.3, 2.3],
        y: [-2.0, 2.0],
        resolution: [34, 30],
        colors: ['#0c1c36', '#1b4768', '#5c2d82', '#c93b6b', '#fb923c', '#ffd166'],
        mesh: '#a78bfa',
        meshOpacity: 0.14,
        meshWidth: 0.5,
        opacity: 0.84,
      },
    ),
  );

  // Glowing freeze/split boundary line across the surface
  view.add(
    curve3d(
      (t) => {
        const wy = -2.0 + t * 4.0;
        const wx = 0.15 + 0.25 * splitFn();
        const exposurePeak = 1.65 * Math.exp(-((wx + 0.9) ** 2) / 1.4 - (wy + 0.6) ** 2 / 1.8);
        const trueRidge =
          0.95 * (1 / (1 + Math.exp(-(wx - 0.5) * 1.1))) * Math.exp(-(wy * wy) / 3.2);
        return [wx, wy, 0.34 + exposurePeak + trueRidge];
      },
      {
        t: [0, 1],
        samples: 48,
        color: COSMOS.gold,
        width: 3.8,
        glow: 10,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  return { view };
}

/**
 * Orbiting 3D Multi-Axis Release Gate Manifold (Quality x Latency -> Feasibility Corner).
 */
export function buildGateManifold3d({
  x = 465,
  y = 25,
  theta = -0.72,
  phi = 1.05,
  distance = 15.2,
  unit = 98,
} = {}) {
  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    focus: [0, 0, 0.6],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-2.4, 2.4],
      y: [-2.2, 2.2],
      z: 0,
      step: 0.6,
      color: '#1c2642',
      opacity: 0.42,
    }),
  );

  // Smooth desirability hill peaking in the high-quality, low-latency corner (+x, -y)
  view.add(
    surface(
      (wx, wy) => {
        const qOk = 1 / (1 + Math.exp(-(wx - 0.35) * 2.4));
        const lOk = 1 / (1 + Math.exp((wy + 0.25) * 2.1));
        return 0.15 + 1.85 * qOk * lOk;
      },
      {
        x: [-2.3, 2.3],
        y: [-2.1, 2.1],
        resolution: [32, 32],
        colors: ['#16132b', '#272b59', '#1b556e', '#2ea8a0', '#6ee7b7', '#ffd166'],
        mesh: '#6ee7b7',
        meshOpacity: 0.14,
        meshWidth: 0.5,
        opacity: 0.82,
      },
    ),
  );

  // Map RELEASES onto 3D coordinates: quality [0.85..1.02] -> [-2.2..2.2], ms [0..2200] -> [-2.0..2.0]
  const to3 = (r) => [-2.2 + ((r.quality - 0.85) / 0.17) * 4.4, -2.0 + (r.ms / 2200) * 4.0];
  const beaconColors = [COSMOS.rose, COSMOS.emerald, COSMOS.amber];
  RELEASES.forEach((r, i) => {
    const [bx, by] = to3(r);
    const h = i === 1 ? 1.85 : 0.72;
    view.add(
      line3d([bx, by, 0], [bx, by, h], {
        color: beaconColors[i],
        width: 5.0,
        glow: 10,
        blend: 'screen',
        onTop: true,
      }),
    );
    view.add(
      points3d([[bx, by, h + 0.06]], {
        color: beaconColors[i],
        radius: 7.5,
        glow: 12,
        blend: 'screen',
        onTop: true,
      }),
    );
  });

  return { view };
}
