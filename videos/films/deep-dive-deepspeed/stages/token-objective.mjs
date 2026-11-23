import { complete, sentence, tokenObjective } from '../construction.mjs';
import { drawChapterFooter, drawChapterGrid, drawChapterText } from '../defaults.mjs';
export function drawTokenObjective(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api,
    currentBeat = state.beat;
  const sentenceProgress = (beat, index) => sentence(state, 'token-objective', beat, index),
    resultComplete = (beat, index) => complete(state, 'token-objective', beat, index);
  api.focus.target('token-objective-construction', () => {
    const objective = tokenObjective([1, 3], [2, 6]);
    drawChapterText(
      ctx,
      api,
      'Supplied token losses: L₀(w) = w; L₁(w) = 3w at w = 1',
      960,
      285,
      31,
      themeColors.muted,
      'center',
    );
    const count = currentBeat > 0 ? 8 : Math.floor(sentenceProgress(0, 1) * 8),
      tokenValues = [1, 1, 3, 3, 3, 3, 3, 3];
    drawChapterText(ctx, api, 'Rank 0 · 2 tokens', 150, 390, 32, themeColors.blue);
    drawChapterText(ctx, api, 'Rank 1 · 6 tokens', 150, 570, 32, themeColors.pink);
    drawChapterGrid(
      ctx,
      api,
      [[...tokenValues.slice(0, 2).map((v, i) => (i < count ? String(v) : ''))]],
      650,
      330,
      310,
      105,
      themeColors.blue,
      40,
    );
    drawChapterGrid(
      ctx,
      api,
      [[...tokenValues.slice(2).map((v, i) => (i + 2 < count ? String(v) : ''))]],
      650,
      510,
      1050,
      105,
      themeColors.pink,
      40,
    );
    if (currentBeat === 0) {
      if (resultComplete(0, 2)) {
        drawChapterText(
          ctx,
          api,
          'Equal rank means: (1 + 3)/2 = 2',
          960,
          765,
          36,
          themeColors.yellow,
          'center',
        );
      }
      if (resultComplete(0, 3)) {
        drawChapterText(
          ctx,
          api,
          'Token objective: (2×1 + 6×3)/8 = ' + objective.mean,
          960,
          865,
          40,
          themeColors.green,
          'center',
        );
      }
    } else if (currentBeat === 1) {
      const reduced = resultComplete(1, 0);
      drawChapterText(
        ctx,
        api,
        reduced ? 'Reduced gradient = 2.5' : 'Combine loss sums and valid counts first',
        960,
        730,
        37,
        reduced ? themeColors.green : themeColors.yellow,
        'center',
      );
      if (resultComplete(1, 1)) {
        drawChapterText(
          ctx,
          api,
          'Correct square: 2.5² = 6.25',
          500,
          840,
          36,
          themeColors.green,
          'center',
        );
        drawChapterText(
          ctx,
          api,
          'Wrong local squares: ¼×1² + ¾×3² = 7',
          1400,
          840,
          32,
          themeColors.pink,
          'center',
        );
        drawChapterText(
          ctx,
          api,
          'β₂ = 0.999, old v = 0 → 0.00625 versus 0.007',
          960,
          940,
          32,
          themeColors.yellow,
          'center',
        );
      }
    } else {
      drawChapterText(
        ctx,
        api,
        'Same examples + masks + weighting + accumulation',
        960,
        735,
        36,
        themeColors.cyan,
        'center',
      );
      drawChapterGrid(
        ctx,
        api,
        [
          ['Reference scalar', 'Owned scalar', 'Distributed integration'],
          ['same update', 'same update', 'not executed here'],
        ],
        270,
        800,
        1380,
        150,
        themeColors.blue,
        28,
      );
    }
    drawChapterFooter(
      ctx,
      api,
      'Loss and gradient coincide only in these explicitly supplied linear toy losses',
    );
  });
}
export default {
  id: 'token-objective',
  draw: drawTokenObjective,
  cues: [
    'ds-token-objective-b0-s0',
    'ds-token-objective-b0-s1',
    'ds-token-objective-b0-s2',
    'ds-token-objective-b0-s3',
    'ds-token-objective-b0-s4',
    'ds-token-objective-b1-s0',
    'ds-token-objective-b1-s1',
    'ds-token-objective-b1-s2',
    'ds-token-objective-b2-s0',
    'ds-token-objective-b2-s1',
    'ds-token-objective-b2-s2',
  ],
};
