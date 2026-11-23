import { onWords } from '../card-memory.mjs';
import {
  drawExpandedLine,
  drawExpandedText,
  drawExpandedTile,
  drawExpandedTitle,
} from '../defaults.mjs';
export function drawProfileContract(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      const second = onWords(state, api, 0, 'second-attempt', 0.45, 0.53);
      const phases = ['Initialize', 'Forward', 'Backward', 'Update'];
      const results = [[95], [57, 72, 88]];
      api.text(ctx, 'Required memory on one 80 GB card', 120, 266, 39, themeColors.ink);
      phases.forEach((name, i) => api.text(ctx, name, 600 + i * 330, 369, 34, themeColors.muted, 'center'));
      results.forEach((values, row) => {
        if (row === 1 && second === 0) return;
        const y = 505 + row * 246;
        api.focus.target(row ? 'attempt-two' : 'attempt-one', () => {
          api.text(ctx, 'Attempt ' + (row + 1), 150, y + 25, 38, themeColors.ink);
          phases.forEach((_, i) => {
            const x = 600 + i * 330;
            const gb = values[i];
            if (gb === undefined) {
              api.text(ctx, 'unreached', x, y + 27, 29, themeColors.muted, 'center');
              return;
            }
            const color = gb > 80 ? themeColors.pink : themeColors.blue;
            api.rect(ctx, x - 132, y - 54, 264, 140, themeColors.panel, color, 5);
            api.text(ctx, gb + ' GB', x, y + 14, 42, color, 'center');
            api.text(ctx, gb > 80 ? 'request failed' : 'fits', x, y + 63, 28, color, 'center');
          });
        });
      });
      const note = second === 0 ? 'Inspect parameter construction before sharding.'
        : 'Inspect the buffers that coexist in backward.';
      api.text(ctx, note, 960, 991, 38, themeColors.ink, 'center');
    }
    if (currentBeat === 1) {
      drawExpandedTitle(ctx, api, 'Which blocks do the ranks gather next?');
      const q = onWords(state, api, 1, 'mismatched-blocks', 0.18, 0.36),
        calls = [
          ['Gather 0', 'Forward 0', 'Gather 1'],
          ['Gather 0', 'Forward 0', 'Gather 2'],
        ];
      calls.forEach((row, r) => {
        drawExpandedText(ctx, api, 'Rank ' + r, 180, 460 + r * 250, 32, themeColors.muted);
        row.forEach((name, i) => {
          const x = 450 + i * 320;
          api.focus.target(i === 2 ? 'next-gathers' : 'earlier-calls', () => drawExpandedTile(
            ctx,
            api,
            i === 2 && q === 0 ? '?' : name,
            x,
            410 + r * 250,
            260,
            90,
            i === 2 && q > 0 ? themeColors.pink : themeColors.blue,
          ));
        });
      });
      if (q === 1) {
        drawExpandedLine(ctx, api, 1215, 510, 1215, 640, themeColors.pink, 5);
        drawExpandedText(
          ctx,
          api,
          'First mismatch: gather for block 1 versus block 2',
          960,
          925,
          39,
          themeColors.pink,
          'center',
        );
      }
      drawExpandedText(
        ctx,
        api,
        'Read first errors across ranks; dump-on-timeout also needs a positive trace buffer',
        960,
        1020,
        27,
        themeColors.muted,
        'center',
      );
    }
    if (currentBeat === 2) {
      drawExpandedTitle(ctx, api, 'One training step');
      const end = 9 * onWords(state, api, 2, 'trace-clock', 0.08, 0.25);
      const elapsed = onWords(state, api, 2, 'elapsed-step', 0.36, 0.43);
      const sum = onWords(state, api, 2, 'double-count', 0.46, 0.54);
      const x = 410, w = 140;
      const rows = [
        ['Data', 0, 1, themeColors.yellow],
        ['Compute', 1, 7, themeColors.blue],
        ['Collective', 2, 5, themeColors.pink],
        ['Checkpoint', 7, 9, themeColors.green],
      ];
      api.focus.target('step-clock', () => rows.forEach(([n, a, z, col], i) => {
        const y = 390 + i * 140;
        drawExpandedText(ctx, api, n, 180, y + 35, 29, col);
        if (end > a) api.rect(ctx, x + a * w, y, (Math.min(end, z) - a) * w, 65, col, undefined, 2);
      }));
      for (const tick of [0, 1, 2, 5, 7, 9])
        api.text(ctx, tick + ' ms', x + tick * w, 355, 27, themeColors.muted, 'center');
      api.focus.target('elapsed-time', () => {
        api.text(ctx, elapsed === 1 ? 'Elapsed   1 + 6 + 2 = 9 ms' : 'Elapsed time', 460, 992, 36, themeColors.ink);
        if (sum === 1) api.text(ctx, 'Sum of bars   9 + 3 = 12 ms', 1090, 992, 36, themeColors.pink);
      });
    }
    return;
  }
  return;
}
export default {
  id: 'profile-contract',
  draw: drawProfileContract,
  cues: ['second-attempt', 'mismatched-blocks', 'trace-clock', 'elapsed-step', 'double-count'],
};
