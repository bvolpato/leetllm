import { beatCue } from '../arithmetic.mjs';
import { gaussianEvidenceState } from '../model.mjs';
import { line, point, text } from '../defaults.mjs';

function density(ctx, api, mean, variance, color, width) {
  const samples = Array.from({ length: 121 }, (_, i) => {
    const z = (i - 60) / 20;
    const density =
      Math.exp(-((z - mean) ** 2) / (2 * variance)) / Math.sqrt(2 * Math.PI * variance);
    return { x: 200 + i * 7.5, y: 570 - 450 * density };
  });
  api.path(ctx, samples, { color, width });
}
const pinX = (value) => 280 + ((value + 1.5) / 0.25) * 1330;

export function drawEvidenceGap(ctx, scene, state, api) {
  const { C } = api;
  const observed = beatCue(state, 0, 'observe-pixel', 0.4, 0.56) === 1;
  const modelVariance = beatCue(state, 0, 'pixel-variance', 0.57, 0.7) === 1;
  const pinned = beatCue(state, 0, 'pin-evidence', 0.76, 0.92) > 0;
  const approx = beatCue(state, 1, 'prior-match', 0.06, 0.2) > 0;
  const bound = beatCue(state, 1, 'place-bound', 0.65, 0.78) === 1;
  const target = beatCue(state, 2, 'posterior-target', 0.35, 0.55) === 1;
  const progress = beatCue(state, 2, 'tighten-bound', 0.6, 0.85);
  const current = gaussianEvidenceState(progress);
  const fixed = gaussianEvidenceState(1);

  text(ctx, api, 'Latent density for the one-pixel model', 650, 241, 34, C.ink, 'center');
  line(ctx, api, 200, 573, 1100, 573, C.muted, 2);
  [-2, 0, 2].forEach((v) => text(ctx, api, String(v), 650 + v * 150, 620, 28, C.muted, 'center'));
  density(ctx, api, 0, 1, C.muted, 10);
  if (target) density(ctx, api, fixed.mean, fixed.variance, C.pink, 10);
  if (approx) density(ctx, api, current.mean, current.variance, C.cyan, 4);
  if (observed) text(ctx, api, 'Observed pixel   x = 0.30', 1230, 263, 35, C.ink);
  text(ctx, api, 'Prior   N(0, 1)', 1230, 360, 35, C.muted);
  if (approx) {
    text(ctx, api, 'Encoder approximation', 1230, 425, 31, C.cyan);
    text(
      ctx,
      api,
      'μ = ' + current.mean.toFixed(2) + '     variance = ' + current.variance.toFixed(2),
      1230,
      480,
      30,
      C.cyan,
    );
  }
  if (target) text(ctx, api, 'True posterior   N(0.15, 0.50)', 1230, 557, 32, C.pink);
  if (modelVariance && !approx) text(ctx, api, 'Pixel variance   1 + 1 = 2', 1230, 451, 32, C.ink);
  if (!pinned) return;
  const evidenceX = pinX(current.logEvidence),
    boundX = pinX(current.elbo);
  line(ctx, api, 280, 765, 1610, 765, C.muted, 3);
  line(ctx, api, evidenceX, 730, evidenceX, 800, C.green, 5);
  text(
    ctx,
    api,
    'Log evidence   ' + current.logEvidence.toFixed(3),
    evidenceX,
    700,
    35,
    C.green,
    'center',
  );
  if (bound) {
    if (evidenceX > boundX + 1) line(ctx, api, boundX, 765, evidenceX, 765, C.yellow, 7);
    point(ctx, api, boundX, 765, C.cyan, 12);
    text(ctx, api, 'ELBO   ' + current.elbo.toFixed(3), boundX, 850, 35, C.cyan, 'center');
    text(
      ctx,
      api,
      'E[log likelihood]  ' + current.expectedLogLikelihood.toFixed(3),
      185,
      960,
      30,
      C.ink,
    );
    text(ctx, api, 'Prior KL  ' + current.priorKL.toFixed(3), 945, 960, 30, C.ink, 'center');
    text(
      ctx,
      api,
      (state.beat < 2 ? 'Gap  ' : 'Posterior gap  ') + current.gap.toFixed(3),
      1710,
      960,
      30,
      C.yellow,
      'right',
    );
  }
}

export default {
  id: 'evidence-gap',
  draw: drawEvidenceGap,
  cues: [
    'observe-pixel',
    'pixel-variance',
    'pin-evidence',
    'prior-match',
    'place-bound',
    'posterior-target',
    'tighten-bound',
    'gap-result',
  ],
};
