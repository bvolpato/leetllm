import { sampleModel } from '../construction.mjs';
import { card, text as originalText } from '../defaults.mjs';
export function drawShip(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('ship', state),
    currentBeat = modelState.step;
  {
    const cue = modelState.safety ? 'ship-beat-1-focus-1' : 'ship-beat-2-focus-1',
      progress = api.focus.progress(cue, 0),
      complete = progress === 1,
      missingIntroduced = !modelState.safety && progress > 0;
    api.focus.target('ship-required-safety-margin-0-05-percentage-points', () =>
      card(
        ctx,
        api,
        'Required safety margin: −0.05 percentage points',
        170,
        320,
        1580,
        themeColors.yellow,
        110,
        40,
      ),
    );
    api.focus.target(
      'ship-s-safety-observed-interval-0-12-0-02-points-required-safety-telemetr',
      () =>
        card(
          ctx,
          api,
          modelState.safety
            ? 'Observed interval: [−0.12, +0.02] points'
            : missingIntroduced
              ? 'Required safety telemetry: MISSING'
              : 'Required safety telemetry: checking',
          170,
          530,
          1580,
          complete ? themeColors.pink : missingIntroduced ? themeColors.yellow : themeColors.blue,
          110,
          40,
        ),
    );
    originalText(
      ctx,
      api,
      complete
        ? modelState.safety
          ? 'Interval permits harm beyond the registered margin'
          : 'Window remains inconclusive'
        : 'Required evidence check pending',
      960,
      790,
      42,
      complete ? themeColors.pink : themeColors.muted,
      'center',
    );
    if (complete)
      originalText(ctx, api, 'HOLD PROMOTION', 960, 925, 54, themeColors.yellow, 'center');
  }
}
export default {
  id: 'ship',
  draw: drawShip,
  cues: ['ship-beat-1-focus-1', 'ship-beat-2-focus-1'],
};
