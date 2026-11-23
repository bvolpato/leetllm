import { clause } from '../construction.mjs';
import { drawCoreCell, drawCoreLine, drawCoreNote, drawCoreText } from '../defaults.mjs';
export function drawRegistryObject(ctx, scene, state, api) {
  api.focus.target('tr-registry-object-trace', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat,
      op = (beat, n) => clause(state, 'registry-object', beat, n, api),
      done = (beat, n) => op(beat, n) >= 1;
    {
      drawCoreText(
        ctx,
        api,
        'Register the object that actually changed',
        150,
        285,
        34,
        themeColors.cyan,
      );
      if (currentBeat === 0) {
        const prompt = '{evidence} → supported route';
        drawCoreCell(ctx, api, 'Prompt template', 150, 380, 710, 100, themeColors.yellow);
        drawCoreText(
          ctx,
          api,
          '{evidence} \u2192 supported route',
          150,
          585,
          31,
          themeColors.yellow,
        );
        drawCoreCell(ctx, api, 'Model package', 1050, 380, 690, 100, themeColors.blue);
        ['Weights', 'Python function', 'Inference wrapper'].forEach((v, i) =>
          drawCoreCell(ctx, api, v, 1050, 535 + i * 110, 690, 75, themeColors.blue),
        );
        drawCoreNote(
          ctx,
          api,
          'Prompt Registry versions templates; Model Registry versions evaluated packages',
        );
      } else {
        drawCoreCell(ctx, api, 'Evaluated template bytes', 150, 400, 760, 100, themeColors.yellow);
        drawCoreCell(ctx, api, 'Example returns v4', 1050, 400, 690, 100, themeColors.cyan);
        drawCoreLine(ctx, api, 930, 450, 1030, 450, themeColors.cyan);
        if (done(1, 2)) {
          drawCoreCell(ctx, api, 'Hardcoded v1', 150, 670, 580, 90, themeColors.pink);
          drawCoreCell(ctx, api, 'Use returned v4', 1050, 670, 690, 90, themeColors.green);
        }
        drawCoreNote(
          ctx,
          api,
          'Supplied v4 example · registration, alias setting and release approval differ',
        );
      }
    }
  });
}
export default {
  id: 'registry-object',
  draw: drawRegistryObject,
  cues: [
    'tr-registry-object-0-0',
    'tr-registry-object-0-1',
    'tr-registry-object-0-2',
    'tr-registry-object-0-3',
    'tr-registry-object-0-4',
    'tr-registry-object-1-0',
    'tr-registry-object-1-1',
    'tr-registry-object-1-2',
    'tr-registry-object-1-3',
    'tr-registry-object-1-4',
  ],
};
