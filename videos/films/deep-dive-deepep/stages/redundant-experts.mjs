import { chapterModel, completed } from '../construction.mjs';
import { drawChapterBox, drawChapterTarget, drawChapterText } from '../defaults.mjs';
export function drawRedundantExperts(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('redundant-experts', state),
    currentBeat = m.b,
    progress2 = m.p;
  const done = (cue, fallback = false) => completed(state, cue, fallback);
  const progress = Math.max(0, Math.min(1, (progress2 - 0.07) / 0.65)),
    step = (n) => Math.min(n, Math.floor(progress * (n + 1)));
  drawChapterTarget(ctx, api, 'de-redundant-experts-mechanism', () => {
    drawChapterText(
      ctx,
      api,
      'Supplied local domain · identical redundancy map on every participant',
      960,
      275,
      32,
      themeColors.yellow,
      'center',
    );
    [0, 1, 2, 3].forEach((rank, i) => {
      const x = 200 + i * 420;
      drawChapterBox(
        ctx,
        api,
        'Rank ' + rank,
        x,
        380,
        370,
        i === 3 ? themeColors.muted : themeColors.blue,
        105,
      );
      drawChapterText(
        ctx,
        api,
        i === 3 ? 'No useful assignment' : 'Map participant',
        x + 185,
        555,
        27,
        i === 3 ? themeColors.muted : themeColors.cyan,
        'center',
      );
      api.circle(ctx, x + 185, 650, 16, i < step(4) ? themeColors.green : themeColors.muted);
    });
    if (currentBeat)
      drawChapterTarget(ctx, api, 'de-redundant-gradient-result', () => {
        drawChapterText(
          ctx,
          api,
          'Original gradients [2, 4] + extra [1, 3]',
          960,
          795,
          34,
          themeColors.blue,
          'center',
        );
        drawChapterText(
          ctx,
          api,
          done('de-redundant-add')
            ? 'Accumulated owner gradients [3, 7]'
            : 'Owner accumulation pending',
          960,
          915,
          38,
          done('de-redundant-add') ? themeColors.green : themeColors.muted,
          'center',
        );
      });
    else
      drawChapterText(
        ctx,
        api,
        'Prefetch weights and matching scales before the expert consumer',
        960,
        900,
        32,
        themeColors.yellow,
        'center',
      );
  });
}
export default {
  id: 'redundant-experts',
  draw: drawRedundantExperts,
  cues: ['de-redundant-experts-b0', 'de-redundant-experts-b1', 'de-redundant-add'],
};
