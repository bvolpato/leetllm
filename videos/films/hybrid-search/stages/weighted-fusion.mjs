import {
  drawRetrievalMechanismEquation,
  drawRetrievalMechanismF,
  drawRetrievalMechanismNote,
  drawRetrievalMechanismP,
  drawRetrievalMechanismTag,
  drawRetrievalMechanismText,
} from '../defaults.mjs';
export function drawWeightedFusion(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const done = (id) => drawRetrievalMechanismP(ctx, api, id) === 1;
  const paint = () => {
    if (currentBeat === 0) {
      drawRetrievalMechanismText(
        ctx,
        api,
        'Supplied normalized scores · dense weight 0.7',
        960,
        295,
        34,
        themeColors.muted,
      );
      const a = drawRetrievalMechanismP(ctx, api, 'weighted-terms'),
        vals = [0.8 * 0.7, 0.2 * 0.3];
      vals.forEach((z, i) => {
        const y = 450 + i * 190;
        drawRetrievalMechanismText(
          ctx,
          api,
          i ? 'lexical .2 ×.3' : 'dense .8 ×.7',
          390,
          y + 35,
          33,
          i ? themeColors.pink : themeColors.blue,
        );
        api.rect(ctx, 700, y, 900 * z * a, 65, i ? themeColors.pink : themeColors.blue);
      });
      if (done('weighted-answer'))
        drawRetrievalMechanismEquation(
          ctx,
          api,
          String.raw`0.56+0.06=0.62`,
          960,
          885,
          50,
          themeColors.green,
        );
    } else if (currentBeat === 1) {
      const extreme = drawRetrievalMechanismP(ctx, api, 'minmax-outlier'),
        constant = drawRetrievalMechanismP(ctx, api, 'constant-lane') > 0,
        values = constant ? [6, 6, 6, 6] : [2, 4, 6, 6 + 14 * extreme],
        max = 6 + 14 * extreme;
      drawRetrievalMechanismText(
        ctx,
        api,
        constant
          ? 'Separate equal-score case · all four inputs set to 6'
          : 'Same first three scores · move only the observed maximum',
        960,
        290,
        33,
        themeColors.muted,
      );
      values.forEach((z, i) => {
        const y = 410 + i * 120;
        drawRetrievalMechanismText(
          ctx,
          api,
          z.toFixed(1),
          300,
          y + 25,
          30,
          i === 3 ? themeColors.pink : themeColors.blue,
        );
        api.rect(
          ctx,
          450,
          y,
          1100 * (constant ? 0 : (z - 2) / (max - 2)),
          45,
          i === 3 ? themeColors.pink : themeColors.blue,
        );
        drawRetrievalMechanismText(
          ctx,
          api,
          (constant ? 0 : (z - 2) / (max - 2)).toFixed(3),
          1660,
          y + 30,
          30,
          themeColors.cyan,
        );
      });
      if (done('constant-lane'))
        drawRetrievalMechanismText(
          ctx,
          api,
          'equal scores → range0 → explicit convention required',
          960,
          950,
          34,
          themeColors.yellow,
        );
    } else {
      drawRetrievalMechanismText(ctx, api, 'Candidate union', 960, 290, 35, themeColors.muted);
      ['KROT-14', 'session', 'audit'].forEach((id, i) => {
        const y = 450 + i * 145;
        drawRetrievalMechanismTag(ctx, api, id, 380, y, themeColors.blue);
        drawRetrievalMechanismTag(
          ctx,
          api,
          'dense ' + [0.8, 0.6, 0.2][i],
          930,
          y,
          themeColors.blue,
        );
        drawRetrievalMechanismTag(
          ctx,
          api,
          i === 0 ? 'lexical unknown' : 'lexical ' + [0, 0.5, 0.4][i],
          1480,
          y,
          i === 0 ? themeColors.yellow : themeColors.pink,
        );
      });
      if (done('rescore-union'))
        drawRetrievalMechanismText(
          ctx,
          api,
          'Rescore the union or validate the missing-score convention',
          960,
          935,
          34,
          themeColors.green,
        );
    }
    drawRetrievalMechanismNote(
      ctx,
      api,
      'Normalization bounds a scale; it does not calibrate relevance or define decision share',
    );
  };
  drawRetrievalMechanismF(ctx, api, 'weighted-fusion-mechanism', paint);
  return;
}
export default {
  id: 'weighted-fusion',
  draw: drawWeightedFusion,
  cues: ['weighted-terms', 'weighted-answer', 'minmax-outlier', 'constant-lane', 'rescore-union'],
};
