import { gaBound } from '../arithmetic.mjs';
import {
  drawGpuUpgradeArrow,
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawKedaPhases(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  api.focus.target('keda-phases-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    {
      drawGpuUpgradeHead(
        ctx,
        api,
        upgradeColors,
        'Activation, replica scaling and hardware supply have different owners',
      );
      {
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          'always-available demand',
          180,
          380,
          550,
          100,
          delegatedColors.yellow,
        );
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          '0 ↔ 1 · KEDA activation',
          1000,
          380,
          730,
          100,
          delegatedColors.cyan,
        );
        drawGpuUpgradeArrow(ctx, api, upgradeColors, 770, 430, 950, 430);
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          '1 ↔ N · HPA target',
          180,
          635,
          690,
          100,
          delegatedColors.blue,
        );
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          'unschedulable pod',
          1130,
          635,
          580,
          100,
          delegatedColors.pink,
        );
        drawGpuUpgradeArrow(ctx, api, upgradeColors, 910, 685, 1080, 685, delegatedColors.blue);
        drawGpuUpgradeArrow(ctx, api, upgradeColors, 1410, 780, 1410, 855, delegatedColors.pink);
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'node supply → engine load / warm',
          1380,
          930,
          29,
          delegatedColors.cyan,
          'center',
        );
        drawGpuUpgradeFoot(
          ctx,
          api,
          upgradeColors,
          delegatedBeat === 1
            ? 'Return-to-zero cooldown and HPA downscale stabilization are separate contracts'
            : 'Engine pods cannot report demand while none exist; KEDA does not buffer the request',
        );
      }
    }
  });
}
export default {
  id: 'keda-phases',
  draw: drawKedaPhases,
  cues: ['ga-keda-phases-b0', 'ga-keda-phases-b1', 'ga-keda-phases-b2'],
};
