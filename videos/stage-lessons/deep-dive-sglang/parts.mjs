// Shared math models, build-time invariants, and 3D hardware cinema rigs for Deep Dive - SGLang.
import { curve3d, gridPlane3d, group, line, line3d, linear, points3d, rect } from 'vizmatic/stage';
import { clamp, common, sum } from '../../films/deep-dive-sglang/arithmetic.mjs';
import {
  a as RADIX_A,
  draft as SPEC_DRAFT,
  other as RADIX_OTHER,
  payload as KV_PAYLOAD,
  target as SPEC_TARGET,
  transferMs as KV_TRANSFER_MS,
  z as RADIX_Z,
} from '../../films/deep-dive-sglang/fixtures.mjs';
import {
  budgetStep,
  grammarState,
  handoffState,
  insert,
  kvHandoff,
  prefixReuse,
  speculativeState,
  treePaths,
} from '../../films/deep-dive-sglang/model.mjs';
import { validateModel } from '../../films/deep-dive-sglang/validation.mjs';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic as kitGuardedDynamic,
  heroTitle,
  metricReadout,
  orbitScene,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  COSMOS,
  KV_PAYLOAD,
  KV_TRANSFER_MS,
  RADIX_A,
  RADIX_OTHER,
  RADIX_Z,
  SPEC_DRAFT,
  SPEC_TARGET,
  aura,
  budgetStep,
  cinematic3d,
  clamp,
  common,
  glowDot,
  glowTex,
  glowingTrail,
  grammarState,
  group,
  handoffState,
  heroTitle,
  insert,
  kvHandoff,
  line,
  metricReadout,
  orbitScene,
  prefixReuse,
  rect,
  speculativeState,
  sum,
  treePaths,
  txt,
  wireframeSlab3d,
};

export const ROLE = Object.freeze({
  radix: COSMOS.cyan,
  prefill: COSMOS.blue,
  decode: COSMOS.emerald,
  grammar: COSMOS.violet,
  warn: COSMOS.gold,
  fail: COSMOS.rose,
  spec: COSMOS.amber,
  dim: '#4a5572',
});

