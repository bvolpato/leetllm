import { newChapterModel } from '../model.mjs';
import {
  chapterFooter,
  chapterLine,
  chapterText,
  chapterTitle,
  chapterVector,
} from '../defaults.mjs';
export function drawDataOwnership(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('data-ownership', state),
    { b: currentBeat } = modelState;
  const cueProgress = () => api.focus.progress('mg-data-ownership-b' + currentBeat, modelState.p),
    R = (id) => api.focus.progress('mg-' + id, state.cues ? 0 : modelState.p),
    done = (id) => R(id) >= 1;
  api.focus.target('mg-data-ownership-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat
        ? 'Actual sharding domains can be smaller than the full sync domain'
        : 'Ownership changes within the existing data population',
    );
    chapterText(
      ctx,
      api,
      'O optimizer · G gradient · P parameter',
      960,
      330,
      25,
      themeColors.muted,
      'center',
    );
    const steps = ['optimizer', 'gradients', 'parameters'],
      stage = Math.min(2, Math.floor(cueProgress() * 3));
    for (let d = 0; d < 4; d++) {
      chapterText(ctx, api, 'DP ' + d, 350 + d * 405, 380, 32, themeColors.cyan, 'center');
      for (let j = 0; j < 3; j++) {
        const domains = currentBeat && done('optimizer-domains'),
          shard = currentBeat ? j === 0 : j <= stage,
          labels = Array.from(
            {
              length: 4,
            },
            (_, k) =>
              shard && (domains ? Math.floor(k / 2) !== d % 2 : k !== d)
                ? '·'
                : steps[j].slice(0, 1).toUpperCase() + k,
          );
        chapterVector(
          ctx,
          api,
          labels,
          170 + d * 405,
          440 + j * 135,
          360,
          shard ? themeColors.pink : themeColors.blue,
        );
      }
    }
    if (currentBeat && done('optimizer-domains')) {
      chapterLine(ctx, api, 165, 900, 930, 900, themeColors.yellow, 4);
      chapterLine(ctx, api, 985, 900, 1750, 900, themeColors.yellow, 4);
      chapterText(ctx, api, 'instance 0', 550, 960, 29, themeColors.yellow, 'center');
      chapterText(
        ctx,
        api,
        'instance 1 · outer replication',
        1360,
        960,
        29,
        themeColors.yellow,
        'center',
      );
    } else
      chapterFooter(
        ctx,
        api,
        currentBeat
          ? 'Separate optimizer-instance illustration; gradients and model buffers stay replicated'
          : 'Model-parallel world size stays fixed; partition only the represented buffers',
      );
  });
  return true;
}
export default {
  id: 'data-ownership',
  draw: drawDataOwnership,
  cues: ['mg-data-ownership-b0', 'mg-fsdp-owned', 'mg-data-ownership-b1', 'mg-optimizer-domains'],
};
