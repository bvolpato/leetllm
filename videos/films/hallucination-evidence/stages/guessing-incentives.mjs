import {
  drawEvidenceUpgradeBox,
  drawEvidenceUpgradeFoot,
  drawEvidenceUpgradeLine,
  drawEvidenceUpgradeText,
} from '../defaults.mjs';
export function drawGuessingIncentives(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = api.clamp(state.beatP ?? 0, 0, 1),
    q = api.phase(beatProgress, 0.06, 0.88);
  {
    if (currentBeat === 0) {
      drawEvidenceUpgradeBox(
        ctx,
        api,
        themeColors,
        components,
        'Training examples + statistical objective',
        200,
        365,
        680,
        110,
        themeColors.blue,
      );
      drawEvidenceUpgradeBox(
        ctx,
        api,
        themeColors,
        components,
        'Plausible continuation: 14:30 UTC',
        1060,
        365,
        680,
        110,
        themeColors.pink,
      );
      drawEvidenceUpgradeLine(ctx, api, themeColors, 900, 420, 1040, 420, themeColors.yellow);
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'A fluent continuation can inherit stale patterns and misconceptions',
        960,
        670,
        32,
        themeColors.yellow,
        'center',
      );
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Kalai et al. studied the difficulty of telling valid answers from invalid ones.',
        960,
        790,
        29,
        themeColors.muted,
        'center',
      );
    } else {
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Ten supplied questions · compare the same denominator',
        960,
        270,
        32,
        themeColors.ink,
        'center',
      );
      ['Answer every question', 'Selective answering'].forEach((name, j) => {
        drawEvidenceUpgradeText(
          ctx,
          api,
          themeColors,
          name,
          160,
          390 + j * 250,
          30,
          j ? themeColors.cyan : themeColors.blue,
        );
        for (let i = 0; i < 10; i++) {
          const color = j
            ? i < 7
              ? themeColors.green
              : themeColors.yellow
            : i < 8
              ? themeColors.green
              : themeColors.pink;
          drawEvidenceUpgradeBox(
            ctx,
            api,
            themeColors,
            components,
            j ? (i < 7 ? '✓' : 'withhold') : i < 8 ? '✓' : 'wrong',
            170 + i * 158,
            430 + j * 250,
            140,
            100,
            color,
            25,
          );
        }
        drawEvidenceUpgradeText(
          ctx,
          api,
          themeColors,
          j
            ? '7 of 10 correct   /   0 of 7 answers wrong   /   3 withheld'
            : '8 of 10 correct   /   2 of 10 answers wrong   /   0 withheld',
          960,
          590 + j * 250,
          30,
          j ? themeColors.green : themeColors.pink,
          'center',
        );
      });
    }
    drawEvidenceUpgradeFoot(
      ctx,
      api,
      themeColors,
      currentBeat === 0 ? 'What kind of answer earns a point?' : 'Illustrative scores on the same ten questions',
    );
  }
}
export default {
  id: 'guessing-incentives',
  draw: drawGuessingIncentives,
  cues: ['guessing-incentives-b1', 'guessing-incentives-b2'],
};
