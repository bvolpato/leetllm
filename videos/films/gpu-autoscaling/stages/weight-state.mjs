import { autoscaleMemory, gaBound, gaComplete } from '../arithmetic.mjs';
import {
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawWeightState(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  const done = (name, fallback = progress > 0.7) => gaComplete(state, 'ga-' + name, fallback);
  api.focus.target('weight-state-mechanism', () => {
    const hybrid = false,
      m = autoscaleMemory();
    drawGpuUpgradeHead(
      ctx,
      api,
      upgradeColors,
      'Raw weights + actual growing KV + supplied overhead',
    );
    {
      drawGpuUpgradeBox(
        ctx,
        api,
        upgradeColors,
        upgradeComponents,
        '8B weights × 2 bytes',
        200,
        380,
        1300,
        90,
        upgradeColors.blue,
        32,
      );
      drawGpuUpgradeBox(
        ctx,
        api,
        upgradeColors,
        upgradeComponents,
        '2 × 32 × 8 × 128 × 4096 × 8 × 2',
        200,
        550,
        1300,
        90,
        upgradeColors.cyan,
        31,
      );
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        '16 decimal GB',
        1660,
        440,
        30,
        upgradeColors.blue,
        'center',
      );
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        '4 GiB = 4.295 GB',
        1660,
        610,
        28,
        upgradeColors.cyan,
        'center',
      );
      if (currentBeat > 0 && done('memory-total'))
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          '(16 + 4.295) × 1.15 = 23.339 decimal GB',
          960,
          825,
          38,
          upgradeColors.green,
          'center',
        );
    }
    drawGpuUpgradeFoot(
      ctx,
      api,
      upgradeColors,
      'Payload arithmetic is not loaded memory, per-rank placement or measured GPU latency',
    );
  });
}
export default {
  id: 'weight-state',
  draw: drawWeightState,
  cues: ['ga-weight-state-b0', 'ga-weight-state-b1', 'ga-memory-total', 'ga-weight-state-b2'],
};
