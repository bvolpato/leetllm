import { scalingEvent } from '../construction.mjs';
import { band, rectangle, text } from '../defaults.mjs';
export function drawFrontierEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = scalingEvent(scene, state),
    end = progress === 1;
  const result = (caption) => {
    if (end) text(ctx, api, caption, 960, 960, 36, themeColors.green, 'center');
  };
  api.focus.target('sl-frontier-evidence-construction', () => {
    band(
      ctx,
      api,
      'Published training comparison · rounded dense proxies use declared nominal counts',
    );
    if (currentBeat === 0) {
      const rows = [
        ['Gopher', 280, 300, 5.04, themeColors.blue],
        ['Chinchilla', 70, 1400, 5.88, themeColors.cyan],
      ];
      rows.forEach(([name, N, D, cost, col], i) => {
        const x = 280 + i * 900;
        text(ctx, api, name, x + 240, 355, 40, col, 'center');
        rectangle(ctx, api, x, 390, N * 1.7, D * 0.23, col, themeColors.muted);
        text(ctx, api, `${N}B parameters`, x + 240, 800, 32, col, 'center');
        text(ctx, api, `${D}B presentations`, x + 240, 855, 32, themeColors.ink, 'center');
        if (end)
          text(
            ctx,
            api,
            `${cost.toFixed(2)} × 10²³ proxy FLOPs`,
            x + 240,
            915,
            32,
            themeColors.yellow,
            'center',
          );
      });
    } else if (currentBeat === 1) {
      for (let i = 0; i < 57; i++) {
        const x = 340 + (i % 19) * 68,
          y = 410 + Math.floor(i / 19) * 100;
        rectangle(
          ctx,
          api,
          x,
          y,
          43,
          60,
          i >= 53 ? themeColors.pink : themeColors.cyan,
          themeColors.muted,
        );
        if (i >= 53) text(ctx, api, '×', x + 21, y + 42, 30, themeColors.bg, 'center');
      }
      text(
        ctx,
        api,
        'MMLU includes four tasks where Chinchilla underperformed',
        960,
        790,
        34,
        themeColors.pink,
        'center',
      );
      text(
        ctx,
        api,
        'Optimizer · tokenizer · mixture also differed',
        960,
        875,
        32,
        themeColors.muted,
        'center',
      );
      result('40B–70B tested optimum range · 70B chosen partly for efficiency');
    } else {
      const rows = [
        ['LLaMA1 7B', 143],
        ['LLaMA1 65B', 21.5],
        ['Llama2 7B', 286],
        ['Llama2 70B', 28.6],
        ['Apr2024 Llama3 8B', 1875],
        ['Jul2024 Llama3 405B', 38.5],
      ];
      rows.forEach(([name, r], i) => {
        const y = 350 + i * 88;
        text(ctx, api, name, 250, y + 37, 29, themeColors.ink);
        rectangle(
          ctx,
          api,
          720,
          y,
          ((900 * Math.log10(r)) / 3.4) * progress,
          47,
          i < 2 ? themeColors.blue : i < 4 ? themeColors.cyan : themeColors.yellow,
        );
        if (end)
          text(ctx, api, (i === 4 ? '≥ ' : '') + r, 1700, y + 35, 29, themeColors.ink, 'right');
      });
      text(
        ctx,
        api,
        'Logarithmic bar length · presentations per nominal parameter',
        960,
        970,
        30,
        themeColors.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'frontier-evidence',
  draw: drawFrontierEvidence,
  cues: ['sl-frontier-evidence-0', 'sl-frontier-evidence-1', 'sl-frontier-evidence-2'],
};
