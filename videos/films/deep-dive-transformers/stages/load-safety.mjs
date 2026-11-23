import { sampleModel } from '../model.mjs';
import { chapterBox, chapterFooter, chapterRows, chapterText, chapterTitle } from '../defaults.mjs';
export function drawLoadSafety(ctx, scene, state, api) {
  return api.focus.target('hf-load-safety-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('load-safety', state),
      { b: currentBeat } = modelState;
    {
      chapterTitle(
        ctx,
        api,
        currentBeat === 0
          ? 'Auto dtype resolves saved precision'
          : currentBeat === 1
            ? 'Two files in one snapshot'
            : 'Check family support before importing custom code',
      );
      if (currentBeat === 0) {
        chapterRows(
          ctx,
          api,
          [
            ['Saved config dtype', 'Present → use saved dtype'],
            ['No config dtype', 'First floating weight supplies fallback'],
            ['Actual run', 'Inspect loaded parameter dtype'],
          ],
          390,
          165,
        );
      } else if (currentBeat === 1) {
        chapterBox(ctx, api, 'Safetensors file', 180, 430, 630, themeColors.blue);
        chapterBox(ctx, api, 'Custom Python import', 1090, 430, 650, themeColors.pink);
        chapterText(ctx, api, 'Tensor parser', 495, 680, 36, themeColors.cyan, 'center');
        api.text(ctx, 'trust_remote_code', 1415, 680, 36, themeColors.pink, 'center', 'mono');
        chapterText(
          ctx,
          api,
          'Check tensor names and shapes. Review the code and its permissions.',
          960,
          900,
          34,
          themeColors.yellow,
          'center',
        );
      } else
        chapterRows(
          ctx,
          api,
          [
            ['Exact model + code revisions', 'Inspect dependencies and rights'],
            ['Constrained execution', 'Test the real output contract'],
            ['Unknown family', 'Resolve support before enabling code'],
          ],
          390,
          165,
        );
      chapterFooter(ctx, api, 'Loading guide · November 7, 2026');
      return;
    }
  });
}
export default {
  id: 'load-safety',
  draw: drawLoadSafety,
  cues: ['hf-load-safety-0', 'hf-load-safety-1', 'hf-load-safety-2'],
};
