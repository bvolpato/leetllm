import {
  drawRetrievalMechanismArrow,
  drawRetrievalMechanismEquation,
  drawRetrievalMechanismF,
  drawRetrievalMechanismLine,
  drawRetrievalMechanismNote,
  drawRetrievalMechanismP,
  drawRetrievalMechanismTag,
  drawRetrievalMechanismText,
} from '../defaults.mjs';
export function drawPolicyTransfer(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const done = (id) => drawRetrievalMechanismP(ctx, api, id) === 1;
  const paint = () => {
    const result = drawRetrievalMechanismP(ctx, api, 'transfer-fusion'),
      ordering = currentBeat > 0 ? drawRetrievalMechanismP(ctx, api, 'transfer-order') : 0,
      rows = [
        ['required policy', [1], themeColors.blue],
        ['distractor', [3, 3], themeColors.pink],
      ];
    drawRetrievalMechanismText(
      ctx,
      api,
      'Fresh smoothing k=10 · supplied lane ranks',
      960,
      285,
      34,
      themeColors.muted,
    );
    rows.forEach(([id, ranks, color], i) => {
      const y = 455 + i * 230;
      drawRetrievalMechanismTag(ctx, api, id, 350, y, color, 420);
      ranks.forEach((r, j) =>
        drawRetrievalMechanismTag(ctx, api, 'rank ' + r, 800 + j * 300, y, color, 230),
      );
      if (done('transfer-fusion')) {
        const yy = y + (i === 0 ? 230 : -230) * ordering,
          xx = 1490 + (i === 0 ? -190 : 190) * Math.sin(Math.PI * ordering);
        drawRetrievalMechanismF(ctx, api, 'fresh-fused-' + i, () => {
          drawRetrievalMechanismText(ctx, api, id, xx, yy - 55, 29, color);
          drawRetrievalMechanismEquation(
            ctx,
            api,
            ranks.map((r) => String.raw`\frac{1}{` + (10 + r) + '}').join('+') +
              '=' +
              ranks.reduce((z, r) => z + 1 / (10 + r), 0).toFixed(3),
            xx,
            yy + 25,
            42,
            color,
          );
        });
      }
    });
    if (currentBeat === 0)
      drawRetrievalMechanismText(
        ctx,
        api,
        done('transfer-fusion')
          ? 'Consensus distractor wins · required source falls below cutoff'
          : 'Predict the winning fused score',
        960,
        930,
        35,
        done('transfer-fusion') ? themeColors.pink : themeColors.yellow,
      );
    else {
      const wider = drawRetrievalMechanismP(ctx, api, 'transfer-retain');
      if (ordering === 1) {
        if (wider === 0 || wider === 1)
          drawRetrievalMechanismLine(
            ctx,
            api,
            1250,
            550 + 230 * wider,
            1750,
            550 + 230 * wider,
            themeColors.yellow,
            4,
          );
        else
          drawRetrievalMechanismArrow(
            ctx,
            api,
            1810,
            550 + 230 * wider,
            1760,
            550 + 230 * wider,
            themeColors.yellow,
            4,
          );
      }
      if (done('transfer-retain'))
        drawRetrievalMechanismText(
          ctx,
          api,
          'Retain the broader pool before reranking · then check required evidence',
          960,
          935,
          32,
          themeColors.green,
        );
    }
    drawRetrievalMechanismNote(
      ctx,
      api,
      'Change one stage while preserving corpus, grants and other settings',
    );
  };
  drawRetrievalMechanismF(ctx, api, 'policy-transfer-mechanism', paint);
  return;
}
export default {
  id: 'policy-transfer',
  draw: drawPolicyTransfer,
  cues: ['transfer-fusion', 'transfer-retain', 'transfer-order'],
};
