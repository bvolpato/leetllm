import { limit } from '../construction.mjs';
import { box, constructionText, footer, line, title } from '../defaults.mjs';
export function drawQualityProvenance(ctx, scene, state, api) {
  api.focus.target('quality-provenance-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = limit(state.beatP ?? 0);
    {
      title(
        ctx,
        api,
        currentBeat === 0
          ? 'A shorter answer must still complete the task'
          : currentBeat === 1
            ? 'Which answers received a semantic check?'
            : 'A receipt binds exact inputs, clocks, judgments and environment',
      );
      if (currentBeat === 0) {
        const rows = [
          ['finish reason', 'length limit', 'natural stop'],
          ['schema', 'missing arguments', 'valid required fields'],
          ['task evidence', 'fast partial answer', 'checked actual response'],
        ];
        rows.forEach((r, i) => {
          constructionText(ctx, api, r[0], 190, 440 + i * 150, 29, themeColors.muted);
          box(ctx, api, r[1], 550, 390 + i * 150, 520, 90, themeColors.red, 29);
          box(ctx, api, r[2], 1180, 390 + i * 150, 560, 90, themeColors.green, 29);
        });
      } else if (currentBeat === 1) {
        for (let i = 0; i < 40; i++)
          api.rect(
            ctx,
            230 + (i % 10) * 47,
            415 + Math.floor(i / 10) * 55,
            32,
            38,
            themeColors.green,
            undefined,
            2,
          );
        constructionText(
          ctx,
          api,
          '40 reviewed semantic cases',
          480,
          720,
          30,
          themeColors.green,
          'center',
        );
        line(ctx, api, 970, 390, 970, 850, themeColors.yellow, 3);
        for (let i = 0; i < 60; i++)
          api.rect(
            ctx,
            1150 + (i % 10) * 47,
            415 + Math.floor(i / 10) * 55,
            32,
            38,
            themeColors.muted,
            undefined,
            2,
          );
        constructionText(
          ctx,
          api,
          'performance responses: unscored',
          1390,
          850,
          29,
          themeColors.yellow,
          'center',
        );
        footer(ctx, api, 'Link each judgment to the answer that received it.');
      } else {
        [
          ['model / tokenizer / template', 'engine / client / image', 'GPU count / placement'],
          ['workload bytes / timestamps', 'warmup / cache / timeout', 'raw terminal events'],
          [
            'quality judgments / source',
            'denominators / repetitions',
            'rejected runs / provenance',
          ],
        ].forEach((group, i) =>
          group.forEach((v, j) => {
            constructionText(
              ctx,
              api,
              v,
              220 + i * 550,
              425 + j * 150,
              29,
              [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
            );
            line(
              ctx,
              api,
              220 + i * 550,
              460 + j * 150,
              710 + i * 550,
              460 + j * 150,
              themeColors.border,
              2,
            );
          }),
        );
        footer(
          ctx,
          api,
          'The file hash identifies the input. The original log shows where the timestamps came from.',
        );
      }
    }
    return true;
  });
}
export default {
  id: 'quality-provenance',
  draw: drawQualityProvenance,
  cues: [
    'quality-provenance-beat-0',
    'quality-provenance-beat-1',
    'quality-unscored',
    'quality-provenance-beat-2',
  ],
};
