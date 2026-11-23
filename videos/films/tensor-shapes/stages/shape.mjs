import { sentenceWords, sequence0, sequence1, shape } from '../fixtures.mjs';
import { complete, count, event } from '../construction.mjs';
import { boundaryCheck } from '../model.mjs';
import { brace, caption, equation, numberGrid, target, text, wordNames } from '../defaults.mjs';
export function drawShape(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    for (let batch = 0; batch < 2; batch++) {
      const x = 300 + batch * 900,
        color = batch ? themeColors.pink : themeColors.blue;
      target(ctx, api, batch ? 'second-sentence' : 'first-sentence', () => {
        const visible = batch ? count(3, event(state, 0, 'add-second-sentence')) : 3;
        text(ctx, api, 'Sentence ' + batch, x + 240, 300, 31, color, 'center');
        wordNames(ctx, api, sentenceWords[batch].slice(0, visible), x - 25, 390, 100, color);
        numberGrid(
          ctx,
          api,
          batch ? sequence1.map((row, i) => (i < visible ? row : row.map(() => ''))) : sequence0,
          x,
          390,
          480,
          300,
          color,
          'shape-values-' + batch,
        );
      });
    }
    target(
      ctx,
      api,
      'batch-axis',
      () =>
        event(state, 0, 'name-batch-axis') > 0 &&
        brace(ctx, api, 300, 795, 1380, String.raw`B=2\ \text{sentences}`, themeColors.blue),
    );
    target(ctx, api, 'token-axis', () => {
      if (event(state, 0, 'name-token-axis') === 0) return;
      api.line(ctx, 130, 390, 130, 690, themeColors.cyan, 4);
      api.line(ctx, 120, 390, 140, 390, themeColors.cyan, 4);
      api.line(ctx, 120, 690, 140, 690, themeColors.cyan, 4);
      text(ctx, api, 'T = 3', 130, 740, 29, themeColors.cyan, 'center');
    });
    target(ctx, api, 'feature-axis', () => {
      if (event(state, 0, 'name-feature-axis') === 0) return;
      api.line(ctx, 300, 355, 780, 355, themeColors.yellow, 4);
      api.line(ctx, 300, 345, 300, 365, themeColors.yellow, 4);
      api.line(ctx, 780, 345, 780, 365, themeColors.yellow, 4);
      text(ctx, api, 'D = 4 features', 540, 340, 29, themeColors.yellow, 'center');
    });
    if (currentBeat === 0) {
      equation(
        ctx,
        api,
        complete(event(state, 0, 'name-feature-axis'))
          ? String.raw`\operatorname{shape}(x)=(B,T,D)=(2,3,4)`
          : String.raw`x[\mathrm{batch},\mathrm{token},\mathrm{feature}]`,
        960,
        925,
        43,
        themeColors.cyan,
      );
      caption(
        ctx,
        api,
        'Axis 0: sentence · axis 1: word · axis 2 or −1: feature · rank counts axes',
      );
    } else {
      const reject = event(state, 1, 'reject-integer-storage'),
        convert = event(state, 1, 'convert-storage-type'),
        dtype = complete(convert) ? 'float32' : 'int64',
        checks = boundaryCheck(shape, dtype);
      target(ctx, api, 'dtype-boundary', () => {
        text(ctx, api, 'Model boundary requires float32', 960, 240, 30, themeColors.ink, 'center');
        text(ctx, api, 'shape (2,3,4): pass', 700, 915, 31, themeColors.green, 'center');
        text(
          ctx,
          api,
          'dtype ' +
            dtype +
            ': ' +
            (checks.dtype ? 'pass' : reject > 0 ? 'rejected' : 'check pending'),
          1370,
          915,
          31,
          checks.dtype ? themeColors.green : themeColors.pink,
          'center',
        );
      });
      caption(
        ctx,
        api,
        complete(convert)
          ? 'Converting storage keeps the same value coordinates · shape and dtype both satisfy this boundary'
          : 'The same shape can carry different storage types · this boundary checks both',
      );
    }
  }
}
export default {
  id: 'shape',
  draw: drawShape,
  cues: [
    'add-second-sentence',
    'name-batch-axis',
    'name-token-axis',
    'name-feature-axis',
    'reject-integer-storage',
    'convert-storage-type',
  ],
};
