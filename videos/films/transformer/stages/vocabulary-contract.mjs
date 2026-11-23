import { EMBED, VOCAB, WOUT } from '../fixtures.mjs';
import { MODEL } from '../model.mjs';
import {
  drawExtendedArrow,
  drawExtendedBars,
  drawExtendedMatrix,
  drawExtendedNote,
  drawExtendedText,
  drawExtendedTitle,
  withTransformerExtendedFrame,
} from '../defaults.mjs';
import { dotProduct, stableSoftmax } from 'vizmatic';
export function paintVocabularyContract(
  ctx,
  scene,
  state,
  api,
  C,
  id,
  s,
  b,
  p,
  f,
  mix,
  known,
  colors,
) {
  if (b === 0) {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Project every token row into vocabulary coordinates',
      'B × T × d becomes B × T × N',
    );
    drawExtendedMatrix(ctx, api, C, f, MODEL.final, 180, 420, 650, 330, C.blue);
    drawExtendedArrow(ctx, api, C, 880, 590, 1010, 590);
    const scores = MODEL.final.map((r) => WOUT.map((w) => dotProduct(w, r)));
    drawExtendedMatrix(
      ctx,
      api,
      C,
      f,
      scores,
      1090,
      420,
      650,
      330,
      C.green,
      known('shape', 0) ? 18 : Math.floor(p * 18),
    );
    drawExtendedText(ctx, api, C, 'T = 3 · d = 4', 505, 830, 30, C.blue, 'center');
    drawExtendedText(ctx, api, C, 'T = 3 · N = 6', 1415, 830, 30, C.green, 'center');
    drawExtendedNote(
      ctx,
      api,
      C,
      'The last row on the left supplies all six scores in the last row on the right',
    );
  } else if (b === 1) {
    const tied = known('tying', 1);
    const count = EMBED.flat().length;
    drawExtendedTitle(
      ctx,
      api,
      C,
      tied ? 'One table serves both jobs' : 'Two jobs, two tables',
      '6 vocabulary entries   ×   4 features',
    );
    const inputX = tied ? 695 : 260;
    drawExtendedMatrix(ctx, api, C, f, EMBED, inputX, 425, 530, 392, C.blue);
    if (tied) {
      api.text(ctx, 'Look up a token', 490, 618, 34, C.blue, 'right');
      api.arrow(ctx, 520, 606, 664, 606, C.blue, 4);
      api.text(ctx, 'Score each word', 1430, 618, 34, C.pink);
      api.arrow(ctx, 1398, 606, 1254, 606, C.pink, 4);
    } else {
      drawExtendedMatrix(ctx, api, C, f, WOUT, 1130, 425, 530, 392, C.pink);
      api.text(ctx, 'Look up a token', 525, 390, 34, C.blue, 'center');
      api.text(ctx, 'Score each word', 1395, 390, 34, C.pink, 'center');
    }
    const storage = tied ? count : count + WOUT.flat().length;
    api.text(ctx, storage + ' stored weights', 960, 920, 42, C.yellow, 'center');
  } else {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Temperature acts on logits before softmax',
      'The same six fixed logits · compare T=0.5, 1 and 2',
    );
    const t = known('warm', 2) ? 2 : known('voice-2', 2) ? 1 : 0.5,
      v = stableSoftmax(MODEL.logits.map((x) => x / t));
    drawExtendedBars(ctx, api, C, f, v, VOCAB, 220, 425, 1450, 330, C.cyan);
    drawExtendedText(ctx, api, C, 'logits ÷ ' + t, 960, 850, 33, C.yellow, 'center');
    if (known('temperature', 2))
      drawExtendedText(
        ctx,
        api,
        C,
        'Scaling probabilities then renormalizing: unchanged',
        960,
        910,
        29,
        C.pink,
        'center',
      );
    drawExtendedNote(
      ctx,
      api,
      C,
      'Finite positive temperature · greedy ties still need a declared tie rule',
    );
  }
}
export function drawVocabularyContractStage(ctx, scene, state, api) {
  withTransformerExtendedFrame(ctx, scene, state, api, paintVocabularyContract);
}
export default {
  id: 'vocabulary-contract',
  draw: drawVocabularyContractStage,
  cues: [
    'tr-vocabulary-contract-voice-0',
    'tr-vocabulary-contract-shape',
    'tr-vocabulary-contract-voice-1',
    'tr-vocabulary-contract-tying',
    'tr-vocabulary-contract-voice-2',
    'tr-vocabulary-contract-warm',
    'tr-vocabulary-contract-temperature',
  ],
};
