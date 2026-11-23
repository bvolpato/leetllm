import { gradientClamp, gradientPhase, reluBranchState } from '../arithmetic.mjs';
import { gradientCue } from '../construction.mjs';
import {
  drawExtensionCaption,
  drawExtensionDot,
  drawExtensionEquation,
  drawExtensionText,
  formatGradientValue,
  withTarget,
} from '../defaults.mjs';
export function drawReluGate(ctx, scene, state, api) {
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
    const q = currentBeat < 2 ? 0 : progress('relu-negative-state', 2, 0.05, 0.4),
      s = reluBranchState(2 - 2.5 * q),
      pl = teaching.axes({
        x: 240,
        y: 410,
        width: 620,
        height: 420,
        xDomain: [-2, 5],
        yDomain: [-1, 5],
        xTicks: [-2, 0, 2, 4],
        yTicks: [0, 2, 4],
        xLabel: 'h',
        yLabel: '',
        fontSize: 25,
      });
    api.path(
      ctx,
      [-2, 0, 5].map((x) => pl.point(x, Math.max(0, x))),
      {
        color: themeColors.cyan,
        width: 5,
      },
    );
    const point = pl.point(s.h, s.z);
    drawExtensionDot(
      ctx,
      api,
      point.x,
      point.y,
      s.gate ? themeColors.yellow : themeColors.pink,
      12,
    );
    drawExtensionText(ctx, api, 'ReLU(h)', 520, 320, 35, themeColors.cyan, 'center');
    withTarget(ctx, api, 'relu-forward', () => {
      drawExtensionText(
        ctx,
        api,
        `w = ${formatGradientValue(ctx, api, s.weight)} · h = ${formatGradientValue(ctx, api, s.h)} · z = ${formatGradientValue(ctx, api, s.z)}`,
        1310,
        415,
        32,
        themeColors.yellow,
        'center',
      );
      drawExtensionEquation(
        ctx,
        api,
        String.raw`\widehat y=z+2=${formatGradientValue(ctx, api, s.prediction)}\quad L=${formatGradientValue(ctx, api, s.loss)}`,
        1310,
        545,
        40,
        themeColors.green,
      );
    });
    if (currentBeat > 0)
      withTarget(ctx, api, 'relu-backward', () => {
        drawExtensionEquation(
          ctx,
          api,
          String.raw`${formatGradientValue(ctx, api, s.signal)}\times${s.gate}\times2=${formatGradientValue(ctx, api, s.promptGradient)}`,
          1310,
          705,
          48,
          s.gate ? themeColors.pink : themeColors.muted,
        );
        drawExtensionText(
          ctx,
          api,
          'arriving signal × gate × feature',
          1310,
          770,
          28,
          themeColors.muted,
          'center',
        );
        drawExtensionText(
          ctx,
          api,
          `separate queue path: gradient ${formatGradientValue(ctx, api, s.queueGradient)}`,
          1310,
          880,
          31,
          themeColors.cyan,
          'center',
        );
      });
    drawExtensionCaption(
      ctx,
      api,
      s.gate
        ? 'Positive stored h passes the reverse signal.'
        : 'Large loss9 · inactive prompt path0 · queue path still−6',
    );
  };
  withTarget(ctx, api, 'relu-gate-mechanism', paint);
  ctx.restore();
}
export default {
  id: 'relu-gate',
  draw: drawReluGate,
  cues: ['relu-gate-b1', 'relu-gate-b2', 'relu-gate-b3', 'relu-negative-state'],
};
