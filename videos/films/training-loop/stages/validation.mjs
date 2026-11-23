import { measuredValidation } from '../fixtures.mjs';
import { checkpointSnapshot } from '../construction.mjs';
import { card, optionalFocusTarget, text } from '../defaults.mjs';
export function drawValidation(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const phaseForBeat = (i) => (beat < i ? 0 : beat > i ? 1 : api.phase(progress, 0.04, 0.96));
  {
    const train = optionalFocusTarget(ctx, api, 'validation-object-training-model-train-43', () =>
      card(ctx, api, 'Training · model.train()', 220, 310, 570, 92, themeColors.blue),
    );
    const validation = optionalFocusTarget(
      ctx,
      api,
      'validation-object-validation-model-eval-44',
      () => card(ctx, api, 'Validation · model.eval()', 1130, 310, 570, 92, themeColors.green),
    );
    teaching.transfer({
      source: {
        shape: train,
        opacity: 1,
      },
      target: {
        shape: validation,
        opacity: 1,
      },
      color: themeColors.cyan,
      progress: phaseForBeat(0),
      particle: {
        fill: themeColors.yellow,
      },
    });
    optionalFocusTarget(ctx, api, 'validation-object-backward-optimizer-step-45', () =>
      card(ctx, api, 'backward + optimizer.step', 285, 455, 440, 72, themeColors.blue, 1, 28),
    );
    optionalFocusTarget(ctx, api, 'validation-measure-only', () =>
      card(
        ctx,
        api,
        'No gradient graph · measure only',
        1150,
        455,
        520,
        72,
        themeColors.green,
        1,
        28,
      ),
    );
    if (beat >= 1) {
      optionalFocusTarget(ctx, api, 'validation-selected-epoch', () =>
        card(
          ctx,
          api,
          'Selected epoch ' +
            measuredValidation.bestEpoch +
            ' · validation loss ' +
            measuredValidation.loss.toFixed(4),
          420,
          970,
          1080,
          70,
          themeColors.green,
          1,
          30,
        ),
      );
      const example = checkpointSnapshot(progress);
      text(
        ctx,
        api,
        'Copy semantics · source example adds 1 to zeroed parameters',
        960,
        605,
        28,
        themeColors.ink,
        'center',
      );
      [
        ['Live parameters', example.live, themeColors.pink],
        ['Plain dictionary view', example.plain, themeColors.yellow],
        ['Copied checkpoint', example.copied, themeColors.green],
      ].forEach(([label, values, color], i) => {
        optionalFocusTarget(
          ctx,
          api,
          ['validation-live-parameters', 'validation-plain-view', 'validation-copied-checkpoint'][
            i
          ],
          () => {
            const center = 375 + i * 585;
            text(ctx, api, label, center, 670, 28, color, 'center');
            teaching.grid({
              x: center - 170,
              y: 710,
              width: 340,
              height: 150,
              rows: 2,
              columns: 2,
              labels: values.map((row) => row.map((v) => v.toFixed(2))),
              fontSize: 33,
              padding: 8,
              fill: themeColors.panel,
              stroke: color,
              textColor: color,
            });
          },
        );
      });
      text(
        ctx,
        api,
        'The plain view follows live storage; the copied values stay fixed.',
        960,
        905,
        28,
        themeColors.yellow,
        'center',
      );
    }
    {
    }
  }
}
export default {
  id: 'validation',
  draw: drawValidation,
  cues: [
    'validation-beat-1-focus-1',
    'validation-beat-1-focus-2',
    'validation-beat-2-focus-1',
    'validation-beat-2-focus-2',
    'validation-live-view',
  ],
};
