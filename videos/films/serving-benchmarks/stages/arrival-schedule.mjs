import { SERVING_COHORT } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';

export function drawArrivalSchedule(ctx, scene, state, api) {
  const { C, focus } = api;
  const [, , long, short] = SERVING_COHORT;
  const x = (t) => 385 + (t - 690) * 2.12;
  const thinkMs = 80;
  const next = long.terminal + thinkMs;
  const beat = state.beat ?? 0;
  const motion = (id, i) =>
    cueProgress(
      state.cues,
      id,
      beat === i ? api.phase(state.beatP ?? 0, 0.15, 0.8) : Number(beat > i),
    );
  text(ctx, api, 'Client clock (ms)', 125, 281, 32, C.muted, 'left');
  const mark = (ms, y, label, color, above) => {
    api.circle(ctx, x(ms), y, 11, color);
    text(ctx, api, label + ' ' + ms, x(ms), y + (above ? -37 : 55), 30, color);
  };
  for (const y of [472, 775]) {
    text(ctx, api, y === 472 ? 'Stored schedule' : 'One client', 105, y + 12, 35, C.ink, 'left');
    api.line(ctx, x(690), y, x(1350), y, C.muted, 2);
    api.line(ctx, x(long.sent), y, x(long.terminal), y, C.blue, 8);
    mark(long.sent, y, 'r03 sent', C.cyan, false);
    mark(long.terminal, y, 'r03 done', C.pink, false);
  }
  focus.target('arrival-due', () => {
    api.line(ctx, x(short.scheduled), 371, x(short.scheduled), 486, C.yellow, 4);
    text(ctx, api, 'r04 due ' + short.scheduled, x(short.scheduled), 349, 32, C.yellow);
    if (motion('arrival-independent', 0) > 0) {
      const end = short.sent + motion('arrival-independent', 0) * (short.terminal - short.sent);
      api.line(ctx, x(short.sent), 406, x(end), 406, C.cyan, 7);
      api.circle(ctx, x(short.sent), 406, 10, C.cyan);
      text(ctx, api, 'r04 sent ' + short.sent, 950, 445, 29, C.cyan);
    }
  });
  focus.target('arrival-client', () => {
    text(ctx, api, 'Wait for r03', x(935), 731, 30, C.blue);
    const wait = motion('arrival-think', 1);
    if (wait > 0) {
      api.line(ctx, x(long.terminal), 775, x(long.terminal + thinkMs * wait), 775, C.yellow, 7);
      if (wait === 1) mark(next, 775, 'next send', C.yellow, true);
    }
  });
  if (beat >= 1)
    text(
      ctx,
      api,
      'Think time after each answer: ' + thinkMs + ' ms',
      125,
      962,
      34,
      C.yellow,
      'left',
    );
}
export default {
  id: 'arrival-schedule',
  draw: drawArrivalSchedule,
  cues: ['arrival-independent', 'arrival-think', 'arrival-replay'],
};
