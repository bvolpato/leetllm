import { voiceLateAck, voiceReconcile, voiceWorksheet } from '../arithmetic.mjs';
import { drawText } from '../defaults.mjs';
import { receiptLane, replyStrip, sceneCues, stopMark } from '../reply-strip.mjs';

const { freshChunks, freshText } = voiceWorksheet();
const received = freshChunks.at(-1).endMs;
const frozen = { session: 'Alex', response: 7, cursor: 460, received, cancelled: true };
const active = { session: 'Alex', response: 8, cursor: 0, received: 0, cancelled: false };
const late = { session: 'Alex', response: 7, cursor: received };
const history = voiceReconcile(freshText, freshChunks, frozen.cursor);
const oldAfterReceipt = voiceLateAck(frozen, late);
const newAfterReceipt = voiceLateAck(active, late);

export function drawFreshInterruption(ctx, scene, state, api) {
  const cue = sceneCues(scene, state);
  const { C } = api;
  const next = cue.at('fresh-question');
  const activeReply = cue.at('fresh-switch');
  const deciding = cue.at('fresh-decision');
  const keep = cue.done('va-fresh-interruption-1-0');
  const reject = cue.done('va-fresh-interruption-2-1');
  const answer = cue.at('fresh-answer');
  api.focus.target('fresh-record', () => {
    drawText(ctx, api, 'Tool record', 145, 249, 32, C.yellow);
    if (cue.at('fresh-record')) {
      api.line(ctx, 395, 235, 455, 235, C.yellow, 3);
      drawText(ctx, api, 'Owner replied to page-4219-A', 487, 250, 39);
    }
  });
  if (!next) {
    api.focus.target('fresh-strip', () => {
      drawText(ctx, api, 'Alex’s phone  /  reply 7', 145, 345, 32, C.cyan);
      replyStrip(ctx, api, freshChunks, {
        y: 365,
        available: cue.p('fresh-pieces') * received,
        keptThrough: keep ? frozen.cursor : undefined,
        offsets: true,
      });
    });
    if (cue.at('fresh-cut'))
      api.focus.target('fresh-stop', () => {
        stopMark(ctx, api, 560, received, 582, '560 ms  /  Alex cuts in');
      });
    api.focus.target('fresh-player', () => {
      receiptLane(ctx, api, {
        y: 709,
        duration: received,
        cursor: cue.at('fresh-ack') ? frozen.cursor : null,
        label: 'Last playback receipt',
      });
    });
  } else if (!deciding) {
    api.focus.target('fresh-identities', () => {
      drawText(ctx, api, 'Reply ' + frozen.response + '  /  frozen', 145, 585, 38, C.muted);
      drawText(ctx, api, oldAfterReceipt.cursor + ' ms confirmed', 145, 649, 37);
      if (activeReply) {
        drawText(ctx, api, 'Reply ' + active.response + '  /  active', 1100, 585, 38, C.blue);
        drawText(ctx, api, newAfterReceipt.cursor + ' ms confirmed', 1100, 649, 37);
      }
      if (cue.at('fresh-late')) {
        const x = 150 + 815 * cue.p('fresh-late');
        api.line(ctx, 150, 755, 1039, 755, C.muted, 3);
        api.line(ctx, 1050, 726, 1050, 783, C.blue, 5);
        api.circle(ctx, x, 755, 12, C.yellow);
        drawText(
          ctx,
          api,
          'Late receipt  /  reply ' + late.response + '  /  ' + late.cursor + ' ms',
          145,
          850,
          35,
          C.yellow,
        );
        if (reject && !newAfterReceipt.accepted)
          drawText(ctx, api, 'REJECT  /  different reply', 1100, 850, 36, C.pink);
      }
    });
  }
  api.focus.target('fresh-history', () => {
    const y = next ? 385 : 852;
    drawText(ctx, api, 'Assistant history from reply 7', 145, y, 32, C.green);
    api.line(ctx, 145, y + 20, next ? 840 : 1735, y + 20, C.green, 3);
    if (keep) drawText(ctx, api, '“' + history.retained + '”', 145, y + 96, 48);
    else if (cue.at('fresh-ask'))
      drawText(ctx, api, 'Which sentence goes into conversation history?', 145, y + 96, 42);
    if (next) {
      drawText(ctx, api, 'Alex', 1010, y, 32, C.blue);
      drawText(ctx, api, '“Did the owner reply?”', 1010, y + 96, 48);
    }
  });
  if (deciding)
    api.focus.target('fresh-answer', () => {
      drawText(ctx, api, 'Reply 8', 145, 690, 34, C.green);
      api.line(ctx, 145, 719, 1755, 719, C.green, 3);
      drawText(
        ctx,
        api,
        answer ? '“Yes, the owner replied.”' : 'What should the hotline tell Alex now?',
        145,
        840,
        answer ? 64 : 48,
        C.ink,
      );
    });
}

export default {
  id: 'fresh-interruption',
  draw: drawFreshInterruption,
  cues: [
    'fresh-record',
    'fresh-pieces',
    'fresh-cut',
    'fresh-ack',
    'fresh-ask',
    'va-fresh-interruption-1-0',
    'fresh-tool-stays',
    'fresh-question',
    'fresh-switch',
    'fresh-late',
    'va-fresh-interruption-2-1',
    'fresh-decision',
    'fresh-answer',
  ],
};
