import { BILLING, EVENT, cue, promptSheet } from '../case-file.mjs';

function traceCopy(ctx, api, progress, sourceY, promptY, color) {
  if (progress <= 0 || progress >= 1) return;
  const tip = api.trace(
    ctx,
    [
      { x: 791, y: sourceY },
      { x: 837, y: sourceY },
      { x: 837, y: promptY },
      { x: 883, y: promptY },
    ],
    api.phase(progress, 0, 0.65),
    color,
    4,
  );
  if (tip) api.circle(ctx, tip.x, tip.y, 7, color);
}

export function drawSubjectIntro(ctx, scene, state, api) {
  const { C } = api;
  const spoken = cue(api, 'type-continue');
  const typed = Math.max(spoken, 0.4 * api.phase(state.t, 0, 0.4));
  const commandCopy = cue(api, 'profile-lookup');
  const replayCopy = cue(api, 'copy-receipt');
  const counted = cue(api, 'replay-count') >= 1;

  ctx.save();
  if (state.t < 0.35) ctx.globalAlpha = 1;
  api.focus.target('note', () => {
    const darkInk = '#332e22';
    api.rect(ctx, 110, 255, 681, 264, '#f2dc95', null, 4);
    api.circle(ctx, 450, 276, 9, '#856c41');
    api.text(ctx, 'Ada’s saved note', 146, 358, 49, darkInk, 'left', 'serif');
    api.text(ctx, '4 days ago', 752, 353, 29, darkInk, 'right');
    api.text(ctx, 'Billing project  /  preferred test', 148, 415, 34, darkInk);
    api.text(ctx, BILLING, 148, 484, 39, darkInk, 'left', 'mono');
  });
  api.focus.target('receipt', () => {
    api.rect(ctx, 110, 581, 681, 269, C.panel, '#525962', 10);
    api.text(ctx, 'Yesterday’s tool output', 146, 645, 39, C.ink, 'left', 'serif');
    api.text(ctx, 'R8', 752, 643, 30, C.muted, 'right', 'mono');
    api.line(ctx, 110, 673, 791, 673, '#525962', 2);
    api.text(ctx, 'Replay ' + EVENT, 147, 744, 44, C.cyan, 'left', 'mono');
    api.text(ctx, 'FAIL', 752, 744, 35, C.pink, 'right', 'mono');
    api.text(ctx, 'Expected 1   ·   got 2', 148, 811, 33, C.ink, 'left', 'mono');
  });
  api.focus.target('request', () => {
    promptSheet(ctx, api, {
      typed: 'Continue'.slice(0, 1 + Math.floor(7 * typed)),
      sent: spoken >= 1,
      verifier: commandCopy > 0 ? BILLING : undefined,
      commandCopy: api.phase(commandCopy, 0.45, 1),
      replayCopy: api.phase(replayCopy, 0.45, 1),
      showInvoiceCount: counted,
      branch: cue(api, 'branch-lookup') >= 1,
    });
    traceCopy(ctx, api, commandCopy, 473, 683, C.yellow);
    traceCopy(ctx, api, replayCopy, 740, 759, C.cyan);
  });
  ctx.restore();
}

export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: [
    'type-continue',
    'saved-command',
    'profile-lookup',
    'copy-receipt',
    'replay-count',
    'branch-lookup',
  ],
};
