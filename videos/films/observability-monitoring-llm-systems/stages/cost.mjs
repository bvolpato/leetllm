import { EVENTS, RATE } from '../fixtures.mjs';
import { estimate } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import { drawEquation, drawText } from '../defaults.mjs';
export function drawCost(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('cost', state),
    currentBeat = modelState.beat;
  if (state.cues?.['carve-cache']) {
    const partition = api.focus.progress('carve-cache', 0);
    modelState.allocated = Math.round(80 * partition);
    modelState.unallocated = 201 - modelState.allocated;
    modelState.totalVisible = api.focus.visible('total-input');
    modelState.cacheVisible = api.focus.visible('carve-cache');
    modelState.partitionReady = partition === 1;
    modelState.pricedTerms = Math.ceil(3 * api.focus.progress('price-categories', 0));
    modelState.subtotal =
      [121, 8, 150].slice(0, modelState.pricedTerms).reduce((a, b) => a + b, 0) / 1e6;
    modelState.costReady = api.focus.progress('price-categories', 0) === 1;
    modelState.error = api.focus.visible('invalid-cache') ? 'cached input exceeds total' : null;
    modelState.event = {
      ...EVENTS[5],
      cached: modelState.error ? 202 : 80,
    };
    modelState.cost = modelState.error ? null : estimate(modelState.event);
  }
  const grid = (labels, x, y, width, height, z = 30) =>
    teaching.grid({
      x,
      y,
      width,
      height,
      rows: labels.length,
      columns: labels[0].length,
      labels,
      fontSize: z,
      fill: themeColors.panel,
      stroke: themeColors.blue,
      textColor: themeColors.ink,
      cellFocusTarget: (row, col) => {
        if (!row) return undefined;
      },
    });
  {
    drawText(
      ctx,
      api,
      'req 206 · total input includes the cached subset',
      960,
      285,
      35,
      themeColors.yellow,
      'center',
    );
    if (modelState.error) {
      api.focus.target('invalid-usage', () =>
        grid(
          [
            ['Total input', 'Cached subset'],
            [modelState.event.input, modelState.event.cached],
          ],
          380,
          390,
          1160,
          240,
          42,
        ),
      );
      api.focus.target('invalid-usage', () =>
        drawEquation(ctx, api, String.raw`202>201\quad\text{invalid measurement}`, 960, 745, 43),
      );
      api.focus.target('invalid-usage', () =>
        drawText(
          ctx,
          api,
          'REJECT: cached input exceeds total',
          960,
          850,
          39,
          themeColors.pink,
          'center',
        ),
      );
    } else {
      if (modelState.totalVisible) {
        const x = 210,
          y = 390,
          width = 1500,
          height = 125;
        api.rect(ctx, x, y, width, height, '#8d9cb944');
        const cachedWidth = (width * modelState.allocated) / 201,
          uncachedWidth = width - cachedWidth;
        api.focus.target('uncached-input', () =>
          api.rect(ctx, x, y, uncachedWidth, height, themeColors.blue),
        );
        if (cachedWidth > 0)
          api.focus.target('cached-input', () =>
            api.rect(ctx, x + uncachedWidth, y, cachedWidth, height, themeColors.cyan),
          );
        drawText(ctx, api, 'Total input: 201 tokens', 960, 355, 31, themeColors.ink, 'center');
        api.focus.target('uncached-input', () =>
          drawText(
            ctx,
            api,
            (modelState.partitionReady ? 'Uncached' : 'Unallocated') +
              ': ' +
              modelState.unallocated,
            x + uncachedWidth / 2,
            570,
            31,
            themeColors.blue,
            'center',
          ),
        );
        if (modelState.cacheVisible && cachedWidth > 120)
          api.focus.target('cached-input', () =>
            drawText(
              ctx,
              api,
              'Cache read: ' + modelState.allocated,
              x + uncachedWidth + cachedWidth / 2,
              570,
              29,
              themeColors.cyan,
              'center',
            ),
          );
        if (modelState.partitionReady)
          api.focus.target('input-partition', () =>
            drawEquation(ctx, api, String.raw`201-80=121\quad\text{uncached tokens}`, 960, 660, 39),
          );
      }
      if (modelState.pricedTerms > 0) {
        const terms = ['121\\cdot1', '80\\cdot0.1', '30\\cdot5'].slice(0, modelState.pricedTerms);
        api.focus.target('priced-categories', () =>
          drawEquation(ctx, api, String.raw`\frac{${terms.join('+')}}{10^6}`, 960, 800, 46),
        );
      }
      if (modelState.costReady)
        api.focus.target('estimated-cost', () =>
          drawText(
            ctx,
            api,
            '$' + modelState.cost.toFixed(6) + ' estimated token cost',
            960,
            935,
            40,
            themeColors.green,
            'center',
          ),
        );
      else if (modelState.pricedTerms > 0)
        api.focus.target('estimated-cost', () =>
          drawText(
            ctx,
            api,
            'Priced terms so far: $' + modelState.subtotal.toFixed(6),
            960,
            935,
            32,
            themeColors.muted,
            'center',
          ),
        );
    }
    drawText(
      ctx,
      api,
      'Fixture rates: $1 / $0.10 / $5 per million · card ' + RATE.id,
      960,
      1040,
      26,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'cost',
  draw: drawCost,
  cues: ['total-input', 'carve-cache', 'price-categories', 'final-cost', 'invalid-cache'],
};
