import { gaBound } from '../arithmetic.mjs';
import {
  drawGpuUpgradeArrow,
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeL,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawFailureDiagnosis(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  api.focus.target('failure-diagnosis-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    {
      drawGpuUpgradeHead(
        ctx,
        api,
        upgradeColors,
        'R21 retains its original release identity and deadline',
      );
      if (!delegatedBeat) {
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'reported mean: 800 ms',
          260,
          400,
          34,
          delegatedColors.blue,
        );
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'some waits: 30,000 ms',
          1120,
          400,
          34,
          delegatedColors.pink,
        );
        for (let i = 0; i < 6; i++) {
          const x = 250 + i * 245;
          drawGpuUpgradeBox(
            ctx,
            api,
            upgradeColors,
            upgradeComponents,
            i % 2 ? 'starting' : 'ready',
            x,
            590,
            210,
            90,
            i % 2 ? delegatedColors.yellow : delegatedColors.cyan,
          );
          if (i < 5)
            drawGpuUpgradeArrow(
              ctx,
              api,
              upgradeColors,
              x + 215,
              635,
              x + 240,
              635,
              delegatedColors.muted,
            );
        }
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'brief lull → removal → long reload',
          960,
          850,
          34,
          delegatedColors.yellow,
          'center',
        );
      } else if (delegatedBeat === 1) {
        for (let i = 0; i < 3; i++)
          drawGpuUpgradeBox(
            ctx,
            api,
            upgradeColors,
            upgradeComponents,
            'R21 attempt ' + (i + 1),
            210 + i * 530,
            470,
            450,
            95,
            i ? delegatedColors.pink : delegatedColors.blue,
          );
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'one original deadline · limited attempts · backoff',
          960,
          730,
          34,
          delegatedColors.yellow,
          'center',
        );
        drawGpuUpgradeArrow(ctx, api, upgradeColors, 1485, 850, 430, 850, delegatedColors.pink);
      } else {
        const n = 16;
        for (let i = 0; i < n; i++)
          api.rect(
            ctx,
            200 + i * 95,
            410,
            85,
            85,
            i % 4 === 3 ? delegatedColors.cyan : delegatedColors.blue,
          );
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'same illustrated prompt work in smaller chunks',
          960,
          620,
          33,
          delegatedColors.blue,
          'center',
        );
        drawGpuUpgradeL(ctx, api, upgradeColors, 250, 800, 1650, 800, delegatedColors.cyan, 5);
        for (let i = 0; i < 4; i++) api.circle(ctx, 400 + i * 340, 800, 12, delegatedColors.green);
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'preserve existing stream progress',
          960,
          925,
          32,
          delegatedColors.green,
          'center',
        );
      }
      drawGpuUpgradeFoot(
        ctx,
        api,
        upgradeColors,
        'Change the measured failed boundary; utilization alone does not identify the remedy',
      );
    }
  });
}
export default {
  id: 'failure-diagnosis',
  draw: drawFailureDiagnosis,
  cues: ['ga-failure-diagnosis-b0', 'ga-failure-diagnosis-b1', 'ga-failure-diagnosis-b2'],
};
