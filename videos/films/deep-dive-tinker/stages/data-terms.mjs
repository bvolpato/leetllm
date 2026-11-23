import { sentence, tinkerConstruction } from '../construction.mjs';
import { drawExtendedCard, drawExtendedNote, drawExtendedText } from '../defaults.mjs';
export function drawDataTerms(ctx, scene, state, api) {
  return paintDataTerms(ctx, scene, state, api);
}
function paintDataTerms(ctx, scene, state, api) {
  const { C: themeColors, focus } = api,
    modelState = tinkerConstruction('data-terms', state),
    currentBeat = modelState.b;
  const cueProgress = (beat, index) => sentence(state, 'data-terms', beat, index),
    resultComplete = (beat, index) => cueProgress(beat, index) === 1;
  return focus.target('tk-data-terms-trace', () => {
    if (currentBeat < 2) {
      drawExtendedText(
        ctx,
        api,
        'Different grants apply to different resources',
        960,
        275,
        34,
        themeColors.yellow,
        'center',
      );
      const names = [
        'SDK / Cookbook source',
        'Hosted account and processing',
        'Third-party model / dataset',
      ];
      const grants = [
        'Apache 2 source grant',
        'Applicable service agreement',
        'Separate license / rights',
      ];
      names.forEach((name, i) => {
        drawExtendedText(ctx, api, name, 170, 395 + i * 165, 29, themeColors.blue);
        drawExtendedCard(
          ctx,
          api,
          grants[i],
          850,
          335 + i * 165,
          870,
          120,
          i === 0 ? themeColors.green : themeColors.yellow,
          31,
        );
      });
      if (currentBeat === 1) {
        drawExtendedCard(
          ctx,
          api,
          'Published commitment: customer content excluded from provider training',
          170,
          800,
          1550,
          75,
          themeColors.pink,
          27,
        );
        drawExtendedCard(
          ctx,
          api,
          'Benchmark / competitive-analysis restrictions: check the applicable agreement',
          170,
          895,
          1550,
          75,
          themeColors.pink,
          27,
        );
      }
      drawExtendedNote(
        ctx,
        api,
        'A source checkout does not supply hosted access, model rights or enterprise data commitments.',
      );
    } else {
      drawExtendedText(
        ctx,
        api,
        'Before submission or storage: inspect the actual datum and trace',
        960,
        275,
        32,
        themeColors.yellow,
        'center',
      );
      const rows = [
        ['prompt', 'clamp example'],
        ['private user field', resultComplete(2, 0) ? '[redacted]' : 'remove before submission'],
        ['tool credential', resultComplete(2, 0) ? '[redacted]' : 'remove before storage'],
        ['checkpoint', 'adapter v2 · potentially sensitive'],
      ];
      rows.forEach(([name, value], i) => {
        drawExtendedText(ctx, api, name, 170, 390 + i * 125, 29, themeColors.blue);
        drawExtendedCard(
          ctx,
          api,
          value,
          780,
          335 + i * 125,
          940,
          95,
          i === 0 ? themeColors.cyan : i === 3 ? themeColors.yellow : themeColors.pink,
          30,
        );
      });
      drawExtendedNote(
        ctx,
        api,
        'Set retention; residency and deletion require current product / agreement evidence.',
      );
    }
  });
}
export default {
  id: 'data-terms',
  draw: drawDataTerms,
  cues: [
    'tk-data-terms-0-0',
    'tk-data-terms-0-1',
    'tk-data-terms-0-2',
    'tk-data-terms-0-3',
    'tk-data-terms-1-0',
    'tk-data-terms-1-1',
    'tk-data-terms-1-2',
    'tk-data-terms-2-0',
    'tk-data-terms-2-1',
    'tk-data-terms-2-2',
    'tk-data-terms-2-3',
  ],
};
