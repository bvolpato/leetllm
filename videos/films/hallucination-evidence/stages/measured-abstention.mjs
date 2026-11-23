import {
  drawEvidenceUpgradeBox,
  drawEvidenceUpgradeFoot,
  drawEvidenceUpgradeLine,
  drawEvidenceUpgradeTable,
  drawEvidenceUpgradeText,
  drawEvidenceUpgradeVisible,
} from '../defaults.mjs';
export function drawMeasuredAbstention(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = api.clamp(state.beatP ?? 0, 0, 1),
    q = api.phase(beatProgress, 0.06, 0.88);
  {
    if (currentBeat === 0) {
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Keep all 10 requests when changing the answering policy',
        960,
        260,
        33,
        themeColors.ink,
        'center',
      );
      drawEvidenceUpgradeTable(
        ctx,
        api,
        themeColors,
        components,
        ['Policy', 'Correct / all', 'Answered / all', 'Wrong / answered'],
        [
          ['Always answer', '8/10', '10/10', '2/10'],
          ['Selective', '7/10', '7/10', '0/7'],
        ],
        150,
        390,
        1620,
        130,
        30,
      );
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Withholding loses one correct answer while avoiding two wrong ones',
        960,
        900,
        31,
        themeColors.yellow,
        'center',
      );
    } else {
      const supported = drawEvidenceUpgradeVisible(ctx, api, 'supported-stability');
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Evidence failures precede the consistency decision',
        960,
        260,
        32,
        themeColors.ink,
        'center',
      );
      drawEvidenceUpgradeBox(
        ctx,
        api,
        themeColors,
        components,
        supported ? 'All selected typed claims supported' : 'ETA field absent from admitted source',
        150,
        370,
        850,
        110,
        supported ? themeColors.green : themeColors.yellow,
        29,
      );
      drawEvidenceUpgradeBox(
        ctx,
        api,
        themeColors,
        components,
        supported ? 'Proceed to stability check' : 'SHORTEN; retain supported clauses',
        1170,
        370,
        600,
        110,
        supported ? themeColors.green : themeColors.yellow,
        28,
      );
      drawEvidenceUpgradeLine(ctx, api, themeColors, 1020, 425, 1140, 425, themeColors.cyan, 3);
      if (supported) {
        const x = (d) => 300 + 1320 * d,
          y = 740;
        drawEvidenceUpgradeLine(ctx, api, themeColors, x(0), y, x(1), y, themeColors.muted, 3);
        for (const d of [0, 0.25, 0.5, 0.75, 1]) {
          drawEvidenceUpgradeLine(
            ctx,
            api,
            themeColors,
            x(d),
            y - 12,
            x(d),
            y + 12,
            themeColors.muted,
            2,
          );
          drawEvidenceUpgradeText(
            ctx,
            api,
            themeColors,
            String(d),
            x(d),
            y + 65,
            27,
            themeColors.muted,
            'center',
          );
        }
        drawEvidenceUpgradeLine(
          ctx,
          api,
          themeColors,
          x(0.25),
          y - 150,
          x(0.25),
          y + 25,
          themeColors.yellow,
          3,
        );
        drawEvidenceUpgradeText(
          ctx,
          api,
          themeColors,
          'threshold .25',
          x(0.25),
          y - 180,
          27,
          themeColors.yellow,
          'center',
        );
        drawEvidenceUpgradeBox(
          ctx,
          api,
          themeColors,
          components,
          'd=.50',
          x(0.5) - 100,
          y - 105,
          200,
          75,
          themeColors.pink,
          30,
        );
        drawEvidenceUpgradeText(
          ctx,
          api,
          themeColors,
          'Above .25 → review; equality .25 passes this stability rule',
          960,
          920,
          30,
          themeColors.yellow,
          'center',
        );
      } else
        drawEvidenceUpgradeText(
          ctx,
          api,
          themeColors,
          'Disagreement zero cannot supply the missing ETA',
          960,
          760,
          34,
          themeColors.yellow,
          'center',
        );
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Missing samples → review · tune thresholds on development cases',
        960,
        985,
        27,
        themeColors.muted,
        'center',
      );
    }
    drawEvidenceUpgradeFoot(
      ctx,
      api,
      themeColors,
      'Entropy/disagreement cutoffs are decision rules, not automatically calibrated probabilities',
    );
  }
}
export default {
  id: 'measured-abstention',
  draw: drawMeasuredAbstention,
  cues: ['measured-abstention-b1', 'measured-abstention-b2', 'supported-stability'],
};
