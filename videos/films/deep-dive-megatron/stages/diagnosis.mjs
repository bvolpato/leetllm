import { newChapterModel } from '../model.mjs';
import {
  chapterArrow,
  chapterFooter,
  chapterLine,
  chapterTag,
  chapterText,
  chapterTitle,
} from '../defaults.mjs';
export function drawDiagnosis(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('diagnosis', state),
    { b: currentBeat } = modelState;
  const cueProgress = () => api.focus.progress('mg-diagnosis-b' + currentBeat, modelState.p);
  api.focus.target('mg-diagnosis-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat
        ? 'One sample retains all of its model-parallel dependencies'
        : 'Choose the split from the measured wall',
    );
    if (!currentBeat) {
      const options = [
        'Layer channels',
        'Layer ranges',
        'Sequence positions',
        'Independent samples',
        'Expert networks',
      ];
      for (let i = 0; i < 5; i++) {
        const x = 170 + i * 340,
          active = Math.min(4, Math.floor(cueProgress() * 5)) === i;
        chapterText(
          ctx,
          api,
          options[i],
          x + 145,
          400,
          27,
          active ? themeColors.yellow : themeColors.muted,
          'center',
        );
        for (let j = 0; j < 8; j++)
          for (let k = 0; k < 5; k++)
            api.rect(
              ctx,
              x + k * 55,
              465 + j * 43,
              47,
              35,
              active
                ? i === 4 && k === 0
                  ? themeColors.pink
                  : themeColors.blue
                : themeColors.panel,
              themeColors.muted,
              1,
            );
        if (active) {
          if (i === 0)
            for (let k = 1; k < 5; k++)
              chapterLine(
                ctx,
                api,
                x + k * 55 - 4,
                453,
                x + k * 55 - 4,
                812,
                themeColors.yellow,
                3,
              );
          if (i === 1)
            for (let j = 2; j < 8; j += 2)
              chapterLine(
                ctx,
                api,
                x - 10,
                465 + j * 43 - 5,
                x + 274,
                465 + j * 43 - 5,
                themeColors.yellow,
                3,
              );
          if (i === 2)
            chapterText(ctx, api, 'Q → remote K/V', x + 145, 875, 25, themeColors.cyan, 'center');
          if (i === 3)
            chapterText(ctx, api, 'new sample IDs', x + 145, 875, 25, themeColors.cyan, 'center');
          if (i === 4)
            chapterText(ctx, api, 'unequal queues', x + 145, 875, 25, themeColors.pink, 'center');
        }
      }
      chapterFooter(
        ctx,
        api,
        'Selective recomputation frees saved activations by repeating forward work',
      );
    } else {
      const names = ['sample S7', 'layer shard', 'next stage', 'remote context'],
        xs = [160, 580, 1000, 1420];
      names.forEach((v, i) => {
        chapterTag(ctx, api, v, xs[i], 490, 330, i ? themeColors.blue : themeColors.yellow);
        if (i) chapterArrow(ctx, api, xs[i - 1] + 330, 525, xs[i] - 15, 525);
      });
      chapterTag(ctx, api, 'independent S8', 160, 790, 330, themeColors.pink);
      chapterLine(ctx, api, 490, 825, 1750, 825, themeColors.pink);
      chapterFooter(
        ctx,
        api,
        'Adding data replicas supplies other samples; S7 still traverses its required work',
      );
    }
  });
  return true;
}
export default {
  id: 'diagnosis',
  draw: drawDiagnosis,
  cues: ['mg-diagnosis-b0', 'mg-diagnosis-b1'],
};
