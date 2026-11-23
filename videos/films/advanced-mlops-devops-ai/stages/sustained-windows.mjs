import { cueClock } from '../cue-clock.mjs';
import { sustainedReleaseTrace } from '../telemetry.mjs';

const limit = 850;
const runs = [
  [910, 790, 930, 905],
  [790, 910, 930, 905, 790],
].map((windows) => sustainedReleaseTrace(windows, limit));
const cues = ['counter-a1', 'counter-a2', 'counter-a3', 'counter-a4'];

export function drawSustainedWindows(ctx, scene, state, api) {
  const p = cueClock(scene, state);
  const { C, focus } = api;
  const second = p('counter-reorder') > 0;
  const fired = p('counter-fire') > 0;
  const series = runs[Number(second)];
  const displayed = second
    ? 4 + Number(p('counter-later') > 0)
    : cues.filter((cue) => p(cue) > 0).length;
  const x = (i) => 475 + i * 285;
  const y = (v) => 730 - (v - 780) * 2.25;
  const text = (s, xpos, ypos, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, xpos, ypos, size, color, align);
  focus.target('window-series', () => {
    text('Time to first token   /   p95 in each five-minute window', 140, 284, 38);
    api.line(ctx, 370, y(limit), 1750, y(limit), C.yellow, 3);
    text(limit + ' ms', 310, y(limit) + 13, 37, C.yellow, 'right');
    for (let i = 0; i < (second ? 5 : 4); i++) {
      const row = series[i],
        shown = i < displayed;
      const color = row.value > limit ? C.pink : C.blue;
      text('Window ' + (i + 1), x(i), 818, 33, C.muted, 'center');
      if (!shown) continue;
      if (i > 0) api.line(ctx, x(i - 1), y(series[i - 1].value), x(i), y(row.value), C.muted, 3);
      api.circle(ctx, x(i), y(row.value), 12, color);
      const labelY = y(row.value) + (row.value > limit ? -30 : 58);
      text(String(row.value), x(i), labelY, 39, color, 'center');
      if (!second || fired)
        text(
          i === 4 ? 'after decision' : String(row.count),
          x(i),
          886,
          32,
          i === 4 ? C.muted : C.ink,
          'center',
        );
    }
    text('Streak', 195, 886, 32, C.muted);
  });
  focus.target('window-decision', () => {
    api.line(ctx, 140, 928, 1760, 928, C.muted, 2);
    const message = fired
      ? 'Rollback latched at window ' + (series.findIndex((row) => row.latched) + 1)
      : second
        ? 'Which window first triggers rollback?'
        : p('counter-short') > 0
          ? 'Longest streak: 2   /   3 required'
          : 'Rule: 3 consecutive valid windows above 850 ms';
    text(message, 960, 1005, 38, fired ? C.pink : C.yellow, 'center');
  });
}
export default {
  id: 'sustained-windows',
  draw: drawSustainedWindows,
  cues: [
    'counter-a1',
    'counter-a2',
    'counter-a3',
    'counter-a4',
    'counter-short',
    'counter-reorder',
    'counter-predict',
    'counter-fire',
    'counter-later',
    'counter-scope',
  ],
};
