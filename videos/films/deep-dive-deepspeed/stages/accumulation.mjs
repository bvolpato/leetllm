import { complete } from '../construction.mjs';
import { sampleModel } from '../model.mjs';
import { drawOriginalCard, drawOriginalEquation, drawOriginalText } from '../defaults.mjs';
export function drawAccumulation(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api,
    modelState = sampleModel('accumulation', state),
    currentBeat = modelState.b;
  {
    drawOriginalText(
      ctx,
      api,
      'One managed accumulation window',
      960,
      285,
      39,
      themeColors.yellow,
      'center',
    );
    api.focus.target('accumulation-array-from-length-8-i-i-s-micro-string-i-1-pending', () =>
      teaching.grid({
        x: 180,
        y: 430,
        width: 1520,
        height: 140,
        rows: 1,
        columns: 8,
        labels: [
          Array.from(
            {
              length: 8,
            },
            (_, i) => (i < modelState.micro ? String(i + 1) : 'pending'),
          ),
        ],
        fontSize: 29,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
        cellFocusTarget: (_row, col) =>
          col === 7 ? 'accumulation-last-cell' : 'accumulation-earlier-cells',
        highlights: Array.from(
          {
            length: modelState.micro,
          },
          (_, column) => ({
            row: 0,
            column,
            fill: themeColors.panel,
            stroke: themeColors.cyan,
          }),
        ),
      }),
    );
    drawOriginalText(
      ctx,
      api,
      'First microbatch · distinct sample identities across data replicas',
      960,
      620,
      28,
      themeColors.muted,
      'center',
    );
    ['A / B', 'C / D', 'E / F', 'G / H'].forEach((sample, rank) =>
      drawOriginalCard(
        ctx,
        api,
        'R' + rank + ' · ' + sample,
        180 + rank * 395,
        655,
        350,
        themeColors.blue,
        65,
      ),
    );
    api.focus.target('accumulation-counters', () => {
      drawOriginalText(
        ctx,
        api,
        `Engine microsteps: ${modelState.micro}`,
        525,
        800,
        40,
        themeColors.cyan,
        'center',
      );
      drawOriginalText(
        ctx,
        api,
        `Optimizer updates: ${modelState.updates}`,
        1390,
        800,
        40,
        modelState.updates ? themeColors.green : themeColors.muted,
        'center',
      );
    });
    api.focus.target('accumulation-effective-batch', () =>
      drawOriginalEquation(
        ctx,
        api,
        String.raw`B=2\times8\times4=` +
          (complete(state, 'accumulation', 1, 1) ? String(modelState.samples) : '?') +
          String.raw`\ \mathrm{samples}`,
        960,
        925,
        53,
      ),
    );
    drawOriginalText(
      ctx,
      api,
      'microbatch × accumulation × data-parallel degree',
      960,
      1020,
      29,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'accumulation',
  draw: drawAccumulation,
  cues: [
    'accumulation-beat-1-focus-1',
    'ds-accumulation-b0-s0',
    'ds-accumulation-b0-s1',
    'ds-accumulation-b0-s2',
    'ds-accumulation-b0-s3',
    'accumulation-beat-2-focus-1',
    'ds-accumulation-b1-s0',
    'ds-accumulation-b1-s1',
    'ds-accumulation-b1-s2',
    'accumulation-final-boundary',
    'ds-accumulation-b2-s0',
    'ds-accumulation-b2-s1',
    'ds-accumulation-b2-s2',
    'ds-accumulation-b2-s3',
  ],
};
