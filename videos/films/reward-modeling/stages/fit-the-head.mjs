import { TRAINING_PAIRS, CONTROLLED_PAIRS } from '../fixtures.mjs';
import { headScore, REWARD_FITS } from '../model.mjs';
import { cueProgress, motion } from '../construction.mjs';
import { badge, label, line, panel } from '../defaults.mjs';

const heads = [
  { key: 'confounded', name: 'Longer winner in both pairs' },
  { key: 'balanced', name: 'One shorter winner' },
];

function fitTraining(ctx, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const swapped = beat > 0 || cueProgress(state, 'fit-swap', motion(state, 0.5, 0.6)) > 0;
  const run = beat > 0 ? cueProgress(state, 'fit-updates', motion(state, 0.3, 0.63)) : 0;
  const step = Math.round(300 * run);
  badge(
    api,
    ctx,
    'Each row subtracts the rejected answer’s features from the chosen answer’s.',
    960,
    263,
    C.ink,
    35,
  );
  for (const [i, head] of heads.entries()) {
    const x = 160 + 850 * i;
    const source = i === 1 && !swapped ? 'confounded' : head.key;
    api.focus.target(i ? 'balanced-data' : 'confounded-data', () => {
      badge(
        api,
        ctx,
        i && !swapped ? 'Copy of the same pairs' : head.name,
        x + 350,
        342,
        C.ink,
        37,
      );
      panel(api, ctx, x, 379, 700, 237, C.muted);
      badge(api, ctx, 'Compliance', x + 340, 434, C.cyan, 34);
      badge(api, ctx, 'Scaled length', x + 565, 434, C.yellow, 34);
      TRAINING_PAIRS[source].forEach(([winner, loser], j) => {
        const y = 507 + 71 * j;
        label(api, ctx, 'Pair ' + (j + 1), x + 40, y, 31, C.muted);
        winner.forEach((v, k) => {
          const delta = v - loser[k];
          badge(
            api,
            ctx,
            delta > 0 ? '+' + delta : String(delta).replace('-', '−'),
            x + 340 + 225 * k,
            y,
            k ? C.yellow : C.cyan,
            41,
          );
        });
      });
    });
    const weights = REWARD_FITS[source].trajectory[step];
    api.focus.target('fitted-weights', () => {
      for (const [j, w] of weights.entries()) {
        const y = 693 + 103 * j;
        label(api, ctx, j ? 'Length weight' : 'Compliance weight', x, y, 28, C.ink);
        const start = x + 295;
        line(api, ctx, start, y - 11, start + 282, y - 11, C.muted, 2);
        if (w > 0) api.rect(ctx, start, y - 23, w * 101, 24, j ? C.yellow : C.cyan, undefined, 3);
        label(api, ctx, w.toFixed(3), x + 700, y, 34, j ? C.yellow : C.cyan, 'right', 'mono');
      }
    });
  }
  badge(api, ctx, 'Gradient steps   ' + step + ' / 300', 960, 916, C.ink, 39);
  badge(api, ctx, 'Learning rate 0.1     •     L2 coefficient 0.02', 960, 979, C.muted, 29);
}

