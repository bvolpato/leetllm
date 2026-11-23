import { logged } from '../fixtures.mjs';
import { ended, spoken } from '../construction.mjs';

export function drawCheckpoints(ctx, scene, state, api) {
  const { C, teaching } = api;
  const early = logged[2],
    late = logged.at(-1);
  const n =
    1 +
    Math.floor(2 * spoken(state, 'early-point', 0)) +
    Math.floor(3 * spoken(state, 'continue-training', 1));
  const points = logged.slice(0, n);
  const plottedLate = n === logged.length;
  const excerpts = [];
  if (ended(state, 'later-sample', 2)) excerpts.push("“I'll do”");
  if (ended(state, 'later-grammar', 2)) excerpts.push('“I is the king :”');
  const plot = teaching.axes({
    x: 257,
    y: 320,
    width: 1250,
    height: 230,
    xDomain: [0, 330],
    yDomain: [5, 10],
    xTicks: [1, 81, 161, 241, 321],
    yTicks: [5, 7.5, 10],
    xLabel: 'completed updates',
    yLabel: 'sampled validation loss (nats/token)',
    fontSize: 29,
  });
  api.focus.target('curve', () => {
    teaching.curve({ plot, points, color: C.cyan, width: 6 });
    teaching.scatter({ plot, points, color: C.cyan, radius: 9 });
    api.text(ctx, points.at(-1).y.toFixed(3), 1650, 455, 60, C.cyan, 'center');
  });
  const sample = (x, checkpoint, acc, excerpts, color) => {
    api.text(
      ctx,
      'Update ' + checkpoint.x + '   ·   ' + checkpoint.y.toFixed(3) + ' nats/token',
      x,
      737,
      37,
      C.cyan,
    );
    api.text(ctx, 'Next-token accuracy  ' + acc, x, 798, 31, C.muted);
    excerpts.forEach((line, i) => api.text(ctx, line, x, 873 + 70 * i, 47, color, 'left', 'serif'));
  };
  api.focus.target('samples', () => {
    if (n >= 3) sample(180, early, '17.1%', ['“And the I the”', '“And it .”'], C.ink);
    if (plottedLate)
      sample(
        1000,
        late,
        '18.3%',
        excerpts.length ? excerpts : ['Continuation covered'],
        excerpts.length ? C.yellow : C.muted,
      );
    else api.text(ctx, 'Fixed prompt   ·   seed 17', 1000, 795, 34, C.muted);
  });
  api.text(
    ctx,
    'Matched prompt and decoding settings   ·   separate samples of 4,608 validation positions per estimate',
    960,
    1015,
    29,
    C.muted,
    'center',
  );
}
export default {
  id: 'checkpoints',
  draw: drawCheckpoints,
  cues: ['early-point', 'continue-training', 'later-sample', 'later-grammar'],
};
