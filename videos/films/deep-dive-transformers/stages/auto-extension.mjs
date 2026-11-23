import { sampleModel } from '../model.mjs';
import { chapterArrow, chapterBox, chapterFooter, chapterTitle } from '../defaults.mjs';
export function drawAutoExtension(ctx, scene, state, api) {
  return api.focus.target('hf-auto-extension-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('auto-extension', state),
      { b: currentBeat, p: progress } = modelState;
    {
      chapterTitle(
        ctx,
        api,
        currentBeat === 0 ? 'Follow the llama key' : 'Look up an unknown family',
      );
      const names =
        currentBeat === 0
          ? [
              'Model type: llama',
              'Lazy config mapping',
              'Llama configuration',
              'Causal task mapping',
            ]
          : ['Tiny dict lookup', 'KeyError', 'Public AutoConfig', 'ValueError'];
      names.forEach((v, i) => {
        chapterBox(
          ctx,
          api,
          v,
          180 + (i % 2) * 870,
          390 + Math.floor(i / 2) * 320,
          730,
          i <= Math.floor(progress * 4) ? themeColors.cyan : themeColors.muted,
          110,
          28,
        );
        if (i % 2 === 0)
          chapterArrow(
            ctx,
            api,
            940,
            445 + Math.floor(i / 2) * 320,
            1010,
            445 + Math.floor(i / 2) * 320,
          );
      });
      chapterFooter(
        ctx,
        api,
        currentBeat === 0
          ? 'August 1 source: metadata dispatch precedes tensor restoration'
          : 'Modular contributor source can generate the imported model implementation',
      );
      return;
    }
  });
}
export default {
  id: 'auto-extension',
  draw: drawAutoExtension,
  cues: ['hf-auto-extension-0', 'hf-auto-extension-1'],
};
