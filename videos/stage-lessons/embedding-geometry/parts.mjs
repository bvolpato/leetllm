// Shared math invariants, semantic COSMOS color roles, and 2D/3D cinema primitives
// for the 24-scene Embedding Geometry stage film.
import {
  arc,
  arrow,
  circle,
  curve3d,
  dot,
  dynamic,
  group,
  line,
  line3d,
  linear,
  parametricSurface,
  points3d,
  rect,
  seq,
} from 'vizmatic/stage';
import {
  cosine,
  dot as dotProd,
  l2,
  norm,
  normalized,
  quantize,
  robustUnit,
  scalarEncode,
  signCode,
} from '../../films/embedding-geometry/arithmetic.mjs';
import {
  AUTH,
  GRAPH,
  METRICS,
  PASSAGES,
  PQ_PAIRS,
  PQ_QUERY,
  PREFIX_DOCS,
  QUANTIZATION_FIXTURE,
  QUANTIZATION_RESULT,
  SCALED_A,
  UNIT_METRICS,
  QUERY,
} from '../../films/embedding-geometry/fixtures.mjs';
import {
  authorizedSearch,
  calibrationRanking,
  calibrationResult,
  graphSearch,
  pqTables,
  prefixResults,
} from '../../films/embedding-geometry/model.mjs';
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
} from '../cinematic-kit.mjs';

export {
  AUTH,
  CINEMA_FRAME,
  COSMOS,
  GRAPH,
  METRICS,
  PASSAGES,
  PQ_PAIRS,
  PQ_QUERY,
  PREFIX_DOCS,
  QUANTIZATION_FIXTURE,
  QUANTIZATION_RESULT,
  QUERY,
  SCALED_A,
  UNIT_METRICS,
  aura,
  authorizedSearch,
  calibrationRanking,
  calibrationResult,
  cinematic3d,
  cosine,
  dotProd,
  glowDot,
  glowTex,
  glowingTrail,
  graphSearch,
  guardedDynamic,
  heroTitle,
  l2,
  markDecoration,
  metricReadout,
  morphEquation,
  norm,
  normalized,
  orbitScene,
  pqTables,
  prefixResults,
  quantize,
  robustUnit,
  rule,
  scalarEncode,
  signCode,
  txt,
};

/** One semantic color per concept across all 24 scenes, aligned with narration color words. */
export const ROLE = Object.freeze({
  query: COSMOS.blue, // "blue search arrow" / "blue tip" / "blue query"
  A: COSMOS.emerald, // "green" Rotation guide / Passage A / Passage C / allowed
  B: COSMOS.rose, // "pink" Audit guide / Passage B / Passage D
  gold: COSMOS.gold, // "yellow" rounding square, chords, active highlights, predictions
  code: COSMOS.cyan, // compressed codes, codebooks, graph nodes, accents
  violet: COSMOS.violet, // transforms, upper HNSW layers, metadata
  warn: COSMOS.amber, // clipping, overflow, denied, rejected
  danger: '#ff4d6d', // explicit error / invalid / rejected marker
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
});

export const GUIDES = Object.freeze(
  PASSAGES.map(({ id, vector }, i) => ({
    id,
    vector,
    name: ['Rotation', 'Audit'][i],
    color: [ROLE.A, ROLE.B][i],
  })),
);

/** Convert a 6-digit #rrggbb hex and [0..1] alpha to an 8-digit #rrggbbaa hex (Vizmatic rect safe). */
export function withAlpha(hex, alpha) {
  const clean = String(hex).replace('#', '').slice(0, 6);
  const byte = Math.max(0, Math.min(255, Math.round(alpha * 255)))
    .toString(16)
    .padStart(2, '0');
  return `#${clean}${byte}`;
}

