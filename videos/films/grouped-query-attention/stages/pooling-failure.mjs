import { chapterModel } from '../construction.mjs';
import { bar, chapterEquation, chapterText, matrix, note, operation } from '../defaults.mjs';
export function drawPoolingFailure(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('pooling-failure', state),
    currentBeat = m.beat,
    progress2 = m.p;
  {
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'Same two positions · opposite learned heads',
        960,
        275,
        38,
        themeColors.cyan,
      );
      const progress = state.cues ? api.focus.progress('pooling-progress', 0) : progress2,
        k = [0.5 * (1 - progress), -0.5 * (1 - progress)],
        v = [5, 5 * progress];
      [
        ['head A', [1, -1], [10, 0]],
        ['head B', [-1, 1], [0, 10]],
      ].forEach(([name, keys, values], i) => {
        const y = 385 + i * 180;
        chapterText(ctx, api, name, 280, y + 40, 32, themeColors.blue);
        matrix(ctx, api, [keys], 460, y);
        matrix(ctx, api, [values], 850, y, themeColors.green);
        chapterText(
          ctx,
          api,
          'output ' + m.oldOutput.toFixed(3),
          1450,
          y + 55,
          37,
          themeColors.muted,
        );
      });
      const revealed = state.cues
        ? api.focus.progress('pooled-output-reveal', 0) > 0.8
        : progress2 > 0.85;
      if (progress > 0) {
        chapterText(ctx, api, 'pooled K', 540, 740, 29, themeColors.blue);
        chapterText(ctx, api, 'pooled V', 940, 740, 29, themeColors.green);
        matrix(ctx, api, [k.map((x) => x.toFixed(2))], 460, 765);
        matrix(ctx, api, [v.map((x) => x.toFixed(2))], 850, 765, themeColors.green);
        [620, 1010].forEach((x) => {
          api.path(
            ctx,
            [
              {
                x: x + 12,
                y: 430,
              },
              {
                x: x + 45,
                y: 430,
              },
              {
                x: x + 45,
                y: 803,
              },
              {
                x: x + 12,
                y: 803,
              },
            ],
            {
              color: themeColors.muted,
              width: 1,
            },
          );
          api.path(
            ctx,
            [
              {
                x: x + 12,
                y: 610,
              },
              {
                x: x + 65,
                y: 610,
              },
              {
                x: x + 65,
                y: 803,
              },
              {
                x: x + 12,
                y: 803,
              },
            ],
            {
              color: themeColors.muted,
              width: 1,
            },
          );
        });
      }
      operation(ctx, api, 'pooling-failure', () =>
        chapterText(
          ctx,
          api,
          revealed ? 'pooled output: 5' : 'Predict the pooled outputs',
          1450,
          830,
          40,
          themeColors.yellow,
        ),
      );
      note(
        ctx,
        api,
        revealed
          ? 'Keys [0,0] · values [5,5] · old 8.808 becomes 5'
          : 'Accumulate half of each source head at the same two positions',
      );
    } else if (currentBeat === 1) {
      chapterText(
        ctx,
        api,
        'Group compatible K/V slices and biases',
        960,
        280,
        38,
        themeColors.cyan,
      );
      matrix(
        ctx,
        api,
        [
          [1, 3],
          [3, 5],
        ],
        330,
        390,
      );
      matrix(ctx, api, [[2, 4]], 1050, 475, themeColors.green);
      api.arrow(ctx, 670, 475, 1000, 515, themeColors.yellow, 5);
      operation(ctx, api, 'pooling-failure', () =>
        chapterEquation(
          ctx,
          api,
          String.raw`W'_{K,j}=\frac1G\sum_{i\in j}W_{K,i}\quad W'_{V,j}=\frac1G\sum_{i\in j}W_{V,i}`,
          960,
          770,
          41,
          themeColors.yellow,
        ),
      );
      chapterText(
        ctx,
        api,
        'Q and output projections retain their initialization',
        960,
        900,
        32,
        themeColors.muted,
      );
    } else {
      chapterText(
        ctx,
        api,
        'Historical T5-XXL experiment · task average',
        960,
        280,
        37,
        themeColors.cyan,
      );
      bar(ctx, api, 380, 430, 1100, 47.2, 50, themeColors.blue, 90);
      chapterText(ctx, api, 'MHA 47.2', 250, 485, 31, themeColors.blue);
      bar(ctx, api, 380, 635, 1100, 47.1, 50, themeColors.green, 90);
      chapterText(ctx, api, 'GQA-8 47.1', 250, 690, 31, themeColors.green);
      operation(ctx, api, 'pooling-failure', () =>
        chapterText(
          ctx,
          api,
          '5% original pretraining steps · same T5 recipe',
          960,
          850,
          39,
          themeColors.yellow,
        ),
      );
      note(
        ctx,
        api,
        'Summarization, translation, TriviaQA; excludes GLUE · no guarantee for another checkpoint',
      );
    }
  }
}
export default {
  id: 'pooling-failure',
  draw: drawPoolingFailure,
  cues: [
    'pooling-failure-0',
    'pooled-output-reveal',
    'pooling-progress',
    'pooling-failure-1',
    'pooling-failure-2',
  ],
};
