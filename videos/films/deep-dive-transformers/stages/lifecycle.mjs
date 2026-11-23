import { sampleModel } from '../model.mjs';
import {
  chapterArrow,
  chapterBox,
  chapterFooter,
  chapterGrid,
  chapterRows,
  chapterText,
  chapterTitle,
  chapterTransfer,
} from '../defaults.mjs';
export function drawLifecycle(ctx, scene, state, api) {
  return api.focus.target('hf-lifecycle-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('lifecycle', state),
      { b: currentBeat, p: progress } = modelState;
    {
      chapterTitle(
        ctx,
        api,
        currentBeat === 0
          ? 'Configuration creates shapes before parameter values'
          : currentBeat === 1
            ? 'Restoration and eval do not remove gradients'
            : 'A model directory does not save the tokenizer implicitly',
      );
      if (currentBeat === 0) {
        chapterBox(ctx, api, 'Config: width 32 · vocab 32', 180, 400, 650, themeColors.blue);
        chapterBox(ctx, api, 'Construct module', 1090, 400, 650, themeColors.cyan);
        chapterArrow(ctx, api, 870, 450, 1040, 450);
        const n = Math.floor(progress * 8);
        chapterText(ctx, api, 'One shared parameter W', 960, 610, 30, themeColors.pink, 'center');
        chapterGrid(
          ctx,
          api,
          [
            Array.from(
              {
                length: 8,
              },
              (_, i) => (i < n ? 'init' : 'shape'),
            ),
          ],
          260,
          650,
          1400,
          110,
          themeColors.pink,
          25,
        );
        chapterBox(ctx, api, 'Input embedding', 180, 860, 550, themeColors.blue, 90, 30);
        chapterBox(ctx, api, 'Output head', 1190, 860, 550, themeColors.cyan, 90, 30);
        chapterArrow(ctx, api, 455, 845, 605, 775, themeColors.blue);
        chapterArrow(ctx, api, 1465, 845, 1315, 775, themeColors.cyan);
        chapterFooter(
          ctx,
          api,
          'Two module references point to the same parameter allocation when tied',
        );
      } else if (currentBeat === 1) {
        chapterBox(ctx, api, 'Checkpoint values', 180, 420, 620, themeColors.blue);
        chapterBox(ctx, api, 'Restored module · eval', 1110, 420, 620, themeColors.cyan);
        chapterTransfer(
          ctx,
          api,
          [
            {
              x: 820,
              y: 470,
            },
            {
              x: 1060,
              y: 470,
            },
          ],
          progress,
        );
        chapterGrid(
          ctx,
          api,
          [
            ['eval', 'training-dependent behavior'],
            ['grad enabled', 'backward remains possible'],
          ],
          320,
          670,
          1280,
          180,
          themeColors.green,
          29,
        );
      } else {
        chapterBox(ctx, api, 'Model config + tensors', 180, 420, 650, themeColors.blue);
        chapterBox(ctx, api, 'Tokenizer / processor', 1090, 420, 650, themeColors.pink);
        chapterRows(
          ctx,
          api,
          [
            ['Model save', 'Configuration, weights, optional shard index'],
            ['Separate input save', 'Vocabulary, template and modality rules'],
          ],
          680,
          150,
        );
      }
      return;
    }
  });
}
export default {
  id: 'lifecycle',
  draw: drawLifecycle,
  cues: ['hf-lifecycle-0', 'hf-lifecycle-1', 'hf-lifecycle-2'],
};
