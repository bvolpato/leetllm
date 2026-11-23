import { spoken } from '../cue.mjs';
import { line, text } from '../defaults.mjs';

const columns = 5;
const rows = 20;
const budget = columns * rows;
const cell = 31;
const left = 410;
const top = 225;

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const move = spoken(scene, state, 'intro-slide');
  const answered = spoken(scene, state, 'intro-answer').phase === 'after';
  const doubling = spoken(scene, state, 'intro-width').phase !== 'before';
  const settled = move.phase === 'after';
  const half = rows / 2;
  const dx = columns * cell * api.phase(move.progress, 0, 0.48);
  const dy = half * cell * api.phase(move.progress, 0.48, 1);
  const dock = api.clamp(state.t / 1.35);
  const lastRowOffset = 185 * (1 - dock) ** 2;

  ctx.save();
  if (state.t < 0.35) ctx.globalAlpha = 1;
  api.focus.target('budget-sheet', () => {
    if (lastRowOffset > 0) {
      for (let col = 0; col < columns; col++) {
        api.rect(
          ctx,
          left + col * cell + 2,
          top + (rows - 1) * cell + 2,
          cell - 4,
          cell - 4,
          C.panel,
          C.muted,
          3,
        );
      }
    }
    for (let row = 0; row < rows; row++) {
      const last = row === rows - 1;
      const movingHalf = row < half && move.phase !== 'before';
      const x = left + (last ? lastRowOffset : movingHalf ? dx : 0);
      const y = top + row * cell + (movingHalf ? dy : 0);
      const color = last && !doubling ? C.yellow : movingHalf ? C.cyan : C.blue;
      for (let col = 0; col < columns; col++) {
        api.rect(ctx, x + col * cell + 2, y + 2, cell - 4, cell - 4, color, undefined, 3);
      }
      if (last && !doubling) {
        text(ctx, api, '1 token unit', x + columns * cell + 24, y + 25, 31, C.yellow);
      }
    }
    if (move.phase !== 'during') {
      const height = settled ? half : rows;
      const width = budget / height;
      const bottom = top + rows * cell;
      const bracket = left - 20;
      const y = bottom - height * cell;
      line(ctx, api, bracket, y, bracket, bottom, C.muted, 2);
      line(ctx, api, bracket, y, bracket + 10, y, C.muted, 2);
      line(ctx, api, bracket, bottom, bracket + 10, bottom, C.muted, 2);
      text(
        ctx,
        api,
        height + ' token units',
        bracket - 20,
        (y + bottom) / 2 + 12,
        38,
        C.ink,
        'right',
      );
      text(
        ctx,
        api,
        width + ' weight units',
        left + (width * cell) / 2,
        bottom + 68,
        37,
        C.blue,
        'center',
      );
    }
  });
  api.focus.target('budget-account', () => {
    const ledger = 990;
    text(ctx, api, 'Training budget', ledger, 300, 41, C.muted);
    text(ctx, api, budget, ledger - 4, 461, 156, C.ink);
    text(ctx, api, 'squares', ledger + 300, 458, 49, C.ink);
    line(ctx, api, ledger, 515, 1760, 515, C.muted, 2);
    text(ctx, api, 'Model weights × training tokens', ledger, 601, 39, C.muted);
    text(ctx, api, columns + ' × ' + rows, ledger, 703, 73, C.blue);
    text(ctx, api, 'Starting run', ledger + 352, 692, 38, C.ink);
    text(ctx, api, 2 * columns + ' × ' + (answered ? half : '?'), ledger, 827, 73, C.cyan);
    text(ctx, api, 'Twice the weights', ledger + 352, 816, 38, C.ink);
  });
  ctx.restore();
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-count', 'intro-width', 'intro-answer', 'intro-slide'],
};
