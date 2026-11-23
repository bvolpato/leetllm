import {
  drawExtensionBox,
  drawExtensionLine,
  drawExtensionNote,
  drawExtensionText,
} from '../defaults.mjs';
export function drawIndexComposition(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = (id) => api.focus.progress(id),
    cueVisible = (id) => api.focus.visible(id);
  api.focus.target('index-composition-construction', () => {
    const expanded = currentBeat > 0 || cueVisible('exhaustive-codes'),
      t = currentBeat > 0 ? 1 : progress('routing-compression');
    drawExtensionText(
      ctx,
      api,
      'Same q = 4.9 · routing and compression are separate operations',
      150,
      280,
      32,
      themeColors.cyan,
    );
    drawExtensionBox(ctx, api, 'C0 · generic_api at 0', 170, 365, 690, 85, themeColors.blue, 29);
    drawExtensionBox(
      ctx,
      api,
      'C1 · key_rotation at 5.1 / quota_page at 9',
      1020,
      365,
      720,
      85,
      expanded ? themeColors.green : themeColors.muted,
      26,
    );
    drawExtensionText(
      ctx,
      api,
      'probe 1: nearest original is excluded',
      170,
      510,
      28,
      themeColors.pink,
    );
    if (expanded)
      drawExtensionText(
        ctx,
        api,
        'all lists open: routing miss repaired',
        1020,
        510,
        28,
        themeColors.green,
      );
    else drawExtensionText(ctx, api, 'unprobed', 1380, 510, 28, themeColors.pink, 'center');
    drawExtensionText(
      ctx,
      api,
      'Retain the earlier two-subspace vector · approximate its coordinates',
      170,
      605,
      29,
      themeColors.muted,
    );
    const raw = [1.1, 0.9, -0.8, -1.2],
      code = [1, 1, -1, -1];
    raw.forEach((v, i) => {
      const x = 265 + i * 420,
        y0 = 800,
        shown = v + (code[i] - v) * t,
        color = i < 2 ? themeColors.blue : themeColors.green;
      drawExtensionLine(ctx, api, x - 90, y0, x + 90, y0, themeColors.muted);
      drawExtensionLine(ctx, api, x, y0 - 130, x, y0 + 130, themeColors.muted);
      const original = y0 - v * 85,
        now = y0 - shown * 85;
      drawExtensionLine(ctx, api, x - 60, original, x + 60, original, themeColors.muted, 2);
      api.rect(ctx, x - 20, Math.min(y0, now), 40, Math.abs(now - y0), color, undefined, 0);
      drawExtensionText(ctx, api, 'raw ' + v, x, 665, 26, themeColors.muted, 'center');
      drawExtensionText(
        ctx,
        api,
        t === 1 ? 'code ' + shown.toFixed(1) : '→ ' + shown.toFixed(2),
        x + 105,
        now + (shown > 0 ? -20 : 35),
        26,
        color,
        'center',
      );
    });
    if (currentBeat === 0 && expanded)
      drawExtensionNote(
        ctx,
        api,
        'All lists are open; the retained PQ representatives still have squared error 0.10.',
      );
    if (currentBeat === 1) {
      drawExtensionText(
        ctx,
        api,
        'Retain centroids + codebooks + links + compatible versions',
        960,
        960,
        31,
        themeColors.cyan,
        'center',
      );
      if (cueVisible('index-migration'))
        drawExtensionNote(
          ctx,
          api,
          'Use the same corpus, encoder, normalization and metric when comparing index settings.',
        );
    }
  });
  return true;
}
export default {
  id: 'index-composition',
  draw: drawIndexComposition,
  cues: ['routing-compression', 'exhaustive-codes', 'index-lifecycle', 'index-migration'],
};
