import { sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';
export function drawOpening(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('opening', state);
  {
    const x = 310,
      scale = 64,
      afterVisible = (state.beat ?? 0) > 0;
    text(
      ctx,
      api,
      'One partner’s runbooks · define onboarding start and finish',
      960,
      300,
      32,
      themeColors.blue,
      'center',
    );
    api.line(ctx, x, 600, x + 20 * scale, 600, themeColors.muted, 2);
    [0, 5, 10, 15, 20].forEach((day) => {
      api.line(ctx, x + day * scale, 590, x + day * scale, 610, themeColors.muted, 2);
      text(ctx, api, String(day), x + day * scale, 650, 26, themeColors.muted, 'center');
    });
    api.focus.target('opening-source-onboarding-days', () => {
      api.rect(ctx, x, 380, 20 * scale, 65, themeColors.pink, undefined, 0);
      text(ctx, api, '20 days · earlier group', x + 10 * scale, 425, 32, themeColors.ink, 'center');
    });
    if (afterVisible)
      api.focus.target('opening-after', () => {
        api.rect(ctx, x, 490, 6 * scale, 65, themeColors.green, undefined, 0);
        text(ctx, api, '6 days', x + 3 * scale, 535, 31, themeColors.ink, 'center');
        text(
          ctx,
          api,
          'Synthetic comparison · later group',
          x + 6 * scale + 45,
          535,
          29,
          themeColors.green,
        );
      });
    api.focus.target('opening-latency', () => {
      if (afterVisible) {
        text(
          ctx,
          api,
          `lookup p95  ${modelState.project.latencyBeforeMs} → ${modelState.project.latencyAfterMs} ms`,
          960,
          770,
          36,
          themeColors.blue,
          'center',
        );
        text(
          ctx,
          api,
          `target  ${modelState.project.latencyTargetMs} ms`,
          960,
          850,
          31,
          themeColors.yellow,
          'center',
        );
      } else
        text(
          ctx,
          api,
          'Why did this onboarding take twenty days?',
          960,
          790,
          37,
          themeColors.yellow,
          'center',
        );
    });
    text(
      ctx,
      api,
      'Fictional project · observed comparison does not isolate its cause',
      960,
      965,
      28,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'opening',
  draw: drawOpening,
  cues: ['opening-beat-1-focus-1', 'opening-beat-2-focus-1', 'opening-beat-2-focus-2'],
};