/** Build-time mathematical verification of every core identity in the Embedding Geometry lesson. */
export function verifyEmbeddingInvariants() {
  // Opening angles
  const degA = Math.round(
    (Math.atan2(PASSAGES[0].vector[1], PASSAGES[0].vector[0]) * 180) / Math.PI,
  );
  const degB = Math.round(
    (Math.atan2(PASSAGES[1].vector[1], PASSAGES[1].vector[0]) * 180) / Math.PI,
  );
  verifyInvariant(degA === 11 && degB === 27, 'opening guide angles must be 11 and 27 degrees');

  // Coordinates & rulers
  verifyInvariant(METRICS[0].dot === 1 && METRICS[1].dot === 4, 'raw dot products 1 and 4');
  verifyApprox(METRICS[0].cosine, 0.9806, 0.001, 'A cosine ~0.981');
  verifyApprox(METRICS[1].cosine, 0.8944, 0.001, 'B cosine ~0.894');
  verifyApprox(METRICS[0].distance, 0.2, 1e-9, 'A L2 distance 0.2');
  verifyApprox(METRICS[1].distance, Math.sqrt(13), 1e-9, 'B L2 distance sqrt(13)');

  // Magnitude scaling
  verifyInvariant(dotProd(QUERY, SCALED_A) === 10, '10x scaled A dot product 10');
  verifyApprox(cosine(QUERY, SCALED_A), METRICS[0].cosine, 1e-12, 'cosine invariant to 10x scale');
  verifyApprox(l2(QUERY, SCALED_A), 9.2195, 0.002, '10x scaled A L2 ~9.22');

  // Unit circle chord identity
  UNIT_METRICS.forEach((m) => {
    verifyApprox(m.squaredDistance, 2 - 2 * m.score, 1e-12, `unit chord identity for ${m.id}`);
  });
  verifyApprox(UNIT_METRICS[0].squaredDistance, 0.039, 0.001, 'unit A gap^2 ~0.039');
  verifyApprox(UNIT_METRICS[1].squaredDistance, 0.211, 0.001, 'unit B gap^2 ~0.211');

  // Robust normalization contract
  const uLarge = robustUnit([1e300, 1e300]);
  const uSmall = robustUnit([1e-300, 1e-300]);
  verifyApprox(uLarge[0], Math.SQRT1_2, 1e-12, 'robustUnit large');
  verifyApprox(uSmall[0], uLarge[0], 1e-12, 'robustUnit small equals large');

  // Matryoshka prefix
  const pFull = prefixResults(4);
  const pShort = prefixResults(2);
  verifyInvariant(
    pFull.winners.join(',') === '1,2' && pFull.recall === 1,
    'prefix full recall 2/2',
  );
  verifyInvariant(
    pShort.winners.join(',') === '0,2' && pShort.recall === 0.5,
    'prefix 2d recall 1/2',
  );

  // Payload sizing
  verifyInvariant(1536 * 4 === 6144 && 6144 / 96 === 64, 'FP32 to PQ-96 ratio 64');
  verifyApprox((96 * 256 * 16 * 4) / 2 ** 20, 1.5, 1e-12, 'PQ codebooks 1.5 MiB');
  verifyApprox((50e6 * 768 * 4) / 1e9, 153.6, 1e-9, '50M x 768 FP32 153.6 GB');
  verifyApprox((50e6 * 768) / 1e9, 38.4, 1e-9, '50M x 768 INT8 38.4 GB');
  verifyApprox((50e6 * 96) / 1e9, 4.8, 1e-9, '50M x 768 PQ 4.8 GB');

  // Quantization 0.2 grid
  verifyInvariant(
    QUANTIZATION_RESULT[0].code.join(',') === '1,0.2' &&
      QUANTIZATION_RESULT[1].code.join(',') === '1,0.2',
    'C and D both quantize to [1, 0.2]',
  );

  // Scalar codec & scales
  verifyInvariant(scalarEncode(0.424, 1.27) === 42, 'scalarEncode 0.424 -> 42');
  verifyApprox((42 * 1.27) / 127, 0.42, 1e-12, 'decoded 0.42');
  verifyInvariant(-2 / (1 / 255) === -510, 'unsigned [2,3] zero point -510');
  verifyInvariant(scalarEncode(8, 10) === 102 && scalarEncode(1, 1) === 127, 'scalar scale codes');
  verifyApprox((102 * 10) / 127, 8.0315, 0.001, 'restored A score ~8.031');

  // Calibration
  const calWide = calibrationResult(25);
  const calFine = calibrationResult(1);
  verifyApprox(calWide.mae, 0.0483, 0.0005, 'wide bound MAE');
  verifyApprox(calFine.mae, 0.0019, 0.0005, 'fine bound MAE');
  verifyApprox(25 - calFine.outlier, 24, 1e-12, 'outlier clip error 24');
  const cr = calibrationRanking();
  verifyInvariant(
    cr.originalWinner === 1 && cr.coarseWinner === 0 && cr.fineWinner === 1,
    'calibration direction ranking flip and recovery',
  );

  // Wide arithmetic
  const exactWide = [dotProd([127, 127], [127, 127]), dotProd([127, 127], [126, 126])];
  verifyInvariant(exactWide[0] === 32258 && exactWide[1] === 32004, 'exact INT32 dot products');
  const wrap8 = (v) => ((v + 128) % 256) - 128;
  verifyInvariant(wrap8(exactWide[0]) === 2 && wrap8(exactWide[1]) === 4, 'INT8 wrapped values');
  verifyInvariant(1536 * 127 * 127 === 24774144 && 24774144 < 2 ** 31 - 1, 'INT32 bound');

  // PQ codebooks & ADC
  const tables = pqTables();
  const evalCode = (code) => code.reduce((acc, id, i) => acc + tables[i][id], 0);
  verifyApprox(evalCode([1, 1, 1, 1]), 0.08, 1e-9, 'PQ [1,1,1,1] distance');
  verifyApprox(evalCode([1, 0, 1, 1]), 4.55, 1e-9, 'PQ [1,0,1,1] distance');
  verifyApprox(evalCode([0, 0, 0, 0]), 56.57, 1e-9, 'PQ [0,0,0,0] distance');
  verifyInvariant((96 * 256 * 4) / 1024 === 96, 'PQ query table 96 KiB');

  // Binary packing & sign-angle
  const bc0 = signCode([0.3, -0.1, 0.8, -0.4]);
  const bc1 = signCode([0.5, -0.2, 0.7, 0.1]);
  verifyInvariant(bc0 === 0x05 && bc1 === 0x0d && (bc0 ^ bc1) === 8, 'binary pack 0x05 vs 0x0D');
  const sa0 = [1, 0.01, -1, -0.01];
  const sa1 = [0.01, 1, -0.01, -1];
  verifyInvariant(signCode(sa0) === signCode(sa1), 'sign-angle collision');
  verifyApprox(cosine(sa0, sa1), 0.02, 0.001, 'sign-angle cosine ~0.02');
  verifyApprox(Math.acos(cosine(sa0, sa1)) / Math.PI, 0.494, 0.002, 'angle/pi ~0.494');

  // Graph & index memory
  verifyInvariant(graphSearch(1).winner === 'D', 'ef=1 stops at D');
  verifyApprox(graphSearch(1).distanceSquared, 5, 1e-9, 'ef=1 distance^2 = 5');
  verifyInvariant(graphSearch(3).winner === 'E', 'ef=3 reaches E');
  verifyApprox(graphSearch(3).distanceSquared, 0.01, 1e-9, 'ef=3 distance^2 = 0.01');
  verifyInvariant(2 * 32 * 4 === 256, 'base neighbor slots 256 B');

  // Authorized funnel
  verifyInvariant(authorizedSearch(1).winner === null, 'post-filter K=1 empty');
  verifyInvariant(authorizedSearch(2).winner === 'Rotation', 'post-filter K=2 Rotation');
  verifyInvariant(authorizedSearch(1, true).winner === 'Rotation', 'pre-filter K=1 Rotation');

  // Synthesis & fresh query (upward q = [0, 1])
  const qUp = [0, 1];
  verifyApprox(dotProd(qUp, PASSAGES[0].vector), 0.2, 1e-9, 'upward dot A');
  verifyApprox(dotProd(qUp, PASSAGES[1].vector), 2.0, 1e-9, 'upward dot B');
  verifyApprox(cosine(qUp, PASSAGES[0].vector), 0.1961, 0.001, 'upward cos A');
  verifyApprox(cosine(qUp, PASSAGES[1].vector), 0.4472, 0.001, 'upward cos B');
  verifyApprox(l2(qUp, PASSAGES[0].vector), 1.2806, 0.002, 'upward raw L2 A');
  verifyApprox(l2(qUp, PASSAGES[1].vector), 4.1231, 0.002, 'upward raw L2 B');
  verifyApprox(cosine(qUp, QUANTIZATION_FIXTURE.candidates[0]), 0.1302, 0.002, 'upward cos C');
  verifyApprox(cosine(qUp, QUANTIZATION_FIXTURE.candidates[1]), 0.28, 0.002, 'upward cos D');
}

