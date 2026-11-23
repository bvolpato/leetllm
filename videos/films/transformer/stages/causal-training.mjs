import { sum } from '../arithmetic.mjs';
import { INPUT, MODEL, compute } from '../model.mjs';
import {
  drawExtendedArrow,
  drawExtendedMaskGrid,
  drawExtendedMatrix,
  drawExtendedNote,
  drawExtendedRow,
  drawExtendedText,
  drawExtendedTitle,
  withTransformerExtendedFrame,
} from '../defaults.mjs';
export function paintCausalTraining(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors) {
  if (b === 0) {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Shift the target and restrict the read separately',
      'The complete text is available to the training program',
    );
    const words = ['function', 'returns', 'the', 'result'];
    words.forEach((v, i) => {
      const x = 215 + i * 400;
      api.rect(ctx, x, 405, 350, 75, C.panel, C.blue, 2, 8);
      drawExtendedText(ctx, api, C, v, x + 175, 455, 30, C.blue, 'center');
      if (i < 3 && p > (i + 1) / 5) {
        drawExtendedArrow(ctx, api, C, x + 175, 510, x + 175, 645, C.cyan);
        drawExtendedText(ctx, api, C, words[i + 1], x + 175, 720, 29, C.green, 'center');
      }
    });
    drawExtendedMaskGrid(ctx, api, C, 4, 1440, 720, 200, 'causal');
    drawExtendedText(
      ctx,
      api,
      C,
      known('shift', 0) ? 'the → result' : 'one next-token target per input row',
      650,
      855,
      32,
      C.yellow,
      'center',
    );
    drawExtendedNote(
      ctx,
      api,
      C,
      'Shifted labels choose the target · the causal mask controls information access',
    );
  } else if (b === 1) {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'A zero score still has exponential mass',
      'Equal finite scores · one legal key, one forbidden key',
    );
    const fixed = known('fixed-mask', 1),
      all = known('all-masked', 1);
    drawExtendedRow(
      ctx,
      api,
      C,
      f,
      all ? ['−∞', '−∞'] : fixed ? [0, '−∞'] : [0, 0],
      500,
      420,
      900,
      C.pink,
    );
    drawExtendedRow(
      ctx,
      api,
      C,
      f,
      all ? ['NaN', 'NaN'] : fixed ? [1, 0] : known('wrong-mask', 1) ? [0.5, 0.5] : ['?', '?'],
      500,
      650,
      900,
      all ? C.pink : fixed ? C.green : C.yellow,
    );
    drawExtendedText(
      ctx,
      api,
      C,
      all
        ? 'manual subtraction: −∞ − (−∞) → NaN'
        : fixed
          ? 'remove forbidden mass before normalizing'
          : known('wrong-mask', 1)
            ? 'zero score leaves future weight 0.5'
            : 'forbidden key’s share = ?',
      960,
      850,
      32,
      all ? C.pink : C.green,
      'center',
    );
    drawExtendedNote(
      ctx,
      api,
      C,
      'Fully padded queries need an explicit policy before this manual softmax',
    );
  } else {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Test the complete causal computation',
      'Fixed weights · dropout disabled · only future row changes',
    );
    const changed = INPUT.map((r) => [...r]);
    changed[2][0] += 4 * p;
    const other = compute(changed);
    drawExtendedMatrix(ctx, api, C, f, changed, 220, 415, 650, 300, C.blue);
    for (let i = 0; i < 3; i++) {
      drawExtendedText(ctx, api, C, 'output row ' + i, 1120, 455 + i * 120, 29, C.muted);
      const delta = Math.sqrt(sum(other.Z[i].map((v, j) => (v - MODEL.Z[i][j]) ** 2)));
      drawExtendedText(
        ctx,
        api,
        C,
        known('invariance', 2) ? f(delta) : '?',
        1610,
        455 + i * 120,
        32,
        i < 2 ? C.green : C.cyan,
        'right',
      );
    }
    drawExtendedNote(
      ctx,
      api,
      C,
      'Earlier rows stay unchanged · the changed row must respond to a real input',
    );
  }
}
export function drawCausalTrainingStage(ctx, scene, state, api) {
  withTransformerExtendedFrame(ctx, scene, state, api, paintCausalTraining);
}
export default {
  id: 'causal-training',
  draw: drawCausalTrainingStage,
  cues: [
    'tr-causal-training-voice-0',
    'tr-causal-training-shift',
    'tr-causal-training-voice-1',
    'tr-causal-training-wrong-mask',
    'tr-causal-training-fixed-mask',
    'tr-causal-training-all-masked',
    'tr-causal-training-voice-2',
    'tr-causal-training-invariance',
  ],
};
