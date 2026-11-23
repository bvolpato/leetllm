import { assignment, member, oldReply, memberReply } from '../editor.mjs';
import { text, code } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const scratch = after('intro-join');
  const dropped = after('intro-drop');
  const size = 60;
  const lineX = 140;
  const old = oldReply.captured;
  const live = memberReply.captured;
  ctx.save();
  if (state.t < 0.35) ctx.globalAlpha = 1;
  ctx.font = lessonFont(size, 'mono');
  const oldX = lineX + ctx.measureText(assignment).width;
  const liveX = lineX + ctx.measureText(member).width;
  const replyWidth = ctx.measureText(oldReply.insert).width;
  api.focus.target('editor-buffer', () => {
    api.rect(ctx, 100, 215, 1720, 317, C.panel, C.muted, 2, 12);
    text(ctx, api, live.document, 143, 285, 36);
    text(ctx, api, 'Editor   ·   v' + live.version, 1765, 285, 34, C.muted, 'right');
    code(ctx, api, assignment, lineX, 409, size);
    code(ctx, api, member.slice(old.cursor), oldX, 409, size, C.yellow);
    api.line(ctx, liveX + 2, 348, liveX + 2, 420, C.yellow, 4);
    text(ctx, api, 'column ' + live.cursor, liveX, 488, 30, C.yellow, 'center');
  });
  api.focus.target('intro-packet', () => {
    if (scratch) {
      text(ctx, api, 'Scratch line', 145, 650, 34, C.muted);
      const x = 145;
      const prefix = member.trimStart();
      ctx.font = lessonFont(54, 'mono');
      const insertX = x + ctx.measureText(prefix).width;
      code(ctx, api, prefix, x, 768, 54);
      code(ctx, api, oldReply.insert, insertX, 768, 54, C.pink);
      return;
    }
    // Bring the reply up to the column where its request started.
    const remaining = (1 - Math.min(1, state.t / 1.5)) ** 2;
    const x = oldX + 155 * remaining;
    const y = 635 + 130 * remaining;
    api.line(ctx, oldX, 427, oldX, 557, C.cyan, 3);
    api.line(ctx, oldX, 557, x, y, C.cyan, 3);
    api.rect(ctx, x - 25, y, replyWidth + 50, 168, C.panel, C.cyan, 3, 12);
    text(
      ctx,
      api,
      'Reply to v' + old.version + '   ·   column ' + old.cursor,
      x,
      y + 47,
      30,
      C.cyan,
    );
    code(ctx, api, oldReply.insert, x, y + 128, size, C.cyan);
  });
  if (dropped) text(ctx, api, 'Discard reply ' + old.epoch, 960, 940, 44, C.pink, 'center');
  ctx.restore();
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-return', 'intro-paste', 'intro-join', 'intro-drop'],
};
