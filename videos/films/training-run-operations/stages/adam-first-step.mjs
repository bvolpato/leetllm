import { clamp, firstAdaptiveMovement, motion } from '../arithmetic.mjs';
import { baseline, lost } from '../fixtures.mjs';
import { trainingCue, trainingStarted } from '../construction.mjs';
import { drawBox, drawFooter, drawText } from '../defaults.mjs';
export function drawAdamFirstStep(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    beat = state.beat ?? 0,
    progress2 = clamp(state.beatP ?? 0),
    q = motion(progress2);
  api.focus.target('adam-first-step-mechanism', () => {
    if (beat === 0) {
      const fields = [
        'weights / architecture',
        'moments + counters',
        'schedule + data + RNG',
        'scaler / adapter base',
      ];
      drawText(ctx, api, 'Continuation packet', 550, 305, 40, themeColors.cyan, 'center');
      drawText(ctx, api, 'Inference export', 1430, 305, 40, themeColors.blue, 'center');
      fields.forEach((field, i) => {
        const a = clamp(q * 4 - i);
        drawBox(
          ctx,
          api,
          190,
          360 + i * 132,
          720,
          105,
          a > 0 ? themeColors.cyan : themeColors.muted,
        );
        if (a > 0) drawText(ctx, api, field, 550, 427 + i * 132, 32, themeColors.cyan, 'center');
      });
      drawBox(ctx, api, 1110, 360, 640, 170, themeColors.blue);
      drawText(ctx, api, 'Merged usable weights', 1430, 435, 35, themeColors.blue, 'center');
      drawText(
        ctx,
        api,
        'No original training history',
        1430,
        490,
        27,
        themeColors.muted,
        'center',
      );
      drawText(
        ctx,
        api,
        'Next update needs the whole saved state',
        1430,
        700,
        31,
        themeColors.yellow,
        'center',
      );
      drawText(
        ctx,
        api,
        'Topology / kernels can still change replay',
        1430,
        800,
        27,
        themeColors.muted,
        'center',
      );
      drawFooter(
        ctx,
        api,
        'Storage, numerical history and consumed progress identify a continuation.',
      );
    } else if (beat === 1) {
      const eta = 0.002,
        epsilon = 1e-8;
      drawText(
        ctx,
        api,
        'Both moments and the step counter start at zero',
        960,
        275,
        39,
        themeColors.ink,
        'center',
      );
      drawText(
        ctx,
        api,
        'Term subtracted  =  η × g / (|g| + ε)',
        960,
        385,
        52,
        themeColors.yellow,
        'center',
      );
      drawText(
        ctx,
        api,
        'Learning rate 0.002     ·     epsilon 0.00000001',
        960,
        472,
        33,
        themeColors.muted,
        'center',
      );
      const left = 580,
        width = 1000;
      for (const [i, [ratio, id]] of [
        [0.1, 'adam-small'],
        [100, 'adam-large'],
      ].entries()) {
        const y = 574 + i * 187;
        const ready = trainingStarted(state, id, progress2 > (i ? 0.83 : 0.58));
        const magnitude = firstAdaptiveMovement(ratio * epsilon, eta, epsilon);
        drawText(ctx, api, 'g = ' + ratio + ' × ε', 178, y + 48, 42, themeColors.blue);
        drawBox(ctx, api, left, y, width, 65, themeColors.muted);
        if (ready) {
          api.rect(
            ctx,
            left + 2,
            y + 3,
            ((width - 4) * magnitude) / eta,
            59,
            themeColors.cyan,
            undefined,
            0,
          );
          drawText(
            ctx,
            api,
            magnitude.toFixed(6),
            left,
            y + 126,
            39,
            themeColors.cyan,
            'left',
            'mono',
          );
        }
        drawText(ctx, api, 'η', left + width + 39, y + 51, 44, themeColors.yellow);
      }
      drawFooter(
        ctx,
        api,
        'The bar measures the adaptive term alone. Weight decay has its own term.',
      );
    } else {
      const plot = teaching.axes({
        x: 210,
        y: 350,
        width: 1050,
        height: 440,
        xDomain: [7, 12],
        yDomain: [0.08, 0.135],
        xTicks: [7, 8, 10, 12],
        yTicks: [0.09, 0.11, 0.13],
        xLabel: 'successful update',
        yLabel: 'scalar weight',
        fontSize: 25,
      });
      const finish = 7 + 5 * trainingCue(state, 'adam-five-more', q);
      const pts = baseline
        .slice(7)
        .filter((_, i) => 7 + i <= finish)
        .map((v, i) => ({
          x: 7 + i,
          y: v.w,
        }));
      if (pts.length > 1)
        teaching.curve({
          plot,
          points: pts,
          color: themeColors.cyan,
          width: 5,
        });
      const rp = lost
        .filter((_, i) => 7 + i <= finish)
        .map((v, i) => ({
          x: 7 + i,
          y: v.w,
        }));
      if (rp.length > 1)
        teaching.curve({
          plot,
          points: rp,
          color: themeColors.pink,
          width: 5,
        });
      drawText(ctx, api, 'Same saved packet at update 7', 960, 285, 36, themeColors.blue, 'center');
      drawText(
        ctx,
        api,
        'Computed endpoint at update 12',
        1490,
        345,
        27,
        themeColors.muted,
        'center',
      );
      drawText(ctx, api, 'Full continuation', 1490, 430, 31, themeColors.cyan, 'center');
      drawText(ctx, api, 'Reset moments only', 1490, 600, 31, themeColors.pink, 'center');
      if (trainingStarted(state, 'adam-full-weight', progress2 > 0.3))
        drawText(
          ctx,
          api,
          baseline[12].w.toFixed(6),
          1490,
          500,
          42,
          themeColors.cyan,
          'center',
          'mono',
        );
      if (trainingStarted(state, 'adam-reset-weight', progress2 > 0.5))
        drawText(
          ctx,
          api,
          lost.at(-1).w.toFixed(6),
          1490,
          670,
          42,
          themeColors.pink,
          'center',
          'mono',
        );
      drawFooter(
        ctx,
        api,
        'Executed scalar fixture · resetting moments changes the continuation, without requiring a loss jump.',
      );
    }
  });
}
export default {
  id: 'adam-first-step',
  draw: drawAdamFirstStep,
  cues: [
    'adam-first-step-step-1',
    'adam-first-step-step-2',
    'adam-gradient',
    'adam-small',
    'adam-large',
    'adam-first-step-step-3',
    'adam-five-more',
    'adam-full-weight',
    'adam-reset-weight',
  ],
};
