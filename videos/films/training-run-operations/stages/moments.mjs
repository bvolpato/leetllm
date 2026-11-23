import { advance, baseline, fresh, lost } from '../fixtures.mjs';
import { trainingCue } from '../construction.mjs';
import { drawLegacyText } from '../defaults.mjs';
export function drawMoments(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  const step = currentBeat
    ? 7 + Math.floor(5 * trainingCue(state, 'moments-advance', state.beatP))
    : Math.floor(7 * trainingCue(state, 'moments-track', state.beatP));
  {
    const max = step,
      points = baseline.slice(0, max + 1).map((v, i) => ({
        x: i,
        y: v.w,
      }));
    const plot = teaching.axes({
      x: 230,
      y: 350,
      width: 1150,
      height: 450,
      xDomain: [0, 12],
      yDomain: [0, 0.16],
      xTicks: [0, 4, 7, 12],
      yTicks: [0, 0.05, 0.1, 0.15],
      xLabel: 'successful scalar Adam updates',
      yLabel: 'weight',
      fontSize: 26,
    });
    api.focus.target('full-trajectory', () =>
      teaching.curve({
        plot,
        points,
        color: themeColors.cyan,
        width: 5,
      }),
    );
    if (currentBeat)
      teaching.curve({
        plot,
        points: lost.slice(0, max - 7 + 1).map((v, i) => ({
          x: 7 + i,
          y: v.w,
        })),
        color: themeColors.pink,
        width: 5,
      });
    api.focus.target('full-trajectory', () =>
      drawLegacyText(ctx, api, 'Full state / uninterrupted', 1420, 390, 27, themeColors.cyan),
    );
    if (currentBeat)
      drawLegacyText(ctx, api, 'Reset moments only', 1420, 520, 28, themeColors.pink);
    if (currentBeat) {
      drawLegacyText(ctx, api, 'Current update ' + step, 1420, 610, 28, themeColors.muted);
      api.focus.target('full-weight', () =>
        drawLegacyText(
          ctx,
          api,
          'Full: ' + baseline[step].w.toFixed(6),
          1420,
          685,
          30,
          themeColors.cyan,
        ),
      );
      api.focus.target('reset-weight', () =>
        drawLegacyText(
          ctx,
          api,
          'Reset: ' + lost[step - 7].w.toFixed(6),
          1420,
          770,
          30,
          themeColors.pink,
        ),
      );
    }
    const current = advance(fresh, step),
      prior = advance(fresh, Math.max(0, step - 1));
    drawLegacyText(
      ctx,
      api,
      'Full state: m = ' +
        current.m.toFixed(5) +
        ' · v = ' +
        current.v.toFixed(5) +
        ' · Δw = ' +
        (current.w - prior.w).toFixed(5),
      960,
      930,
      28,
      themeColors.cyan,
      'center',
    );
    drawLegacyText(
      ctx,
      api,
      'Same saved weight, step and cursor · supplied scalar target sequence',
      960,
      1020,
      27,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'moments',
  draw: drawMoments,
  cues: ['moments-b1-1', 'moments-b2-1', 'moments-track', 'moments-advance'],
};
