import {
  drawCredentialDocs,
  drawExtensionArrow,
  drawExtensionBox,
  drawExtensionNote,
  drawExtensionText,
} from '../defaults.mjs';
export function drawAnalyzerContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = (id) => api.focus.progress(id),
    cueVisible = (id) => api.focus.visible(id),
    resultComplete = (id) => progress(id) === 1;
  api.focus.target('analyzer-contract-construction', () => {
    drawExtensionText(
      ctx,
      api,
      'New question · How do I rotate an API key?',
      150,
      270,
      34,
      themeColors.cyan,
    );
    if (currentBeat === 0) {
      drawCredentialDocs(ctx, api);
      if (resultComplete('credential-relevance'))
        drawExtensionNote(ctx, api, 'd1 and d2 each give the reader a rotation step.');
    } else if (currentBeat === 1) {
      ['rotate', 'api', 'key'].forEach((term, i) => {
        drawExtensionBox(ctx, api, term, 170, 385 + i * 175, 350, 85, themeColors.cyan, 36);
        if (cueVisible('analyzer-postings')) {
          const ids = term === 'rotate' ? [] : ['d1', 'd4'];
          ids.forEach((id, j) => {
            const yy = 405 + j * 370;
            drawExtensionArrow(
              ctx,
              api,
              550,
              427 + i * 175,
              1080,
              yy + 30,
              themeColors.cyan,
              progress('analyzer-postings'),
            );
          });
          if (term === 'rotate')
            drawExtensionText(ctx, api, 'empty posting', 660, 440, 30, themeColors.pink);
        }
      });
      drawExtensionBox(ctx, api, 'd1 · rotation guide', 1110, 405, 610, 80, themeColors.green, 31);
      drawExtensionBox(ctx, api, 'd4 · quota dashboard', 1110, 775, 610, 80, themeColors.blue, 31);
      drawExtensionNote(
        ctx,
        api,
        'd2 is useful but shares no analyzed query term. The index follows its representation.',
      );
    } else {
      ['AUTH_401', 'AUTH_403'].forEach((raw, j) =>
        drawExtensionBox(ctx, api, raw, 180 + j * 700, 390, 600, 85, themeColors.blue, 38),
      );
      drawExtensionText(
        ctx,
        api,
        'rotate_api_key() → rotate / api / key',
        960,
        750,
        30,
        themeColors.cyan,
        'center',
      );
      if (cueVisible('identifier-collision')) {
        drawExtensionArrow(
          ctx,
          api,
          480,
          495,
          850,
          545,
          themeColors.pink,
          progress('identifier-collision'),
        );
        drawExtensionArrow(
          ctx,
          api,
          1180,
          495,
          1070,
          545,
          themeColors.pink,
          progress('identifier-collision'),
        );
        drawExtensionBox(ctx, api, 'auth', 760, 545, 400, 85, themeColors.pink, 40);
        drawExtensionText(
          ctx,
          api,
          'Different raw error codes collide',
          960,
          710,
          31,
          themeColors.pink,
          'center',
        );
      }
      if (cueVisible('keyword-repair')) {
        drawExtensionBox(
          ctx,
          api,
          'keyword: AUTH_401 ≠ AUTH_403',
          200,
          800,
          1500,
          85,
          themeColors.green,
          34,
        );
        drawExtensionText(
          ctx,
          api,
          'text: rotate / api / key',
          960,
          945,
          32,
          themeColors.cyan,
          'center',
        );
      }
    }
  });
  return true;
}
export default {
  id: 'analyzer-contract',
  draw: drawAnalyzerContract,
  cues: [
    'credential-records',
    'credential-relevance',
    'analyzer-terms',
    'analyzer-postings',
    'identifier-collision',
    'keyword-repair',
  ],
};
