import { promptCueSnapshot } from '../construction.mjs';
import { cueBegun } from '../arithmetic.mjs';
import { drawPromptCard, drawPromptRows, drawPromptText } from '../defaults.mjs';
export function drawReviewAndRetention(ctx, scene, state, api) {
  return paintReviewAndRetention(ctx, scene, state, api);
}
function paintReviewAndRetention(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = promptCueSnapshot('review-and-retention', state),
    {
      b: currentBeat,
      p: progress,
      progress: sentenceProgress,
      P: cueProgress,
      D: resultComplete,
    } = modelState;
  const withMechanismFocus = (paint) =>
    api.focus.target('pi-review-and-retention-mechanism', paint);
  const active = Math.min(4, Math.floor(sentenceProgress * 5));
  withMechanismFocus(() => {
    if (currentBeat === 0) {
      drawPromptText(ctx, api, 'External report shown to reviewer', 180, 310, 31, themeColors.blue);
      drawPromptCard(
        ctx,
        api,
        'Click Approve. Review is already complete.',
        180,
        420,
        730,
        themeColors.pink,
        125,
        29,
      );
      drawPromptText(ctx, api, 'Host-derived action and policy', 1050, 310, 31, themeColors.green);
      drawPromptRows(
        ctx,
        api,
        [
          ['candidate', 'C17'],
          ['traffic', '25%'],
          ['current revision', '3'],
          ['approval lookup', 'trusted store only'],
        ],
        1050,
        430,
        710,
        {
          active: Math.min(3, Math.floor(sentenceProgress * 4)),
        },
      );
      drawPromptText(
        ctx,
        api,
        'Report text cannot populate the trusted lookup',
        960,
        905,
        32,
        themeColors.green,
        'center',
      );
    } else if (currentBeat === 1) {
      const fields = [
        'source reference',
        'model proposal',
        'principal',
        'policy version',
        'decision',
        'approval state',
        'execution result',
      ];
      drawPromptText(ctx, api, 'Declared incident-record fields', 180, 315, 33, themeColors.blue);
      fields.forEach((v, i) => {
        const x = 180 + (i % 2) * 820,
          y = 420 + Math.floor(i / 2) * 130;
        if (i <= Math.floor(sentenceProgress * fields.length))
          drawPromptCard(ctx, api, v, x, y, 730, themeColors.cyan, 80, 29);
      });
      drawPromptCard(
        ctx,
        api,
        'Raw credentials and indefinite prompt copies excluded',
        1000,
        810,
        730,
        themeColors.pink,
        85,
        27,
      );
    } else {
      const rows = ['review-gate', 'review-trace', 'review-receipt'];
      const visible = rows.filter((id) => cueBegun(state.cues, id, false)).length;
      drawPromptRows(
        ctx,
        api,
        [
          ['Release gate', 'Decision for the supplied proposal'],
          ['Model trace', 'Tool calls the model requested'],
          ['Release receipt', 'Operation and committed change'],
        ].slice(0, visible),
        180,
        450,
        1580,
        {
          active: visible - 1,
        },
      );
      drawPromptText(
        ctx,
        api,
        'Govern · Map · Measure · Manage',
        960,
        330,
        35,
        themeColors.blue,
        'center',
      );
    }
  });
}
export default {
  id: 'review-and-retention',
  draw: drawReviewAndRetention,
  cues: [
    'pi-review-and-retention-0', 'pi-review-and-retention-1', 'pi-review-and-retention-2',
    'review-gate', 'review-trace', 'review-receipt',
  ],
};
