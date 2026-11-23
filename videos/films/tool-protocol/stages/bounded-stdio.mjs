import { linearInterpolate } from '../arithmetic.mjs';
import { correlateResponses } from '../model.mjs';
import { filmPainter } from '../defaults.mjs';

const pending = [
  { id: 1, method: 'discover', color: 'blue' },
  { id: '1', method: 'list', color: 'pink' },
  { id: 3, method: 'status', color: 'cyan' },
];
const replyOrder = [...pending].reverse();
const arrivalCues = ['t-bounded-stdio-reverse', 't-bounded-stdio-string', 't-bounded-stdio-typed'];

function drawReplies(ctx, api) {
  const { C } = api;
  const { label, line, dot, chip, started, finished, progress } = filmPainter(ctx, api);
  const received = replyOrder.filter((_, i) => finished(arrivalCues[i]));
  const { matched } = correlateResponses(pending, received);
  const row = (i) => 391 + i * 170;
  const typedId = (id) => (typeof id === 'string' ? 'string ' : 'integer ') + JSON.stringify(id);

  label('Replayed replies', 220, 287, 42, C.ink, 'left');
  label('Outstanding requests', 1040, 287, 42, C.ink, 'left');
  pending.forEach(({ id, method, color }, i) => {
    const closed = matched.some((request) => request.id === id);
    chip(typedId(id) + '   ·   ' + method, 1040, row(i) - 42, 480, C[color], 84, 38);
    label(
      closed ? 'Matched' : 'Waiting',
      1570,
      row(i) + 12,
      36,
      closed ? C.green : C.muted,
      'left',
    );
  });
  replyOrder.forEach(({ id, color }, i) => {
    const cue = arrivalCues[i];
    if (!started(cue)) return;
    chip(typedId(id), 220, row(i) - 42, 362, C[color], 84, 38);
    if (!finished(cue)) {
      const p = progress(cue);
      const destination = row(pending.findIndex((request) => request.id === id));
      const x = linearInterpolate(596, 1027, p);
      const y = linearInterpolate(row(i), destination, p);
      line(596, row(i), x, y, C[color], 4);
      dot(x, y, C[color], 11);
    }
  });
  label(
    matched.length + ' of ' + pending.length + ' requests matched',
    220,
    909,
    39,
    C.ink,
    'left',
  );
}

export function drawBoundedStdio(ctx, scene, state, api) {
  const { C } = api;
  const { label, line, dot, chip, target, started, finished, progress } = filmPainter(ctx, api);
  return target('bounded-stdio-mechanism', () => {
    if (state.beat === 2) return drawReplies(ctx, api);

    const waiting = state.beat === 1;
    chip('Parent', 150, 345, 350, C.blue, 110, 38);
    chip('Python child', 800, 345, 500, C.cyan, 110, 38);
    line(500, 400, 800, 400, C.cyan);
    if (!waiting) {
      chip('Public record in memory', 1420, 345, 400, C.blue, 110, 30);
      line(1300, 400, 1420, 400, C.blue);
      if (started('t-bounded-stdio-send')) {
        dot(linearInterpolate(509, 789, progress('t-bounded-stdio-send')), 400, C.cyan, 10);
        label('JSON + newline', 650, 315, 29, C.cyan);
      }
      chip('stdout   ·   replies', 260, 570, 670, C.cyan);
      chip('stderr   ·   logs', 1030, 570, 670, C.yellow);
      if (started('t-bounded-stdio-limits'))
        label('Limit each message and the total captured output.', 960, 790, 38, C.yellow);
      return;
    }

    const wait = progress('t-bounded-stdio-timeout');
    line(280, 655, 1640, 655, C.muted);
    dot(linearInterpolate(280, 1640, wait), 655, C.yellow, 12);
    label(
      'Wait-clock illustration: ' + (5 * wait).toFixed(1) + ' / 5 s ceiling',
      960,
      743,
      38,
      C.yellow,
    );
    if (finished('t-bounded-stdio-timeout')) {
      label('direct child killed + reaped', 1050, 530, 32, C.red);
    }
    if (started('t-bounded-stdio-uncertain')) {
      chip('Job sent to service', 1420, 345, 400, C.pink, 110, 34);
      label('Check its outcome', 1620, 530, 32, C.pink);
    }
  });
}

export default {
  id: 'bounded-stdio',
  draw: drawBoundedStdio,
  cues: [
    'bounded-stdio-beat-0',
    't-bounded-stdio-send',
    't-bounded-stdio-limits',
    'bounded-stdio-beat-1',
    't-bounded-stdio-timeout',
    't-bounded-stdio-uncertain',
    'bounded-stdio-beat-2',
    ...arrivalCues,
  ],
};
