import { chapterModel } from '../construction.mjs';
import { cacheBytes } from '../model.mjs';
import { bar, chapterEquation, chapterText, note, operation } from '../defaults.mjs';
export function drawLargeBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('large-budget', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'Count stored heads at the supplied dimensions',
        960,
        275,
        37,
        themeColors.cyan,
      );
      ['MHA', 'GQA', 'MQA'].forEach((name, i) => {
        const y = 390 + i * 160,
          heads = [64, 8, 1][i],
          count = Math.ceil(heads * progress),
          value =
            cacheBytes({
              layers: 80,
              batch: 32,
              tokens: 4096,
              kvHeads: count,
              width: 128,
              bytes: 2,
            }) / 1e9;
        chapterText(
          ctx,
          api,
          name + ' ' + count + '/' + heads,
          270,
          y + 40,
          30,
          [themeColors.blue, themeColors.green, themeColors.pink][i],
        );
        bar(
          ctx,
          api,
          460,
          y,
          1070,
          value,
          360,
          [themeColors.blue, themeColors.green, themeColors.pink][i],
        );
        chapterText(
          ctx,
          api,
          value.toFixed(3) + ' GB',
          1725,
          y + 42,
          34,
          themeColors.yellow,
          'right',
        );
      });
      operation(ctx, api, 'large-budget', () =>
        chapterEquation(
          ctx,
          api,
          String.raw`2\times80\times32\times4096\times H_{kv}\times128\times2`,
          960,
          930,
          40,
          themeColors.yellow,
        ),
      );
      note(ctx, api, 'Supplied raw tensor payload · add about 144 GB weights and runtime memory');
    } else if (currentBeat === 1) {
      chapterText(ctx, api, 'One fixed 10 GiB raw-KV budget', 960, 270, 38, themeColors.cyan);
      [1, 8, 64].forEach((count, i) => {
        const x = 200 + i * 560,
          cols = count === 64 ? 8 : count === 8 ? 4 : 1,
          rows = count / cols,
          cw = 350 / cols,
          ch = 350 / rows,
          shown = Math.ceil(count * progress);
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++)
            api.rect(
              ctx,
              x + c * cw,
              380 + r * ch,
              cw - 5,
              ch - 5,
              r * cols + c < shown
                ? [themeColors.blue, themeColors.green, themeColors.pink][i]
                : themeColors.panel,
              themeColors.muted,
              1,
            );
        chapterText(
          ctx,
          api,
          shown + ' complete requests',
          x + 175,
          830,
          36,
          [themeColors.blue, themeColors.green, themeColors.pink][i],
        );
      });
      operation(ctx, api, 'large-budget', () =>
        chapterText(
          ctx,
          api,
          '10 / 1.25 / 0.15625 GiB per request',
          960,
          935,
          37,
          themeColors.yellow,
        ),
      );
      note(
        ctx,
        api,
        'Weights, future output, workspaces and latency constraints require separate budgets',
      );
    } else {
      chapterText(ctx, api, 'Only retained positions change', 960, 270, 38, themeColors.cyan);
      [4096, 32768, 131072, 1048576].forEach((target, i) => {
        const tokens = Math.round(target * progress),
          y = 365 + i * 125,
          value =
            cacheBytes({
              layers: 80,
              batch: 1,
              tokens,
              kvHeads: 64,
              width: 128,
              bytes: 2,
            }) / 1e9;
        chapterText(ctx, api, tokens.toLocaleString(), 300, y + 39, 29, themeColors.blue);
        bar(ctx, api, 500, y, 950, value, 2750, themeColors.blue, 48);
        chapterText(ctx, api, value.toFixed(1) + ' GB', 1680, y + 36, 31, themeColors.yellow);
      });
      operation(ctx, api, 'large-budget', () =>
        chapterText(
          ctx,
          api,
          'Capacity lower bound ≠ valid tensor-parallel layout',
          960,
          930,
          36,
          themeColors.red,
        ),
      );
      note(
        ctx,
        api,
        'Per-rank weights, state and temporary allocations must fit under supported divisibility rules',
      );
    }
  }
}
export default {
  id: 'large-budget',
  draw: drawLargeBudget,
  cues: ['large-budget-0', 'large-budget-1', 'large-budget-2'],
};
