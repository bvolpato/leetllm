import { clamp01 } from '../arithmetic.mjs';
import { sentence, tinkerConstruction } from '../construction.mjs';
import { drawExtendedCard, drawExtendedNote, drawExtendedText } from '../defaults.mjs';
export function drawTransportComparison(ctx, scene, state, api) {
  return paintTransportComparison(ctx, scene, state, api);
}
function paintTransportComparison(ctx, scene, state, api) {
  const { C: themeColors, teaching, focus } = api,
    modelState = tinkerConstruction('transport-comparison', state),
    currentBeat = modelState.b;
  const cueProgress = (beat, index) => sentence(state, 'transport-comparison', beat, index);
  return focus.target('tk-transport-comparison-trace', () => {
    drawExtendedText(
      ctx,
      api,
      'Different request operands and resource owners',
      960,
      275,
      32,
      themeColors.yellow,
      'center',
    );
    drawExtendedCard(
      ctx,
      api,
      'Tinker · hosted algorithm interface',
      170,
      345,
      700,
      100,
      themeColors.blue,
      31,
    );
    drawExtendedCard(
      ctx,
      api,
      'DeepEP · self-hosted transport',
      1050,
      345,
      700,
      100,
      themeColors.yellow,
      31,
    );
    drawExtendedText(
      ctx,
      api,
      'Targets / behavior log p / advantage',
      520,
      510,
      28,
      themeColors.cyan,
      'center',
    );
    teaching.grid({
      x: 210,
      y: 555,
      width: 620,
      height: 95,
      rows: 1,
      columns: 2,
      labels: [['20 / −.4 / .5', '21 / −.8 / .5']],
      fontSize: 27,
      fill: themeColors.panel,
      stroke: themeColors.blue,
      textColor: themeColors.blue,
    });
    drawExtendedCard(
      ctx,
      api,
      'Separate sampler snapshot v2',
      210,
      710,
      620,
      90,
      themeColors.yellow,
      28,
    );
    drawExtendedText(
      ctx,
      api,
      'Supplied dispatch permutation',
      1400,
      510,
      28,
      themeColors.yellow,
      'center',
    );
    const tokens = [
        {
          id: 'T0',
          expert: 1,
        },
        {
          id: 'T1',
          expert: 0,
        },
        {
          id: 'T2',
          expert: 1,
        },
      ],
      progress = currentBeat === 0 ? cueProgress(0, 1) : 1;
    tokens.forEach((token, i) => {
      const travel = clamp01(progress * 3 - i),
        startX = 1080 + i * 220,
        endX = token.expert === 0 ? 1110 : 1400 + (i === 2 ? 200 : 0),
        startY = 575,
        endY = token.expert === 0 ? 735 : 820;
      drawExtendedCard(
        ctx,
        api,
        token.id + ' / E' + token.expert,
        startX + (endX - startX) * travel,
        startY + (endY - startY) * travel,
        165,
        75,
        token.expert === 0 ? themeColors.green : themeColors.yellow,
        27,
      );
    });
    if (currentBeat > 0) {
      drawExtendedText(
        ctx,
        api,
        'Experiment cost / token receipts',
        520,
        850,
        27,
        themeColors.blue,
        'center',
      );
      drawExtendedText(
        ctx,
        api,
        'Dispatch/combine buffers / rank health',
        1400,
        930,
        26,
        themeColors.yellow,
        'center',
      );
    }
    drawExtendedNote(
      ctx,
      api,
      'Transport routes expert tokens; it does not choose group rewards, adapter updates or sampler paths.',
    );
  });
}
export default {
  id: 'transport-comparison',
  draw: drawTransportComparison,
  cues: [
    'tk-transport-comparison-0-0',
    'tk-transport-comparison-0-1',
    'tk-transport-comparison-0-2',
    'tk-transport-comparison-1-0',
    'tk-transport-comparison-1-1',
    'tk-transport-comparison-1-2',
    'tk-transport-comparison-1-3',
  ],
};
