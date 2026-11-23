import { longContextModel } from '../construction.mjs';
import { cellGrid, contextText, equation, footer, modelTarget, valueBar } from '../defaults.mjs';
export function drawCostLength(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = longContextModel('cost-length', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    if (currentBeat === 0) {
      contextText(ctx, api, 'One new query row at a time', 960, 265, 36, themeColors.cyan);
      const shown = Math.ceil(m.full * progress);
      let index = 0;
      modelTarget(ctx, api, 'cost-length', () =>
        cellGrid(ctx, api, 310, 340, 10, 10, 48, (r, c) =>
          c <= r && index++ < shown ? themeColors.blue : themeColors.panel,
        ),
      );
      contextText(ctx, api, 'query positions', 190, 570, 28, themeColors.blue);
      contextText(ctx, api, 'key positions', 550, 895, 28, themeColors.blue);
      const row = Math.min(9, Math.floor((Math.sqrt(8 * shown + 1) - 1) / 2));
      contextText(ctx, api, `${shown} allowed pairs`, 1280, 475, 58, themeColors.yellow);
      equation(ctx, api, String.raw`1+2+\cdots+10=55`, 1280, 635, 48, themeColors.yellow);
      contextText(ctx, api, 'D1 is one early key', 1280, 790, 30, themeColors.muted);
    } else {
      const n = m.length,
        ratio = n / 4096;
      contextText(ctx, api, 'Both token axes grow', 960, 275, 38, themeColors.cyan);
      contextText(ctx, api, 'length', 300, 420, 32, themeColors.blue);
      valueBar(ctx, api, 450, 390, 1190, Math.log2(ratio), 5, themeColors.blue);
      contextText(ctx, api, n.toLocaleString() + ' tokens', 960, 510, 38, themeColors.blue);
      contextText(ctx, api, 'pair work', 300, 655, 32, themeColors.yellow);
      valueBar(ctx, api, 450, 625, 1190, 2 * Math.log2(ratio), 10, themeColors.yellow);
      contextText(
        ctx,
        api,
        `${(ratio ** 2).toFixed(0)}× leading score work`,
        960,
        745,
        48,
        themeColors.yellow,
      );
      modelTarget(ctx, api, 'cost-length', () =>
        equation(
          ctx,
          api,
          currentBeat === 1
            ? String.raw`\mathrm{causal\ pairs}=n(n+1)/2`
            : String.raw`\mathrm{prefill}:n^2\qquad\mathrm{decode\ query}:n`,
          960,
          885,
          45,
          themeColors.ink,
        ),
      );
      footer(
        ctx,
        api,
        'Leading-term work comparison · FlashAttention reduces IO · no latency benchmark',
      );
    }
  }
}
export default {
  id: 'cost-length',
  draw: drawCostLength,
  cues: ['cost-length-0', 'cost-length-1', 'cost-length-2'],
};
