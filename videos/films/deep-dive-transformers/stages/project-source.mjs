import { sampleModel } from '../model.mjs';
import { chapterBox, chapterRows, chapterTitle } from '../defaults.mjs';
export function drawProjectSource(ctx, scene, state, api) {
  return api.focus.target('hf-project-source-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('project-source', state),
      { b: currentBeat, p: progress } = modelState;
    {
      if (currentBeat === 0) {
        chapterTitle(ctx, api, 'Library history and asset rights have separate scopes');
        chapterRows(
          ctx,
          api,
          [
            ['2018 BERT implementation', 'Open model-library origin'],
            ['2020 demonstration paper', 'Historical package design'],
            ['Apache library source', 'Model/data/product rights remain separate'],
          ],
          390,
          170,
        );
      } else if (currentBeat === 1) {
        chapterTitle(ctx, api, 'Three distinct revision records');
        chapterRows(
          ctx,
          api,
          [
            ['August 1 source snapshot', 'Immutable selected implementation'],
            ['Transformers 5.16.1 / Torch 2.12', 'Actual local CPU execution'],
            ['Moving v5 guides', 'Inspected November 7, 2026'],
          ],
          390,
          170,
        );
      } else {
        chapterTitle(ctx, api, 'Follow selected implementation owners');
        const names = [
          'Auto / config / model map',
          'Model family + lifecycle',
          'Hub file resolution',
          'Tokenizer / processor',
          'Generation / selection',
          'Cache / pipeline wrapper',
        ];
        names.forEach((v, i) =>
          chapterBox(
            ctx,
            api,
            v,
            170 + (i % 2) * 850,
            370 + Math.floor(i / 2) * 195,
            730,
            i <= Math.floor(progress * 6) ? themeColors.cyan : themeColors.muted,
            115,
            29,
          ),
        );
      }
      return;
    }
  });
}
export default {
  id: 'project-source',
  draw: drawProjectSource,
  cues: ['hf-project-source-0', 'hf-project-source-1', 'hf-project-source-2'],
};
