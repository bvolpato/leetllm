// Shared cinematic primitives, model imports, and orbiting 3D HNSW / IVF Voronoi stages for vector-search.
import {
  circle,
  group,
  line,
  line3d,
  linear,
  parametricSurface,
  points3d,
  rect,
} from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';
import { distance } from '../../films/vector-search/arithmetic.mjs';
import { CENTROIDS, POINTS, QUERY } from '../../films/vector-search/fixtures.mjs';
import {
  collisionFixture,
  compressionFixture,
  encodeChunks,
  exact,
  metricFixture,
  partition,
  postingList,
  probe,
  rankCentroids,
  recall,
  retainedSearch,
  retainedTrace,
  validateModel,
} from '../../films/vector-search/model.mjs';

export {
  CENTROIDS,
  COSMOS,
  POINTS,
  QUERY,
  aura,
  circle,
  collisionFixture,
  compressionFixture,
  distance,
  encodeChunks,
  exact,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  metricFixture,
  partition,
  postingList,
  probe,
  rankCentroids,
  recall,
  rect,
  retainedSearch,
  retainedTrace,
  txt,
};

export const EXACT_PAIR = exact();
export const PROBE1 = probe(1);
export const PROBE2 = probe(2);
export const CENTROIDS_RANKED = rankCentroids();
export const COMP_FIX = compressionFixture();
export const COLL_FIX = collisionFixture();
export const METRIC_FIX = metricFixture();
export const RETAIN_1 = retainedTrace(1);
export const RETAIN_3 = retainedTrace(3);
export const QUERY_NEAR_D = { x: 7.6, y: 5.4 };

export function pointById(id) {
  return POINTS.find((p) => p.id === id);
}

export function verifyVectorSearchInvariants() {
  verifyInvariant(validateModel() === true, 'vector-search model validation passes');
  verifyInvariant(
    EXACT_PAIR.map((p) => p.id).join(',') === 'A,B',
    'exact top-2 for rollback query is A, B',
  );
  verifyApprox(distance(pointById('A'), QUERY), 0.08, 1e-6, 'd2(A, Q) = 0.08');
  verifyApprox(distance(pointById('B'), QUERY), 0.09, 1e-6, 'd2(B, Q) = 0.09');
  verifyApprox(distance(pointById('C'), QUERY), 1.25, 1e-6, 'd2(C, Q) = 1.25');
  verifyApprox(distance(pointById('E'), QUERY), 20.56, 1e-6, 'd2(E, Q) = 20.56');
  verifyInvariant(
    PROBE1.result.map((p) => p.id).join(',') === 'A,C',
    '1-probe returns A, C (recall 0.5)',
  );
  verifyApprox(recall(PROBE1.result), 0.5, 1e-6, '1-probe recall@2 = 0.5');
  verifyApprox(recall(PROBE2.result), 1.0, 1e-6, '2-probe recall@2 = 1.0');
  verifyApprox(CENTROIDS_RANKED[0].d2, 7.84, 1e-6, 'left centroid d2 = 7.84');
  verifyApprox(CENTROIDS_RANKED[1].d2, 10.24, 1e-6, 'right centroid d2 = 10.24');
  verifyInvariant(COMP_FIX.rawBytes / COMP_FIX.codeBytes === 32, 'PQ 32x code compression');
  verifyApprox(0.99 ** 10, 0.904382075, 1e-6, '10-shard tail probability ~90.4%');
  verifyApprox(0.995 ** 100, 0.605770436, 1e-4, '100 independent draws empty ~60.6%');
}

