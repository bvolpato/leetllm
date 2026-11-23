import { spokenProgress } from '../model.mjs';
import {
  chapterArrow,
  chapterFooter,
  chapterPanel,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawContinuationReset(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = (id, fallback = progress) => spokenProgress(state, id, fallback),
    done = (id) => q(id) >= 0.98;
  {
    chapterSubtitle(
      ctx,
      api,
      themeColors,
      'Selected identity survives; the learned gate and trainer state do not',
    );
    focusScope(ctx, api, 'lp-reset', () => {
      chapterPanel(
        ctx,
        api,
        themeColors,
        'selected H0 · learned gate .5',
        200,
        400,
        650,
        115,
        themeColors.blue,
        32,
      );
      chapterPanel(
        ctx,
        api,
        themeColors,
        done('lp-reset-gate') || beat ? 'same H0 · continuation gate 1' : 'continuation gate?',
        1070,
        400,
        650,
        115,
        themeColors.green,
        32,
      );
      chapterArrow(ctx, api, themeColors, 870, 455, 1040, 455, themeColors.yellow);
      chapterText(
        ctx,
        api,
        themeColors,
        'Gate training disabled · forward gating removed',
        960,
        625,
        31,
        themeColors.yellow,
        'center',
      );
    });
    focusScope(ctx, api, 'lp-optimizer', () => {
      if (beat === 1) {
        chapterPanel(
          ctx,
          api,
          themeColors,
          'estimate trainer · old moments',
          200,
          715,
          650,
          105,
          themeColors.muted,
          30,
        );
        chapterPanel(
          ctx,
          api,
          themeColors,
          'new continuation trainer',
          1070,
          715,
          650,
          105,
          themeColors.cyan,
          30,
        );
      }
    });
    focusScope(ctx, api, 'lp-rollback', () =>
      chapterFooter(
        ctx,
        api,
        themeColors,
        'Rollback requires original removed rows and original adapter state.',
      ),
    );
  }
}
export default {
  id: 'continuation-reset',
  draw: drawContinuationReset,
  cues: ['lp-reset-gate', 'lp-no-half', 'lp-new-trainer', 'lp-rollback'],
};
