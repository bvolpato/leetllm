import { drawArrow, drawCard, drawText } from '../defaults.mjs';
import { cueAt } from '../cue-clock.mjs';
export function drawNativeReasoningTraining(ctx, scene, state, api) {
  api.focus.target('native-reasoning-training-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    {
      if (currentBeat === 0) {
        drawText(
          ctx,
          api,
          'Prompt changes context; post-training changes parameters',
          960,
          260,
          33,
          themeColors.ink,
          'center',
        );
        drawCard(
          ctx,
          api,
          'New solved examples\nSame checkpoint θ',
          150,
          400,
          720,
          190,
          themeColors.blue,
          36,
        );
        drawCard(
          ctx,
          api,
          'Training examples/rewards\nNew checkpoint θ′',
          1050,
          400,
          720,
          190,
          themeColors.green,
          36,
        );
        drawText(
          ctx,
          api,
          'Historical R1-Zero: RL without preceding SFT · R1: supervised and RL stages',
          960,
          870,
          28,
          themeColors.yellow,
          'center',
        );
      } else if (currentBeat === 1) {
        drawCard(ctx, api, 'Sampled proposed solution', 170, 350, 760, 110, themeColors.blue, 32);
        drawCard(
          ctx,
          api,
          'Programmatic verifier\nmath / code tests / proof',
          1080,
          350,
          680,
          160,
          themeColors.cyan,
          30,
        );
        drawArrow(ctx, api, 960, 405, 1050, 405);
        drawCard(
          ctx,
          api,
          'Reward-based parameter update',
          470,
          740,
          980,
          110,
          themeColors.green,
          34,
        );
        drawArrow(ctx, api, 1410, 560, 1410, 680, themeColors.green);
        drawArrow(ctx, api, 1410, 680, 960, 715, themeColors.green);
        drawText(
          ctx,
          api,
          'Solutions that earn higher rewards guide the update',
          960,
          940,
          30,
          themeColors.yellow,
          'center',
        );
      } else {
        const comparison = cueAt(state, 'native-matched-budget', 2, 0.55, 0.83);
        drawText(
          ctx,
          api,
          'MATH problems   ·   Matched compute budget',
          960,
          310,
          46,
          themeColors.ink,
          'center',
        );
        drawCard(
          ctx,
          api,
          'Smaller model\nRevise or search with a verifier',
          135,
          443,
          790,
          200,
          themeColors.cyan,
          42,
        );
        drawCard(
          ctx,
          api,
          comparison.done ? 'Larger model\nAbout 14× as many parameters' : 'Larger model',
          995,
          443,
          790,
          200,
          themeColors.blue,
          42,
        );
        if (comparison.done) {
          drawText(
            ctx,
            api,
            'The smaller model won on some problems',
            960,
            802,
            47,
            themeColors.yellow,
            'center',
          );
        }
      }
    }
  });
}
export default {
  id: 'native-reasoning-training',
  draw: drawNativeReasoningTraining,
  cues: [
    'native-reasoning-training-b1',
    'native-reasoning-training-b2',
    'native-reasoning-training-b3',
    'native-matched-budget',
  ],
};
