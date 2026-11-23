import { sampleModel } from '../model.mjs';
import { auditFocusApi, card, text, visualFocus } from '../defaults.mjs';
export function drawExposure(ctx, scene, state, api) {
  api = auditFocusApi(api, scene);
  const { C: themeColors } = api;
  const modelState = sampleModel('exposure', state),
    currentBeat = modelState.step,
    progress = modelState.p;
  {
    visualFocus(
      ctx,
      api,
      'exposure-object-tuning-snapshot-march-31-track-development-access--25',
      () =>
        text(
          ctx,
          api,
          'Tuning snapshot: March 31 · track development access separately',
          960,
          255,
          30,
          themeColors.ink,
          'center',
        ),
    );
    api.path(
      ctx,
      [
        {
          x: 130,
          y: 790,
        },
        {
          x: 130,
          y: 830,
        },
        {
          x: 920,
          y: 830,
        },
        {
          x: 920,
          y: 790,
        },
      ],
      {
        color: themeColors.yellow,
        width: 3,
      },
    );
    api.path(
      ctx,
      [
        {
          x: 1030,
          y: 790,
        },
        {
          x: 1030,
          y: 830,
        },
        {
          x: 1790,
          y: 830,
        },
        {
          x: 1790,
          y: 790,
        },
      ],
      {
        color: themeColors.green,
        width: 3,
      },
    );
    visualFocus(ctx, api, 'exposure-simulation-28', () =>
      modelState.rows.forEach((row) =>
        visualFocus(ctx, api, 'exposure-object-case-29', () =>
          card(
            ctx,
            api,
            `Case ${row.id} · ${row.date}\n${row.used ? 'used in development' : 'no development use'}`,
            row.x,
            row.y,
            330,
            row.used ? themeColors.yellow : themeColors.cyan,
            110,
            25,
          ),
        ),
      ),
    );
    text(
      ctx,
      api,
      `Regression · ${modelState.regression} cases`,
      525,
      890,
      30,
      themeColors.yellow,
      'center',
    );
    text(
      ctx,
      api,
      `Holdout candidates · ${modelState.holdout} cases`,
      1410,
      890,
      30,
      themeColors.green,
      'center',
    );
    text(
      ctx,
      api,
      `Settled: ${modelState.regression + modelState.holdout} · in flight / unassigned: ${modelState.rows.filter((row) => !row.settled).length}`,
      960,
      980,
      27,
      themeColors.muted,
      'center',
    );
    {
    }
  }
}
export default {
  id: 'exposure',
  draw: drawExposure,
  cues: [
    'exposure-beat-1-focus-1',
    'exposure-beat-1-focus-2',
    'exposure-beat-2-focus-1',
    'exposure-beat-2-focus-2',
    'exposure-beat-3-focus-1',
  ],
};
