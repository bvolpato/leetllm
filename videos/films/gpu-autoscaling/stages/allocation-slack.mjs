import { gaBound, gaComplete, pagedAllocation } from '../arithmetic.mjs';
import { drawGpuUpgradeHead, drawGpuUpgradeText } from '../defaults.mjs';
export function drawAllocationSlack(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  const done = (name, fallback = progress > 0.7) => gaComplete(state, 'ga-' + name, fallback);
  api.focus.target('allocation-slack-mechanism', () => {
    const r = pagedAllocation([320, 75, 900, 250]);
    drawGpuUpgradeHead(
      ctx,
      api,
      upgradeColors,
      'Each small rectangle reserves sixteen token positions',
    );
    for (const [row, i] of r.rows.map((r, i) => [r, i])) {
      const y = 360 + i * 140;
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        'R' + (i + 1) + ' · ' + row.tokens + ' tokens',
        160,
        y + 35,
        29,
        upgradeColors.blue,
      );
      for (let j = 0; j < row.blocks; j++) {
        const used = Math.min(16, row.tokens - j * 16);
        api.rect(ctx, 590 + j * 19, y, 17, 45, upgradeColors.panel, upgradeColors.muted, 1);
        api.rect(
          ctx,
          590 + j * 19,
          y + 45 * (1 - used / 16),
          17,
          (45 * used) / 16,
          upgradeColors.cyan,
        );
      }
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        row.blocks + ' blocks',
        590 + row.blocks * 19 + 25,
        y + 35,
        27,
        upgradeColors.cyan,
      );
    }
    if (done('slack-total', currentBeat > 0 || progress > 0.85))
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        '98 blocks = 1,568 slots · 1,545 used · 23 slack',
        960,
        925,
        36,
        upgradeColors.green,
        'center',
      );
    if (currentBeat > 0 && done('fixed-saving'))
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        'Fixed maximum: 8,192 slots · saved 6,624',
        960,
        1010,
        30,
        upgradeColors.yellow,
        'center',
      );
  });
}
export default {
  id: 'allocation-slack',
  draw: drawAllocationSlack,
  cues: ['ga-allocation-slack-b0', 'ga-slack-total', 'ga-allocation-slack-b1', 'ga-fixed-saving'],
};
