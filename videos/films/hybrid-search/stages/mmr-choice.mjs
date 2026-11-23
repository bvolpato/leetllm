import {
  drawRetrievalMechanismEquation,
  drawRetrievalMechanismF,
  drawRetrievalMechanismLine,
  drawRetrievalMechanismNote,
  drawRetrievalMechanismP,
  drawRetrievalMechanismText,
} from '../defaults.mjs';
export function drawMmrChoice(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const done = (id) => drawRetrievalMechanismP(ctx, api, id) === 1;
  const paint = () => {
    drawRetrievalMechanismText(
      ctx,
      api,
      'Selected: governing key rule · choose one more context slot',
      960,
      285,
      34,
      themeColors.muted,
    );
    const rows = [
        ['near-copy', 0.89, 0.97, themeColors.blue],
        ['session', 0.65, 0.2, themeColors.pink],
      ],
      progress = currentBeat > 0 ? drawRetrievalMechanismP(ctx, api, 'mmr-terms') : 0;
    rows.forEach(([name, rel, red, color], i) => {
      const y = 430 + i * 240;
      drawRetrievalMechanismText(ctx, api, name, 315, y + 35, 34, color);
      const start = 850;
      drawRetrievalMechanismLine(ctx, api, 650, y + 65, 1600, y + 65, themeColors.muted, 2);
      api.rect(ctx, start, y, rel * 0.5 * 700 * progress, 60, color);
      api.rect(
        ctx,
        start - red * 0.5 * 700 * progress,
        y + 85,
        red * 0.5 * 700 * progress,
        35,
        themeColors.yellow,
      );
      drawRetrievalMechanismText(
        ctx,
        api,
        'query ' + rel + ' · redundancy ' + red,
        1250,
        y + 150,
        29,
        themeColors.muted,
      );
      if (currentBeat > 0 && done('mmr-answer'))
        drawRetrievalMechanismText(
          ctx,
          api,
          (0.5 * rel - 0.5 * red).toFixed(3),
          530,
          y + 50,
          43,
          name === 'session' ? themeColors.green : themeColors.pink,
        );
    });
    if (currentBeat === 0)
      drawRetrievalMechanismEquation(
        ctx,
        api,
        String.raw`\lambda\,sim(q,d)-(1-\lambda)\max_{s\in S}sim(d,s)`,
        960,
        930,
        43,
      );
    else if (currentBeat === 1 && done('mmr-answer'))
      drawRetrievalMechanismText(
        ctx,
        api,
        'Session wins the arithmetic; it still cannot answer the key question',
        960,
        945,
        31,
        themeColors.pink,
      );
    else if (currentBeat === 2) {
      drawRetrievalMechanismText(
        ctx,
        api,
        'Less redundant ≠ governing evidence',
        960,
        920,
        35,
        themeColors.yellow,
      );
      drawRetrievalMechanismText(
        ctx,
        api,
        'Validate source authority · deduplicate · allow an unused slot',
        960,
        965,
        31,
        themeColors.green,
      );
    }
    drawRetrievalMechanismNote(
      ctx,
      api,
      'Supplied relevance and redundancy values · MMR can select only from its input pool',
    );
  };
  drawRetrievalMechanismF(ctx, api, 'mmr-choice-mechanism', paint);
  return;
}
export default {
  id: 'mmr-choice',
  draw: drawMmrChoice,
  cues: ['mmr-terms', 'mmr-answer'],
};
