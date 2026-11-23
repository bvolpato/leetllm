import { phases } from '../fixtures.mjs';
import { gaBound, gaComplete } from '../arithmetic.mjs';
import {
  drawGpuUpgradeArrow,
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawStartupMitigation(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  const done = (name, fallback = progress > 0.7) => gaComplete(state, 'ga-' + name, fallback);
  api.focus.target('startup-mitigation-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    {
      drawGpuUpgradeHead(
        ctx,
        api,
        upgradeColors,
        'Same serial 95 + 22 + 78 + 12 second readiness path',
      );
      let start = 0;
      for (const [name, n, i] of phases.map(([a, b], i) => [a, b, i])) {
        const y = 370 + i * 120;
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          name + ' ' + n + ' s',
          190,
          y + 30,
          30,
          delegatedColors.blue,
        );
        api.rect(
          ctx,
          650 + start * 4.5,
          y,
          n * 4.5,
          45,
          [delegatedColors.blue, delegatedColors.pink, delegatedColors.cyan, delegatedColors.green][
            i
          ],
        );
        start += n;
      }
      if (delegatedBeat === 0 && done('startup-total'))
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'Ready only after 207 s',
          960,
          945,
          36,
          delegatedColors.green,
          'center',
        );
      if (delegatedBeat === 1) {
        drawGpuUpgradeArrow(ctx, api, upgradeColors, 780, 585, 780, 900, delegatedColors.pink);
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          'unfetched image bytes → first request',
          400,
          910,
          1120,
          70,
          delegatedColors.pink,
          29,
        );
      }
      drawGpuUpgradeFoot(
        ctx,
        api,
        upgradeColors,
        'Mitigation moves a measured critical-path boundary; concurrent fetch and first-request cost stay visible',
      );
    }
  });
}
export default {
  id: 'startup-mitigation',
  draw: drawStartupMitigation,
  cues: ['ga-startup-mitigation-b0', 'ga-startup-total', 'ga-startup-mitigation-b1'],
};
