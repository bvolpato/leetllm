import { clause } from '../construction.mjs';
import { drawCoreCell, drawCoreNote, drawCoreText } from '../defaults.mjs';
export function drawCompiledContract(ctx, scene, state, api) {
  api.focus.target('tr-compiled-contract-trace', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat,
      op = (beat, n) => clause(state, 'compiled-contract', beat, n, api),
      done = (beat, n) => op(beat, n) >= 1;
    {
      drawCoreText(
        ctx,
        api,
        'A compiled candidate carries the same evaluation contract',
        150,
        285,
        33,
        themeColors.cyan,
      );
      const names = [
        'Program + optimizer',
        'Model revision',
        'Train / development',
        'Final holdout',
        'Metric version',
        'Actual compiled state',
      ];
      names.forEach((v, i) =>
        drawCoreCell(
          ctx,
          api,
          v,
          150 + (i % 3) * 550,
          400 + Math.floor(i / 3) * 150,
          480,
          100,
          i === 3 ? themeColors.yellow : themeColors.blue,
        ),
      );
      if (currentBeat === 1 && done(1, 0)) {
        drawCoreCell(
          ctx,
          api,
          'Frozen candidate → independent final test',
          150,
          780,
          1580,
          95,
          themeColors.green,
        );
      }
      drawCoreNote(
        ctx,
        api,
        'Keep rejected candidates and redacted reports; a tracker can record a misleading score',
      );
    }
  });
}
export default {
  id: 'compiled-contract',
  draw: drawCompiledContract,
  cues: [
    'tr-compiled-contract-0-0',
    'tr-compiled-contract-0-1',
    'tr-compiled-contract-0-2',
    'tr-compiled-contract-0-3',
    'tr-compiled-contract-1-0',
    'tr-compiled-contract-1-1',
    'tr-compiled-contract-1-2',
  ],
};
