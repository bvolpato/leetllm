import { limit } from '../construction.mjs';
import { servingReceipt } from '../model.mjs';
import { box, footer, requestCohort, title } from '../defaults.mjs';
export function drawRequestDenominator(ctx, scene, state, api) {
  api.focus.target('request-denominator-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = limit(state.beatP ?? 0);
    {
      title(ctx, api, 'Every offered identity remains in the population');
      requestCohort(ctx, api);
      const r = servingReceipt();
      const terms =
        currentBeat === 0
          ? ['6 offered', '3 qualified', '2 criterion failures', '1 timeout']
          : currentBeat === 1
            ? [`${r.qualified}/6 = 50%`, `${r.success}/2.5 = 2 /s`, `${r.qualified}/2.5 = 1.2 /s`]
            : ['arrival window: 2 s', 'outcome horizon: 2.5 s', 'offered: 6/2 = 3 /s'];
      api.focus.target('request-denominator-math-3-6-50-qquad-5-2-5-2qquad-3-2-5-1-2', () =>
        terms.forEach((v, i) =>
          box(
            ctx,
            api,
            v,
            190 + i * (1540 / terms.length),
            900,
            1450 / terms.length,
            75,
            [themeColors.blue, themeColors.green, themeColors.yellow, themeColors.red][i],
            28,
          ),
        ),
      );
      footer(
        ctx,
        api,
        'Cyan: actual send · pale marks: observed tokens · colored endpoint: terminal',
      );
    }
    return true;
  });
}
export default {
  id: 'request-denominator',
  draw: drawRequestDenominator,
  cues: [
    'request-denominator-beat-1-focus-1',
    'request-denominator-beat-2-focus-1',
    'request-denominator-beat-3-focus-1',
  ],
};
