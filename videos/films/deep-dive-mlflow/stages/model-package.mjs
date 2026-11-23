import { mix } from '../arithmetic.mjs';
import { mlflowSentenceProgress, sampleMlflowChapter } from '../construction.mjs';
import { chapterText, chip, contentDigest, flow, footer } from '../defaults.mjs';
export function drawModelPackage(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleMlflowChapter('model-package', state),
    currentBeat = modelState.b;
  const teaching2 = (beat, sentence) =>
    mlflowSentenceProgress('model-package', state, beat, sentence);
  {
    const run = chip(ctx, api, 'Source run R8', 160, 330, 380, themeColors.blue),
      logged = chip(ctx, api, 'Logged model M3', 765, 330, 400, themeColors.cyan),
      version = chip(ctx, api, 'Registry version 3', 1380, 330, 390, themeColors.green);
    flow(ctx, api, run, logged, teaching2(0, 1));
    flow(ctx, api, logged, version, teaching2(0, 2), themeColors.green);
    const parts = [
      'weight bytes: ' + (modelState.changed ? 'B' : 'A'),
      'flavor loader',
      'environment',
      'I/O signature',
    ];
    parts.forEach((name, i) => {
      const p = currentBeat ? 1 : teaching2(0, 0),
        width = 300,
        x = 200 + i * 400;
      chip(
        ctx,
        api,
        name,
        x,
        mix(710, 570, p),
        width,
        i === 0 ? (modelState.changed ? themeColors.pink : themeColors.blue) : themeColors.cyan,
        100,
      );
    });
    if (currentBeat > 0) {
      chapterText(
        ctx,
        api,
        'Evaluated: ' + contentDigest(ctx, api, modelState.evaluated),
        220,
        760,
        31,
        themeColors.blue,
      );
      chapterText(
        ctx,
        api,
        'Current: ' + contentDigest(ctx, api, modelState.candidate),
        1100,
        760,
        31,
        modelState.changed ? themeColors.pink : themeColors.cyan,
      );
      chapterText(
        ctx,
        api,
        modelState.changed
          ? 'Same version · different artifact bytes'
          : 'Compare actual input schema and artifact bytes',
        960,
        currentBeat === 2 ? 825 : 875,
        35,
        modelState.changed ? themeColors.pink : themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 2) {
      chip(ctx, api, 'production alias', 500, 875, 370, themeColors.yellow);
      chip(
        ctx,
        api,
        modelState.alias >= 1 ? 'version 4' : 'version 3',
        1090,
        875,
        300,
        themeColors.cyan,
      );
    }
    footer(
      ctx,
      api,
      'A signature tests the applied schema; release quality needs its own evidence',
    );
  }
}
export default {
  id: 'model-package',
  draw: drawModelPackage,
  cues: [
    'mf-model-package-0',
    'mf-sentence-model-package-0-0',
    'mf-sentence-model-package-0-1',
    'mf-sentence-model-package-0-2',
    'mf-sentence-model-package-0-3',
    'mf-model-package-1',
    'mf-sentence-model-package-1-0',
    'mf-sentence-model-package-1-1',
    'mf-sentence-model-package-1-2',
    'mf-sentence-model-package-1-3',
    'mf-model-package-2',
    'mf-sentence-model-package-2-0',
    'mf-sentence-model-package-2-1',
    'mf-sentence-model-package-2-2',
    'mf-sentence-model-package-2-3',
  ],
};
