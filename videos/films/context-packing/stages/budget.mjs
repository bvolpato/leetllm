import { sampleModel } from '../construction.mjs';
import { allocationStrip, text } from '../defaults.mjs';
export function drawBudget(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const modelState = sampleModel('budget', state),
    currentBeat = modelState.step;
  {
    api.focus.target('budget-32-total-context-units-assigned-packet-sizes', () =>
      text(
        ctx,
        api,
        '32 total context units · assigned packet sizes',
        140,
        280,
        32,
        themeColors.muted,
      ),
    );
    if (currentBeat === 0) {
      api.focus.target('budget-field-grid', () =>
        teaching.grid({
          x: 140,
          y: 450,
          width: 1600,
          height: 160,
          rows: 1,
          columns: 32,
          fill: themeColors.panel,
          stroke: themeColors.muted,
          highlights: Array.from(
            {
              length: 8,
            },
            (_, i) => ({
              row: 0,
              column: 24 + i,
              fill: themeColors.pink,
              opacity: 0.6,
            }),
          ),
        }),
      );
      api.focus.target('budget-24-available-input-units', () =>
        text(ctx, api, '24 available input units', 140, 735, 34, themeColors.ink),
      );
      api.focus.target('budget-8-reserved-output-units', () =>
        text(ctx, api, '8 reserved output units', 1240, 735, 29, themeColors.pink),
      );
    } else {
      allocationStrip(ctx, api, 'budget', [], 470);
      api.focus.target('budget-16-units-remain-for-optional-input', () =>
        text(ctx, api, '16 units remain for optional input', 140, 835, 36, themeColors.green),
      );
    }
    api.focus.target('budget-equation', () =>
      api.math(
        ctx,
        String.raw`L_{\mathrm{input}}+L_{\mathrm{output\ reserve}}\le L_{\mathrm{window}}`,
        960,
        955,
        39,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'budget',
  draw: drawBudget,
  cues: [
    'context-limit',
    'output-reservation',
    'required-packets',
    'optional-history',
    'prefix-context',
    'final-budget',
  ],
};
