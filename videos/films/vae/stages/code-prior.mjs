import { clamped, cueAmount } from '../arithmetic.mjs';
import { arrow, bar, chapterText, note } from '../defaults.mjs';
export function drawCodePrior(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamped(state.beatP ?? 0),
    q = cueAmount(state, 'vae-code-prior-' + currentBeat + '-build', progress);
  {
    if (currentBeat === 1) {
      const ids = [0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1],
        n = Math.min(ids.length, Math.floor(q * ids.length)),
        counts = [0, 1, 2].map((id) => ids.slice(0, n).filter((v) => v === id).length);
      chapterText(
        ctx,
        api,
        'Supplied code-usage worksheet · ' + n + ' / 12 admitted',
        960,
        300,
        34,
        themeColors.ink,
        'center',
      );
      ids.forEach((id, i) => {
        const xx = 200 + i * 125;
        api.rect(
          ctx,
          xx,
          390,
          80,
          70,
          themeColors.panel,
          i < n ? themeColors.cyan : themeColors.muted,
          2,
          3,
        );
        chapterText(
          ctx,
          api,
          String(id),
          xx + 40,
          438,
          31,
          i < n ? themeColors.cyan : themeColors.muted,
          'center',
        );
      });
      counts.forEach((count, i) => {
        const xx = 430 + i * 500;
        bar(
          ctx,
          api,
          xx,
          800 - count * 36,
          140,
          count * 36,
          i === 2 ? themeColors.pink : themeColors.cyan,
        );
        chapterText(ctx, api, 'entry ' + i, xx + 70, 870, 31, themeColors.ink, 'center');
        chapterText(
          ctx,
          api,
          String(count),
          xx + 70,
          800 - count * 36 - 25,
          34,
          i === 2 ? themeColors.pink : themeColors.cyan,
          'center',
        );
      });
      note(
        ctx,
        api,
        'Entry 2 is unused in this supplied sequence; usage counts and the codebook update rule answer separate questions.',
      );
      return;
    }
    chapterText(
      ctx,
      api,
      'Separate learned prior over code combinations',
      960,
      300,
      34,
      themeColors.ink,
      'center',
    );
    const rows = [
        [0, 1, 0, 1],
        [1, 0, 1, 0],
        [0, 0, 0, 1],
      ],
      colors = [themeColors.cyan, themeColors.green, themeColors.pink];
    rows.forEach((row, i) => {
      chapterText(
        ctx,
        api,
        i === 2 ? 'independent supplied IDs' : 'supplied pattern ' + (i + 1),
        220,
        470 + i * 150,
        30,
        colors[i],
      );
      row.forEach((v, j) => {
        const x = 780 + j * 190,
          y = 420 + i * 150;
        api.rect(ctx, x, y, 90, 80, themeColors.panel, colors[i], 2, 5);
        chapterText(ctx, api, String(v), x + 45, y + 54, 36, colors[i], 'center');
        if (j < 3 && i < 2 && q > (j + 1) / 5)
          arrow(ctx, api, x + 105, y + 40, x + 165, y + 40, colors[i]);
      });
    });
    note(
      ctx,
      api,
      currentBeat === 0
        ? 'Uniform training prior: constant log K · later autoregressive prior learns dependencies, not arbitrary independent IDs.'
        : 'Original codebook + commitment losses shown; moving-average updates are a separate choice.',
    );
  }
}
export default {
  id: 'code-prior',
  draw: drawCodePrior,
  cues: ['vae-code-prior-0-build', 'vae-code-prior-1-build'],
};
