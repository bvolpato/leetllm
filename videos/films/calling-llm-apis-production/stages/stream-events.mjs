import { apiChapterState } from '../construction.mjs';
import { footer, heading, panel, strokeLine, travel } from '../defaults.mjs';
export function drawStreamEvents(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    modelState = apiChapterState('stream-events', state),
    u = modelState.p,
    done = modelState.settled;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'Two reads deliver one event');
      const cells = ['data: ', 'caf', 'C3', 'A9', '0A', '0A'];
      const received = 3 + Math.floor(u * 3);
      cells.forEach((v, i) => {
        if (i >= received) return;
        panel(
          ctx,
          api,
          v,
          240 + i * 240,
          450,
          190,
          100,
          i === 2 || i === 3 ? themeColors.yellow : themeColors.blue,
          29,
        );
      });
      for (const [x, label] of [
        [240, 'First read'],
        [960, 'Next read'],
      ]) {
        strokeLine(ctx, api, x, 602, x + 670, 602, themeColors.muted, 2);
        api.text(ctx, label, x + 335, 672, 35, themeColors.ink, 'center');
      }
      panel(
        ctx,
        api,
        done
          ? 'decoded data: café\nblank line dispatches one event'
          : received === 3
            ? 'Waiting for the rest of é'
            : 'Waiting for the blank line',
        370,
        780,
        1180,
        130,
        done ? themeColors.green : themeColors.cyan,
        31,
      );
    } else if (currentBeat === 1) {
      heading(ctx, api, 'The HTTP method and application marker are protocol choices');
      panel(
        ctx,
        api,
        'Browser EventSource\nGET + reconnect',
        230,
        410,
        660,
        170,
        themeColors.blue,
        32,
      );
      panel(
        ctx,
        api,
        'Provider SDK stream\nPOST response parser',
        1030,
        410,
        660,
        170,
        themeColors.cyan,
        32,
      );
      panel(ctx, api, 'Chat Completions: [DONE]', 230, 740, 660, 110, themeColors.yellow, 28);
      panel(
        ctx,
        api,
        'Responses: typed completed event',
        1030,
        740,
        660,
        110,
        themeColors.green,
        27,
      );
    } else {
      heading(ctx, api, 'Select the intended item before appending text');
      const labels = ['metadata', 'text item A', 'tool arguments', 'text item B', 'terminal'];
      labels.forEach((v, i) => {
        const x = 220 + i * 320;
        panel(ctx, api, v, x, 430, 270, 100, i === 1 ? themeColors.cyan : themeColors.blue, 24);
        if (i <= Math.floor(u * 5))
          travel(
            ctx,
            api,
            v === 'text item A' ? 'append A' : 'route event',
            {
              x: x + 35,
              y: 620,
            },
            {
              x: i === 1 ? 640 : x + 35,
              y: 810,
            },
            u,
            i === 1 ? themeColors.green : themeColors.muted,
            200,
          );
      });
      footer(ctx, api, 'Bound each intended buffer; first nonempty text differs from first bytes');
    }
  }
}
export default {
  id: 'stream-events',
  draw: drawStreamEvents,
  cues: ['ap-stream-events-0', 'ap-stream-events-1', 'ap-stream-events-2'],
};
