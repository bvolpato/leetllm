import { lessonFont } from '../../../lib/fonts.mjs';
import { drawText } from '../defaults.mjs';
import { sceneCues } from '../reply-strip.mjs';

const first = 'Incident 4219 is still open,';
const continuation = 'severity is sev-two.';
const long = 'Incident 4219 is still open and the on-call owner is investigating';
const limit = 52;
const split = long.lastIndexOf(' ', limit);
const prefix = long.slice(0, split);
const remainder = long.slice(split + 1);

function audioQueue(ctx, api, cue) {
  const { C } = api;
  const p = cue.p('queue-fill');
  const produced = 2 + Math.floor(6 * p);
  const played = Math.floor(2 * p);
  const top = 482;
  drawText(ctx, api, 'Audio pieces ready for playback', 155, 333, 48);
  for (let i = 0; i < 8; i++) {
    const x = 165 + i * 196;
    const color = i < played ? C.muted : i < produced ? C.yellow : C.panel;
    api.rect(ctx, x, top, 166, 137, color, C.muted, 14);
    if (i < produced) drawText(ctx, api, i + 1, x + 83, top + 91, 62, C.bg, 'center');
  }
  drawText(ctx, api, played + ' played', 165, 725, 47, C.muted);
  drawText(ctx, api, produced - played + ' queued', 1655, 725, 47, C.yellow, 'right');
  if (cue.at('queue-bound'))
    drawText(ctx, api, 'Queue limit reached. Pause synthesis.', 165, 885, 48, C.pink);
}

export function drawClauseQueue(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  if (cue.at('queue-pace')) {
    api.focus.target('queue-audio', () => audioQueue(ctx, api, cue));
    return;
  }
  const soft = cue.at('clause-long');
  const flush = cue.p('clause-flush');
  const splitOff = cue.at('clause-split');
  const ended = cue.done('clause-end');
  api.focus.target('queue-buffer', () => {
    drawText(ctx, api, 'Words waiting in the text buffer', 150, 316, 39, C.cyan);
    api.line(ctx, 150, 354, 1770, 354, C.cyan, 3);
    if (soft) {
      if (!splitOff) {
        const marked = cue.at('clause-space');
        ctx.save();
        ctx.font = lessonFont(40, 'mono');
        const x = 170 + ctx.measureText(prefix).width;
        ctx.restore();
        api.text(ctx, prefix, 170, 475, 40, C.ink, 'left', 'mono');
        api.text(ctx, ' ' + remainder, x, 475, 40, C.ink, 'left', 'mono');
        if (marked) {
          api.rect(ctx, x + 2, 498, 18, 10, C.yellow, undefined, 4);
          drawText(ctx, api, 'Space at 52', x + 10, 557, 32, C.yellow, 'center');
        }
      } else if (!ended) drawText(ctx, api, remainder, 170, 475, 55);
    } else if (flush === 0) {
      const comma = cue.done('clause-comma');
      drawText(ctx, api, comma ? first : first.slice(0, -1), 640, 475, 61);
    } else if (cue.at('clause-more') && !cue.done('clause-more')) {
      const n = Math.ceil(cue.p('clause-more') * continuation.length);
      drawText(ctx, api, continuation.slice(0, n), 640, 475, 55);
    }
  });
  api.focus.target('queue-output', () => {
    drawText(ctx, api, 'Sent to synthesis', 150, 711, 39, C.green);
    api.line(ctx, 150, 749, 508, 749, C.green, 3);
    if (soft && splitOff) {
      drawText(ctx, api, prefix, 170, 835, 46);
      if (ended) drawText(ctx, api, remainder, 170, 922, 46);
    } else if (!soft && flush > 0) {
      drawText(ctx, api, first, 640, 475 + 360 * flush, 61, C.green);
      if (cue.done('clause-more')) drawText(ctx, api, continuation, 640, 922, 54, C.green);
    }
  });
}

export default {
  id: 'clause-queue',
  draw: drawClauseQueue,
  cues: [
    'clause-comma',
    'clause-flush',
    'clause-more',
    'clause-long',
    'clause-space',
    'clause-split',
    'clause-end',
    'queue-pace',
    'queue-fill',
    'queue-bound',
  ],
};
