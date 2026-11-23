import { drawText } from '../defaults.mjs';
import { sceneCues } from '../reply-strip.mjs';

export function drawOperationLedger(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  const submitted = cue.at('page-submit');
  const timeout = cue.at('page-timeout');
  const reconcile = cue.at('page-reconcile');
  const accepted = cue.at('page-accepted');
  const cut = cue.at('page-cut');
  api.focus.target('page-request', () => {
    let permission = 'Action: page on-call';
    if (cue.at('page-auth')) permission = 'Check current permission to page on-call';
    if (submitted) permission = 'Permission verified at submission';
    drawText(ctx, api, 'Alex  /  incident 4219', 145, 255, 32, C.blue);
    drawText(ctx, api, '“Page the owner.”', 145, 331, 57);
    drawText(ctx, api, 'Confirmed request  /  page-4219-A', 960, 261, 35, C.blue);
    drawText(ctx, api, permission, 960, 328, 33, C.muted);
  });
  api.focus.target('page-record', () => {
    drawText(ctx, api, accepted ? 'Paging service receipt' : 'Page request', 145, 457, 32, C.yellow);
    api.line(ctx, 145, 482, 1755, 482, C.muted, 3);
    drawText(
      ctx,
      api,
      submitted ? 'page-4219-A' : 'Awaiting submission',
      145,
      570,
      43,
      submitted ? C.ink : C.muted,
    );
    if (!submitted) return;
    const color = accepted ? C.green : timeout ? C.pink : C.yellow;
    const status = accepted ? 'Accepted' : timeout ? 'Timed out locally' : 'Submitted';
    drawText(ctx, api, status, 830, 570, 45, color);
    if (accepted) drawText(ctx, api, 'Delivery to owner unknown', 145, 650, 35, C.muted);
    else if (reconcile)
      drawText(ctx, api, 'Query page-4219-A  /  additional dispatches: 0', 145, 650, 35, C.cyan);
    else if (cue.at('page-ask'))
      drawText(ctx, api, 'Should it send another page?', 145, 650, 39, C.yellow);
  });
  api.focus.target('page-words', () => {
    if (!cue.at('page-words')) return;
    drawText(
      ctx,
      api,
      cut ? 'Assistant history  /  playback receipt 0 ms' : 'Ready to speak',
      145,
      776,
      32,
      cut ? C.pink : C.cyan,
    );
    api.line(ctx, 145, 807, 1755, 807, cut ? C.pink : C.cyan, 3);
    drawText(
      ctx,
      api,
      cut ? 'No assistant entry' : '“The paging service accepted your request.”',
      145,
      908,
      50,
      cut ? C.muted : C.ink,
    );
  });
}

export default {
  id: 'operation-ledger',
  draw: drawOperationLedger,
  cues: [
    'page-request',
    'page-auth',
    'page-submit',
    'page-timeout',
    'page-ask',
    'page-reconcile',
    'page-accepted',
    'page-words',
    'page-cut',
    'page-next',
  ],
};
