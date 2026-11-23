import { RUNS } from '../fixtures.mjs';
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
export function drawAdamStep(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  const q = (id, beat, from, to) => cueProgress(state, id, beat, from, to);
  preserveLegacyPaletteReads(themeColors);
  {
    drawOptimizerHeader(
      ctx,
      api,
      themeColors,
      'Fresh corrected estimates · learning rate 0.08',
      'Build the denominator before predicting a displacement',
    );
    const r = RUNS.adam.records[0],
      root = q('root-scale', 1, 0.01, 0.2),
      ratio = root === 1 ? q('normalized-ratio', 1, 0.2, 0.4) : 0;
    const move = ratio === 1 ? q('adam-first-move', 1, 0.45, 0.62) : 0;
    const plot = teaching.axes({
      color: themeColors.muted,
      x: 250,
      y: 350,
      width: 780,
      height: 540,
      xDomain: [0.88, 1.02],
      yDomain: [0.88, 1.02],
      equalUnits: true,
      xTicks: [0.92, 1],
      yTicks: [0.92, 1],
      xLabel: 'a · local zoom',
      yLabel: 'b · local zoom',
      fontSize: 26,
    });
    drawOptimizerMark(ctx, api, themeColors, plot, [1, 1], themeColors.ink, 'start');
    drawOptimizerFocus(ctx, api, 'adam-displacement', () => {
      drawOptimizerSegment(ctx, api, plot, r.before, r.next, move, themeColors.green, 7);
      drawOptimizerText(
        ctx,
        api,
        themeColors,
        move === 1 ? 'Next ≈ (0.92, 0.92)' : 'Next = (?, ?)',
        230,
        1020,
        36,
        themeColors.green,
      );
    });
    drawOptimizerMath(
      ctx,
      api,
      themeColors,
      '\\widehat m=(100,1),\\quad\\widehat v=(10000,1)',
      1120,
      350,
      37,
    );
    drawOptimizerFocus(ctx, api, 'adam-denominator', () => {
      drawOptimizerText(
        ctx,
        api,
        themeColors,
        'Square-root scale + ε',
        1120,
        460,
        33,
        themeColors.muted,
      );
      drawOptimizerText(
        ctx,
        api,
        themeColors,
        root === 1 ? '(100 + ε, 1 + ε)' : '(?, ?)',
        1120,
        540,
        43,
        themeColors.cyan,
      );
    });
    drawOptimizerFocus(ctx, api, 'adam-ratio', () => {
      drawOptimizerText(
        ctx,
        api,
        themeColors,
        'Signed memory ÷ scale',
        1120,
        650,
        33,
        themeColors.muted,
      );
      drawOptimizerMath(
        ctx,
        api,
        themeColors,
        ratio === 1
          ? '\\left(\\frac{100}{100+\\epsilon},\\frac{1}{1+\\epsilon}\\right)\\approx(1,1)'
          : '(?,\\;?)',
        1120,
        745,
        39,
        themeColors.green,
      );
      drawOptimizerText(
        ctx,
        api,
        themeColors,
        move === 1 ? 'Δw ≈ (−0.08, −0.08)' : 'Δw = (?, ?)',
        1120,
        875,
        37,
        themeColors.green,
      );
      drawOptimizerText(
        ctx,
        api,
        themeColors,
        'ε = 10⁻⁸ in this run',
        1120,
        960,
        28,
        themeColors.muted,
      );
    });
  }
}
export default {
  id: 'adam-step',
  draw: drawAdamStep,
  cues: ['adam-normalization-prediction', 'root-scale', 'normalized-ratio', 'adam-first-move'],
};
