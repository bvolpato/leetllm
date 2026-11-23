import { TOKENS } from './fixtures.mjs';
import { clamp } from './construction.mjs';
import { instructionT as text } from './defaults.mjs';

// Both tracks use the same centers, including the gaps between speakers.
const widths = [94, 106, 70, 90, 120, 88, 98, 72, 130, 108, 92, 111, 88, 100, 70, 150, 120];
const turns = [
  [0, 5, 'User'],
  [5, 10, 'Assistant'],
  [10, 12, 'User'],
  [12, 17, 'Assistant'],
];
let left = (1920 - widths.reduce((sum, width) => sum + width, 0)) / 2;
export const pieces = TOKENS.map((token, i) => {
  const width = widths[i];
  const piece = { token, x: left + width / 2, left, right: left + width };
  left += width;
  return piece;
});

export function inputStrip(ctx, api) {
  const { C } = api;
  for (const [start, end, speaker] of turns) {
    const x = pieces[start].left + 4;
    const color = speaker === 'User' ? C.blue : C.cyan;
    text(ctx, api, speaker, x, 245, 31, color);
    api.line(ctx, x, 263, pieces[end - 1].right - 6, 263, color, 3);
  }
  for (const [i, { token, x }] of pieces.entries()) {
    text(ctx, api, token, x, 340, token.startsWith('<') ? 29 : 34, C.ink, 'center');
    text(ctx, api, i, x, 393, 26, C.muted, 'center');
  }
}

export function inputPass(ctx, api, progress) {
  const { C } = api;
  const first = pieces[0].left + 4;
  const last = pieces.at(-1).right - 6;
  let received = 0;
  api.line(ctx, first, 467, last, 467, C.muted, 2);
  for (const [i, { x }] of pieces.entries()) {
    const travel = clamp(progress * pieces.length - i);
    if (travel > 0) api.line(ctx, x, 412, x, 412 + 55 * travel, C.cyan, 3);
    if (travel === 1) received++;
  }
  if (received) api.line(ctx, first, 467, pieces[received - 1].right - 6, 467, C.cyan, 5);
  text(ctx, api, 'Model input', first, 521, 32, C.cyan);
  text(ctx, api, received + ' / ' + pieces.length + ' tokens', last, 521, 32, C.cyan, 'right');
}

export function prefixBracket(ctx, api, last, progress, y) {
  if (progress <= 0) return;
  const start = pieces[0].left + 6;
  const end = pieces[last].x;
  const tip = end + (start - end) * progress;
  api.line(ctx, end, y - 16, end, y, api.C.yellow, 4);
  api.line(ctx, end, y, tip, y, api.C.yellow, 4);
  if (progress === 1) api.line(ctx, tip, y, tip, y - 16, api.C.yellow, 4);
}
