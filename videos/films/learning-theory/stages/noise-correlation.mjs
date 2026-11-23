import { cutCorrelation, noiseFit } from '../arithmetic.mjs';
import { hoeffdingRadius } from '../fixtures.mjs';
import { cueEnded, cueProgress, focusOn, line, text } from '../defaults.mjs';

const firstMask = 0b11110000;
const flippedMask = firstMask ^ (1 << 6);
const fits = Array.from({ length: 256 }, (_, i) => noiseFit(i));
const tallyOrder = [fits[flippedMask], ...fits.filter((_, i) => i !== flippedMask)];
const scores = [0, 0.25, 0.5, 0.75, 1];
const means = [
  {
    name: 'Always predict +',
    score: fits.reduce((s, f) => s + cutCorrelation(f.signs, 0), 0) / fits.length,
  },
  { name: 'Choose either constant', score: fits.reduce((s, f) => s + f.constant, 0) / fits.length },
  {
    name: 'Choose a right threshold',
    score: fits.reduce((s, f) => s + f.threshold, 0) / fits.length,
  },
  { name: 'Choose each sign separately', score: 1 },
];
function drawTrials(ctx, state, api) {
  const { C } = api;
  const changed = cueEnded(state, 'flip-seven');
  const fit = fits[changed ? flippedMask : firstMask];
  const deal = cueProgress(state, 'deal-signs');
  const sweep = cueProgress(state, 'try-nine-cuts');
  const solved = cueEnded(state, 'best-repair');
  const placing = cueProgress(state, 'place-cut');
  const returning = cueProgress(state, 'return-cut');
  const sweeping = state.beat === 3 && sweep > 0 && returning === 0;
  const position =
    returning > 0
      ? 8 + (fit.split - 8) * returning
      : sweeping
        ? Math.min(8, Math.floor(sweep * 9))
        : fit.split * placing;
  const x = (i) => 490 + 163 * i;
  const cut = x(position - 0.5);
  text(ctx, api, 'Tickets ordered by urgency', 960, 280, 40, C.muted, 'center');
  text(ctx, api, 'Coin sign', 120, 468, 37, C.ink);
  text(ctx, api, 'Prediction', 120, 668, 37, C.ink);
  for (let i = 0; i < 8; i++) {
    const dealt = i < Math.ceil(8 * deal);
    const plus = fit.signs[i] > 0;
    const color = plus ? C.blue : C.pink;
    text(ctx, api, String(i + 1), x(i), 370, 30, C.muted, 'center');
    api.circle(
      ctx,
      x(i),
      455,
      40,
      dealt ? color : C.panel,
      changed && i === 6 ? C.yellow : undefined,
      5,
    );
    text(
      ctx,
      api,
      dealt ? (plus ? '+' : '−') : '?',
      x(i),
      471,
      49,
      dealt ? C.bg : C.muted,
      'center',
    );
    if (placing > 0) {
      const predictedPlus = x(i) >= cut;
      text(
        ctx,
        api,
        predictedPlus ? '+' : '−',
        x(i),
        669,
        59,
        predictedPlus ? C.blue : C.pink,
        'center',
      );
    }
  }
  if (placing > 0) {
    line(ctx, api, cut, 543, cut, 607, C.yellow, 7);
    api.circle(ctx, cut, 544, 11, C.yellow);
  } else {
    text(
      ctx,
      api,
      '−  to the left of the cut     |     +  to the right',
      1030,
      665,
      43,
      C.yellow,
      'center',
    );
  }
  if (sweeping) {
    const score = cutCorrelation(fit.signs, position);
    const matches = (8 + 8 * score) / 2;
    text(
      ctx,
      api,
      'Cut ' + (position + 1) + ' of 9     ·     ' + matches + ' of 8 signs match',
      960,
      860,
      46,
      C.ink,
      'center',
    );
  } else {
    const note =
      state.beat === 0
        ? 'Which gap gives eight matches?'
        : state.beat === 1 && cueEnded(state, 'place-cut')
          ? '8 agreements   ·   (8 − 0) / 8 = 1'
          : state.beat === 2 && changed
            ? 'Can one cut still match every sign?'
            : solved
              ? '7 agreements, 1 disagreement   ·   (7 − 1) / 8 = 0.75'
              : returning > 0
                ? 'Best cut for these signs'
                : 'One cut may go in any of the nine gaps.';
    text(ctx, api, note, 960, 860, 44, C.ink, 'center');
  }
  text(ctx, api, 'Correlation = (agreements − disagreements) / 8', 960, 984, 35, C.muted, 'center');
}

