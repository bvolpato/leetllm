import { cueProgress } from '../construction.mjs';
import {
  drawRewardExpansionBox,
  drawRewardExpansionL,
  drawRewardExpansionText,
  drawRewardExpansionTitle,
} from '../defaults.mjs';
export function drawBenchmarksAndFreshGates(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    q = (id, a = 0.15, z = 0.75) => cueProgress(state, id, api.phase(progress, a, z)),
    on = (id, a = 0.3) => q(id, a, a + 0.02) > 0;
  api.focus.target('benchmarks-and-fresh-gates-mechanism', () => {
    if (currentBeat === 0) {
      drawRewardExpansionTitle(
        ctx,
        api,
        'Ordinary RewardBench 2 cases choose one answer out of four',
      );
      const filled = on('benchmark-four');
      ['A', 'B', 'C', 'D'].forEach((v, i) => {
        drawRewardExpansionBox(
          ctx,
          api,
          v,
          180 + i * 430,
          390,
          360,
          160,
          filled && i === 2 ? themeColors.green : themeColors.blue,
          60,
        );
      });
      drawRewardExpansionText(
        ctx,
        api,
        filled
          ? 'One correct candidate / four = 25% random baseline'
          : 'Retain the benchmark outcome space',
        960,
        650,
        37,
        themeColors.yellow,
      );
      drawRewardExpansionText(
        ctx,
        api,
        'RB: chat · hard chat · safety · reasoning',
        960,
        775,
        30,
        themeColors.cyan,
      );
      drawRewardExpansionText(
        ctx,
        api,
        'RB2: factuality · precise instruction · math · safety · focus · ties',
        960,
        870,
        29,
        themeColors.cyan,
      );
      drawRewardExpansionText(
        ctx,
        api,
        'Ties has a separate metric',
        960,
        960,
        32,
        themeColors.muted,
      );
    } else if (currentBeat === 1) {
      drawRewardExpansionTitle(
        ctx,
        api,
        'Keep the studied generator and selection protocol attached',
      );
      const count = Math.floor(q('benchmarks-and-fresh-gates-step-2', 0.15, 0.55) * 16.999);
      for (let i = 0; i < 16; i++) {
        const x = 200 + (i % 8) * 180,
          y = 390 + Math.floor(i / 8) * 155;
        drawRewardExpansionBox(
          ctx,
          api,
          i < count ? 'candidate ' + (i + 1) : 'pending',
          x,
          y,
          160,
          105,
          i < count ? themeColors.blue : themeColors.muted,
          23,
        );
      }
      drawRewardExpansionText(
        ctx,
        api,
        'Tulu 3 SFT 8B · best of 16 · Pearson 0.87 in the reported setup',
        960,
        820,
        34,
        themeColors.yellow,
      );
      drawRewardExpansionText(
        ctx,
        api,
        'PPO behavior changed with initialization and prompt distribution',
        960,
        940,
        32,
        themeColors.muted,
      );
    } else {
      drawRewardExpansionTitle(
        ctx,
        api,
        'A static score and a fresh-output screen answer different questions',
      );
      const vals = [0.92, 0.64],
        xs = [430, 1210];
      vals.forEach((v, i) => {
        drawRewardExpansionText(
          ctx,
          api,
          i ? 'Fresh outputs' : 'Static pairs',
          xs[i] + 110,
          360,
          34,
          i ? themeColors.pink : themeColors.cyan,
        );
        api.rect(
          ctx,
          xs[i],
          850 - v * 420,
          220,
          v * 420,
          i ? themeColors.pink : themeColors.cyan,
          undefined,
          8,
        );
        drawRewardExpansionText(
          ctx,
          api,
          (v * 100).toFixed(0) + '%',
          xs[i] + 110,
          930,
          45,
          i ? themeColors.pink : themeColors.cyan,
        );
      });
      const floorY = 850 - 0.8 * 420;
      drawRewardExpansionL(ctx, api, 220, floorY, 1660, floorY, themeColors.yellow, 4);
      drawRewardExpansionText(
        ctx,
        api,
        'Trial requires 80%',
        960,
        floorY - 25,
        27,
        themeColors.yellow,
      );
      drawRewardExpansionText(
        ctx,
        api,
        on('benchmark-fresh')
          ? '64% on fresh answers falls below the trial threshold'
          : 'Screening decision pending',
        960,
        995,
        34,
        on('benchmark-fresh') ? themeColors.pink : themeColors.muted,
      );
    }
  });
}
export default {
  id: 'benchmarks-and-fresh-gates',
  draw: drawBenchmarksAndFreshGates,
  cues: [
    'benchmarks-and-fresh-gates-step-1',
    'benchmark-four',
    'benchmarks-and-fresh-gates-step-2',
    'benchmarks-and-fresh-gates-step-3',
    'benchmark-fresh',
  ],
};
