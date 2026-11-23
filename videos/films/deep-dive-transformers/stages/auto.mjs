import { sampleModel } from '../model.mjs';
import {
  chapterArrow,
  chapterBox,
  chapterFooter,
  chapterGrid,
  chapterText,
  chapterTitle,
} from '../defaults.mjs';
export function drawAuto(ctx, scene, state, api) {
  return api.focus.target('hf-auto-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('auto', state),
      { b: currentBeat } = modelState;
    {
      chapterTitle(ctx, api, 'Supplied shard family: llama');
      api.focus.target('auto-model-type', () =>
        chapterBox(
          ctx,
          api,
          'model type: ' + modelState.type,
          140,
          390,
          480,
          themeColors.blue,
          110,
        ),
      );
      api.focus.target('auto-s-selected-unknown-family-lookup-fails', () =>
        chapterBox(
          ctx,
          api,
          modelState.selected ?? 'Unknown family: lookup fails',
          890,
          390,
          850,
          modelState.selected ? themeColors.cyan : themeColors.pink,
          110,
        ),
      );
      chapterArrow(ctx, api, 660, 445, 840, 445);
      if (modelState.selected) {
        chapterGrid(
          ctx,
          api,
          [
            ['Tensor', 'Expected rows', 'Supplied rows'],
            ['embedding', currentBeat === 0 ? '32000' : '50257', '32000'],
          ],
          260,
          640,
          1400,
          180,
          themeColors.cyan,
        );
        chapterText(
          ctx,
          api,
          modelState.compatible
            ? 'Matching family and shape'
            : 'Lookup succeeded · shape restoration rejects',
          960,
          940,
          36,
          modelState.compatible ? themeColors.green : themeColors.pink,
          'center',
        );
      } else
        chapterText(
          ctx,
          api,
          'No built-in mapping · no tensor admission',
          960,
          800,
          37,
          themeColors.pink,
          'center',
        );
      chapterFooter(
        ctx,
        api,
        'Declared shape illustration · mapping success is a separate gate from compatibility',
      );
      return;
    }
  });
}
export default {
  id: 'auto',
  draw: drawAuto,
  cues: [
    'auto-beat-1-focus-1',
    'auto-beat-1-focus-2',
    'hf-auto-0',
    'auto-beat-2-focus-1',
    'auto-beat-2-focus-2',
    'hf-auto-1',
    'auto-beat-3-focus-1',
    'auto-beat-3-focus-2',
    'hf-auto-2',
  ],
};
