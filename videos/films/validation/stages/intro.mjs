import { openingRecord, snapshots } from '../fixtures.mjs';
import { readableAt } from '../model.mjs';
import { phraseProgress } from '../defaults.mjs';

function signedRequest(ctx, state, api) {
  const { C } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const opened = snapshots[0].slice(11, 16);
  const signed = openingRecord[2].observed.slice(11, 16);
  api.rect(ctx, 155, 290, 1110, 505, C.ink, undefined, 14);
  api.text(ctx, 'Access request', 225, 409, 67, C.bg, 'left', 'serif');
  api.text(ctx, 'REQ-10234', 225, 476, 35, C.panel);
  api.line(ctx, 225, 520, 925, 520, C.muted, 3);
  api.text(ctx, 'Opened July 1', 225, 608, 39, C.panel);
  api.text(ctx, opened, 217, 746, 134, C.bg);

  const slide = 1 - Math.min(1, state.t / 1.45);
  const x = 996 + 188 * slide * slide;
  const y = 375 - 64 * slide * slide;
  api.rect(ctx, x, y, 554, 354, C.blue, undefined, 10);
  api.text(ctx, 'Manager approval', x + 37, y + 68, 45, C.bg);
  api.text(ctx, 'Signed July 1', x + 40, y + 135, 32, C.panel);
  api.text(ctx, signed, x + 34, y + 247, 104, C.bg);
  api.line(ctx, x + 40, y + 309, x + 509, y + 309, C.panel, 2);
  api.path(
    ctx,
    [
      { x: x + 64, y: y + 300 },
      { x: x + 91, y: y + 270 },
      { x: x + 82, y: y + 300 },
      { x: x + 110, y: y + 279 },
      { x: x + 104, y: y + 298 },
      { x: x + 126, y: y + 284 },
      { x: x + 143, y: y + 297 },
      { x: x + 213, y: y + 285 },
    ],
    { color: C.bg, width: 5 },
  );
  api.text(ctx, 'Could the router use this signature?', 960, 935, 55, C.yellow, 'center');
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  if (beat === 0) return signedRequest(ctx, state, api);
  const x = [330, 960, 1580];
  const undoAudit = phraseProgress(state, api, 'rewind-audit', 2, 0.24, 0.52);
  const undoApproval = phraseProgress(state, api, 'rewind-approval', 2, 0.55, 0.86);
  const position = 2 - undoAudit - undoApproval;
  const slot = Math.floor(position);
  const head = slot === 2 ? x[2] : api.lerp(x[slot], x[slot + 1], position - slot);
  const readable = readableAt(snapshots[slot]);

  api.text(ctx, 'REQ-10234', 135, 241, 39, C.ink);
  api.text(ctx, 'Saved snapshots in time order · UTC', 1775, 240, 30, C.muted, 'right');
  api.line(ctx, x[0], 333, x[2], 333, C.muted, 4);
  const names = ['July 1 · 09:00', 'July 1 · 10:22', 'July 15 · 12:00'];
  const events = ['Request opens', 'Approval received', 'Audit closes'];
  x.forEach((tick, i) => {
    api.circle(ctx, tick, 333, 9, C.muted);
    api.text(ctx, names[i], tick, 301, 34, C.ink, 'center');
    api.text(ctx, events[i], tick, 401, 31, C.muted, 'center');
  });
  api.focus.target('snapshot-cursor', () => api.circle(ctx, head, 333, 18, C.yellow));

  api.text(ctx, 'Field', 170, 502, 30, C.muted);
  api.text(ctx, 'First readable', 975, 502, 30, C.muted, 'center');
  api.text(ctx, 'In this snapshot', 1530, 502, 30, C.muted, 'center');
  api.line(ctx, 135, 530, 1775, 530, C.muted, 2);
  const hasAudit = phraseProgress(state, api, 'read-audit', 1, 0.22, 0.4) > 0;
  const count = hasAudit ? 4 : 3;
  for (let i = 0; i < count; i++) {
    const field = openingRecord[i];
    const date = field.observed.slice(8, 10) === '15' ? 'July 15' : 'July 1';
    const y = 600 + 89 * i;
    api.focus.target('field-' + i, () =>
      api.text(ctx, field.name, 170, y, 41, readable[i] ? C.ink : C.muted),
    );
    api.text(ctx, date + ' · ' + field.observed.slice(11, 16), 975, y, 36, C.ink, 'center');
    api.text(
      ctx,
      readable[i] ? 'Recorded' : 'Pending',
      1530,
      y,
      36,
      readable[i] ? C.blue : C.muted,
      'center',
    );
  }
  if (beat === 1 && hasAudit) {
    api.text(
      ctx,
      'At 09:00, which fields could the router read?',
      960,
      982,
      43,
      C.yellow,
      'center',
    );
  } else if (position === 0) {
    const count = readable.filter(Boolean).length;
    api.text(ctx, count + ' of 4 fields available at opening', 960, 982, 45, C.yellow, 'center');
  }
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['read-approval', 'read-audit', 'rewind-audit', 'rewind-approval'],
};
