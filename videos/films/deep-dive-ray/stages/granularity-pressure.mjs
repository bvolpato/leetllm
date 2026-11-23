import { rayMix } from '../arithmetic.mjs';
import { rayChapterState, rayProgress } from '../construction.mjs';
import { chapterCard, chapterText, footer, heading } from '../defaults.mjs';
export function drawGranularityPressure(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = rayChapterState('granularity-pressure', state),
    { b: currentBeat, p: progress } = modelState,
    cueProgress = (id, beat = currentBeat) => rayProgress(state, 'ray-' + id, beat);
  api.focus.target('ray-granularity-pressure-mechanism', () => {
    heading(
      ctx,
      api,
      currentBeat === 0
        ? 'Ready results still occupy the admission window'
        : currentBeat === 1
          ? 'A task-count bound does not bound retained bytes'
          : 'Same useful compute · fewer submission boundaries',
    );
    if (currentBeat === 0) {
      const tr = modelState.trace;
      for (let i = 0; i < 3; i++) {
        const task = tr.pending.find((entry) => entry.id % 3 === i),
          ready = task && task.end <= tr.tick;
        chapterCard(
          ctx,
          api,
          task ? 'Document ' + (task.id + 1) : 'empty',
          180 + i * 550,
          420,
          470,
          ready ? themeColors.green : themeColors.blue,
          130,
          35,
        );
        chapterText(
          ctx,
          api,
          ready ? 'ready for the sink' : 'producer running',
          415 + i * 550,
          640,
          26,
          ready ? themeColors.yellow : themeColors.muted,
          'center',
        );
      }
      chapterCard(
        ctx,
        api,
        'Sink consumes one result every 4 ticks',
        500,
        760,
        920,
        themeColors.yellow,
        100,
        32,
      );
      chapterText(
        ctx,
        api,
        'Submitted ' +
          tr.submitted +
          ' − consumed ' +
          tr.consumed.length +
          ' = ' +
          tr.pending.length +
          ' pending',
        960,
        935,
        34,
        themeColors.cyan,
        'center',
      );
    } else if (currentBeat === 1) {
      const scale = 5;
      for (let i = 0; i < 3; i++) {
        const x = rayMix(200 + i * 400, 200 + i * 64 * scale, cueProgress('payload-total', 1));
        api.rect(ctx, x, 460, 64 * scale, 100, themeColors.blue, themeColors.cyan, 2);
        chapterText(ctx, api, '64 MiB', x + 160, 520, 34, themeColors.bg, 'center');
      }
      api.rect(ctx, 200, 700, 80 * scale, 45, themeColors.panel, themeColors.yellow, 3);
      chapterText(ctx, api, 'Store budget   80 MiB', 680, 735, 30, themeColors.yellow);
      if (modelState.bytesReady)
        chapterText(
          ctx,
          api,
          '3 × 64 = 192 MiB of retained payload',
          960,
          870,
          37,
          themeColors.yellow,
          'center',
        );
      if (modelState.exceeded)
        chapterText(
          ctx,
          api,
          'Payload total exceeds store budget; spill amount remains unknown',
          960,
          945,
          29,
          themeColors.pink,
          'center',
        );
    } else {
      const scale = 9;
      chapterText(ctx, api, '12 separate document tasks', 170, 385, 31, themeColors.blue);
      chapterText(ctx, api, '3 four-document blocks', 170, 665, 31, themeColors.cyan);
      for (let i = 0; i < 12; i++) {
        api.rect(
          ctx,
          170 + i * 12 * scale,
          430,
          10 * scale,
          80,
          themeColors.blue,
          themeColors.panel,
          2,
        );
        api.rect(
          ctx,
          170 + (i * 12 + 10) * scale,
          430,
          2 * scale,
          80,
          themeColors.yellow,
          themeColors.panel,
          2,
        );
      }
      const boundaries = Math.max(1, 4 - Math.floor(cueProgress('cost-batched', 2) * 3.99)),
        chunk = 40 + 2 * boundaries;
      for (let i = 0; i < 3; i++) {
        api.rect(
          ctx,
          170 + i * chunk * scale,
          710,
          40 * scale,
          80,
          themeColors.cyan,
          themeColors.panel,
          2,
        );
        for (let j = 0; j < boundaries; j++)
          api.rect(
            ctx,
            170 + (i * chunk + 40 + j * 2) * scale,
            710,
            2 * scale,
            80,
            themeColors.yellow,
            themeColors.panel,
            2,
          );
      }
      chapterText(
        ctx,
        api,
        'Yellow adds 2 ms per task submission',
        960,
        825,
        26,
        themeColors.yellow,
        'center',
      );
      if (modelState.singleReady)
        chapterText(
          ctx,
          api,
          '120 ms compute + 24 ms overhead = 144 ms',
          960,
          575,
          34,
          themeColors.yellow,
          'center',
        );
      if (modelState.batchReady)
        chapterText(
          ctx,
          api,
          '120 ms compute + 6 ms overhead = 126 ms',
          960,
          900,
          34,
          themeColors.green,
          'center',
        );
    }
    footer(
      ctx,
      api,
      [
        'Window limit: three outstanding results',
        'Example payload size: 64 MiB per result',
        'Example cost: 2 ms per submission',
      ][currentBeat],
    );
  });
}
export default {
  id: 'granularity-pressure',
  draw: drawGranularityPressure,
  cues: [
    'ray-granularity-pressure-op-0',
    'ray-sink-full',
    'ray-granularity-pressure-op-1',
    'ray-payload-total',
    'ray-store-exceeded',
    'ray-granularity-pressure-op-2',
    'ray-cost-single',
    'ray-cost-batched',
  ],
};
