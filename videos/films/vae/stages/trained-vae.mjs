import { beatCue } from '../arithmetic.mjs';
import { TRAINED_VAE as data, coordinateSwapStudy } from '../fixtures.mjs';
import { chapterGrid, line, text } from '../defaults.mjs';

const study = coordinateSwapStudy;
const columnX = [780, 1080];
const rowY = [405, 735];

function trainingSetup(ctx, state, api) {
  const { C } = api;
  const families = beatCue(state, 0, 'training-families', 0.15, 0.3);
  const heads = beatCue(state, 0, 'encoder-heads', 0.32, 0.52);
  const sample = beatCue(state, 0, 'sampled-pair', 0.54, 0.77);
  text(ctx, api, 'Training crops', 365, 243, 37, C.ink, 'center');
  rowY.forEach((y, row) => {
    if (row && !families) return;
    chapterGrid(ctx, api, data.inputRows[row], 248, y - 116, 47);
    text(
      ctx,
      api,
      row ? '32 lower strips' : '32 center badges',
      365,
      y + 157,
      30,
      row ? C.pink : C.cyan,
      'center',
    );
    if (heads) line(ctx, api, 507, y, 660, 548, C.muted, 3);
  });
  if (heads) {
    text(ctx, api, 'One encoder', 800, 529, 36, C.ink, 'center');
    text(ctx, api, '12 hidden units', 800, 588, 29, C.muted, 'center');
    for (const [i, name] of ['Two means', 'Two log variances'].entries()) {
      if (i && heads < 0.5) continue;
      const y = 418 + i * 255;
      line(ctx, api, 930, 548, 1040, y, C.yellow, 3);
      text(ctx, api, name, 1195, y + 10, 31, C.yellow, 'center');
      if (sample) line(ctx, api, 1360, y, 1450, 548, C.muted, 3);
    }
  }
  if (sample) {
    text(ctx, api, 'Sample z', 1585, 538, 37, C.green, 'center');
    text(ctx, api, '2 → 12 → 25', 1585, 607, 31, C.ink, 'center');
  }
  if (beatCue(state, 0, 'training-loss', 0.8, 0.98) === 1) {
    text(
      ctx,
      api,
      'Training check   0.0075 MSE + 0.02 × 0.7382 KL ≈ 0.0222',
      960,
      973,
      34,
      C.ink,
      'center',
    );
  }
}

function drawCodeColumn(ctx, api, axis, progress) {
  const { C } = api;
  [0, 1].forEach((donor) => {
    const delta = donor ? -1 : 1;
    const x = columnX[axis] + delta * 100 * Math.sin(Math.PI * progress);
    const y = rowY[donor] + delta * (rowY[1] - rowY[0]) * progress;
    const color = donor ? C.pink : C.cyan;
    api.rect(ctx, x - 84, y - 37, 168, 74, C.panel, color, 5);
    text(ctx, api, data.posteriorMeans[donor][axis].toFixed(4), x, y + 12, 34, color, 'center');
  });
}

function priorDraws(ctx, state, api) {
  const { C } = api;
  const reveal = beatCue(state, 5, 'three-priors', 0.45, 0.65);
  text(ctx, api, 'Average KL by coordinate', 220, 255, 37, C.ink);
  const charges = [0.0005, 0.7378];
  charges.forEach((v, i) => {
    const y = 345 + i * 95;
    text(
      ctx,
      api,
      'z' + (i ? '₂' : '₁') + '   ' + v.toFixed(4) + ' nats',
      220,
      y + 12,
      33,
      i ? C.yellow : C.muted,
    );
    line(ctx, api, 655, y, 1685, y, C.muted, 2);
    api.circle(ctx, 655 + (v / 0.8) * 1030, y, 12, i ? C.yellow : C.ink);
  });
  const count = Math.ceil(3 * reveal);
  if (count) text(ctx, api, 'Decoded means from three prior draws', 960, 567, 38, C.ink, 'center');
  for (let i = 0; i < count; i++) {
    const x = 345 + i * 505;
    chapterGrid(ctx, api, data.priorDecodedRows[i], x, 622, 48);
    text(ctx, api, 'Draw ' + (i + 1), x + 117, 930, 31, C.ink, 'center');
  }
}

