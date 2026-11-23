import { stablePolicy } from '../arithmetic.mjs';
import { greedyPolicyFrame, policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyCard, drawPolicyText, drawProbabilityBars } from '../defaults.mjs';
export function drawGreedyLoop(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('greedy-loop', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'greedy-loop'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const frame = greedyPolicyFrame(state),
      tokens = frame.prefix;
    drawPolicyText(ctx, api, 'Retained prefix', 170, 310, 30, themeColors.muted);
    drawPolicyCard(
      ctx,
      api,
      'greedy-loop',
      'Guide → answer:',
      170,
      370,
      540,
      88,
      themeColors.muted,
      32,
    );
    tokens.forEach((t, i) =>
      drawPolicyCard(ctx, api, 'greedy-loop', t, 760 + i * 400, 370, 300, 88, colors[i], 34),
    );
    target(() => {
      drawPolicyText(
        ctx,
        api,
        frame.appendedCreate
          ? 'Actual second scores: period 4.0 · then 1.5 · after .5'
          : 'Actual first score row',
        960,
        520,
        28,
        themeColors.muted,
        'center',
      );
      drawProbabilityBars(ctx, api, colors, frame.probabilities, frame.labels, 340, 595, 1280);
    });
    drawCaption(
      ctx,
      api,
      beat === 0
        ? 'Append create before using its conditional row. Predict the next token.'
        : 'The computed period is written text. EOS and KV reuse have separate roles.',
    );
  }
  return;
}
export default {
  id: 'greedy-loop',
  draw: drawGreedyLoop,
  cues: ['greedy-loop-build-0', 'greedy-loop-build-1'],
};
