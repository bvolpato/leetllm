import { newChapterModel } from '../model.mjs';
import { chapterFooter, chapterTag, chapterText, chapterTitle } from '../defaults.mjs';
export function drawFitBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('fit-boundary', state),
    { b: currentBeat } = modelState;
  const cueProgress = () => api.focus.progress('mg-fit-boundary-b' + currentBeat, modelState.p);
  api.focus.target('mg-fit-boundary-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat
        ? 'Require the same batch, update and recovery contracts'
        : 'Cluster ownership is useful when its operational cost is justified',
    );
    if (!currentBeat) {
      chapterTag(ctx, api, 'workload fits one GPU', 190, 410, 650, themeColors.green, 120);
      chapterTag(ctx, api, 'requires cluster partition', 1080, 410, 650, themeColors.blue, 120);
      for (let i = 0; i < 4; i++)
        api.rect(ctx, 1110 + i * 145, 650, 120, 140, themeColors.panel, themeColors.blue, 2);
      chapterText(ctx, api, 'shorter iteration path', 515, 760, 34, themeColors.green, 'center');
      chapterFooter(
        ctx,
        api,
        'Compatible model shapes, builders, routing and state mapping are still required',
      );
    } else {
      const checks = [
        'fixed batch',
        'gradient / next step',
        'route / positions',
        'validation slice',
        'recovery',
      ];
      checks.forEach((v, i) => {
        const x = 180 + i * 345;
        chapterTag(ctx, api, v, x, 490, 300, themeColors.blue, 130);
        if (i < Math.floor(cueProgress() * 6))
          chapterText(ctx, api, 'compare', x + 150, 800, 29, themeColors.cyan, 'center');
      });
      chapterFooter(
        ctx,
        api,
        'Use Compute Sanitizer to investigate kernel memory and synchronization errors',
      );
    }
  });
  return true;
}
export default {
  id: 'fit-boundary',
  draw: drawFitBoundary,
  cues: ['mg-fit-boundary-b0', 'mg-fit-boundary-b1'],
};