export function drawTrainedVae(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 0) return trainingSetup(ctx, state, api);
  if (state.beat === 5) return priorDraws(ctx, state, api);
  const showCodes = beatCue(state, 1, 'matched-means', 0.1, 0.33) > 0;
  const decoded = beatCue(state, 1, 'matched-result', 0.35, 0.5) === 1;
  const first =
    beatCue(state, 2, 'swap-first', 0, 0.18) -
    beatCue(state, 3, 'reset-first', 0, 0.18) +
    beatCue(state, 4, 'swap-both', 0.67, 0.83);
  const second = beatCue(state, 4, 'swap-second', 0, 0.14);
  const completeFirst = beatCue(state, 2, 'first-result', 0.29, 0.46) === 1;
  const completeSecond = beatCue(state, 4, 'second-result', 0.19, 0.37) === 1;
  const moving = (first > 0 && first < 1) || (second > 0 && second < 1);
  // For a paired row, taking its second coordinate from its partner produces
  // the same hybrid pair as the partner taking only the first coordinate.
  const mode = first === 1 ? (second === 1 ? 'both' : 'first') : second === 1 ? 'second' : 'own';
  const rows = {
    own: data.meanDecodedRows,
    first: study.firstOnlyRows,
    second: [study.firstOnlyRows[1], study.firstOnlyRows[0]],
    both: data.swappedDecodedRows,
  }[mode];
  const showOutput =
    decoded &&
    !moving &&
    (state.beat !== 2 || first === 0 || completeFirst) &&
    (state.beat !== 4 || second === 0 || completeSecond);
  text(ctx, api, 'Observed crop', 362, 243, 37, C.ink, 'center');
  text(ctx, api, 'First number', columnX[0], 243, 33, C.ink, 'center');
  text(ctx, api, 'Second number', columnX[1], 243, 33, C.ink, 'center');
  text(ctx, api, 'Frozen decoder output', 1505, 243, 37, C.ink, 'center');
  for (let row = 0; row < 2; row++) {
    const y = rowY[row] - 116;
    chapterGrid(ctx, api, data.inputRows[row], 248, y, 47);
    if (showOutput) {
      chapterGrid(ctx, api, rows[row], 1390, y, 47);
    } else {
      api.rect(ctx, 1390, y, 230, 230, null, C.muted, 3);
      text(ctx, api, '?', 1505, y + 130, 44, C.muted, 'center');
    }
  }
  if (showCodes) {
    drawCodeColumn(ctx, api, 0, first);
    drawCodeColumn(ctx, api, 1, second);
  } else {
    columnX.forEach((x) =>
      rowY.forEach((y) => text(ctx, api, 'μ', x, y + 11, 39, C.muted, 'center')),
    );
  }
  if (showOutput) {
    const name = {
      own: 'own means',
      first: 'first exchanged',
      second: 'second exchanged',
      both: 'both exchanged',
    }[mode];
    text(ctx, api, 'MSE across 64 training crops', 610, 954, 34, C.ink, 'center');
    text(
      ctx,
      api,
      name + '   ' + study.batchMSE[mode].toFixed(4),
      1335,
      954,
      38,
      C.yellow,
      'center',
    );
  }
}

export default {
  id: 'trained-vae',
  draw: drawTrainedVae,
  cues: [
    'training-families',
    'encoder-heads',
    'sampled-pair',
    'training-loss',
    'matched-means',
    'matched-result',
    'swap-first',
    'first-result',
    'reset-first',
    'swap-second',
    'second-result',
    'swap-both',
    'axis-kl',
    'three-priors',
  ],
};
