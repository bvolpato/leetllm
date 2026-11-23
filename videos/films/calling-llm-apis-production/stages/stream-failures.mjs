import { bufferThrough, deltas, streamComparison } from '../model.mjs';
import { cueClock } from '../cued-trace.mjs';

export function drawStreamFailures(ctx, scene, state, api) {
  const { C } = api;
  const clock = cueClock(scene, state);
  const beat = state.beat;
  const showReplay = beat >= 1;
  const { firstCount, secondCount, partial, receivedEnd, atEof, secondFailed, dropFinished } =
    streamComparison(state, scene.beats ? clock : undefined);

  function buffer(x, count, name) {
    api.text(ctx, name, x, 297, 42, C.ink);
    api.text(ctx, 'Text received', x, 398, 30, C.muted);
    // Each pair of chunks shares one line. Their trailing spaces are part of the buffer.
    const offsets = [
      [0, 0],
      [8, 0],
      [0, 1],
      [12, 1],
    ];
    deltas.slice(0, count).forEach((word, i) => {
      const [column, row] = offsets[i];
      api.text(ctx, word, x + column * 22, 505 + row * 61, 36, C.ink, 'left', 'mono');
    });
    const n = bufferThrough(count).length;
    api.line(ctx, x, 654, x + 635, 654, C.muted, 2);
    if (n) api.line(ctx, x, 654, x + (635 * n) / bufferThrough(4).length, 654, C.cyan, 13);
    api.text(ctx, n + ' characters', x, 719, 35, C.cyan);
  }
  api.focus.target('draft-bytes', () => {
    buffer(160, firstCount, 'Original stream');
    if (showReplay)
      buffer(
        1025,
        secondCount,
        partial ? 'Replay  /  drop after delta 2' : 'Replay  /  same four deltas',
      );
  });
  api.focus.target('stream-ending', () => {
    api.text(
      ctx,
      receivedEnd ? 'response.completed' : 'Waiting for terminal event',
      160,
      853,
      35,
      receivedEnd ? C.green : C.muted,
      'left',
      'mono',
    );
    if (receivedEnd) api.text(ctx, 'Completed draft', 160, 936, 40, C.green);
    if (showReplay) {
      const end = partial
        ? dropFinished
          ? 'Connection dropped'
          : 'Receiving'
        : atEof
          ? 'End of file'
          : 'Receiving';
      api.text(ctx, end, 1025, 853, 35, C.ink);
      const failed = partial ? dropFinished : secondFailed;
      const label = failed
        ? 'Failed draft'
        : atEof
          ? 'Mark complete?'
          : 'Waiting for terminal event';
      api.text(ctx, label, 1025, 936, 40, failed ? C.pink : C.muted);
    }
  });
}

export default {
  id: 'stream-failures',
  draw: drawStreamFailures,
  cues: [
    'eight-chars',
    'nineteen-chars',
    'thirty-one-chars',
    'forty-one-chars',
    'draft-terminal',
    'draft-repeat',
    'draft-eof',
    'draft-failed',
    'draft-dropped',
    'draft-validate',
  ],
};
