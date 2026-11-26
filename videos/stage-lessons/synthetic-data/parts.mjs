// Shared math models, invariants, and 3D/vector cinema helpers for synthetic-data.
import { createHash } from 'node:crypto';
import {
  Node,
  circle,
  curve3d,
  dot,
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
  cosineSimilarity,
  orderAudit,
  tailOmission,
} from '../../films/synthetic-data/arithmetic.mjs';
import {
  ADMISSION_FIXTURES,
  ADMISSION_GATES,
  CANDIDATES,
  FIXTURE_PAGE_LIMIT,
  FIXTURE_RETRY_LIMIT,
  GENERATED_CASES,
  LOG_ANSWERS,
  NOVELTY_EXAMPLE,
  PARAPHRASE,
  RELEASE_SUITES,
  RESERVED_TASK,
  SEED_METADATA,
  TAIL_DRAWS,
  firstPageOnlyClient,
  noRetryClient,
} from '../../films/synthetic-data/fixtures.mjs';
import {
  admissionEvidence,
  checkSupportLog,
  passedGateCount,
  runSearchFixture,
  screenCandidates,
  screenTask,
  syntheticRelease,
  verifier,
} from '../../films/synthetic-data/model.mjs';
import { validateModel } from '../../films/synthetic-data/validation.mjs';
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
  morphEquation,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

// Precomputed model artifacts imported directly from films/synthetic-data/
export const FIRST_PAGE_RUN = runSearchFixture({ run: firstPageOnlyClient });
export const COMPLIANT_RUN = verifier(CANDIDATES[0]);
export const OVERSIZED_RUN = verifier(CANDIDATES[1]);
export const NO_RETRY_RUN = runSearchFixture({ run: noRetryClient });

export const SEARCH_PAGES = COMPLIANT_RUN.trace
  .map((event) => event.response)
  .filter((response) => response.status === 200);

export const COPY_SCREEN = screenTask(ADMISSION_FIXTURES.find((r) => r.id === 'C5').text);
export const PARAPHRASE_SCREEN = screenTask(PARAPHRASE);

export const SEED_VEC = Object.freeze([1, 0]);
export const NEAR_VEC = Object.freeze([0.99, 0.02]);
export const NOVEL_VEC = Object.freeze([0.25, 0.95]);
export const COS_NEAR = cosineSimilarity(SEED_VEC, NEAR_VEC);
export const COS_NOVEL = cosineSimilarity(SEED_VEC, NOVEL_VEC);

export const JUDGE_AUDIT = orderAudit(0.8, 0.7);
export const ADMISSION_RECEIPTS = screenCandidates([...ADMISSION_FIXTURES].reverse()).reverse();

export const NOVELTY_RUN_FIRST = screenCandidates(
  NOVELTY_EXAMPLE.proposals,
  NOVELTY_EXAMPLE.references,
  NOVELTY_EXAMPLE.cutoff,
);
export const NOVELTY_REPLAY_B = Object.freeze({
  ...NOVELTY_EXAMPLE.proposals[0],
  votes: [0.8, 0.7],
});
export const NOVELTY_RUN_REPLAY = screenCandidates(
  [NOVELTY_REPLAY_B, NOVELTY_EXAMPLE.proposals[1]],
  NOVELTY_EXAMPLE.references,
  NOVELTY_EXAMPLE.cutoff,
);

export const SUPPORT_CHECKS = LOG_ANSWERS.map(checkSupportLog);

export const RARE_MASS = 0.05;
export const COMMON_MASS = 1 - RARE_MASS;
export const TAIL_OMISSION_8 = tailOmission(RARE_MASS, TAIL_DRAWS.length);
export const FITTED_RARE_MASS =
  TAIL_DRAWS.filter((d) => d.uniform >= COMMON_MASS).length / TAIL_DRAWS.length;

export const SHARD_ORIGINAL_TEXT =
  JSON.stringify({ seed_id: SEED_METADATA.id, page_size: FIXTURE_PAGE_LIMIT }) + '\n';
export const SHARD_TAMPERED_TEXT =
  JSON.stringify({ seed_id: SEED_METADATA.id, page_size: 10000 }) + '\n';
export const SHARD_ORIGINAL_HASH = createHash('sha256').update(SHARD_ORIGINAL_TEXT).digest('hex');
export const SHARD_TAMPERED_HASH = createHash('sha256').update(SHARD_TAMPERED_TEXT).digest('hex');

