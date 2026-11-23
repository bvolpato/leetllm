import {
  drawExtensionBar,
  drawExtensionLine,
  drawExtensionNote,
  drawExtensionText,
} from '../defaults.mjs';
export function drawPqCode(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = (id) => api.focus.progress(id),
    cueVisible = (id) => api.focus.visible(id),
    resultComplete = (id) => progress(id) === 1;
  api.focus.target('pq-code-construction', () => {
    if (currentBeat === 0) {
      drawExtensionText(
        ctx,
        api,
        'Dimension D = 1536 · M = 96 subspaces',
        150,
        280,
        34,
        themeColors.cyan,
      );
      for (let i = 0; i < 24; i++) {
        const x = 170 + (i % 12) * 135,
          y = 395 + Math.floor(i / 12) * 210;
        api.rect(
          ctx,
          x,
          y,
          115,
          135,
          themeColors.panel,
          i < 12 ? themeColors.blue : themeColors.green,
          0,
        );
        drawExtensionText(
          ctx,
          api,
          'm' + (i + 1),
          x + 57,
          y - 18,
          23,
          i < 12 ? themeColors.blue : themeColors.green,
          'center',
        );
        if (cueVisible('pq-split'))
          for (let j = 0; j < 4; j++)
            drawExtensionLine(
              ctx,
              api,
              x + 15,
              y + 25 + j * 25,
              x + 100,
              y + 25 + j * 25,
              i < 12 ? themeColors.blue : themeColors.green,
              2,
            );
      }
      drawExtensionText(
        ctx,
        api,
        'First 24 illustrated subspaces; remaining 72 continue',
        960,
        850,
        29,
        themeColors.muted,
        'center',
      );
      if (cueVisible('pq-index'))
        drawExtensionText(
          ctx,
          api,
          'Each subspace → one codeword index',
          960,
          930,
          35,
          themeColors.yellow,
          'center',
        );
      if (resultComplete('pq-choices'))
        drawExtensionNote(
          ctx,
          api,
          '8 bits/index → 256 choices/subspace; 16 coordinates per subspace in this 1536/96 example.',
        );
    } else if (currentBeat === 1) {
      const original = [1.1, 0.9, -0.8, -1.2],
        rounded = [1, 1, -1, -1],
        t = progress('pq-codewords');
      drawExtensionText(
        ctx,
        api,
        'Supplied two-subspace example · four coordinates',
        150,
        280,
        33,
        themeColors.cyan,
      );
      original.forEach((value, i) => {
        const x = 310 + i * 420,
          shown = value + (rounded[i] - value) * t;
        drawExtensionLine(ctx, api, x, 410, x, 790, themeColors.muted, 2);
        drawExtensionLine(ctx, api, x - 90, 600, x + 90, 600, themeColors.muted);
        const endpoint = 600 - shown * 140;
        api.rect(
          ctx,
          x - 32,
          Math.min(600, endpoint),
          64,
          Math.abs(endpoint - 600),
          i < 2 ? themeColors.blue : themeColors.green,
          undefined,
          0,
        );
        drawExtensionText(
          ctx,
          api,
          shown.toFixed(2),
          x + 100,
          endpoint + (shown >= 0 ? -25 : 45),
          32,
          i < 2 ? themeColors.blue : themeColors.green,
          'center',
        );
        drawExtensionText(ctx, api, 'raw ' + value, x, 870, 28, themeColors.muted, 'center');
      });
      api.rect(ctx, 170, 355, 700, 560, null, themeColors.blue, 0);
      api.rect(ctx, 970, 355, 780, 560, null, themeColors.green, 0);
      if (resultComplete('pq-error'))
        drawExtensionText(
          ctx,
          api,
          'Squared reconstruction error = 0.10',
          960,
          970,
          36,
          themeColors.yellow,
          'center',
        );
    } else {
      drawExtensionText(
        ctx,
        api,
        'Per-vector payload only · same D=1536',
        150,
        280,
        34,
        themeColors.cyan,
      );
      drawExtensionBar(ctx, api, 170, 420, 1500, 100, 6144, 6144, themeColors.blue);
      drawExtensionText(ctx, api, 'float32 · 6144 bytes', 170, 385, 32, themeColors.blue);
      if (cueVisible('pq-code-bytes')) {
        drawExtensionBar(
          ctx,
          api,
          170,
          690,
          1500,
          100,
          96 * progress('pq-code-bytes'),
          6144,
          themeColors.green,
        );
        if (resultComplete('pq-code-bytes'))
          drawExtensionText(ctx, api, 'PQ · 96 bytes', 170, 850, 32, themeColors.green);
      }
      if (resultComplete('pq-saving'))
        drawExtensionText(
          ctx,
          api,
          '98.44% smaller vector payload',
          960,
          950,
          39,
          themeColors.green,
          'center',
        );
      drawExtensionNote(
        ctx,
        api,
        'IDs, codebooks, links and retained originals still consume memory. Short bar is drawn to the same scale.',
      );
    }
  });
  return true;
}
export default {
  id: 'pq-code',
  draw: drawPqCode,
  cues: [
    'pq-split',
    'pq-index',
    'pq-choices',
    'pq-original',
    'pq-codewords',
    'pq-error',
    'pq-code-bytes',
    'pq-float-bytes',
    'pq-saving',
  ],
};
