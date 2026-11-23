import { sampleModel } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawPrimitives(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('primitives', state),
    currentBeat = modelState.step;
  {
    const rows = [
      ['Mismatch bits', modelState.bits, themeColors.pink],
      ['Exclusive offsets', modelState.offsets, themeColors.blue],
    ];
    rows.forEach(([name, values, color], i) => {
      text(ctx, api, name, 140, 335 + i * 230, 31, color);
      api.focus.target('primitives-values', () =>
        teaching.grid({
          x: 450,
          y: 280 + i * 230,
          width: 1300,
          height: 120,
          rows: 1,
          columns: 8,
          labels: [values],
          fill: themeColors.panel,
          stroke: color,
          textColor: themeColors.ink,
          fontSize: 40,
        }),
      );
    });
    api.focus.target(
      'primitives-b-0-reduction-count-s-count-scan-written-lanes-s-visible-s-bits-leng',
      () =>
        card(
          ctx,
          api,
          currentBeat === 0
            ? 'Reduction count: ' + modelState.count
            : `Scan written lanes: ${modelState.visible} / ${modelState.bits.length}`,
          180,
          790,
          650,
          themeColors.yellow,
          100,
          38,
        ),
    );
    api.focus.target(
      'primitives-b-0-offsets-locate-each-selected-item-compacted-s-indexes-join',
      () =>
        card(
          ctx,
          api,
          currentBeat === 0
            ? 'Offsets locate each selected item'
            : `Compacted: [${modelState.indexes.join(', ')}]`,
          1060,
          790,
          700,
          themeColors.green,
          100,
          32,
        ),
    );
    text(
      ctx,
      api,
      'A prefix count gives each mismatch its stable destination',
      960,
      975,
      30,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'primitives',
  draw: drawPrimitives,
  cues: ['primitives-beat-1-focus-1', 'primitives-beat-2-focus-1', 'primitives-beat-2-focus-2'],
};
