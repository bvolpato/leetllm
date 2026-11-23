import { stablePairLoss } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import {
  drawRewardExpansionBox,
  drawRewardExpansionFoot,
  drawRewardExpansionText,
  drawRewardExpansionTitle,
} from '../defaults.mjs';
export function drawLengthMarginCounterexample(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    q = (id, a = 0.15, z = 0.75) => cueProgress(state, id, api.phase(progress2, a, z)),
    on = (id, a = 0.3) => q(id, a, a + 0.02) > 0;
  api.focus.target('length-margin-counterexample-mechanism', () => {
    if (currentBeat < 2) {
      drawRewardExpansionTitle(
        ctx,
        api,
        'A lower modified loss can preserve the unwanted length direction',
      );
      drawRewardExpansionText(
        ctx,
        api,
        'effective logit = (b − α) × length gap',
        960,
        370,
        43,
        themeColors.cyan,
      );
      const bs = [0, 3, 6],
        values = bs.map((v) => stablePairLoss(v - 1)),
        progress = currentBeat
          ? q('length-losses', 0.05, 0.5)
          : q('length-margin-counterexample-step-1', 0.2, 0.65);
      bs.forEach((v, i) => {
        const x = 220 + i * 570;
        drawRewardExpansionText(
          ctx,
          api,
          'length weight b = ' + v,
          x + 175,
          480,
          32,
          themeColors.blue,
        );
        const height = values[i] * 230;
        api.rect(
          ctx,
          x + 70,
          850 - height * progress,
          210,
          Math.max(2, height * progress),
          themeColors.pink,
          undefined,
          6,
        );
        drawRewardExpansionText(
          ctx,
          api,
          progress >= 1 ? 'loss ' + values[i].toFixed(3) : 'construct loss',
          x + 175,
          920,
          34,
          themeColors.yellow,
        );
      });
      drawRewardExpansionText(
        ctx,
        api,
        'Supplied training gap 1 · α = 1',
        960,
        560,
        30,
        themeColors.muted,
      );
      if (currentBeat && on('length-margin-counterexample-step-2'))
        drawRewardExpansionText(
          ctx,
          api,
          'Short-good vs long-wrong: tie at b = 0; wrong longer answer at b > 0',
          960,
          990,
          29,
          themeColors.pink,
        );
    } else {
      drawRewardExpansionTitle(
        ctx,
        api,
        'Break the quality–presentation correlation in the comparisons',
      );
      const names = [
          ['short + useful', 'long + necessary'],
          ['short + error', 'verbose + error'],
        ],
        colors = [
          [themeColors.green, themeColors.green],
          [themeColors.pink, themeColors.pink],
        ];
      names.forEach((row, r) =>
        row.forEach((v, c) =>
          drawRewardExpansionBox(
            ctx,
            api,
            v,
            230 + c * 840,
            390 + r * 230,
            620,
            135,
            colors[r][c],
            36,
          ),
        ),
      );
      drawRewardExpansionText(ctx, api, 'Length', 960, 350, 31, themeColors.yellow);
      drawRewardExpansionText(
        ctx,
        api,
        'Quality controlled independently',
        960,
        895,
        35,
        themeColors.cyan,
      );
      drawRewardExpansionText(
        ctx,
        api,
        on('length-factorial')
          ? 'Also test agreement with a false premise and list formatting'
          : 'Compare replies of the same length',
        960,
        975,
        30,
        themeColors.muted,
      );
    }
    if (currentBeat === 2)
      drawRewardExpansionFoot(
        ctx,
        api,
        'Eisenstein et al. · Lists in preference data ≈ 8% · Lists in generated helpfulness answers ≈ 50%',
      );
  });
}
export default {
  id: 'length-margin-counterexample',
  draw: drawLengthMarginCounterexample,
  cues: [
    'length-margin-counterexample-step-1',
    'length-margin-counterexample-step-2',
    'length-losses',
    'length-margin-counterexample-step-3',
    'length-factorial',
  ],
};
