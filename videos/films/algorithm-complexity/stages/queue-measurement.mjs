import { batchWaitSnapshot } from '../model.mjs';
import { box, focus, text } from '../defaults.mjs';
export function drawQueueMeasurement(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0;
  {
    const v = batchWaitSnapshot(state),
      x = (t) => 250 + t * 29;
    text(
      ctx,
      api,
      themeColors,
      'R1 arrives at 0 ms · R2 arrives at 40 ms · target batch size 8',
      960,
      280,
      34,
      themeColors.ink,
    );
    for (const time of [0, 10, 20, 30, 40, 50]) {
      api.line(ctx, x(time), 375, x(time), 900, themeColors.muted + '33', 2);
      text(ctx, api, themeColors, time + ' ms', x(time), 340, 28, themeColors.muted);
    }
    if (beat === 0) {
      focus(ctx, api, themeColors, 'batch-wait', () => {
        box(ctx, api, themeColors, 'R1', x(0), 430, 130, 80, themeColors.blue, 35);
        box(ctx, api, themeColors, 'R2', x(40), 430, 130, 80, themeColors.cyan, 35);
        api.line(ctx, x(0), 650, x(50), 650, themeColors.yellow, 7);
        text(
          ctx,
          api,
          themeColors,
          'Only 2 / 8 arrivals · still waiting',
          960,
          790,
          43,
          themeColors.yellow,
        );
      });
    } else {
      focus(ctx, api, themeColors, 'batch-formation', () => {
        api.rect(ctx, x(0), 460, x(10) - x(0), 100, themeColors.blue);
        text(ctx, api, themeColors, 'Formation', x(5), 420, 30, themeColors.blue);
        text(ctx, api, themeColors, '10 ms', x(5), 630, 36, themeColors.blue);
      });
      focus(ctx, api, themeColors, 'batch-execution-queue', () => {
        if (v.executionQueue > 0)
          api.rect(ctx, x(10), 460, x(v.start) - x(10), 100, themeColors.yellow);
        text(
          ctx,
          api,
          themeColors,
          'Executor busy until ' + v.busyUntil.toFixed(0) + ' ms',
          1190,
          740,
          36,
          themeColors.yellow,
        );
        text(
          ctx,
          api,
          themeColors,
          'Execution starts at ' + v.start.toFixed(0) + ' ms',
          960,
          865,
          43,
          themeColors.green,
        );
      });
      api.line(ctx, x(v.start), 435, x(v.start), 585, themeColors.green, 7);
      text(ctx, api, themeColors, 'R1', x(0), 740, 40, themeColors.blue);
      if (v.executionQueue > 0)
        text(
          ctx,
          api,
          themeColors,
          'Queue ' + v.executionQueue.toFixed(0) + ' ms',
          x((10 + v.start) / 2),
          630,
          34,
          themeColors.yellow,
        );
      text(
        ctx,
        api,
        themeColors,
        'Invented scheduler trace · a formation timeout does not bound the whole request',
        960,
        1010,
        30,
        themeColors.muted,
      );
    }
  }
}
export default {
  id: 'queue-measurement',
  draw: drawQueueMeasurement,
  cues: ['batch-wait', 'batch-timeout', 'batch-busy', 'batch-measure'],
};
