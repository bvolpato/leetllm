import { beatCue } from '../arithmetic.mjs';
import { center, lower, pixels } from '../fixtures.mjs';
import { z } from '../model.mjs';
import { chapterGrid, line, point, text } from '../defaults.mjs';

const cutoff = 0.9;
const cornerNames = ['top left', 'top right', 'bottom left', 'bottom right'];
const xAt = (value) => 310 + ((value - 0.8) / 0.2) * 510;
const crop = { x: 1050, y: 232, size: 128 };
const badgeSize = 250;
const badgeCenter = { x: crop.x + 2 * crop.size, y: crop.y + 2 * crop.size };

function badgeCells(ctx, api, x, y, size) {
  return [0, 1].flatMap((row) => {
    const values = center.slice(2 * row, 2 * row + 2).map((i) => pixels[i]);
    return chapterGrid(ctx, api, values, x, y + row * size, size);
  });
}

function notification(ctx, api) {
  const { C } = api;
  api.rect(ctx, 165, 294, 535, 535, C.panel, C.muted, 100);
  point(ctx, api, 427, 437, C.ink, 22);
  point(ctx, api, 427, 685, C.ink, 36);
  const dome = Array.from({ length: 33 }, (_, i) => {
    const angle = Math.PI + (Math.PI * i) / 32;
    return { x: 427 + 106 * Math.cos(angle), y: 559 + 116 * Math.sin(angle) };
  });
  api.path(
    ctx,
    [...dome, { x: 541, y: 626 }, { x: 575, y: 675 }, { x: 279, y: 675 }, { x: 313, y: 626 }],
    { fill: C.ink, color: C.ink, closed: true, width: 9 },
  );
  const badge = { x: 548, y: 340, size: 49 };
  const edge = badge.x + 2 * badge.size;
  const left = badgeCenter.x - badgeSize;
  line(ctx, api, edge, badge.y, left, badgeCenter.y - badgeSize, C.cyan, 2);
  line(ctx, api, edge, badge.y + 2 * badge.size, left, badgeCenter.y + badgeSize, C.cyan, 2);
  api.rect(ctx, badge.x - 6, badge.y - 6, 105, 105, C.bg, C.cyan, 6);
  badgeCells(ctx, api, badge.x, badge.y, badge.size);
}

function brightnessRuler(ctx, api, pooling, code) {
  const { C } = api;
  text(ctx, api, 'Badge brightness', 505, 259, 38, C.ink, 'center');
  [0.8, cutoff, 1].forEach((tick) =>
    text(ctx, api, tick.toFixed(2), xAt(tick), 344, 30, C.muted, 'center'),
  );
  line(ctx, api, xAt(cutoff), 365, xAt(cutoff), 740, C.pink, 4);
  center.forEach((index, row) => {
    const y = 407 + row * 97;
    const value = pixels[index];
    line(ctx, api, xAt(0.8), y, xAt(1), y, C.muted, 2);
    text(ctx, api, cornerNames[row], 273, y + 11, 31, C.ink, 'right');
    point(ctx, api, xAt(value), y, value > cutoff ? C.pink : C.cyan, 12);
    if (pooling > 0) {
      const x = xAt(value + pooling * (z[0] - value));
      line(ctx, api, xAt(value), y, x, y, C.yellow, 4);
      point(ctx, api, x, y, C.yellow, 9);
    }
  });
  if (pooling === 1) text(ctx, api, 'Center average   ' + z[0], 505, 827, 38, C.yellow, 'center');
  if (code === 1)
    text(
      ctx,
      api,
      'To the decoder   [ ' + z[0] + ',  ' + z[1].toFixed(2) + ' ]',
      505,
      916,
      38,
      C.yellow,
      'center',
    );
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const answered = beatCue(state, 1, 'badge-answer', 0, 0.16) === 1;
  const pooling = beatCue(state, 2, 'pool-center', 0.08, 0.4);
  const lowerMask = beatCue(state, 2, 'pool-lower', 0.4, 0.62);
  const code = beatCue(state, 2, 'badge-code', 0.63, 0.74);
  if (!answered) notification(ctx, api);
  api.focus.target('badge-crop', () => {
    const size = badgeSize + (crop.size - badgeSize) * pooling;
    const cells =
      pooling === 1
        ? chapterGrid(ctx, api, pixels, crop.x, crop.y, crop.size)
        : badgeCells(ctx, api, badgeCenter.x - size, badgeCenter.y - size, size);
    for (const index of [...center, ...(lowerMask > 0 ? lower : [])]) {
      const cell = cells[pooling === 1 ? index : center.indexOf(index)];
      if (!cell) continue;
      const isLower = lower.includes(index);
      const hit = answered && pixels[index] > cutoff;
      const color = isLower ? C.yellow : hit ? C.pink : C.cyan;
      const right = cell.x + cell.width;
      const bottom = cell.y + cell.height;
      api.path(
        ctx,
        [
          { x: cell.x + 4, y: cell.y + 4 },
          { x: right - 4, y: cell.y + 4 },
          { x: right - 4, y: bottom - 4 },
          { x: cell.x + 4, y: bottom - 4 },
        ],
        { color, width: hit ? 9 : 3, closed: true },
      );
      const font = size * 0.34;
      text(
        ctx,
        api,
        pixels[index].toFixed(2),
        cell.x + cell.width / 2,
        cell.y + cell.height / 2 + font * 0.34,
        font,
        isLower ? C.ink : C.bg,
        'center',
      );
    }
  });
  if (answered) api.focus.target('badge-ruler', () => brightnessRuler(ctx, api, pooling, code));
  api.focus.target('badge-rule', () => {
    const x = badgeCenter.x + pooling * (crop.size / 2);
    text(ctx, api, 'Flag above ' + cutoff.toFixed(2), x, 850 + pooling * 93, 46, C.pink, 'center');
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'badge-readings',
    'badge-cutoff',
    'badge-answer',
    'pool-center',
    'pool-lower',
    'badge-code',
  ],
};
