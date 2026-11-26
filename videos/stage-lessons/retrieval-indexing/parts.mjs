// Shared cinematic primitives, palette, and real retrieval-indexing model imports.
// All math comes directly from ../../films/retrieval-indexing/*.mjs.
import {
  circle,
  dynamic,
  gridPlane3d,
  group,
  line,
  line3d,
  linear,
  parametricSurface,
  points3d,
  polyPath,
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
import {
  CREDENTIAL_ROWS,
  DOCS,
  FIXTURE_RERANK_SCORES,
  GAP_IDS,
  QUERY,
  RELEVANT,
} from '../../films/retrieval-indexing/fixtures.mjs';
import {
  POSTINGS,
  QUERY_INTERSECTION,
  SOUP_POSITIONS,
  TERMS,
  TOKENS,
  countsGrid,
} from '../../films/retrieval-indexing/analysis.mjs';
import {
  AVERAGE_LENGTH,
  DOC_FREQUENCY,
  RANKING,
  SCORES,
  bm25,
  idf,
  termFrequencyScore,
} from '../../films/retrieval-indexing/scoring.mjs';
import {
  LEXICAL_TOP_TWO,
  RECALL_AT_TWO,
  SECOND_LANE_UNION,
  TOP_K_TRACE,
  rerankFixture,
} from '../../films/retrieval-indexing/selection.mjs';
import {
  GAP_VALUES,
  decodeGapValues,
  storageDisplay,
} from '../../films/retrieval-indexing/storage.mjs';
import {
  dense as CRED_DENSE,
  fused as credFused,
  jointScores as CRED_JOINT_SCORES,
  passageNames as CRED_PASSAGE_NAMES,
  reranked as credReranked,
  sparse as CRED_SPARSE,
} from '../../films/retrieval-indexing/credential-shortlist.mjs';
import {
  coarseCenters,
  flatRoute,
  frontierSearch,
  graphDistance,
  graphLinks,
  graphPoints,
  graphQuery,
  indexedPassages,
  ivfRoute,
  listOwner,
  reciprocalFusion,
  vectorCosine,
  vectorDot,
} from '../../films/retrieval-indexing/vector-search.mjs';
import { validateModel } from '../../films/retrieval-indexing/validation.mjs';

export {
  AVERAGE_LENGTH,
  COSMOS,
  CREDENTIAL_ROWS,
  CRED_DENSE,
  CRED_JOINT_SCORES,
  CRED_PASSAGE_NAMES,
  CRED_SPARSE,
  DOCS,
  DOC_FREQUENCY,
  FIXTURE_RERANK_SCORES,
  GAP_IDS,
  GAP_VALUES,
  LEXICAL_TOP_TWO,
  POSTINGS,
  QUERY,
  QUERY_INTERSECTION,
  RANKING,
  RECALL_AT_TWO,
  RELEVANT,
  SCORES,
  SECOND_LANE_UNION,
  SOUP_POSITIONS,
  TERMS,
  TOKENS,
  TOP_K_TRACE,
  aura,
  bm25,
  circle,
  coarseCenters,
  countsGrid,
  credFused,
  credReranked,
  decodeGapValues,
  flatRoute,
  frontierSearch,
  glowDot,
  glowTex,
  glowingTrail,
  graphDistance,
  graphLinks,
  graphPoints,
  graphQuery,
  group,
  guardedDynamic,
  heroTitle,
  idf,
  indexedPassages,
  ivfRoute,
  line,
  listOwner,
  polyPath,
  reciprocalFusion,
  rect,
  rerankFixture,
  storageDisplay,
  termFrequencyScore,
  txt,
  vectorCosine,
  vectorDot,
};

// Concrete credential dense helper matching lesson narration
export const CRED_QUERY_VEC = [1, 0.8, 0];
export const CRED_DENSE_SCORES = CREDENTIAL_ROWS.map((row) => ({
  ...row,
  dot: vectorDot(CRED_QUERY_VEC, row.v),
  cosine: vectorCosine(CRED_QUERY_VEC, row.v),
}));

export function minMaxScale(values) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo;
  return values.map((v) => (span === 0 ? 0 : (v - lo) / span));
}

