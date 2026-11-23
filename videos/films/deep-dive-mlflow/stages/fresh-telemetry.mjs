import { sampleMlflowChapter } from '../construction.mjs';
import { drawTraceQueue } from '../pieces/trace-queue.mjs';
import { spokenScene } from '../pieces/scene.mjs';

export default spokenScene('fresh-telemetry', (ctx, scene, state, api, g) => {
  const { C } = api;
  const s = sampleMlflowChapter(scene.id, state);
  drawTraceQueue(ctx, api, C, s);
  if (state.beat === 0 && g(0, 1) > 0)
    api.text(ctx, 'B    C    D', 1700, 404, 39, C.blue, 'center');
  if (g(0, 2) > 0)
    api.text(ctx, 'Application log   /   D returned a response', 145, 375, 32, C.green);
  let note = '';
  if (state.beat === 0 && g(0, 3) > 0) note = 'After one send and three arrivals: sent? queued? D?';
  if (state.beat === 1 && g(1, 4) > 0) note = 'D returned a response. Its citation is unknown.';
  if (state.beat === 2 && g(2, 1) > 0)
    note = s.replayRecord
      ? `Store lookup: ${s.replayRecord.trace} found    ·    original D still dropped`
      : 'Look up the replay by its new trace ID, D′.';
  if (note) api.text(ctx, note, 960, 1012, 34, C.yellow, 'center');
});
