import { drawTraceQueue } from '../pieces/trace-queue.mjs';
import { sampleMlflowChapter } from '../construction.mjs';
import { chapterText, chip, footer } from '../defaults.mjs';
export function drawExportQueue(ctx, scene, state, api) {
  const modelState = sampleMlflowChapter('export-queue', state),
    currentBeat = modelState.b;
  {
    const { C } = api,
      id = 'export-queue';
    {
      const { C } = api,
        id = 'export-queue';
      {
        drawTraceQueue(ctx, api, C, modelState);
        {
          if (currentBeat === 0)
            chapterText(
              ctx,
              api,
              'Send from the front, then fill the free slots',
              960,
              690,
              32,
              C.blue,
              'center',
            );
          if (currentBeat === 2) {
            chip(
              ctx,
              api,
              modelState.timedOut ? 'E export: retry timeout' : 'E export: retry pending',
              615,
              350,
              780,
              modelState.timedOut ? C.pink : C.yellow,
              75,
            );
          }
          footer(
            ctx,
            api,
            modelState.timedOut
              ? 'G arrived at a full queue. E reached its retry deadline.'
              : 'Arrivals = sent + waiting + dropped',
          );
        }
      }
    }
  }
}
export default {
  id: 'export-queue',
  draw: drawExportQueue,
  cues: [
    'mf-export-queue-0',
    'mf-sentence-export-queue-0-0',
    'mf-sentence-export-queue-0-1',
    'mf-sentence-export-queue-0-2',
    'mf-sentence-export-queue-0-3',
    'mf-export-queue-1',
    'mf-sentence-export-queue-1-0',
    'mf-sentence-export-queue-1-1',
    'mf-sentence-export-queue-1-2',
    'mf-sentence-export-queue-1-3',
    'mf-sentence-export-queue-1-4',
    'mf-export-queue-2',
    'mf-sentence-export-queue-2-0',
    'mf-sentence-export-queue-2-1',
    'mf-sentence-export-queue-2-2',
    'mf-sentence-export-queue-2-3',
  ],
};
