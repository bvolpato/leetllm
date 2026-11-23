import { gaBound, gaComplete } from '../arithmetic.mjs';
import {
  drawGpuUpgradeArrow,
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawAdapterAuthority(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  const done = (name, fallback = progress > 0.7) => gaComplete(state, 'ga-' + name, fallback);
  api.focus.target('adapter-authority-mechanism', () => {
    const { C: delegatedColors, components: delegatedComponents } = api,
      delegatedBeat = state.beat ?? 0,
      delegatedProgress = gaBound(state.beatP ?? 0);
    {
      drawGpuUpgradeHead(
        ctx,
        api,
        upgradeColors,
        'Trusted principal → membership → immutable approved artifact',
      );
      drawGpuUpgradeBox(
        ctx,
        api,
        upgradeColors,
        upgradeComponents,
        'authenticated Alice',
        180,
        390,
        460,
        105,
        delegatedColors.blue,
      );
      drawGpuUpgradeBox(
        ctx,
        api,
        upgradeColors,
        upgradeComponents,
        'tenant A membership',
        770,
        390,
        460,
        105,
        delegatedColors.cyan,
      );
      drawGpuUpgradeBox(
        ctx,
        api,
        upgradeColors,
        upgradeComponents,
        'registry / base v7',
        1360,
        390,
        400,
        105,
        delegatedColors.yellow,
      );
      drawGpuUpgradeArrow(ctx, api, upgradeColors, 670, 440, 730, 440);
      drawGpuUpgradeArrow(ctx, api, upgradeColors, 1260, 440, 1320, 440);
      if (!delegatedBeat && done('adapter-selected'))
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          'approved adapter 101',
          600,
          740,
          720,
          120,
          delegatedColors.green,
          36,
        );
      if (delegatedBeat) {
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'client-supplied tenant or path',
          360,
          685,
          32,
          delegatedColors.pink,
        );
        drawGpuUpgradeArrow(ctx, api, upgradeColors, 650, 750, 650, 850, delegatedColors.pink);
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          'Return the error to the caller',
          650,
          920,
          32,
          delegatedColors.pink,
          'center',
        );
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          done('adapter-revoked', delegatedBeat > 1)
            ? 'revoked membership → DENY'
            : 'check current membership',
          1450,
          800,
          31,
          delegatedColors.yellow,
          'center',
        );
      }
      drawGpuUpgradeFoot(
        ctx,
        api,
        upgradeColors,
        'The gateway authenticates the caller before adapter selection',
      );
    }
  });
}
export default {
  id: 'adapter-authority',
  draw: drawAdapterAuthority,
  cues: [
    'ga-adapter-authority-b0',
    'ga-adapter-selected',
    'ga-adapter-authority-b1',
    'ga-adapter-revoked',
    'ga-adapter-authority-b2',
  ],
};
