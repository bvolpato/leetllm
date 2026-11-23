import { after, progress, started, tasks } from '../decisions.mjs';

const weights = [1, 2, 6];
const sum = weights.reduce((total, value) => total + value, 0);
const mean = sum / weights.length;
const billionsOfParameters = 8;
const bytesPerWeight = 2;
const gigabytes = billionsOfParameters * bytesPerWeight;

function checkpoint(ctx, api, x, y, width, height, color) {
  const fold = 48;
  const right = x + width;
  const points = [
    { x, y },
    { x: right - fold, y },
    { x: right, y: y + fold },
    { x: right, y: y + height },
    { x, y: y + height },
  ];
  api.path(ctx, points, { closed: true, fill: api.C.panel, color, width: 3 });
  api.path(ctx, [points[1], { x: right - fold, y: y + fold }, points[2]], {
    closed: true,
    fill: color,
    color,
    width: 2,
  });
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const label = (value, x, y, size, color, align = 'left') =>
    api.text(ctx, value, x, y, size, color, align);
  const colors = [C.blue, C.pink, C.cyan];
  const centers = [410, 960, 1510];
  const memory = state.beat >= 2;
  const time = state.t ?? 0;
  if (time < 0.35) ctx.globalAlpha = 1;

  tasks.forEach((name, i) => {
    const x = centers[i] - 225;
    api.focus.target(name.toLowerCase() + '-file', () => {
      checkpoint(ctx, api, x, 236, 450, 215, colors[i]);
      label(name, x + 35, 310, 58, colors[i]);
      api.line(ctx, x + 35, 335, x + 415, 335, C.muted, 2);
      label(memory ? 'Weights' : 'Slot 17', x + 35, 412, 42, C.ink);
      label(memory ? gigabytes + ' GB' : weights[i], x + 409, 414, 57, colors[i], 'right');
    });
  });

  api.focus.target('weights', () => {
    if (memory) {
      label(
        billionsOfParameters + 'B parameters  ×  ' + bytesPerWeight + ' bytes per weight',
        960,
        575,
        44,
        C.ink,
        'center',
      );
      if (after(state, 'resident-copies')) {
        label(
          tasks.length + ' × ' + gigabytes + ' GB  =  ' + tasks.length * gigabytes + ' GB',
          960,
          704,
          65,
          C.ink,
          'center',
        );
      }
      return;
    }
    const summed = after(state, 'weight-sum');
    if (summed) {
      label(sum, 960, 665, 96, C.ink, 'center');
    } else {
      const travel = Math.min(1, (time + 0.12) / 1.65);
      const p = 1 - (1 - travel) ** 2;
      weights.forEach((value, i) => {
        const destination = 960 + (i - 1) * 245;
        const x = centers[i] + (destination - centers[i]) * p;
        const y = 506 + 111 * p;
        api.rect(ctx, x - 72, y - 52, 144, 104, colors[i], undefined, 10);
        label(value, x, y + 32, 85, C.bg, 'center');
      });
      if (travel === 1) {
        for (const x of [837.5, 1082.5]) label('+', x, 639, 58, C.ink, 'center');
      }
    }
    if (started(state, 'equal-share')) {
      const halfWidth = summed ? 83 : 331;
      api.line(ctx, 960 - halfWidth, 695, 960 + halfWidth, 695, C.ink, 4);
      label(weights.length, 960, 771, 67, C.ink, 'center');
    }
  });

  api.focus.target('candidate', () => {
    checkpoint(ctx, api, 392, 827, 1136, 165, C.yellow);
    label('Merged checkpoint', 439, 931, 56, C.ink);
    label(memory ? 'Weights' : 'Slot 17', 1045, 926, 43, C.muted, 'center');
    const x = 1310,
      y = 912;
    api.rect(ctx, x - 103, y - 51, 206, 102, C.bg, C.yellow, 8);
    if (memory) {
      label(
        after(state, 'merged-copy') ? gigabytes + ' GB' : '?',
        x,
        y + 23,
        57,
        C.yellow,
        'center',
      );
    } else {
      const write = progress(state, 'write-weight');
      if (write === 0) label('?', x, y + 27, 68, C.yellow, 'center');
      if (after(state, 'merged-weight')) {
        const fromY = 695;
        if (write === 0) label('=', 1145, fromY + 20, 62, C.ink, 'center');
        const tileY = fromY + (y - fromY) * write;
        api.rect(ctx, x - 72, tileY - 49, 144, 98, C.yellow, undefined, 8);
        label(mean, x, tileY + 31, 80, C.bg, 'center');
      }
    }
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'read-code',
    'read-math',
    'read-chat',
    'equal-share',
    'weight-sum',
    'merged-weight',
    'write-weight',
    'resident-copies',
    'merged-copy',
  ],
};
