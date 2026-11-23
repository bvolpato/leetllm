import { gaBound } from '../arithmetic.mjs';
import {
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeText,
} from '../defaults.mjs';
export function drawPrefixState(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  api.focus.target('prefix-state-mechanism', () => {
    drawGpuUpgradeHead(
      ctx,
      api,
      upgradeColors,
      'Illustrative four-ID block · computed residency and exact compatibility',
    );
    const cases = currentBeat
      ? [
          ['cold replica B', 'A', [10, 20, 30, 40], false],
          ['early edit on A', 'A', [11, 20, 30, 40], true],
          ['different tenant', 'B', [10, 20, 30, 40], true],
        ]
      : [['same warm replica', 'A', [10, 20, 30, 40], true]];
    drawGpuUpgradeText(
      ctx,
      api,
      upgradeColors,
      'Stored: tenant A · IDs [10, 20, 30, 40]',
      960,
      365,
      32,
      upgradeColors.blue,
      'center',
    );
    cases.forEach(([name, tenant, tokens, resident], i) => {
      const y = 460 + i * 155;
      drawGpuUpgradeText(ctx, api, upgradeColors, name, 180, y + 40, 29, upgradeColors.blue);
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        'tenant ' + tenant,
        520,
        y + 40,
        28,
        tenant === 'A' ? upgradeColors.cyan : upgradeColors.pink,
      );
      tokens.forEach((v, j) =>
        drawGpuUpgradeBox(
          ctx,
          api,
          upgradeColors,
          upgradeComponents,
          String(v),
          760 + j * 155,
          y,
          125,
          75,
          v === [10, 20, 30, 40][j] ? upgradeColors.cyan : upgradeColors.pink,
          28,
        ),
      );
      const reusable =
        resident && tenant === 'A' && tokens.every((v, j) => v === [10, 20, 30, 40][j]);
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        reusable ? 'reuse 4' : 'reuse 0',
        1680,
        y + 40,
        30,
        reusable ? upgradeColors.green : upgradeColors.pink,
        'center',
      );
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        resident ? 'resident' : 'cold',
        1450,
        y + 40,
        27,
        resident ? upgradeColors.cyan : upgradeColors.pink,
        'center',
      );
    });
    drawGpuUpgradeFoot(
      ctx,
      api,
      upgradeColors,
      'Keep the same model/layout premise; allocation alone does not skip repeated prefill',
    );
  });
}
export default {
  id: 'prefix-state',
  draw: drawPrefixState,
  cues: ['ga-prefix-state-b0', 'ga-prefix-state-b1'],
};