/** Clamp a play duration so an animation never runs past the scene narration window. */
export function safeDur(c, startTime, desired = 0.75, margin = 0.45) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.12, Math.min(desired, remaining));
}

/** Safe duration across the full scene window. */
export function safeSceneDur(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

/** Schedule an animation at a declared cue (start or end), clamped safely inside the scene window. */
export function playCue(
  s,
  c,
  cueId,
  build,
  { after = false, offset = 0, dur = 0.75, margin = 0.45 } = {},
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
export function runPhase(s, c, phaseVal, target = 10, startOffset = 0.08) {
  const dur = safeSceneDur(c, startOffset, 0.55);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/** Sequential fade-out then fade-in across two dynamic view values (strict zero-overlap P5). */
export function swapVis(outVal, inVal, d = 0.65) {
  const half = Math.max(0.12, d * 0.46);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

/** Ambient radial energy fields placed behind scene constructions (marked decoration). */
export function cinemaAtmosphere(primary = ROLE.code, secondary = ROLE.query) {
  return markDecoration(
    group(
      aura(-520, -230, 560, withAlpha(primary, 0.14), '#07091000'),
      aura(470, 150, 620, withAlpha(secondary, 0.13), '#07091000'),
      aura(0, 20, 740, '#2a3d7a22', '#07091000'),
    ).zIndex(-80),
  );
}

/** Luminous data bar / register cell using 8-digit hex translucent fill + bright edge glow. */
export function lumBar(
  x,
  y,
  w,
  h,
  {
    color = ROLE.code,
    fillAlpha = 0.2,
    strokeWidth = 2.4,
    glow = 7,
    radius = 8,
    opacity = 1,
    dash,
  } = {},
) {
  const safeW = Math.max(4, w);
  const safeH = Math.max(4, h);
  const node = rect(safeW, safeH, {
    fill: withAlpha(color, fillAlpha),
    stroke: color,
    width: strokeWidth,
    radius,
    dash,
  })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Luminous ring marker (for endpoints, centroid orbs, focal highlights). */
export function glowRing(
  x,
  y,
  radius,
  color,
  { width = 3.2, glow = 9, fillAlpha = 0.15, opacity = 1 } = {},
) {
  const node = circle(radius, {
    fill: withAlpha(color, fillAlpha),
    stroke: color,
    width,
  })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Glowing vector arrow from origin to tip with tip photon. */
export function glowVector(
  origin,
  tip,
  { color = ROLE.query, width = 5.5, tipSize = 18, glow = 9, opacity = 1, dotRadius = 5.5 } = {},
) {
  const len = Math.hypot(tip[0] - origin[0], tip[1] - origin[1]);
  if (len < 3) {
    return glowDot(origin[0], origin[1], { radius: dotRadius, color, glow, opacity });
  }
  const vec = arrow(origin, tip, { stroke: color, width, tip: tipSize, pad: 0 }).opacity(opacity);
  if (glow > 0) vec.glow(glow, color);
  const head = glowDot(tip[0], tip[1], { radius: dotRadius, color, glow: glow + 2, opacity });
  return group(vec, head);
}

/** Glowing angle arc centered at [cx, cy] in screen radians (negative = counter-clockwise up). */
export function glowArc(
  cx,
  cy,
  radius,
  startRad,
  endRad,
  { color = ROLE.A, width = 5, glow = 8, opacity = 1 } = {},
) {
  const lo = Math.min(startRad, endRad);
  const hi = Math.max(startRad, endRad);
  if (hi - lo < 0.004) return group();
  const node = arc(radius, lo, hi, { stroke: color, width }).at(cx, cy).opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Smooth 2D quadratic Bezier glowing arc. */
export function glowingBezier(p0, p1, liftY, opts = {}) {
  const mx = (p0[0] + p1[0]) * 0.5;
  const my = (p0[1] + p1[1]) * 0.5 + liftY;
  const pts = Array.from({ length: 28 }, (_, i) => {
    const t = i / 27;
    const u = 1 - t;
    return [
      u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
    ];
  });
  return glowingTrail(pts, opts);
}

/** Normalize a 3D tuple to unit length. */
export function unit3(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

/** Geodesic great-circle curve on the unit sphere between two unit 3D vectors. */
export function geodesicCurve3d(
  u,
  v,
  { radius = 1.015, color = ROLE.gold, width = 3.2, glow = 8 } = {},
) {
  const a = unit3(u);
  const b = unit3(v);
  const d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(d);
  const sinO = Math.sin(omega);
  return curve3d(
    (t) => {
      if (sinO < 1e-4) {
        return [a[0] * radius, a[1] * radius, a[2] * radius];
      }
      const w0 = Math.sin((1 - t) * omega) / sinO;
      const w1 = Math.sin(t * omega) / sinO;
      return [
        (w0 * a[0] + w1 * b[0]) * radius,
        (w0 * a[1] + w1 * b[1]) * radius,
        (w0 * a[2] + w1 * b[2]) * radius,
      ];
    },
    0,
    1,
    { color, width, glow, blend: 'screen', samples: 36, opacity: 0.94, onTop: true },
  );
}

/**
 * Reusable orbiting 3D unit hypersphere rig (cinematic3d + translucent shaded sphere +
 * glowing meridians/equator + unit vectors + geodesic great-circle arcs + optional cutting
 * hyperplanes and semantic clusters).
 */
export function buildUnitSphere3d({
  x = 460,
  y = 20,
  radius = 2.0,
  unit = 112,
  distance = 13.8,
  theta = -0.76,
  phi = 1.06,
  vectors = [],
  geodesics = [],
  hyperplanes = [],
  clusters = [],
} = {}) {
  const view = cinematic3d({
    theta,
    phi,
    distance,
    unit,
    focus: [0, 0, 0],
    ambient: 0.42,
    shine: 0.36,
    fog: 0.06,
  }).at(x, y);

  // Translucent shaded sphere shell
  const shell = parametricSurface(
    (u, v) => [
      radius * Math.sin(v) * Math.cos(u),
      radius * Math.sin(v) * Math.sin(u),
      radius * Math.cos(v),
    ],
    [0, Math.PI * 2],
    [0.06, Math.PI - 0.06],
    {
      resolution: [28, 18],
      color: '#112042',
      mesh: '#5ce1e6',
      meshOpacity: 0.16,
      meshWidth: 0.65,
      opacity: 0.24,
      shaded: true,
    },
  );

  // Glowing equator and 2 orthogonal prime meridians
  const equator = curve3d((t) => [radius * Math.cos(t), radius * Math.sin(t), 0], 0, Math.PI * 2, {
    color: '#4d7cb8',
    width: 1.8,
    opacity: 0.6,
    samples: 64,
  });
  const meridianA = curve3d(
    (t) => [radius * Math.cos(t), 0, radius * Math.sin(t)],
    0,
    Math.PI * 2,
    { color: '#395786', width: 1.3, opacity: 0.45, samples: 56 },
  );
  const meridianB = curve3d(
    (t) => [0, radius * Math.cos(t), radius * Math.sin(t)],
    0,
    Math.PI * 2,
    { color: '#395786', width: 1.3, opacity: 0.45, samples: 56 },
  );

  const items = [shell, equator, meridianA, meridianB];

  // Optional cutting hyperplanes (great-circle discs)
  hyperplanes.forEach(({ normal, color = ROLE.violet, opacity = 0.22 }) => {
    const n = unit3(normal);
    const ref = Math.abs(n[2]) < 0.85 ? [0, 0, 1] : [1, 0, 0];
    const b1 = unit3([
      n[1] * ref[2] - n[2] * ref[1],
      n[2] * ref[0] - n[0] * ref[2],
      n[0] * ref[1] - n[1] * ref[0],
    ]);
    const b2 = [
      n[1] * b1[2] - n[2] * b1[1],
      n[2] * b1[0] - n[0] * b1[2],
      n[0] * b1[1] - n[1] * b1[0],
    ];
    items.push(
      curve3d(
        (t) => {
          const c = Math.cos(t) * radius * 1.03;
          const s = Math.sin(t) * radius * 1.03;
          return [c * b1[0] + s * b2[0], c * b1[1] + s * b2[1], c * b1[2] + s * b2[2]];
        },
        0,
        Math.PI * 2,
        {
          color,
          width: 2.4,
          glow: 7,
          blend: 'screen',
          opacity: Math.min(0.85, opacity * 3.4),
          samples: 56,
          onTop: true,
        },
      ),
    );
  });

  // Glowing vectors from origin (static or reactive functions returning [x,y,z])
  const tipList = [];
  const tipColors = [];
  vectors.forEach((vec) => {
    const getPos =
      typeof vec.dir === 'function'
        ? () => {
            const u = unit3(vec.dir());
            const r = (vec.scale ?? 1) * radius;
            return [u[0] * r, u[1] * r, u[2] * r];
          }
        : () => {
            const u = unit3(vec.dir);
            const r = (vec.scale ?? 1) * radius;
            return [u[0] * r, u[1] * r, u[2] * r];
          };
    items.push(
      line3d([0, 0, 0], getPos, {
        color: vec.color ?? ROLE.code,
        width: vec.width ?? 4.2,
        glow: vec.glow ?? 10,
        blend: 'screen',
        onTop: true,
      }),
    );
    tipList.push(getPos);
    tipColors.push(vec.color ?? ROLE.code);
  });

  if (tipList.length) {
    items.push(
      points3d(() => [[0, 0, 0], ...tipList.map((fn) => fn())], {
        colorAt: (idx) => (idx === 0 ? COSMOS.ink : tipColors[idx - 1]),
        radius: 6,
        glow: 12,
        blend: 'screen',
        onTop: true,
      }),
    );
  }

  // Geodesic great-circle arcs
  geodesics.forEach((g) => {
    items.push(
      geodesicCurve3d(g.a, g.b, {
        radius: radius * 1.02,
        color: g.color ?? ROLE.gold,
        width: g.width ?? 3.4,
        glow: g.glow ?? 9,
      }),
    );
  });

  // Optional semantic clusters on sphere surface
  if (clusters.length) {
    const pts = clusters.map((c) => {
      const u = unit3(c.dir);
      return [u[0] * radius * 1.01, u[1] * radius * 1.01, u[2] * radius * 1.01];
    });
    items.push(
      points3d(pts, {
        colorAt: (i) => clusters[i].color ?? ROLE.code,
        radius: 4.5,
        glow: 9,
        blend: 'screen',
        onTop: true,
      }),
    );
  }

  view.add(...items);
  return { view };
}

/**
 * Orbiting 3D 3-layer HNSW skip-graph pyramid for Scene 18 (`graph`).
 * `upperVis` is a Vizmatic Value in [0, 1] revealing Layer 1 and Layer 2 above Layer 0.
 */
export function buildHnswPyramid3d(upperVis, { x = 140, y = 40 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.08,
    distance: 14.5,
    unit: 112,
    focus: [0, 0, 0.9],
    ambient: 0.42,
    shine: 0.34,
  }).at(x, y);

  // Map 2D graph points into centered 3D coordinates
  const mapXY = ([px, py]) => [(px - 2.6) * 0.92, (py - 1.0) * 1.1];
  const zLayer = [0, 1.45, 2.85];

  const layerSlab = (z, color, opacity = 0.2) =>
    parametricSurface((u, v) => [(u * 2 - 1) * 3.1, (v * 2 - 1) * 1.9, z], [0, 1], [0, 1], {
      resolution: [8, 5],
      color,
      mesh: color,
      meshOpacity: 0.25,
      meshWidth: 0.7,
      opacity,
      shaded: true,
    });

  // Layer 0 (always visible): A, B, C, D, E with base edges
  const baseEdges = Object.entries(GRAPH.edges).flatMap(([id, ns]) =>
    ns
      .filter((n) => id < n)
      .map((n) => {
        const a = mapXY(GRAPH.points[id]);
        const b = mapXY(GRAPH.points[n]);
        return line3d([a[0], a[1], zLayer[0]], [b[0], b[1], zLayer[0]], {
          color: ROLE.code,
          width: 3.4,
          glow: 8,
          blend: 'screen',
          onTop: true,
        });
      }),
  );
  const basePts = Object.keys(GRAPH.points).map((id) => {
    const p = mapXY(GRAPH.points[id]);
    return [p[0], p[1], zLayer[0]];
  });

  // Upper layers dynamically lift from z=0 to zLayer[1] / zLayer[2]
  const pB = mapXY(GRAPH.points.B);
  const pC = mapXY(GRAPH.points.C);
  const z1 = () => zLayer[1] * upperVis.value;
  const z2 = () => zLayer[2] * upperVis.value;

  const upperSlab1 = parametricSurface(
    (u, v) => [(u * 2 - 1) * 2.5, (v * 2 - 1) * 1.5, zLayer[1]],
    [0, 1],
    [0, 1],
    {
      resolution: [6, 4],
      color: '#1b2654',
      mesh: ROLE.violet,
      meshOpacity: 0.28,
      meshWidth: 0.7,
      opacity: 0.16,
      shaded: true,
    },
  );
  const upperSlab2 = parametricSurface(
    (u, v) => [(u * 2 - 1) * 1.8, (v * 2 - 1) * 1.15, zLayer[2]],
    [0, 1],
    [0, 1],
    {
      resolution: [5, 4],
      color: '#251c4d',
      mesh: ROLE.gold,
      meshOpacity: 0.3,
      meshWidth: 0.7,
      opacity: 0.15,
      shaded: true,
    },
  );

  const dropB = line3d([pB[0], pB[1], 0], () => [pB[0], pB[1], z2()], {
    color: ROLE.gold,
    width: 3.0,
    glow: 9,
    blend: 'screen',
    onTop: true,
  });
  const dropC = line3d([pC[0], pC[1], 0], () => [pC[0], pC[1], z1()], {
    color: ROLE.violet,
    width: 2.6,
    glow: 7,
    blend: 'screen',
    onTop: true,
  });
  const skipBC = line3d(
    () => [pB[0], pB[1], z1()],
    () => [pC[0], pC[1], z1()],
    { color: ROLE.violet, width: 3.6, glow: 9, blend: 'screen', onTop: true },
  );
  const upperNodes = points3d(
    () => [
      [pB[0], pB[1], z2()],
      [pB[0], pB[1], z1()],
      [pC[0], pC[1], z1()],
    ],
    {
      colorAt: (i) => (i === 0 ? ROLE.gold : ROLE.violet),
      radius: 7,
      glow: 12,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(
    layerSlab(zLayer[0], '#10203e', 0.24),
    upperSlab1,
    upperSlab2,
    ...baseEdges,
    points3d(basePts, { color: ROLE.code, radius: 6.5, glow: 11, blend: 'screen', onTop: true }),
    dropB,
    dropC,
    skipBC,
    upperNodes,
  );
  return { view };
}