export const BUDGET_STEP_0 = budgetStep({ decode: 1, unmatched: 9, budget: 6 });
export const BUDGET_STEP_1 = budgetStep({ decode: 1, unmatched: 4, budget: 6 });
export const NS_TOKENS = Object.freeze(['A', 'B', 'C', 'D', 'E']);
export const NS_SAME = prefixReuse(NS_TOKENS, NS_TOKENS, 'A', 'A', 4);
export const NS_DIFF = prefixReuse(NS_TOKENS, NS_TOKENS, 'A', 'B', 4);
export const GRAMMAR_RAW = grammarState(0, 1);
export const FRESH_TOKENS = Object.freeze(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
export const FRESH_SAME_NS = prefixReuse(FRESH_TOKENS, FRESH_TOKENS, 'A', 'A', 4);
export const FRESH_DIFF_NS = prefixReuse(FRESH_TOKENS, FRESH_TOKENS, 'A', 'B', 4);
export const DRILL_WARM = Object.freeze([10, 20, 30, 40]);
export const DRILL_EDITED = Object.freeze([99, 20, 30, 40]);
export const GOODPUT_10 = Object.freeze({
  offeredRate: 10,
  windowSec: 10,
  attempts: 100,
  qualified: 92,
  goodput: 9.2,
  fraction: 0.92,
});
export const GOODPUT_12 = Object.freeze({
  offeredRate: 12,
  windowSec: 10,
  attempts: 120,
  qualified: 105,
  goodput: 10.5,
  fraction: 0.875,
});

export function verifySglangInvariants() {
  validateModel();

  // Token clocks: 0 -> 240 ms TTFT, 280 ms (+40 ms ITL), 350 ms (+70 ms ITL)
  verifyInvariant(280 - 240 === 40 && 350 - 280 === 70, 'ITL gaps 40 ms and 70 ms');

  // Mixed budget: step 0 (1+5=6, 4 left), step 1 (1+4=5, 0 left)
  verifyInvariant(
    BUDGET_STEP_0.prefill === 5 && BUDGET_STEP_0.spent === 6 && BUDGET_STEP_0.remaining === 4,
    'mixed budget step 0',
  );
  verifyInvariant(
    BUDGET_STEP_1.prefill === 4 && BUDGET_STEP_1.spent === 5 && BUDGET_STEP_1.remaining === 0,
    'mixed budget step 1',
  );
  verifyInvariant(Math.ceil(5 / 4) === 2, '5 prompt tokens need 2 four-token pages');

  // Radix tree prefix splits and common lengths
  verifyInvariant(common(RADIX_A, RADIX_Z) === 4, 'radix common(A, Z) === 4');
  verifyInvariant(common(RADIX_A, RADIX_OTHER) === 1, 'radix common(A, other) === 1');
  const tree = { terminal: false, edges: [] };
  insert(tree, RADIX_A);
  insert(tree, RADIX_Z);
  verifyInvariant(tree.edges[0].words.length === 4, 'radix split edge has 4 words');
  verifyInvariant(treePaths(tree).length === 2, 'radix tree preserves both paths');

  // Namespace isolation and page alignment
  verifyInvariant(NS_SAME.logical === 5 && NS_SAME.reusable === 4, 'same namespace reuses 4');
  verifyInvariant(NS_DIFF.reusable === 0, 'different namespace reuses 0');

  // Grammar masking and renormalization
  verifyApprox(GRAMMAR_RAW.mass, 0.95, 1e-12, 'grammar allowed mass 0.95');
  verifyApprox(GRAMMAR_RAW.probabilities[0], 0.45 / 0.95, 1e-12, 'bug normalized prob ~0.474');
  verifyApprox(sum(GRAMMAR_RAW.probabilities), 1, 1e-12, 'grammar probabilities sum to 1');

  // Speculative decoding and economics
  verifyInvariant(common(SPEC_DRAFT, SPEC_TARGET) === 5, 'speculate 5 agreed draft tokens');
  verifyInvariant(SPEC_DRAFT[5] === 'sea' && SPEC_TARGET[5] === 'lake', 'mismatch at pos 6');
  verifyInvariant(3 + 9 + 1 === 13, 'draft cycle 13 ms');
  verifyInvariant(6 * 4 === 24, '6 ordinary target steps 24 ms');

  // Disaggregated KV payload and transfer bound
  const oneHeadBytes = 4096 * 128 * 2;
  verifyInvariant(oneHeadBytes === 1048576, 'one head K tensor = 1 MiB');
  verifyInvariant(2 * 32 * 8 * oneHeadBytes === KV_PAYLOAD, 'KV_PAYLOAD exact match');
  verifyInvariant(KV_PAYLOAD === 536870912, 'KV_PAYLOAD === 512 MiB');
  verifyApprox(KV_TRANSFER_MS, 21.47483648, 1e-6, 'KV transfer bound ~21.47 ms');
  verifyInvariant(KV_TRANSFER_MS > 20, 'payload alone exceeds 2x 10 ms budget');
  verifyInvariant(10 * 512 === 5120, '10 x 512 MiB = 5 GiB');

  // Transfer failure & handoff guards
  const partialHandoff = kvHandoff({
    reserved: 512,
    received: 384,
    currentAttempt: 8,
    readyAttempt: null,
    readerReady: false,
  });
  verifyInvariant(partialHandoff.missing === 128 && !partialHandoff.canDecode, '128 MiB missing');
  const staleEvent = kvHandoff({
    reserved: 512,
    received: 512,
    currentAttempt: 8,
    readyAttempt: 7,
    readerReady: true,
  });
  verifyInvariant(!staleEvent.canDecode, 'stale attempt 7 blocked');
  const goodHandoff = kvHandoff({
    reserved: 512,
    received: 512,
    currentAttempt: 8,
    readyAttempt: 8,
    readerReady: true,
  });
  verifyInvariant(goodHandoff.canDecode, 'attempt 8 compatible L2 opens decode');
  const wrongLayout = kvHandoff({
    reserved: 512,
    received: 512,
    currentAttempt: 8,
    readyAttempt: 8,
    readerReady: true,
    layout: false,
  });
  verifyInvariant(!wrongLayout.canDecode, 'incompatible layout L1 holds decode');

  // Goodput gate
  verifyApprox(GOODPUT_10.qualified / GOODPUT_10.windowSec, 9.2, 1e-12, '10/s goodput 9.2');
  verifyApprox(GOODPUT_10.qualified / GOODPUT_10.attempts, 0.92, 1e-12, '10/s fraction 92%');
  verifyApprox(GOODPUT_12.qualified / GOODPUT_12.windowSec, 10.5, 1e-12, '12/s goodput 10.5');
  verifyApprox(GOODPUT_12.qualified / GOODPUT_12.attempts, 0.875, 1e-12, '12/s fraction 87.5%');

  // Failure drill
  verifyInvariant(
    prefixReuse(DRILL_WARM, DRILL_WARM, 'A', 'A').reusable === 4 &&
      prefixReuse(DRILL_WARM, DRILL_EDITED, 'A', 'A').reusable === 0 &&
      prefixReuse([], DRILL_WARM, 'A', 'A').reusable === 0,
    'failure drill prefix reuse invariants',
  );

  // Fresh handoff
  verifyInvariant(FRESH_SAME_NS.reusable === 4 && FRESH_DIFF_NS.reusable === 0, 'fresh ns reuse');
  verifyInvariant(96 - 64 === 32, 'fresh transfer 32 MiB missing');
  verifyInvariant(
    !kvHandoff({
      reserved: 96,
      received: 96,
      currentAttempt: 2,
      readyAttempt: 1,
      readerReady: true,
    }).canDecode &&
      kvHandoff({
        reserved: 96,
        received: 96,
        currentAttempt: 2,
        readyAttempt: 2,
        readerReady: true,
      }).canDecode,
    'fresh handoff replay attempt 1 vs attempt 2',
  );
}

export function guardedDynamic(vis, renderFn, threshold = 0.02) {
  const getter = typeof vis === 'number' ? () => vis : vis;
  return kitGuardedDynamic(getter, renderFn, threshold);
}

export function glassCell(x, y, w, h, strokeColor = COSMOS.cyan, opts = {}) {
  const { fill = '#0d1424', strokeWidth = 2.4, radius = 12, glow = 6, opacity = 1 } = opts;
  const box = rect(w, h, { fill, stroke: strokeColor, width: strokeWidth, radius }).at(x, y);
  const g = glow > 0 ? box.glow(glow, strokeColor) : box;
  return opacity < 1 ? g.opacity(opacity) : g;
}

export function remainDuration(c, cueId, want = 0.35, after = false) {
  const ref = typeof cueId === 'string' ? c.cue(cueId) : null;
  const start = ref ? (after ? ref.end : ref.start) : cueId;
  return Math.max(0.12, Math.min(want, c.end - start - 0.45));
}

export function runPhase(s, c, phaseVal, cycles = 12) {
  const span = Math.max(0.8, c.end - c.start - 0.5);
  c.at(0.08, () => {
    s.play(phaseVal.to(cycles, { duration: span, ease: linear }));
  });
}

export function wireStepCues(s, c, stepVal, cueTargets) {
  cueTargets.forEach(([cueId, target, after = false]) => {
    const fn = () =>
      s.play(stepVal.to(target, { duration: remainDuration(c, cueId, 0.24, after) }));
    if (after) c.after(cueId, fn);
    else c.on(cueId, fn);
  });
}

/**
 * 1. Orbiting 3D Glowing RadixAttention Prefix Tree with dynamic edge splitting,
 * KV-page reuse beams, and LRU lock / eviction states.
 */
export function buildRadixTree3d(stepVal, phaseVal, { x = 475, y = 25, unit = 94 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 0.96,
    distance: 15.2,
    unit,
    focus: [0, 0, 0.9],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-3.2, 3.2],
      z: 0,
      step: 0.85,
      color: '#1f3254',
      opacity: 0.35,
    }),
  );

  // Root slab
  const rootPos = [-2.2, 0, 1.3];
  view.add(
    ...wireframeSlab3d(rootPos, 0.42, 0.42, 0.32, { color: COSMOS.gold, width: 2.8, glow: 10 }),
  );

  // 4 shared KV-page slabs along the common prefix edge (KV 12..15)
  const kvPositions = [
    [-0.95, 0, 1.3],
    [-0.25, 0, 1.3],
    [0.45, 0, 1.3],
    [1.15, 0, 1.3],
  ];
  kvPositions.forEach((pos) => {
    view.add(
      ...wireframeSlab3d(pos, 0.26, 0.38, 0.28, {
        color: ROLE.radix,
        width: 2.3,
        glow: 9,
      }),
    );
  });

  // Trunk beam from Root through shared prefix
  view.add(
    line3d(rootPos, [1.15, 0, 1.3], { color: ROLE.radix, width: 3.4, glow: 10, blend: 'screen' }),
  );

  // Two split suffix branches: existing blue ("lake at dawn") and new rose ("old oak tree")
  const branchA = [2.45, -1.35, 1.7];
  const branchB = [2.45, 1.35, 0.85];
  view.add(
    ...wireframeSlab3d(branchA, 0.46, 0.34, 0.26, { color: ROLE.prefill, width: 2.2, glow: 8 }),
    ...wireframeSlab3d(
      () => (Math.round(stepVal.value) >= 2 ? branchB : [2.45, 1.35, 0.35]),
      0.46,
      0.34,
      0.26,
      { color: ROLE.fail, width: 2.2, glow: 8 },
    ),
    curve3d(
      (t) => [
        1.15 + (branchA[0] - 1.15) * t,
        branchA[1] * t * t,
        1.3 + (branchA[2] - 1.3) * t + Math.sin(t * Math.PI) * 0.25,
      ],
      { steps: 20, color: ROLE.prefill, width: 2.6, glow: 8, blend: 'screen' },
    ),
    curve3d(
      (t) => {
        const split = Math.round(stepVal.value) >= 2 ? 1 : 0.25;
        return [
          1.15 + (branchB[0] - 1.15) * t * split,
          branchB[1] * t * t * split,
          1.3 + (branchB[2] - 1.3) * t * split - Math.sin(t * Math.PI) * 0.2 * split,
        ];
      },
      { steps: 20, color: ROLE.fail, width: 2.6, glow: 8, blend: 'screen' },
    ),
  );

  // Flowing KV-page reuse photons
  view.add(
    points3d(
      () => {
        const u = (phaseVal.value * 0.55) % 1;
        const st = Math.round(stepVal.value);
        const pts = [];
        for (let k = 0; k < 4; k++) {
          const t = (u + k * 0.25) % 1;
          pts.push([-2.2 + 3.35 * t, Math.sin(t * Math.PI * 2) * 0.08, 1.3]);
        }
        if (st >= 2) {
          const tb = (u * 1.2) % 1;
          pts.push([1.15 + 1.3 * tb, 1.35 * tb * tb, 1.3 - 0.45 * tb]);
        }
        return pts;
      },
      { size: 9, color: COSMOS.gold, glow: 14, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}

/**
 * 2. Orbiting 3D Continuous-Batching & Overlap Scheduler Stream Engine.
 * Upper plane: Host CPU batch planning; Lower plane: GPU forward execution streams.
 */
export function buildOverlapStream3d(stepVal, phaseVal, { x = 475, y = 25, unit = 94 } = {}) {
  const view = cinematic3d({
    theta: -0.72,
    phi: 1.0,
    distance: 15.2,
    unit,
    focus: [0, 0, 0.9],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-2.8, 2.8],
      z: 0,
      step: 0.85,
      color: '#1f3254',
      opacity: 0.34,
    }),
  );

  // Host lane (z = 1.95) and GPU lane (z = 0.55) rails
  view.add(
    line3d([-2.8, -0.7, 1.95], [2.8, -0.7, 1.95], { color: ROLE.warn, width: 2.2, opacity: 0.6 }),
    line3d([-2.8, 0.7, 0.55], [2.8, 0.7, 0.55], { color: ROLE.radix, width: 2.6, opacity: 0.7 }),
  );

  // Batch A host & GPU slabs
  view.add(
    ...wireframeSlab3d([-2.1, -0.7, 1.95], 0.42, 0.36, 0.22, {
      color: ROLE.prefill,
      width: 2.4,
      glow: 8,
    }),
    ...wireframeSlab3d([-0.75, 0.7, 0.55], 0.95, 0.48, 0.3, {
      color: ROLE.prefill,
      width: 2.6,
      glow: 9,
    }),
  );

  // Batch B host slab shifts left to overlap GPU A when step >= 2
  view.add(
    ...wireframeSlab3d(
      () => (Math.round(stepVal.value) >= 2 ? [-1.05, -0.7, 1.95] : [0.75, -0.7, 1.95]),
      0.42,
      0.36,
      0.22,
      { color: ROLE.fail, width: 2.6, glow: 10 },
    ),
    ...wireframeSlab3d(
      () => (Math.round(stepVal.value) >= 2 ? [1.2, 0.7, 0.55] : [1.85, 0.7, 0.55]),
      0.95,
      0.48,
      0.3,
      { color: ROLE.decode, width: 2.6, glow: 10 },
    ),
  );

  // Curved metadata handoff arc from Host B to GPU B
  view.add(
    curve3d(
      (t) => {
        const ov = Math.round(stepVal.value) >= 2;
        const x0 = ov ? -1.05 : 0.75;
        const x1 = ov ? 0.35 : 0.95;
        return [x0 + (x1 - x0) * t, -0.7 + 1.4 * t, 1.95 - 1.4 * t + Math.sin(t * Math.PI) * 0.35];
      },
      { steps: 20, color: COSMOS.gold, width: 2.8, glow: 10, blend: 'screen' },
    ),
    points3d(
      () => {
        const u = (phaseVal.value * 0.65) % 1;
        const ov = Math.round(stepVal.value) >= 2;
        const x0 = ov ? -1.05 : 0.75;
        const x1 = ov ? 0.35 : 0.95;
        return [
          [x0 + (x1 - x0) * u, -0.7 + 1.4 * u, 1.95 - 1.4 * u + Math.sin(u * Math.PI) * 0.35],
          [-2.6 + 5.2 * ((u + 0.4) % 1), 0.7, 0.55],
        ];
      },
      { size: 9, color: COSMOS.gold, glow: 14, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}

/**
 * 3. Orbiting 3D Compressed FSM / Jump-Forward Constrained Decoding Graph.
 */
export function buildGrammarFsm3d(stepVal, phaseVal, { x = 475, y = 25, unit = 94 } = {}) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 0.98,
    distance: 15.2,
    unit,
    focus: [0, 0, 0.95],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-3.0, 3.0],
      z: 0,
      step: 0.85,
      color: '#232048',
      opacity: 0.36,
    }),
  );

  // Forced prefix super-edge chain nodes
  const chainXs = [-2.4, -1.5, -0.6, 0.3];
  chainXs.forEach((cx, idx) => {
    view.add(
      ...wireframeSlab3d([cx, 0, 1.15], 0.25, 0.25, 0.25, {
        color: idx === 3 ? COSMOS.gold : ROLE.radix,
        width: 2.3,
        glow: 8,
      }),
    );
  });
  view.add(
    line3d([-2.4, 0, 1.15], [0.3, 0, 1.15], {
      color: ROLE.radix,
      width: 3.4,
      glow: 10,
      blend: 'screen',
    }),
  );

  // Branching candidate nodes: 3 legal (bug, feature, question) + 1 masked (42)
  const branches = [
    { pos: [2.1, -1.55, 1.75], color: ROLE.decode, legal: true },
    { pos: [2.25, -0.5, 1.3], color: ROLE.prefill, legal: true },
    { pos: [2.1, 0.55, 1.0], color: ROLE.grammar, legal: true },
    { pos: [1.95, 1.65, 0.45], color: ROLE.fail, legal: false },
  ];

  branches.forEach((b) => {
    view.add(
      ...wireframeSlab3d(b.pos, 0.34, 0.28, 0.24, {
        color: b.color,
        width: b.legal ? 2.4 : 1.6,
        glow: b.legal ? 9 : 4,
      }),
      curve3d(
        (t) => [
          0.3 + (b.pos[0] - 0.3) * t,
          b.pos[1] * t,
          1.15 + (b.pos[2] - 1.15) * t + Math.sin(t * Math.PI) * 0.22,
        ],
        {
          steps: 18,
          color: b.color,
          width: b.legal ? 2.8 : 1.5,
          glow: b.legal ? 9 : 3,
          blend: 'screen',
        },
      ),
    );
  });

  // Jump-forward arc leaping over singular chain + legal branch photons
  view.add(
    curve3d((t) => [-2.4 + 2.7 * t, 0, 1.15 + Math.sin(t * Math.PI) * 1.1], {
      steps: 24,
      color: COSMOS.gold,
      width: 3.0,
      glow: 11,
      blend: 'screen',
    }),
    points3d(
      () => {
        const u = (phaseVal.value * 0.6) % 1;
        const st = Math.round(stepVal.value);
        const targetB = branches[st % 3].pos;
        return [
          [-2.4 + 2.7 * u, 0, 1.15 + Math.sin(u * Math.PI) * 1.1],
          [
            0.3 + (targetB[0] - 0.3) * u,
            targetB[1] * u,
            1.15 + (targetB[2] - 1.15) * u + Math.sin(u * Math.PI) * 0.22,
          ],
        ];
      },
      { size: 9, color: COSMOS.gold, glow: 14, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}

/**
 * 4. Orbiting 3D Prefill-Decode Disaggregation & KV Transfer Fabric.
 */
export function buildPdFabric3d(stepVal, phaseVal, { x = 475, y = 25, unit = 92 } = {}) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 0.96,
    distance: 15.4,
    unit,
    focus: [0, 0, 0.95],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.4, 3.4],
      y: [-2.8, 2.8],
      z: 0,
      step: 0.85,
      color: '#1e3050',
      opacity: 0.34,
    }),
  );

  // Left: Prefill GPU stack (4 stacked K/V layer slabs)
  for (let l = 0; l < 4; l++) {
    const z = 0.4 + l * 0.46;
    view.add(
      ...wireframeSlab3d([-2.0, 0, z], 0.72, 0.95, 0.14, {
        color: l % 2 === 0 ? ROLE.prefill : ROLE.radix,
        width: 2.2,
        glow: 7,
      }),
    );
  }

  // Right: Decode GPU stack (4 destination KV slabs)
  for (let l = 0; l < 4; l++) {
    const z = 0.4 + l * 0.46;
    view.add(
      ...wireframeSlab3d([2.0, 0, z], 0.72, 0.95, 0.14, {
        color: l % 2 === 0 ? ROLE.decode : COSMOS.gold,
        width: 2.2,
        glow: 8,
      }),
    );
  }

  // 3 parallel RDMA / Mooncake transfer beams
  [-0.55, 0, 0.55].forEach((yy, idx) => {
    view.add(
      curve3d((t) => [-1.25 + 2.5 * t, yy, 1.1 + Math.sin(t * Math.PI) * (0.45 + idx * 0.1)], {
        steps: 20,
        color: idx === 1 ? COSMOS.gold : ROLE.radix,
        width: 2.6,
        glow: 9,
        blend: 'screen',
      }),
    );
  });

  // Streaming KV payload packets
  view.add(
    points3d(
      () => {
        const u = (phaseVal.value * 0.7) % 1;
        const pts = [];
        [-0.55, 0, 0.55].forEach((yy, idx) => {
          const t = (u + idx * 0.33) % 1;
          pts.push([-1.25 + 2.5 * t, yy, 1.1 + Math.sin(t * Math.PI) * (0.45 + idx * 0.1)]);
        });
        return pts;
      },
      { size: 9, color: COSMOS.gold, glow: 14, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}

/**
 * 5. Orbiting 3D Speculative Draft & Parallel Target Verification Rig.
 */
export function buildSpeculativeTree3d(stepVal, phaseVal, { x = 475, y = 25, unit = 92 } = {}) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 0.98,
    distance: 15.2,
    unit,
    focus: [0, 0, 0.95],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-2.8, 2.8],
      z: 0,
      step: 0.85,
      color: '#1f3050',
      opacity: 0.34,
    }),
  );

  // Top draft slabs (6 visible slots: 5 accepted emerald/cyan + 1 mismatch rose)
  for (let i = 0; i < 6; i++) {
    const cx = -2.25 + i * 0.9;
    const isMismatch = i === 5;
    view.add(
      ...wireframeSlab3d([cx, -0.6, 1.9], 0.3, 0.32, 0.2, {
        color: isMismatch ? ROLE.fail : ROLE.radix,
        width: 2.2,
        glow: 8,
      }),
      line3d([cx, -0.6, 1.7], [cx, 0.55, 0.82], {
        color: isMismatch ? ROLE.fail : ROLE.decode,
        width: 2.2,
        glow: 7,
        blend: 'screen',
      }),
    );
  }

  // Bottom batched target verifier slab
  view.add(
    ...wireframeSlab3d([0, 0.55, 0.52], 2.75, 0.62, 0.28, {
      color: ROLE.prefill,
      width: 2.6,
      glow: 9,
    }),
  );

  // Parallel verification pulse photons
  view.add(
    points3d(
      () => {
        const u = (phaseVal.value * 0.7) % 1;
        const st = Math.round(stepVal.value);
        const pts = [];
        const count = st >= 1 ? 6 : 3;
        for (let i = 0; i < count; i++) {
          const cx = -2.25 + i * 0.9;
          pts.push([cx, -0.6 + 1.15 * u, 1.7 - 0.88 * u]);
        }
        return pts;
      },
      { size: 8, color: COSMOS.gold, glow: 13, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}
