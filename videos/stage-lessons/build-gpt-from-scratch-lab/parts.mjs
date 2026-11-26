// Shared math models, invariants, and 3D/vector cinema helpers for build-gpt-from-scratch-lab.
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
  adamFork,
  bytePieceFixture,
  categoricalFixture,
  corpusCounts,
  decoderMiniature,
  dot as vecDot,
  localProbe,
  lossStep,
  maskedPredictionFixture,
  normComparison,
  samplerWindow,
  softmax,
  tiedOutput,
} from '../../films/build-gpt-from-scratch-lab/arithmetic.mjs';
import {
  ATTENTION_CPU_FIXTURE,
  logged,
  pieces,
} from '../../films/build-gpt-from-scratch-lab/fixtures.mjs';
import { validateModel } from '../../films/build-gpt-from-scratch-lab/model.mjs';
import { prompt } from '../../films/build-gpt-from-scratch-lab/prompt.mjs';
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

export const CORPUS = corpusCounts();
export const BYTE_EMOJI = bytePieceFixture();
export const TIED_FULL = tiedOutput(1);
export const TIED_DROPPED = tiedOutput(0);
export const MINI_CAUSAL = decoderMiniature({ causal: true });
export const MINI_CAUSAL_COPY = decoderMiniature({ causal: true, fourth: '·sir' });
export const MINI_OPEN = decoderMiniature({ causal: false });
export const MINI_OPEN_COPY = decoderMiniature({ causal: false, fourth: '·sir' });
export const LOSS_BEFORE = lossStep(0);
export const LOSS_AFTER = lossStep(1);
export const CAT_DRAW = categoricalFixture(0.5, 0.9);
export const ADAM_FORK = adamFork();
export const NORM_CMP = normComparison();
export const PROBE_ORIG = localProbe(9);
export const PROBE_CHANGED = localProbe(14);
export const SAMPLER_20 = samplerWindow(20, 4, 15);
export const SAMPLER_49 = samplerWindow(49, 48, 0);

// Exact head-0 causal attention weights computed from ATTENTION_CPU_FIXTURE.
export const CPU_HEAD0_WEIGHTS = (() => {
  const qHead = ATTENTION_CPU_FIXTURE.q[0];
  const kHead = ATTENTION_CPU_FIXTURE.k[0];
  const scale = 1 / Math.sqrt(qHead[0].length);
  return qHead.map((qv, r) => {
    const scores = kHead.map((kv, col) => (col <= r ? vecDot(qv, kv) * scale : -Infinity));
    return softmax(scores);
  });
})();

export const LAB_LOGIT_BYTES = 12 * 48 * 17485 * 4;
export const LAB_LOGIT_MB = LAB_LOGIT_BYTES / 1e6;

/** Build-time mathematical verification of every core identity in build-gpt-from-scratch-lab. */
export function verifyGptLabInvariants() {
  verifyInvariant(validateModel() === true, 'model.mjs validateModel() must pass');
  verifyInvariant(prompt.length === 6, 'prompt must contain 6 BPE pieces');
  verifyInvariant(
    prompt[2].piece === ',' && prompt[2].original === 11 && prompt[2].local === 2,
    'comma mapping',
  );
  verifyInvariant(prompt[3].piece === '↵' && prompt[3].original === 198, 'newline GPT-2 ID 198');
  verifyInvariant(
    BYTE_EMOJI.replacementCount === 3,
    'separate UTF-8 decode yields 3 replacement chars',
  );
  verifyInvariant(BYTE_EMOJI.unicode === 'U+1F642', 'joined UTF-8 decode restores U+1F642');
  verifyInvariant(TIED_FULL.fullWeights === 4824672, 'full tied embedding weights');
  verifyInvariant(TIED_FULL.compactWeights === 1678560, 'compact tied embedding weights');
  verifyInvariant(
    TIED_FULL.fullTotal === 5053152 && TIED_FULL.compactTotal === 1907040,
    'total model weights',
  );
  verifyApprox(TIED_FULL.probabilities[2], 0.422318798, 1e-6, 'unused row 2 probability');
  verifyApprox(TIED_FULL.probabilities[1], 0.155362403, 1e-6, 'target prob with competitor');
  verifyApprox(TIED_DROPPED.probabilities[1], 0.268941421, 1e-6, 'target prob without competitor');
  verifyInvariant(
    CORPUS.tokens === 1255253 && CORPUS.train === 1129727 && CORPUS.validation === 125526,
    'corpus split',
  );
  verifyInvariant(
    CORPUS.targetsPerUpdate === 576 && CORPUS.scored === 184896,
    'scored target counts',
  );
  verifyApprox(CORPUS.fraction, 0.1636643, 1e-4, 'sampled fraction ~16.4%');
  verifyApprox(CORPUS.uniformLoss, 9.7691, 1e-3, 'uniform loss ln(17485)');
  verifyApprox(CORPUS.constantLoss, 0.10536, 1e-4, 'constant 90% loss');
  verifyInvariant(SAMPLER_20.lastStart === 15 && SAMPLER_49.lastStart === 0, 'sampler last starts');
  verifyInvariant(
    MINI_CAUSAL.rows[2].logits[1] === 1 && MINI_CAUSAL_COPY.rows[2].logits[1] === 1,
    'causal invariance',
  );
  verifyInvariant(
    MINI_OPEN.rows[2].logits[1] === 2 && MINI_OPEN_COPY.rows[2].logits[1] === 1.5,
    'non-causal leak',
  );
  verifyApprox(LOSS_BEFORE.probabilities[1], 0.2368828, 1e-5, 'initial target prob ~23.7%');
  verifyApprox(LOSS_BEFORE.loss, 1.4402, 1e-3, 'initial loss ~1.440');
  verifyInvariant(LOSS_AFTER.loss < LOSS_BEFORE.loss, 'step lowers loss');
  verifyInvariant(
    CAT_DRAW.localId === 1 && CAT_DRAW.originalId === 461,
    'categorical draw picks local 1 / 461',
  );
  verifyApprox(ADAM_FORK.restored.weight, 0.8142857, 1e-5, 'restored Adam weight');
  verifyApprox(ADAM_FORK.reset.weight, 0.9, 1e-9, 'reset Adam weight');
  verifyApprox(NORM_CMP.layer[0], -1, 1e-9, 'LayerNorm first coord');
  verifyApprox(NORM_CMP.rms[0], 1 / Math.sqrt(5), 1e-9, 'RMSNorm first coord');
  verifyInvariant(ATTENTION_CPU_FIXTURE.maxAbsoluteDifference < 1e-6, 'SDPA CPU parity');
  const probeDiff = Math.max(
    ...PROBE_ORIG.rows
      .slice(0, 3)
      .flatMap((r, i) => r.logits.map((v, j) => Math.abs(v - PROBE_CHANGED.rows[i].logits[j]))),
  );
  verifyInvariant(probeDiff === 0, 'localProbe causal prefix diff must be zero');
}

