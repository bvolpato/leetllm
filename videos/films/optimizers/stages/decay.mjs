import { DECAY, RUNS } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import {
  drawOptimizerFocus,
  drawOptimizerHeader,
  drawOptimizerMark,
  drawOptimizerMath,
  drawOptimizerSegment,
  drawOptimizerText,
} from '../defaults.mjs';
import { preserveLegacyPaletteReads } from '../compatibility.mjs';
export function drawDecay(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  const q = (id, beat, from, to) => cueProgress(state, id, beat, from, to);
  preserveLegacyPaletteReads(themeColors);
  {
    drawOptimizerHeader(
      ctx,
      api,
      themeColors,
      'Cold first step · original parameters (1, 1) · η = 0.08 · λ = 0.1',
      'Separate data direction and shrink',
    );
    const plot = teaching.axes({
      color: themeColors.muted,
      x: 290,
      y: 360,
      width: 680,
      height: 540,
      xDomain: [0.9, 1.02],
      yDomain: [0.9, 1.02],
      equalUnits: true,
      xTicks: [0.92, 1],
      yTicks: [0.92, 1],
      xLabel: 'a',
      yLabel: 'b',
      fontSize: 26,
    });
    const data = q('decay-data', 0, 0.5, 0.65),
      shrink = data === 1 ? q('decay-shrink', 0, 0.65, 0.79) : 0;
    drawOptimizerMark(ctx, api, themeColors, plot, [1, 1], themeColors.ink, 'start');
    drawOptimizerFocus(ctx, api, 'decay-data-step', () => {
      drawOptimizerSegment(
        ctx,
        api,
        plot,
        DECAY.before,
        RUNS.adam.records[0].next,
        data,
        themeColors.green,
        7,
      );
      drawOptimizerText(
        ctx,
        api,
        themeColors,
        data === 1 ? 'Adam data endpoint ≈ (0.92, 0.92)' : 'Adam data endpoint = ?',
        1140,
        355,
        32,
        themeColors.green,
      );
      drawOptimizerMath(
        ctx,
        api,
        themeColors,
        '\\Delta w_{data}=-0.08\\frac{\\widehat m}{\\sqrt{\\widehat v}+\\epsilon}',
        1140,
        445,
        38,
        themeColors.green,
      );
    });
    drawOptimizerFocus(ctx, api, 'decay-shrink-step', () => {
      drawOptimizerSegment(
        ctx,
        api,
        plot,
        RUNS.adam.records[0].next,
        DECAY.next,
        shrink,
        themeColors.yellow,
        7,
      );
      drawOptimizerText(
        ctx,
        api,
        themeColors,
        shrink === 1 ? 'Extra shrink = (−0.008, −0.008)' : 'Extra shrink = ?',
        1140,
        570,
        32,
        themeColors.yellow,
      );
      drawOptimizerMath(
        ctx,
        api,
        themeColors,
        '\\Delta w_{decay}=-0.08(0.1)w_{old}',
        1140,
        650,
        39,
        themeColors.yellow,
      );
      if (shrink === 1)
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          'AdamW endpoint ≈ (0.912, 0.912)',
          1140,
          745,
          32,
          themeColors.yellow,
        );
    });
    if (currentBeat === 1) {
      drawOptimizerFocus(ctx, api, 'coupled-gradient', () => {
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          q('coupled-penalty', 1, 0.1, 0.3) === 1
            ? 'Coupled g + λw = (100.1, 1.1)'
            : 'Coupled gradient = ?',
          250,
          1025,
          32,
          themeColors.cyan,
        );
      });
      drawOptimizerFocus(ctx, api, 'coupled-result', () => {
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          q('coupled-result', 1, 0.45, 0.65) === 1
            ? 'Coupled first endpoint ≈ (0.92, 0.92)'
            : 'Coupled first endpoint = ?',
          1140,
          920,
          32,
          themeColors.cyan,
        );
      });
    }
  }
}
export default {
  id: 'decay',
  draw: drawDecay,
  cues: ['decay-data', 'decay-shrink', 'coupled-penalty', 'coupled-result'],
};