export const RELEASE_RATES = Object.fromEntries(
  RELEASE_SUITES.map((s) => [s.id, s.count / s.total]),
);
export const RELEASE_FLOORS = Object.fromEntries(
  RELEASE_SUITES.map((s) => [s.id, s.limit / s.total]),
);
export const RELEASE_VERDICT = syntheticRelease(RELEASE_RATES, RELEASE_FLOORS);

export function maxCosine(vec, pool) {
  return Math.max(...pool.map((ref) => cosineSimilarity(vec, ref)));
}

/** Build-time mathematical verification of every spoken invariant in synthetic-data. */
export function verifySyntheticDataInvariants() {
  verifyInvariant(validateModel() === true, 'model validation must pass');
  verifyInvariant(
    FIRST_PAGE_RUN.result.items.length === 2 &&
      FIRST_PAGE_RUN.result.items[0] === 'Ada' &&
      FIRST_PAGE_RUN.result.items[1] === 'Grace',
    'firstPageOnlyClient stops after Ada and Grace',
  );
  verifyInvariant(
    COMPLIANT_RUN.accepted === true &&
      COMPLIANT_RUN.result.items.length === 3 &&
      COMPLIANT_RUN.result.items[2] === 'Linus' &&
      COMPLIANT_RUN.retryCount === 1,
    'compliant client retries once and collects Ada, Grace, Linus',
  );
  verifyInvariant(
    OVERSIZED_RUN.accepted === false && OVERSIZED_RUN.result.items.length === 0,
    'oversized client rejected with 0 names',
  );
  verifyInvariant(
    SEED_METADATA.id === 'S12' && FIXTURE_PAGE_LIMIT === 100 && FIXTURE_RETRY_LIMIT === 2,
    'S12 contract limits',
  );
  verifyInvariant(175 === 35 * 5 && 6 + 2 === 8 && 52445 > 175, 'Self-Instruct seed & pool counts');
  verifyInvariant(
    COPY_SCREEN.matches.length === 3 &&
      COPY_SCREEN.matches[0].span === 'fetch every page with the' &&
      PARAPHRASE_SCREEN.matches.length === 0,
    '5-word overlap matches C5 x3 and misses paraphrase',
  );
  verifyApprox(COS_NEAR, 0.999796, 1e-5, 'cosine near duplicate');
  verifyApprox(COS_NOVEL, 0.254493, 1e-4, 'cosine novel task');
  verifyApprox(JUDGE_AUDIT.remappedA, 0.3, 1e-12, 'remapped A probability');
  verifyApprox(JUDGE_AUDIT.averageA, 0.55, 1e-12, 'average A probability');
  verifyInvariant(JUDGE_AUDIT.stable === false, 'flipped judge is unstable');
  verifyInvariant(
    ADMISSION_FIXTURES.filter((r) => passedGateCount(r) === 5).length === 1 &&
      2 * 2 === 4 &&
      6 * 2 === 12 &&
      (12 - 4) / 12 === 2 / 3,
    'admission pipeline survivors and judge call savings',
  );
  verifyApprox(98 / 100, 0.98, 1e-12, 'overall agreement 98%');
  verifyApprox(2 / 2, 1.0, 1e-12, 'false admission rate 2/2');
  verifyInvariant(
    NOVELTY_RUN_FIRST[0].passedGates === 5 &&
      NOVELTY_RUN_FIRST[1].passedGates === 3 &&
      NOVELTY_RUN_REPLAY[0].passedGates === 4 &&
      NOVELTY_RUN_REPLAY[1].passedGates === 5,
    'pool novelty replay flips C from blocked to admitted',
  );
  verifyInvariant(
    SUPPORT_CHECKS[0].allowed === true &&
      SUPPORT_CHECKS[1].allowed === false &&
      LOG_ANSWERS[0].answer.split(' ').length === LOG_ANSWERS[1].answer.split(' ').length,
    'equal-length privacy preference checks',
  );
  verifyApprox(TAIL_OMISSION_8, 0.663420431289, 1e-9, '0.95^8 tail omission');
  verifyInvariant(FITTED_RARE_MASS === 0, 'fitted empirical rare mass collapses to 0');
  verifyInvariant(3 + 2 + 2 === 7 && 2 === 2, 'accumulated 7 IDs vs replaced 2 IDs');
  verifyInvariant(
    SHARD_ORIGINAL_HASH.length === 64 &&
      SHARD_TAMPERED_HASH.length === 64 &&
      SHARD_ORIGINAL_HASH !== SHARD_TAMPERED_HASH,
    'SHA-256 digests differ on tamper',
  );
  const rare = RELEASE_SUITES.find((s) => s.id === 'rare');
  verifyInvariant(
    12 === 8 + 4 &&
      rare.limit - rare.count === 2 &&
      RELEASE_VERDICT.release === false &&
      RELEASE_VERDICT.passes[0] === true &&
      RELEASE_VERDICT.passes[1] === false &&
      RELEASE_VERDICT.passes[2] === true,
    'release gates hold on rare slice gap of 2',
  );
}

