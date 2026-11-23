import {
  drawArrow,
  drawCard,
  drawDocument,
  drawFooter,
  drawTable,
  drawText,
} from '../defaults.mjs';
export function drawPreferenceAndReward(ctx, scene, state, api) {
  api.focus.target('preference-and-reward-mechanism', () => {
    const currentBeat = state.beat ?? 0;
    const { C: themeColors } = api;
    {
      if (currentBeat === 0) {
        drawCard(
          ctx,
          api,
          'Same prompt · stale key under P7',
          420,
          280,
          1080,
          80,
          themeColors.blue,
        );
        drawDocument(
          ctx,
          api,
          'PPO-based RLHF',
          ['rank answers → train reward model', 'rollouts → scores → policy updates'],
          150,
          420,
          740,
          themeColors.cyan,
        );
        drawDocument(
          ctx,
          api,
          'DPO',
          ['chosen/rejected + reference policy', 'direct pair loss → policy updates'],
          1030,
          420,
          740,
          themeColors.green,
        );
        drawText(
          ctx,
          api,
          'Both train neural parameters by gradient optimization',
          960,
          835,
          34,
          themeColors.yellow,
          'center',
        );
      } else if (currentBeat === 1) {
        drawTable(
          ctx,
          api,
          [
            ['Candidate', 'fields checked', 'text checked', 'reward'],
            ['honest', 'correct', 'no', '1'],
            ['invented action', 'false action', 'no', '0'],
            ['claims success', 'correct', 'no', '1'],
          ],
          160,
          330,
          1600,
          120,
        );
        drawText(
          ctx,
          api,
          'Build the displayed job status from the execution receipt',
          960,
          910,
          32,
          themeColors.pink,
          'center',
        );
      } else {
        drawCard(ctx, api, 'Checkpoint v4', 160, 350, 520, 160, themeColors.blue, 35);
        drawArrow(ctx, api, 710, 430, 960, 430);
        drawCard(
          ctx,
          api,
          'More search / reasoning / candidates',
          1010,
          350,
          740,
          160,
          themeColors.cyan,
          32,
        );
        drawTable(
          ctx,
          api,
          [
            ['Runtime choice', 'quality', 'latency', 'cost'],
            ['Extra inference work', 'measure', 'measure', 'measure'],
          ],
          260,
          650,
          1400,
          110,
        );
      }
      drawFooter(
        ctx,
        api,
        'Verifier scoring, weight training and test-time computation are distinct operations',
      );
    }
  });
}
export default {
  id: 'preference-and-reward',
  draw: drawPreferenceAndReward,
  cues: ['preference-and-reward-b1', 'preference-and-reward-b2', 'preference-and-reward-b3'],
};
