import { GiB } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { drawOriginalEquation, drawOriginalText } from '../defaults.mjs';
export function drawGrowth(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  let directed = state;
  if (state.cues) {
    const b = state.beat;
    let u = null,
      k = 1;
    if (b > 0) {
      u = api.focus.progress(b === 1 ? 'reserve-answer' : 'longer-history', 0);
      k = 0.55;
    }
    if (u !== null)
      directed = {
        ...state,
        beatP: 0.15 + 0.6 * k * u,
      };
  }
  const modelState = sampleModel('growth', directed),
    currentBeat = modelState.step;
  {
    api.focus.target('growth-readout', () =>
      drawOriginalText(
        ctx,
        api,
        `Prompt ${modelState.request.prompt.toLocaleString('en-US')} + output reserve ${modelState.request.output.toLocaleString('en-US')}`,
        140,
        270,
        31,
        themeColors.ink,
      ),
    );
    api.focus.target('growth-field-grid', () =>
      teaching.grid({
        x: 170,
        y: 380,
        width: 1100,
        height: 400,
        rows: 4,
        columns: 8,
        labels: Array.from(
          {
            length: 4,
          },
          (_, row) =>
            Array.from(
              {
                length: 8,
              },
              (_, column) =>
                row * 8 + column < modelState.capacity ? `R${row * 8 + column + 1}` : '',
            ),
        ),
        fontSize: 28,
        textColor: themeColors.ink,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        highlights: Array.from(
          {
            length: modelState.capacity,
          },
          (_, i) => ({
            row: Math.floor(i / 8),
            column: i % 8,
            fill: themeColors.panel,
            stroke: themeColors.green,
          }),
        ),
      }),
    );
    api.focus.target('growth-readout-2', () =>
      drawOriginalText(
        ctx,
        api,
        `${modelState.capacity}`,
        1530,
        520,
        74,
        themeColors.green,
        'center',
      ),
    );
    api.focus.target('growth-payloads-fit', () =>
      drawOriginalText(ctx, api, 'payloads fit', 1530, 585, 29, themeColors.muted, 'center'),
    );
    api.focus.target('growth-readout-3', () =>
      drawOriginalText(
        ctx,
        api,
        `${(modelState.request.bytes / GiB).toFixed(3)} GiB / request`,
        1530,
        710,
        29,
        themeColors.cyan,
        'center',
      ),
    );
    api.focus.target('growth-equation', () =>
      drawOriginalEquation(
        ctx,
        api,
        String.raw`B_{\max}=\left\lfloor\frac{16\ \mathrm{GiB}}{M_{\mathrm{request}}}\right\rfloor`,
        960,
        900,
        45,
      ),
    );
    api.focus.target('growth-equal-unshared-histories-runtime-reserve-already-excluded', () =>
      drawOriginalText(
        ctx,
        api,
        'Equal unshared histories · runtime reserve already excluded',
        960,
        975,
        27,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'growth',
  draw: drawGrowth,
  cues: [
    'current-capacity',
    'future-growth',
    'reserve-answer',
    'reserved-capacity',
    'longer-history',
    'seven-fit',
  ],
};
