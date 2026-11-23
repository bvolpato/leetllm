export const EVENT = '78291';
export const BRANCH = 'agent/billing-event-78291';
export const BILLING = 'pnpm test --run billing';
export const INVOICES = 'pnpm test --run invoices';

const paper = '#eee8d7';
const ink = '#202724';
const rule = '#738276';

export function cue(api, id) {
  return api.focus.progress(id, 0);
}

// The retained slip and its copy carry the same event number in both visits.
export function replaySlip(ctx, api, x, y) {
  const width = 710;
  const height = 418;
  api.rect(ctx, x, y, width, height, paper, null, 3);
  api.text(ctx, 'BILLING  /  WEBHOOK REPLAY', x + 40, y + 64, 32, ink, 'left', 'mono');
  api.text(ctx, 'Event ' + EVENT, x + 40, y + 146, 66, ink, 'left', 'serif');
  api.line(ctx, x + 40, y + 176, x + width - 40, y + 176, rule, 2);
  for (let i = 0; i < 2; i++) {
    const baseline = y + 245 + i * 89;
    api.text(ctx, i ? 'Repeat delivery' : 'First delivery', x + 40, baseline, 33, ink);
    api.text(ctx, i ? 'Invoice B' : 'Invoice A', x + width - 40, baseline, 42, ink, 'right');
  }
  for (let i = 0; i < 21; i++) {
    const start = x + 36 + i * 31;
    api.line(ctx, start, y + height - 26, start + 15, y + height - 26, rule, 2);
  }
}

export function promptSheet(
  ctx,
  api,
  {
    heading = 'Ada’s new chat',
    typed = 'Continue',
    sent = true,
    verifier,
    showVerifier = false,
    commandCopy = 1,
    replayCopy = 0,
    showInvoiceCount = false,
    branch = false,
    pending = false,
  },
) {
  const { C } = api;
  const x = 884;
  const left = x + 44;
  const height = pending
    ? 730
    : branch
      ? 664
      : replayCopy > 0
        ? 593
        : showVerifier || verifier
          ? 518
          : 440;
  api.rect(ctx, x, 220, 924, height, C.panel, null, 16);
  api.text(ctx, heading, left, 295, 43, C.ink, 'left', 'serif');

  const bubble = '#264a83';
  api.rect(ctx, left, 334, 558, 132, bubble, null, 28);
  api.path(
    ctx,
    [
      { x: left + 507, y: 450 },
      { x: left + 558, y: 450 },
      { x: left + 558, y: 484 },
    ],
    { closed: true, fill: bubble, width: 0 },
  );
  api.text(ctx, sent ? typed : typed + '|', left + 34, 427, 83, C.ink, 'left', 'mono');

  api.line(ctx, left, 506, x + 880, 506, C.muted, 2);
  api.text(ctx, 'Model context', left, 567, 39, C.ink, 'left', 'serif');
  api.text(ctx, sent ? 'Instructions  +  “Continue”' : 'Instructions', left, 622, 35, C.muted);
  const valueX = left + 175;
  if (showVerifier || verifier) {
    api.text(ctx, 'Verifier', left, 699, 32, C.muted);
    if (verifier) {
      api.rect(ctx, valueX, 650, 640 * commandCopy, 66, '#383326', null, 4);
      if (commandCopy >= 1) api.text(ctx, verifier, valueX + 14, 696, 36, C.yellow, 'left', 'mono');
    } else {
      api.line(ctx, valueX, 704, x + 854, 704, C.yellow, 3);
    }
  }
  if (replayCopy > 0) {
    api.text(ctx, 'Replay · R8', left, 775, 32, C.muted);
    api.rect(ctx, valueX, 726, 640 * replayCopy, 66, '#203139', null, 4);
    if (replayCopy >= 1) {
      const result = showInvoiceCount ? '  /  two invoices' : '  /  failed';
      api.text(ctx, 'Event ' + EVENT + result, valueX + 14, 771, 36, C.cyan);
    }
  }
  if (branch) {
    api.text(ctx, 'Branch', left, 847, 32, C.muted);
    api.text(ctx, BRANCH, valueX + 14, 847, 32, C.blue, 'left', 'mono');
  }
  if (pending) {
    api.text(ctx, 'Merge M17', left, 918, 32, C.muted);
    api.text(ctx, 'Pending · check destination', valueX + 14, 918, 36, C.yellow);
  }
}
