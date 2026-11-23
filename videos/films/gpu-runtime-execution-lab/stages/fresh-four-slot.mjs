import { runtimeFreshState } from '../arithmetic.mjs';
import { cueClock } from '../clock.mjs';
import { runtimeText } from '../defaults.mjs';

export function drawFreshFourSlot(ctx, scene, state, api) {
  const { C } = api;
  const p = cueClock(scene, state);
  const txt = (...args) => runtimeText(ctx, api, ...args);
  const old = runtimeFreshState();
  const padded = runtimeFreshState({ copy: true });
  const valid = runtimeFreshState({ copy: true, mask: true });
  const arrived = p('gr-fresh-four-slot-b0-s2') > 0;
  const copied = Math.floor(4 * p('gr-fresh-four-slot-b1-s1'));
  const stale = p('gr-fresh-four-slot-b1-s0') >= 1;
  const paddedDone = p('gr-fresh-four-slot-b1-s2') >= 1;
  const masked = p('gr-fresh-four-slot-b2-s0') >= 1;
  const confirmed = p('gr-fresh-four-slot-b2-s1') >= 1;
  const transfer = p('gr-fresh-four-slot-b3-s0');
  const received = transfer >= 1;
  const input = old.input.map((v, i) => (i < copied ? valid.input[i] : v));
  const xs = [662, 972, 1282, 1592];
  const row = (label, y, values, colors) => {
    txt(label, 145, y + 53, 37, C.ink);
    values.forEach((value, i) => {
      api.rect(ctx, xs[i] - 122, y, 244, 83, C.panel, colors[i], 10);
      txt(value, xs[i], y + 57, 43, colors[i], 'center');
    });
  };

  api.focus.target('fresh-new', () => {
    row(
      p('gr-fresh-four-slot-b0-s3') >= 1 ? 'x → new buffer B' : 'New request B',
      285,
      arrived ? padded.input : ['·', '·', '·', '·'],
      [C.blue, C.blue, C.blue, C.muted],
    );
    if (arrived) {
      ['first input', 'real zero', 'third input', 'padding'].forEach((s, i) =>
        txt(s, xs[i], 258, 29, i === 3 ? C.pink : C.blue, 'center'),
      );
    }
  });
  api.focus.target('fresh-input', () => {
    row('Graph reads A', 421, input, [C.cyan, C.cyan, C.cyan, C.cyan]);
    if (copied && !paddedDone) {
      for (let i = 0; i < copied; i++) api.arrow(ctx, xs[i], 374, xs[i], 412, C.cyan, 4);
    }
  });
  api.focus.target('fresh-mask', () => {
    row('Validity mask M', 539, masked ? valid.valid : old.valid, [
      C.yellow,
      C.yellow,
      C.yellow,
      masked ? C.muted : C.yellow,
    ]);
  });
  api.focus.target('fresh-squares', () => {
    const squares = paddedDone ? padded.squares : stale && copied === 0 ? old.squares : null;
    row('Squared terms', 657, squares ?? ['·', '·', '·', '·'], [
      C.ink,
      C.ink,
      C.ink,
      masked ? C.muted : paddedDone ? C.pink : C.ink,
    ]);
    if (masked) txt('excluded', xs[3], 789, 28, C.muted, 'center');
  });
  api.focus.target('fresh-output', () => {
    const validSum = valid.squares.filter((_, i) => valid.valid[i]).join(' + ');
    const label = confirmed
      ? 'Valid sum ' + validSum + ' = ' + valid.total
      : paddedDone
        ? 'Last completed sum   ' + padded.squares.join(' + ') + ' = ' + padded.total
        : stale
          ? 'Last completed sum from old A   =   ' + old.total
          : 'Which inputs reach the sum in O?';
    txt(label, 960, 871, 43, confirmed ? C.green : C.yellow, 'center');
    if (paddedDone && !masked) txt('Which mask bit must change?', 960, 968, 36, C.ink, 'center');
  });
  if (state.beat === 3)
    api.focus.target('fresh-reader', () => {
      txt('O   ·   ' + valid.total, 230, 978, 42, C.green);
      api.line(ctx, 439, 961, 663, 961, C.muted, 3);
      if (transfer > 0) {
        api.line(ctx, 439, 961, 439 + 224 * transfer, 961, C.green, 5);
        api.circle(ctx, 439 + 224 * transfer, 961, 9, C.green);
      }
      txt(
        received
          ? 'CPU received ' + valid.total
          : transfer > 0
            ? 'CPU reading O'
            : 'CPU waiting to read',
        735,
        978,
        39,
        received ? C.green : C.muted,
      );
      txt(
        received ? 'O available for reuse' : 'O reserved for reader',
        1300,
        978,
        32,
        received ? C.cyan : C.yellow,
      );
    });
}
export default {
  id: 'fresh-four-slot',
  draw: drawFreshFourSlot,
  cues: [
    'gr-fresh-four-slot-b0-s0',
    'gr-fresh-four-slot-b0-s1',
    'gr-fresh-four-slot-b0-s2',
    'gr-fresh-four-slot-b0-s3',
    'gr-fresh-four-slot-b0-s4',
    'gr-fresh-four-slot-b1-s0',
    'gr-fresh-four-slot-b1-s1',
    'gr-fresh-four-slot-b1-s2',
    'gr-fresh-four-slot-b1-s3',
    'gr-fresh-four-slot-b2-s0',
    'gr-fresh-four-slot-b2-s1',
    'gr-fresh-four-slot-b2-s2',
    'gr-fresh-four-slot-b3-s0',
    'gr-fresh-four-slot-b3-s1',
    'gr-fresh-four-slot-b3-s2',
  ],
};
