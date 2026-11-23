import { drawNote, drawPill, drawRectangle, drawText } from '../defaults.mjs';
export function drawDropoutViews(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-dropout-views-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => {
      const v = cue(k);
      return !!v && v.phase !== 'before';
    };
  api.focus.target('dropout-views-mechanism', () => {
    drawText(ctx, api, 'Same sentence ID S17 · two encoder passes', 960, 285, 35, themeColors.blue);
    drawPill(ctx, api, 'A dog is running', 960, 390, 900, themeColors.yellow);
    const masks = [
        [1, 0, 1, 1, 0, 1],
        [0, 1, 1, 0, 1, 1],
      ],
      disabled = currentBeat > 0 || (currentBeat === 0 && resultComplete('off'));
    masks.forEach((row, i) => {
      const y = 540 + i * 175;
      drawText(
        ctx,
        api,
        'Pass ' + (i + 1),
        280,
        y + 45,
        30,
        i ? themeColors.cyan : themeColors.blue,
      );
      row.forEach((v, j) => {
        const kept = disabled || (!B('masks') && currentBeat === 0) ? 1 : v;
        drawRectangle(
          ctx,
          api,
          490 + j * 170,
          y,
          145,
          75,
          kept ? (i ? themeColors.cyan : themeColors.blue) : themeColors.panel,
          kept ? undefined : themeColors.pink,
        );
        drawText(
          ctx,
          api,
          kept ? 'unit ' + (j + 1) : '0',
          562 + j * 170,
          y + 50,
          27,
          kept ? themeColors.bg : themeColors.pink,
        );
      });
    });
    if (currentBeat === 1 && resultComplete('historical'))
      drawText(ctx, api, 'Historical BERT-base STS: 76.3 / 81.6', 960, 925, 36, themeColors.green);
    if (currentBeat === 2 && B('not')) {
      drawPill(ctx, api, 'is NOT authorized', 570, 915, 680, themeColors.green);
      drawPill(ctx, api, 'is authorized', 1390, 915, 650, themeColors.pink);
    }
    drawNote(
      ctx,
      api,
      currentBeat === 2
        ? 'Removing a negation changes the positive label'
        : 'Masks are supplied illustrations · inference disables dropout · no encoder trained here',
    );
  });
}
export default {
  id: 'dropout-views',
  draw: drawDropoutViews,
  cues: [
    'cl-dropout-views-masks',
    'cl-dropout-views-off',
    'cl-dropout-views-historical',
    'cl-dropout-views-not',
  ],
};
