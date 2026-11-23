import { gaBound } from '../arithmetic.mjs';
import { drawGpuUpgradeFoot, drawGpuUpgradeHead, drawGpuUpgradeText } from '../defaults.mjs';
export function drawMigSlices(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  api.focus.target('mig-slices-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    {
      drawGpuUpgradeHead(
        ctx,
        api,
        upgradeColors,
        'Supported device and selected profile · each slice must fit its own service',
      );
      api.rect(ctx, 250, 360, 1420, 470, delegatedColors.panel, delegatedColors.blue, 3);
      for (let i = 0; i < 7; i++) {
        api.rect(ctx, 275 + i * 198, 395, 172, 390, delegatedColors.panel, delegatedColors.cyan, 2);
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'slice ' + (i + 1),
          360 + i * 198,
          450,
          25,
          delegatedColors.cyan,
          'center',
        );
        api.rect(ctx, 295 + i * 198, 525, 132, 120, delegatedColors.blue);
        api.rect(ctx, 295 + i * 198, 650, 132, 70, delegatedColors.pink);
      }
      drawGpuUpgradeText(ctx, api, upgradeColors, 'weights', 470, 910, 31, delegatedColors.blue);
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        'live state + execution',
        1180,
        910,
        31,
        delegatedColors.pink,
      );
      drawGpuUpgradeFoot(
        ctx,
        api,
        upgradeColors,
        'Schematic seven-instance example; SKU/profile support, authenticated isolation and measured latency remain separate',
      );
    }
  });
}
export default {
  id: 'mig-slices',
  draw: drawMigSlices,
  cues: ['ga-mig-slices-b0', 'ga-mig-slices-b1'],
};
