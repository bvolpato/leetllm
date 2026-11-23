import { clamp, pipeline, schedule } from './arithmetic.mjs';
import { runtimeText } from './defaults.mjs';

const values = [1, 2, 3, 4];
const names = { copy: 'copy', affine: '2x + 1', square: 'square', reduce: 'sum' };
const left = 370;
const scale = 137;
const tickX = (tick) => left + tick * scale;

export function drawRequestTrace(
  ctx,
  api,
  {
    clock,
    ordered,
    showEdge,
    hazard,
    message,
    messageColor,
    result,
    completed = result,
    visible = Object.keys(names),
  },
) {
  const { C } = api;
  const txt = (...args) => runtimeText(ctx, api, ...args);
  const rows = schedule(ordered);
  api.focus.target('request-input', () => {
    txt('Source A', 145, 269, 35, C.muted);
    values.forEach((value, i) => {
      const x = left + i * 90;
      api.rect(ctx, x, 210, 70, 78, C.panel, C.blue, 9);
      txt(value, x + 35, 265, 43, C.ink, 'center');
    });
  });
  api.focus.target('request-output', () => {
    txt('Output O', 1180, 268, 34, C.muted);
    api.rect(ctx, 1390, 207, 349, 84, C.panel, result ? C.green : C.muted, 10);
    txt(
      result
        ? pipeline(values).result
        : hazard
          ? 'unverified'
          : completed
            ? 'write complete'
            : 'awaiting sum',
      1565,
      265,
      result ? 49 : 33,
      result ? C.green : C.ink,
      'center',
    );
    txt(message, 960, 975, 43, messageColor, 'center');
  });
  api.focus.target('request-trace', () => {
    const bar = (id, start, end, y, color) => {
      const w = (end - start) * scale - 4;
      const x = tickX(start) + 2;
      api.rect(ctx, x, y, w, 76, C.panel, color, 8);
      const filled = clamp((clock - start) / (end - start));
      if (filled > 0) api.line(ctx, x + 4, y + 69, x + 4 + filled * (w - 8), y + 69, color, 7);
      txt(names[id], x + w / 2, y + 47, 32, filled ? C.ink : C.muted, 'center');
    };
    txt('CPU submits', 145, 405, 34, C.blue);
    txt('GPU copy', 145, 535, 34, C.cyan);
    txt('GPU compute', 145, 667, 34, C.cyan);
    Object.keys(rows).forEach((id, i) => {
      if (!visible.includes(id)) return;
      bar(id, i, i + 1, 358, C.blue);
      const row = rows[id];
      bar(id, row.start, row.end, id === 'copy' ? 488 : 620, id === 'reduce' ? C.green : C.cyan);
    });
    if (showEdge) {
      api.arrow(ctx, tickX(3), 566, tickX(3), 615, C.green, 4);
      txt('ready event', tickX(3) + 24, 600, 26, C.green);
    }
    if (hazard) {
      for (const tick of [1, 3]) api.line(ctx, tickX(tick), 721, tickX(tick), 740, C.pink, 4);
      api.line(ctx, tickX(1), 739, tickX(3), 739, C.pink, 4);
      txt('read while writing', tickX(2), 777, 27, C.pink, 'center');
    }
    txt('Logical tick', 145, 837, 30, C.muted);
    api.line(ctx, left, 824, tickX(10), 824, C.muted, 2);
    for (let i = 0; i <= 10; i++) {
      api.line(ctx, tickX(i), 818, tickX(i), 838, C.muted, 2);
      txt(i, tickX(i), 879, 30, C.ink, 'center');
    }
    api.circle(ctx, tickX(clock), 824, 10, C.yellow);
  });
}
