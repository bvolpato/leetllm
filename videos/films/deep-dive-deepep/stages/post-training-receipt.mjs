import { chapterModel } from '../construction.mjs';
import { drawChapterTarget, drawChapterText } from '../defaults.mjs';
export function drawPostTrainingReceipt(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    m = chapterModel('post-training-receipt', state),
    currentBeat = m.b,
    progress2 = m.p;
  const progress = Math.max(0, Math.min(1, (progress2 - 0.07) / 0.65));
  drawChapterTarget(ctx, api, 'de-post-training-receipt-mechanism', () => {
    drawChapterText(
      ctx,
      api,
      'Retain model, route and weight-version identity across phases',
      960,
      275,
      34,
      themeColors.yellow,
      'center',
    );
    const intervals = currentBeat
      ? [
          {
            id: 'dispatch',
            lane: 'comm',
            start: 0,
            end: 2,
            color: themeColors.blue,
          },
          {
            id: 'expert',
            lane: 'compute',
            start: 1,
            end: 5,
            color: themeColors.pink,
          },
          {
            id: 'combine',
            lane: 'comm',
            start: 4,
            end: 6,
            color: themeColors.cyan,
          },
        ]
      : [
          {
            id: 'rollout',
            lane: 'comm',
            start: 0,
            end: 3,
            color: themeColors.blue,
          },
          {
            id: 'drain',
            lane: 'comm',
            start: 3,
            end: 4,
            color: themeColors.yellow,
          },
          {
            id: 'train',
            lane: 'compute',
            start: 4,
            end: 6,
            color: themeColors.pink,
          },
        ];
    teaching.timeline({
      x: 180,
      y: 380,
      width: 1520,
      height: 390,
      domain: [0, 6],
      time: 6 * progress,
      lanes: [
        {
          id: 'comm',
          label: currentBeat ? 'Communication' : 'Rollout phase',
        },
        {
          id: 'compute',
          label: currentBeat ? 'Expert compute' : 'Trainer phase',
        },
      ],
      intervals,
      ticks: [0, 1, 3, 4, 5, 6],
      labelWidth: 310,
      fontSize: 27,
      color: themeColors.muted,
      trackColor: themeColors.panel,
    });
    drawChapterText(
      ctx,
      api,
      currentBeat
        ? 'Supplied overlap worksheet: duration 6, phase lengths sum 8'
        : 'Reuse compatible resources only after rollout consumers drain',
      960,
      885,
      31,
      themeColors.yellow,
      'center',
    );
    drawChapterText(
      ctx,
      api,
      'No measured rollout reward, transport throughput or training result',
      960,
      1010,
      28,
      themeColors.muted,
      'center',
    );
  });
}
export default {
  id: 'post-training-receipt',
  draw: drawPostTrainingReceipt,
  cues: ['de-post-training-receipt-b0', 'de-post-training-receipt-b1'],
};
