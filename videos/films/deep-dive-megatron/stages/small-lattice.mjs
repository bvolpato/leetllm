import { meshCoordinate, newChapterModel } from '../model.mjs';
import { chapterEquation, chapterFooter, chapterText, chapterTitle } from '../defaults.mjs';
export function drawSmallLattice(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('small-lattice', state),
    { b: currentBeat } = modelState;
  const R = (id) => api.focus.progress('mg-' + id, state.cues ? 0 : modelState.p),
    done = (id) => R(id) >= 1;
  api.focus.target('mg-small-lattice-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat
        ? 'Expand the same coordinate contract to 64 ranks'
        : 'Eight ranks · tensor varies fastest',
    );
    const shape = currentBeat
        ? {
            tp: 4,
            cp: 2,
            dp: 4,
            pp: 2,
          }
        : {
            tp: 2,
            dp: 2,
            pp: 2,
          },
      world = currentBeat ? 64 : 8;
    const shown = currentBeat ? 8 + Math.floor(56 * R('world-sixty-four')) : 8;
    for (let r = 0; r < shown; r++) {
      const c = meshCoordinate(r, shape),
        x = 230 + c.tp * (currentBeat ? 120 : 170) + c.pp * 760,
        y = currentBeat ? 365 + c.dp * 60 + (c.cp ?? 0) * 280 : 400 + c.dp * 165;
      api.rect(
        ctx,
        x,
        y,
        currentBeat ? 95 : 145,
        currentBeat ? 45 : 100,
        r === 3 ? themeColors.yellow : themeColors.panel,
        r === 3 ? themeColors.yellow : themeColors.blue,
        2,
      );
      chapterText(
        ctx,
        api,
        String(r),
        x + (currentBeat ? 47 : 72),
        y + (currentBeat ? 31 : 62),
        currentBeat ? 26 : 34,
        r === 3 ? themeColors.bg : themeColors.ink,
        'center',
      );
    }
    if (!currentBeat) {
      chapterText(
        ctx,
        api,
        done('small-coordinate') ? 'rank 3 = (TP1, DP1, PP0)' : 'rank 3 coordinates: ?',
        960,
        840,
        33,
        themeColors.yellow,
        'center',
      );
      chapterText(
        ctx,
        api,
        done('small-partners')
          ? 'TP partner 2 · DP partner 1 · PP partner 7'
          : 'Vary one axis; keep all other coordinates fixed',
        960,
        925,
        30,
        themeColors.cyan,
        'center',
      );
    } else {
      for (let pp = 0; pp < 2; pp++) {
        chapterText(ctx, api, 'PP ' + pp, 410 + pp * 760, 335, 26, themeColors.cyan, 'center');
        chapterText(ctx, api, 'CP0', 175 + pp * 760, 485, 25, themeColors.cyan, 'center');
        chapterText(ctx, api, 'CP1', 175 + pp * 760, 765, 25, themeColors.cyan, 'center');
      }
      if (done('world-sixty-four'))
        chapterEquation(ctx, api, '4\\times2\\times4\\times2=64', 960, 930, 43);
      chapterFooter(
        ctx,
        api,
        'Strides [1,4,8,32] describe logical ranks; physical placement is separate',
      );
    }
  });
  return true;
}
export default {
  id: 'small-lattice',
  draw: drawSmallLattice,
  cues: [
    'mg-small-lattice-b0',
    'mg-small-coordinate',
    'mg-small-partners',
    'mg-small-lattice-b1',
    'mg-world-sixty-four',
  ],
};
