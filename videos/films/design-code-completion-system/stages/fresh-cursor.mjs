import { editorEpochState } from '../construction.mjs';
import { fresh } from '../model.mjs';
import { text } from '../defaults.mjs';
import { snapshot, acceptEdit, drawBuffer, drawOutcome, drawSnapshots } from '../editor.mjs';

const line = 'ok = policy.   # scope';
const origin = line.indexOf('.') + 1;
const old = snapshot(73, origin, 9, 101);

export function drawFreshCursor(ctx, scene, state, api) {
  const s = editorEpochState(state);
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const live = snapshot(old.version, s.cursor, old.policy, s.currentEpoch);
  const reply = {
    captured: s.submitted ? snapshot(73, origin, 9, 104) : old,
    insert: 'allows(req)',
  };
  const painted = s.painted && fresh(reply.captured, live);
  const inserted = painted && after('cursor-insert');
  const updated = inserted ? acceptEdit(line, reply, live) : line;
  const display = inserted ? snapshot(74, origin + reply.insert.length, 9, 105) : live;
  drawBuffer(ctx, api, {
    live: display,
    line: updated,
    ghost: painted && !inserted ? reply.insert : '',
    below: '',
    ticks: inserted || painted ? [] : [origin, line.indexOf('#')],
    mode: inserted ? 'After Tab' : 'Editor',
  });
  if (!s.submitted) {
    const journey = [origin];
    if (after('cc-fresh-move15')) journey.push(line.indexOf('#'));
    if (after('cc-fresh-return12')) journey.push(origin);
    api.focus.target('editor-buffer', () =>
      text(ctx, api, 'Caret path    ' + journey.join(' → '), 1764, 465, 34, api.C.yellow, 'right'),
    );
  }
  const arrived = s.submitted ? painted : after('cursor-arrival');
  drawSnapshots(
    ctx,
    api,
    (arrived ? 'Reply ' : 'Request ') + reply.captured.epoch,
    reply.captured,
    live,
    inserted ? 'At Tab' : 'Editor now',
  );
  let message = 'Reply in flight';
  if (arrived) message = 'Can reply 101 paint here?';
  if (s.denied && !fresh(old, live)) message = 'Reply 101 discarded';
  if (s.submitted) message = 'Request 104 in flight';
  if (painted) message = 'Reply 104 showing';
  if (inserted) message = 'Reply 104 inserted at column ' + origin;
  drawOutcome(ctx, api, message, painted ? api.C.green : api.C.yellow);
}
export default {
  id: 'fresh-cursor',
  draw: drawFreshCursor,
  cues: [
    'cc-fresh-move15',
    'cc-fresh-return12',
    'cursor-arrival',
    'cc-fresh-deny',
    'cc-fresh-current-request',
    'cc-fresh-current-paint',
    'cursor-insert',
  ],
};
