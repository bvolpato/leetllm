import { clamp } from './arithmetic.mjs';
import { drawCard, drawText, withFocus } from './defaults.mjs';

const rowY = (id) => 332 + id * 143;
const slotY = (slot) => 389 + slot * 209;

export function drawDeskQuery(ctx, api, words, version, { target, reveal = 1 } = {}) {
  const { C } = api;
  drawText(ctx, api, 'Search for', 126, 247, 32, C.ink);
  words.forEach((word, i) => {
    const visible = reveal * words.length >= i + 1;
    const paint = () =>
      drawCard(
        ctx,
        api,
        visible ? word : '…',
        308 + i * 240,
        192,
        212,
        76,
        visible ? C.cyan : C.muted,
        1,
        36,
      );
    if (target) withFocus(ctx, api, target(word), paint);
    else paint();
  });
  drawText(ctx, api, 'Support notes  /  v' + version, 126, 311, 27, C.muted);
}

export function drawLock(ctx, api, x, y, allowed) {
  const { C } = api;
  const color = allowed ? C.green : C.pink;
  const shackle = [
    { x: x + 7, y: y + 2 },
    { x: x + 7, y: y - 15 },
    { x: x + (allowed ? 1 : 13), y: y - 22 },
    { x: x + (allowed ? -9 : 23), y: y - 22 },
    { x: x + (allowed ? -15 : 29), y: y - 15 },
    { x: x + (allowed ? -15 : 29), y: allowed ? y - 8 : y + 2 },
  ];
  api.path(ctx, shackle, { color, width: 4 });
  api.rect(ctx, x, y + 2, 35, 26, C.panel, color, 4);
}

// Keep the original note on the desk while its ID travels into a selection slot.
export function drawDeskNote(
  ctx,
  api,
  row,
  { highlights, score, offset = 0, opacity = 1, target, selected = false },
) {
  const { C } = api;
  const y = rowY(row.id) + offset;
  ctx.save();
  ctx.globalAlpha *= opacity;
  api.rect(ctx, 125, y, 1010, 123, C.panel, selected ? C.green : C.muted, 10);
  drawText(ctx, api, 'M' + row.id, 156, y + 70, 39, C.ink, 'left', 'mono');
  const lines = selected ? [] : row.text.match(/[^.!?]+[.!?]?/g).map((line) => line.trim());
  if (selected) drawText(ctx, api, row.text, 248, y + 70, 26, C.ink);
  lines.forEach((line, i) => {
    let x = 305;
    const baseline = y + (lines.length > 1 ? 50 : 70) + i * 38;
    ctx.font = '500 30px "Lesson Sans"';
    for (const piece of line.split(/(\b(?:charged|twice|sign)\b)/gi).filter(Boolean)) {
      const word = piece.toLowerCase();
      const active = highlights[word];
      const paint = () => drawText(ctx, api, piece, x, baseline, 30, active ? C.yellow : C.ink);
      if (target && Object.hasOwn(highlights, word))
        withFocus(ctx, api, target(row.id, word), paint);
      else paint();
      x += ctx.measureText(piece).width;
    }
  });
  if (score !== undefined) drawText(ctx, api, '+' + score, 1094, y + 71, 36, C.cyan, 'right');
  ctx.restore();
}

export function drawReaderSlots(ctx, api, label, numbered = true) {
  const { C } = api;
  drawText(ctx, api, label, 1320, 311, 31, C.ink);
  for (let slot = 0; slot < 2; slot++) {
    const y = slotY(slot);
    if (numbered) drawText(ctx, api, String(slot + 1), 1785, y + 62, 29, C.muted, 'right', 'mono');
    api.line(ctx, 1320, y + 143, 1787, y + 143, C.muted, 3);
  }
}

export function drawReaderSlip(ctx, api, row, slot, travel) {
  if (travel <= 0) return;
  const { C } = api;
  const sourceY = rowY(row.id) + 34;
  const destY = slotY(slot) + 17;
  const point = api.pointAlongPath(
    [
      { x: 1148, y: sourceY },
      { x: 1174, y: sourceY },
      { x: 1174, y: destY },
      { x: 1345, y: destY },
    ],
    travel,
  );
  ctx.save();
  ctx.globalAlpha *= clamp(travel * 12);
  drawCard(
    ctx,
    api,
    'M' + row.id,
    point.x,
    point.y,
    132,
    62,
    travel === 1 ? C.green : C.yellow,
    1,
    32,
  );
  if (travel === 1) drawText(ctx, api, row.short, 1345, destY + 96, 28, C.ink);
  ctx.restore();
}
