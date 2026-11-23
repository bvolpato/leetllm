import { sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';
export function drawTime(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('time', state);
  {
    const x = (day) => 350 + day * 130;
    const pendingWindowX = x(4) + (x(5.5) - x(4)) * modelState.timelineProgress;
    [430, 600, 770].forEach((y) =>
      api.focus.target('freeze', () =>
        api.line(ctx, x(5), y - 15, x(5), y + 25, themeColors.yellow, 4),
      ),
    );
    text(ctx, api, 'Fit freeze: May 5', x(5), 290, 31, themeColors.yellow, 'center');
    [
      ['Train', 3, 4],
      ['Pending', 4, 5.5],
      ['Test', 8, 9],
    ].forEach(([name, served, label], i) => {
      const y = 430 + i * 170;
      text(ctx, api, name, 150, y + 10, 31, themeColors.ink);
      api.line(ctx, 350, y, 1650, y, themeColors.muted, 2);
      api.focus.target('label-times', () =>
        api.line(ctx, x(served), y, x(label), y, themeColors.blue, 7),
      );
      api.focus.target('label-times', () => api.circle(ctx, x(served), y, 12, themeColors.blue));
      api.focus.target('label-times', () =>
        api.circle(ctx, x(label), y, 12, label < 5 ? themeColors.green : themeColors.pink),
      );
      text(ctx, api, 'Served', x(served), y - 35, 26, themeColors.blue, 'center');
      text(
        ctx,
        api,
        'Label ready',
        x(label),
        y + 60,
        26,
        label < 5 ? themeColors.green : themeColors.pink,
        'center',
      );
    });
    api.focus.target('pending-label', () =>
      api.circle(ctx, pendingWindowX, 600, 10, themeColors.yellow),
    );
    api.focus.target('pending-label', () =>
      text(
        ctx,
        api,
        'Pending request outcome window · day ' + modelState.pendingWindowDay.toFixed(1),
        960,
        890,
        28,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'time',
  draw: drawTime,
  cues: ['time-b1-1', 'time-b1-2', 'time-b2-1', 'time-b2-2'],
};
