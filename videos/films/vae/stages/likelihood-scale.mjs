import { beatCue, gaussianPixelLoss } from '../arithmetic.mjs';
import { line, text } from '../defaults.mjs';

const observed = [0.1, 0.9, 0.85, 0.12];
const predicted = [0.12, 0.84, 0.8, 0.14];
const variance = 0.25;

const four = gaussianPixelLoss(observed, predicted, variance);
const eight = gaussianPixelLoss([...observed, ...observed], [...predicted, ...predicted], variance);

function pixel(ctx, api, value, x, y) {
  const gray = Math.round(25 + 210 * value)
    .toString(16)
    .padStart(2, '0')
    .repeat(3);
  api.rect(ctx, x - 58, y, 116, 74, '#' + gray, api.C.muted, 1, 3);
  text(ctx, api, value.toFixed(2), x, y + 49, 32, value > 0.5 ? api.C.bg : api.C.ink, 'center');
}

function drawEstimator(ctx, state, api) {
  const { C } = api;
  const completed = 1 + Math.floor(3 * beatCue(state, 5, 'repeat-draw', 0.31, 0.57));
  const result = beatCue(state, 5, 'variance-result', 0.58, 0.78) === 1;
  text(ctx, api, 'Same model and four observed pixels', 960, 255, 40, C.ink, 'center');
  observed.forEach((v, i) => pixel(ctx, api, v, 750 + i * 140, 310));
  text(ctx, api, 'Independent posterior draws', 150, 545, 33, C.ink);
  for (let i = 0; i < completed; i++) {
    const x = 760 + i * 250;
    text(ctx, api, 'z' + ['₁', '₂', '₃', '₄'][i], x, 525, 48, C.cyan, 'center');
    line(ctx, api, x, 550, x, 615, C.cyan, 3);
    text(ctx, api, 'decode', x, 675, 32, C.green, 'center');
  }
  text(
    ctx,
    api,
    completed + (completed === 1 ? ' decoder call' : ' decoder calls'),
    960,
    785,
    35,
    C.green,
    'center',
  );
  if (result)
    text(
      ctx,
      api,
      'Variance of the average   =   single-draw variance ÷ ' + completed,
      960,
      900,
      39,
      C.yellow,
      'center',
    );
}

