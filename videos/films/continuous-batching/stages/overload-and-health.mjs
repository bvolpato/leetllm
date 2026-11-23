import {
  drawBatchingUpgradeArrow,
  drawBatchingUpgradeBox,
  drawBatchingUpgradeFoot,
  drawBatchingUpgradeTable,
  drawBatchingUpgradeText,
} from '../defaults.mjs';
export function drawOverloadAndHealth(ctx, scene, state, api) {
  api.focus.target(scene.id + '-mechanism', () => {
    const currentBeat = state.beat ?? 0,
      progress2 = state.beatP ?? 0;
    const { C: themeColors } = api;
    {
      if (currentBeat === 0) {
        drawBatchingUpgradeTable(
          ctx,
          api,
          [
            ['Worker observation', 'Health', 'Readiness/load action'],
            ['Engine works; slots full', 'healthy', 'defer/reject extra work'],
            ['Engine failed; queue empty', 'failed', 'stop new admission'],
            ['Restart healthy full worker', 'discard streams/cache', 'cold start; load shifts'],
          ],
          140,
          355,
          1640,
          125,
        );
      } else {
        drawBatchingUpgradeBox(
          ctx,
          api,
          'Original request deadline',
          160,
          380,
          680,
          140,
          themeColors.blue,
          35,
        );
        drawBatchingUpgradeBox(
          ctx,
          api,
          'Retry keeps that deadline\nand a bounded attempt budget',
          1070,
          380,
          680,
          160,
          themeColors.yellow,
          30,
        );
        drawBatchingUpgradeArrow(ctx, api, 875, 450, 1030, 450);
        drawBatchingUpgradeText(
          ctx,
          api,
          'Interrupted answer: supported continuation or explicit interruption',
          960,
          780,
          33,
          themeColors.pink,
          'center',
        );
        drawBatchingUpgradeText(
          ctx,
          api,
          'Queue / prefill / mixed-step gaps / projected KV / handoff: inspect actual trace',
          960,
          920,
          28,
          themeColors.muted,
          'center',
        );
      }
      drawBatchingUpgradeFoot(
        ctx,
        api,
        'Health,readiness and current capacity are separate facts; immediate retries can amplify overload',
      );
    }
    return;
  });
}
export default {
  id: 'overload-and-health',
  draw: drawOverloadAndHealth,
  cues: ['overload-and-health-b1', 'overload-and-health-b2'],
};
