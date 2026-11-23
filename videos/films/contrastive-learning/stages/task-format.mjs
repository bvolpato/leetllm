import { drawNote, drawPill, drawText } from '../defaults.mjs';
export function drawTaskFormat(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-task-format-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => {
      const v = cue(k);
      return !!v && v.phase !== 'before';
    };
  api.focus.target('task-format-mechanism', () => {
    const query = 'How do I rotate an API key?',
      passage = 'Create a new token, then revoke the old one.';
    drawText(
      ctx,
      api,
      'Retain the actual text while changing its trained task format',
      960,
      285,
      33,
      themeColors.yellow,
    );
    if (currentBeat === 0) {
      drawPill(
        ctx,
        api,
        resultComplete('e5') ? 'query: How do I rotate an API key?' : 'How do I rotate an API key?',
        960,
        420,
        1450,
        themeColors.blue,
      );
      drawPill(
        ctx,
        api,
        resultComplete('e5')
          ? 'passage: Create a new token, then revoke the old one.'
          : 'Create a new token, then revoke the old one.',
        960,
        650,
        1450,
        themeColors.green,
      );
      if (resultComplete('e5')) {
        drawText(ctx, api, 'E5 base v2 · masked mean + norm', 960, 925, 34, themeColors.cyan);
      }
    } else if (currentBeat === 1) {
      drawText(
        ctx,
        api,
        'BGE v1.5 recommended short-query setting',
        960,
        360,
        33,
        themeColors.blue,
      );
      if (B('bge'))
        drawPill(
          ctx,
          api,
          'Represent this sentence for searching relevant passages:',
          960,
          500,
          1600,
          themeColors.blue,
        );
      drawPill(ctx, api, 'How do I rotate an API key?', 960, 615, 1450, themeColors.blue);
      drawPill(
        ctx,
        api,
        'Create a new token, then revoke the old one.',
        960,
        750,
        1400,
        themeColors.green,
      );
      if (resultComplete('instructor'))
        drawText(ctx, api, 'INSTRUCTOR: [instruction,text] pair', 960, 930, 35, themeColors.cyan);
    } else {
      const fields = ['checkpoint', 'tokenizer', 'pooling', 'norm', 'prefixes', 'corpus', 'score'];
      fields.forEach((v, i) => {
        const x = 330 + (i % 4) * 420,
          y = 410 + Math.floor(i / 4) * 220;
        drawPill(ctx, api, v, x, y, 360, i === 4 ? themeColors.yellow : themeColors.blue);
      });
      if (resultComplete('bind'))
        drawText(
          ctx,
          api,
          'Query formatting changes require a new measured contract',
          960,
          940,
          33,
          themeColors.yellow,
        );
    }
    drawNote(ctx, api, 'These helpers format strings only · no E5, BGE or INSTRUCTOR inference');
  });
}
export default {
  id: 'task-format',
  draw: drawTaskFormat,
  cues: [
    'cl-task-format-e5',
    'cl-task-format-bge',
    'cl-task-format-instructor',
    'cl-task-format-bind',
  ],
};
