import { stateTrace } from './model.mjs';
import { text } from './defaults.mjs';

const half = 3;
const x = (index, n) => 312 + (1372 * index) / (n - 1);
const y = (error) => 485 - 24 * error;
const level = (active) => (active ? 683 : 750);

export function monitorStrip(
  ctx,
  api,
  { values, steps, clock, available = values.length, question, firstCount },
) {
  const { C } = api;
  const trace = stateTrace(values, half);
  const count = steps.filter((key) => clock.after(key)).length;
  const last = trace[count - 1];
  api.focus.target('monitor-trace', () => {
    text(
      ctx,
      api,
      firstCount || 'Error  =  observed jobs − forecast jobs',
      150,
      237,
      32,
      C.ink,
      'left',
    );
    text(ctx, api, 'Two outside to open  ·  two inside to clear', 1770, 237, 30, C.muted, 'right');
    const xmax = x(values.length - 1, values.length) + 65;
    api.rect(ctx, 241, y(half), xmax - 241, y(-half) - y(half), '#172838', undefined, 0);
    for (const bound of [half, -half]) {
      api.line(ctx, 241, y(bound), xmax, y(bound), C.blue, 2);
      text(ctx, api, bound > 0 ? '+' + bound : '−' + half, 218, y(bound) + 10, 30, C.blue, 'right');
    }
    api.line(ctx, 241, y(0), xmax, y(0), C.muted, 1);
    text(ctx, api, '0', 218, y(0) + 10, 28, C.muted, 'right');
    text(ctx, api, 'Minute', 218, 624, 28, C.muted, 'right');
    trace.forEach((sample, i) => {
      const px = x(i, values.length);
      text(ctx, api, sample.minute, px, 624, 31, i < count ? C.ink : C.muted);
      if (i >= available) return;
      if (sample.error === null) {
        text(ctx, api, 'missing', px, 308, 28, C.muted);
      } else {
        const py = y(sample.error);
        const color = i < count ? (Math.abs(sample.error) > half ? C.pink : C.cyan) : C.ink;
        api.line(ctx, px, y(0), px, py, color, 4);
        api.circle(ctx, px, py, 10, color);
        const labelY = sample.error === 0 ? py - 14 : py + 10;
        text(
          ctx,
          api,
          sample.error > 0 ? '+' + sample.error : sample.error,
          px + 23,
          labelY,
          29,
          color,
          'left',
        );
      }
    });
    text(ctx, api, 'Open', 218, level(true) + 10, 29, C.yellow, 'right');
    text(ctx, api, 'Inactive', 218, level(false) + 10, 29, C.muted, 'right');
    text(ctx, api, 'Run', 218, 844, 28, C.muted, 'right');
    let previous = 243,
      active = false;
    for (let i = 0; i < count; i++) {
      const sample = trace[i],
        px = x(i, values.length);
      api.line(ctx, previous, level(active), px, level(active), active ? C.yellow : C.muted, 6);
      if (sample.active !== active)
        api.line(ctx, px, level(active), px, level(sample.active), C.yellow, 5);
      api.circle(ctx, px, level(sample.active), 8, sample.active ? C.yellow : C.muted);
      const run = sample.breaches
        ? sample.breaches + ' out'
        : sample.clean
          ? sample.clean + ' in'
          : 'reset';
      text(
        ctx,
        api,
        run,
        px,
        844,
        30,
        sample.error === null ? C.muted : sample.breaches ? C.pink : C.cyan,
      );
      if (sample.transition)
        text(ctx, api, sample.transition === 'review' ? 'OPEN' : 'CLEAR', px, 795, 25, C.yellow);
      active = sample.active;
      previous = px;
    }
    if (!count) api.circle(ctx, previous, level(false), 8, C.muted);
    if (last && count === values.length)
      api.line(ctx, previous, level(active), xmax, level(active), active ? C.yellow : C.muted, 5);
  });
  api.focus.target('delivery-record', () => text(ctx, api, question, 960, 954, 37, C.ink));
}
