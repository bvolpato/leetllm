import { clamp } from '../construction.mjs';
import { ticketClock, tokenValues } from '../fixtures.mjs';
import { drawExecutionTrace } from '../execution-trace.mjs';
import { sampleModel } from '../model.mjs';
import { drawOriginalFooter, drawOriginalMark, drawOriginalText, drawOriginalTokenRow } from '../defaults.mjs';
export function drawClocks(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = sampleModel('clocks', state);
  {
    if (modelState.warmup) {
      drawOriginalMark(ctx, api, 'warmup-trace', () => {
        drawOriginalText(
          ctx,
          api,
          'Separate modeled warmup experiment · milliseconds',
          160,
          290,
          32,
          themeColors.cyan,
        );
        modelState.events.forEach((event, i) => {
          const x = 200 + event.start * 49,
            w = (event.end - event.start) * 49,
            complete = modelState.time >= event.end;
          api.rect(ctx, x, 460, w - 12, 160, 'transparent', themeColors.muted, 4);
          const elapsed = clamp((modelState.time - event.start) / (event.end - event.start));
          if (elapsed > 0)
            api.rect(
              ctx,
              x,
              460,
              Math.max(1, (w - 12) * elapsed),
              160,
              i === 0 ? themeColors.pink : themeColors.cyan,
              undefined,
              4,
            );
          drawOriginalText(
            ctx,
            api,
            event.id,
            x + (w - 12) / 2,
            420,
            32,
            i === 0 ? themeColors.pink : themeColors.cyan,
            'center',
          );
          if (complete)
            drawOriginalText(
              ctx,
              api,
              event.end - event.start + ' ms',
              x + (w - 12) / 2,
              705,
              39,
              i === 0 ? themeColors.muted : themeColors.ink,
              'center',
            );
        });
      });
      drawOriginalMark(ctx, api, 'warmed-mean', () => {
        drawOriginalText(
          ctx,
          api,
          'Completed warmed samples: ' + modelState.completed,
          960,
          820,
          37,
          themeColors.cyan,
          'center',
        );
        drawOriginalText(
          ctx,
          api,
          modelState.mean === null ? 'Mean pending' : 'Warmed mean: ' + modelState.mean + ' ms',
          960,
          920,
          49,
          modelState.mean === null ? themeColors.muted : themeColors.green,
          'center',
        );
      });
      drawOriginalFooter(ctx, api, 'Warmup stays outside the warmed-sample denominator.');
    } else {
      drawOriginalText(ctx, api, 'One feature across eight tokens', 180, 245, 34, themeColors.cyan);
      drawOriginalTokenRow(ctx, api, tokenValues, 340, { height: 82 });
      drawExecutionTrace(ctx, api, ticketClock, modelState, {
        ticks: [0, 10, 20, 30, 40, 50],
        ticket: 102,
        waiting: currentBeat === 1,
        showStream: true,
        showHost: true,
        logLatency: modelState.reported,
      });
      if (currentBeat === 1)
        drawOriginalFooter(ctx, api, 'Python requests the number with pooled.item().');
    }
  }
}
export default {
  id: 'clocks',
  draw: drawClocks,
  cues: [
    'advance-enqueue',
    'continue-device',
    'finish-device',
    'report-scalar',
    'warmup-complete',
    'warmed-samples',
  ],
};
