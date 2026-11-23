import { resultDone } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import {
  chapterBox,
  chapterFooter,
  chapterGrid,
  chapterMath,
  chapterRows,
  chapterText,
  chapterTitle,
} from '../defaults.mjs';
export function drawProcessors(ctx, scene, state, api) {
  return api.focus.target('hf-processors-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('processors', state),
      { b: currentBeat } = modelState,
      done = (name) => resultDone(state, name);
    {
      chapterTitle(
        ctx,
        api,
        currentBeat === 0
          ? 'Named modality tensors align with placeholders'
          : currentBeat === 1
            ? 'Same input pixel · changed normalization'
            : 'Sample rate is an explicit input contract',
      );
      if (currentBeat === 0) {
        chapterGrid(
          ctx,
          api,
          [
            ['Text', 'image placeholder'],
            ['Image', 'pixel values + shape'],
            ['Processor', 'model-compatible named fields'],
          ],
          260,
          400,
          1400,
          270,
          themeColors.cyan,
        );
        chapterText(ctx, api, '“Describe this chart.”', 960, 870, 35, themeColors.yellow, 'center');
      } else if (currentBeat === 1) {
        chapterBox(ctx, api, 'Raw pixel x = 1', 180, 410, 630, themeColors.blue);
        chapterBox(ctx, api, 'Same raw pixel x = 1', 1090, 410, 650, themeColors.blue);
        chapterMath(ctx, api, String.raw`x-0.5=0.5`, 495, 700, 49, themeColors.cyan);
        chapterMath(
          ctx,
          api,
          done('pixel-result') ? String.raw`x-0=1` : String.raw`x-0=?`,
          1415,
          700,
          49,
          themeColors.pink,
        );
        chapterFooter(
          ctx,
          api,
          'Also retain resize, dtype, shape and placeholder-count expectations',
        );
      } else
        chapterRows(
          ctx,
          api,
          [
            ['Supplied source rate', '8 kHz'],
            ['Declared extractor input', '16 kHz'],
            ['Admission action', 'Resample explicitly or reject mismatch'],
          ],
          390,
          165,
        );
      return;
    }
  });
}
export default {
  id: 'processors',
  draw: drawProcessors,
  cues: ['hf-processors-0', 'hf-processors-1', 'hf-pixel-result', 'hf-processors-2'],
};
