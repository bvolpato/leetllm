// Shared math models, invariants, color semantics, and 3D/vector cinema helpers for pretraining-data.
import {
  Node,
  circle,
  curve3d,
  dot,
  gridPlane3d,
  group,
  line,
  line3d,
  linear,
  linearGradient,
  parametricSurface,
  points3d,
  polyPath,
  radialGradient,
  rect,
  surface,
} from 'vizmatic/stage';
import {
  bpeReplay,
  documentSample,
  independentObjective,
  jaccard,
  packRecords,
  packedMask,
  restoreRecords,
  share,
  shingles,
} from '../../films/pretraining-data/arithmetic.mjs';
import {
  BPE_RULES,
  DOCUMENT_DRAWS,
  NEAR_DUPLICATE_TEXT,
  PACKED_WORDS,
  PROXY_RESULTS,
  TOY_TOKEN_IDS,
  corpus,
  extractionFixture,
  releaseBatch,
  releaseEvaluation,
} from '../../films/pretraining-data/fixtures.mjs';
import {
  boundarySnapshot,
  dedupSnapshot,
  extractionSnapshot,
  filterState,
  inventoryFixture,
  mixtureSnapshot,
  preparationBranch,
  transferSnapshot,
  validateModel,
} from '../../films/pretraining-data/model.mjs';
import {
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
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

// ---------------------------------------------------------------------------
// Derived mathematical constants backed by model.mjs, fixtures.mjs, arithmetic.mjs
// ---------------------------------------------------------------------------
export const CODE_RECORD = corpus.find((r) => r.id === 'C');
export const MENU_RECORD = corpus.find((r) => r.id === 'D');
export const INV_FIXTURE = inventoryFixture();
export const BRANCH_050 = preparationBranch(0.5);
export const BRANCH_085 = preparationBranch(0.85);

export const CHINCHILLA_PLAN = Object.freeze({
  paramsB: 70,
  tokensPerParam: 20,
  targetTokensT: (70 * 20) / 1000, // 1.4T
  flops: 6 * 70e9 * 1.4e12, // 5.88e23
  extractedT: 2.0,
  afterFilterT: 2.0 * 0.7, // 1.4T
  afterDedupT: 2.0 * 0.7 * 0.8, // 1.12T
  shortfallB: (1.4 - 2.0 * 0.7 * 0.8) * 1000, // 280B
});

export const SCORE_CONTRACT_RECORDS = Object.freeze([
  { id: 'Proof', tokens: 120, score: 0.98, color: COSMOS.emerald },
  { id: 'API docs', tokens: 160, score: 0.92, color: COSMOS.cyan },
  { id: 'Forum', tokens: 200, score: 0.79, color: COSMOS.blue },
  { id: 'News', tokens: 240, score: 0.63, color: COSMOS.violet },
  { id: 'Scrape', tokens: 280, score: 0.31, color: COSMOS.rose },
]);

export const SCORE_CONTRACT_TOTAL = SCORE_CONTRACT_RECORDS.reduce((s, r) => s + r.tokens, 0);
export const SCORE_CONTRACT_KEPT_90 = SCORE_CONTRACT_RECORDS.filter((r) => r.score >= 0.9).reduce(
  (s, r) => s + r.tokens,
  0,
);

export const MINHASH_SHARED = Object.freeze([
  'the key',
  'key policy',
  'policy says',
  'says stale',
  'stale accounts',
  'security review',
]);
export const MINHASH_UNIQUE_A = Object.freeze(['accounts need', 'need security']);
export const MINHASH_UNIQUE_B = Object.freeze(['accounts require', 'require security']);
export const MINHASH_BAND1_HASHES = Object.freeze([
  '109f7012a5dd0c28',
  '0b0b05eb97d540f4',
  '0dddf4b7179f16b3',
  '043df96cd35df552',
]);

export const LSH_BANDS = 8;
export const LSH_ROWS = 4;
export const lshProb = (s, b = LSH_BANDS, r = LSH_ROWS) => 1 - (1 - s ** r) ** b;

export const LSH_CHAIN_SETS = Object.freeze([
  [1, 2, 3, 4],
  [1, 2, 3, 4, 5, 6],
  [3, 4, 5, 6],
]);

export const MIX_DOC_50 = documentSample(0.5, [100, 900]);
export const MIX_DOC_90 = documentSample(0.9, [100, 900]);
export const MIX_BLK_90 = documentSample(0.9, [100, 100]);
export const MIX_BLK_50 = documentSample(0.5, [100, 100]);
export const EXP_SHARE_80 = share([0.8, 0.2], [100, 900]);
export const EXP_CAPPED = documentSample(0.9, [100, 300]);

export const LLAMA3_MIX = Object.freeze([
  { label: 'General web', pct: 50, color: COSMOS.blue },
  { label: 'Math & reasoning', pct: 25, color: COSMOS.gold },
  { label: 'Code', pct: 17, color: COSMOS.violet },
  { label: 'Multilingual', pct: 8, color: COSMOS.cyan },
]);

export const BPE_SAMPLE_WORDS = Object.freeze(['rotate', 'keys', 'after', 'review']);
export const PACKING_LENGTHS = Object.freeze([7, 6, 5, 5, 3, 2]);
export const PACKED_BINS = packRecords([...PACKING_LENGTHS], 10);
export const AWKWARD_BINS = packRecords([6, 6, 6], 10);

export const LABEL_IDS = Object.freeze([11, 12, 99, 21, 99]);
export const LABEL_DOCS = Object.freeze([0, 0, 0, 1, 1]);
export const LABEL_OBJ = independentObjective([...LABEL_IDS], [...LABEL_DOCS]);

export const LINEAGE_ORDER = Object.freeze(['A', 'C', 'E', 'A', 'C', 'E']);
export const RESTART_ORDER = Object.freeze(['0', '5', '1', '2', '3', '4']);
export const RESTART_STATE = restoreRecords([...RESTART_ORDER], 2, 4);

export const FRESH_TOTAL = releaseBatch.reduce((s, r) => s + r.tokens, 0);
export const FRESH_STRICT = releaseBatch
  .filter((r) => r.score >= 0.9)
  .reduce((s, r) => s + r.tokens, 0);
export const FRESH_RESTORED = releaseBatch
  .filter((r) => r.score >= (r.source === 'Code' ? 0.7 : 0.9))
  .reduce((s, r) => s + r.tokens, 0);

/** Build-time mathematical invariant verification backed by model.mjs and arithmetic.mjs. */
export function verifyPretrainingInvariants() {
  verifyInvariant(validateModel() === true, 'upstream model.mjs validateModel() must pass');

  // Chinchilla inventory plan
  verifyApprox(CHINCHILLA_PLAN.targetTokensT, 1.4, 1e-9, '70B * 20 = 1.4T');
  verifyApprox(CHINCHILLA_PLAN.flops / 1e23, 5.88, 1e-9, '6ND = 5.88e23 FLOPs');
  verifyApprox(CHINCHILLA_PLAN.afterFilterT, 1.4, 1e-9, '2T * 0.7 = 1.4T');
  verifyApprox(CHINCHILLA_PLAN.afterDedupT, 1.12, 1e-9, '1.4T * 0.8 = 1.12T');
  verifyApprox(CHINCHILLA_PLAN.shortfallB, 280, 1e-6, '1.4T - 1.12T = 280B gap');

  // Score contracts & filter
  verifyInvariant(SCORE_CONTRACT_TOTAL === 1000, 'score contract batch = 1000 tokens');
  verifyInvariant(SCORE_CONTRACT_KEPT_90 === 280, 'score >= 0.90 keeps 280 tokens');
  verifyInvariant(INV_FIXTURE.counts[0].tokens === 1000, 'corpus total = 1000');
  verifyInvariant(INV_FIXTURE.counts[1].tokens === 800, 'after filter = 800');
  verifyInvariant(INV_FIXTURE.counts[2].tokens === 560, 'after dedup = 560');
  verifyInvariant(BRANCH_050.tokens === 560, 'branch 0.50 = 560 unique tokens');
  verifyInvariant(BRANCH_085.tokens === 240, 'branch 0.85 = 240 unique tokens');
  verifyApprox(BRANCH_050.mean, 0.8214285714, 1e-4, 'branch 0.50 token-weighted mean');
  verifyApprox(BRANCH_085.mean, 0.9, 1e-9, 'branch 0.85 token-weighted mean');

  // Dedup, MinHash, LSH chain
  verifyApprox(
    jaccard(NEAR_DUPLICATE_TEXT[0], NEAR_DUPLICATE_TEXT[1]),
    1 / 3,
    1e-12,
    'trigram Jaccard = 1/3',
  );
  verifyApprox(
    MINHASH_SHARED.length /
      (MINHASH_SHARED.length + MINHASH_UNIQUE_A.length + MINHASH_UNIQUE_B.length),
    0.6,
    1e-12,
    'MinHash bigram Jaccard = 6/10 = 0.6',
  );
  verifyApprox(lshProb(0.25), 0.03084, 1e-3, 'LSH prob at 0.25 ~ 3.1%');
  verifyApprox(lshProb(0.5), 0.40328, 1e-3, 'LSH prob at 0.50 ~ 40.3%');
  verifyApprox(lshProb(0.75), 0.9524, 1e-3, 'LSH prob at 0.75 ~ 95.2%');

  // Mixture & exposure schedule
  verifyInvariant(MIX_DOC_50.tokens[0] === 500 && MIX_DOC_50.tokens[1] === 4500, '50/50 doc draws');
  verifyInvariant(MIX_DOC_90.tokens[0] === 900 && MIX_DOC_90.tokens[1] === 900, '90/10 doc draws');
  verifyInvariant(MIX_BLK_50.tokens[0] === 500 && MIX_BLK_50.tokens[1] === 500, '50/50 blocks');
  verifyApprox(EXP_SHARE_80[0], 80 / 260, 1e-12, '80% doc draw code share = 80/260');
  verifyApprox(EXP_CAPPED.shares[0], 0.75, 1e-12, 'capped page code share = 900/1200 = 75%');

  // BPE, packing, labels, restart, fresh release
  verifyInvariant(
    bpeReplay([...BPE_SAMPLE_WORDS], []).flat().length === 25,
    'BPE initial 25 pieces',
  );
  verifyInvariant(
    bpeReplay([...BPE_SAMPLE_WORDS], BPE_RULES).flat().length === 16,
    'BPE after 8 rules = 16 pieces',
  );
  verifyInvariant(PACKED_BINS.length === 3, 'best-fit decreasing uses 3 bins');
  verifyInvariant(AWKWARD_BINS.length === 3, 'three length-6 records use 3 bins');
  verifyInvariant(LABEL_OBJ.mask[3][2] === 0, 'doc 1 query 3 cannot read doc 0 key 2');
  verifyInvariant(LABEL_OBJ.targets.filter((v) => v !== -100).length === 3, '3 supervised targets');
  verifyInvariant(
    LABEL_OBJ.labels.slice(1).filter((v) => v !== -100).length === 3,
    '3 unshifted-then-shifted targets',
  );
  verifyInvariant(RESTART_STATE.suffix.join(',') === '1,2,3,4', 'restart suffix = 1,2,3,4');
  verifyInvariant(RESTART_STATE.skippedByReader.join(',') === '1,2', 'prefetch skips 1,2');
  verifyInvariant(RESTART_STATE.repeatedBySeed.join(',') === '0,5', 'seed repeats 0,5');
  verifyInvariant(
    FRESH_TOTAL === 600 && FRESH_STRICT === 180 && FRESH_RESTORED === 300,
    'fresh batch token totals',
  );
}

// ---------------------------------------------------------------------------
// Timing & animation helpers
// ---------------------------------------------------------------------------
export function safeDuration(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

export function remainDuration(c, cueId, maxDur = 2.0, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.25, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

export function remainAfterDuration(c, cueId, maxDur = 1.6, endMargin = 0.5) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.2, c.end - cue.end - endMargin);
  return Math.min(maxDur, avail);
}

export function runPhase(s, c, phaseVal, target = 12, startOffset = 0.08) {
  const dur = safeDuration(c, startOffset, 0.55);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

// ---------------------------------------------------------------------------
// 2D luminous geometry & token stream primitives (zero slide chrome)
// ---------------------------------------------------------------------------
export function glassCell(
  x,
  y,
  w,
  h,
  strokeColor = COSMOS.cyan,
  { fill = '#0d1426', radius = 10, glow = 6, opacity = 0.92, dash, strokeWidth = 2.2 } = {},
) {
  const r = rect(w, h, { fill, stroke: strokeColor, width: strokeWidth, radius, dash })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) r.glow(glow, strokeColor);
  return r;
}

export function glowingArc(p0, p1, liftY, opts = {}) {
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

function deepDecoration(node) {
  markDecoration(node);
  if (Array.isArray(node?.children)) {
    for (const child of node.children) deepDecoration(child);
  }
  return node;
}

/** Animated glowing photon stream along a horizontal or curved conduit. */
export function photonStream(
  p0,
  p1,
  liftY,
  phase,
  { color = COSMOS.cyan, count = 5, radius = 5.5, opacity = 0.92, speed = 0.24, trail = true } = {},
) {
  const mx = (p0[0] + p1[0]) * 0.5;
  const my = (p0[1] + p1[1]) * 0.5 + liftY;
  const evalPt = (t) => {
    const u = 1 - t;
    return [
      u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
    ];
  };
  const nodes = [];
  if (trail) {
    nodes.push(
      deepDecoration(
        glowingArc(p0, p1, liftY, {
          color,
          width: 2.8,
          opacity: opacity * 0.5,
          glow: 6,
          core: false,
        }),
      ),
    );
  }
  for (let i = 0; i < count; i++) {
    const t = (phase * speed + i / count) % 1;
    const [px, py] = evalPt(t);
    const env = Math.sin(Math.PI * t);
    nodes.push(
      deepDecoration(
        glowDot(px, py, {
          radius: radius * (0.7 + 0.35 * env),
          color,
          glow: 10,
          opacity: opacity * (0.35 + 0.65 * env),
        }),
      ),
    );
  }
  return nodes;
}

/** Luminous horizontal bar (no outer slide card). */
export function glowBar(
  xLeft,
  y,
  maxW,
  frac,
  { height = 34, color = COSMOS.cyan, trackColor = '#141c33', opacity = 1, glow = 8 } = {},
) {
  const clamped = Math.max(0, Math.min(1, frac));
  const fillW = Math.max(0, maxW * clamped);
  const nodes = [
    rect(maxW, height, { fill: trackColor, stroke: '#29375a', width: 1.5, radius: 7 })
      .at(xLeft + maxW * 0.5, y)
      .opacity(opacity * 0.85),
  ];
  if (fillW > 2) {
    const bar = rect(fillW, height - 4, { fill: color, stroke: null, radius: 6 })
      .at(xLeft + fillW * 0.5, y)
      .opacity(opacity * 0.92);
    if (glow > 0) bar.glow(glow, color);
    nodes.push(bar);
  }
  return nodes;
}

/** Subtle glowing laser rail for classifier score cutoffs. */
export function laserRail(x0, x1, y, { activeFrom = null, opacity = 1 } = {}) {
  const nodes = [
    line([x0, y], [x1, y], { stroke: '#3b4a70', width: 4 }).opacity(opacity),
    txt('0.0', x0, y + 48, 26, COSMOS.dim, 'mono').opacity(opacity),
    txt('1.0', x1, y + 48, 26, COSMOS.dim, 'mono').opacity(opacity),
  ];
  if (activeFrom !== null) {
    const cx = x0 + (x1 - x0) * activeFrom;
    nodes.push(
      glowingTrail(
        [
          [cx, y],
          [x1, y],
        ],
        { color: COSMOS.emerald, width: 6, glow: 10, opacity },
      ),
    );
  }
  return nodes;
}

// ---------------------------------------------------------------------------
// Signature 3D visual builders (Chinchilla surface, Sieve prism, Vocab slabs)
// ---------------------------------------------------------------------------
function chinchillaLoss(wx, wy, half = 3.0) {
  // wx maps log10(N) in [8, 12], wy maps log10(D) in [10, 14]
  const u = (wx + half) / (2 * half);
  const v = (wy + half) / (2 * half);
  const loss = 0.28 + 1.55 * Math.exp(-2.35 * u) + 1.45 * Math.exp(-2.25 * v);
  return Math.min(2.65, loss);
}

/**
 * Orbiting 3D Chinchilla compute-optimal iso-loss surface L(N, D)
 * with glowing compute-optimal frontier curve and 70B / 1.4T beacon.
 */
export function buildChinchillaSurface3d(progressVal, { x = 355, y = 25, half = 2.85 } = {}) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 1.02,
    distance: 15.2,
    unit: 112,
    focus: [0, 0, 0.85],
  }).at(x, y);

  const surf = surface((wx, wy) => chinchillaLoss(wx, wy, half), {
    x: [-half, half],
    y: [-half, half],
    resolution: [40, 40],
    colors: ['#0a1630', '#1d3b7a', '#247ba0', '#5ce1e6', '#ffd166', '#ff6b8b'],
    mesh: '#80e8ff',
    meshOpacity: 0.16,
    meshWidth: 0.55,
    opacity: 0.9,
  });

  // Compute-optimal ridge D = 20 N (diagonal in log-log coordinates)
  const ridge = curve3d(
    (t) => {
      const wx = -half + 0.35 + t * (2 * half - 0.7);
      const wy = -half + 0.35 + t * (2 * half - 0.7);
      return [wx, wy, chinchillaLoss(wx, wy, half) + 0.08];
    },
    0,
    1,
    {
      color: COSMOS.gold,
      width: 4.0,
      glow: 10,
      blend: 'screen',
      samples: 44,
      onTop: true,
    },
  );

  // Iso-FLOP slice 6ND = 5.88e23 (anti-diagonal wx + wy = const)
  const isoFlop = curve3d(
    (t) => {
      const span = 2.1;
      const center = 0.78;
      const wx = center - span * 0.5 + t * span;
      const wy = center + span * 0.5 - t * span;
      return [wx, wy, chinchillaLoss(wx, wy, half) + 0.08];
    },
    0,
    1,
    {
      color: COSMOS.cyan,
      width: 3.4,
      glow: 9,
      blend: 'screen',
      samples: 36,
      onTop: true,
    },
  );

  // Axis frame along base plane
  const axes = [
    line3d([-half, -half, 0.04], [half, -half, 0.04], {
      color: COSMOS.blue,
      width: 2.4,
      opacity: 0.75,
    }),
    line3d([-half, -half, 0.04], [-half, half, 0.04], {
      color: COSMOS.cyan,
      width: 2.4,
      opacity: 0.75,
    }),
  ];

  // Animated photon gliding along the compute-optimal ridge to (70B, 1.4T)
  const beacon = points3d(
    () => {
      const p = Math.max(0, Math.min(1, progressVal.value));
      const t = 0.15 + 0.5 * p;
      const wx = -half + 0.35 + t * (2 * half - 0.7);
      const wy = wx;
      const z = chinchillaLoss(wx, wy, half) + 0.14;
      const ox = 0.78;
      const oz = chinchillaLoss(ox, ox, half) + 0.14;
      return [
        [wx, wy, z],
        [ox, ox, oz],
      ];
    },
    {
      colorAt: (idx) => (idx === 0 ? COSMOS.cyan : COSMOS.gold),
      radius: 7,
      glow: 14,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(surf, ...axes, ridge, isoFlop, beacon);
  return { view };
}

/**
 * Orbiting 3D token sieve chamber: luminous stream entering from left,
 * crossing glowing filter/dedup planes, and splitting into retained vs dropped rays.
 */
export function buildSieveChamber3d(phaseVal, cutoffVal, { x = 350, y = 25 } = {}) {
  const view = cinematic3d({
    theta: -0.68,
    phi: 1.06,
    distance: 15.0,
    unit: 112,
    focus: [0, 0, 0.1],
  }).at(x, y);

  const gateA = wireframeSlab3d([-0.6, 0, 0], 0.08, 2.0, 1.45, {
    color: COSMOS.gold,
    width: 2.8,
    glow: 8,
  });
  const gateB = wireframeSlab3d([0.9, 0, 0], 0.08, 1.75, 1.25, {
    color: COSMOS.cyan,
    width: 2.8,
    glow: 8,
  });

  const floor = gridPlane3d({
    x: [-3.2, 3.2],
    y: [-2.4, 2.4],
    z: -1.5,
    step: 0.8,
    color: '#2d3f6b',
    opacity: 0.35,
  });

  const streamPts = points3d(
    () => {
      const ph = phaseVal.value;
      const cut = cutoffVal.value;
      const pts = [];
      for (let i = 0; i < 24; i++) {
        const u = (ph * 0.22 + i / 24) % 1;
        const wx = -3.1 + u * 6.2;
        const lane = ((i % 6) - 2.5) * 0.55;
        const score = (i % 7) / 6;
        const dropped = wx > -0.6 && score < cut;
        const wy = dropped ? lane * 1.45 + (wx + 0.6) * 0.32 * (lane >= 0 ? 1 : -1) : lane * 0.72;
        const wz = dropped ? -0.4 - (wx + 0.6) * 0.35 : 0.25 * Math.sin(u * 6 + i);
        pts.push([wx, wy, wz]);
      }
      return pts;
    },
    {
      colorAt: (idx) => {
        const score = (idx % 7) / 6;
        return score < cutoffVal.value ? COSMOS.rose : idx % 3 === 0 ? COSMOS.gold : COSMOS.cyan;
      },
      radius: 5.5,
      glow: 11,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(floor, ...gateA, ...gateB, streamPts);
  return { view };
}

/** Shaded 3D rectangular prism for embedding matrices, shards, and tensor blocks. */
export function prism3d(x0, y0, z0, dx, dy, dz, fillColor, edgeColor, opacity = 0.68) {
  const opts = { resolution: [1, 1], color: fillColor, opacity, mesh: false, shaded: true };
  const edges = wireframeSlab3d(
    [x0 + dx * 0.5, y0 + dy * 0.5, z0 + dz * 0.5],
    dx * 0.5,
    dy * 0.5,
    dz * 0.5,
    { color: edgeColor, width: 2.2, glow: 6 },
  );
  return [
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z0 + dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + dx, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
    ...edges,
  ];
}

export {
  BPE_RULES,
  COSMOS,
  DOCUMENT_DRAWS,
  NEAR_DUPLICATE_TEXT,
  Node,
  PACKED_WORDS,
  PROXY_RESULTS,
  TOY_TOKEN_IDS,
  aura,
  boundarySnapshot,
  bpeReplay,
  circle,
  cinematic3d,
  corpus,
  curve3d,
  dedupSnapshot,
  documentSample,
  dot,
  extractionFixture,
  extractionSnapshot,
  filterState,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  independentObjective,
  inventoryFixture,
  jaccard,
  line,
  line3d,
  linear,
  linearGradient,
  markDecoration,
  metricReadout,
  mixtureSnapshot,
  morphEquation,
  orbitScene,
  packRecords,
  packedMask,
  parametricSurface,
  points3d,
  polyPath,
  preparationBranch,
  radialGradient,
  rect,
  releaseBatch,
  releaseEvaluation,
  restoreRecords,
  rule,
  share,
  shingles,
  surface,
  transferSnapshot,
  txt,
  wireframeSlab3d,
};
