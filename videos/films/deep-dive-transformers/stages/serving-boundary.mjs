import { sampleModel } from '../model.mjs';
import {
  chapterArrow,
  chapterBox,
  chapterFooter,
  chapterGrid,
  chapterTitle,
} from '../defaults.mjs';
export function drawServingBoundary(ctx, scene, state, api) {
  return api.focus.target('hf-serving-boundary-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('serving-boundary', state),
      { b: currentBeat, p: progress } = modelState;
    {
      chapterTitle(
        ctx,
        api,
        currentBeat === 0
          ? 'Task wrapper is not an unlimited request scheduler'
          : currentBeat === 1
            ? 'Supported native serving adds explicit admission'
            : 'Different engines retain their own runtime contracts',
      );
      const names =
        currentBeat === 0
          ? ['Preprocess', 'Model forward', 'Task postprocess']
          : currentBeat === 1
            ? ['Queue + admission', 'Active request batch', 'KV ownership']
            : ['vLLM / SGLang', 'Supported architecture', 'Actual version + policy'];
      names.forEach((v, i) => {
        chapterBox(
          ctx,
          api,
          v,
          170 + i * 580,
          430,
          500,
          i <= Math.floor(progress * 3) ? themeColors.cyan : themeColors.muted,
          130,
          29,
        );
        if (i < 2) chapterArrow(ctx, api, 695 + i * 580, 495, 725 + i * 580, 495);
      });
      if (currentBeat === 1) {
        chapterGrid(
          ctx,
          api,
          [
            ['Iteration', 'Request A', 'Request B', 'Request C'],
            ['1', 'active', 'active', 'queued'],
            ['2', 'finished', 'active', progress > 0.5 ? 'admitted' : 'queued'],
          ],
          270,
          710,
          1380,
          210,
          themeColors.blue,
          27,
        );
      } else
        chapterFooter(
          ctx,
          api,
          'Measure the complete pinned backend and workload; a model definition is one component',
        );
      return;
    }
  });
}
export default {
  id: 'serving-boundary',
  draw: drawServingBoundary,
  cues: ['hf-serving-boundary-0', 'hf-serving-boundary-1', 'hf-serving-boundary-2'],
};
