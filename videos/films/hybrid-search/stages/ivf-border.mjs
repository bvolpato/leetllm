import {
  drawRetrievalMechanismArrow,
  drawRetrievalMechanismF,
  drawRetrievalMechanismLine,
  drawRetrievalMechanismNote,
  drawRetrievalMechanismP,
  drawRetrievalMechanismText,
} from '../defaults.mjs';
export function drawIvfBorder(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const done = (id) => drawRetrievalMechanismP(ctx, api, id) === 1;
  const paint = () => {
    const x = (z) => 220 + z * 135,
      y = 630;
    drawRetrievalMechanismLine(ctx, api, x(0), y, x(10), y, themeColors.muted);
    [0, 4, 4.9, 5.1, 10].forEach((z) => {
      drawRetrievalMechanismLine(ctx, api, x(z), y - 9, x(z), y + 9, themeColors.muted, 2);
    });
    const both = currentBeat > 1 || (currentBeat === 1 && done('ivf-both'));
    api.rect(ctx, 220, 390, 675, 230, themeColors.blue + '18');
    if (both) api.rect(ctx, 895, 390, 675, 230, themeColors.green + '18');
    drawRetrievalMechanismLine(ctx, api, x(5), 365, x(5), 710, themeColors.muted, 2);
    [0, 10].forEach((z) => {
      api.circle(ctx, x(z), y, 17, themeColors.blue);
      drawRetrievalMechanismText(ctx, api, 'center ' + z, x(z), y + 75, 28, themeColors.blue);
    });
    if (currentBeat > 0) {
      [4, 5.1].forEach((z) => {
        api.circle(
          ctx,
          x(z),
          y,
          13,
          z === 4 ? themeColors.blue : both ? themeColors.green : themeColors.muted,
        );
        drawRetrievalMechanismText(
          ctx,
          api,
          'record ' + z,
          x(z) + (z === 4 ? -100 : 110),
          y + 135,
          27,
          z === 4 ? themeColors.blue : both ? themeColors.green : themeColors.muted,
        );
      });
      api.circle(ctx, x(4.9), y - 170, 17, themeColors.yellow);
      drawRetrievalMechanismText(
        ctx,
        api,
        'query 4.9',
        x(4.9) - 210,
        y - 170,
        32,
        themeColors.yellow,
      );
      drawRetrievalMechanismArrow(
        ctx,
        api,
        x(4.9),
        y - 140,
        x(both ? 5.1 : 4),
        y - 25,
        both ? themeColors.green : themeColors.blue,
      );
      drawRetrievalMechanismText(
        ctx,
        api,
        both ? 'Both lists expose record 5.1' : 'One probe: left list only',
        960,
        320,
        37,
        both ? themeColors.green : themeColors.yellow,
      );
      if (both)
        drawRetrievalMechanismText(
          ctx,
          api,
          'nearest distance = 0.2',
          1400,
          890,
          36,
          themeColors.green,
        );
      else if (done('ivf-one'))
        drawRetrievalMechanismText(
          ctx,
          api,
          'returned distance = 0.9',
          530,
          890,
          36,
          themeColors.blue,
        );
    } else {
      drawRetrievalMechanismText(
        ctx,
        api,
        '1,000,000 ×384 ×4B = 1.536GB raw',
        960,
        320,
        40,
        themeColors.cyan,
      );
      drawRetrievalMechanismText(
        ctx,
        api,
        'Train centers, assign lists, then choose lists per query',
        960,
        855,
        34,
        themeColors.muted,
      );
    }
    if (currentBeat === 2) {
      const n = 10 + 10 * drawRetrievalMechanismP(ctx, api, 'ivf-work');
      drawRetrievalMechanismText(
        ctx,
        api,
        'centers 1000 + ' + n.toFixed(0) + ' probes ×1000 records',
        960,
        250,
        32,
        themeColors.yellow,
      );
      if (done('ivf-work'))
        drawRetrievalMechanismText(
          ctx,
          api,
          '11,000 →21,000 comparisons',
          960,
          940,
          36,
          themeColors.yellow,
        );
    }
    drawRetrievalMechanismNote(
      ctx,
      api,
      'Separate 1D Euclidean toy · work counts are not latency measurements',
    );
  };
  drawRetrievalMechanismF(ctx, api, 'ivf-border-mechanism', paint);
  return;
}
export default {
  id: 'ivf-border',
  draw: drawIvfBorder,
  cues: ['ivf-one', 'ivf-both', 'ivf-work'],
};
