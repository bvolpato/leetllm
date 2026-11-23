import { drawLine, drawMatrix, drawNote, drawPill, drawStrip, drawText } from '../defaults.mjs';
export function drawArchitectures(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-architectures-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after';
  api.focus.target('architectures-mechanism', () => {
    const mode = currentBeat === 0 ? (resultComplete('cross') ? 'cross' : 'bi') : 'late';
    drawText(
      ctx,
      api,
      mode === 'bi'
        ? 'Independent pooled encodings'
        : mode === 'cross'
          ? 'Joint query/document token attention'
          : 'Independent contextual token vectors',
      960,
      285,
      35,
      themeColors.yellow,
    );
    drawStrip(ctx, api, ['query', 'API', 'key'], 240, 410, 175, themeColors.blue);
    drawStrip(ctx, api, ['doc', 'create', 'token'], 1140, 410, 175, themeColors.green);
    if (mode === 'bi') {
      drawPill(ctx, api, 'q vector', 520, 680, 500, themeColors.blue);
      drawPill(ctx, api, 'd vector: cached', 1400, 680, 600, themeColors.green);
      drawLine(ctx, api, 780, 680, 1080, 680, themeColors.cyan, 3);
      drawText(ctx, api, 'One vector score at query time', 960, 900, 36, themeColors.cyan);
    } else if (mode === 'cross') {
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
          drawLine(ctx, api, 310 + i * 175, 500, 1220 + j * 175, 620, themeColors.border, 2);
      drawStrip(ctx, api, ['[q;d]', 'joint', 'score'], 520, 690, 300, themeColors.pink);
      drawText(
        ctx,
        api,
        'Pair-specific computation for each shortlisted document',
        960,
        935,
        31,
        themeColors.pink,
      );
    } else {
      drawMatrix(
        ctx,
        api,
        [
          [0.12, 0.93, 0.08],
          [0.19, 0.07, 0.91],
        ],
        720,
        650,
        160,
        100,
        (i, j) => j === [1, 2][i],
      );
      drawText(
        ctx,
        api,
        'Stored token vectors meet query tokens during MaxSim',
        960,
        935,
        31,
        themeColors.cyan,
      );
    }
    drawNote(ctx, api, 'Precomputation follows where query and document first interact');
  });
}
export default {
  id: 'architectures',
  draw: drawArchitectures,
  cues: ['cl-architectures-bi', 'cl-architectures-cross', 'cl-architectures-late'],
};
