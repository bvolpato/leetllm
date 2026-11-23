import { drawLine, drawNote, drawPill, drawStrip, drawText } from '../defaults.mjs';
export function drawPairSupervision(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-pair-supervision-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => {
      const v = cue(k);
      return !!v && v.phase !== 'before';
    };
  api.focus.target('pair-supervision-mechanism', () => {
    if (currentBeat === 0) {
      drawPill(ctx, api, 'All dogs are animals', 600, 410, 700, themeColors.blue);
      drawPill(ctx, api, 'All animals are dogs', 1320, 660, 780, themeColors.pink);
      if (B('entail')) {
        drawLine(ctx, api, 600, 470, 600, 650, themeColors.green, 4);
        drawPill(ctx, api, 'A dog → an animal', 600, 760, 650, themeColors.green);
      }
      if (resultComplete('reverse'))
        drawText(ctx, api, 'Reverse claim not entailed', 1320, 850, 34, themeColors.pink);
      drawNote(ctx, api, 'A directional entailment relation is not interchangeable wording');
    } else {
      drawText(
        ctx,
        api,
        'Shared sentence encoder · original SBERT classifier',
        960,
        290,
        34,
        themeColors.blue,
      );
      drawStrip(ctx, api, ['u1', 'u2', 'u3'], 300, 405, 180, themeColors.blue);
      drawStrip(ctx, api, ['v1', 'v2', 'v3'], 1120, 405, 180, themeColors.cyan);
      if (B('sbert')) {
        drawStrip(ctx, api, ['|u1−v1|', '|u2−v2|', '|u3−v3|'], 540, 620, 280, themeColors.yellow);
        drawText(
          ctx,
          api,
          '[ u ; v ; |u − v| ] → NLI classifier',
          960,
          805,
          36,
          themeColors.yellow,
        );
      }
      if (resultComplete('simcse'))
        drawText(
          ctx,
          api,
          'Supervised SimCSE: entailment + / contradiction −',
          960,
          935,
          31,
          themeColors.green,
        );
      drawNote(
        ctx,
        api,
        'Sentence-level training has several objectives · retain independent retrieval paths',
      );
    }
  });
}
export default {
  id: 'pair-supervision',
  draw: drawPairSupervision,
  cues: [
    'cl-pair-supervision-entail',
    'cl-pair-supervision-reverse',
    'cl-pair-supervision-sbert',
    'cl-pair-supervision-simcse',
  ],
};
