import { flashExtensionFrame } from '../model.mjs';
import {
  drawFlashExtensionEquation,
  drawFlashExtensionFooter,
  drawFlashExtensionL,
  drawFlashExtensionRectangle,
  drawFlashExtensionText,
} from '../defaults.mjs';
export function drawBlackwellReference(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = flashExtensionFrame('blackwell-reference', state),
    currentBeat = f.beat,
    progress = f.progress,
    colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink],
    row = (values, x, y, cell = 130, cols = values.length) => {
      values.forEach((v, i) => {
        const xx = x + (i % cols) * (cell + 12),
          yy = y + Math.floor(i / cols) * 95;
        drawFlashExtensionRectangle(ctx, api, xx, yy, cell, 74, themeColors.panel, colors[i % 4]);
        drawFlashExtensionText(ctx, api, v, xx + cell / 2, yy + 49, 30, colors[i % 4], 'center');
      });
    };
  const paint = () => {
    if (currentBeat === 1) {
      const old = {
          m: 2,
          l: 2,
          u: 10,
        },
        newScore = 2.2,
        value = -3,
        a = Math.exp(0.2),
        den = old.l + a,
        n = old.u + a * value,
        output = n / den;
      drawFlashExtensionText(
        ctx,
        api,
        'Separate supplied summary · common reference 2',
        960,
        290,
        38,
        themeColors.ink,
        'center',
      );
      row(['m=2', 'ℓ=2', 'N=10'], 270, 400, 250);
      row(['score 2.2', 'value −3'], 1160, 400, 250);
      drawFlashExtensionEquation(
        ctx,
        api,
        '\\ell=2+e^{0.2},\\quad N=10-3e^{0.2}',
        960,
        665,
        43,
        themeColors.cyan,
        'center',
      );
      drawFlashExtensionText(
        ctx,
        api,
        'Normalized result ' + output.toFixed(4),
        960,
        805,
        40,
        themeColors.green,
        'center',
      );
      if (f.started('fa-bad-reference', false))
        drawFlashExtensionText(
          ctx,
          api,
          'Changing m alone mixes references',
          960,
          910,
          35,
          themeColors.pink,
          'center',
        );
    } else {
      const groups = [
        {
          x: 190,
          label: 'Matrix score result',
          values: ['1', '2', '3'],
          color: themeColors.blue,
        },
        {
          x: 760,
          label: 'Exponential work',
          values: ['exp(−2)', 'exp(−1)', '1'],
          color: themeColors.cyan,
        },
        {
          x: 1330,
          label: 'Retained row state',
          values: ['m = 3', 'ℓ = 1.503', 'N = 48.711'],
          color: themeColors.yellow,
        },
      ];
      for (const g of groups) {
        drawFlashExtensionText(ctx, api, g.label, g.x + 200, 355, 30, g.color, 'center');
        g.values.forEach((v, i) => {
          drawFlashExtensionRectangle(
            ctx,
            api,
            g.x,
            420 + i * 125,
            400,
            85,
            themeColors.panel,
            g.color,
          );
          drawFlashExtensionText(ctx, api, v, g.x + 200, 475 + i * 125, 33, g.color, 'center');
        });
      }
      drawFlashExtensionL(
        ctx,
        api,
        [
          {
            x: 615,
            y: 590,
          },
          {
            x: 735,
            y: 590,
          },
        ],
        themeColors.muted,
        4,
      );
      drawFlashExtensionL(
        ctx,
        api,
        [
          {
            x: 1185,
            y: 590,
          },
          {
            x: 1305,
            y: 590,
          },
        ],
        themeColors.muted,
        4,
      );
      drawFlashExtensionText(
        ctx,
        api,
        currentBeat < 2
          ? 'Different execution resources still have real dependent work'
          : 'Paper result: B200 BF16 up to 1613 TFLOPs/s',
        960,
        290,
        34,
        themeColors.ink,
        'center',
      );
      drawFlashExtensionText(
        ctx,
        api,
        'Each row weight uses the same reference',
        960,
        895,
        31,
        themeColors.muted,
        'center',
      );
    }
    drawFlashExtensionFooter(
      ctx,
      api,
      'FlashAttention-4  ·  Blackwell schedule',
    );
  };
  let nested = paint;
  for (let i = 0; i < scene.beats.length; i++) {
    const previous = nested;
    nested = () => api.focus.target('blackwell-reference-state-' + i, previous);
  }
  nested();
}
export default {
  id: 'blackwell-reference',
  draw: drawBlackwellReference,
  cues: [
    'blackwell-reference-beat-1',
    'blackwell-reference-beat-2',
    'fa-keep-reference',
    'fa-bad-reference',
    'blackwell-reference-beat-3',
    'blackwell-reference-beat-4',
  ],
};
