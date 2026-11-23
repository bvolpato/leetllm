import { POLICY_TOKENS } from '../fixtures.mjs';
import { retainedPolicy, stablePolicy } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyText, drawProbabilityBars } from '../defaults.mjs';
export function drawFilterMinP(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('filter-min-p', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'filter-min-p'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const { C, teaching, components } = api;
    const id = 'filter-min-p',
      beat = state.beat ?? 0;
    {
      const flat = beat === 1,
        probabilities = flat ? [0.28, 0.25, 0.24, 0.23] : [0.568, 0.345, 0.077, 0.01];
      const kind = 'min-p';
      const parameter = 0.1;
      const kept = retainedPolicy(probabilities, 'min-p', parameter);
      {
        drawPolicyText(
          ctx,
          api,
          flat ? 'FLAT INPUT' : 'PEAKED INPUT · exact worksheet probabilities',
          180,
          300,
          29,
          C.muted,
        );
        drawPolicyText(
          ctx,
          api,
          `Relative cutoff .10 × ${Math.max(...probabilities).toFixed(3)} = ${(0.1 * Math.max(...probabilities)).toFixed(4)}`,
          1040,
          300,
          28,
          C.yellow,
        );
        drawProbabilityBars(ctx, api, colors, probabilities, POLICY_TOKENS, 150, 420, 800);
        target(() => {
          if (progress === 0)
            drawPolicyText(ctx, api, 'Retained distribution?', 1400, 590, 34, C.muted, 'center');
          else
            drawProbabilityBars(
              ctx,
              api,
              colors,
              kept.probabilities,
              POLICY_TOKENS,
              1040,
              420,
              800,
              1,
              kept.indices,
              (v) => v.toFixed(3),
              progress,
            );
        });
        drawPolicyText(ctx, api, 'Original mass', 535, 890, 29, C.muted, 'center');
        if (progress > 0)
          drawPolicyText(
            ctx,
            api,
            `Retained mass ${kept.mass.toFixed(3)} → divide each kept probability by that mass`,
            1390,
            890,
            24,
            C.green,
            'center',
          );
        drawCaption(
          ctx,
          api,
          'Inclusive ≥ cutoff; the cutoff follows the current largest probability.',
        );
      }
    }
    return;
  }
  return;
}
export default {
  id: 'filter-min-p',
  draw: drawFilterMinP,
  cues: ['filter-min-p-build-0', 'filter-min-p-build-1'],
};
