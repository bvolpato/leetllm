import { stablePairLoss } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import {
  drawRewardExpansionArrow,
  drawRewardExpansionBox,
  drawRewardExpansionDot,
  drawRewardExpansionL,
  drawRewardExpansionText,
  drawRewardExpansionTitle,
} from '../defaults.mjs';
export function drawStableLossAndMargins(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    q = (id, a = 0.15, z = 0.75) => cueProgress(state, id, api.phase(progress, a, z)),
    on = (id, a = 0.3) => q(id, a, a + 0.02) > 0;
  api.focus.target('stable-loss-and-margins-mechanism', () => {
    if (currentBeat === 0) {
      drawRewardExpansionTitle(
        ctx,
        api,
        'Evaluate the loss without overflowing an intermediate exponential',
      );
      drawRewardExpansionText(
        ctx,
        api,
        'max(−Δ, 0) + log(1 + exp(−|Δ|))',
        960,
        380,
        46,
        themeColors.cyan,
      );
      const rows = [-1000, 0, 1000];
      rows.forEach((d, i) => {
        const y = 510 + i * 135;
        drawRewardExpansionBox(ctx, api, 'Δ = ' + d, 180, y, 380, 90, themeColors.blue, 38);
        drawRewardExpansionBox(ctx, api, 'exp(−|Δ|) ≤ 1', 700, y, 620, 90, themeColors.cyan, 34);
        if (on('stable-extremes'))
          drawRewardExpansionBox(
            ctx,
            api,
            'loss ' + (d === 0 ? 'ln 2' : stablePairLoss(d)),
            1460,
            y,
            300,
            90,
            themeColors.yellow,
            34,
          );
        drawRewardExpansionArrow(ctx, api, 590, y + 45, 670, y + 45);
        drawRewardExpansionArrow(ctx, api, 1350, y + 45, 1430, y + 45);
      });
      drawRewardExpansionText(
        ctx,
        api,
        'A sigmoid rounded to zero can lose the later log',
        960,
        975,
        32,
        themeColors.pink,
      );
    } else {
      const m = 1,
        goal = m + Math.log(9),
        reveal = currentBeat === 1 ? on('stable-boundary') : on('stable-target'),
        current = currentBeat === 1 ? 1 : 1 + (goal - 1) * q('stable-target', 0.05, 0.4);
      drawRewardExpansionTitle(
        ctx,
        api,
        currentBeat === 1
          ? 'Reaching the required margin is only the 50% boundary'
          : 'A 90% effective forecast needs more than the required margin',
      );
      const x = 280,
        w = 1320,
        map = (d) => x + (d / 4) * w;
      drawRewardExpansionL(ctx, api, x, 580, x + w, 580);
      [0, 1, 2, 3, 4].forEach((v) => {
        drawRewardExpansionL(ctx, api, map(v), 570, map(v), 590);
        drawRewardExpansionText(ctx, api, v, map(v), 635, 28, themeColors.muted);
      });
      drawRewardExpansionL(ctx, api, map(m), 435, map(m), 550, themeColors.pink, 4);
      drawRewardExpansionText(ctx, api, 'required m = 1', map(m), 380, 32, themeColors.pink);
      drawRewardExpansionDot(ctx, api, map(current), 580, 20, themeColors.yellow);
      drawRewardExpansionText(
        ctx,
        api,
        'Actual Δ = ' + current.toFixed(3),
        map(current),
        710,
        31,
        themeColors.yellow,
      );
      drawRewardExpansionText(
        ctx,
        api,
        reveal
          ? currentBeat === 1
            ? 'Δ = m · effective logit 0 · p = ½ · loss ln 2'
            : 'Target Δ = 1 + log(0.9 / 0.1) = 3.197'
          : 'Effective logit is Δ − m',
        960,
        835,
        37,
        themeColors.yellow,
      );
      if (currentBeat === 1)
        drawRewardExpansionText(
          ctx,
          api,
          reveal ? 'dL / dΔ = −½ · the loss is still pushing' : 'Boundary result pending',
          960,
          930,
          33,
          themeColors.cyan,
        );
      else
        drawRewardExpansionText(
          ctx,
          api,
          'Llama 2 used rating margins · Llama 3 removed them',
          960,
          930,
          31,
          themeColors.muted,
        );
    }
  });
}
export default {
  id: 'stable-loss-and-margins',
  draw: drawStableLossAndMargins,
  cues: [
    'stable-loss-and-margins-step-1',
    'stable-extremes',
    'stable-loss-and-margins-step-2',
    'stable-boundary',
    'stable-loss-and-margins-step-3',
    'stable-target',
  ],
};
