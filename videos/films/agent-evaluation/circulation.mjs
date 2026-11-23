import { readHoldSnapshot, verifyHold } from './model.mjs';

export const river = Object.freeze({
  reader: 'Lena',
  book: 'B7',
  title: 'River Stories',
  start: 2,
  first: 17,
});
export const garden = Object.freeze({
  reader: 'Mira',
  book: 'B9',
  title: 'The Night Garden',
  start: 7,
  first: 41,
});

// In this library fixture a repeated operation key returns its first receipt.
export function runHolds(task, keys) {
  const receipts = new Map();
  const holds = [];
  const attempts = [];
  for (const key of keys) {
    let receipt = receipts.get(key);
    const replay = receipt !== undefined;
    if (!replay) {
      const id = 'hold-' + (task.first + holds.length);
      holds.push({ id, reader: task.reader, book: task.book, operation: key });
      receipt = {
        operation: key,
        hold: id,
        reader: task.reader,
        book: task.book,
        version: task.start + holds.length,
      };
      receipts.set(key, receipt);
    }
    attempts.push({ receipt, replay });
  }
  const account = { version: task.start + holds.length, holds };
  const read = readHoldSnapshot(account, task.reader, task.book);
  const passed =
    attempts.length > 0 &&
    verifyHold(
      {
        authorized: true,
        attemptedForbidden: false,
        write: attempts[0].receipt,
        read,
      },
      task,
    );
  return { account, attempts, read, passed };
}

export const after = (state, id) => state.cues?.[id]?.phase === 'after';

const lineColor = '#4b6370';
const page = '#182831';
const cover = '#163b4c';

export function book(ctx, api, task, x, y) {
  const { C } = api;
  api.rect(ctx, x, y, 190, 246, cover, C.cyan, 8);
  api.line(ctx, x + 21, y + 7, x + 21, y + 238, C.cyan, 3);
  api.text(ctx, task.book, x + 105, y + 97, 54, C.ink, 'center', 'serif');
  api.line(ctx, x + 46, y + 126, x + 166, y + 126, C.cyan, 2);
  const title = task.book === 'B7' ? 'River\nStories' : 'The Night\nGarden';
  api.text(ctx, title, x + 106, y + 171, 28, C.ink, 'center', 'serif');
}

export function ledger(
  ctx,
  api,
  {
    x,
    y,
    w,
    task,
    account,
    heading = 'Library account',
    pending = 'Open holds',
    summary,
    accent,
    showKeys = false,
  },
) {
  const { C } = api;
  const left = x + 40,
    right = x + w - 40;
  api.rect(ctx, x + 8, y + 8, w, 400, '#101a21', lineColor, 7);
  api.rect(ctx, x, y, w, 400, page, lineColor, 7);
  api.text(ctx, heading, left, y + 55, 30, C.cyan);
  api.text(ctx, task.reader, left, y + 125, 57, C.ink, 'left', 'serif');
  if (account) api.text(ctx, 'version ' + account.version, right, y + 119, 31, C.ink, 'right');
  api.line(ctx, left, y + 150, right, y + 150, lineColor, 3);
  if (!account) {
    api.text(ctx, pending, x + w / 2, y + 265, 41, C.ink, 'center');
    return;
  }
  api.text(ctx, 'Hold record', left, y + 198, 26, C.muted);
  if (showKeys) api.text(ctx, 'Created by', x + w / 2, y + 198, 26, C.muted, 'center');
  api.text(ctx, 'Book', right, y + 198, 26, C.muted, 'right');
  for (let i = 0; i < 2; i++) {
    const baseline = y + 252 + 56 * i;
    const row = account.holds[i];
    if (row) {
      api.text(ctx, row.id, left, baseline, 37, C.ink);
      if (showKeys) api.text(ctx, row.operation, x + w / 2, baseline, 33, C.yellow, 'center');
      api.text(ctx, row.book, right, baseline, 37, C.ink, 'right');
    } else if (!account.holds.length && i === 0) {
      api.text(ctx, 'No entries', left, baseline, 34, C.muted);
    }
    api.line(ctx, left, baseline + 12, right, baseline + 12, lineColor, 2);
  }
  const matches = readHoldSnapshot(account, task.reader, task.book).count;
  api.text(ctx, summary ?? task.book + ' holds   ' + matches, left, y + 370, 34, accent ?? C.ink);
}

export function decision(ctx, api, text, color = api.C.ink) {
  api.text(ctx, text, 960, 936, 42, color, 'center');
}
