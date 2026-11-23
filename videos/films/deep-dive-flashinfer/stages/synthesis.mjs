import { sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawSynthesis(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('synthesis', state),
    currentBeat = modelState.b;
  {
    text(ctx, api, 'Supplied work cost · cost units', 715, 290, 31, themeColors.cyan, 'center');
    api.focus.target('synthesis-s-serial-s-parallel-one-worker-four-chunks-merge', () =>
      teaching.bars({
        x: 240,
        y: 380,
        width: 950,
        height: 410,
        values: [modelState.serial, modelState.parallel],
        labels: ['One worker', 'Four chunks + merge'],
        colors: [themeColors.blue, themeColors.cyan],
        max: 18,
        showValues: true,
        fontSize: 28,
        gap: 160,
      }),
    );
    text(ctx, api, '4 units per chunk · merge adds 1', 715, 930, 27, themeColors.muted, 'center');
    api.focus.target('synthesis-reader-trace', () => {
      text(ctx, api, 'Independent reader-event fixture', 1530, 290, 28, themeColors.blue, 'center');
      text(ctx, api, 'R2 reads physical page 14', 1530, 365, 29, themeColors.blue, 'center');
      card(
        ctx,
        api,
        `Page 14: ${modelState.lease ? 'IN USE' : 'REUSABLE'}`,
        1280,
        430,
        500,
        modelState.lease ? themeColors.yellow : themeColors.green,
        100,
      );
      text(
        ctx,
        api,
        `Read event: ${modelState.complete ? 'complete' : 'pending'}`,
        1300,
        610,
        31,
        modelState.complete ? themeColors.green : themeColors.muted,
      );
      text(
        ctx,
        api,
        `Reader tick: ${modelState.time.toFixed(1)} / ${modelState.endTick}`,
        1300,
        710,
        31,
        themeColors.ink,
      );
      const left = 1280,
        right = 1780,
        y = 810;
      const cursor = left + ((right - left) * modelState.time) / modelState.endTick;
      const eventX = left + ((right - left) * modelState.completionTick) / modelState.endTick;
      api.path(
        ctx,
        [
          {
            x: left,
            y,
          },
          {
            x: right,
            y,
          },
        ],
        {
          color: themeColors.muted,
          width: 3,
        },
      );
      if (modelState.time > 0)
        api.path(
          ctx,
          [
            {
              x: left,
              y,
            },
            {
              x: cursor,
              y,
            },
          ],
          {
            color: modelState.complete ? themeColors.green : themeColors.yellow,
            width: 8,
          },
        );
      api.path(
        ctx,
        [
          {
            x: eventX,
            y: y - 28,
          },
          {
            x: eventX,
            y: y + 28,
          },
        ],
        {
          color: themeColors.green,
          width: 3,
        },
      );
      api.circle(ctx, cursor, y, 10, modelState.complete ? themeColors.green : themeColors.yellow);
      text(ctx, api, '0', left, y + 75, 27, themeColors.muted, 'center');
      text(ctx, api, '10', eventX, y + 75, 27, themeColors.green, 'center');
      text(ctx, api, '12', right, y + 75, 27, themeColors.muted, 'center');
      text(
        ctx,
        api,
        'Reader ticks are separate from cost units',
        1530,
        965,
        25,
        themeColors.muted,
        'center',
      );
    });
  }
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: [
    'synthesis-beat-1-focus-1',
    'synthesis-beat-2-focus-1',
    'synthesis-reader-active',
    'synthesis-reader-event',
    'synthesis-beat-3-focus-1',
  ],
};
