import { clamp } from '../arithmetic.mjs';
import {
  drawExtendedArrow,
  drawExtendedNote,
  drawExtendedText,
  drawExtendedTitle,
  withTransformerExtendedFrame,
} from '../defaults.mjs';
export function paintRealScale(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors) {
  if (b === 0) {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'How much of Llama 3 405B is the token table?',
      '128,256 vocabulary entries   ×   16,384 features',
    );
    const all = 405,
      embed = (128256 * 16384) / 1e9,
      ratio = embed / all;
    api.rect(ctx, 240, 480, 1440, 200, C.panel, C.muted, 2, 8);
    api.rect(ctx, 240, 480, 1440 * ratio, 200, C.cyan);
    drawExtendedText(ctx, api, C, 'embedding table', 330, 430, 30, C.cyan);
    drawExtendedText(ctx, api, C, 'other model parameters', 1080, 590, 34, C.muted, 'center');
    if (known('embed', 0)) {
      drawExtendedText(
        ctx,
        api,
        C,
        '≈ ' + f(embed, 1) + 'B / 405B ≈ ' + f(100 * ratio, 2) + '%',
        960,
        800,
        37,
        C.yellow,
        'center',
      );
      drawExtendedArrow(ctx, api, C, 330, 445, 247, 470, C.cyan);
    }
    drawExtendedNote(
      ctx,
      api,
      C,
      '126 layers   ·   16,384 features / 128 query heads = 128 features per head',
    );
  } else if (b === 1) {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Read explicit head dimensions from the checkpoint',
      'Published gpt-oss-120b configuration',
    );
    const widths = [2880, 4096, 2880];
    for (let i = 0; i < 3; i++) {
      const y = 420 + i * 150,
        w = (widths[i] / 4096) * 1300;
      api.rect(ctx, 300, y, w * clamp(p * 3 - i), 85, colors[i]);
      drawExtendedText(
        ctx,
        api,
        C,
        ['residual width', '64 heads × 64', 'output width'][i],
        220,
        y + 52,
        28,
        C.muted,
        'right',
      );
      drawExtendedText(
        ctx,
        api,
        C,
        known('width', 1) ? widths[i] : '?',
        1680,
        y + 52,
        31,
        colors[i],
        'right',
      );
    }
    drawExtendedNote(
      ctx,
      api,
      C,
      known('width', 1)
        ? '64 × 64 = 4096 projected features · output projection returns to 2880'
        : 'Keep residual width and projected head width separate',
    );
  } else {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Alternate sliding and full causal attention',
      '36 layers: 18 sliding, 18 full · the future remains forbidden',
    );
    for (let i = 0; i < 36; i++) {
      const x = 230 + (i % 18) * 82,
        y = 430 + Math.floor(i / 18) * 150;
      api.rect(ctx, x, y, 65, 100, i % 2 ? C.blue : C.green);
      if (p > (i + 1) / 36)
        drawExtendedText(ctx, api, C, i % 2 ? 'F' : 'S', x + 32.5, y + 63, 25, C.panel, 'center');
    }
    drawExtendedText(
      ctx,
      api,
      C,
      known('window', 2) ? 'sliding window = 128 positions' : 'sliding window = ?',
      960,
      820,
      34,
      C.yellow,
      'center',
    );
    drawExtendedNote(
      ctx,
      api,
      C,
      'Sliding layers read a recent window. Full layers can read the entire prefix.',
    );
  }
}
export function drawRealScaleStage(ctx, scene, state, api) {
  withTransformerExtendedFrame(ctx, scene, state, api, paintRealScale);
}
export default {
  id: 'real-scale',
  draw: drawRealScaleStage,
  cues: [
    'tr-real-scale-voice-0',
    'tr-real-scale-embed',
    'tr-real-scale-voice-1',
    'tr-real-scale-width',
    'tr-real-scale-voice-2',
    'tr-real-scale-window',
  ],
};
