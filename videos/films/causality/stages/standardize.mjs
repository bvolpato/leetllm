import { standardizationState } from '../model.mjs';
import { bars, equation, optionalFocusTarget, text } from '../defaults.mjs';
export function drawStandardize(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i, a = 0.08, z = 0.86) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const F = api.components.fade;
  {
    const {
      mix,
      assistantWeight: wa,
      controlWeight: wc,
      assistant: a,
      control: c,
    } = standardizationState(currentBeat, progress);
    optionalFocusTarget(ctx, api, 'standardize-object-distribution-standardize-20', () =>
      bars(ctx, api, [a, c], ['assistant', 'control']),
    );
    optionalFocusTarget(ctx, api, 'standardize-object-weight-each-group-s-success-rate-21', () =>
      text(
        ctx,
        api,
        'Weight each group’s success rate',
        1450,
        465,
        28,
        themeColors.muted,
        'center',
      ),
    );
    equation(
      ctx,
      api,
      `${wa.toFixed(2)}(0.9)+${(1 - wa).toFixed(2)}(0.5)=${a.toFixed(2)}`,
      1190,
      570,
      40,
      themeColors.cyan,
    );
    equation(
      ctx,
      api,
      `${wc.toFixed(2)}(0.8)+${(1 - wc).toFixed(2)}(0.4)=${c.toFixed(2)}`,
      1190,
      715,
      40,
      themeColors.pink,
    );
    equation(
      ctx,
      api,
      `\\Delta=${(100 * (a - c)).toFixed(0)}\\;points`,
      1290,
      870,
      48,
      themeColors.yellow,
    );
    api.line(ctx, 250, 900, 1100, 900, themeColors.muted, 5);
    optionalFocusTarget(ctx, api, 'standardize-object-250-850-mix-900-13-c-yellow-25', () =>
      api.circle(ctx, 250 + 850 * mix, 900, 13, themeColors.yellow),
    );
    text(ctx, api, 'align to the shared 70/30 target', 675, 855, 28, themeColors.muted, 'center');
    F(phaseForBeat(1), () =>
      optionalFocusTarget(
        ctx,
        api,
        'standardize-object-exchangeability-overlap-well-defined-outcomes-27',
        () =>
          text(
            ctx,
            api,
            'Exchangeability + overlap + well-defined outcomes',
            960,
            965,
            32,
            themeColors.ink,
            'center',
          ),
      ),
    );
  }
}
export default {
  id: 'standardize',
  draw: drawStandardize,
  cues: [
    'standardize-beat-1-focus-1',
    'standardize-beat-1-focus-2',
    'standardize-beat-2-focus-1',
    'standardize-beat-2-focus-2',
    'standardize-beat-3-focus-1',
  ],
};
