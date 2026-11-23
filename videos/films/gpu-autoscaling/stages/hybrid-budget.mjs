import { autoscaleHybrid, gaBound, gaComplete } from '../arithmetic.mjs';
import { drawGpuUpgradeFoot, drawGpuUpgradeHead, drawGpuUpgradeText } from '../defaults.mjs';
export function drawHybridBudget(ctx, scene, state, api) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    progress = gaBound(state.beatP ?? 0);
  const done = (name, fallback = progress > 0.7) => gaComplete(state, 'ga-' + name, fallback);
  api.focus.target('hybrid-budget-mechanism', () => {
    const hybrid = true,
      m = autoscaleHybrid();
    drawGpuUpgradeHead(
      ctx,
      api,
      upgradeColors,
      'Language-only lower-bound worksheet · count each state architecture',
    );
    {
      for (let j = 0; j < 64; j++) {
        const full = j % 4 === 3;
        api.rect(
          ctx,
          180 + (j % 16) * 94,
          350 + Math.floor(j / 16) * 65,
          80,
          45,
          full ? upgradeColors.cyan : upgradeColors.blue,
        );
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          String(j + 1),
          220 + (j % 16) * 94,
          383 + Math.floor(j / 16) * 65,
          21,
          upgradeColors.bg,
          'center',
        );
      }
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        '48 recurrent blocks',
        260,
        680,
        31,
        upgradeColors.blue,
      );
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        '16 full-attention blocks',
        1150,
        680,
        31,
        upgradeColors.cyan,
      );
      drawGpuUpgradeText(
        ctx,
        api,
        upgradeColors,
        'KV = 2 × 16 × 4 × 256 × 8192 × 4 × 2',
        250,
        770,
        30,
        upgradeColors.cyan,
      );
      if (currentBeat > 0 && done('recurrent-bytes', currentBeat > 1))
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          '48 × 48 × 128² × 4 = 144 MiB / request',
          250,
          840,
          31,
          upgradeColors.blue,
        );
      if (currentBeat > 1 && done('hybrid-total'))
        drawGpuUpgradeText(
          ctx,
          api,
          upgradeColors,
          '54 GB + 2 GiB KV + 0.604 GB recurrent; ×1.15 ≈ 65.3 GB',
          960,
          945,
          32,
          upgradeColors.green,
          'center',
        );
    }
    drawGpuUpgradeFoot(
      ctx,
      api,
      upgradeColors,
      'Check the tensors and runtime buffers assigned to each GPU',
    );
  });
}
export default {
  id: 'hybrid-budget',
  draw: drawHybridBudget,
  cues: [
    'ga-hybrid-budget-b0',
    'ga-hybrid-budget-b1',
    'ga-recurrent-bytes',
    'ga-hybrid-budget-b2',
    'ga-hybrid-total',
  ],
};