function scorePair(ctx, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const extended = beat > 2 || cueProgress(state, 'fit-add-words', motion(state, 0.22, 0.39)) > 0;
  const [a, d] = CONTROLLED_PAIRS[0];
  const answers = [a, extended ? d : [0, 0]];
  const rows = [
    ['A   “Wait for approval.”'],
    ['D   “Admin enabled now.”', '“I will request approval afterward.”'],
  ];
  label(api, ctx, 'Proposed reply', 150, 287, 35, C.ink);
  api.focus.target('answer-features', () => {
    answers.forEach(([compliance, length], i) => {
      const y = 405 + i * 208;
      label(api, ctx, rows[i][0], 150, y, 37, C.ink);
      if (i && extended) label(api, ctx, rows[i][1], 150, y + 51, 29, C.ink);
      label(api, ctx, 'Compliance ' + compliance, 150, y + 118, 29, C.cyan);
      label(api, ctx, 'Scaled length ' + length, 395, y + 118, 29, C.yellow);
    });
  });
  line(api, ctx, 726, 294, 726, 834, C.muted, 2);
  for (const [k, head] of heads.entries()) {
    const weights = REWARD_FITS[head.key].weights;
    const y = 305 + k * 300;
    const progress =
      beat === 2
        ? 0
        : cueProgress(
            state,
            k ? 'fit-balanced' : 'fit-confounded',
            motion(state, 0.1 + 0.4 * k, 0.27 + 0.4 * k),
          );
    const start = 895;
    api.focus.target(k ? 'balanced-scores' : 'confounded-scores', () => {
      label(api, ctx, head.name, 804, y, 37, C.ink);
      label(api, ctx, 'Compliance × ' + weights[0].toFixed(2), 804, y + 55, 31, C.cyan);
      label(api, ctx, 'Length × ' + weights[1].toFixed(2), 1275, y + 55, 31, C.yellow);
      answers.forEach((features, i) => {
        const baseline = y + 121 + 75 * i;
        label(api, ctx, i ? 'D' : 'A', 806, baseline + 12, 36, C.ink);
        line(api, ctx, start, baseline, start + 638, baseline, C.muted, 2);
        let edge = start;
        for (const [j, f] of features.entries()) {
          const width = 184 * f * weights[j] * progress;
          if (width > 0)
            api.rect(ctx, edge, baseline - 14, width, 28, j ? C.yellow : C.cyan, undefined, 3);
          edge += width;
        }
        const score = headScore(weights, features);
        label(
          api,
          ctx,
          progress === 1 ? score.toFixed(2) : '?',
          1744,
          baseline + 12,
          36,
          progress === 1 ? C.ink : C.muted,
          'right',
          'mono',
        );
      });
    });
  }
  badge(
    api,
    ctx,
    beat === 2
      ? 'Which head will rank D above A?'
      : 'Score = compliance contribution + length contribution',
    960,
    953,
    beat === 2 ? C.yellow : C.ink,
    39,
  );
}

function heldOut(ctx, state, api) {
  const { C } = api;
  const count = Math.ceil(3 * cueProgress(state, 'fit-controlled', motion(state, 0.23, 0.55)));
  const xs = [245, 615, 1130, 1595];
  [
    'Pair',
    'Scaled lengths A / D',
    'Trained on two longer winners',
    'Trained with a shorter winner',
  ].forEach((title, i) => badge(api, ctx, title, xs[i], 377, C.ink, i ? 28 : 32));
  badge(
    api,
    ctx,
    'A waits for approval in every pair. D grants access in every pair.',
    960,
    265,
    C.ink,
    38,
  );
  line(api, ctx, 155, 410, 1765, 410, C.muted);
  api.focus.target('controlled-rows', () => {
    CONTROLLED_PAIRS.forEach(([a, d], i) => {
      const y = 502 + i * 112;
      badge(api, ctx, String(i + 1), xs[0], y, C.muted, 37);
      badge(api, ctx, a[1] + '   /   ' + d[1], xs[1], y, C.yellow, 40);
      heads.forEach(({ key }, k) => {
        const w = REWARD_FITS[key].weights;
        const correct = headScore(w, a) > headScore(w, d);
        badge(
          api,
          ctx,
          i >= count ? '·' : correct ? 'A · waits' : 'D · grants early',
          xs[k + 2],
          y,
          i >= count ? C.muted : correct ? C.green : C.red,
          37,
        );
      });
    });
  });
  line(api, ctx, 155, 781, 1765, 781, C.muted);
  label(api, ctx, 'Correct on held-out pairs', 260, 873, 35, C.ink);
  for (const [k, head] of heads.entries()) {
    const w = REWARD_FITS[head.key].weights;
    const hits = CONTROLLED_PAIRS.filter(([a, d]) => headScore(w, a) > headScore(w, d)).length;
    badge(
      api,
      ctx,
      count === 3 ? hits + ' / 3' : '·',
      xs[k + 2],
      882,
      count === 3 ? C.ink : C.muted,
      51,
    );
  }
}

export function drawFitTheHead(ctx, scene, state, api) {
  if ((state.beat ?? 0) < 2) fitTraining(ctx, state, api);
  else if (state.beat < 4) scorePair(ctx, state, api);
  else heldOut(ctx, state, api);
}

export default {
  id: 'fit-the-head',
  draw: drawFitTheHead,
  cues: [
    'fit-swap',
    'fit-updates',
    'fit-add-words',
    'fit-confounded',
    'fit-balanced',
    'fit-controlled',
  ],
};
