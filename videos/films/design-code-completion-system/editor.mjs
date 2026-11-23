import { code, text } from './defaults.mjs';
import { fresh } from './model.mjs';

export const assignment = '    is_allowed = ';
export const member = assignment + 'graph.';
export const call = 'allows(request)';
export const closingLine = '    return is_allowed';

// Columns in these examples are zero-based offsets on a single ASCII line.
export function snapshot(version, cursor, policy, epoch, document = 'scope.py') {
  return {
    document,
    version,
    cursor,
    selection: { start: cursor, end: cursor },
    policy,
    epoch,
  };
}

export const oldReply = {
  captured: snapshot(41, assignment.length, 7, 41),
  insert: 'graph.' + call,
};
export const memberReply = { captured: snapshot(42, member.length, 7, 42), insert: call };

export function acceptEdit(line, reply, live) {
  if (!reply || !fresh(reply.captured, live)) return line;
  const { start, end } = live.selection;
  return line.slice(0, start) + reply.insert + line.slice(end);
}

function width(ctx, value, size) {
  ctx.save();
  ctx.font = `500 ${size}px "Lesson Mono"`;
  const advance = ctx.measureText(value).width;
  ctx.restore();
  return advance;
}

export function drawBuffer(
  ctx,
  api,
  { live, line, ghost = '', below = closingLine, ticks = [], mode = 'Editor', maxSize = 50 },
) {
  const { C } = api;
  api.focus.target('editor-buffer', () => {
    api.rect(ctx, 100, 215, 1720, 322, C.panel, C.muted, 2, 12);
    text(ctx, api, live.document, 151, 277, 34, C.ink);
    text(
      ctx,
      api,
      `${mode}   ·   v${live.version}   ·   column ${live.cursor}`,
      1764,
      277,
      32,
      C.muted,
      'right',
    );
    const x = 148,
      y = 385;
    const prefix = line.slice(0, live.cursor);
    const tail = line.slice(live.cursor);
    const size = Math.min(
      maxSize,
      Math.floor((maxSize * 1600) / Math.max(1600, width(ctx, prefix + ghost + tail, maxSize))),
    );
    const caretX = x + width(ctx, prefix, size);
    code(ctx, api, prefix, x, y, size);
    if (ghost) code(ctx, api, ghost, caretX + 5, y, size, C.muted);
    if (tail) code(ctx, api, tail, caretX + width(ctx, ghost, size) + 5, y, size);
    api.line(ctx, caretX + 1, y - size, caretX + 1, y + 8, C.yellow, 3);
    for (const offset of ticks) {
      const tickX = x + width(ctx, line.slice(0, offset), size);
      const color = offset === live.cursor ? C.yellow : C.muted;
      api.line(ctx, tickX, 409, tickX, 423, color, 2);
      text(ctx, api, String(offset), tickX, 465, 32, color, 'center');
    }
    if (below) code(ctx, api, below, x, 482, size, C.muted);
  });
}

export function drawSnapshots(ctx, api, label, captured, live, liveLabel = 'Editor now') {
  const { C } = api;
  const columns = [
    { x: 692, name: 'Version', get: (s) => s.version },
    { x: 1010, name: 'Range', get: (s) => `[${s.selection.start}, ${s.selection.end}]` },
    { x: 1328, name: 'Policy', get: (s) => s.policy },
    { x: 1652, name: 'Request epoch', get: (s) => s.epoch },
  ];
  api.focus.target('editor-snapshots', () => {
    for (const col of columns) {
      text(ctx, api, col.name, col.x, 632, 30, C.muted, 'center');
      text(ctx, api, col.get(captured), col.x, 725, 42, C.cyan, 'center');
      text(ctx, api, col.get(live), col.x, 815, 42, C.ink, 'center');
    }
    text(ctx, api, label, 150, 725, 39, C.cyan);
    text(ctx, api, liveLabel, 150, 815, 39, C.ink);
    api.line(ctx, 130, 658, 1790, 658, C.muted, 2);
  });
}

export function drawOutcome(ctx, api, message, color = api.C.yellow) {
  api.focus.target('editor-outcome', () => text(ctx, api, message, 960, 965, 43, color, 'center'));
}
