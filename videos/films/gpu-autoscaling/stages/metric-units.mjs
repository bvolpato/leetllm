import { gaBound } from '../arithmetic.mjs';
import { drawGpuUpgradeFoot, drawGpuUpgradeHead, drawGpuUpgradeText } from '../defaults.mjs';
export function drawMetricUnits(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  api.focus.target('metric-units-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    {
      drawGpuUpgradeHead(
        ctx,
        api,
        upgradeColors,
        'Keep hardware duty, live allocation and waiting work on separate instruments',
      );
      const metrics = [
        ['GPU duty cycle', 0.95, '95%', delegatedColors.blue],
        [
          'active KV',
          delegatedBeat ? 0.92 : 0.45,
          delegatedBeat ? '92%' : '45%',
          delegatedColors.pink,
        ],
        [
          'waiting work',
          delegatedBeat ? 0.8 : 0.05,
          delegatedBeat ? 'old queue' : 'short queue',
          delegatedColors.yellow,
        ],
      ];
      metrics.forEach(([name, u, label, col], i) => {
        drawGpuUpgradeText(ctx, api, upgradeColors, name, 210, 430 + i * 175, 31, col);
        api.rect(ctx, 650, 385 + i * 175, 950, 65, delegatedColors.panel, delegatedColors.muted, 1);
        api.rect(ctx, 650, 385 + i * 175, 950 * u, 65, col);
        drawGpuUpgradeText(ctx, api, upgradeColors, label, 1730, 432 + i * 175, 29, col, 'center');
      });
      drawGpuUpgradeFoot(
        ctx,
        api,
        upgradeColors,
        delegatedBeat
          ? 'Same GPU activity  ·  less free cache and a longer wait'
          : 'Check the wait for the first token and the gaps between later tokens',
      );
    }
  });
}
export default {
  id: 'metric-units',
  draw: drawMetricUnits,
  cues: ['ga-metric-units-b0', 'ga-metric-units-b1'],
};
