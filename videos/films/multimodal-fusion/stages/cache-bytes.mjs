import { clamp } from '../arithmetic.mjs';
import {
  drawExpandedBox,
  drawExpandedCells,
  drawExpandedFooter,
  text as drawExpandedText,
} from '../defaults.mjs';
export function drawCacheBytes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cueProgress = (cue, fallback = progress) =>
    state.cues ? api.focus.progress(cue, fallback) : fallback;
  const full = cueProgress('mm-cache-bytes-' + currentBeat),
    u = api.phase(full, 0.08, 0.82),
    done = (cue) => (state.cues ? cueProgress(cue, 0) >= 1 - 1e-8 : progress >= 0.95);
  api.focus.target('mm-cache-bytes-construction', () => {
    if (currentBeat === 0) {
      const factors = [
          ['K + V', 2],
          ['Layers', 32],
          ['KV heads', 8],
          ['Head width', 128],
          ['Bytes', 2],
        ],
        visible = Math.min(5, Math.floor(u * 6));
      factors.forEach(([n, v], i) => {
        const x = 130 + i * 340;
        drawExpandedText(ctx, api, n, x + 145, 390, 30, themeColors.muted, 'center');
        drawExpandedBox(
          ctx,
          api,
          x,
          445,
          290,
          150,
          i < visible ? themeColors.cyan : themeColors.muted,
        );
        drawExpandedText(
          ctx,
          api,
          i < visible ? String(v) : '?',
          x + 145,
          545,
          48,
          i < visible ? themeColors.cyan : themeColors.muted,
          'center',
        );
        if (i < 4) drawExpandedText(ctx, api, '×', x + 315, 540, 40, themeColors.yellow, 'center');
      });
      if (done('mm-per-token-bytes')) {
        drawExpandedText(
          ctx,
          api,
          '131,072 bytes = 128 KiB / token',
          960,
          790,
          43,
          themeColors.green,
          'center',
        );
      } else
        drawExpandedText(
          ctx,
          api,
          'Multiply the declared cache dimensions',
          960,
          790,
          34,
          themeColors.muted,
          'center',
        );
      drawExpandedFooter(
        ctx,
        api,
        'Hypothetical cache recipe · a decoder choice, not a universal token size.',
      );
    } else if (currentBeat === 1) {
      const directDone = done('mm-visual-direct'),
        reducedDone = done('mm-visual-reduced'),
        fullDone = done('mm-full-reservation'),
        scale = 3.8;
      [
        ['Direct visual', 360, themeColors.blue, directDone, 370],
        ['Reduced visual', 20, themeColors.cyan, reducedDone, 570],
        ['Full reservation', 332.5, themeColors.green, fullDone, 770],
      ].forEach(([name, value, col, ready, y]) => {
        drawExpandedText(ctx, api, name, 170, y - 30, 30, col);
        api.rect(ctx, 170, y, Math.max(1, value * scale * (ready ? 1 : 0)), 65, col, undefined, 0);
        drawExpandedText(
          ctx,
          api,
          ready ? value + ' MiB' : 'waiting for complete bill',
          1675,
          y + 42,
          29,
          ready ? col : themeColors.muted,
          'right',
        );
      });
      drawExpandedFooter(
        ctx,
        api,
        fullDone
          ? '2,660 total positions include the answer reserve.'
          : reducedDone
            ? '360 MiB − 20 MiB = 340 MiB saved per request'
            : 'Compare the visual tokens at 128 KiB per position.',
      );
    } else {
      drawExpandedText(
        ctx,
        api,
        'Expert work changes · the admitted visual prefix remains',
        960,
        285,
        32,
        themeColors.ink,
        'center',
      );
      for (let i = 0; i < 8; i++) {
        const x = 170 + i * 195;
        drawExpandedBox(
          ctx,
          api,
          x,
          400,
          150,
          160,
          i === Math.floor(u * 8) || i === (Math.floor(u * 8) + 1) % 8
            ? themeColors.green
            : themeColors.muted,
        );
        drawExpandedText(
          ctx,
          api,
          'E' + (i + 1),
          x + 75,
          495,
          34,
          i === Math.floor(u * 8) ? themeColors.green : themeColors.muted,
          'center',
        );
      }
      drawExpandedCells(ctx, api, 180, 720, 40, 4, 38, themeColors.blue, 160);
      drawExpandedText(
        ctx,
        api,
        '160 visual KV positions stay resident in this logical view',
        960,
        950,
        31,
        themeColors.blue,
        'center',
      );
      drawExpandedFooter(
        ctx,
        api,
        'Physical allocation also depends on sharing, blocks, precision, sequence count and runtime policy.',
      );
    }
  });
}
export default {
  id: 'cache-bytes',
  draw: drawCacheBytes,
  cues: [
    'mm-cache-bytes-0',
    'mm-per-token-bytes',
    'mm-cache-bytes-1',
    'mm-visual-direct',
    'mm-visual-reduced',
    'mm-full-reservation',
    'mm-cache-bytes-2',
  ],
};
