import { onlineCueProgress } from '../construction.mjs';
import { zeroFailureUpper } from '../model.mjs';
import { axis, box, caption, text as constructionText, line } from '../defaults.mjs';
export function drawZeroIncidents(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'zero-incidents'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1;
  api.focus.target('oa-zero-incidents-mechanism', () => {
    const n = 100,
      bound = zeroFailureUpper(n),
      x = axis(
        ctx,
        api,
        260,
        740,
        1400,
        0,
        0.1,
        [0, 0.02, 0.04, 0.06, 0.08, 0.1],
        'Underlying incident probability p',
      );
    constructionText(
      ctx,
      api,
      '100 observations · 0 detected failures',
      960,
      290,
      36,
      themeColors.cyan,
      'center',
    );
    for (let i = 0; i < 100; i++)
      api.rect(
        ctx,
        230 + (i % 25) * 59,
        345 + Math.floor(i / 25) * 45,
        36,
        25,
        themeColors.blue,
        undefined,
        4,
      );
    constructionText(
      ctx,
      api,
      'P(0 failures | p) = (1 − p)¹⁰⁰',
      960,
      590,
      37,
      themeColors.cyan,
      'center',
    );
    if (resultComplete('solve', 1))
      constructionText(ctx, api, '(1 − p)¹⁰⁰ = .05', 960, 670, 34, themeColors.yellow, 'center');
    if (resultComplete('295', 1)) {
      line(ctx, api, x(bound), 705, x(bound), 770, themeColors.pink, 5);
      box(
        ctx,
        api,
        '95% one-sided upper bound: ' + (100 * bound).toFixed(2) + '%',
        520,
        835,
        880,
        80,
        themeColors.yellow,
        35,
      );
    }
    caption(ctx, api, 'Independent events and complete detection are required for this inversion');
  });
}
export default {
  id: 'zero-incidents',
  draw: drawZeroIncidents,
  cues: [
    'oa-zero-incidents-0',
    'oa-zero-incidents-probability',
    'oa-zero-incidents-1',
    'oa-zero-incidents-solve',
    'oa-zero-incidents-bound',
    'oa-zero-incidents-295',
    'oa-zero-incidents-2',
  ],
};
