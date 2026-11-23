import { projectionBudget } from '../model.mjs';
import { resultAfter } from '../construction.mjs';
import { text, rect } from '../defaults.mjs';
export function drawTargetBudget(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const earned = (id, index, start = 0.1, end = 0.8) =>
    beat > index ||
    (beat === index && api.focus.progress(id, api.phase(progress, start, end)) >= 0.999);
  ctx.save();
  {
    api.focus.target('target-budget-mechanism', () => {
      const tiny = beat === 2,
        rows = tiny ? projectionBudget(16, 32, 8, 2) : projectionBudget();
      const showQV = earned(tiny ? 'target-tiny-qv' : 'target-large-qv', tiny ? 2 : 0, 0.5, 0.85);
      const showAll = earned(tiny ? 'target-tiny-all' : 'target-large-all', tiny ? 2 : 1, 0.1, 0.4);
      const showAttention = tiny && earned('target-tiny-attention', 2, 0.6, 0.75);
      text(
        ctx,
        api,
        tiny
          ? 'EXECUTED TINY QWEN2 · r = 2 · two query heads / one KV head'
          : 'SUPPLIED BLOCK · r = 16 · d = 4096 · MLP = 11008',
        190,
        280,
        29,
        themeColors.muted,
      );
      text(ctx, api, 'projection', 190, 350, 26, themeColors.muted);
      text(ctx, api, 'weight shape: output × input', 450, 350, 26, themeColors.muted);
      text(ctx, api, 'A: r × input', 1050, 350, 26, themeColors.yellow);
      text(ctx, api, 'B: output × r', 1450, 350, 26, themeColors.cyan);
      const max = Math.max(...rows.map((row) => row.count));
      for (const [i, row] of rows.entries()) {
        const y = 420 + i * 69,
          selected =
            i === 0 || i === 2 ? showQV : tiny ? (i < 4 ? showAttention : showAll) : showAll;
        text(
          ctx,
          api,
          row.name,
          190,
          y,
          31,
          selected ? themeColors.ink : themeColors.muted,
          'left',
          'mono',
        );
        text(ctx, api, `${row.out} × ${row.input}`, 450, y, 30, themeColors.blue, 'left', 'mono');
        const unit = 520 / max;
        rect(ctx, api, 1050, y - 27, 520, 34, themeColors.panel);
        if (selected) {
          rect(ctx, api, 1050, y - 27, row.a * unit, 34, themeColors.yellow);
          rect(ctx, api, 1050 + row.a * unit, y - 27, row.b * unit, 34, themeColors.cyan);
          text(ctx, api, String(row.count), 1770, y, 27, themeColors.ink, 'right', 'mono');
        }
      }
      const qv = rows[0].count + rows[2].count,
        attention = rows.slice(0, 4).reduce((n, r) => n + r.count, 0),
        total = rows.reduce((n, r) => n + r.count, 0);
      text(
        ctx,
        api,
        showQV ? `Q + V = ${qv.toLocaleString('en-US')}` : 'Q + V = ?',
        190,
        940,
        34,
        themeColors.yellow,
        'left',
        'mono',
      );
      if (tiny && showAttention)
        text(ctx, api, `attention = ${attention}`, 750, 940, 31, themeColors.cyan, 'left', 'mono');
      if (showAll)
        text(
          ctx,
          api,
          tiny
            ? `all seven = ${total}`
            : `all seven = ${total.toLocaleString('en-US')} · ×${resultAfter(state, 'target-large-ratio', 1) ? (total / qv).toFixed(2) : '?'}`,
          1170,
          940,
          31,
          themeColors.green,
          'left',
          'mono',
        );
      text(
        ctx,
        api,
        tiny
          ? 'Actual module shapes determine the count; the output head is excluded.'
          : 'Counts exclude biases; the reported QLoRA target comparison is task-specific.',
        190,
        1000,
        27,
        themeColors.muted,
      );
    });
  }
  ctx.restore();
}
export default {
  id: 'target-budget',
  draw: drawTargetBudget,
  cues: [
    'target-budget-1',
    'target-large-qv',
    'target-budget-2',
    'target-large-all',
    'target-large-ratio',
    'target-budget-3',
    'target-tiny-qv',
    'target-tiny-attention',
    'target-tiny-all',
  ],
};
