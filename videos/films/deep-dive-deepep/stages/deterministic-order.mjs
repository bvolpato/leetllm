import { chapterModel } from '../construction.mjs';
import {
  drawChapterBox,
  drawChapterLine,
  drawChapterTarget,
  drawChapterText,
} from '../defaults.mjs';
export function drawDeterministicOrder(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('deterministic-order', state),
    currentBeat = m.b,
    progress2 = m.p;
  const progress = Math.max(0, Math.min(1, (progress2 - 0.07) / 0.65));
  drawChapterTarget(ctx, api, 'de-deterministic-order-mechanism', () => {
    const rows = [
        {
          id: 'a',
          value: 10,
          slot: 0,
        },
        {
          id: 'b',
          value: 20,
          slot: 1,
        },
        {
          id: 'c',
          value: 30,
          slot: 2,
        },
        {
          id: 'd',
          value: 40,
          slot: 3,
        },
      ],
      arrival = [2, 0, 3, 1];
    drawChapterText(
      ctx,
      api,
      currentBeat
        ? 'Expanded segments update source slot pointers'
        : 'Sort value and identity together',
      960,
      280,
      36,
      themeColors.yellow,
      'center',
    );
    drawChapterText(
      ctx,
      api,
      'Arrival rows retain value + source identity',
      490,
      355,
      26,
      themeColors.muted,
      'center',
    );
    drawChapterText(
      ctx,
      api,
      'Source-global sorted slots',
      1400,
      355,
      26,
      themeColors.muted,
      'center',
    );
    arrival.forEach((index, order) => {
      const row = rows[index];
      drawChapterBox(
        ctx,
        api,
        row.id + ' · value ' + row.value,
        200,
        400 + order * 125,
        580,
        index % 2 ? themeColors.pink : themeColors.blue,
        82,
      );
    });
    const count = currentBeat ? 4 : Math.floor(progress * 4),
      active = currentBeat ? -1 : Math.min(3, count),
      travel = (progress * 4) % 1;
    rows.forEach((row, i) => {
      const y = 400 + i * 125,
        settled = i < count;
      drawChapterBox(
        ctx,
        api,
        settled ? 'slot ' + i + ' ← ' + row.id + ' · ' + row.value : 'slot ' + i + ' · pending',
        1110,
        y,
        620,
        settled ? themeColors.cyan : themeColors.muted,
        82,
      );
      if (i === active) {
        const sy = 441 + arrival.indexOf(i) * 125;
        drawChapterLine(ctx, api, 790, sy, 1090, y + 41, themeColors.muted);
        api.circle(
          ctx,
          790 + 300 * travel,
          sy + (y + 41 - sy) * travel,
          9,
          i % 2 ? themeColors.pink : themeColors.blue,
        );
      }
    });
    drawChapterText(
      ctx,
      api,
      currentBeat
        ? 'Metadata table stays in its own representation; pointers change'
        : 'A values-only permutation breaks these source links',
      960,
      1000,
      30,
      themeColors.yellow,
      'center',
    );
  });
}
export default {
  id: 'deterministic-order',
  draw: drawDeterministicOrder,
  cues: ['de-deterministic-order-b0', 'de-deterministic-order-b1'],
};
