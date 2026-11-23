import { sampleModel } from '../model.mjs';
import { chapterBox, chapterFooter, chapterGrid, chapterRows, chapterTitle } from '../defaults.mjs';
export function drawFourContracts(ctx, scene, state, api) {
  return api.focus.target('hf-four-contracts-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('four-contracts', state),
      { b: currentBeat, p: progress } = modelState;
    {
      chapterTitle(ctx, api, 'Four independent agreements around one artifact');
      const names = [
        'Snapshot identity',
        'Config + architecture',
        'Parameter restoration',
        'Input/output semantics',
      ];
      names.forEach((name, i) =>
        chapterBox(
          ctx,
          api,
          name,
          180 + i * 425,
          385,
          370,
          i <= Math.floor(progress * 4) ? themeColors.cyan : themeColors.muted,
          110,
          25,
        ),
      );
      if (currentBeat === 0) {
        chapterGrid(
          ctx,
          api,
          [
            ['Artifact', 'Parse', 'Compatible meaning'],
            ['weights.safetensors', 'valid', 'still pending'],
          ],
          280,
          650,
          1360,
          190,
          themeColors.blue,
          28,
        );
      } else if (currentBeat === 1) {
        chapterGrid(
          ctx,
          api,
          [
            ['Embedding rows', 'Configuration', 'Supplied shard'],
            ['Shape failure', '32,000', '32,001'],
            ['Same-shape custom class', 'matches shape', 'position rule differs'],
          ],
          220,
          610,
          1480,
          240,
          themeColors.pink,
          28,
        );
      } else
        chapterRows(
          ctx,
          api,
          [
            ['Parse error', 'Artifact integrity', themeColors.pink],
            ['Unknown / missing / size', 'Class, index or architecture'],
            ['Roles / precision', 'Preprocessing or dtype'],
          ],
          590,
          130,
        );
      chapterFooter(ctx, api, 'Preserve the first actual error before changing another boundary');
      return;
    }
  });
}
export default {
  id: 'four-contracts',
  draw: drawFourContracts,
  cues: ['hf-four-contracts-0', 'hf-four-contracts-1', 'hf-four-contracts-2'],
};
