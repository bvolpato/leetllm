import { gaBound } from '../arithmetic.mjs';
import {
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawResidentVActive(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  api.focus.target('resident-v-active-mechanism', () => {
    drawGpuUpgradeHead(
      ctx,
      api,
      upgradeColors,
      'Schematic MoE pool · keep resident and routed sets separate',
    );
    for (let i = 0; i < 8; i++) {
      const selected = i === 2 || i === 5;
      drawGpuUpgradeBox(
        ctx,
        api,
        upgradeColors,
        upgradeComponents,
        'expert ' + (i + 1),
        180 + (i % 4) * 410,
        390 + Math.floor(i / 4) * 190,
        350,
        120,
        selected ? upgradeColors.cyan : upgradeColors.blue,
      );
      if (selected)
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'selected',
          355 + (i % 4) * 410,
          540 + Math.floor(i / 4) * 190,
          25,
          upgradeColors.cyan,
          'center',
        );
    }
    drawGpuUpgradeText(
      ctx,
      api,
      upgradeColors,
      'All retained experts need resident capacity',
      960,
      335,
      34,
      upgradeColors.blue,
      'center',
    );
    drawGpuUpgradeText(
      ctx,
      api,
      upgradeColors,
      'This token reads its routed subset + shared weights',
      960,
      920,
      34,
      upgradeColors.cyan,
      'center',
    );
    drawGpuUpgradeFoot(
      ctx,
      api,
      upgradeColors,
      'Routing diagram only · quantized scales, buffers, KV and transfers are additional budgets',
    );
  });
}
export default {
  id: 'resident-v-active',
  draw: drawResidentVActive,
  cues: ['ga-resident-v-active-b0', 'ga-resident-v-active-b1'],
};
