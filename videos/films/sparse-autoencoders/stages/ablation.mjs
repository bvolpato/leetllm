import { ablationState } from '../construction.mjs';
import { retainedDrawEquation, retainedDrawText } from '../defaults.mjs';
export function drawAblation(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0;
  {
    const current = ablationState(state),
      vals = current.values;
    retainedDrawText(
      ctx,
      api,
      !current.applied
        ? current.prediction
          ? 'Predict the feature edit · result pending'
          : 'Original activation · before edit'
        : currentBeat === 1
          ? 'Feature removed · error preserved'
          : current.removedResidual < 1
            ? 'Removing the unexplained residual'
            : 'Residual discarded',
      960,
      300,
      44,
      currentBeat === 2 ? themeColors.pink : themeColors.green,
      'center',
    );
    components.matrix({
      values: [
        vals.map((v) =>
          v.toFixed(current.removedResidual > 0 && current.removedResidual < 1 ? 3 : 1),
        ),
      ],
      x: 400,
      y: 450,
      cellSize: 180,
      style: {
        fill: themeColors.panel,
        stroke: themeColors.cyan,
        textColor: themeColors.cyan,
        fontSize: 42,
        padding: 14,
      },
    });
    retainedDrawText(
      ctx,
      api,
      'Ablation miniature · feature f = [1, 0]',
      580,
      410,
      29,
      themeColors.blue,
      'center',
    );
    api.focus.target('edited-activation', () =>
      retainedDrawEquation(
        ctx,
        api,
        String.raw`x'=[${vals[0].toFixed(1)},0]+[0,${vals[1].toFixed(3)}]`,
        580,
        775,
        40,
        themeColors.cyan,
        'center',
      ),
    );
    retainedDrawText(
      ctx,
      api,
      'feature contribution          residual e',
      580,
      840,
      27,
      themeColors.muted,
      'center',
    );
    api.focus.target('score-readout', () =>
      retainedDrawEquation(
        ctx,
        api,
        String.raw`\mathrm{score}=100x_2`,
        1430,
        460,
        58,
        themeColors.yellow,
        'center',
      ),
    );
    retainedDrawText(
      ctx,
      api,
      `Original score: ${current.originalScore}`,
      1430,
      620,
      36,
      themeColors.muted,
      'center',
    );
    if (current.applied)
      api.focus.target('score-readout', () =>
        retainedDrawText(
          ctx,
          api,
          currentBeat === 1 && state.cues?.['ablation-result']?.phase !== 'after'
            ? 'Edited score pending'
            : `Edited score ≈ ${current.score.toFixed(2)}`,
          1430,
          740,
          currentBeat === 1 && state.cues?.['ablation-result']?.phase !== 'after' ? 32 : 46,
          currentBeat === 2 ? themeColors.pink : themeColors.green,
          'center',
        ),
      );
    else if (current.prediction)
      api.focus.target('score-readout', () =>
        retainedDrawText(
          ctx,
          api,
          'Edited score: predict first',
          1430,
          740,
          32,
          themeColors.yellow,
          'center',
        ),
      );
  }
}
export default {
  id: 'ablation',
  draw: drawAblation,
  cues: [
    'ablation-b1-1',
    'ablation-b2-1',
    'ablation-b2-2',
    'ablation-result',
    'ablation-b3-1',
    'ablation-b3-2',
  ],
};
