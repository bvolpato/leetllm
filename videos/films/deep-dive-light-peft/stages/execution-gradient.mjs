import { spokenProgress } from '../model.mjs';
import {
  chapterArrow,
  chapterFooter,
  chapterMath,
  chapterPanel,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawExecutionGradient(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const q = (id, fallback = progress2) => spokenProgress(state, id, fallback),
    done = (id) => q(id) >= 0.98;
  {
    chapterSubtitle(
      ctx,
      api,
      themeColors,
      'A frozen operation can still carry an input derivative',
    );
    const xs = [170, 570, 970, 1370];
    ['earlier adapter', 'frozen linear W', 'later layers', 'loss'].forEach((s, i) =>
      chapterPanel(
        ctx,
        api,
        themeColors,
        s,
        xs[i],
        410,
        325,
        105,
        i === 1 ? themeColors.blue : i === 3 ? themeColors.yellow : themeColors.cyan,
      ),
    );
    for (let i = 0; i < 3; i++)
      chapterArrow(ctx, api, themeColors, xs[i] + 325, 460, xs[i + 1] - 15, 460, themeColors.blue);
    focusScope(ctx, api, 'lp-dependency', () => {
      const progress = beat > 0 ? 1 : q('lp-dependency');
      for (let i = 0; i < 3; i++)
        chapterArrow(
          ctx,
          api,
          themeColors,
          xs[3 - i],
          610,
          xs[2 - i] + 325,
          610,
          themeColors.pink,
          progress,
        );
      chapterText(
        ctx,
        api,
        themeColors,
        'input derivative travels through W',
        960,
        685,
        32,
        themeColors.pink,
        'center',
      );
    });
    focusScope(ctx, api, 'lp-state', () => {
      const noState = beat > 0 || done('lp-no-state');
      chapterPanel(
        ctx,
        api,
        themeColors,
        noState ? 'W gradient: absent' : 'W gradient?',
        500,
        755,
        430,
        85,
        noState ? themeColors.muted : themeColors.blue,
      );
      chapterPanel(
        ctx,
        api,
        themeColors,
        noState ? 'W Adam state: absent' : 'W optimizer state?',
        1000,
        755,
        430,
        85,
        noState ? themeColors.muted : themeColors.blue,
      );
    });
    focusScope(ctx, api, 'lp-formula', () => {
      if (beat === 1)
        chapterMath(
          ctx,
          api,
          themeColors,
          String.raw`4d^2+2dm\quad\text{projection pairs / token}`,
          960,
          940,
          40,
        );
    });
    if (beat === 0)
      chapterFooter(
        ctx,
        api,
        themeColors,
        'Update ownership and backward dependency are different contracts.',
      );
  }
}
export default {
  id: 'execution-gradient',
  draw: drawExecutionGradient,
  cues: ['lp-dependency', 'lp-no-state', 'lp-dense-formula'],
};
