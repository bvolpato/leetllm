import { POLICY_TOKENS } from '../fixtures.mjs';
import { stablePolicy } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyText, drawProbabilityBars } from '../defaults.mjs';
export function drawFilterBoundaries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('filter-boundaries', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'filter-boundaries'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const { C, teaching, components } = api;
    const id = 'filter-boundaries',
      beat = state.beat ?? 0;
    {
      const unrounded = stablePolicy().probabilities;
      const probabilities = beat === 2 ? unrounded : [0.5, 0.25, 0.25, 0];
      drawPolicyText(
        ctx,
        api,
        beat === 2
          ? 'Actual softmax row · full values drive the comparison'
          : 'Ties and zero mass belong to the declared contract',
        960,
        300,
        34,
        C.ink,
        'center',
      );
      drawProbabilityBars(
        ctx,
        api,
        colors,
        probabilities,
        POLICY_TOKENS,
        180,
        420,
        860,
        1,
        [0, 1, 2, 3],
        (value) => value.toFixed(beat === 2 ? 6 : 2),
      );
      target(() => {
        if (beat === 2) {
          const firstThree = unrounded.slice(0, 3).reduce((sum, value) => sum + value, 0);
          const printedSum = unrounded
            .slice(0, 3)
            .reduce((sum, value) => sum + Number(value.toFixed(3)), 0);
          drawPolicyText(
            ctx,
            api,
            `First three: ${firstThree.toFixed(6)} < .99`,
            1080,
            485,
            31,
            C.yellow,
          );
          drawPolicyText(
            ctx,
            api,
            `Printed labels sum to ${printedSum.toFixed(3)}`,
            1080,
            600,
            29,
            C.muted,
          );
          drawPolicyText(ctx, api, 'Keep quota to cross the threshold.', 1080, 730, 31, C.green);
        } else {
          const rows =
            beat === 0
              ? [
                  'Exact-rank k=2 → create, revoke',
                  'Tie-inclusive k=2 can add rename',
                  'Nucleus p=.75 → create, revoke',
                  'Min-p .5 → all three positive tokens',
                ]
              : [
                  'Nucleus p=1 → all positive tokens',
                  'Min-p 1 → every tied maximum',
                  'Lab k=0 → reject parameter',
                  'A runtime may use 0 to disable k.',
                ];
          rows.forEach((text, i) =>
            drawPolicyText(ctx, api, text, 1070, 450 + i * 115, 28, i % 2 ? C.yellow : C.green),
          );
        }
      });
      drawCaption(
        ctx,
        api,
        beat === 2
          ? 'Rounding the input changes the policy. Keep full values through the comparison.'
          : 'Zero mass stays excluded. Record equality, ties and invalid-parameter conventions.',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'filter-boundaries',
  draw: drawFilterBoundaries,
  cues: ['filter-boundaries-build-0', 'filter-boundaries-build-1', 'filter-boundaries-build-2'],
};
