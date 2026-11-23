import { scanSnapshot } from '../construction.mjs';
import { signalParticipation } from '../model.mjs';
import { chapterCueProgress, chapterText, constructionFocus, valueGrid } from '../defaults.mjs';
export function drawBorderCounts(ctx, scene, state, api) {
  ctx.save();

  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  constructionFocus(ctx, api, 'border-counts', () => {
    const centerP = chapterCueProgress(ctx, api, 'center-count'),
      paddingP = chapterCueProgress(ctx, api, 'padded-corner'),
      smallP = chapterCueProgress(ctx, api, 'small-crop-count');
    let size = 5,
      row = 0,
      col = 0,
      padding = 0;
    if (currentBeat === 0 && centerP > 0) {
      row = 2;
      col = 2;
    }
    if (currentBeat === 1) {
      padding = paddingP > 0 ? 1 : 0;
    }
    if (currentBeat === 2) {
      padding = 1;
    }
    const f = signalParticipation(size, row, col, padding),
      progress =
        currentBeat === 0
          ? centerP > 0
            ? centerP
            : chapterCueProgress(ctx, api, 'corner-count')
          : currentBeat === 1
            ? paddingP
            : 1,
      count = Math.floor(progress * f.result.length * f.result[0].length),
      source = padding
        ? scanSnapshot(
            f.image,
            Array.from(
              {
                length: 3,
              },
              () => [1, 1, 1],
            ),
            progress,
            {
              padding: 1,
            },
          ).input
        : f.image;
    chapterText(
      ctx,
      api,
      size + ' × ' + size + ' input · unit signal · all-ones kernel',
      650,
      290,
      30,
      themeColors.blue,
      'center',
    );
    valueGrid(ctx, api, source, 250, 340, padding ? 66 : 88, {
      kind: 'image',
      active: (row + padding) * source.length + col + padding,
    });
    const values = f.result.map((r, a) =>
      r.map((v, d) => (a * f.result[0].length + d < count ? v : '?')),
    );
    valueGrid(ctx, api, values, 1250, 350, padding ? 78 : 120, {
      font: 30,
    });
    chapterText(
      ctx,
      api,
      'sum of the complete response map',
      1460,
      830,
      29,
      themeColors.muted,
      'center',
    );
    if (progress === 1) chapterText(ctx, api, f.count, 1460, 920, 55, themeColors.green, 'center');
    if (currentBeat === 1 && smallP > 0) {
      const s = signalParticipation(4, 1, 1);
      chapterText(
        ctx,
        api,
        'separate 4 × 4 crop · maximum count ' + s.count,
        700,
        970,
        29,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 2)
      chapterText(
        ctx,
        api,
        'Four windows now include the corner pixel',
        960,
        1015,
        32,
        themeColors.yellow,
        'center',
      );
    return;
  });

  ctx.restore();
}
export default {
  id: 'border-counts',
  draw: drawBorderCounts,
  cues: [
    'border-counts-b1',
    'corner-count',
    'center-count',
    'border-counts-b2',
    'padded-corner',
    'small-crop-count',
    'border-counts-b3',
  ],
};
