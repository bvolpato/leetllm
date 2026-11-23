import { fresh } from '../model.mjs';
import {
  member,
  memberReply,
  snapshot,
  acceptEdit,
  drawBuffer,
  drawOutcome,
  drawSnapshots,
} from '../editor.mjs';

export function drawAcceptanceRace(ctx, scene, state, api) {
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const beat = state.beat ?? 0;
  let live = memberReply.captured;
  let reply = memberReply;
  let line = member;
  let message = 'Tab is ready';
  if ((beat === 1 || beat === 2) && after('tab-policy')) {
    live = snapshot(42, member.length, 8, 43);
    message = 'What will Tab insert?';
  }
  if (beat === 3 && after('tab-type')) {
    const typed = 'all';
    line += typed;
    live = snapshot(43, line.length, 7, 43);
    message = 'New start for the remaining letters?';
    if (after('tab-rebase') && reply.insert.startsWith(typed)) {
      reply = { captured: live, insert: reply.insert.slice(typed.length) };
      message = 'Rebased remainder at column ' + live.cursor;
    }
  }
  const pressed = (beat === 0 && after('tab-apply')) || (beat === 2 && after('tab-empty'));
  let display = live;
  let ghost = fresh(reply.captured, live) ? reply.insert : '';
  if (pressed) {
    const applied = acceptEdit(line, reply, live);
    if (applied !== line)
      display = snapshot(
        live.version + 1,
        live.cursor + reply.insert.length,
        live.policy,
        live.epoch + 1,
      );
    message = applied.length - line.length + ' characters inserted';
    line = applied;
    ghost = '';
  }
  drawBuffer(ctx, api, { live: display, line, ghost, mode: pressed ? 'After Tab' : 'Editor' });
  drawSnapshots(
    ctx,
    api,
    beat === 3 && after('tab-rebase') ? 'Rebased span' : 'Captured span',
    reply.captured,
    live,
    pressed ? 'At Tab' : 'Editor now',
  );
  drawOutcome(ctx, api, message, pressed ? api.C.ink : api.C.yellow);
}
export default {
  id: 'acceptance-race',
  draw: drawAcceptanceRace,
  cues: ['tab-apply', 'tab-policy', 'tab-empty', 'tab-type', 'tab-rebase'],
};
