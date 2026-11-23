import { gaBound } from '../arithmetic.mjs';
import {
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeL,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawOperatingModel(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  api.focus.target('operating-model-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    const row = (label, values, y, col = delegatedColors.cyan) => {
      drawGpuUpgradeText(ctx, api, upgradeColors, label, 180, y + 45, 29, col);
      values.forEach((v, i) =>
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          String(v),
          650 + i * 550,
          y,
          500,
          75,
          col,
          27,
        ),
      );
    };
    {
      drawGpuUpgradeHead(
        ctx,
        api,
        upgradeColors,
        'Schematic headroom and ownership at the same service objective',
      );
      if (!delegatedBeat) {
        drawGpuUpgradeL(ctx, api, upgradeColors, 240, 835, 1680, 835);
        api.rect(ctx, 300, 620, 1260, 190, delegatedColors.blue);
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'stable baseline pool',
          930,
          730,
          35,
          delegatedColors.ink,
          'center',
        );
        api.rect(ctx, 830, 400, 560, 215, delegatedColors.panel, delegatedColors.cyan, 2);
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'retryable spot overflow',
          1110,
          520,
          30,
          delegatedColors.cyan,
          'center',
        );
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'warm idle headroom',
          600,
          910,
          31,
          delegatedColors.yellow,
        );
      } else {
        const rows = [
          ['managed inference', 'provider lifecycle', 'application quality'],
          ['GPU instances', 'team engine / queues', 'team recovery'],
          ['managed Kubernetes', 'provider control plane', 'team GPU / workers / scaling'],
        ];
        for (let i = 0; i < rows.length; i++)
          row(
            rows[i][0],
            rows[i].slice(1),
            390 + i * 175,
            i === 1 ? delegatedColors.cyan : delegatedColors.blue,
          );
      }
      drawGpuUpgradeFoot(
        ctx,
        api,
        upgradeColors,
        'Useful-request cost includes failures, interruption and operational work; an hourly GPU price is incomplete',
      );
    }
  });
}
export default {
  id: 'operating-model',
  draw: drawOperatingModel,
  cues: ['ga-operating-model-b0', 'ga-operating-model-b1'],
};
