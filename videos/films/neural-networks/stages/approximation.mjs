import { approximation, targetCurve, triangle } from '../arithmetic.mjs';
import { neuralFrame, triangleConstruction } from '../construction.mjs';
import {
  axes,
  curve,
  equation,
  focusTarget,
  formatNumber,
  head,
  note,
  text,
} from '../defaults.mjs';
export function drawApproximation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    currentBeat = f.beat,
    cueProgress = f.progress,
    S = f.shown,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'approximation-mechanism', () => {
    head(
      ctx,
      api,
      currentBeat === 0
        ? 'One additional signed hinge closes the original peak'
        : 'Shift and scale the same triangle basis',
    );
    const add = cueProgress('complete-triangle', 0),
      refine = cueProgress('refine-approximation', 2),
      segments = currentBeat < 2 ? 2 : refine < 0.5 ? 4 : 8,
      plot = axes(ctx, api, {
        x: 300,
        y: 380,
        width: 1320,
        height: 450,
        xDomain: [-0.1, 4.1],
        yDomain: currentBeat === 0 ? [-2.2, 2.2] : [-0.1, 1.1],
        xTicks: [0, 1, 2, 3, 4],
        yTicks: currentBeat === 0 ? [-2, 0, 1, 2] : [0, 0.5, 1],
        xLabel: 'bounded input interval [0,4]',
        yLabel: 'response',
      });
    if (currentBeat === 0) {
      focusTarget(ctx, api, 'triangle-hinges', () => {
        curve(
          ctx,
          api,
          plot,
          (x) => triangleConstruction(x, add).twoHinges,
          0,
          4,
          themeColors.muted,
        );
        curve(
          ctx,
          api,
          plot,
          (x) => triangleConstruction(x, add).addedHinge,
          0,
          4,
          themeColors.blue,
        );
        curve(ctx, api, plot, (x) => triangleConstruction(x, add).sum, 0, 4, themeColors.yellow);
      });
      equation(
        ctx,
        api,
        String.raw`t(x)=\operatorname{ReLU}(x)-2\operatorname{ReLU}(x-1)+\operatorname{ReLU}(x-2)`,
        960,
        950,
        37,
        themeColors.yellow,
      );
    } else {
      curve(ctx, api, plot, targetCurve, 0, 4, themeColors.muted);
      focusTarget(ctx, api, 'approximation-pieces', () => {
        const build = currentBeat === 1 ? cueProgress('assemble-triangles', 1) : 1,
          h = 4 / segments;
        for (let i = 1; i < segments; i++)
          curve(
            ctx,
            api,
            plot,
            (x) => (targetCurve(i * h) - 0.2) * triangle((x - (i - 1) * h) / h),
            Math.max(0, (i - 1) * h),
            Math.min(4, (i + 1) * h),
            themeColors.blue,
            build,
          );
        curve(ctx, api, plot, (x) => approximation(x, segments), 0, 4, themeColors.yellow, build);
      });
      let error = 0;
      for (let i = 0; i <= 400; i++)
        error = Math.max(error, Math.abs(approximation(i / 100, segments) - targetCurve(i / 100)));
      text(
        ctx,
        api,
        segments + ' segments · sampled maximum error ' + formatNumber(ctx, api, error, 4),
        960,
        940,
        33,
        themeColors.yellow,
        'center',
      );
      equation(ctx, api, String.raw`y=0.2+\sum_i a_i t_i(x)`, 960, 995, 34, themeColors.pink);
    }
    note(
      ctx,
      api,
      'Gray established target · blue individual basis contributions · yellow their combined response.',
    );
    return;
  });
}
export default {
  id: 'approximation',
  draw: drawApproximation,
  cues: ['complete-triangle', 'assemble-triangles', 'refine-approximation'],
};
