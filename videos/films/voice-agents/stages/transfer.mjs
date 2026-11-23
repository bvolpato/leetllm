import { chunks, commitToAudio, firstAudioLatency, interrupt, trace } from '../fixtures.mjs';
import { drawBracket, drawText } from '../defaults.mjs';
import { sceneCues } from '../reply-strip.mjs';

export function drawTransfer(ctx, scene, state, api) {
  const cue = sceneCues(scene, state);
  const { C } = api;
  const start = interrupt.replyStartWallMs;
  const ack = interrupt.acknowledgedThrough;
  const statusEnd = start + ack;
  const x = (ms) => 145 + ms;
  api.focus.target('recap-trace', () => {
    drawText(ctx, api, 'Call time since the end of Alex’s question', 145, 258, 33, C.blue);
    api.line(ctx, x(0), 456, x(interrupt.wallMs), 456, C.muted, 3);
    function mark(time, y, label, color, align = 'center') {
      api.line(ctx, x(time), y + 16, x(time), 449, color, 3);
      api.circle(ctx, x(time), 456, 9, color);
      drawText(ctx, api, label, x(time), y, 32, color, align);
    }
    mark(0, 354, 'Speech ends', C.blue, 'left');
    if (cue.at('recap-clocks')) mark(trace.commit, 410, 'Commit', C.cyan, 'left');
    if (cue.at('recap-first')) mark(trace.firstAudio, 354, '“I’ll check that.”', C.green);
    if (cue.at('recap-facts')) mark(start, 410, 'Factual reply starts', C.yellow);
    if (cue.at('recap-total')) mark(statusEnd, 354, 'End of “open”', C.green);
    if (cue.at('recap-stop')) {
      api.circle(ctx, x(interrupt.wallMs), 456, 9, C.pink);
      drawText(ctx, api, 'Alex cuts in', x(interrupt.wallMs), 399, 32, C.pink, 'center');
    }
    for (const time of [
      0,
      trace.firstAudio,
      ...(cue.at('recap-facts') ? [start] : []),
      ...(cue.at('recap-total') ? [statusEnd] : []),
    ]) {
      drawText(ctx, api, time + ' ms', x(time), 521, 30, C.muted, time === 0 ? 'left' : 'center');
    }
  });
  api.focus.target('recap-reply', () => {
    if (!cue.at('recap-facts')) return;
    const first = chunks[0].endMs;
    const reached = first + (ack - first) * cue.p('recap-add');
    const head = x(start + reached);
    api.line(ctx, x(start), 641, head, 641, C.yellow, 14);
    api.line(ctx, x(start + first), 616, x(start + first), 655, C.muted, 3);
    drawText(ctx, api, chunks[0].text, x(start), 596, 34, C.ink);
    drawText(ctx, api, first + ' ms', x(start + first), 704, 30, C.muted, 'center');
    if (cue.at('recap-add')) {
      drawText(ctx, api, chunks[1].text.trim(), x(start + first) + 25, 596, 34, C.ink);
    }
    if (cue.at('recap-ask')) {
      drawText(ctx, api, 'Receipt ' + ack + ' ms', x(statusEnd), 704, 30, C.green, 'center');
    }
    drawText(ctx, api, 'Reply time', x(start) - 28, 653, 32, C.yellow, 'right');
  });
  api.focus.target('recap-measures', () => {
    if (!cue.at('recap-facts')) {
      drawBracket(
        ctx,
        api,
        x(0),
        x(trace.firstAudio),
        620,
        firstAudioLatency + ' ms from speech end',
        C.blue,
      );
      if (cue.at('recap-clocks'))
        drawBracket(
          ctx,
          api,
          x(trace.commit),
          x(trace.firstAudio),
          760,
          commitToAudio + ' ms from commit',
          C.cyan,
        );
    } else if (cue.at('recap-ask')) {
      drawText(
        ctx,
        api,
        cue.at('recap-total')
          ? 'End of the status word on the call clock'
          : 'When does the status word finish on the call clock?',
        145,
        835,
        39,
      );
      drawText(
        ctx,
        api,
        start + ' ms  +  ' + ack + ' ms  =  ' + (cue.at('recap-total') ? statusEnd + ' ms' : '?'),
        145,
        940,
        59,
        C.green,
      );
    }
  });
}

export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'recap-first',
    'recap-clocks',
    'recap-facts',
    'recap-ask',
    'recap-add',
    'recap-total',
    'recap-stop',
    'recap-receipt',
  ],
};
