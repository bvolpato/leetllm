import { clamp, pipeline, schedule } from '../arithmetic.mjs';
import { cueClock } from '../clock.mjs';
import { runtimeText } from '../defaults.mjs';

const ordered = schedule(true);
const operations = Object.values(ordered);
const names = ['Copy', '2x + 1', 'Square', 'Sum'];
const values = [1, 2, 3, 4];
const total = pipeline(values).result;

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const p = cueClock(scene, state);
  const returned = operations.length;
  const { affine, square, reduce } = ordered;
  const tick =
    returned -
    1 +
    p('intro-return') +
    (affine.end - returned) * p('intro-transform') +
    (square.end - affine.end) * p('intro-square') +
    (reduce.end - square.end) * p('intro-write');
  const complete = p('intro-write') >= 1;
  const received = p('intro-read') >= 1;
  const txt = (...args) => runtimeText(ctx, api, ...args);
  const left = 445;
  const step = 132;

  // The two rows use the same ruler. Bright ink records elapsed work.
  function block(start, end, y, label, elapsed, color) {
    const x = left + start * step + 2;
    const width = (end - start) * step - 4;
    api.rect(ctx, x, y, width, 92, C.panel, elapsed > 0 ? color : C.muted, 8);
    if (elapsed > 0) api.rect(ctx, x, y, elapsed * width, 92, color, null, 8);
    const center = x + width / 2;
    // Keep the label on solid ink as the fill passes behind it.
    if (elapsed > 0 && elapsed < 1) {
      const labelWidth = Math.min(170, width - 12);
      api.rect(ctx, center - labelWidth / 2, y + 15, labelWidth, 59, C.panel, null, 5);
    }
    txt(label, center, y + 58, 35, elapsed === 1 ? C.bg : C.ink, 'center');
  }

  api.focus.target('intro-trace', () => {
    txt('Logical tick', 140, 344, 40, C.muted);
    txt(Math.floor(tick), 141, 505, 138, C.yellow);
    const x = left + tick * step;
    api.line(ctx, left, 331, left + reduce.end * step, 331, C.muted, 3);
    for (let i = 0; i <= reduce.end; i++) {
      const pos = left + i * step;
      api.line(ctx, pos, 322, pos, 341, C.muted, 3);
      txt(i, pos, 304, 34, C.ink, 'center');
    }
    api.circle(ctx, x, 331, 12, C.yellow);
    txt('CPU calls', 140, 621, 45, C.blue);
    txt('GPU work', 140, 777, 45, C.cyan);
    operations.forEach((row, i) => {
      block(i, i + 1, 555, names[i], clamp(tick - i), C.blue);
      block(
        row.start,
        row.end,
        710,
        names[i],
        clamp((tick - row.start) / (row.end - row.start)),
        C.cyan,
      );
    });
    txt(
      tick < returned ? 'Submitting sum' : 'All four calls returned',
      left + returned * step + 48,
      617,
      39,
      C.blue,
    );
    const gpuLabel = complete
      ? 'Sum complete'
      : tick >= square.end
        ? 'Adding the squares'
        : tick >= affine.end
          ? 'Squaring the values'
          : 'Transforming the inputs';
    txt(gpuLabel, left, 476, 62, complete ? C.green : C.cyan);
  });
  api.focus.target('intro-output', () => {
    txt('Inputs   ' + values.join('   '), 140, 940, 40, C.ink);
    txt(
      complete ? 'O   ' + total : 'O   awaiting sum',
      846,
      940,
      46,
      complete ? C.green : C.yellow,
    );
    if (p('intro-transfer') > 0) {
      api.arrow(ctx, 1150, 921, 1320, 921, C.green, 5);
      txt(received ? 'CPU   ' + total : 'CPU reading O', 1370, 940, 44, received ? C.green : C.ink);
    }
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-return',
    'intro-running',
    'intro-question',
    'intro-transform',
    'intro-square',
    'intro-write',
    'intro-transfer',
    'intro-read',
  ],
};
