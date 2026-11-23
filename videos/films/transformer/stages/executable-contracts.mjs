import { stableSoftmax } from 'vizmatic';
import { clamp, norm } from '../arithmetic.mjs';
import { ARTICLE_STATES } from '../fixtures.mjs';
import { MODEL } from '../model.mjs';
import {
  drawExtendedNote,
  drawExtendedRow,
  drawExtendedText,
  drawExtendedTitle,
  withTransformerExtendedFrame,
} from '../defaults.mjs';

const articleRuns = ARTICLE_STATES.map((row) => {
  const [a, b, c, d] = norm(row);
  const logits = [a, 0.2 * a, 0.2 * d, 0.5 * c + d, -b, c];
  return { row, resultLogit: logits[3], resultProbability: stableSoftmax(logits)[3] };
});
export function paintExecutableContracts(
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
  if (b < 2)
    drawExtendedTitle(
      ctx,
      api,
      C,
      b === 0
        ? 'The same block can accept its own output shape'
        : 'Two decoders score the word “result”',
      b === 0 ? 'Two sequences   ·   four tokens per sequence' : 'Same three input tokens',
    );
  if (b === 0) {
    const counts = [8, 24, 8],
      ys = [410, 590, 770];
    counts.forEach((n, i) => {
      const shown = Math.ceil(n * clamp(p * 3 - i));
      drawExtendedRow(
        ctx,
        api,
        C,
        f,
        Array.from({ length: n }, (_, j) => (j < shown ? '·' : '')),
        960 - n * 28,
        ys[i],
        n * 56,
        colors[i],
        70,
      );
      drawExtendedText(
        ctx,
        api,
        C,
        i === 1 ? 'FFN inner width 24' : 'state [2, 4, 8]',
        960,
        ys[i] - 25,
        29,
        colors[i],
        'center',
      );
    });
    drawExtendedNote(
      ctx,
      api,
      C,
      'Finite gradient and zero future mass establish named small-program properties',
    );
  } else if (b === 1) {
    for (let i = 0; i < 2; i++) {
      const x = 230 + i * 850;
      drawExtendedText(
        ctx,
        api,
        C,
        i ? 'seeded article model' : 'fixed film model',
        x + 330,
        405,
        33,
        colors[i],
        'center',
      );
      drawExtendedText(
        ctx,
        api,
        C,
        i ? 'two heads · GELU' : 'one head · ReLU',
        x + 330,
        505,
        30,
        colors[i],
        'center',
      );
      drawExtendedRow(
        ctx,
        api,
        C,
        f,
        i
          ? known('seeded', 1)
            ? [articleRuns[0].resultLogit, articleRuns[0].resultProbability]
            : ['?', '?']
          : [MODEL.logits[3], MODEL.probs[3]],
        x,
        610,
        660,
        colors[i],
      );
      drawExtendedText(
        ctx,
        api,
        C,
        'result logit · result probability',
        x + 330,
        760,
        26,
        C.muted,
        'center',
      );
    }
    drawExtendedNote(ctx, api, C, 'Each model uses its own weights throughout the forward pass');
  } else {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Two article decoders on “function returns the”',
      'Probability of the word “result”, rounded to one decimal percent',
    );
    articleRuns.forEach((run, i) => {
      const y = 437 + i * 227;
      drawExtendedText(
        ctx,
        api,
        C,
        i ? 'Standard library' : 'Seeded PyTorch',
        165,
        y + 40,
        37,
        colors[i],
      );
      drawExtendedText(
        ctx,
        api,
        C,
        i ? 'Two blocks · one head' : 'One block · two heads',
        165,
        y + 100,
        31,
        C.muted,
      );
      drawExtendedText(
        ctx,
        api,
        C,
        (100 * run.resultProbability).toFixed(1) + '%',
        665,
        y + 67,
        48,
        colors[i],
        'center',
      );
      if (known('distinct', 2)) {
        drawExtendedRow(ctx, api, C, f, run.row, 887, y, 848, colors[i], 88);
      }
    });
    drawExtendedNote(
      ctx,
      api,
      C,
      known('distinct', 2)
        ? 'Last residual row, before final normalization'
        : 'What reached the vocabulary head?',
    );
  }
}
export function drawExecutableContractsStage(ctx, scene, state, api) {
  withTransformerExtendedFrame(ctx, scene, state, api, paintExecutableContracts);
}
export default {
  id: 'executable-contracts',
  draw: drawExecutableContractsStage,
  cues: [
    'tr-executable-contracts-voice-0',
    'tr-executable-contracts-decoder',
    'tr-executable-contracts-voice-1',
    'tr-executable-contracts-seeded',
    'tr-executable-contracts-voice-2',
    'tr-executable-contracts-distinct',
  ],
};
