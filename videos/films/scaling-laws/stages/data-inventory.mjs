import { spoken } from '../cue.mjs';
import { scalingEvent } from '../construction.mjs';
import { band, dot, line, rectangle, text } from '../defaults.mjs';
export function drawDataInventory(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = scalingEvent(scene, state),
    end = progress === 1;
  const result = (caption) => {
    if (end) text(ctx, api, caption, 960, 960, 36, themeColors.green, 'center');
  };
  api.focus.target('sl-data-inventory-construction', () => {
    band(
      ctx,
      api,
      currentBeat === 0
        ? 'Each label represents one trillion unique source positions'
        : 'Usable data for the planned run',
    );
    if (currentBeat === 0) {
      const disjoint = spoken(scene, state, 'disjoint-data').phase !== 'before';
      for (let j = 0; j < 15; j++) {
        rectangle(ctx, api, 270 + j * 94, 350, 72, 70, themeColors.blue, themeColors.blue);
        text(ctx, api, 'S' + (j + 1), 306 + j * 94, 395, 23, themeColors.bg, 'center');
      }
      const completed = Math.floor(progress * 4);
      for (let i = 0; i < 4; i++) {
        text(ctx, api, 'Run ' + (i + 1), 160, 530 + i * 83, 29, themeColors.ink);
        for (let j = 0; j < 15; j++) {
          rectangle(
            ctx,
            api,
            270 + j * 94,
            490 + i * 83,
            72,
            55,
            i < completed ? themeColors.cyan : themeColors.panel,
            themeColors.muted,
          );
          if (i < completed)
            text(
              ctx,
              api,
              'S' + (j + 1 + (disjoint ? i * 15 : 0)),
              306 + j * 94,
              527 + i * 83,
              23,
              themeColors.bg,
              'center',
            );
        }
      }
      result(
        disjoint
          ? '60T presentations   ·   60T distinct positions across four corpora'
          : '60T presentations   ·   15T distinct positions in a shared corpus',
      );
    } else if (currentBeat === 1) {
      const start = 300,
        endX = 1570;
      line(ctx, api, start, 630, endX, 630, themeColors.muted, 4);
      for (let year = 2024; year <= 2032; year++) {
        const x = start + ((year - 2024) / 8) * (endX - start);
        line(ctx, api, x, 620, x, 645, themeColors.muted);
        text(ctx, api, year, x, 700, 28, themeColors.muted, 'center');
      }
      rectangle(
        ctx,
        api,
        start + (2 / 8) * 1270,
        470,
        (6 / 8) * 1270 * progress,
        95,
        themeColors.panel,
        themeColors.cyan,
      );
      text(
        ctx,
        api,
        'June 2024 forecast: intersection during 2026–2032',
        960,
        385,
        33,
        themeColors.ink,
        'center',
      );
      if (end) {
        dot(ctx, api, start + (4 / 8) * 1270, 630, themeColors.yellow, 13);
        text(ctx, api, 'Scenario median 2028', 960, 800, 36, themeColors.yellow, 'center');
        text(
          ctx,
          api,
          'Effective projected stock ≈ 400T · not a current inventory',
          960,
          890,
          30,
          themeColors.muted,
          'center',
        );
      }
    } else {
      const labels = ['Rights/access', 'Filter yield', 'Distribution', 'Useful repeats'];
      labels.forEach((s, i) => {
        const x = 260 + i * 420;
        rectangle(
          ctx,
          api,
          x,
          390,
          300,
          280,
          themeColors.panel,
          [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink][i],
        );
        for (let j = 0; j < 12; j++) {
          const kept = j < Math.floor((1 - 0.13 * i) * 12);
          rectangle(
            ctx,
            api,
            x + 24 + (j % 4) * 65,
            430 + Math.floor(j / 4) * 58,
            48,
            35,
            kept ? themeColors.cyan : themeColors.panel,
            themeColors.muted,
          );
        }
        text(ctx, api, s, x + 150, 750, 31, themeColors.ink, 'center');
      });
      text(
        ctx,
        api,
        'Sardana: 47 models · 150M–6B · largest ratios only at smallest scale',
        960,
        855,
        31,
        themeColors.muted,
        'center',
      );
      result('A fresh-data surface needs new evidence before repeats count the same');
    }
  });
}
export default {
  id: 'data-inventory',
  draw: drawDataInventory,
  cues: ['sl-data-inventory-0', 'sl-data-inventory-1', 'sl-data-inventory-2', 'disjoint-data'],
};
