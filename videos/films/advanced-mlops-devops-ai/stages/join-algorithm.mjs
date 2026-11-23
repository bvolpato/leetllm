import { cueClock } from '../cue-clock.mjs';
import { failureHistory, temporalReleaseJoin } from '../features.mjs';

const formatTime = (hour) => {
  const minutes = Math.round(hour * 60);
  return Math.floor(minutes / 60) + ':' + String(minutes % 60).padStart(2, '0');
};

export function drawJoinAlgorithm(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = cueClock(scene, state);
  const noon = 12;
  const corrected = failureHistory[1];
  const request = noon + (corrected.available - noon) * p('move-request');
  const selected = temporalReleaseJoin(failureHistory, request, 24);
  const text = (value, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, value, x, y, size, color, align);
  const x = (hour) => 540 + 205 * (hour - 8);

  focus.target('count-history', () => {
    text('Failure count   /   us-west', 150, 290, 43);
    text('Lookback   1 day', 1730, 290, 36, C.muted, 'right');
    const cursor = x(request);
    for (const [top, bottom] of [
      [368, 411],
      [467, 606],
      [662, 765],
    ])
      api.line(ctx, cursor, top, cursor, bottom, C.yellow, 3);
    text(formatTime(request) + ' request', cursor, 347, 37, C.yellow, 'center');
    for (const [i, row] of failureHistory.entries()) {
      const y = 490 + 197 * i;
      text(i === 0 ? 'First count' : 'Correction', 150, y - 22, 35, C.muted);
      text(row.value + ' failures', 150, y + 55, 53);
      api.line(ctx, x(8), y, x(14), y, C.muted, 2);
      api.line(ctx, x(row.event), y, x(row.available), y, C.blue, 7);
      api.circle(ctx, x(row.event), y, 11, C.blue);
      api.circle(ctx, x(row.available), y, 9, C.cyan);
      text(formatTime(row.event) + ' event', x(row.event) - 15, y + 64, 32);
      text(
        formatTime(row.available) + ' available',
        x(row.available),
        y - 39,
        34,
        row === selected && p('latest-arrival') === 1 ? C.green : C.cyan,
        'center',
      );
    }
    for (const hour of [8, 10, 11, 12, 13, 14])
      text(formatTime(hour), x(hour), 825, 30, C.muted, 'center');
  });
  focus.target('join-result', () => {
    api.line(ctx, 150, 867, 1760, 867, C.muted, 2);
    const showAnswer = state.beat === 0 ? p('noon-count') === 1 : p('corrected-count') === 1;
    if (showAnswer) {
      text(
        'Selected count at ' + formatTime(request) + '     ' + selected.value,
        960,
        975,
        49,
        C.green,
        'center',
      );
    } else if (p('move-request') === 1) {
      text('Which count does the 13:00 request get?', 960, 975, 44, C.ink, 'center');
    }
  });
}

export default {
  id: 'join-algorithm',
  draw: drawJoinAlgorithm,
  cues: ['region-rows', 'noon-count', 'move-request', 'corrected-count', 'latest-arrival'],
};
