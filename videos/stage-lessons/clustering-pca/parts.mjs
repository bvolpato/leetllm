// Shared cinematic math, invariants, 3D PCA ellipsoid & K-means Voronoi builders for `clustering-pca`.
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
import { distance, kmeans, lloyd, silhouette } from '../../films/clustering-pca/arithmetic.mjs';
import {
  centroids,
  clusterTrials,
  coarseDistances,
  exactNearestIndex,
  inertia,
  initialInertia,
  labels,
  means,
  messages,
  normalizedScaleLabels,
  pca,
  query,
  rawScaleLabels,
  scaleFixture,
  seeds,
  stds,
  transferDocuments,
  transferQuery,
  updatedInertia,
  withinGroupDistances,
  xy,
} from '../../films/clustering-pca/fixtures.mjs';
import {
  cosine,
  emptyCenterRepair,
  energyRows,
  ivfState,
  scaleCalculation,
  seedMass,
  validateModel,
} from '../../films/clustering-pca/model.mjs';
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
  CINEMA_FRAME,
  COSMOS,
  aura,
  centroids,
  cinematic3d,
  clusterTrials,
  coarseDistances,
  cosine,
  distance,
  emptyCenterRepair,
  energyRows,
  exactNearestIndex,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  inertia,
  initialInertia,
  ivfState,
  kmeans,
  labels,
  lloyd,
  means,
  messages,
  metricReadout,
  morphEquation,
  normalizedScaleLabels,
  orbitScene,
  pca,
  query,
  rawScaleLabels,
  rule,
  scaleCalculation,
  scaleFixture,
  seedMass,
  seeds,
  silhouette,
  stds,
  transferDocuments,
  transferQuery,
  txt,
  updatedInertia,
  wireframeSlab3d,
  withinGroupDistances,
  xy,
};

export const LETTERS = Object.freeze(['A', 'B', 'C', 'D', 'E', 'F']);
export const GROUP_COLOR = Object.freeze([
  COSMOS.cyan,
  COSMOS.emerald,
  COSMOS.violet,
  COSMOS.amber,
]);
export const QUERY_COLOR = COSMOS.gold;
export const DANGER_COLOR = COSMOS.rose;

export const SCALE_CALC = scaleCalculation();
export const EMPTY_REPAIR = emptyCenterRepair();
export const SEED_MASS_A = seedMass([0]);
export const SEED_MASS_AF = seedMass([0, 5]);
export const ENERGY_ROWS = energyRows();
export const TOTAL_ENERGY = ENERGY_ROWS.reduce((s, r) => s + r.total, 0);
export const RETAINED_ENERGY = ENERGY_ROWS.reduce((s, r) => s + r.retained, 0);
export const DISCARDED_ENERGY = ENERGY_ROWS.reduce((s, r) => s + r.discarded, 0);

/** Build-time mathematical invariant suite backed by `videos/films/clustering-pca/model.mjs`. */
export function verifyClusteringPcaInvariants() {
  verifyInvariant(validateModel(), 'clustering-pca validateModel() must pass');
  verifyApprox(initialInertia, 3.48, 1e-12, 'initial 3-seed inertia = 3.48');
  verifyApprox(updatedInertia, 1.74, 1e-12, 'updated 3-centroid inertia = 1.74');
  verifyApprox(pca.varianceKept, 0.8519, 1e-3, 'PC1 keeps ~85.2% variance');
  verifyApprox(TOTAL_ENERGY, 65.6333333, 1e-5, 'total centered energy ~ 65.633');
  verifyApprox(RETAINED_ENERGY, 55.9126, 1e-3, 'retained energy ~ 55.913');
  verifyApprox(DISCARDED_ENERGY, 9.7207, 1e-3, 'discarded energy ~ 9.721');
  verifyApprox(SEED_MASS_A.total, 157.4, 1e-10, 'k-means++ D^2 total from A = 157.4');
  verifyInvariant(exactNearestIndex === 1, 'exact nearest message to query is B (index 1)');
  verifyInvariant(
    coarseDistances[1] < coarseDistances[0],
    'login centroid closer to query than billing',
  );
  verifyApprox(clusterTrials[0].silhouette, 0.56, 0.02, 'k=2 silhouette ~ 0.56');
  verifyApprox(clusterTrials[1].silhouette, 0.76, 0.02, 'k=3 silhouette ~ 0.76');
  verifyApprox(clusterTrials[2].silhouette, 0.51, 0.02, 'k=4 silhouette ~ 0.51');
  verifyApprox(800 / 818, 0.978, 1e-3, 'transfer corpus PC1 variance ~ 97.8%');
}

