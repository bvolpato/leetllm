import { sampleModel } from './construction.mjs';
import { text as originalText, card } from './defaults.mjs';
export function drawUnrecognizedOriginal(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    s = sampleModel(scene.id, state),
    b = s.step;
  {
    const cue = s.safety ? 'ship-beat-1-focus-1' : 'ship-beat-2-focus-1',
      progress = api.focus.progress(cue, 0),
      complete = progress === 1,
      missingIntroduced = !s.safety && progress > 0;
    api.focus.target('ship-required-safety-margin-0-05-percentage-points', () =>
      card(
        ctx,
        api,
        'Required safety margin: −0.05 percentage points',
        170,
        320,
        1580,
        C.yellow,
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
          s.safety
            ? 'Observed interval: [−0.12, +0.02] points'
            : missingIntroduced
              ? 'Required safety telemetry: MISSING'
              : 'Required safety telemetry: checking',
          170,
          530,
          1580,
          complete ? C.pink : missingIntroduced ? C.yellow : C.blue,
          110,
          40,
        ),
    );
    originalText(
      ctx,
      api,
      complete
        ? s.safety
          ? 'Interval permits harm beyond the registered margin'
          : 'Window remains inconclusive'
        : 'Required evidence check pending',
      960,
      790,
      42,
      complete ? C.pink : C.muted,
      'center',
    );
    if (complete) originalText(ctx, api, 'HOLD PROMOTION', 960, 925, 54, C.yellow, 'center');
  }
}
export function drawUnrecognizedConstruction(ctx, scene, state, api) {
  const { C } = api,
    B = state.beat ?? 0,
    id = scene.id;
  api.focus.target(`oa-${id}-mechanism`, () => {
    throw new Error('No online experiment construction ' + id);
  });
}