export const PQ_ORIG = [1.1, 0.9, -0.8, -1.2];
export const PQ_RECON = [1.0, 1.0, -1.0, -1.0];
export const PQ_SQ_ERRORS = PQ_ORIG.map((v, i) => (v - PQ_RECON[i]) ** 2);
export const PQ_TOTAL_SQ_ERR = PQ_SQ_ERRORS.reduce((a, b) => a + b, 0);
export const PQ_FLOAT_BYTES = 1536 * 4;
export const PQ_CODE_BYTES = 96;
export const PQ_SAVING_PCT = (1 - PQ_CODE_BYTES / PQ_FLOAT_BYTES) * 100;

export function computeNdcg(grades) {
  const dcg = (arr) => arr.reduce((sum, g, idx) => sum + (2 ** g - 1) / Math.log2(idx + 2), 0);
  const ideal = [...grades].sort((a, b) => b - a);
  return { dcg: dcg(grades), idcg: dcg(ideal), ndcg: dcg(grades) / dcg(ideal) };
}

export function verifyRetrievalIndexingInvariants() {
  verifyInvariant(validateModel() === true, 'retrieval-indexing model validation passes');
  verifyApprox(bm25('d1').score, 1.6694, 0.002, 'd1 BM25 score');
  verifyApprox(bm25('d4').score, 0.8986, 0.002, 'd4 BM25 score');
  verifyApprox(RECALL_AT_TWO, 0.5, 1e-6, 'lexical recall@2');
  verifyApprox(
    vectorCosine(CRED_QUERY_VEC, CREDENTIAL_ROWS[1].v),
    0.99388,
    0.002,
    'credential guide cosine',
  );
  verifyApprox(
    vectorCosine(CRED_QUERY_VEC, CREDENTIAL_ROWS[0].v),
    0.95702,
    0.002,
    'rotation guide cosine',
  );
  verifyApprox(minMaxScale([1, 2, 4, 100])[2], 3 / 99, 1e-6, 'min-max collapse of score 4');
  verifyApprox(PQ_TOTAL_SQ_ERR, 0.1, 1e-6, 'PQ squared reconstruction error');
  verifyApprox(PQ_SAVING_PCT, 98.4375, 0.01, 'PQ byte payload reduction');
  verifyInvariant(ivfRoute(4.9, 1).ranked[0].id === 'generic_api', 'IVF 1-probe at 4.9 misses');
  verifyInvariant(ivfRoute(5.2, 1).ranked[0].id === 'key_rotation', 'IVF 1-probe at 5.2 hits');
  verifyInvariant(ivfRoute(5.2, 1).checks === 4, 'IVF 1-probe at 5.2 takes 4 checks');
  verifyInvariant(frontierSearch(1).expanded.length === 1, 'HNSW ef=1 stops at A');
  verifyInvariant(frontierSearch(2).expanded.at(-1) === 'G', 'HNSW ef=2 reaches G');
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

export function glowingArc(p0, p1, liftY, opts = {}) {
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

// Orbiting 3D Voronoi / IVF Partition Stage (direct 3D primitives inside cinematic3d)
export function makeIvfVoronoi3D(cx, cy, _w, _h, phaseVal, opts = {}) {
  const { queryVal = null } = opts;
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 17.5,
    unit: 86,
    focus: [0, 0, 0.35],
  }).at(cx, cy);

  const floor = parametricSurface(
    (u, v) => [-2.5 + u * 5.0, -1.7 + v * 3.4, -0.02],
    [0, 1],
    [0, 1],
    {
      resolution: [6, 4],
      color: '#111c33',
      mesh: '#2d416e',
      meshOpacity: 0.45,
      meshWidth: 0.9,
      opacity: 0.28,
      shaded: false,
    },
  );

  // Glowing Voronoi partition wall at x = 0 (value = 5.0)
  const wall = parametricSurface((u, v) => [0, -2.0 + u * 4.0, v * 1.45], [0, 1], [0, 1], {
    resolution: [5, 4],
    color: COSMOS.gold,
    mesh: COSMOS.gold,
    meshOpacity: 0.65,
    meshWidth: 1.4,
    opacity: 0.24,
    shaded: false,
  });

  // Left Voronoi basin (List 0: Center 0) & Right Voronoi basin (List 1: Center 10)
  const leftSlab = wireframeSlab3d([-1.35, 0, 0.35], 1.15, 1.65, 0.35, {
    color: COSMOS.cyan,
    width: 2.4,
    glow: 9,
    opacity: 0.92,
  });
  const rightSlab = wireframeSlab3d([1.35, 0, 0.35], 1.15, 1.65, 0.35, {
    color: COSMOS.emerald,
    width: 2.4,
    glow: 9,
    opacity: 0.88,
  });

  const leftTop = parametricSurface(
    (u, v) => [-2.45 + u * 2.25, -1.6 + v * 3.2, 0.04],
    [0, 1],
    [0, 1],
    {
      resolution: [4, 4],
      color: '#11304f',
      mesh: COSMOS.cyan,
      meshOpacity: 0.28,
      meshWidth: 0.8,
      opacity: 0.42,
      shaded: false,
    },
  );
  const rightTop = parametricSurface(
    (u, v) => [0.2 + u * 2.25, -1.6 + v * 3.2, 0.04],
    [0, 1],
    [0, 1],
    {
      resolution: [4, 4],
      color: '#0e362f',
      mesh: COSMOS.emerald,
      meshOpacity: 0.28,
      meshWidth: 0.8,
      opacity: 0.42,
      shaded: false,
    },
  );

  const mapX = (val) => (val - 5) * 0.44;
  const yOffsets = [-0.75, 0.25, 1.0];
  const docCols = [COSMOS.cyan, COSMOS.emerald, COSMOS.amber];
  const docNodes = [];
  indexedPassages.forEach((doc, idx) => {
    const px = mapX(doc.value);
    const py = yOffsets[idx];
    const col = docCols[idx];
    docNodes.push(
      line3d([px, py, 0], [px, py, 0.95], { stroke: col, width: 2.8, glow: 7 }),
      points3d([[px, py, 1.0]], { color: col, radius: 8.5, glow: 11, onTop: true }),
    );
  });

  // Coarse center beacons
  const centerBeacons = points3d(
    [
      [mapX(0), 0, 0.72],
      [mapX(10), 0, 0.72],
    ],
    {
      colorAt: (idx) => (idx === 0 ? COSMOS.cyan : COSMOS.emerald),
      radius: 8,
      glow: 11,
      onTop: true,
    },
  );

  // Reactive orbiting query & search beam photons
  const queryPhotons = points3d(
    () => {
      const p = phaseVal.value;
      const qVal = typeof queryVal === 'function' ? queryVal() : (queryVal ?? 4.9);
      const qx = mapX(qVal);
      const frac = (p * 0.4) % 1;
      return [
        [qx, -0.15, 1.55],
        [qx + (mapX(0) - qx) * frac, -0.15 * (1 - frac), 1.55 + (0.72 - 1.55) * frac],
        [qx + (mapX(10) - qx) * frac, -0.15 * (1 - frac), 1.55 + (0.72 - 1.55) * frac],
      ];
    },
    {
      colorAt: (idx) => (idx === 0 ? COSMOS.gold : idx === 1 ? COSMOS.cyan : COSMOS.emerald),
      radius: 9,
      glow: 13,
      blend: 'screen',
      onTop: true,
    },
  );

  const probeBeamLeft = line3d([mapX(4.9), -0.15, 1.5], [mapX(0), 0, 0.72], {
    stroke: COSMOS.cyan,
    width: 2.6,
    glow: 8,
  });
  const probeBeamRight = line3d([mapX(5.1), -0.15, 1.5], [mapX(10), 0, 0.72], {
    stroke: COSMOS.emerald,
    width: 2.2,
    glow: 7,
    opacity: 0.72,
  });

  view.add(
    floor,
    leftTop,
    rightTop,
    wall,
    ...leftSlab,
    ...rightSlab,
    ...docNodes,
    centerBeacons,
    probeBeamLeft,
    probeBeamRight,
    queryPhotons,
  );
  return { view, orbit: (s, c) => orbitScene(s, c, view, { theta: 0.45, phi: 0.08 }) };
}

