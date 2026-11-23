import { cueClock } from '../clock.mjs';
import { drawRequestTrace } from '../request-trace.mjs';

export function drawSchedule(ctx, scene, state, api) {
  const p = cueClock(scene, state);
  const removed = p('schedule-remove') > 0 && p('schedule-restore') < 1;
  const exposed = removed && p('schedule-hazard') > 0;
  const restored = p('schedule-restore') >= 1;
  drawRequestTrace(ctx, api, {
    clock: removed ? 1 + 2 * p('schedule-hazard') : 10,
    ordered: !removed,
    showEdge: !removed,
    hazard: exposed,
    result: !removed,
    message: restored
      ? 'Copy finishes at 3   →   transform may read the copied data at 3'
      : exposed
        ? 'Ticks 1–3   ·   both streams can touch the same input'
        : removed
          ? 'Earliest transform start   ·   tick 1'
          : p('schedule-ask') > 0
            ? 'Without the wait, earliest transform start   ·   tick ?'
            : 'CPU submissions   0–4           Completed work   0–10',
    messageColor: exposed ? api.C.pink : restored ? api.C.green : api.C.yellow,
  });
}
export default {
  id: 'schedule',
  draw: drawSchedule,
  cues: [
    'schedule-edge',
    'schedule-overlap',
    'schedule-ask',
    'schedule-remove',
    'schedule-hazard',
    'schedule-restore',
  ],
};