function drawTally(ctx, state, api) {
  const { C } = api;
  const total = 1 + Math.floor((fits.length - 1) * cueProgress(state, 'collect-fits'));
  const counts = scores.map(
    (score) => tallyOrder.slice(0, total).filter((fit) => fit.threshold === score).length,
  );
  const perfect = cueEnded(state, 'perfect-rows');
  const cutPosition = perfect
    ? 8 * cueProgress(state, 'show-perfect-cuts')
    : fits[flippedMask].split;
  const split = Math.ceil(cutPosition - 0.5);
  const fit = perfect
    ? fits.find((row) => row.threshold === 1 && row.split === split)
    : fits[flippedMask];
  const signX = (i) => 645 + 94 * i;
  const cutX = signX(cutPosition - 0.5);
  text(ctx, api, perfect ? 'Perfect row' : 'Previous row', 155, 310, 42, C.ink);
  fit.signs.forEach((sign, i) => {
    const mismatch = sign !== (i < fit.split ? -1 : 1);
    api.circle(
      ctx,
      signX(i),
      294,
      34,
      sign > 0 ? C.blue : C.pink,
      mismatch ? C.yellow : undefined,
      5,
    );
    text(ctx, api, sign > 0 ? '+' : '−', signX(i), 310, 45, C.bg, 'center');
  });
  api.path(
    ctx,
    [
      { x: cutX, y: 333 },
      { x: cutX - 10, y: 352 },
      { x: cutX + 10, y: 352 },
    ],
    {
      closed: true,
      fill: C.yellow,
      width: 0,
    },
  );
  text(ctx, api, 'cut', cutX, 389, 30, C.yellow, 'center');
  text(ctx, api, 'Best  ' + fit.threshold.toFixed(2), 1725, 310, 45, C.yellow, 'right');

  const base = 802;
  text(ctx, api, 'Coin rows', 150, 455, 34, C.muted);
  line(ctx, api, 350, base, 1650, base, C.muted, 3);
  scores.forEach((score, i) => {
    const x = 480 + 255 * i;
    const hidden = score === 1 && !perfect;
    const height = hidden ? 0 : counts[i] * 3.3;
    if (height > 0) api.rect(ctx, x - 65, base - height, 130, height, C.blue, undefined, 1);
    text(
      ctx,
      api,
      hidden ? '?' : String(counts[i]),
      x,
      base - height - 16,
      41,
      hidden ? C.yellow : C.ink,
      'center',
    );
    text(ctx, api, score.toFixed(2), x, 863, 39, C.yellow, 'center');
  });
  text(ctx, api, 'Best correlation', 990, 923, 33, C.muted, 'center');
  text(ctx, api, total + ' / 256 coin rows counted', 990, 1006, 40, C.ink, 'center');
}

export function drawNoiseCorrelation(ctx, scene, state, api) {
  const { C } = api;
  focusOn(api, 'noise-workbench', () => {
    if (state.beat < 4) return drawTrials(ctx, state, api);
    if (state.beat <= 5) return drawTally(ctx, state, api);
    if (state.beat === 6) {
      text(
        ctx,
        api,
        'Mean of the best correlations over 256 assignments',
        960,
        293,
        44,
        C.ink,
        'center',
      );
      const shown = ['fixed-average', 'constant-average', 'threshold-average', 'lookup-average'];
      means.forEach(({ name, score }, i) => {
        const y = 420 + i * 135;
        text(ctx, api, name, 125, y + 14, 39, C.ink);
        line(ctx, api, 740, y, 1515, y, C.muted, 2);
        const q = cueProgress(state, shown[i]);
        if (!q) return;
        const end = 740 + score * 775 * q;
        if (end > 740) line(ctx, api, 740, y, end, y, C.blue, 12);
        api.circle(ctx, end, y, 12, C.yellow);
        if (cueEnded(state, shown[i]))
          text(ctx, api, score.toFixed(4), 1730, y + 14, 42, C.yellow, 'right');
      });
      text(
        ctx,
        api,
        'Empirical Rademacher complexity of each predictor class',
        960,
        1000,
        33,
        C.muted,
        'center',
      );
      return;
    }
    const predictor = means[2].score,
      loss = predictor / 2;
    text(ctx, api, 'Right thresholds on these eight inputs', 960, 302, 45, C.ink, 'center');
    text(ctx, api, 'Predictor complexity', 530, 470, 39, C.muted, 'center');
    text(ctx, api, predictor.toFixed(4), 530, 591, 79, C.yellow, 'center');
    text(ctx, api, '÷ 2', 960, 574, 54, C.ink, 'center');
    text(ctx, api, 'Zero-one loss complexity', 1400, 470, 39, C.muted, 'center');
    if (cueEnded(state, 'loss-complexity'))
      text(ctx, api, loss.toFixed(4), 1400, 591, 79, C.cyan, 'center');
    text(
      ctx,
      api,
      'Risk ≤ sample loss + 2 × loss complexity + 3 × Hoeffding radius',
      960,
      790,
      40,
      C.ink,
      'center',
    );
    if (cueEnded(state, 'confidence-term'))
      text(
        ctx,
        api,
        'At n = 8 and δ = 0.05, the confidence term alone is ' +
          (3 * hoeffdingRadius(8)).toFixed(2) +
          '.',
        960,
        939,
        37,
        C.yellow,
        'center',
      );
  });
}
export default {
  id: 'noise-correlation',
  draw: drawNoiseCorrelation,
  cues: [
    'deal-signs',
    'place-cut',
    'flip-seven',
    'try-nine-cuts',
    'return-cut',
    'best-repair',
    'collect-fits',
    'perfect-rows',
    'show-perfect-cuts',
    'fixed-average',
    'constant-average',
    'threshold-average',
    'lookup-average',
    'loss-complexity',
    'confidence-term',
  ],
};
