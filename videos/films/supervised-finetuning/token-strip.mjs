import { paddingLabels } from './model.mjs';
import { TOKENS } from './fixtures.mjs';
import { text, upgradeBox } from './defaults.mjs';

export const tokenX = (i) => 220 + 210 * i;
export function inputStrip(ctx, api, { y = 375, count = TOKENS.length, mark = -1 } = {}) {
  text(ctx, api, 'Model input  ·  symbolic positions', 130, y - 88, 30, api.C.blue);
  TOKENS.forEach((word, i) => {
    if (i >= count) return;
    const x = tokenX(i);
    text(ctx, api, String(i), x, y - 20, 26, api.C.muted, 'center');
    upgradeBox(ctx, api, word, x - 94, y, 188, 86, i === mark ? api.C.yellow : api.C.blue, 32);
  });
}

export function labelStrip(ctx, api, labels, y = 635, name = 'Loss labels') {
  text(ctx, api, name, 131, y + 128, 28, api.C.muted);
  labels.forEach((word, i) => {
    const ignored = word === '−100';
    upgradeBox(
      ctx,
      api,
      word,
      tokenX(i) - 94,
      y,
      188,
      80,
      ignored ? api.C.muted : i >= 5 ? api.C.green : api.C.blue,
      31,
    );
  });
}

export function predictionArrow(ctx, api, target, top = 475, bottom = 619, color = api.C.yellow) {
  api.arrow(ctx, tokenX(target - 1), top, tokenX(target), bottom, color, 5);
}

export function paddingExample(ctx, api, mode) {
  const { C } = api;
  const cells = ['ASSIST', 'open', 'ticket', 'END', 'PAD', 'PAD'];
  const ids = [43, 7, 8, 2, 2, 2];
  const labels = paddingLabels(mode !== 'by-id');
  const count = labels.filter((v) => v !== -100).length;
  const x = (i) => 465 + 245 * i;
  api.focus.target('pad-row', () => {
    text(ctx, api, 'End of the real reply', x(1) + 125, 305, 34, C.ink, 'center');
    text(ctx, api, 'Right padding', x(4) + 122, 305, 34, C.muted, 'center');
    api.line(ctx, x(3) + 121, 320, x(3) + 121, 780, C.yellow, 3);
    text(ctx, api, 'Input', 120, 441, 31, C.blue);
    text(ctx, api, 'Token ID', 120, 554, 31, C.muted);
    cells.forEach((cell, i) => {
      upgradeBox(ctx, api, cell, x(i) - 104, 380, 208, 89, i >= 4 ? C.muted : C.blue);
      text(ctx, api, String(ids[i]), x(i), 554, 41, C.ink, 'center');
    });
  });
  api.focus.target('pad-labels', () => {
    text(ctx, api, 'Loss label', 120, 706, 31, C.muted);
    ids.forEach((id, i) => {
      const unresolved = mode === 'inspect' && i >= 3;
      const active = labels[i] !== -100;
      const label = unresolved ? '?' : active ? String(id) : '−100';
      const color = unresolved ? C.yellow : active ? C.green : i === 3 ? C.pink : C.muted;
      upgradeBox(ctx, api, label, x(i) - 104, 643, 208, 90, color, 34);
    });
    const note =
      mode === 'inspect'
        ? 'Which position with ID 2 should be scored?'
        : mode === 'by-id'
          ? 'Mask every ID 2  ·  ' + count + ' scored targets'
          : 'Padding by position  ·  ' + count + ' scored targets';
    text(ctx, api, note, 960, 910, 41, mode === 'by-id' ? C.pink : C.ink, 'center');
  });
}
