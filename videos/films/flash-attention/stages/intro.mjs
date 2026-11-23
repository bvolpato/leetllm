import { SCORES } from '../fixtures.mjs';
import { words, rowClock } from '../row-workspace.mjs';

function drawSlots(ctx, api, clock) {
  const { C } = api;
  const saved = clock.done('save-pair');
  const progress = clock.progress('reuse-slot');
  const landed = clock.done('reuse-slot');
  const slotX = [210, 580];
  const width = 330;
  api.focus.target('score-slots', () => {
    api.text(ctx, 'Query: test', 210, 295, 60, C.ink);
    api.text(ctx, 'On-chip score slots', 210, 420, 42, C.muted);
    for (const [i, x] of slotX.entries()) {
      const occupied = !saved || (i === 1 && landed);
      api.rect(ctx, x, 460, width, 245, occupied ? C.blue : C.panel, C.blue, 12);
      if (occupied) {
        const key = landed ? 2 : i;
        api.text(ctx, words[key], x + width / 2, 540, 50, C.bg, 'center');
        api.text(ctx, SCORES[key], x + width / 2, 659, 104, C.bg, 'center');
      } else if (i === 0 || progress === 0) {
        api.text(ctx, 'free', x + width / 2, 607, 46, C.muted, 'center');
      }
    }
  });
  api.focus.target('waiting-key', () => {
    api.text(ctx, landed ? 'Keys scored' : 'Next key', 1470, 420, 42, C.muted, 'center');
    if (landed) {
      api.text(ctx, '3 of 3', 1470, 607, 74, C.yellow, 'center');
    } else {
      if (!saved) api.arrow(ctx, 1290, 582, 990, 582, C.yellow, 5);
      const x = 1470 + (slotX[1] + width / 2 - 1470) * progress;
      api.rect(ctx, x - 135, 519, 270, 124, C.yellow, undefined, 62);
      api.text(ctx, words[2], x, 601, 61, C.bg, 'center');
    }
  });
  if (clock.started('save-pair'))
    api.focus.target('saved-pair', () => {
      api.line(ctx, 210, 789, 910, 789, C.cyan, 4);
      api.text(ctx, 'Row summary', 210, 862, 42, C.cyan);
      const keys = clock.done('complete-row')
        ? 'Includes fix, this and test'
        : 'Includes fix and this';
      api.text(ctx, keys, 210, 932, 49, C.ink);
    });
}

function drawGrid(ctx, api, clock) {
  const { C } = api;
  const extended = clock.started('extend-prompt');
  const filled = clock.done('square-result');
  const n = extended ? 6 : 3;
  const step = 94,
    x = 286,
    y = 341;
  const labels = [...words, 'and', 'run', 'it'];
  const activeRow = clock.started('allowed-pairs') ? -1 : clock.started('read-fix') ? 0 : 2;
  api.focus.target('score-grid', () => {
    api.text(ctx, 'Key', x, y - 110, 36, C.muted);
    api.text(ctx, 'Query', 108, y - 43, 36, C.muted);
    for (let i = 0; i < n; i++) {
      api.text(ctx, labels[i], x + (i + 0.5) * step, y - 23, 38, C.ink, 'center');
      api.text(ctx, labels[i], x - 24, y + (i + 0.64) * step, 38, C.ink, 'right');
      for (let j = 0; j < n; j++) {
        if (!filled && (i >= 3 || j >= 3)) continue;
        const allowed = j <= i;
        api.rect(
          ctx,
          x + j * step + 2,
          y + i * step + 2,
          step - 5,
          step - 5,
          allowed ? (i === activeRow ? C.yellow : C.blue) : C.panel,
          allowed ? undefined : C.muted,
          5,
        );
      }
    }
    if (extended) {
      const side = step * n;
      api.path(
        ctx,
        [
          { x: x + side, y },
          { x: x + side, y: y + side },
          { x, y: y + side },
        ],
        { color: C.muted, width: 3 },
      );
      if (clock.started('four-copies')) {
        api.line(ctx, x + step * 3, y, x + step * 3, y + side, C.ink, 4);
        api.line(ctx, x, y + step * 3, x + side, y + step * 3, C.ink, 4);
      }
    }
  });
  api.focus.target('grid-count', () => {
    api.text(ctx, 'Full score array', 1020, 410, 48, C.ink);
    api.text(
      ctx,
      extended && !filled ? '6 × 6 = ? slots' : n + ' × ' + n + ' = ' + n * n + ' slots',
      1020,
      525,
      72,
      C.ink,
    );
    if (clock.started('four-copies')) api.text(ctx, '4 blocks × 9 slots', 1020, 635, 46, C.ink);
    if ((!extended && clock.done('allowed-pairs')) || clock.done('larger-triangle'))
      api.text(ctx, (n * (n + 1)) / 2 + ' allowed pairs', 1020, 742, 48, C.blue);
  });
}

export function drawIntro(ctx, scene, state, api) {
  const clock = rowClock(scene, state);
  if (state.beat < 2) {
    if (state.beat === 0) ctx.globalAlpha = 1;
    drawSlots(ctx, api, clock);
    return;
  }
  drawGrid(ctx, api, clock);
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'full-slots',
    'waiting',
    'save-pair',
    'reuse-slot',
    'complete-row',
    'read-test',
    'read-fix',
    'allowed-pairs',
    'extend-prompt',
    'square-result',
    'four-copies',
    'larger-triangle',
  ],
};
