import { gaBound } from '../arithmetic.mjs';
import {
  drawGpuUpgradeArrow,
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawRegionalRecovery(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  api.focus.target('regional-recovery-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    {
      drawGpuUpgradeHead(
        ctx,
        api,
        upgradeColors,
        'Approved destination must own the same release and remaining request budget',
      );
      drawGpuUpgradeBox(
        ctx,
        api,
        upgradeColors,
        upgradeComponents,
        'region A · failed',
        210,
        375,
        620,
        100,
        delegatedColors.pink,
      );
      drawGpuUpgradeBox(
        ctx,
        api,
        upgradeColors,
        upgradeComponents,
        'region B · healthy / allowed',
        1090,
        375,
        620,
        100,
        delegatedColors.cyan,
      );
      drawGpuUpgradeArrow(ctx, api, upgradeColors, 875, 425, 1040, 425, delegatedColors.yellow);
      const fields = [
        'model / tokenizer / template',
        'adapter / retrieval / safety',
        'tenant / tools / quota',
        'actual loaded + warm capacity',
      ];
      fields.forEach((s, i) =>
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          s,
          960,
          590 + i * 95,
          31,
          i < 3 ? delegatedColors.blue : delegatedColors.green,
          'center',
        ),
      );
      drawGpuUpgradeFoot(
        ctx,
        api,
        upgradeColors,
        delegatedBeat
          ? 'An old partial stream retains its output contract; new or retryable work retains original authority/deadline'
          : 'Matching only a model name does not establish compatible ready service',
      );
    }
  });
}
export default {
  id: 'regional-recovery',
  draw: drawRegionalRecovery,
  cues: ['ga-regional-recovery-b0', 'ga-regional-recovery-b1'],
};
