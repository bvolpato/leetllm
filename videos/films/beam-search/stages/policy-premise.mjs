import { POLICY_LOGITS, POLICY_TOKENS } from '../fixtures.mjs';
import { stablePolicy } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyCard, drawPolicyText, drawRectangle } from '../defaults.mjs';
export function drawPolicyPremise(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('policy-premise', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'policy-premise'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    drawPolicyText(ctx, api, 'SUPPLIED GUIDE', 170, 292, 26, themeColors.muted);
    const words = ['create', 'deploy', 'revoke'];
    words.forEach((word, i) => {
      drawPolicyCard(
        ctx,
        api,
        'policy-premise',
        word,
        170 + i * 500,
        338,
        310,
        82,
        i === 0 ? themeColors.green : themeColors.muted,
        34,
      );
      if (i < 2) api.arrow(ctx, 495 + i * 500, 379, 650 + i * 500, 379, themeColors.muted);
    });
    if (beat === 0) {
      target(() => {
        drawPolicyText(ctx, api, 'Next-token scores', 175, 520, 33, themeColors.ink);
        POLICY_LOGITS.forEach((v, i) => {
          const x = 420 + i * 350;
          drawPolicyText(ctx, api, POLICY_TOKENS[i], x, 578, 30, colors[i], 'center');
          drawRectangle(ctx, api, x - 58, 635, 116, 110, themeColors.panel, colors[i]);
          drawPolicyText(ctx, api, v.toFixed(1), x, 703, 37, colors[i], 'center');
        });
      });
      drawCaption(
        ctx,
        api,
        'The guide gives task evidence. The score row gives generator preferences.',
      );
    } else {
      const selected = beat === 1 ? (progress < 0.5 ? 'create' : 'revoke') : 'quota';
      drawPolicyText(ctx, api, 'The decoder emits text', 960, 560, 34, themeColors.ink, 'center');
      target(() => {
        drawPolicyCard(
          ctx,
          api,
          'policy-premise',
          'Answer prefix',
          210,
          650,
          480,
          94,
          themeColors.muted,
          31,
        );
        api.arrow(ctx, 725, 697, 1080, 697, themeColors.yellow);
        drawPolicyCard(
          ctx,
          api,
          'policy-premise',
          selected,
          1140,
          650,
          470,
          94,
          selected === 'create' ? themeColors.green : themeColors.pink,
          37,
        );
      });
      drawCaption(
        ctx,
        api,
        beat === 1
          ? 'A different policy can choose a different word from the same row.'
          : 'A word in an answer does not authorize an infrastructure operation.',
      );
    }
  }
  return;
}
export default {
  id: 'policy-premise',
  draw: drawPolicyPremise,
  cues: ['policy-premise-build-0', 'policy-premise-build-1'],
};