export function safeDuration(c, startOffset = 0.08, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

export function remainDuration(c, cueId, maxDur = 0.55, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.22, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

export function runPhase(s, c, phaseVal, target = 12, startOffset = 0.08) {
  const dur = safeDuration(c, startOffset, 0.55);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

export function glassCell(
  x,
  y,
  w,
  h,
  strokeColor = COSMOS.cyan,
  { fill = '#11182c', radius = 12, glow = 6, opacity = 0.94, dash, width = 2.2 } = {},
) {
  const r = rect(w, h, { fill, stroke: strokeColor, width, radius, dash })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) r.glow(glow, strokeColor);
  return r;
}

export function meterBar(xLeft, y, totalW, h, frac, color, opts = {}) {
  const { bg = '#131b31', stroke = COSMOS.dim, opacity = 1, glow = 7 } = opts;
  const clamped = Math.max(0, Math.min(1, frac));
  const fillW = Math.max(clamped > 0.005 ? 10 : 0, totalW * clamped);
  const items = [
    rect(totalW, h, { fill: bg, stroke, width: 1.6, radius: h * 0.35 })
      .at(xLeft + totalW / 2, y)
      .opacity(opacity * 0.9),
  ];
  if (fillW > 0) {
    items.push(
      rect(fillW, h - 4, { fill: color, radius: h * 0.3 })
        .glow(glow, color)
        .at(xLeft + fillW / 2, y)
        .opacity(opacity),
    );
  }
  return group(...items);
}

// Orbiting 3D Multi-Layer HNSW Skip-Graph (L2 -> L1 -> L0 with animated search photons)
export function makeHnswTower3D(cx, cy, phaseVal) {
  const view = cinematic3d({
    theta: -0.72,
    phi: 1.06,
    distance: 17.8,
    unit: 86,
    focus: [0, 0, 0.65],
  }).at(cx, cy);

  const floor = parametricSurface(
    (u, v) => [-2.2 + u * 4.4, -1.5 + v * 3.0, -0.32],
    [0, 1],
    [0, 1],
    {
      resolution: [5, 4],
      color: '#111c33',
      mesh: '#2c426e',
      meshOpacity: 0.42,
      meshWidth: 0.9,
      opacity: 0.24,
      shaded: false,
    },
  );

  // Three HNSW strata: L0 (base dense), L1 (mid), L2 (sparse expressway)
  const slab0 = wireframeSlab3d([0, 0, 0.0], 1.85, 1.15, 0.06, {
    color: COSMOS.cyan,
    width: 1.8,
    glow: 6,
    opacity: 0.72,
  });
  const slab1 = wireframeSlab3d([0, 0, 0.85], 1.6, 0.95, 0.05, {
    color: COSMOS.gold,
    width: 1.8,
    glow: 6,
    opacity: 0.78,
  });
  const slab2 = wireframeSlab3d([0, 0, 1.65], 1.35, 0.78, 0.05, {
    color: COSMOS.violet,
    width: 2.0,
    glow: 7,
    opacity: 0.86,
  });

  // Key nodes on L2 (E -> A), L1 (E, A, G), L0 (E, C, A, B, D, F)
  const e2 = [-0.95, -0.35, 1.68];
  const a2 = [0.75, 0.25, 1.68];
  const a1 = [0.75, 0.25, 0.88];
  const g1 = [-0.15, 0.45, 0.88];
  const a0 = [0.75, 0.25, 0.05];
  const b0 = [1.15, -0.1, 0.05];
  const c0 = [-0.15, -0.35, 0.05];
  const e0 = [-1.25, -0.55, 0.05];
  const d0 = [1.3, 0.55, 0.05];

  const edges = [
    line3d(e2, a2, { stroke: COSMOS.violet, width: 3.4, glow: 9 }),
    line3d(a2, a1, { stroke: COSMOS.gold, width: 3.0, glow: 8 }),
    line3d(a1, g1, { stroke: COSMOS.gold, width: 2.4, glow: 7 }),
    line3d(a1, a0, { stroke: COSMOS.emerald, width: 3.0, glow: 8 }),
    line3d(e0, c0, { stroke: COSMOS.cyan, width: 2.2, glow: 6 }),
    line3d(c0, a0, { stroke: COSMOS.cyan, width: 2.4, glow: 6 }),
    line3d(a0, b0, { stroke: COSMOS.emerald, width: 3.2, glow: 9 }),
    line3d(b0, d0, { stroke: COSMOS.cyan, width: 2.0, glow: 5 }),
  ];

  const nodes = points3d([e2, a2, a1, g1, e0, c0, a0, b0, d0], {
    colorAt: (i) =>
      i < 2 ? COSMOS.violet : i < 4 ? COSMOS.gold : i >= 6 && i <= 7 ? COSMOS.emerald : COSMOS.cyan,
    radius: 7.5,
    glow: 11,
    onTop: true,
  });

  // Animated search photon descending E2 -> A2 -> A1 -> A0 -> B0
  const pathPts = [e2, a2, a1, a0, b0];
  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const u = (p * 0.34) % 1;
      const seg = Math.min(pathPts.length - 2, Math.floor(u * (pathPts.length - 1)));
      const t = u * (pathPts.length - 1) - seg;
      const a = pathPts[seg];
      const b = pathPts[seg + 1];
      return [[a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]];
    },
    { color: COSMOS.gold, radius: 9.5, glow: 15, blend: 'screen', onTop: true },
  );

  view.add(floor, ...slab0, ...slab1, ...slab2, ...edges, nodes, photons);
  return { view, orbit: (s, c) => orbitScene(s, c, view, { theta: 0.44, phi: 0.08 }) };
}

