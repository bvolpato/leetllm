import { loopBound } from '../arithmetic.mjs';
import { loopAtomicState } from '../construction.mjs';
import { arrow, box, constructionText, footer, heading, matrix } from '../defaults.mjs';
export function drawAtomicCheckpoint(ctx, scene, state, api) {
  api.focus.target('atomic-checkpoint-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = loopBound(state.beatP ?? 0);
    {
      const r = loopAtomicState(currentBeat, progress, state.cues);
      heading(ctx, api, 'Follow the bytes at the two file paths');
      box(ctx, api, 'live checkpoint path', 200, 400, 570, 100, themeColors.blue, 32);
      matrix(
        ctx,
        api,
        [r.liveCells],
        1100,
        400,
        r.replaced ? themeColors.green : themeColors.blue,
        110,
      );
      constructionText(
        ctx,
        api,
        r.live,
        1360,
        560,
        31,
        r.replaced ? themeColors.green : themeColors.blue,
        'center',
      );
      arrow(ctx, api, 810, 450, 1060, 450, r.replaced ? themeColors.green : themeColors.blue);
      box(ctx, api, 'staging path', 200, 650, 570, 100, themeColors.yellow, 32);
      if (r.stagingNameExists)
        matrix(
          ctx,
          api,
          [r.stagedCells],
          1100,
          650,
          currentBeat === 2 ? themeColors.red : themeColors.yellow,
          110,
        );
      else box(ctx, api, 'no staging pathname', 1100, 650, 460, 110, themeColors.muted, 31);
      constructionText(
        ctx,
        api,
        r.staging,
        1360,
        815,
        30,
        currentBeat === 2 ? themeColors.red : themeColors.yellow,
        'center',
      );
      arrow(
        ctx,
        api,
        810,
        700,
        1060,
        700,
        currentBeat === 2 ? themeColors.red : themeColors.yellow,
      );
      constructionText(
        ctx,
        api,
        'file sync: ' + (r.fileSynced ? 'complete' : 'not completed'),
        450,
        870,
        30,
        r.fileSynced ? themeColors.green : themeColors.red,
        'center',
      );
      constructionText(
        ctx,
        api,
        'directory sync: ' + (r.directorySynced ? 'complete' : 'pending'),
        1380,
        870,
        30,
        r.directorySynced ? themeColors.green : themeColors.yellow,
        'center',
      );
      footer(
        ctx,
        api,
        currentBeat === 2
          ? 'The staging write failed. The live path still opens the previous checkpoint.'
          : 'Replace the live path after the staging file is complete and synced.',
      );
    }
    return true;
  });
}
export default {
  id: 'atomic-checkpoint',
  draw: drawAtomicCheckpoint,
  cues: [
    'atomic-checkpoint-beat-0',
    'loop-file-replace',
    'atomic-checkpoint-beat-1',
    'loop-directory-sync',
    'atomic-checkpoint-beat-2',
    'loop-stage-failure',
  ],
};
