import { POLICY_LOGITS, POLICY_TOKENS } from '../fixtures.mjs';
import { stablePolicy } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyText, drawProbabilityBars } from '../defaults.mjs';
export function drawTemperatureScale(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('temperature-scale', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'temperature-scale'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const temperature =
      beat === 0 ? 1 - 0.5 * progress : beat === 1 ? 0.5 + 1.5 * progress : 0.02 + 7.98 * progress;
    const limiting = beat === 2 && progress === 1;
    const current = limiting
      ? {
          probabilities: [1 / 3, 1 / 3, 1 / 3, 0],
          entropy: Math.log(3),
        }
      : stablePolicy(beat === 2 ? [2, 2, 0, -Infinity] : POLICY_LOGITS, temperature);
    drawPolicyText(
      ctx,
      api,
      `T ${limiting ? '→ ∞' : '= ' + temperature.toFixed(2)}    entropy = ${current.entropy.toFixed(3)} nats`,
      960,
      310,
      34,
      themeColors.yellow,
      'center',
    );
    target(() =>
      drawProbabilityBars(
        ctx,
        api,
        colors,
        current.probabilities,
        beat === 2 ? ['tied A', 'tied B', 'lower C', 'masked D'] : POLICY_TOKENS,
        260,
        430,
        1420,
      ),
    );
    drawCaption(
      ctx,
      api,
      beat === 2
        ? 'Low positive T splits tied maxima; high T spreads mass across finite unmasked scores.'
        : 'For this fixed finite score row and mask, entropy rises with positive temperature.',
    );
  }
  return;
}
export default {
  id: 'temperature-scale',
  draw: drawTemperatureScale,
  cues: ['temperature-scale-build-0', 'temperature-scale-build-1', 'temperature-scale-build-2'],
};
