import { cueStep } from '../construction.mjs';

const runs = [
  [2, 4, 6, 8, 9],
  [2, 4, 6, 12, 16],
];
const timeout = 10;
const columns = [606, 852, 1098, 1344, 1590];
const rows = [428, 728];

function stopwatch(ctx, api) {
  const { C } = api;
  const cx = 266,
    cy = 577,
    radius = 151;
  api.rect(ctx, cx - 28, cy - radius - 45, 56, 32, C.yellow, null, 8);
  api.line(ctx, cx, cy - radius - 18, cx, cy - radius, C.yellow, 9);
  api.circle(ctx, cx, cy, radius, C.panel, C.yellow, 6);
  const point = (second, distance) => ({
    x: cx + distance * Math.sin((second * Math.PI) / 30),
    y: cy - distance * Math.cos((second * Math.PI) / 30),
  });
  for (let second = 0; second < 60; second += 5)
    api.path(ctx, [point(second, radius - 19), point(second, radius - 7)], {
      color: second === timeout ? C.yellow : C.muted,
      width: 4,
    });
  api.path(ctx, [point(0, 0), point(timeout, radius - 28)], { color: C.yellow, width: 6 });
  api.circle(ctx, cx, cy, 9, C.yellow);
  api.text(ctx, timeout + ' s', cx, cy + 76, 52, C.yellow, 'center');
  api.text(ctx, 'Timeout', cx, cy + radius + 65, 41, C.ink, 'center');
}

function bubble(ctx, api, x, y, seconds, known, middle) {
  const { C } = api;
  const color = known ? (seconds > timeout ? C.pink : C.cyan) : C.muted;
  const outline = [
    [-92, -56],
    [84, -56],
    [98, -42],
    [98, 42],
    [84, 56],
    [-48, 56],
    [-77, 78],
    [-77, 56],
    [-92, 56],
    [-102, 42],
    [-102, -44],
  ].map(([dx, dy]) => ({ x: x + dx, y: y + dy }));
  api.path(ctx, outline, { closed: true, fill: known ? color + '24' : C.panel, color, width: 3 });
  api.text(ctx, known ? seconds + ' s' : '?', x, y + 23, 59, known ? C.ink : C.muted, 'center');
  if (middle > 0) {
    api.line(ctx, x - 59 * middle, y + 92, x + 59 * middle, y + 92, C.yellow, 5);
    if (middle === 1) api.text(ctx, 'median', x, y + 141, 35, C.yellow, 'center');
  }
}

export function drawIntro(ctx, scene, state, api) {
  const firstMedian = cueStep(state, 'median-half', 0, 0.32, 0.58);
  const firstDone = cueStep(state, 'intro-last-a', 0, 0.63, 0.91);
  const secondMedian = cueStep(state, 'intro-first-three', 1, 0.17, 0.45);
  const fourth = cueStep(state, 'intro-last-b', 2, 0.19, 0.43);
  const fifth = cueStep(state, 'intro-fifth', 2, 0.46, 0.62);
  const targets = [
    [null, null, 'first-median', null, 'first-slowest'],
    [null, null, 'second-median', 'fourth-reply', 'fifth-reply'],
  ];
  stopwatch(ctx, api);
  runs.forEach((run, i) => {
    const y = rows[i];
    api.text(ctx, 'Run ' + (i ? 'B' : 'A'), columns[0] - 102, y - 95, 40, api.C.ink);
    run.forEach((seconds, j) => {
      const known = i === 0 || j < 3 || (j === 3 ? fourth : fifth) === 1;
      const draw = () =>
        bubble(
          ctx,
          api,
          columns[j],
          y,
          seconds,
          known,
          j === 2 ? (i ? secondMedian : firstMedian) : 0,
        );
      if (targets[i][j]) api.focus.target(targets[i][j], draw);
      else draw();
    });
    if ((i ? fifth : firstDone) === 1) {
      const late = run.filter((seconds) => seconds > timeout).length;
      api.text(
        ctx,
        late + ' of 5 late',
        columns[4] + 98,
        y - 95,
        39,
        late ? api.C.pink : api.C.cyan,
        'right',
      );
    }
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['median-half', 'intro-last-a', 'intro-first-three', 'intro-last-b', 'intro-fifth'],
};
