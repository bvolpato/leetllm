import { gaBound } from '../arithmetic.mjs';
import {
  drawGpuUpgradeArrow,
  drawGpuUpgradeBox,
  drawGpuUpgradeFoot,
  drawGpuUpgradeHead,
  drawGpuUpgradeL,
} from '../defaults.mjs';
export function drawLogicalPages(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  api.focus.target('logical-pages-mechanism', () => {
    drawGpuUpgradeHead(
      ctx,
      api,
      upgradeColors,
      'Logical order stays fixed while physical addresses differ',
    );
    const physical = [5, 2, 8],
      cols = 6;
    for (let j = 0; j < 12; j++) {
      const x = 820 + (j % cols) * 145,
        y = 380 + Math.floor(j / cols) * 230,
        active = physical.includes(j);
      drawGpuUpgradeBox(
        ctx,
        api,
        upgradeColors,
        upgradeComponents,
        'P' + j,
        x,
        y,
        110,
        110,
        active ? upgradeColors.cyan : upgradeColors.muted,
        28,
      );
    }
    const selected = Math.min(2, Math.floor(progress * 3));
    for (let i = 0; i < 3; i++) {
      drawGpuUpgradeBox(
        ctx,
        api,
        upgradeColors,
        upgradeComponents,
        'L' + i + ' → P' + physical[i],
        170,
        385 + i * 170,
        420,
        95,
        i === selected ? upgradeColors.cyan : upgradeColors.blue,
        30,
      );
      if (i === selected) {
        const x = 875 + (physical[i] % cols) * 145,
          y = 380 + Math.floor(physical[i] / cols) * 230,
          corridor = i === 2 ? 570 : 330;
        drawGpuUpgradeL(
          ctx,
          api,
          upgradeColors,
          610,
          430 + i * 170,
          730,
          430 + i * 170,
          upgradeColors.cyan,
        );
        drawGpuUpgradeL(
          ctx,
          api,
          upgradeColors,
          730,
          430 + i * 170,
          730,
          corridor,
          upgradeColors.cyan,
        );
        drawGpuUpgradeL(ctx, api, upgradeColors, 730, corridor, x, corridor, upgradeColors.cyan);
        drawGpuUpgradeArrow(ctx, api, upgradeColors, x, corridor, x, y - 8, upgradeColors.cyan);
      }
    }
    if (currentBeat > 0)
      drawGpuUpgradeBox(
        ctx,
        api,
        upgradeColors,
        upgradeComponents,
        'next L3 → free P1',
        240,
        925,
        630,
        65,
        upgradeColors.green,
        29,
      );
    drawGpuUpgradeFoot(
      ctx,
      api,
      upgradeColors,
      'Block allocation preserves order; prefix reuse needs compatible computed state',
    );
  });
}
export default {
  id: 'logical-pages',
  draw: drawLogicalPages,
  cues: ['ga-logical-pages-b0', 'ga-logical-pages-b1'],
};
