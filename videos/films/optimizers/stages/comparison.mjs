import { PATHS, RUNS } from '../fixtures.mjs';
import { SETTINGS, fmt, loss, pair, vector } from '../arithmetic.mjs';
import { cueProgress, traceState } from '../construction.mjs';
import {
  drawOptimizerBowl,
  drawOptimizerFocus,
  drawOptimizerHeader,
  drawOptimizerText,
  drawOptimizerTrace,
} from '../defaults.mjs';
export function drawComparison(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  const q = (id, beat, from, to) => cueProgress(state, id, beat, from, to);
  const colors = {
    sgd: themeColors.blue,
    momentum: themeColors.yellow,
    adam: themeColors.green,
  };
  const names = {
    sgd: 'SGD',
    momentum: 'Momentum',
    adam: 'Adam',
  };
  {
    drawOptimizerHeader(
      ctx,
      api,
      themeColors,
      'Same objective · same start (1, 1) · reset buffers',
      '40 gradient evaluations per recipe',
    );
    const plot = drawOptimizerBowl(ctx, api, themeColors, teaching, {
      x: 220,
      width: 980,
      height: 550,
    });
    const amount = q('comparison-runs', 1, 0.02, 0.56),
      n = Math.floor(amount * 40 + 1e-9);
    drawOptimizerFocus(ctx, api, 'comparison-paths', () => {
      for (const kind of ['sgd', 'momentum', 'adam'])
        drawOptimizerTrace(
          ctx,
          api,
          themeColors,
          teaching,
          plot,
          RUNS[kind],
          traceState(RUNS[kind], amount),
          colors[kind],
          kind === 'sgd',
        );
      drawOptimizerText(ctx, api, themeColors, 'Completed updates: ' + n + ' / 40', 240, 1020, 34);
      for (const [i, kind] of ['sgd', 'momentum', 'adam'].entries()) {
        const w = vector(PATHS[kind][n]),
          y = 360 + i * 195;
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          names[kind] + '  ·  η = ' + SETTINGS[kind],
          1290,
          y,
          35,
          colors[kind],
        );
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          '(a, b) ≈ ' + pair(w, 4),
          1290,
          y + 62,
          30,
          colors[kind],
        );
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          'L ≈ ' + fmt(loss(w), 5),
          1290,
          y + 118,
          30,
          colors[kind],
        );
      }
    });
    if (currentBeat === 0)
      drawOptimizerFocus(ctx, api, 'comparison-question', () =>
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          'Which recipe reduces b most?',
          1320,
          975,
          31,
          themeColors.yellow,
        ),
      );
  }
}
export default {
  id: 'comparison',
  draw: drawComparison,
  cues: ['comparison-prediction', 'comparison-runs'],
};
