import { checkpointLayout } from './construction.mjs';
import { trackedColumn } from './fixtures.mjs';

const left = 370;
const pitch = 176;
const width = 158;
const savedY = 405;
const loadedY = 666;
const height = 92;

export function drawShardMap(
  ctx,
  api,
  { showNew, markColumn, late = false, copies, showMissing = false, followLastWeight = false },
) {
  const { C } = api;
  const row = checkpointLayout(late ? 2 : null);
  const columnX = (i) => left + pitch * i;
  const label = (s, x, y, size, color, align = 'center') =>
    api.text(ctx, s, x, y, size, color, align);
  function bracket(start, count, y, upper, name) {
    const a = columnX(start);
    const b = columnX(start + count - 1) + width;
    const tip = upper ? 11 : -11;
    api.line(ctx, a, y, b, y, C.blue, 3);
    for (const x of [a, b]) api.line(ctx, x, y, x, y + tip, C.blue, 3);
    label(name, (a + b) / 2, y + (upper ? -14 : 44), 30, C.blue);
  }

  label('Global column', 96, 266, 32, C.muted, 'left');
  label('Saved', 96, savedY + 58, 46, C.ink, 'left');
  api.focus.target('saved-ranges', () => {
    row.shards.forEach(({ offset }, i) => {
      bracket(offset, row.savedWidth, savedY - 22, true, 'rank ' + i);
    });
  });
  if (showNew) {
    api.focus.target('new-ranges', () => {
      label('Reloaded', 96, loadedY + 58, 46, C.ink, 'left');
      for (let r = 0; r < row.target.length; r++) {
        bracket(r * row.newWidth, row.newWidth, loadedY + height + 62, false, 'rank ' + r);
      }
    });
  }

  row.source.forEach((value, i) => {
    const x = columnX(i);
    const cx = x + width / 2;
    const selected = i === trackedColumn && markColumn;
    const present = row.reconstructed[i] !== null;
    const amount = copies[i];
    const copyY = savedY + (loadedY - savedY) * amount;
    const moving = amount > 0 && amount < 1;
    const savedHeight = moving ? Math.min(height, copyY - savedY) : height;
    const loadedTop = moving ? Math.max(loadedY, copyY + height) : loadedY;
    const edge = selected ? C.yellow : present ? C.blue : C.pink;
    const draw = () => {
      label(String(i), cx, 268, 39, selected ? C.yellow : C.muted);
      api.rect(ctx, x, savedY, width, savedHeight, C.panel, edge, 5);
      if (amount === 0 || copyY > savedY + height + 4) {
        label(present ? String(value) : '…', cx, savedY + 60, 46, selected ? C.yellow : C.ink);
      }
      if (!showNew) return;
      api.rect(
        ctx,
        x,
        loadedTop,
        width,
        loadedY + height - loadedTop,
        C.panel,
        !present && showMissing ? C.pink : C.muted,
        5,
      );
      label(String(i % row.newWidth), cx, loadedY + height + 42, 27, C.muted);
      if (amount > 0 && present) {
        const quiet = followLastWeight && !selected;
        const fill = selected ? C.yellow : quiet ? C.panel : C.blue;
        api.rect(ctx, x, copyY, width, height, fill, quiet ? C.blue : undefined, 5);
        label(String(value), cx, copyY + 60, 46, quiet ? C.muted : C.bg);
      }
    };
    if (i === trackedColumn) api.focus.target('tracked-weight', draw);
    else if (Math.floor(i / row.savedWidth) === 2) api.focus.target('missing-file', draw);
    else draw();
  });
  if (showNew) label('Local index', 96, loadedY + height + 42, 30, C.muted, 'left');
}

export function drawProbe(ctx, api, showResult) {
  const { source } = checkpointLayout();
  const weight = source[trackedColumn];
  api.focus.target('probe', () => {
    api.text(ctx, 'Only column 6 has a nonzero input', 130, 998, 34, api.C.muted);
    api.text(
      ctx,
      '2 × ' + weight + ' = ' + (showResult ? 2 * weight : '?'),
      1350,
      1000,
      52,
      api.C.yellow,
      'center',
    );
  });
}
