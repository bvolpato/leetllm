import {
  drawRetrievalMechanismArrow,
  drawRetrievalMechanismEquation,
  drawRetrievalMechanismF,
  drawRetrievalMechanismNote,
  drawRetrievalMechanismP,
  drawRetrievalMechanismTag,
  drawRetrievalMechanismText,
} from '../defaults.mjs';
export function drawSparseExpansion(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const done = (id) => drawRetrievalMechanismP(ctx, api, id) === 1;
  const paint = () => {
    drawRetrievalMechanismText(
      ctx,
      api,
      'Vocabulary coordinate: credential',
      960,
      280,
      36,
      themeColors.yellow,
    );
    const change = currentBeat > 0 ? drawRetrievalMechanismP(ctx, api, 'sparse-second') : 0,
      logits = [-2 + 5 * change, 3],
      weights = logits.map((x) => Math.log1p(Math.max(x, 0))),
      ready =
        currentBeat > 0
          ? drawRetrievalMechanismP(ctx, api, 'sparse-pool')
          : drawRetrievalMechanismP(ctx, api, 'sparse-rule');
    logits.forEach((z, i) => {
      const y = 445 + i * 205;
      drawRetrievalMechanismTag(
        ctx,
        api,
        'position ' + (i + 1) + ' · z = ' + z.toFixed(1),
        350,
        y,
        themeColors.blue,
        430,
      );
      drawRetrievalMechanismArrow(ctx, api, 590, y, 850, y, themeColors.muted);
      api.rect(ctx, 930, y - 42, weights[i] * 185 * ready, 84, themeColors.cyan);
      if (ready === 1)
        drawRetrievalMechanismText(
          ctx,
          api,
          weights[i].toFixed(3),
          1300,
          y + 12,
          36,
          themeColors.ink,
        );
    });
    drawRetrievalMechanismEquation(ctx, api, String.raw`w_{j}=\log(1+\max(0,z_j))`, 960, 350, 40);
    drawRetrievalMechanismF(ctx, api, 'pooled-coordinate', () => {
      const sum = weights.reduce((a, z) => a + z, 0),
        max = Math.max(...weights);
      if (ready === 1) {
        drawRetrievalMechanismTag(
          ctx,
          api,
          'sum ' + sum.toFixed(3),
          1580,
          485,
          themeColors.green,
          280,
        );
        drawRetrievalMechanismTag(
          ctx,
          api,
          'max ' + max.toFixed(3),
          1580,
          695,
          themeColors.pink,
          280,
        );
      }
    });
    if (currentBeat > 0 && done('weighted-index'))
      drawRetrievalMechanismText(
        ctx,
        api,
        'Posting coordinate carries a weight · endpoint must support it',
        960,
        900,
        33,
        themeColors.yellow,
      );
    drawRetrievalMechanismNote(ctx, api, 'Authored activations · no SPLADE checkpoint executed');
  };
  drawRetrievalMechanismF(ctx, api, 'sparse-expansion-mechanism', paint);
  return;
}
export default {
  id: 'sparse-expansion',
  draw: drawSparseExpansion,
  cues: ['sparse-rule', 'sparse-pool', 'sparse-second', 'weighted-index'],
};
