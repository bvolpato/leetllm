import { sampleModel } from '../model.mjs';
import { completed } from '../replay.mjs';
import { chapterBox, chapterGrid, chapterTitle } from '../defaults.mjs';
export function drawOutputContract(ctx, scene, state, api) {
  return api.focus.target('hf-output-contract-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('output-contract', state),
      { b: currentBeat } = modelState;
    {
      chapterTitle(ctx, api, 'Named fields preserve meaning when optional fields appear');
      if (currentBeat === 0) {
        const labeled = completed(state, 0, 'hf-output-contract-0');
        chapterGrid(
          ctx,
          api,
          [
            ['Field', 'Before labels', 'After labels'],
            ['loss', 'None', labeled ? 'scalar' : ''],
            ['logits', 'scores', labeled ? 'scores' : ''],
            ['cache', 'KV state', labeled ? 'KV state' : ''],
          ],
          260,
          390,
          1400,
          320,
          themeColors.cyan,
        );
        chapterBox(
          ctx,
          api,
          labeled ? 'output[0] → loss' : 'output[0] → logits',
          490,
          820,
          940,
          themeColors.yellow,
          100,
          36,
        );
      } else {
        chapterBox(ctx, api, 'output.logits → scores', 260, 420, 1400, themeColors.green, 130, 45);
        chapterGrid(
          ctx,
          api,
          [
            ['Causal head', 'batch × sequence × vocabulary'],
            ['Other task head', 'its own shape and supervision'],
          ],
          260,
          700,
          1400,
          210,
          themeColors.cyan,
          29,
        );
      }
      return;
    }
  });
}
export default {
  id: 'output-contract',
  draw: drawOutputContract,
  cues: ['hf-output-contract-0', 'hf-output-contract-1'],
};