export function safeDuration(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

export function remainDuration(c, cueId, maxDur = 1.6, endMargin = 0.55) {
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
  { fill = '#0d1426', radius = 10, glow = 6, opacity = 0.92, dash, width = 2.2 } = {},
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

export function box3d(x0, y0, z0, dx, dy, dz, fillColor, edgeColor, opacity = 0.76) {
  const opts = { resolution: [1, 1], color: fillColor, opacity, mesh: false, shaded: true };
  const edges = wireframeSlab3d(
    [x0 + dx * 0.5, y0 + dy * 0.5, z0 + dz * 0.5],
    dx * 0.5,
    dy * 0.5,
    dz * 0.5,
    { color: edgeColor, width: 2.0, glow: 5 },
  );
  return [
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z0 + dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + dx, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
    ...edges,
  ];
}

/**
 * Orbiting 3D Model-Collapse Distribution Surface across generations g = 0..10.
 * modeVal = 0: recursive replacement (variance shrinks sharply, rose rare tail vanishes).
 * modeVal = 1: real + synthetic accumulation (distribution stays wide, tail preserved).
 */
export function buildCollapseSurface3d(phaseVal, modeVal, { x = 430, y = 25 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.8,
    unit: 96,
    focus: [0, 0, 0.45],
  }).at(x, y);

  const floor = parametricSurface((u, v) => [-2.2 + u * 4.4, -2.0 + v * 4.0, 0], [0, 1], [0, 1], {
    resolution: [6, 5],
    color: '#111a30',
    mesh: '#334873',
    meshOpacity: 0.34,
    meshWidth: 0.7,
    opacity: 0.38,
    shaded: false,
  });

  // Replacement collapse surface (narrowing peak, fading rare tail)
  const collapseSurf = parametricSurface(
    (u, v) => {
      const gx = -2.0 + u * 4.0; // feature x
      const gen = v; // generation 0..1
      const sigma = 0.85 * Math.pow(0.42, gen);
      const amp = 0.85 + gen * 0.95;
      const tailAmp = 0.48 * Math.pow(0.06, gen);
      const z =
        amp * Math.exp(-((gx + 0.35) ** 2) / (2 * sigma * sigma)) +
        tailAmp * Math.exp(-((gx - 1.35) ** 2) / 0.14);
      return [gx, -1.8 + gen * 3.6, Math.min(2.1, z)];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [26, 18],
      colors: ['#162447', '#264a85', '#5ce1e6', '#a78bfa', '#ff6b8b'],
      mesh: '#ff9eb5',
      meshOpacity: 0.24,
      meshWidth: 0.65,
      opacity: 0.84,
      shaded: true,
    },
  );

  // Tail-threshold gold boundary line at x = 1.05 across generations
  const tailBoundary = line3d([1.0, -1.8, 0.05], [1.0, 1.8, 0.05], {
    color: COSMOS.gold,
    width: 3.0,
    glow: 7,
    onTop: true,
  });

  // Live ridge curves comparing Replacement (rose) vs Accumulation (emerald) tail mass
  const replaceTailCurve = curve3d(
    (t) => {
      const z = 0.52 * Math.pow(0.06, t) + 0.06;
      return [1.35, -1.8 + t * 3.6, z];
    },
    0,
    1,
    { color: COSMOS.rose, width: 3.8, glow: 10, samples: 32, onTop: true },
  );

  const accumulateTailCurve = curve3d(
    (t) => {
      const m = modeVal ? modeVal.value : 0;
      const z = (0.48 - 0.04 * t) * (0.35 + 0.65 * m) + 0.12;
      return [1.35, -1.8 + t * 3.6, z];
    },
    0,
    1,
    { color: COSMOS.emerald, width: 3.8, glow: 10, samples: 32, onTop: true },
  );

  // Drifting sample particles across generations
  const particles = points3d(
    () => {
      const p = phaseVal.value;
      const m = modeVal ? modeVal.value : 0;
      const pts = [];
      for (let i = 0; i < 12; i++) {
        const gen = (p * 0.14 + i / 12) % 1;
        const spread = m > 0.5 ? 0.78 : 0.82 * Math.pow(0.42, gen);
        const angle = i * 2.1 + p * 0.4;
        const gx = -0.35 + Math.sin(angle) * spread * 1.45;
        const gy = -1.8 + gen * 3.6;
        const gz =
          (0.85 + gen * (m > 0.5 ? 0.15 : 0.9)) *
            Math.exp(-((gx + 0.35) ** 2) / (2 * spread * spread)) +
          0.12;
        pts.push([gx, gy, Math.min(2.15, gz)]);
      }
      return pts;
    },
    {
      colorAt: (i) => (i % 4 === 0 ? COSMOS.gold : COSMOS.cyan),
      radius: 5.5,
      glow: 10,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(floor, collapseSurf, tailBoundary, replaceTailCurve, accumulateTailCurve, particles);
  return view;
}

/**
 * Orbiting 3D Semantic Embedding Quadrant Sphere + Cosine Similarity Cone.
 * Shows seed [1,0], cosine review cone, near copy C3 inside cone, and novel C1 outside cone.
 */
export function buildEmbeddingCone3d(phaseVal, { x = 445, y = 20 } = {}) {
  const view = cinematic3d({
    theta: -0.72,
    phi: 1.08,
    distance: 14.6,
    unit: 106,
    focus: [0.3, 0.2, 0.2],
  }).at(x, y);

  const floor = parametricSurface((u, v) => [-0.4 + u * 2.6, -0.4 + v * 2.6, 0], [0, 1], [0, 1], {
    resolution: [5, 5],
    color: '#111a30',
    mesh: '#2d416a',
    meshOpacity: 0.36,
    meshWidth: 0.75,
    opacity: 0.36,
    shaded: false,
  });

  // Unit quarter-dome shell representing normalized embedding sphere
  const dome = parametricSurface(
    (u, v) => {
      const az = u * Math.PI * 0.5;
      const el = v * Math.PI * 0.46;
      const r = 1.9;
      return [r * Math.cos(el) * Math.cos(az), r * Math.cos(el) * Math.sin(az), r * Math.sin(el)];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [18, 12],
      color: '#182b52',
      mesh: COSMOS.blue,
      meshOpacity: 0.24,
      meshWidth: 0.65,
      opacity: 0.28,
      shaded: true,
    },
  );

  // Seed vector [1,0] (blue), near duplicate [0.99,0.02] (rose), novel [0.25,0.95] (emerald)
  const vSeed = line3d([0, 0, 0], [1.9, 0, 0], {
    color: COSMOS.blue,
    width: 4.0,
    glow: 9,
    onTop: true,
  });
  const vNear = line3d([0, 0, 0], [1.88, 0.04, 0.14], {
    color: COSMOS.rose,
    width: 3.6,
    glow: 9,
    onTop: true,
  });
  const vNovel = line3d([0, 0, 0], [0.48, 1.82, 0.24], {
    color: COSMOS.emerald,
    width: 4.0,
    glow: 10,
    onTop: true,
  });

  // Cosine threshold cone ring around [1,0] (half-angle ~18 deg for cos=0.95)
  const coneRing = curve3d(
    (t) => {
      const a = t * Math.PI * 2;
      const r = 0.62;
      return [1.78, Math.cos(a) * r, Math.sin(a) * r * 0.85 + 0.05];
    },
    0,
    1,
    { color: COSMOS.gold, width: 2.8, glow: 8, samples: 36, onTop: true },
  );

  // Geodesic arc from seed to novel vector
  const arcNovel = curve3d(
    (t) => {
      const ang = t * Math.atan2(0.95, 0.25);
      return [1.9 * Math.cos(ang), 1.9 * Math.sin(ang), 0.24 * Math.sin(t * Math.PI)];
    },
    0,
    1,
    { color: COSMOS.cyan, width: 3.2, glow: 8, samples: 28, onTop: true },
  );

  const tips = points3d(
    () => {
      const pulse = 0.06 * Math.sin(phaseVal.value * 2.4);
      return [
        [1.9, 0, 0],
        [1.88, 0.04, 0.14 + pulse],
        [0.48, 1.82, 0.24 - pulse],
      ];
    },
    {
      colorAt: (i) => [COSMOS.blue, COSMOS.rose, COSMOS.emerald][i],
      radius: 7.5,
      glow: 12,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(floor, dome, vSeed, vNear, vNovel, coneRing, arcNovel, tips);
  return view;
}

/**
 * Orbiting 3D Prompt-Evolution / Self-Instruct Branching Tree radiating from Seed S12.
 */
export function buildExpansionTree3d(phaseVal, { x = 445, y = 25 } = {}) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 1.06,
    distance: 15.2,
    unit: 100,
    focus: [0, 0, 0.55],
  }).at(x, y);

  const floor = parametricSurface((u, v) => [-2.1 + u * 4.2, -1.8 + v * 3.6, 0], [0, 1], [0, 1], {
    resolution: [5, 5],
    color: '#111a30',
    mesh: '#2b406b',
    meshOpacity: 0.34,
    meshWidth: 0.7,
    opacity: 0.34,
    shaded: false,
  });

  const root = [0, 0, 0.25];
  const branches = [
    { tip: [-1.45, -0.9, 1.35], col: COSMOS.cyan },
    { tip: [0.05, -1.25, 1.55], col: COSMOS.emerald },
    { tip: [1.45, -0.6, 1.25], col: COSMOS.rose },
    { tip: [-1.25, 1.05, 1.65], col: COSMOS.gold },
    { tip: [1.15, 1.1, 1.75], col: COSMOS.violet },
  ];

  const curves = branches.map((b, i) =>
    curve3d(
      (t) => [
        root[0] + (b.tip[0] - root[0]) * t,
        root[1] + (b.tip[1] - root[1]) * t,
        root[2] + (b.tip[2] - root[2]) * Math.pow(t, 0.75) + 0.14 * Math.sin(t * Math.PI + i),
      ],
      0,
      1,
      { color: b.col, width: 3.2, glow: 8, samples: 24, onTop: true },
    ),
  );

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const pts = [root];
      branches.forEach((b, i) => {
        pts.push(b.tip);
        const f = (p * 0.28 + i * 0.2) % 1;
        pts.push([
          root[0] + (b.tip[0] - root[0]) * f,
          root[1] + (b.tip[1] - root[1]) * f,
          root[2] + (b.tip[2] - root[2]) * Math.pow(f, 0.75) + 0.14 * Math.sin(f * Math.PI + i),
        ]);
      });
      return pts;
    },
    {
      colorAt: (idx) => {
        if (idx === 0) return COSMOS.blue;
        const bi = Math.floor((idx - 1) / 2);
        return idx % 2 === 1 ? branches[bi].col : COSMOS.gold;
      },
      radius: 6.2,
      glow: 11,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(floor, ...curves, photons);
  return view;
}

export {
  ADMISSION_FIXTURES,
  ADMISSION_GATES,
  CANDIDATES,
  COSMOS,
  FIXTURE_PAGE_LIMIT,
  FIXTURE_RETRY_LIMIT,
  GENERATED_CASES,
  LOG_ANSWERS,
  NOVELTY_EXAMPLE,
  Node,
  PARAPHRASE,
  RELEASE_SUITES,
  RESERVED_TASK,
  SEED_METADATA,
  TAIL_DRAWS,
  admissionEvidence,
  aura,
  checkSupportLog,
  circle,
  cinematic3d,
  cosineSimilarity,
  curve3d,
  dot,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  line3d,
  linear,
  linearGradient,
  metricReadout,
  morphEquation,
  orbitScene,
  orderAudit,
  parametricSurface,
  passedGateCount,
  points3d,
  polyPath,
  radialGradient,
  rect,
  rule,
  runSearchFixture,
  screenCandidates,
  screenTask,
  surface,
  syntheticRelease,
  tailOmission,
  txt,
  verifier,
  wireframeSlab3d,
};
