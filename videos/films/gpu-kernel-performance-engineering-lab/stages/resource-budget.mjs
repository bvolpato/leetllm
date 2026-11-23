import { resourceCapacity } from '../arithmetic.mjs';
import { chapterText, footer, rectangle, title } from '../defaults.mjs';
export function drawResourceBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const key = (k) => `gpu-${'resource-budget'}-${k}`,
    cue = (k) => api.focus.cue(key(k)),
    cueProgress = (k) => api.focus.progress(key(k), 0),
    resultComplete = (k) => cue(k)?.phase === 'after';
  const F = (keys, paint) => {
    const a = Array.isArray(keys) ? keys : [keys];
    const nest = (i) => (i === a.length ? paint() : api.focus.target(key(a[i]), () => nest(i + 1)));
    return nest(0);
  };
  {
    const changed =
        currentBeat === 2 && (resultComplete('registers2') || cueProgress('registers2') > 0),
      model = resourceCapacity(changed ? 56 : 40),
      columns = [
        {
          name: 'Registers',
          x: 210,
          count: model.registerBlocks,
          used: model.registersPerBlock,
          total: 65536,
          color: themeColors.blue,
        },
        {
          name: 'Shared bytes',
          x: 780,
          count: 15,
          used: 4224,
          total: 65536,
          color: themeColors.cyan,
        },
        {
          name: 'Warp limit',
          x: 1350,
          count: 8,
          used: 8,
          total: 64,
          color: themeColors.yellow,
        },
      ],
      progress = currentBeat === 0 ? 0 : 1;
    title(ctx, api, 'Whole blocks must fit every declared resource budget');
    for (const col of columns) {
      chapterText(ctx, api, col.name, col.x + 180, 360, 32, col.color);
      F(
        col.name === 'Registers'
          ? ['limits', 'registers', 'regblocks', 'registers2', 'blocks2']
          : col.name === 'Shared bytes'
            ? ['shared', 'granularity']
            : ['warps'],
        () => {
          rectangle(ctx, api, col.x, 395, 360, 470, themeColors.panel, themeColors.line);
          const columnCue =
              col.name === 'Registers'
                ? changed
                  ? 'blocks2'
                  : 'regblocks'
                : col.name === 'Shared bytes'
                  ? 'shared'
                  : 'warps',
            columnProgress =
              currentBeat === 0
                ? 0
                : currentBeat === 2 && col.name !== 'Registers'
                  ? 1
                  : cueProgress(columnCue),
            visible = Math.floor(col.count * columnProgress);
          for (let i = 0; i < visible; i++) {
            const h = (470 * col.used) / col.total;
            rectangle(
              ctx,
              api,
              col.x + 8,
              865 - (i + 1) * h + 3,
              344,
              Math.max(1, h - 6),
              col.color,
              undefined,
              3,
            );
          }
          chapterText(
            ctx,
            api,
            resultComplete(columnCue) ? `${col.count} whole blocks` : 'Fit whole blocks',
            col.x + 180,
            920,
            30,
            col.color,
          );
        },
      );
    }
    F(['worksheet', 'minimum', 'fraction', 'fraction2', 'scope'], () => {
      const shown = currentBeat === 2 ? resultComplete('fraction2') : resultComplete('fraction');
      chapterText(
        ctx,
        api,
        shown
          ? `${model.blocks} blocks × 8 warps = ${model.warps} / 64 = ${100 * model.fraction}%`
          : 'Take the minimum whole-block capacity',
        960,
        975,
        35,
        shown ? themeColors.green : themeColors.muted,
      );
    });
    footer(
      ctx,
      api,
      'Toy worksheet: 65,536 registers · 64 KiB shared · 64 warps · no allocation rounding',
    );
  }
}
export default {
  id: 'resource-budget',
  draw: drawResourceBudget,
  cues: [
    'gpu-resource-budget-limits',
    'gpu-resource-budget-granularity',
    'gpu-resource-budget-worksheet',
    'gpu-resource-budget-registers',
    'gpu-resource-budget-regblocks',
    'gpu-resource-budget-shared',
    'gpu-resource-budget-warps',
    'gpu-resource-budget-minimum',
    'gpu-resource-budget-fraction',
    'gpu-resource-budget-registers2',
    'gpu-resource-budget-blocks2',
    'gpu-resource-budget-fraction2',
    'gpu-resource-budget-scope',
  ],
};
