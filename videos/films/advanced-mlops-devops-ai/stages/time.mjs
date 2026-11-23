import { cueClock } from '../cue-clock.mjs';
import { failureHistory, featureAt } from '../features.mjs';

const request = 12;
const initialAge = 24;
const shortAge = 1;
const rows = [
  { ...failureHistory[0], eventCue: 'clock-first', arrivalCue: 'clock-arrival', time: '09:05' },
  { ...failureHistory[1], eventCue: 'clock-change', arrivalCue: 'clock-late', time: '13:00' },
];

export function drawTime(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = cueClock(scene, state);
  const x = (h) => 520 + (h - 8) * 195;
  const text = (s, px, py, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, px, py, size, color, align);
  const u = p('clock-tighten');
  const eventAge = initialAge + (shortAge - initialAge) * u;
  const count = featureAt(request, eventAge);
  focus.target('history-rows', () => {
    text('Failure count   /   us-west', 150, 293, 41);
    text('Noon request', x(request), 347, 33, C.yellow, 'center');
    api.line(ctx, x(request), 370, x(request), 754, C.yellow, 4);
    const cutoff = Math.max(8, request - eventAge);
    api.line(ctx, x(cutoff), 391, x(request) - 6, 391, C.blue, 6);
    if (u > 0 && cutoff > 8) {
      api.line(ctx, x(cutoff), 377, x(cutoff), 747, C.blue, 3);
      text('Earliest event', x(cutoff) - 18, 345, 29, C.blue, 'right');
    }
    for (const [i, r] of rows.entries()) {
      const y = 513 + i * 155;
      text(i ? 'Corrected count' : 'First count', 150, y + 12, 35, C.muted);
      api.line(ctx, x(8), y, x(14), y, C.muted, 2);
      if (p(r.eventCue) > 0) {
        api.circle(ctx, x(r.event), y, 10, C.blue);
        text('09:00   ·   ' + r.value + ' failures', x(r.event) - 60, y + 60, 32, C.ink);
      }
      const arrival = p(r.arrivalCue);
      if (arrival > 0) {
        const end = x(r.event) + (x(r.available) - x(r.event)) * arrival;
        api.line(ctx, x(r.event), y, end, y, C.cyan, 6);
        if (arrival === 1) {
          api.circle(ctx, end, y, 9, C.cyan);
          text(r.time + ' available', end, y - 32, 32, C.cyan, 'center');
        }
      }
    }
    for (const h of [8, 10, 11, 12, 13, 14]) text(h + ':00', x(h), 806, 28, C.muted, 'center');
  });
  focus.target('join-answer', () => {
    api.line(ctx, 150, 862, 1750, 862, C.muted, 2);
    let line = 'Allowed event age: one day';
    if (p('clock-choice') > 0) line = 'What count was available by noon?';
    if (p('clock-five') > 0)
      line = 'Usable at noon: ' + featureAt(request, initialAge) + ' failures';
    if (state.beat >= 2) line = 'One-hour lookback   ·   which row is usable now?';
    if (p('clock-missing') > 0 && count === null)
      line = 'Missing   ·   both events fall before 11:00';
    text(line, 960, 972, 43, p('clock-missing') > 0 ? C.pink : C.ink, 'center');
  });
}
export default {
  id: 'time',
  draw: drawTime,
  cues: [
    'clock-first',
    'clock-arrival',
    'clock-change',
    'clock-late',
    'clock-choice',
    'clock-five',
    'clock-explain',
    'clock-tighten',
    'clock-ask-again',
    'clock-missing',
  ],
};