export function drawLikelihoodScale(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 5) return drawEstimator(ctx, state, api);
  const squares = Math.ceil(4 * beatCue(state, 0, 'square-four', 0.36, 0.7));
  const copies = Math.ceil(4 * beatCue(state, 2, 'copy-four', 0.12, 0.55));
  const error = beatCue(state, 1, 'gaussian-error', 0.13, 0.36) === 1;
  const normalization = beatCue(state, 1, 'gaussian-normalization', 0.41, 0.54) === 1;
  const total = beatCue(state, 1, 'gaussian-total', 0.57, 0.77) === 1;
  const twice = beatCue(state, 3, 'double-error', 0, 0.22) === 1;
  const mean = beatCue(state, 3, 'same-mean', 0.38, 0.58) === 1;
  const units = state.beat === 4;
  const ratioReady = beatCue(state, 4, 'compare-divisors', 0.3, 0.48) === 1;
  const adjust = beatCue(state, 4, 'change-units', 0.59, 0.74) === 1;
  const tileX = (i) => 515 + (i % 4) * 149 + (i >= 4 ? 680 : 0);
  const caption = (s, y) => text(ctx, api, s, 125, y, 31, C.ink);

  text(ctx, api, 'Four pixel positions', tileX(0) + 224, 246, 36, C.cyan, 'center');
  if (copies && !units)
    text(ctx, api, 'Copy of the same four', tileX(4) + 224, 246, 36, C.cyan, 'center');
  caption('Observed', 345);
  caption('Predicted', 443);
  caption('Squared miss', 542);
  for (let i = 0; i < 4 + (units ? 0 : copies); i++) {
    const index = i % 4,
      x = tileX(i);
    pixel(ctx, api, observed[index], x, 296);
    pixel(ctx, api, predicted[index], x, 394);
    if (index < squares)
      text(ctx, api, four.errors[index].toFixed(4), x, 542, 31, C.yellow, 'center');
  }
  line(ctx, api, 125, 590, 1785, 590, C.muted, 2);
  if (units) {
    const sum = four.sum.toFixed(4);
    const ratio = four.error / four.mean;
    text(ctx, api, 'Sum of squared misses', 1395, 350, 32, C.ink, 'center');
    text(ctx, api, sum, 1395, 450, 64, C.yellow, 'center');
    text(ctx, api, 'Gaussian error', 490, 672, 37, C.cyan, 'center');
    text(ctx, api, 'Mean squared error', 1430, 672, 37, C.green, 'center');
    text(
      ctx,
      api,
      sum + ' ÷ ' + 2 * variance + ' = ' + four.error.toFixed(4),
      490,
      755,
      41,
      C.ink,
      'center',
    );
    text(
      ctx,
      api,
      sum + ' ÷ ' + observed.length + ' = ' + four.mean.toFixed(6),
      1430,
      755,
      41,
      C.ink,
      'center',
    );
    if (ratioReady) {
      text(ctx, api, 'Gaussian error + KL', 490, 900, 42, C.cyan, 'center');
      text(ctx, api, '÷ ' + ratio.toFixed(0) + ' →', 960, 900, 44, C.yellow, 'center');
      text(
        ctx,
        api,
        adjust ? 'MSE + KL / ' + ratio.toFixed(0) : 'MSE + ? × KL',
        1430,
        900,
        42,
        C.green,
        'center',
      );
    }
    return;
  }
  if (state.beat < 2) {
    if (normalization) {
      text(ctx, api, 'Gaussian normalization', 1420, 347, 33, C.green, 'center');
      text(ctx, api, 'N/2 × ln(2πτ²)', 1420, 442, 43, C.ink, 'center');
      text(ctx, api, 'N = 4      τ² = 0.25', 1420, 535, 31, C.muted, 'center');
    }
    if (squares === 4)
      text(
        ctx,
        api,
        'Sum of squared misses   ' + four.sum.toFixed(4),
        960,
        685,
        38,
        C.yellow,
        'center',
      );
    if (error)
      text(
        ctx,
        api,
        'Gaussian error   ' + four.sum.toFixed(4) + ' ÷ (2 × 0.25) = ' + four.error.toFixed(4),
        960,
        796,
        38,
        C.ink,
        'center',
      );
    if (total)
      text(
        ctx,
        api,
        'With normalization   ' +
          four.error.toFixed(4) +
          ' + ' +
          four.constant.toFixed(4) +
          ' ≈ ' +
          four.nll.toFixed(4),
        960,
        902,
        38,
        C.green,
        'center',
      );
    return;
  }

  caption('Positions scored', 664);
  caption('Gaussian error', 774);
  caption('Pixel mean', 884);
  [four, eight].forEach((score, j) => {
    const x = j ? 1420 : 738;
    if (j && copies < 4) return;
    text(ctx, api, j ? 'All 8' : 'Original 4', x, 664, 34, C.ink, 'center');
    text(
      ctx,
      api,
      !j || twice ? score.sum.toFixed(4) + ' ÷ 0.5 = ' + score.error.toFixed(4) : '?',
      x,
      774,
      36,
      C.yellow,
      'center',
    );
    text(
      ctx,
      api,
      !j || mean
        ? score.sum.toFixed(4) + ' ÷ ' + score.errors.length + ' = ' + score.mean.toFixed(6)
        : '?',
      x,
      884,
      36,
      C.cyan,
      'center',
    );
  });
}

export default {
  id: 'likelihood-scale',
  draw: drawLikelihoodScale,
  cues: [
    'square-four',
    'gaussian-error',
    'gaussian-normalization',
    'gaussian-total',
    'copy-four',
    'double-error',
    'same-mean',
    'compare-divisors',
    'change-units',
    'repeat-draw',
    'variance-result',
  ],
};
