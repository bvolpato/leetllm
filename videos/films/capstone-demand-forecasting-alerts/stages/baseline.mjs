import { sampleModel } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawBaseline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('baseline', state);
  {
    text(
      ctx,
      api,
      'Matching weekday and availability must both agree',
      960,
      280,
      35,
      themeColors.ink,
      'center',
    );
    const labels = ['Jan 25', 'Feb 1', 'Feb 8'];
    const days = [0, 7, 14];
    const dateX = (day) => 210 + day * 105;
    labels.forEach((v, i) => {
      const x = dateX(days[i]);
      api.focus.target('source-dates', () =>
        api.focus.target('origin-dates', () => api.circle(ctx, x, 500, 18, themeColors.blue)),
      );
      api.focus.target('source-dates', () =>
        api.focus.target('origin-dates', () =>
          text(ctx, api, v, x, 575, 29, themeColors.ink, 'center'),
        ),
      );
    });
    {
      modelState.baselineSearch = api.focus.progress('baseline-b2-1', modelState.baselineSearch);
      api.path(
        ctx,
        [
          {
            x: dateX(14),
            y: 460,
          },
          {
            x: dateX(14),
            y: 380,
          },
          {
            x: dateX(0),
            y: 380,
          },
          {
            x: dateX(0),
            y: 460,
          },
        ],
        {
          color: themeColors.cyan,
          width: 5,
        },
      );
      const search = dateX(7 * (1 - modelState.baselineSearch));
      api.focus.target('baseline-search', () =>
        api.circle(ctx, search, 380, 13, themeColors.yellow),
      );
      api.focus.target('baseline-lookup', () =>
        card(
          ctx,
          api,
          modelState.baselineSearch === 1
            ? 'Selected Jan 25 for Sunday Feb 8'
            : modelState.b
              ? 'Searching backward for a mature Sunday'
              : 'Feb 1 at issue time · count unfinished',
          430,
          700,
          1060,
          modelState.baselineSearch === 1 ? themeColors.green : themeColors.yellow,
        ),
      );
      api.focus.target('unfinished-day', () =>
        text(
          ctx,
          api,
          'Feb 1 has not finished at the Feb 1 morning origin',
          960,
          900,
          30,
          themeColors.pink,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'baseline',
  draw: drawBaseline,
  cues: ['baseline-b1-1', 'baseline-b1-2', 'baseline-b2-1', 'baseline-b2-2'],
};
