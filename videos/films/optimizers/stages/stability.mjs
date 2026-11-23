import { RUNS, UNSAFE } from '../fixtures.mjs';
import { cueProgress, traceState } from '../construction.mjs';
import {
  drawOptimizerBowl,
  drawOptimizerFocus,
  drawOptimizerHeader,
  drawOptimizerMath,
  drawOptimizerReceipt,
  drawOptimizerText,
  drawOptimizerTrace,
} from '../defaults.mjs';
import { preserveLegacyPaletteReads } from '../compatibility.mjs';
export function drawStability(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  const q = (id, beat, from, to) => cueProgress(state, id, beat, from, to);
  preserveLegacyPaletteReads(themeColors);
  {
    const unsafe = currentBeat > 0,
      run = unsafe ? UNSAFE : RUNS.sgd;
    drawOptimizerHeader(
      ctx,
      api,
      themeColors,
      unsafe ? 'Reset to (1, 1) · larger rate 0.021' : 'Rate 0.018 · exact gradients',
      'Eight updates · one objective',
    );
    const plot = drawOptimizerBowl(ctx, api, themeColors, teaching, {
      xd: [-2.45, 2.45],
      yd: [-1.3, 1.3],
    });
    const f = traceState(
      run,
      currentBeat === 0
        ? q('safe-trace', 0, 0.02, 0.67)
        : currentBeat === 1
          ? 0
          : q('unsafe-trace', 2, 0.02, 0.35),
      0,
      8,
    );
    drawOptimizerFocus(ctx, api, unsafe ? 'unsafe-path' : 'safe-path', () =>
      drawOptimizerTrace(
        ctx,
        api,
        themeColors,
        teaching,
        plot,
        run,
        f,
        unsafe ? themeColors.yellow : themeColors.blue,
      ),
    );
    drawOptimizerReceipt(
      ctx,
      api,
      themeColors,
      f,
      1320,
      370,
      unsafe ? themeColors.yellow : themeColors.blue,
    );
    if (currentBeat === 1)
      drawOptimizerFocus(ctx, api, 'stability-question', () => {
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          'Will the crossings shrink?',
          1320,
          650,
          33,
          themeColors.yellow,
        );
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          'Next endpoint = ?',
          1320,
          715,
          33,
          themeColors.yellow,
        );
      });
    if (currentBeat === 2)
      drawOptimizerFocus(ctx, api, 'stability-rule', () => {
        if (q('stability-factor', 2, 0.5, 0.7) === 1) {
          drawOptimizerMath(ctx, api, themeColors, 'a_{t+1}=(1-100\\eta)a_t', 1320, 650, 35);
          drawOptimizerMath(
            ctx,
            api,
            themeColors,
            '1-100(0.021)=-1.1',
            1320,
            730,
            36,
            themeColors.yellow,
          );
          drawOptimizerMath(ctx, api, themeColors, '|1-100\\eta|<1', 1320, 820, 37);
          drawOptimizerMath(
            ctx,
            api,
            themeColors,
            '0<\\eta<0.02',
            1320,
            900,
            40,
            themeColors.green,
          );
        } else
          drawOptimizerText(
            ctx,
            api,
            themeColors,
            'Multiplier = ?',
            1320,
            650,
            33,
            themeColors.yellow,
          );
      });
  }
}
export default {
  id: 'stability',
  draw: drawStability,
  cues: ['safe-trace', 'unsafe-question', 'unsafe-trace', 'stability-factor'],
};
