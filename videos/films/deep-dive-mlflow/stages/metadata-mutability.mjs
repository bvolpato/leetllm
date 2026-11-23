import { mix } from '../arithmetic.mjs';
import { sampleMlflowChapter } from '../construction.mjs';
import { chapterText, chip, flow, footer, table } from '../defaults.mjs';
export function drawMetadataMutability(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleMlflowChapter('metadata-mutability', state),
    currentBeat = modelState.b;
  {
    chapterText(
      ctx,
      api,
      'Same identities · different mutation contracts',
      960,
      285,
      35,
      themeColors.yellow,
      'center',
    );
    table(
      ctx,
      api,
      170,
      375,
      [420, 450, 450, 270],
      [
        ['Record', 'Before', 'Attempt / later read', 'Result'],
        [
          'R8 / retrieval k',
          '40',
          currentBeat === 0 && !modelState.rejected ? 'try 50' : '40',
          modelState.rejected || currentBeat > 0 ? 'rejected' : 'pending',
        ],
        ['R8 / review', 'pending', modelState.tag, currentBeat ? 'mutable' : '…'],
        [
          'Prompt 17 / temp',
          '.2',
          modelState.temperature.toFixed(1),
          currentBeat ? 'mutable' : '…',
        ],
      ],
      [
        themeColors.muted,
        themeColors.blue,
        currentBeat ? themeColors.green : themeColors.muted,
        currentBeat ? themeColors.green : themeColors.muted,
      ],
    );
    if (currentBeat === 0) {
      const attempted = chip(
        ctx,
        api,
        '50',
        mix(1360, 1060, modelState.write),
        760,
        170,
        modelState.rejected ? themeColors.pink : themeColors.yellow,
      );
      const kept = chip(ctx, api, 'Stored 40', 600, 760, 270, themeColors.blue);
      flow(ctx, api, attempted, kept, modelState.rejected ? 0 : modelState.write, themeColors.pink);
      chapterText(
        ctx,
        api,
        modelState.rejected
          ? 'Rollback retains the old parameter'
          : 'Unique key: (run R8, retrieval k)',
        960,
        920,
        31,
        themeColors.pink,
        'center',
      );
    } else if (currentBeat === 1)
      chapterText(
        ctx,
        api,
        'Tag and temperature update without a new template version',
        960,
        860,
        34,
        themeColors.green,
        'center',
      );
    else {
      const historic = chip(
          ctx,
          api,
          'Retained: review pending / temp .2',
          190,
          820,
          720,
          themeColors.blue,
          100,
        ),
        now = chip(ctx, api, 'Current: approved / temp .8', 1030, 820, 700, themeColors.cyan, 100);
      flow(ctx, api, historic, now, 0, themeColors.muted);
    }
    footer(ctx, api, 'A current annotation cannot reconstruct an earlier request');
  }
}
export default {
  id: 'metadata-mutability',
  draw: drawMetadataMutability,
  cues: [
    'mf-metadata-mutability-0',
    'mf-sentence-metadata-mutability-0-0',
    'mf-sentence-metadata-mutability-0-1',
    'mf-sentence-metadata-mutability-0-2',
    'mf-sentence-metadata-mutability-0-3',
    'mf-metadata-mutability-1',
    'mf-sentence-metadata-mutability-1-0',
    'mf-sentence-metadata-mutability-1-1',
    'mf-sentence-metadata-mutability-1-2',
    'mf-sentence-metadata-mutability-1-3',
    'mf-sentence-metadata-mutability-1-4',
    'mf-metadata-mutability-2',
    'mf-sentence-metadata-mutability-2-0',
    'mf-sentence-metadata-mutability-2-1',
    'mf-sentence-metadata-mutability-2-2',
    'mf-sentence-metadata-mutability-2-3',
  ],
};
