import { fresh } from '../model.mjs';
import { text } from '../defaults.mjs';
import { member, memberReply, snapshot, acceptEdit, drawBuffer, drawOutcome } from '../editor.mjs';

export function drawSynthesis(ctx, scene, state, api) {
  const { C } = api;
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const atPaint = snapshot(42, member.length, 7, 42);
  const shown = after('close-show') && fresh(memberReply.captured, atPaint);
  const accepted = shown && after('close-tab');
  const applied = accepted ? acceptEdit(member, memberReply, atPaint) : member;
  const inserted = applied.length - member.length;
  const undone = accepted && after('close-undo');
  const line = undone ? member : applied;
  const changes = Number(accepted) + Number(undone);
  const live = snapshot(42 + changes, line.length, 7, 42 + changes);
  drawBuffer(ctx, api, { live, line, ghost: shown && !accepted ? memberReply.insert : '' });
  api.focus.target('edit-counts', () => {
    const rows = [
      ['Suggestions shown', Number(shown)],
      ['Suggestions accepted', Number(accepted)],
      ['Characters inserted', inserted],
      [
        'Characters retained',
        after('close-zero') ? line.length - member.length : after('close-window') ? '?' : '…',
      ],
    ];
    rows.forEach(([label, value], i) => {
      const x = 310 + 432 * i;
      text(ctx, api, label, x, 663, 32, C.muted, 'center');
      text(ctx, api, value, x, 788, 80, i === 3 ? C.yellow : C.ink, 'center');
    });
  });
  drawOutcome(
    ctx,
    api,
    after('close-zero')
      ? 'Undo removed exactly the accepted call'
      : after('close-window')
        ? 'How many of the inserted characters remain?'
        : undone
          ? 'Undo'
          : accepted
            ? 'Tab'
            : shown
              ? 'Fresh span painted'
              : 'Waiting for a suggestion',
  );
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['close-show', 'close-tab', 'close-undo', 'close-window', 'close-zero'],
};
