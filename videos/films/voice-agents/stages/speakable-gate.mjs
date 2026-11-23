import { drawText } from '../defaults.mjs';
import { sceneCues } from '../reply-strip.mjs';

const budget = 400;
const reserve = 200;

export function drawSpeakableGate(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  const closed = cue.at('va-speakable-gate-1-1');
  const failed = cue.at('va-speakable-gate-1-2');
  api.focus.target('va-speakable-gate-deadline', () => {
    const left = 150;
    const right = 1720;
    const split = left + ((budget - reserve) / budget) * (right - left);
    drawText(ctx, api, 'Time after turn acceptance', left, 266, 34, C.cyan);
    api.line(ctx, left, 354, right, 354, C.muted, 6);
    drawText(ctx, api, '0', left, 316, 32);
    drawText(ctx, api, budget + ' ms', right, 316, 32, C.ink, 'right');
    const reserving = cue.at('va-speakable-gate-0-1');
    if (reserving) {
      const x = right - (right - split) * cue.p('va-speakable-gate-0-1');
      api.line(ctx, x, 354, right, 354, C.green, 14);
      drawText(ctx, api, 'Synthesis, transport, playback', split + 45, 421, 35, C.green);
    }
    if (cue.done('va-speakable-gate-0-2')) {
      api.line(ctx, left, 354, split, 354, C.yellow, 14);
      drawText(ctx, api, 'Choose words by ' + (budget - reserve) + ' ms', left, 421, 38, C.yellow);
    }
  });
  const speak = cue.at('va-speakable-gate-1-0');
  const pronounce = cue.at('va-speakable-gate-2-2');
  api.focus.target('va-speakable-gate-tool-state', () => {
    if (pronounce) {
      drawText(ctx, api, 'Listen for the incident number', 150, 585, 34, C.cyan);
      drawText(ctx, api, '4   2   1   9', 150, 716, 83);
      drawText(ctx, api, 'And the severity', 1000, 585, 34, C.cyan);
      drawText(ctx, api, 'Sev two', 1000, 716, 83);
      return;
    }
    if (!speak) return;
    drawText(ctx, api, failed ? 'Requested change' : 'Status lookup', 150, 581, 34, C.cyan);
    const color = failed ? C.pink : closed ? C.green : C.yellow;
    drawText(ctx, api, failed ? 'Failed' : closed ? 'Closed' : 'Pending', 150, 694, 72, color);
    drawText(ctx, api, 'Spoken reply', 860, 581, 34, C.cyan);
    const line = failed
      ? '“The change is unconfirmed.”'
      : closed
        ? cue.done('speak-returned-status')
          ? '“Incident 4219 is closed.”'
          : '“Incident 4219 is ____.”'
        : '“I’m checking the request.”';
    drawText(ctx, api, line, 860, 694, 56);
    const p = cue.p('speak-returned-status');
    if (closed && !failed) {
      api.line(ctx, 465, 671, 765, 671, C.muted, 3);
      api.circle(ctx, 465 + 300 * p, 671, 10, color);
    }
  });
  if (cue.at('va-speakable-gate-1-3'))
    api.focus.target('va-speakable-gate-authority', () => {
      const link = cue.at('va-speakable-gate-2-1');
      drawText(ctx, api, link ? 'Offer a text link' : 'Page or close', 150, 906, 42, C.blue);
      drawText(
        ctx,
        api,
        link ? 'Supported on this call  +  authorized' : 'Permission  +  confirmation',
        820,
        906,
        42,
      );
    });
}

export default {
  id: 'speakable-gate',
  draw: drawSpeakableGate,
  cues: [
    'va-speakable-gate-0-0',
    'va-speakable-gate-0-1',
    'va-speakable-gate-0-2',
    'va-speakable-gate-1-0',
    'va-speakable-gate-1-1',
    'speak-returned-status',
    'va-speakable-gate-1-2',
    'va-speakable-gate-1-3',
    'va-speakable-gate-2-0',
    'va-speakable-gate-2-1',
    'va-speakable-gate-2-2',
  ],
};
