import { gradientClamp, gradientPhase, reluBranchState, reluCornerDifference } from '../arithmetic.mjs';
import { gradientCue } from '../construction.mjs';
import {
  drawExtensionCaption,
  drawExtensionDot,
  drawExtensionEquation,
  drawExtensionLine,
  drawExtensionText,
  formatGradientValue,
  withTarget,
} from '../defaults.mjs';
export function drawReluCorner(ctx, scene, state, api) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress2 = gradientClamp(state.beatP ?? 0),
    cues = state.cues;
  const progress = (id, beat, a = 0.1, z = 0.8) =>
    currentBeat < beat
      ? 0
      : currentBeat > beat
        ? 1
        : gradientCue(cues, id, gradientPhase(progress2, a, z));
  const paint = () => {
    const pl = teaching.axes({
        x: 320,
        y: 400,
        width: 1250,
        height: 400,
        xDomain: [-1, 1],
        yDomain: [0, 16],
        xTicks: [-1, -0.5, 0, 0.5, 1],
        yTicks: [0, 4, 9, 16],
        xLabel: 'prompt weight w',
        yLabel: '',
        fontSize: 25,
      }),
      pts = Array.from(
        {
          length: 201,
        },
        (_, i) => {
          const w = -1 + i / 100;
          return pl.point(w, (Math.max(0, 2 * w) - 3) ** 2);
        },
      );
    api.path(ctx, pts, {
      color: themeColors.cyan,
      width: 5,
    });
    drawExtensionEquation(
      ctx,
      api,
      String.raw`L(w)=(\operatorname{ReLU}(2w)-3)^2`,
      960,
      300,
      43,
      themeColors.ink,
    );
    const center = pl.point(0, 9);
    drawExtensionDot(ctx, api, center.x, center.y, themeColors.yellow, 10);
    if (currentBeat === 0) {
      const sample = reluBranchState(-0.5 + progress('corner-right', 0, 0.48, 0.66));
      const pin = pl.point(sample.weight, sample.loss);
      drawExtensionDot(ctx, api, pin.x, pin.y, themeColors.pink, 11);
      drawExtensionText(ctx, api,
        'Prompt ' + formatGradientValue(ctx, api, sample.z, 2) + ' s   +   queue 2 s   =   prediction ' +
        formatGradientValue(ctx, api, sample.prediction, 2) + ' s', 960, 928, 37, themeColors.ink, 'center');
      drawExtensionCaption(ctx, api, 'Target 5 s     ·     Squared loss ' +
        formatGradientValue(ctx, api, sample.loss, 3) + ' s²');
    }
    if (currentBeat === 1) {
      const h = 0.25 - 0.24 * progress('corner-centered-probe', 1, 0.1, 0.8),
        s = reluCornerDifference(h),
        a = pl.point(-h, 9),
        z = pl.point(h, (2 * h - 3) ** 2);
      drawExtensionLine(ctx, api, a.x, a.y, z.x, z.y, themeColors.pink, 4);
      drawExtensionDot(ctx, api, a.x, a.y, themeColors.pink, 7);
      drawExtensionDot(ctx, api, z.x, z.y, themeColors.pink, 7);
      drawExtensionText(ctx, api, 'left slope 0', 420, 350, 28, themeColors.cyan);
      drawExtensionText(ctx, api, 'right limit −12', 1270, 350, 28, themeColors.cyan);
      withTarget(ctx, api, 'corner-conventions', () =>
        drawExtensionText(
          ctx,
          api,
          `centered ≈ ${formatGradientValue(ctx, api, s.center, 3)} → −6    ·    ReLU backward at 0: 0`,
          960,
          940,
          33,
          themeColors.pink,
          'center',
        ),
      );
    }
    if (currentBeat === 1) drawExtensionCaption(ctx, api, 'One-sided slopes disagree at the corner.');
    if (currentBeat === 2) {
      const step = progress('relu-corner-b3', 2, 0.12, 0.35);
      const trial = reluBranchState(0.25 * step);
      const point = pl.point(trial.weight, trial.loss);
      if (step > 0) drawExtensionDot(ctx, api, point.x, point.y, themeColors.green, 11);
      drawExtensionText(ctx, api, 'At the corner    w = 0    loss = 9', 510, 928, 37, themeColors.yellow, 'center');
      if (step > 0)
        drawExtensionText(ctx, api, 'To the right    w ≈ ' + trial.weight.toFixed(2) + '    loss ≈ ' +
          trial.loss.toFixed(2), 1370, 928, 37, themeColors.green, 'center');
      drawExtensionCaption(ctx, api, 'ReLU backward at zero returns zero.');
    }
  };
  withTarget(ctx, api, 'relu-corner-mechanism', paint);
  ctx.restore();
}
export default {
  id: 'relu-corner',
  draw: drawReluCorner,
  cues: ['relu-corner-b1', 'corner-right', 'relu-corner-b2', 'corner-centered-probe', 'relu-corner-b3'],
};
