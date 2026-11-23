import { sampleModel } from '../model.mjs';
import { chapterFooter, chapterGrid, chapterRows, chapterTitle } from '../defaults.mjs';
export function drawDecodingPolicy(ctx, scene, state, api) {
  return api.focus.target('hf-decoding-policy-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('decoding-policy', state),
      { b: currentBeat, p: progress } = modelState;
    {
      chapterTitle(
        ctx,
        api,
        currentBeat === 0
          ? 'Resolve sampling and beam settings together'
          : currentBeat === 1
            ? 'Supplied logits: temperature 1 · top-k 2'
            : 'Returned sequence includes the decoder-only prefix',
      );
      if (currentBeat === 0) {
        chapterGrid(
          ctx,
          api,
          [
            ['Sampling flag', 'Beam count', 'Mode'],
            ['false', '1', 'greedy'],
            ['false', '3', 'beam search'],
            ['true', '1', 'sampling'],
          ],
          300,
          390,
          1320,
          320,
          themeColors.blue,
          28,
        );
        chapterFooter(ctx, api, 'Beam search continues only the replies it keeps.');
      } else if (currentBeat === 1) {
        chapterGrid(
          ctx,
          api,
          [
            ['Candidate', 'A', 'B', 'C'],
            ['Logit', '2', '1', '0'],
            ['Top-k permitted', 'yes', 'yes', progress > 0.2 ? 'no' : 'pending'],
            [
              'Centered exp mass',
              '1',
              progress > 0.45 ? 'exp(−1)' : '?',
              progress > 0.2 ? '0' : '?',
            ],
            [
              'Normalized share',
              modelState.showShares ? modelState.shares[0].toFixed(6) : '?',
              modelState.showShares ? modelState.shares[1].toFixed(6) : '?',
              modelState.showShares ? '0' : '?',
            ],
          ],
          210,
          390,
          1500,
          425,
          themeColors.cyan,
          28,
        );
        chapterFooter(
          ctx,
          api,
          'Filtering changes support; divide permitted exponential masses by their own sum',
        );
      } else {
        chapterGrid(
          ctx,
          api,
          [
            ['Sequence', 'P0', 'P1', 'P2', 'N0', 'N1', 'N2'],
            ['Completion', '', '', '', 'N0', 'N1', 'N2'],
          ],
          180,
          440,
          1560,
          210,
          themeColors.blue,
          27,
        );
        chapterRows(
          ctx,
          api,
          [
            ['Resolved policy', 'Top-p, stop IDs, repetition, maximum new tokens'],
            ['Compare outputs', 'Token IDs first, decoded strings afterward'],
          ],
          760,
          140,
        );
      }
      return;
    }
  });
}
export default {
  id: 'decoding-policy',
  draw: drawDecodingPolicy,
  cues: [
    'hf-decoding-policy-0',
    'hf-decoding-policy-1',
    'hf-sampling-probs',
    'hf-decoding-policy-2',
  ],
};
