import {
  chapterBox,
  chapterCueComplete,
  chapterCueVisible,
  chapterFooter,
  chapterMatrix,
  chapterRectangle,
  chapterText,
} from '../defaults.mjs';
export function drawProductQuantization(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        '128 float32 coordinates → 8 block identifiers',
        960,
        285,
        35,
        themeColors.ink,
      );
      for (let i = 0; i < 8; i++) {
        const x = 230 + i * 190;
        chapterRectangle(ctx, api, x, 410, 150, 145, themeColors.panel, themeColors.cyan);
        chapterText(ctx, api, 'block ' + (i + 1), x + 75, 455, 25, themeColors.cyan);
        chapterText(ctx, api, '16 floats', x + 75, 515, 25, themeColors.muted);
        if (chapterCueVisible(ctx, api, 'pq-ids'))
          chapterBox(
            ctx,
            api,
            String([17, 2, 90, 8, 41, 13, 7, 0][i]),
            x,
            690,
            150,
            95,
            themeColors.yellow,
          );
      }
      if (chapterCueComplete(ctx, api, 'pq-storage'))
        chapterText(
          ctx,
          api,
          '512 raw bytes → 8 code bytes = 64×',
          960,
          890,
          38,
          themeColors.green,
        );
      if (chapterCueVisible(ctx, api, 'pq-shared'))
        chapterText(
          ctx,
          api,
          'Shared centroid coordinates: m × K × (d/m) = K × d',
          960,
          975,
          30,
          themeColors.cyan,
        );
    } else if (currentBeat === 1) {
      chapterText(ctx, api, 'Authored two-block asymmetric lookup', 960, 285, 35, themeColors.ink);
      chapterBox(ctx, api, 'query block 1 = [.2, .1]', 190, 370, 700, 100, themeColors.blue);
      chapterBox(ctx, api, 'query block 2 = [.9, .8]', 1030, 370, 700, 100, themeColors.blue);
      if (chapterCueVisible(ctx, api, 'pq-tables')) {
        chapterMatrix(
          ctx,
          api,
          [
            ['c0 [0,0]', '.050'],
            ['c1 [1,1]', '1.450'],
          ],
          230,
          540,
          300,
          110,
          themeColors.cyan,
        );
        chapterMatrix(
          ctx,
          api,
          [
            ['c0 [0,0]', '1.450'],
            ['c1 [1,1]', '.050'],
          ],
          1070,
          540,
          300,
          110,
          themeColors.cyan,
        );
      }
      if (chapterCueComplete(ctx, api, 'pq-lookup'))
        chapterText(
          ctx,
          api,
          'Stored code [0, 1] selects .050 + .050 = .100',
          960,
          865,
          35,
          themeColors.green,
        );
      if (chapterCueVisible(ctx, api, 'pq-table-bytes'))
        chapterText(
          ctx,
          api,
          '96 × 256 × 4 = 98,304 B = 96 KiB / query tables',
          960,
          965,
          32,
          themeColors.yellow,
        );
    } else {
      chapterBox(
        ctx,
        api,
        'ADC: unquantized query\nlookup squared distances',
        220,
        350,
        650,
        150,
        themeColors.cyan,
      );
      chapterBox(
        ctx,
        api,
        'SDC: also quantize query\nadditional approximation',
        1050,
        350,
        650,
        150,
        themeColors.yellow,
      );
      if (chapterCueVisible(ctx, api, 'pq-small')) {
        chapterBox(
          ctx,
          api,
          'Executed 40-row toy\n16 B → 2 B codes',
          220,
          660,
          650,
          150,
          themeColors.green,
        );
        chapterBox(
          ctx,
          api,
          'Shared codebooks: 64 B\n4 centroids could be bit-packed',
          1050,
          660,
          650,
          150,
          themeColors.cyan,
        );
      }
      chapterText(
        ctx,
        api,
        'Reconstructed PQ vectors need not be unit length; L2 is not automatically cosine',
        960,
        940,
        29,
        themeColors.pink,
      );
    }
    chapterFooter(
      ctx,
      api,
      'Shared codebooks, query lookup tables and per-vector codes are distinct ledgers',
    );
  }
  return;
}
export default {
  id: 'product-quantization',
  draw: drawProductQuantization,
  cues: [
    'pq-books',
    'pq-ids',
    'pq-storage',
    'pq-shared',
    'pq-tables',
    'pq-lookup',
    'pq-table-bytes',
    'pq-query-code',
    'pq-small',
    'pq-metric',
  ],
};