// Orbiting 3D IVF Voronoi Partition (Left cyan cell vs Right rose cell across x = 5 wall)
export function makeIvfVoronoi3D(cx, cy, phaseVal) {
  const view = cinematic3d({
    theta: -0.68,
    phi: 1.04,
    distance: 17.6,
    unit: 86,
    focus: [0, 0, 0.4],
  }).at(cx, cy);

  const floor = parametricSurface(
    (u, v) => [-2.2 + u * 4.4, -1.5 + v * 3.0, -0.32],
    [0, 1],
    [0, 1],
    {
      resolution: [5, 4],
      color: '#111c33',
      mesh: '#2c426e',
      meshOpacity: 0.42,
      meshWidth: 0.9,
      opacity: 0.24,
      shaded: false,
    },
  );

  // Left Voronoi cell (x < 5) and Right Voronoi cell (x > 5)
  const leftCell = wireframeSlab3d([-0.92, 0, 0.05], 0.84, 1.08, 0.14, {
    color: COSMOS.cyan,
    width: 2.1,
    glow: 7,
    opacity: 0.85,
  });
  const rightCell = wireframeSlab3d([0.92, 0, 0.05], 0.84, 1.08, 0.14, {
    color: COSMOS.rose,
    width: 2.1,
    glow: 7,
    opacity: 0.85,
  });
  // Glowing Voronoi bisecting boundary plane at x = 5
  const wall = parametricSurface((u, v) => [0, -1.05 + u * 2.1, -0.05 + v * 1.35], [0, 1], [0, 1], {
    resolution: [4, 4],
    color: COSMOS.gold,
    mesh: COSMOS.gold,
    meshOpacity: 0.55,
    meshWidth: 1.1,
    opacity: 0.16,
    shaded: false,
  });

  // Query (4.8, 5.0 -> near wall on left), A (-0.18, 0.14), B (+0.12, 0.0), C (-0.65, -0.14), c0, c1
  const qPt = [-0.08, 0.0, 0.48];
  const aPt = [-0.22, 0.16, 0.42];
  const bPt = [0.18, 0.0, 0.42];
  const cPt = [-0.78, -0.22, 0.35];
  const c0Pt = [-1.1, 0.0, 0.18];
  const c1Pt = [1.1, 0.0, 0.18];

  const beams = [
    line3d(qPt, aPt, { stroke: COSMOS.emerald, width: 3.2, glow: 9 }),
    line3d(qPt, bPt, { stroke: COSMOS.gold, width: 3.2, glow: 9 }),
    line3d(qPt, cPt, { stroke: COSMOS.cyan, width: 2.4, glow: 6 }),
    line3d(qPt, c0Pt, { stroke: COSMOS.cyan, width: 2.0, glow: 5 }),
    line3d(qPt, c1Pt, { stroke: COSMOS.rose, width: 2.0, glow: 5 }),
  ];

  const nodes = points3d([qPt, aPt, bPt, cPt, c0Pt, c1Pt], {
    colorAt: (i) =>
      i === 0
        ? COSMOS.gold
        : i <= 2
          ? COSMOS.emerald
          : i === 3 || i === 4
            ? COSMOS.cyan
            : COSMOS.rose,
    radius: 8,
    glow: 11,
    onTop: true,
  });

  const probePhotons = points3d(
    () => {
      const p = phaseVal.value;
      const u1 = (p * 0.45) % 1;
      const u2 = (p * 0.45 + 0.5) % 1;
      return [
        [
          qPt[0] + (aPt[0] - qPt[0]) * u1,
          qPt[1] + (aPt[1] - qPt[1]) * u1,
          qPt[2] + (aPt[2] - qPt[2]) * u1,
        ],
        [
          qPt[0] + (bPt[0] - qPt[0]) * u2,
          qPt[1] + (bPt[1] - qPt[1]) * u2,
          qPt[2] + (bPt[2] - qPt[2]) * u2,
        ],
      ];
    },
    { color: COSMOS.gold, radius: 8, glow: 14, blend: 'screen', onTop: true },
  );

  view.add(floor, ...leftCell, ...rightCell, wall, ...beams, nodes, probePhotons);
  return { view, orbit: (s, c) => orbitScene(s, c, view, { theta: 0.44, phi: 0.08 }) };
}
