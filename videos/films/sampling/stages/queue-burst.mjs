import { queuePlan } from '../arithmetic.mjs';
import { samplingExtensionModel } from '../construction.mjs';
import {
  drawSamplingExtensionD,
  drawSamplingExtensionFooter,
  drawSamplingExtensionL,
  drawSamplingExtensionPlot,
  drawSamplingExtensionRectangle,
  drawSamplingExtensionText,
} from '../defaults.mjs';
export function drawQueueBurst(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = samplingExtensionModel(state, 'queue-burst'),
    currentBeat = f.beat,
    progress = f.progress,
    col = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink];
  api.focus.target('sp-queue-burst-visual', () => {
    const fresh = false,
      arr = [0, 10, 20],
      services = arr.map(() => 50),
      workers = 1,
      rows = queuePlan(arr, services, workers),
      limit = 170,
      q = drawSamplingExtensionPlot(
        ctx,
        api,
        [0, limit],
        [0, rows.length + 1],
        270,
        385,
        1260,
        430,
        'elapsed milliseconds',
        '',
      );
    const reveal = progress,
      clock = limit * reveal;
    rows.forEach((r, i) => {
      const yy = q.point(0, rows.length - i).y,
        a = q.point(r.arrival, 0).x,
        st = q.point(r.start, 0).x,
        en = q.point(r.finish, 0).x;
      drawSamplingExtensionText(ctx, api, 'R' + r.id, 210, yy + 10, 31, col[i]);
      drawSamplingExtensionD(ctx, api, a, yy, col[i], 8);
      if (reveal > 0) {
        drawSamplingExtensionL(
          ctx,
          api,
          [
            {
              x: a,
              y: yy,
            },
            {
              x: Math.min(st, q.point(clock, 0).x),
              y: yy,
            },
          ],
          themeColors.muted,
          9,
        );
        if (clock > r.start)
          drawSamplingExtensionRectangle(
            ctx,
            api,
            st,
            yy - 25,
            Math.max(0.5, Math.min(en, q.point(clock, 0).x) - st),
            50,
            col[i],
          );
        if (clock >= r.finish)
          drawSamplingExtensionText(
            ctx,
            api,
            'end ' + r.finish,
            st + 12,
            yy + 8,
            25,
            themeColors.bg,
          );
      }
    });
    drawSamplingExtensionText(
      ctx,
      api,
      workers + ' FCFS worker' + (workers > 1 ? 's' : ''),
      960,
      290,
      36,
      themeColors.cyan,
      'center',
    );
    if (currentBeat === 1 && progress === 1)
      drawSamplingExtensionText(
        ctx,
        api,
        'Totals: 50, 90, 130 ms · service stays 50 ms',
        960,
        945,
        39,
        themeColors.yellow,
        'center',
      );
    drawSamplingExtensionFooter(
      ctx,
      api,
      'Queue delay = start − arrival; response time = queue delay + service',
    );
  });
}
export default {
  id: 'queue-burst',
  draw: drawQueueBurst,
  cues: ['sp-queue-burst-0', 'sp-queue-burst-1'],
};