// Orbiting 3D Multi-Layer HNSW Skip-Graph Stage (Scene 19 - direct 3D primitives)
export function makeHnsw3D(cx, cy, _w, _h, phaseVal, _stateFn) {
  const view = cinematic3d({
    theta: -0.72,
    phi: 1.04,
    distance: 17.8,
    unit: 84,
    focus: [0, 0, 0.45],
  }).at(cx, cy);

  const layer0 = parametricSurface(
    (u, v) => [-2.1 + u * 4.2, -1.1 + v * 2.4, -0.45],
    [0, 1],
    [0, 1],
    {
      resolution: [5, 4],
      color: '#111c33',
      mesh: '#2c426e',
      meshOpacity: 0.5,
      meshWidth: 0.9,
      opacity: 0.25,
      shaded: false,
    },
  );
  const layer1 = parametricSurface(
    (u, v) => [-2.1 + u * 4.2, -1.1 + v * 2.4, 1.35],
    [0, 1],
    [0, 1],
    {
      resolution: [4, 3],
      color: '#162747',
      mesh: '#3c5d99',
      meshOpacity: 0.45,
      meshWidth: 0.9,
      opacity: 0.18,
      shaded: false,
    },
  );

  const to3D = (pt, z) => [pt[0] * 1.0 - 2.0, pt[1] * 0.95 - 0.9, z];
  const sTop = to3D(graphPoints.S, 1.35);
  const aTop = to3D(graphPoints.A, 1.35);
  const sBot = to3D(graphPoints.S, -0.45);
  const aBot = to3D(graphPoints.A, -0.45);
  const bBot = to3D(graphPoints.B, -0.45);
  const gBot = to3D(graphPoints.G, -0.45);
  const qBot = to3D(graphQuery, -0.45);

  const upperSkip = line3d(sTop, aTop, { stroke: COSMOS.cyan, width: 4.2, glow: 10 });
  const pillarS = line3d(sTop, sBot, { stroke: COSMOS.muted, width: 1.8, opacity: 0.55 });
  const pillarA = line3d(aTop, aBot, { stroke: COSMOS.gold, width: 3.6, glow: 9 });

  const edgeSA = line3d(sBot, aBot, { stroke: COSMOS.cyan, width: 3.6, glow: 8 });
  const edgeSB = line3d(sBot, bBot, { stroke: COSMOS.emerald, width: 4.0, glow: 9 });
  const edgeBG = line3d(bBot, gBot, { stroke: COSMOS.emerald, width: 4.2, glow: 10 });

  const upperNodes = points3d([sTop, aTop], {
    colorAt: (i) => (i === 0 ? COSMOS.cyan : COSMOS.gold),
    radius: 8,
    glow: 11,
    onTop: true,
  });

  const baseNodes = points3d([sBot, aBot, bBot, gBot], {
    colorAt: (i) => [COSMOS.cyan, COSMOS.rose, COSMOS.gold, COSMOS.emerald][i],
    radius: 9,
    glow: 12,
    onTop: true,
  });

  const qStem = line3d(qBot, [qBot[0], qBot[1], 0.55], {
    stroke: COSMOS.amber,
    width: 3.4,
    glow: 9,
  });
  const qBeacon = points3d([[qBot[0], qBot[1], 0.6]], {
    color: COSMOS.amber,
    radius: 10,
    glow: 13,
    onTop: true,
  });

  // Animated frontier photon sweeping A -> S -> B -> G
  const pathPts = [aBot, sBot, bBot, gBot];
  const frontierPhoton = points3d(
    () => {
      const t = ((phaseVal.value * 0.28) % 1) * 3;
      const seg = Math.min(2, Math.floor(t));
      const u = t - seg;
      const p0 = pathPts[seg];
      const p1 = pathPts[seg + 1];
      return [
        [
          p0[0] + (p1[0] - p0[0]) * u,
          p0[1] + (p1[1] - p0[1]) * u,
          p0[2] + (p1[2] - p0[2]) * u + 0.14,
        ],
      ];
    },
    { color: COSMOS.gold, radius: 8, glow: 14, blend: 'screen', onTop: true },
  );

  view.add(
    layer0,
    layer1,
    upperSkip,
    pillarS,
    pillarA,
    edgeSA,
    edgeSB,
    edgeBG,
    upperNodes,
    baseNodes,
    qStem,
    qBeacon,
    frontierPhoton,
  );
  return { view, orbit: (s, c) => orbitScene(s, c, view, { theta: 0.45, phi: 0.08 }) };
}
