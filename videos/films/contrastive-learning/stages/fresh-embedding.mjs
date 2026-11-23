import { comparisonRow, formatValue } from '../arithmetic.mjs';
import { drawNote, drawRectangle, drawRowBars, drawText } from '../defaults.mjs';
export function drawFreshEmbedding(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-fresh-embedding-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => {
      const v = cue(k);
      return !!v && v.phase !== 'before';
    };
  api.focus.target('fresh-embedding-mechanism', () => {
    const masked = currentBeat >= 2 && B('mask'),
      r = comparisonRow([0.65, 0.65, 0.05], 0.15, 0, [true, !masked, true]);
    drawText(
      ctx,
      api,
      'Fresh aliases P71/P71b · τ=.15 · fixed vectors',
      960,
      290,
      34,
      themeColors.yellow,
    );
    if (currentBeat > 0 || resultComplete('premise'))
      [0.65, 0.65, 0.05].forEach((v, i) =>
        drawText(ctx, api, 'cos = ' + formatValue(v, 2), 510 + i * 540, 355, 27, themeColors.muted),
      );
    drawRowBars(
      ctx,
      api,
      currentBeat > 1 || resultComplete('share') ? r.probs : [0, 0, 0],
      ['verified P71 +', 'verified alias P71b', 'unrelated P8'],
      465,
      1,
      [themeColors.green, masked ? themeColors.muted : themeColors.green, themeColors.blue],
      (currentBeat > 0 && resultComplete('share')) || currentBeat >= 2,
    );
    if (currentBeat === 0) {
      drawText(
        ctx,
        api,
        'Predict the second relevant alias’s score derivative',
        960,
        910,
        35,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      if (resultComplete('gradient')) {
        drawText(
          ctx,
          api,
          '∂L/∂s₂ = +' + formatValue(r.gradients[1], 3),
          960,
          890,
          40,
          themeColors.pink,
        );
        drawText(ctx, api, 'Descent lowers a verified match', 960, 955, 32, themeColors.pink);
      }
    } else if (currentBeat === 2) {
      if (resultComplete('loss') && !masked)
        drawText(ctx, api, 'loss = ' + formatValue(r.loss, 6), 960, 900, 37, themeColors.pink);
      if (resultComplete('fixed'))
        drawText(
          ctx,
          api,
          'Masked gradient 0 · loss = ' + formatValue(r.loss, 6),
          960,
          900,
          37,
          themeColors.green,
        );
    } else {
      drawRectangle(ctx, api, 350, 820, 1220, 110, themeColors.panel, themeColors.pink);
      if (resultComplete('shortlist'))
        drawText(
          ctx,
          api,
          'Required passage absent despite better first rank',
          960,
          865,
          33,
          themeColors.pink,
        );
      if (resultComplete('hold'))
        drawText(ctx, api, 'HOLD · separate recall floor fails', 960, 975, 35, themeColors.pink);
    }
    drawNote(
      ctx,
      api,
      currentBeat >= 2
        ? 'Change the verified label contract before rewarding a smaller loss'
        : currentBeat === 0 || !resultComplete('share')
          ? 'Answer values remain concealed through the prediction hold'
          : 'Computed from the same supplied scores and denominator',
    );
  });
}
export default {
  id: 'fresh-embedding',
  draw: drawFreshEmbedding,
  cues: [
    'cl-fresh-embedding-premise',
    'cl-fresh-embedding-share',
    'cl-fresh-embedding-gradient',
    'cl-fresh-embedding-loss',
    'cl-fresh-embedding-mask',
    'cl-fresh-embedding-fixed',
    'cl-fresh-embedding-shortlist',
    'cl-fresh-embedding-hold',
  ],
};
