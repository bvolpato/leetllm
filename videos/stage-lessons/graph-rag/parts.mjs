// Shared cinematic primitives, model imports, and orbiting 3D entity-community knowledge constellation for graph-rag.
import { group, line, line3d, linear, parametricSurface, points3d, rect } from 'vizmatic/stage';
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
  BOOK_ENTRIES,
  BOOK_TOPICS,
  CLUSTER_EDGES,
  CONTEXT_CANDIDATES,
  EDGES,
  RECORDS,
} from '../../films/graph-rag/fixtures.mjs';
import { incidentSelection, lexicalRows } from '../../films/graph-rag/incident-example.mjs';
import {
  blockedDescendants,
  dynamicTree,
  entails,
  modularityTerms,
  packContext,
  reportAudience,
  topicCounts,
  validateModel,
  walk,
  workloadCost,
} from '../../films/graph-rag/model.mjs';

export {
  BOOK_ENTRIES,
  BOOK_TOPICS,
  CLUSTER_EDGES,
  CONTEXT_CANDIDATES,
  COSMOS,
  EDGES,
  RECORDS,
  aura,
  blockedDescendants,
  dynamicTree,
  entails,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  incidentSelection,
  lexicalRows,
  line,
  modularityTerms,
  packContext,
  rect,
  reportAudience,
  topicCounts,
  txt,
  walk,
  workloadCost,
};

export const MOD_SPLIT = modularityTerms(
  [
    ['A', 'B', 'C', 'D'],
    ['E', 'F'],
  ],
  CLUSTER_EDGES,
);
export const MOD_MERGED = modularityTerms([['A', 'B', 'C', 'D', 'E', 'F']], CLUSTER_EDGES);
export const PACK_BASE = packContext(CONTEXT_CANDIDATES, 90);
export const PACK_REPORT_TOP = packContext(
  [
    { id: 'report', score: 0.99, tokens: 80 },
    { id: 'relation', score: 0.98, tokens: 30 },
    { id: 'text', score: 0.91, tokens: 55 },
  ],
  90,
);
export const COST_10 = workloadCost(10);
export const COST_500 = workloadCost(500);
export const TOPIC_4 = topicCounts(BOOK_ENTRIES.slice(0, 5));
export const TOPIC_5 = topicCounts(BOOK_ENTRIES);

export function verifyGraphRagInvariants() {
  validateModel();
  verifyInvariant(
    walk('person:lena').reached.includes('publisher:willow'),
    '2-hop graph walk reaches Willow Press',
  );
  verifyInvariant(
    entails({ ...EDGES[0], relation: 'owns' }) === false,
    'owns edge is unsupported by author sentence',
  );
  const qSplit = MOD_SPLIT.reduce((s, t) => s + t.contribution, 0);
  verifyApprox(qSplit, 5 / 18, 1e-9, '2-community modularity = 5/18 (~0.278)');
  verifyApprox(MOD_MERGED[0].contribution, 0, 1e-9, 'single-community modularity = 0');
  verifyInvariant(PACK_BASE.used === 85 && PACK_BASE.remaining === 5, 'base 90-tok pack uses 85');
  verifyInvariant(
    PACK_REPORT_TOP.used === 80 && PACK_REPORT_TOP.remaining === 10,
    'report-first pack leaves 10 tok',
  );
  verifyInvariant(
    COST_10.deferred === 18 && COST_10.precomputed === 208,
    '10-query cost 18 vs 208',
  );
  verifyInvariant(
    COST_500.deferred === 851 && COST_500.precomputed === 600,
    '500-query cost 851 vs 600',
  );
  verifyApprox(COST_10.crossover, 199 / 0.9, 1e-6, 'cost crossover ~221.1 queries');
  verifyInvariant(TOPIC_4.books === 4 && TOPIC_5.books === 5, 'deduplicated book counts 4 -> 5');
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

// Orbiting 3D Living Entity-Community Knowledge Constellation (L0 entity graph -> L1 community reports)
export function makeKnowledgeConstellation3D(cx, cy, phaseVal, mode = 'intro') {
  const view = cinematic3d({
    theta: -0.72,
    phi: 1.04,
    distance: 17.8,
    unit: 86,
    focus: [0, 0, 0.55],
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

  // Upper layer: Community report summary slabs
  const commLeft = wireframeSlab3d([-0.72, 0.0, 1.35], 0.85, 0.65, 0.14, {
    color: COSMOS.emerald,
    width: 2.0,
    glow: 7,
    opacity: 0.86,
  });
  const commRight = wireframeSlab3d([0.92, 0.1, 1.35], 0.62, 0.55, 0.14, {
    color: COSMOS.gold,
    width: 2.0,
    glow: 7,
    opacity: 0.86,
  });

  // Lower layer: Typed entity nodes & directed evidence paths
  const n0 = [-1.2, -0.45, 0.15]; // Lena / Service
  const n1 = [-0.45, 0.35, 0.22]; // Book: River Walk / Redis
  const n2 = [0.15, -0.35, 0.18]; // Willow / Juniper / Policy
  const n3 = [-0.85, 0.55, 0.08]; // Cache helper
  const n4 = [0.85, -0.25, 0.15]; // Eval / Park (separate ID!)
  const n5 = [1.25, 0.42, 0.2]; // Metric / Travel

  const hubL = [-0.72, 0.0, 1.25];
  const hubR = [0.92, 0.1, 1.25];

  const edges = [
    line3d(n0, n1, { stroke: COSMOS.cyan, width: 3.2, glow: 8 }),
    line3d(n1, n2, {
      stroke: mode === 'transfer' ? COSMOS.emerald : COSMOS.gold,
      width: 3.2,
      glow: 8,
    }),
    line3d(n0, n3, { stroke: COSMOS.cyan, width: 2.0, glow: 5 }),
    line3d(n1, n3, { stroke: COSMOS.cyan, width: 2.0, glow: 5 }),
    line3d(n4, n5, { stroke: COSMOS.violet, width: 2.6, glow: 7 }),
    // Vertical provenance beams up to community reports
    line3d(n1, hubL, { stroke: COSMOS.emerald, width: 2.0, glow: 6 }),
    line3d(n2, hubL, { stroke: COSMOS.emerald, width: 2.0, glow: 6 }),
    line3d(n4, hubR, { stroke: COSMOS.gold, width: 2.0, glow: 6 }),
    line3d(n5, hubR, { stroke: COSMOS.gold, width: 2.0, glow: 6 }),
  ];

  const nodes = points3d([n0, n1, n2, n3, n4, n5, hubL, hubR], {
    colorAt: (i) =>
      i <= 2
        ? COSMOS.emerald
        : i === 3
          ? COSMOS.cyan
          : i <= 5
            ? COSMOS.violet
            : i === 6
              ? COSMOS.emerald
              : COSMOS.gold,
    radius: 7.5,
    glow: 11,
    onTop: true,
  });

  // Animated provenance photons walking n0 -> n1 -> n2 -> hubL
  const walkPts = [n0, n1, n2, hubL];
  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const u = (p * 0.36) % 1;
      const seg = Math.min(walkPts.length - 2, Math.floor(u * (walkPts.length - 1)));
      const t = u * (walkPts.length - 1) - seg;
      const a = walkPts[seg];
      const b = walkPts[seg + 1];
      return [[a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]];
    },
    { color: COSMOS.gold, radius: 9.0, glow: 14, blend: 'screen', onTop: true },
  );

  view.add(floor, ...commLeft, ...commRight, ...edges, nodes, photons);
  return { view, orbit: (s, c) => orbitScene(s, c, view, { theta: 0.44, phi: 0.08 }) };
}
