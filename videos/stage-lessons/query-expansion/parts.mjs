// Shared cinematic primitives, 3D embedding stages, and real query-expansion model imports.
// All math and fixtures come directly from ../../films/query-expansion/*.mjs.
import {
  circle,
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
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';
import {
  meanEmbedding,
  nearestRank,
  supportScore,
} from '../../films/query-expansion/arithmetic.mjs';
import {
  CORPUS,
  CRITIQUE_BRANCHES,
  CRITIQUE_WEIGHTS,
  FOLLOW_UP,
  HYDE_MEAN,
  HYDE_PROXIES,
  INCIDENTS,
  LATENCY_STAGES,
  LATENCY_TRACES,
  PROPOSALS,
  PROXY_CORPUS,
  RECOVERY_QUERY,
  RELEASE_ROUTES,
  REQUIRED_RUNBOOKS,
  SUPPORT_PAGES,
  VARIANTS,
} from '../../films/query-expansion/fixtures.mjs';
import {
  accessConstruction,
  budgetConstruction,
  correctionPath,
  decomposeDependencies,
  decompositionTrace,
  eligibleRoutes,
  exactQueryRoute,
  expandQueries,
  fusionTrace,
  lookupIncident,
  proxyEvidence,
  recallSnapshot,
  reciprocalRankFusion,
  requestBudget,
  retrievalRun,
  rewriteSnapshot,
  runbookCoverage,
  search,
  terms,
  variantConstruction,
} from '../../films/query-expansion/model.mjs';
import { validateModel } from '../../films/query-expansion/validation.mjs';

export {
  CORPUS,
  COSMOS,
  CRITIQUE_BRANCHES,
  CRITIQUE_WEIGHTS,
  FOLLOW_UP,
  HYDE_MEAN,
  HYDE_PROXIES,
  INCIDENTS,
  LATENCY_STAGES,
  LATENCY_TRACES,
  PROPOSALS,
  PROXY_CORPUS,
  RECOVERY_QUERY,
  RELEASE_ROUTES,
  REQUIRED_RUNBOOKS,
  SUPPORT_PAGES,
  VARIANTS,
  accessConstruction,
  aura,
  budgetConstruction,
  circle,
  correctionPath,
  decomposeDependencies,
  decompositionTrace,
  eligibleRoutes,
  exactQueryRoute,
  expandQueries,
  fusionTrace,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  lookupIncident,
  meanEmbedding,
  nearestRank,
  polyPath,
  proxyEvidence,
  recallSnapshot,
  reciprocalRankFusion,
  rect,
  requestBudget,
  retrievalRun,
  rewriteSnapshot,
  rule,
  runbookCoverage,
  search,
  supportScore,
  terms,
  txt,
  variantConstruction,
};

export const STEP_BACK_REQUEST = Object.freeze({
  id: 'R17',
  endpoint: 'E2',
  tier: 2,
  perWindow: 120,
  code: 429,
  windowSec: 60,
});

export const STEP_BACK_POLICY = Object.freeze({
  id: 'P4',
  endpoint: 'E2',
  tier: 2,
  limit: 100,
  windowSec: 60,
});

export const REFINEMENT_STRIPS = Object.freeze([
  { id: 'E1.1', text: 'Temporary quota increases require approval.', keep: true },
  { id: 'E1.2', text: 'Menu / Home / Contact', keep: false },
  { id: 'E1.3', text: 'Keep exponential backoff enabled.', keep: true },
  { id: 'E1.4', text: 'Storage retention is thirty days.', keep: false },
]);

export const DECOMPOSITION_FACTS = Object.freeze([
  { name: 'Latency', sync: '90 ms target', batch: 'Within 24 h', syncId: 'S1', batchId: 'B1' },
  { name: 'Limit / job', sync: '32 items', batch: '500 items', syncId: 'S2', batchId: 'B2' },
  { name: 'Retries', sync: 'Use backoff', batch: null, syncId: 'S3', batchId: 'B3' },
]);

export const SUPPORT_PIECES = Object.freeze([47, 2, 1]);
export const FANOUT_SINGLE_PROB = 0.95;
export const FANOUT_ALL_THREE_PROB = FANOUT_SINGLE_PROB ** 3;

export function verifyQueryExpansionInvariants() {
  validateModel();

  const rawScores = SUPPORT_PAGES.map((p) => search(FOLLOW_UP, [p])[0]?.score ?? 0);
  verifyInvariant(rawScores[0] === 3 && rawScores[1] === 0, 'follow-up word matches [3, 0]');

  const rewriteScores = SUPPORT_PAGES.map((p) => search(RECOVERY_QUERY, [p])[0]?.score ?? 0);
  verifyInvariant(rewriteScores[0] === 2 && rewriteScores[1] === 6, 'rewrite word matches [2, 6]');

  const expanded = expandQueries('peak demand handling', PROPOSALS, 3);
  verifyInvariant(expanded.length === 4, 'original plus 3 unique variants');

  const run = retrievalRun();
  verifyInvariant(run.fused[0].id === 'queue-guide', 'RRF winner is queue-guide');
  verifyApprox(run.fused[0].score, 1 / 61 + 1 / 62, 1e-12, 'queue-guide RRF total');
  verifyApprox(run.fused[1].score, 1 / 61, 1e-12, 'burst-policy RRF total');

  const cov1 = runbookCoverage(run.allRankings[1]);
  verifyInvariant(cov1.hit === 1 && cov1.recall === 0.5 && !cov1.complete, 'one variant recall@3');
  const covAll = runbookCoverage(run.topIds);
  verifyInvariant(covAll.hit === 1 && covAll.recall === 1 && covAll.complete, 'fused recall@3');

  verifyInvariant(
    STEP_BACK_REQUEST.perWindow - STEP_BACK_POLICY.limit === 20,
    'step-back excess is 20 req',
  );

  HYDE_MEAN.forEach((v, idx) =>
    verifyApprox(v, [0.3, 0.7, 0.3][idx], 1e-12, `HyDE mean coord ${idx}`),
  );
  verifyInvariant(proxyEvidence(false).recovered === 2, 'useful proxy recovers 2 required');
  verifyInvariant(proxyEvidence(true).recovered === 1, 'drifting proxy drops to 1 required');

  verifyApprox(supportScore(SUPPORT_PIECES), 0.96, 1e-12, 'Self-RAG support score');
  verifyApprox(CRITIQUE_BRANCHES[0].total, 0.922, 1e-9, 'Self-RAG branch A total');
  verifyApprox(CRITIQUE_BRANCHES[1].total, 0.534, 1e-9, 'Self-RAG branch B total');

  verifyInvariant(correctionPath(0.81) === 'internal', 'CRAG 0.81 internal');
  verifyInvariant(correctionPath(0.45) === 'combined', 'CRAG 0.45 combined');
  verifyInvariant(correctionPath(0.17) === 'external', 'CRAG 0.17 external');
  verifyInvariant(correctionPath(0.7) === 'combined', 'CRAG 0.7 boundary combined');
  verifyInvariant(correctionPath(0.2) === 'combined', 'CRAG 0.2 boundary combined');

  const ttft = LATENCY_STAGES.reduce((sum, st) => sum + st.ms, 0);
  verifyInvariant(ttft === 395, 'serial TTFT sum is 395 ms');
  verifyInvariant(nearestRank(LATENCY_TRACES.map((r) => r.a)) === 10, 'stage A p95 is 10 ms');
  verifyInvariant(nearestRank(LATENCY_TRACES.map((r) => r.b)) === 10, 'stage B p95 is 10 ms');
  verifyInvariant(nearestRank(LATENCY_TRACES.map((r) => r.total)) === 110, 'total p95 is 110 ms');
  verifyApprox(FANOUT_ALL_THREE_PROB, 0.857375, 1e-9, 'parallel 3-search deadline prob');

  verifyInvariant(
    eligibleRoutes(350).length === 1 && eligibleRoutes(350)[0].id === 'rewrite',
    '350 ms gate selects rewrite',
  );
  verifyInvariant(eligibleRoutes(300).length === 0, '300 ms gate blocks release');

  verifyInvariant(requestBudget(4).admitted && requestBudget(4).candidateCap === 12, '4-call cap');
  verifyInvariant(!requestBudget(5).admitted, '5th call exceeds budget');
  verifyInvariant(lookupIncident('INC-48219')?.closed === '09:18 UTC', 'INC-48219 closed time');
  verifyInvariant(lookupIncident('INC-48291')?.closed === '14:32 UTC', 'INC-48291 closed time');
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

// Orbiting 3D Query-Neighborhood Constellation (Scenes 1 & 2)
export function makeQueryConstellation3D(cx, cy, phaseVal, opts = {}) {
  const { targetProgress = () => 0 } = opts;
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 17.4,
    unit: 86,
    focus: [0, 0, 0.35],
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

  // Left cluster: Account overview (generic phrasing)
  const genericSlab = wireframeSlab3d([-1.25, -0.2, 0.25], 0.85, 0.95, 0.42, {
    color: COSMOS.amber,
    width: 2.2,
    glow: 8,
  });

  // Right cluster: Recovery guide (API key revoke/rotate)
  const recoverySlab = wireframeSlab3d([1.25, 0.25, 0.45], 0.85, 0.95, 0.52, {
    color: COSMOS.emerald,
    width: 2.4,
    glow: 9,
  });

  const genericPts = [
    [-1.45, -0.45, 0.35],
    [-1.1, 0.1, 0.5],
    [-1.3, -0.05, 0.18],
  ];
  const recoveryPts = [
    [1.15, 0.35, 0.65],
    [1.45, -0.05, 0.48],
    [1.05, 0.55, 0.35],
  ];

  const stems = [
    ...genericPts.map((pt) =>
      line3d([pt[0], pt[1], -0.32], pt, { stroke: COSMOS.amber, width: 1.8, opacity: 0.65 }),
    ),
    ...recoveryPts.map((pt) =>
      line3d([pt[0], pt[1], -0.32], pt, { stroke: COSMOS.emerald, width: 2.0, opacity: 0.72 }),
    ),
  ];

  const docBeacons = points3d([...genericPts, ...recoveryPts], {
    colorAt: (i) => (i < 3 ? COSMOS.amber : COSMOS.emerald),
    radius: 7.5,
    glow: 10,
    onTop: true,
  });

  const bridgeLine = line3d([-1.15, -0.15, 0.95], [1.2, 0.28, 1.05], {
    stroke: COSMOS.cyan,
    width: 2.6,
    glow: 8,
    opacity: 0.65,
  });

  const queryPhotons = points3d(
    () => {
      const p = phaseVal.value;
      const u = Math.max(0, Math.min(1, targetProgress()));
      const qx = -1.15 + u * 2.35;
      const qy = -0.15 + u * 0.43;
      const qz = 0.95 + Math.sin(u * Math.PI) * 0.45 + u * 0.1;
      const orb = (p * 0.45) % 1;
      const targetPt = u > 0.5 ? recoveryPts[0] : genericPts[1];
      return [
        [qx, qy, qz],
        [
          qx + (targetPt[0] - qx) * orb,
          qy + (targetPt[1] - qy) * orb,
          qz + (targetPt[2] - qz) * orb,
        ],
      ];
    },
    {
      colorAt: (i) => (i === 0 ? COSMOS.gold : COSMOS.cyan),
      radius: 9.5,
      glow: 13,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(floor, ...genericSlab, ...recoverySlab, ...stems, docBeacons, bridgeLine, queryPhotons);
  return { view, orbit: (s, c) => orbitScene(s, c, view, { theta: 0.45, phi: 0.08 }) };
}

// Orbiting 3D Multi-Query Fan-Out Constellation (Scene 3)
export function makeFanout3D(cx, cy, phaseVal) {
  const view = cinematic3d({
    theta: -0.72,
    phi: 1.02,
    distance: 17.6,
    unit: 84,
    focus: [0, 0, 0.35],
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

  const origin = [-1.45, 0, 0.9];
  const targets = [
    [1.25, -1.05, 0.42],
    [1.45, 0.05, 0.72],
    [1.15, 1.05, 0.46],
  ];
  const rayColors = [COSMOS.blue, COSMOS.cyan, COSMOS.gold];

  const slabs = targets.flatMap((pt, idx) =>
    wireframeSlab3d([pt[0], pt[1], pt[2] - 0.15], 0.52, 0.42, 0.32, {
      color: rayColors[idx],
      width: 2.0,
      glow: 8,
    }),
  );

  const rays = targets.map((pt, idx) =>
    line3d(origin, pt, { stroke: rayColors[idx], width: 3.0, glow: 9 }),
  );

  const hubStem = line3d([origin[0], origin[1], -0.32], origin, {
    stroke: COSMOS.amber,
    width: 2.4,
    opacity: 0.7,
  });

  const nodes3d = points3d([origin, ...targets], {
    colorAt: (i) => (i === 0 ? COSMOS.amber : rayColors[i - 1]),
    radius: 9,
    glow: 12,
    onTop: true,
  });

  const streamPhotons = points3d(
    () => {
      const p = phaseVal.value;
      return targets.map((pt, idx) => {
        const f = (p * 0.38 + idx * 0.31) % 1;
        return [
          origin[0] + (pt[0] - origin[0]) * f,
          origin[1] + (pt[1] - origin[1]) * f,
          origin[2] + (pt[2] - origin[2]) * f + 0.06,
        ];
      });
    },
    {
      colorAt: (i) => rayColors[i],
      radius: 8,
      glow: 13,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(floor, ...slabs, hubStem, ...rays, nodes3d, streamPhotons);
  return { view, orbit: (s, c) => orbitScene(s, c, view, { theta: 0.45, phi: 0.08 }) };
}

// Orbiting 3D HyDE Vector Projection Stage (Scene 9)
export function makeHyde3D(cx, cy, phaseVal, opts = {}) {
  const { meanProgress = () => 1 } = opts;
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.06,
    distance: 17.2,
    unit: 88,
    focus: [0, 0, 0.45],
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

  const mapVec = (v) => [-1.6 + v[0] * 4.2, -1.1 + v[1] * 2.6, -0.32 + v[2] * 3.2];
  const o = mapVec([0, 0, 0]);
  const p1 = mapVec(HYDE_PROXIES[0]);
  const p2 = mapVec(HYDE_PROXIES[1]);
  const pm = mapVec(HYDE_MEAN);

  const axes = [
    line3d(o, [1.8, o[1], o[2]], { stroke: COSMOS.dim, width: 1.6, opacity: 0.55 }),
    line3d(o, [o[0], 1.4, o[2]], { stroke: COSMOS.dim, width: 1.6, opacity: 0.55 }),
    line3d(o, [o[0], o[1], 1.5], { stroke: COSMOS.dim, width: 1.6, opacity: 0.55 }),
  ];

  const v1 = line3d(o, p1, { stroke: COSMOS.blue, width: 3.6, glow: 9 });
  const v2 = line3d(o, p2, { stroke: COSMOS.cyan, width: 3.6, glow: 9 });
  const chord = line3d(p1, p2, { stroke: COSMOS.gold, width: 2.2, opacity: 0.72 });
  const vm = line3d(o, pm, { stroke: COSMOS.emerald, width: 4.4, glow: 11 });

  const tips = points3d([o, p1, p2, pm], {
    colorAt: (i) => [COSMOS.muted, COSMOS.blue, COSMOS.cyan, COSMOS.emerald][i],
    radius: 9,
    glow: 12,
    onTop: true,
  });

  const targetSlab = wireframeSlab3d([pm[0], pm[1], pm[2]], 0.36, 0.36, 0.28, {
    color: COSMOS.emerald,
    width: 2.0,
    glow: 8,
  });

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const m = Math.max(0.05, Math.min(1, meanProgress()));
      const f = (p * 0.42) % 1;
      return [
        [
          p1[0] + (pm[0] - p1[0]) * f * m,
          p1[1] + (pm[1] - p1[1]) * f * m,
          p1[2] + (pm[2] - p1[2]) * f * m,
        ],
        [
          p2[0] + (pm[0] - p2[0]) * f * m,
          p2[1] + (pm[1] - p2[1]) * f * m,
          p2[2] + (pm[2] - p2[2]) * f * m,
        ],
      ];
    },
    {
      colorAt: (i) => (i === 0 ? COSMOS.blue : COSMOS.cyan),
      radius: 8,
      glow: 13,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(floor, ...axes, v1, v2, chord, vm, ...targetSlab, tips, photons);
  return { view, orbit: (s, c) => orbitScene(s, c, view, { theta: 0.45, phi: 0.08 }) };
}
