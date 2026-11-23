import { inverse } from '../arithmetic.mjs';
import { equation, optionalFocusTarget, text } from '../defaults.mjs';
export function drawOverlap(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i, a = 0.08, z = 0.86) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const F = api.components.fade;
  {
    if (currentBeat < 2) {
      const propensity = api.lerp(0.1, 0.005, phaseForBeat(1)),
        weights = [inverse(propensity), 1 / (1 - propensity)];
      optionalFocusTarget(ctx, api, 'overlap-object-distribution-overlap-40', () =>
        api.teaching.bars({
          x: 250,
          y: 390,
          width: 850,
          height: 370,
          values: weights,
          labels: ['rare assignment', 'common assignment'],
          colors: [themeColors.yellow, themeColors.blue],
          max: 210,
          showValues: true,
          format: (v) => v.toFixed(1),
          fontSize: 30,
        }),
      );
      equation(ctx, api, 'w=1/e(R)', 1300, 600, 54, themeColors.yellow);
      optionalFocusTarget(ctx, api, 'overlap-object-rare-assignment-probability-42', () =>
        text(
          ctx,
          api,
          `rare assignment probability ${propensity.toFixed(3)}`,
          1450,
          805,
          30,
          themeColors.muted,
          'center',
        ),
      );
      {
      }
    } else {
      api.teaching.flowGraph({
        nodes: [
          {
            focusTarget: 'overlap-node-risk',
            id: 'risk',
            label: 'target risk group',
            x: 230,
            y: 470,
            width: 380,
            height: 110,
            color: themeColors.yellow,
          },
          {
            id: 'a',
            label: 'assistant observed',
            x: 1190,
            y: 310,
            width: 470,
            height: 110,
            color: themeColors.cyan,
          },
          {
            id: 'c',
            label: 'control unsupported',
            x: 1190,
            y: 700,
            width: 470,
            height: 110,
            color: themeColors.red,
          },
        ],
        edges: [
          {
            from: 'risk',
            to: 'a',
            progress: phaseForBeat(2),
            color: themeColors.cyan,
          },
        ],
        fill: themeColors.panel,
        textColor: themeColors.ink,
      });
      {
      }
    }
  }
}
export default {
  id: 'overlap',
  draw: drawOverlap,
  cues: ['overlap-beat-1-focus-1', 'overlap-beat-2-focus-1', 'overlap-beat-3-focus-1'],
};