export function hexAlpha(hex, alpha = 1) {
  if (typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) return hex;
  const byte = Math.max(0, Math.min(255, Math.round(alpha * 255)))
    .toString(16)
    .padStart(2, '0');
  return `${hex}${byte}`;
}

export function lumBar(
  cx,
  cy,
  w,
  h,
  {
    color = COSMOS.cyan,
    fillOpacity = 0.32,
    strokeWidth = 2.2,
    glow = 8,
    radius = 8,
    opacity = 1,
    dash,
  } = {},
) {
  const node = rect(Math.max(2, w), Math.max(2, h), {
    fill: fillOpacity > 0.005 ? hexAlpha(color, fillOpacity) : null,
    stroke: color,
    width: strokeWidth,
    radius,
    dash,
  })
    .at(cx, cy)
    .opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

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

export function glowArrow(
  from,
  to,
  color = COSMOS.gold,
  { width = 3.4, tip = 12, opacity = 1 } = {},
) {
  return arrow(from, to, { stroke: color, width, tip }).glow(6, color).opacity(opacity);
}

export function tweenCue(s, c, cueId, val, to, { duration = 0.65, after = false, ease } = {}) {
  const fire = () => {
    const opts = ease ? { duration, ease } : { duration };
    s.play(val.to(to, opts));
  };
  if (after) c.after(cueId, fire);
  else c.on(cueId, fire);
}

export function runAmbientPhase(s, c, phaseVal, cycles = 2.2) {
  const dur = Math.max(0.5, c.end - c.start - 0.35);
  c.at(0.05, () => {
    s.play(phaseVal.to(cycles * Math.PI * 2, { duration: dur, ease: linear }));
  });
}

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
export function makePlot(left, top, w, h, { x = [0, 10], y = [0, 5.2] } = {}) {
  const px = (wx) => left + ((wx - x[0]) / (x[1] - x[0])) * w;
  const py = (wy) => top + h - ((wy - y[0]) / (y[1] - y[0])) * h;
  const pt = (p) => [px(p[0]), py(p[1])];
  const axesNodes = (opacity = 1) => [
    rule(left, top + h, left + w, top + h, COSMOS.rule, 2.2).opacity(opacity * 0.85),
    rule(left, top, left, top + h, COSMOS.rule, 2.2).opacity(opacity * 0.85),
  ];
  return { px, py, pt, axesNodes, left, top, w, h, right: left + w, bottom: top + h };
}

/**
 * Orbiting 3D K-means Voronoi Squared-Distance Bowl `min_k ||(x, y) - c_k||^2`
 * revealing Voronoi ridge walls and live glowing centroid wells.
 */
export function buildVoronoiBowl3d(
  centersFn,
  { x = 445, y = 10, theta = -0.75, phi = 1.05, distance: dist = 15.2, unit = 98 } = {},
) {
  const view = cinematic3d({
    theta,
    phi,
    distance: dist,
    unit,
    focus: [0, 0, 0.5],
  }).at(x, y);

  // Map 2D message coords [0..10] x [0..5] -> 3D [-2.4..2.4] x [-1.8..1.8]
  const to3d = (p) => [(p[0] - 4.7) * 0.52, (p[1] - 2.3) * 0.65];
  const bowlH = (wx, wy) => {
    const cs = centersFn();
    let best = Infinity;
    for (const c of cs) {
      const [cx, cy] = to3d(c);
      const d2 = (wx - cx) ** 2 + (wy - cy) ** 2;
      if (d2 < best) best = d2;
    }
    return Math.min(2.1, best * 0.34);
  };

  view.add(
    surface(bowlH, {
      x: [-2.6, 2.6],
      y: [-2.0, 2.0],
      resolution: [36, 32],
      colors: ['#0a2538', '#154463', '#2d3f8f', '#6b2f8a', '#c93b6b', '#ffd166'],
      mesh: '#5ce1e6',
      meshOpacity: 0.14,
      meshWidth: 0.55,
      opacity: 0.86,
    }),
  );

  // Glowing 3D centroid beacons rising out of the Voronoi basins
  view.add(
    points3d(
      () =>
        centersFn().map((c) => {
          const [cx, cy] = to3d(c);
          return [cx, cy, 0.16];
        }),
      { color: COSMOS.gold, radius: 7.5, glow: 14, blend: 'screen', onTop: true },
    ),
  );
  // Message points projected onto the bowl
  view.add(
    points3d(
      xy.map((p) => {
        const [mx, my] = to3d(p);
        return [mx, my, 0.35];
      }),
      { color: COSMOS.cyan, radius: 5.5, glow: 9, blend: 'screen', onTop: true },
    ),
  );

  return { view, to3d };
}

/**
 * Orbiting 3D PCA Variance Ellipsoid & Centered Point Cloud with glowing principal axes v_1, v_2.
 */
export function buildPcaEllipsoid3d(
  angleFn,
  { x = 445, y = 10, theta = -0.72, phi = 1.04, distance: dist = 14.8, unit = 102 } = {},
) {
  const view = cinematic3d({
    theta,
    phi,
    distance: dist,
    unit,
    focus: [0, 0, 0.35],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-2.6, 2.6],
      y: [-2.2, 2.2],
      z: -0.02,
      step: 0.65,
      color: '#1c2642',
      opacity: 0.38,
    }),
  );

  // Covariance variance ellipse in the plane + lifted 3D Gaussian density dome
  const vx = pca.vector[0];
  const vy = pca.vector[1];
  const s1 = Math.sqrt(RETAINED_ENERGY / 5) * 0.72; // major semi-axis
  const s2 = Math.sqrt(DISCARDED_ENERGY / 5) * 0.72; // minor semi-axis

  view.add(
    surface(
      (wx, wy) => {
        const u = wx * vx + wy * vy;
        const v = -wx * vy + wy * vx;
        const q = (u / s1) ** 2 + (v / s2) ** 2;
        return 1.55 * Math.exp(-0.55 * q);
      },
      {
        x: [-2.5, 2.5],
        y: [-2.1, 2.1],
        resolution: [34, 30],
        colors: ['#070910', '#122042', '#1d4c6e', '#2ea8a0', '#6ee7b7', '#ffd166'],
        mesh: '#6ee7b7',
        meshOpacity: 0.14,
        meshWidth: 0.5,
        opacity: 0.76,
      },
    ),
  );

  // Glowing 1-sigma covariance ellipse ring
  view.add(
    curve3d(
      (t) => {
        const a = t * Math.PI * 2;
        const u = s1 * Math.cos(a);
        const v = s2 * Math.sin(a);
        return [u * vx - v * vy, u * vy + v * vx, 0.12];
      },
      {
        t: [0, 1],
        samples: 72,
        color: COSMOS.emerald,
        width: 3.4,
        glow: 9,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  // Live rotating candidate principal axis beam
  view.add(
    line3d(
      () => {
        const ang = angleFn();
        return [-2.6 * Math.cos(ang), -2.6 * Math.sin(ang), 0.16];
      },
      () => {
        const ang = angleFn();
        return [2.6 * Math.cos(ang), 2.6 * Math.sin(ang), 0.16];
      },
      { color: COSMOS.gold, width: 4.5, glow: 12, blend: 'screen', onTop: true },
    ),
  );

  // Centered 6-message cloud
  view.add(
    points3d(
      xy.map((p) => [(p[0] - pca.mean[0]) * 0.58, (p[1] - pca.mean[1]) * 0.58, 0.22]),
      { color: COSMOS.cyan, radius: 6.5, glow: 11, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}

/** Glowing proportional light ribbon (for k-means++ seeding probabilities, variance shares, etc.). */
export function massRibbon(left, cy, totalW, height, shares, colors, { opacity = 1 } = {}) {
  const nodes = [
    rule(left, cy + height / 2 + 10, left + totalW, cy + height / 2 + 10, COSMOS.rule, 2).opacity(
      opacity * 0.7,
    ),
  ];
  let cursor = left;
  shares.forEach((sh, i) => {
    const w = Math.max(0, totalW * Math.max(0, sh));
    if (w >= 2) {
      nodes.push(
        lumBar(cursor + w / 2, cy, w - 2, height, {
          color: colors[i % colors.length],
          fillOpacity: 0.76,
          strokeWidth: 2,
          glow: 8,
          radius: 5,
          opacity,
        }),
      );
    }
    cursor += w;
  });
  return nodes;
}