/** Safe duration inside a scene window so an animation never outruns narration. */
export function safeDuration(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

/** Safe duration from a specific cue start to the scene end. */
export function remainDuration(c, cueId, maxDur = 2.0, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.25, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

/** Schedule a continuous ambient phase animation across the whole scene. */
export function runPhase(s, c, phaseVal, target = 10, startOffset = 0.08) {
  const dur = safeDuration(c, startOffset, 0.55);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/** Clean translucent dark-glass container cell (for token tiles and matrix cells, never bullet cards). */
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

/** Smooth 2D Bezier curve sampled as a glowingTrail. */
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

/** Shaded 3D rectangular prism for tensor volumes, embedding tables, and KV slabs. */
export function box3d(x0, y0, z0, dx, dy, dz, fillColor, edgeColor, opacity = 0.72) {
  const opts = { resolution: [1, 1], color: fillColor, opacity, mesh: false, shaded: true };
  const edges = wireframeSlab3d(
    [x0 + dx * 0.5, y0 + dy * 0.5, z0 + dz * 0.5],
    dx * 0.5,
    dy * 0.5,
    dz * 0.5,
    {
      color: edgeColor,
      width: 2.2,
      glow: 6,
    },
  );
  return [
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z0 + dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + dx, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
    ...edges,
  ];
}

/** Orbiting 3D TinyGPT causal token-stack prism with flowing autoregressive stream. */
export function buildCausalStream3d(phaseVal, { x = 350, y = 20, layers = 4 } = {}) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 1.06,
    distance: 15.2,
    unit: 104,
    focus: [0, 0, 0.7],
  }).at(x, y);

  const n = 5;
  const step = 0.92;
  const start = -((n - 1) * step) / 2;
  const cells = [];
  for (let r = 0; r < n; r++) {
    for (let col = 0; col < n; col++) {
      const allowed = col <= r;
      const cx = start + col * step;
      const cy = start + r * step;
      const h = allowed ? 0.35 + 0.14 * (r - col + 1) : 0.05;
      cells.push(
        ...box3d(
          cx - 0.34,
          cy - 0.34,
          0,
          0.68,
          0.68,
          h,
          allowed ? (r === 2 && col === 2 ? '#3d3012' : '#132844') : '#0d101b',
          allowed ? (r === 2 ? COSMOS.gold : COSMOS.cyan) : '#27314a',
          allowed ? 0.72 : 0.25,
        ),
      );
    }
  }

  const stackGuides = [];
  for (let l = 1; l <= layers; l++) {
    const z = 0.8 + l * 0.42;
    stackGuides.push(
      ...wireframeSlab3d([0, 0, z], 2.25, 2.25, 0.04, {
        color: l === layers ? COSMOS.gold : COSMOS.violet,
        width: 1.8,
        glow: 6,
      }),
    );
  }

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const frac = (p * 0.32 + i / 6) % 1;
        const px = start + frac * (n - 1) * step;
        const py = start + frac * (n - 1) * step;
        const pz = 0.65 + Math.sin(frac * Math.PI) * 1.65;
        pts.push([px, py, pz]);
      }
      return pts;
    },
    {
      colorAt: (idx) => (idx % 2 === 0 ? COSMOS.gold : COSMOS.cyan),
      radius: 5.8,
      glow: 11,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(...cells, ...stackGuides, photons);
  return view;
}

export {
  ATTENTION_CPU_FIXTURE,
  COSMOS,
  Node,
  aura,
  circle,
  cinematic3d,
  curve3d,
  dot,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  line,
  line3d,
  linear,
  linearGradient,
  logged,
  lossStep,
  maskedPredictionFixture,
  metricReadout,
  morphEquation,
  orbitScene,
  parametricSurface,
  pieces,
  points3d,
  polyPath,
  prompt,
  radialGradient,
  rect,
  rule,
  softmax,
  surface,
  txt,
  wireframeSlab3d,
};
