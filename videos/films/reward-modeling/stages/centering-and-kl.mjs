import { cueProgress } from '../construction.mjs';
import {
  drawRewardExpansionArrow,
  drawRewardExpansionBox,
  drawRewardExpansionDot,
  drawRewardExpansionL,
  drawRewardExpansionText,
  drawRewardExpansionTitle,
} from '../defaults.mjs';
export function drawCenteringAndKl(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    q = (id, a = 0.15, z = 0.75) => cueProgress(state, id, api.phase(progress2, a, z));
  api.focus.target('centering-and-kl-mechanism', () => {
    if (currentBeat < 2) {
      drawRewardExpansionTitle(
        ctx,
        api,
        'Center the midpoint; a wide pair can still have zero penalty',
      );
      const move = currentBeat > 0 ? 1 : q('centering-extreme', 0.4, 0.7),
        extreme = move >= 1,
        values = [-2 - 98 * move, 4 + 96 * move],
        x = 280,
        w = 1360,
        map = (v) => x + ((v + 110) / 220) * w;
      drawRewardExpansionL(ctx, api, x, 570, x + w, 570);
      [-100, 0, 100].forEach((v) => {
        drawRewardExpansionL(ctx, api, map(v), 555, map(v), 585);
        drawRewardExpansionText(ctx, api, v, map(v), 640, 28, themeColors.muted);
      });
      values.forEach((v, i) => {
        drawRewardExpansionDot(ctx, api, map(v), 570, 18, i ? themeColors.green : themeColors.pink);
        drawRewardExpansionText(
          ctx,
          api,
          (i ? 'chosen ' : 'rejected ') + Number(v.toFixed(1)),
          map(v),
          Math.abs(values[1] - values[0]) < 35 ? (i ? 505 : 420) : 465,
          32,
          i ? themeColors.green : themeColors.pink,
        );
      });
      const mid = (values[0] + values[1]) / 2;
      drawRewardExpansionL(ctx, api, map(mid), 670, map(mid), 720, themeColors.yellow, 4);
      drawRewardExpansionText(
        ctx,
        api,
        'midpoint ' + Number(mid.toFixed(2)),
        map(mid),
        780,
        34,
        themeColors.yellow,
      );
      drawRewardExpansionText(
        ctx,
        api,
        'γ × (chosen + rejected)² = 4γ × midpoint²',
        960,
        880,
        38,
        themeColors.cyan,
      );
      drawRewardExpansionText(
        ctx,
        api,
        extreme
          ? '−100 + 100 = 0 · centering penalty 0 · margin 200'
          : 'Pair origin and pair spread are different measurements',
        960,
        965,
        34,
        extreme ? themeColors.yellow : themeColors.muted,
      );
      if (currentBeat === 1)
        drawRewardExpansionText(
          ctx,
          api,
          'TRL 1.17.1 default None · suggested starting γ 0.01',
          960,
          350,
          31,
          themeColors.muted,
        );
    } else {
      drawRewardExpansionTitle(
        ctx,
        api,
        'Compare complete ideal objectives before inferring policy behavior',
      );
      drawRewardExpansionBox(ctx, api, 'E[3r] − β KL', 150, 410, 710, 125, themeColors.pink, 44);
      drawRewardExpansionBox(
        ctx,
        api,
        'E[r] − (β / 3) KL',
        1060,
        410,
        710,
        125,
        themeColors.cyan,
        42,
      );
      const progress = q('centering-and-kl-step-3', 0.25, 0.6);
      if (progress > 0) {
        drawRewardExpansionArrow(ctx, api, 885, 470, 1030, 470, themeColors.yellow);
        drawRewardExpansionText(
          ctx,
          api,
          'divide the entire left objective by 3',
          960,
          650,
          34,
          themeColors.yellow,
        );
      }
      drawRewardExpansionText(
        ctx,
        api,
        progress >= 1
          ? 'Positive scaling preserves the ideal maximizer'
          : 'Keep the same reference policy and objective domain',
        960,
        795,
        35,
        progress >= 1 ? themeColors.green : themeColors.muted,
      );
      drawRewardExpansionText(
        ctx,
        api,
        'PPO clipping, normalization and finite optimization remain separate',
        960,
        940,
        31,
        themeColors.muted,
      );
    }
  });
}
export default {
  id: 'centering-and-kl',
  draw: drawCenteringAndKl,
  cues: [
    'centering-and-kl-step-1',
    'centering-extreme',
    'centering-and-kl-step-2',
    'centering-and-kl-step-3',
  ],
};
