import { sampleModel } from '../construction.mjs';
import { bar, card, text, visualFocus } from '../defaults.mjs';
export function drawRulebook(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('rulebook', state);
  {
    visualFocus(ctx, api, 'rulebook-simulation-11', () =>
      modelState.baselineCases.forEach((row, index) => {
        const y = 350 + index * 88;
        const reveal = modelState.step > 0;
        const ok = row.predicted === row.expected;
        card(
          ctx,
          api,
          row.text,
          225,
          y,
          870,
          66,
          reveal ? (ok ? themeColors.green : themeColors.pink) : themeColors.blue,
          22,
        );
        visualFocus(
          ctx,
          api,
          'rulebook-object-reveal-row-predicted-replaceall-expected-row-expec-13',
          () =>
            card(
              ctx,
              api,
              reveal
                ? row.predicted.replaceAll('_', ' ') + ' · expected ' + row.expected
                : 'inspect condition',
              1130,
              y,
              540,
              66,
              reveal ? (ok ? themeColors.green : themeColors.pink) : themeColors.muted,
              21,
            ),
        );
      }),
    );
    text(ctx, api, 'Three explicit keyword conditions', 960, 310, 27, themeColors.muted, 'center');
    bar(
      ctx,
      api,
      260,
      935,
      modelState.step === 0 ? 0 : modelState.baseline,
      6,
      themeColors.cyan,
      'correct routes',
      modelState.step === 0 ? 'inspect six reports' : modelState.baseline + ' / 6',
    );
  }
}
export default {
  id: 'rulebook',
  draw: drawRulebook,
  cues: [
    'rulebook-beat-1-focus-1',
    'rulebook-beat-2-focus-1',
    'rulebook-beat-3-focus-1',
    'rulebook-beat-3-focus-2',
  ],
};
