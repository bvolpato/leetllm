import { sampleModel } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawOrigins(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('origins', state);
  {
    text(ctx, api, 'Expand history only as labels mature', 960, 280, 35, themeColors.ink, 'center');
    const labels = ['Jan 31', 'Feb 1', 'Feb 6', 'Feb 7', 'Feb 8', 'Feb 9'];
    const days = [0, 1, 6, 7, 8, 9];
    const dateX = (day) => 210 + day * 160;
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
      const boundary = dateX(modelState.originDay);
      api.focus.target('issue-boundary', () =>
        api.line(ctx, boundary, 380, boundary, 535, themeColors.yellow, 4),
      );
      text(
        ctx,
        api,
        modelState.originProgress === 0
          ? 'Origin 1 · 62 mature days'
          : modelState.originProgress === 1
            ? 'Origin 2 · 68 mature days'
            : 'Advancing to Origin 2 · fit pending',
        960,
        350,
        30,
        themeColors.yellow,
        'center',
      );
      api.focus.target('origin-one', () =>
        card(ctx, api, 'Origin 1 reference · 62 mature days', 260, 700, 570, themeColors.blue),
      );
      api.focus.target('origin-two', () =>
        card(
          ctx,
          api,
          modelState.originTrainingDays === 68
            ? 'Origin 2 fitted · 68 mature days'
            : 'Origin 2 fit pending',
          1080,
          700,
          570,
          themeColors.cyan,
        ),
      );
      api.focus.target('delayed-count', () =>
        text(
          ctx,
          api,
          'Feb 7 count becomes readable on Feb 9',
          960,
          900,
          32,
          themeColors.pink,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'origins',
  draw: drawOrigins,
  cues: ['origins-b1-1', 'origins-b1-2', 'origins-b2-1', 'origins-b2-2'],
};
