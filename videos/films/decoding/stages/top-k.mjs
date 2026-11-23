import { WORDS } from '../fixtures.mjs';
import { truncationState } from '../model.mjs';
import { originalBars, originalMath, originalText } from '../defaults.mjs';
export function drawTopK(ctx, scene, state, api) {
  const { C: themeColors } = api;
  {
    const { values, sum } = truncationState('top-k', state);
    api.focus.target('retained-candidates', () =>
      originalBars(
        ctx,
        api,
        values,
        WORDS.map((_, i) => (i < 2 ? themeColors.green : themeColors.muted)),
      ),
    );
    api.focus.target('retained-mass', () =>
      originalMath(ctx, api, String.raw`0.45+0.25=0.70`, 960, 950, 46, themeColors.green, 'center'),
    );
    originalText(
      ctx,
      api,
      `Current sampling weight: ${sum.toFixed(3)}`,
      960,
      1020,
      28,
      themeColors.muted,
      'center',
    );
    return;
  }
}
export default {
  id: 'top-k',
  draw: drawTopK,
  cues: ['top-k-b1-1', 'top-k-b2-1', 'top-k-b2-2', 'top-k-b3-1'],
};
