import { chunks, interrupt, pendingText } from '../fixtures.mjs';
import { voiceReconcile } from '../arithmetic.mjs';
import { drawText } from '../defaults.mjs';
import { receiptLane, replyStrip, sceneCues, stopMark } from '../reply-strip.mjs';

export function drawBargeIn(ctx, scene, state, api) {
  const cue = sceneCues(scene, state);
  const { C } = api;
  const duration = chunks.at(-1).endMs;
  const ack = interrupt.acknowledgedThrough;
  const first = chunks[0].endMs;
  const cursor = cue.at('barge-second-ack') ? ack : cue.at('barge-first-ack') ? first : null;
  const stopped = cue.at('barge-stop');
  const saved = cue.at('barge-keep');
  api.focus.target('reply-strip', () => {
    drawText(ctx, api, 'Alex’s phone  /  received audio for reply 1', 145, 270, 32, C.cyan);
    replyStrip(ctx, api, chunks, { y: 310, keptThrough: saved ? cursor : undefined });
  });
  if (stopped)
    api.focus.target('reply-stop', () => {
      stopMark(
        ctx,
        api,
        interrupt.replyElapsedMs,
        duration,
        535,
        cue.at('barge-local') ? '650 ms  /  mute locally' : '650 ms  /  “Wait, page the owner.”',
      );
    });
  api.focus.target('reply-receipt', () => {
    receiptLane(ctx, api, {
      y: 670,
      duration,
      cursor,
      label: cue.at('barge-freeze') ? 'Frozen playback receipt' : 'Last playback receipt',
    });
  });
  api.focus.target('reply-question', () => {
    if (cue.at('barge-ask') && !saved)
      drawText(ctx, api, 'Which words can the next turn treat as already said?', 145, 890, 44);
  });
  api.focus.target('reply-history', () => {
    if (!saved) return;
    const history = voiceReconcile(pendingText, chunks, cursor);
    drawText(ctx, api, 'Assistant history for the next turn', 145, 828, 32, C.green);
    drawText(ctx, api, '“' + history.retained + '”', 145, 910, 62);
    if (cue.at('barge-id')) {
      drawText(ctx, api, 'Call Alex  /  reply 1', 1130, 834, 33, C.blue);
      drawText(ctx, api, 'Received through ' + duration + ' ms', 1130, 906, 33, C.muted);
    }
  });
}

export default {
  id: 'barge-in',
  draw: drawBargeIn,
  cues: [
    'barge-origin',
    'barge-player',
    'barge-first-ack',
    'barge-second-ack',
    'barge-stop',
    'barge-ask',
    'barge-keep',
    'barge-unconfirmed',
    'barge-local',
    'barge-freeze',
    'barge-id',
  ],
};
