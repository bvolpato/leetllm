import { fresh } from '../model.mjs';
import { code } from '../defaults.mjs';
import {
  member,
  memberReply,
  oldReply,
  drawBuffer,
  drawOutcome,
  drawSnapshots,
} from '../editor.mjs';

export function drawFreshness(ctx, scene, state, api) {
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const live = memberReply.captured;
  const painted = after('fresh-paint') && fresh(memberReply.captured, live) ? memberReply : null;
  const incoming = after('fresh-older') ? oldReply : memberReply;
  const ghost = fresh(incoming.captured, live) && after('fresh-paint') ? incoming : painted;
  drawBuffer(ctx, api, {
    live,
    line: member,
    ghost: ghost?.insert,
    mode: ghost ? 'Showing reply 42' : 'Editor',
  });
  api.focus.target('editor-snapshots', () =>
    code(ctx, api, incoming.insert, 150, 633, 33, api.C.cyan),
  );
  drawSnapshots(ctx, api, 'Reply ' + incoming.captured.epoch, incoming.captured, live);
  let message = 'Can this reply paint?';
  if (painted) message = 'Gray text is a proposal';
  if (incoming === oldReply) message = 'Which suggestion should stay?';
  if (after('fresh-drop') && !fresh(incoming.captured, live))
    message = 'Reply 41 discarded   ·   Reply 42 still showing';
  drawOutcome(ctx, api, message, after('fresh-drop') ? api.C.green : api.C.yellow);
}
export default {
  id: 'freshness',
  draw: drawFreshness,
  cues: ['fresh-pair', 'fresh-paint', 'fresh-older', 'fresh-range', 'fresh-keep', 'fresh-drop'],
};
