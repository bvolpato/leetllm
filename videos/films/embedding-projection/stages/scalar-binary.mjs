import {
  chapterBox,
  chapterCueComplete,
  chapterCueVisible,
  chapterFooter,
  chapterLine,
  chapterMatrix,
  chapterText,
} from '../defaults.mjs';
export function drawScalarBinary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const values = [-1, -0.3, 0.4, 1],
      codes = values.map((x) => Math.round(127 * x));
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'Document-calibrated symmetric scale = 127',
        960,
        285,
        35,
        themeColors.ink,
      );
      values.forEach((v, i) => {
        const x = 340 + i * 420;
        chapterBox(ctx, api, v.toFixed(1), x - 150, 395, 300, 100, themeColors.blue);
        if (chapterCueVisible(ctx, api, 'quantize-code')) {
          chapterBox(ctx, api, String(codes[i]), x - 150, 585, 300, 100, themeColors.yellow);
          chapterBox(
            ctx,
            api,
            (codes[i] / 127).toFixed(3),
            x - 150,
            775,
            300,
            100,
            themeColors.cyan,
          );
        }
      });
      chapterText(
        ctx,
        api,
        'float → round / clip code → reconstructed value',
        960,
        960,
        32,
        themeColors.muted,
      );
    } else if (currentBeat === 1) {
      chapterText(ctx, api, 'Sign bits discard magnitude', 960, 285, 35, themeColors.ink);
      chapterMatrix(
        ctx,
        api,
        [values.map((x) => (x > 0 ? 1 : 0)), [0, 1, 0, 1]],
        520,
        390,
        200,
        130,
        themeColors.yellow,
      );
      if (chapterCueVisible(ctx, api, 'binary-xor'))
        chapterText(ctx, api, 'XOR = [0, 1, 1, 0] · popcount = 2', 960, 745, 36, themeColors.cyan);
      if (chapterCueComplete(ctx, api, 'codec-bytes'))
        chapterText(
          ctx,
          api,
          '256 coordinates: float 1,024 B · int8 256 B · bits 32 B',
          960,
          905,
          35,
          themeColors.green,
        );
    } else {
      chapterText(
        ctx,
        api,
        'Explicit candidate generation and rescoring',
        960,
        285,
        35,
        themeColors.ink,
      );
      chapterBox(ctx, api, 'limit 100', 200, 420, 450, 130, themeColors.blue);
      chapterBox(ctx, api, 'oversample 2.4', 750, 420, 450, 130, themeColors.yellow);
      if (chapterCueComplete(ctx, api, 'oversample'))
        chapterBox(ctx, api, '240 candidates', 1300, 420, 450, 130, themeColors.cyan);
      chapterLine(ctx, api, 670, 485, 730, 485, themeColors.line);
      chapterLine(ctx, api, 1220, 485, 1280, 485, themeColors.line);
      if (chapterCueVisible(ctx, api, 'turbo-rotation'))
        chapterBox(
          ctx,
          api,
          'Orthogonal rotation preserves distances\nlossy codes need recall measurement',
          250,
          690,
          1420,
          160,
          themeColors.yellow,
        );
      chapterText(
        ctx,
        api,
        'Qdrant settings and defaults depend on the pinned server/codec',
        960,
        960,
        31,
        themeColors.muted,
      );
    }
    chapterFooter(
      ctx,
      api,
      'Raw code bytes exclude calibration metadata, indexes and any full-vector rescore store',
    );
  }
  return;
}
export default {
  id: 'scalar-binary',
  draw: drawScalarBinary,
  cues: [
    'quantize-scale',
    'quantize-code',
    'quantize-reuse',
    'binary-sign',
    'binary-xor',
    'codec-bytes',
    'oversample',
    'turbo-rotation',
    'codec-pin',
  ],
};
