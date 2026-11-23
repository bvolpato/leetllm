import {
  arrow,
  centeredText,
  clauseComplete,
  clauseProgress,
  filledRectangle,
  line,
  tag,
} from '../defaults.mjs';
export function drawDownstreamTrial(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('downstream-trial-mechanism', () => {
    if (currentBeat === 0) {
      tag(ctx, api, 'Matched starting checkpoint', 960, 300, themeColors.blue, 1450);
      if (clauseProgress(ctx, api, 'start-weights')) {
        arrow(ctx, api, 650, 360, 490, 470, themeColors.blue);
        arrow(ctx, api, 1260, 360, 1420, 470, themeColors.blue);
        tag(ctx, api, 'Real-only recipe', 490, 560, themeColors.blue, 700);
        tag(ctx, api, 'Real + synthetic recipe', 1420, 560, themeColors.cyan, 700);
      }
      if (clauseProgress(ctx, api, 'budget-match')) {
        filledRectangle(ctx, api, 200, 740, 600, 65, themeColors.blue);
        filledRectangle(ctx, api, 1100, 740, 400, 65, themeColors.blue);
        filledRectangle(ctx, api, 1500, 740, 200, 65, themeColors.cyan);
        centeredText(ctx, api, 'Declared token / compute budget', 960, 880, 35, themeColors.yellow);
      }
      if (clauseComplete(ctx, api, 'generation-cost'))
        centeredText(
          ctx,
          api,
          'Also charge generation + filtering · report real-token exposure',
          960,
          945,
          31,
          themeColors.pink,
        );
    } else if (currentBeat === 1) {
      tag(ctx, api, 'Generator + training input', 490, 380, themeColors.cyan, 700);
      tag(ctx, api, 'Private held-out tasks + answers', 1420, 380, themeColors.yellow, 760);
      line(ctx, api, 960, 300, 960, 810, themeColors.pink, 5);
      if (clauseProgress(ctx, api, 'holdout-private')) {
        tag(ctx, api, 'Restricted overlap service', 1420, 625, themeColors.blue, 760);
        arrow(ctx, api, 1420, 440, 1420, 560, themeColors.blue);
        centeredText(ctx, api, 'Return screening decision only', 490, 665, 31, themeColors.blue);
        arrow(ctx, api, 1000, 650, 880, 650, themeColors.blue);
      }
      if (clauseComplete(ctx, api, 'overlap-limits'))
        centeredText(
          ctx,
          api,
          'Review shared wording and possible paraphrases',
          960,
          925,
          33,
          themeColors.pink,
        );
    } else {
      const labels = ['common', 'rare', 'unsafe', 'tool errors', 'unwanted refusals'];
      centeredText(
        ctx,
        api,
        'Declared checkpoint release contract',
        960,
        295,
        34,
        themeColors.blue,
      );
      labels.forEach((v, i) => {
        const x = 280 + i * 340;
        api.rect(ctx, x - 110, 390, 220, 310, themeColors.panel, themeColors.line, 10);
        if (clauseProgress(ctx, api, 'suite-slices')) {
          centeredText(
            ctx,
            api,
            v,
            x,
            485,
            27,
            [
              themeColors.blue,
              themeColors.cyan,
              themeColors.pink,
              themeColors.yellow,
              themeColors.green,
            ][i],
          );
          centeredText(ctx, api, 'n / error', x, 605, 24, themeColors.muted);
          centeredText(ctx, api, 'uncertainty', x, 660, 24, themeColors.muted);
        }
      });
      if (clauseProgress(ctx, api, 'selection-separate'))
        tag(
          ctx,
          api,
          'Separate final test from repeated recipe selection',
          960,
          805,
          themeColors.yellow,
          1500,
        );
      if (clauseComplete(ctx, api, 'unrun-comparison'))
        centeredText(
          ctx,
          api,
          'Compare the checkpoints on the final test',
          960,
          935,
          33,
          themeColors.muted,
        );
    }
  });
}
export default {
  id: 'downstream-trial',
  draw: drawDownstreamTrial,
  cues: [
    'matched-trial',
    'start-weights',
    'budget-match',
    'generation-cost',
    'evaluation-isolation',
    'holdout-private',
    'overlap-limits',
    'measurement-boundary',
    'suite-slices',
    'selection-separate',
    'unrun-comparison',
  ],
};
