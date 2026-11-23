import { gaBound } from '../arithmetic.mjs';
import {
  drawGpuUpgradeArrow,
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawTwoLoops(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  api.focus.target('two-loops-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    {
      drawGpuUpgradeHead(
        ctx,
        api,
        upgradeColors,
        'R21 needs current service; desired capacity starts a separate clock',
      );
      {
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          'R21 · original deadline',
          180,
          365,
          480,
          85,
          delegatedColors.yellow,
        );
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          'loaded, warm, healthy',
          1140,
          365,
          600,
          85,
          delegatedColors.green,
        );
        drawGpuUpgradeArrow(ctx, api, upgradeColors, 700, 407, 1080, 407);
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'bounded queue + admission',
          910,
          535,
          31,
          delegatedColors.cyan,
          'center',
        );
        for (let i = 0; i < 5; i++)
          drawGpuUpgradeBox(
            ctx,
            api,
            upgradeColors,
            upgradeComponents,
            i < 2 ? 'active R' + (20 + i) : 'free',
            290 + i * 280,
            620,
            230,
            80,
            i < 2 ? delegatedColors.cyan : delegatedColors.muted,
          );
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          'desired replicas +6',
          180,
          800,
          450,
          85,
          delegatedColors.blue,
        );
        drawGpuUpgradeArrow(ctx, api, upgradeColors, 670, 842, 850, 842, delegatedColors.blue);
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          'node → load → warm',
          900,
          800,
          810,
          85,
          delegatedColors.blue,
        );
        drawGpuUpgradeFoot(
          ctx,
          api,
          upgradeColors,
          'Future requested capacity does not extend a current request deadline',
        );
      }
    }
  });
}
export default {
  id: 'two-loops',
  draw: drawTwoLoops,
  cues: ['ga-two-loops-b0', 'ga-two-loops-b1'],
};
