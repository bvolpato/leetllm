import { loopBound } from '../arithmetic.mjs';
import { loopCueStarted } from '../construction.mjs';
import {
  arrow,
  box,
  constructionText,
  footer,
  heading,
  line,
  matrix,
  vectorLabel,
} from '../defaults.mjs';
export function drawLossContract(ctx, scene, state, api) {
  api.focus.target('loss-contract-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = loopBound(state.beatP ?? 0);
    const cueStarted = (name, fallback = progress > 0.4) =>
      loopCueStarted(state.cues, name, fallback);
    {
      if (currentBeat === 0) {
        heading(ctx, api, 'The shape and dtype define the hard-label contract');
        matrix(
          ctx,
          api,
          [
            [1.2, 0.8],
            [-1, -0.7],
          ],
          220,
          420,
          themeColors.blue,
          125,
        );
        matrix(
          ctx,
          api,
          [
            [0.2, -0.1],
            [-0.4, 0.3],
          ],
          820,
          420,
          themeColors.cyan,
          125,
        );
        matrix(ctx, api, [[1], [0]], 1450, 420, themeColors.yellow, 125);
        constructionText(
          ctx,
          api,
          'float features [B,2]',
          350,
          790,
          29,
          themeColors.blue,
          'center',
        );
        constructionText(ctx, api, 'raw logits [B,2]', 950, 790, 29, themeColors.cyan, 'center');
        constructionText(ctx, api, 'long targets [B]', 1515, 790, 29, themeColors.yellow, 'center');
        box(
          ctx,
          api,
          'soft targets instead require a full [B,C] distribution',
          360,
          890,
          1200,
          80,
          themeColors.yellow,
          30,
        );
      } else if (currentBeat === 1) {
        heading(ctx, api, 'Stable cross entropy preserves the actual target score');
        const logits = [2, -1],
          top = 2,
          den = Math.exp(0) + Math.exp(-3),
          loss = Math.log(den);
        box(ctx, api, 'raw logits [2,−1] · target 0', 220, 390, 700, 90, themeColors.blue, 32);
        box(ctx, api, 'subtract max: [0,−3]', 1050, 390, 650, 90, themeColors.cyan, 32);
        arrow(ctx, api, 950, 435, 1020, 435);
        constructionText(
          ctx,
          api,
          '−target logit + log-sum-exp',
          960,
          650,
          36,
          themeColors.yellow,
          'center',
        );
        box(
          ctx,
          api,
          '−2 + 2 + ln(1 + exp(−3)) = ' + loss.toFixed(6),
          300,
          785,
          1320,
          100,
          themeColors.green,
          34,
        );
        footer(ctx, api, 'A rounded softmax or a second softmax changes the numerical contract');
      } else {
        heading(ctx, api, 'One shuffle owns feature rows and target identities');
        const order = cueStarted('loop-shuffle', progress > 0.25)
            ? [3, 0, 5, 1, 4, 2]
            : [0, 1, 2, 3, 4, 5],
          xs = [
            [-2, -1.2],
            [-1.3, -0.8],
            [-0.8, -1.4],
            [0.9, 1.1],
            [1.4, 0.8],
            [1.8, 1.6],
          ];
        order.forEach((old, i) => {
          const y = 390 + i * 75;
          constructionText(ctx, api, 'ID ' + (101 + old), 260, y, 29, themeColors.blue);
          constructionText(ctx, api, vectorLabel(xs[old]), 680, y, 31, themeColors.cyan);
          constructionText(
            ctx,
            api,
            old < 3 ? 'target 0 · standard' : 'target 1 · escalate',
            1220,
            y,
            29,
            old < 3 ? themeColors.blue : themeColors.green,
          );
          line(ctx, api, 220, y + 24, 1710, y + 24, themeColors.border, 1);
        });
        footer(
          ctx,
          api,
          'Permute paired records once; a separately shuffled target vector changes the task',
        );
      }
    }
    return true;
  });
}
export default {
  id: 'loss-contract',
  draw: drawLossContract,
  cues: ['loss-contract-beat-0', 'loss-contract-beat-1', 'loss-contract-beat-2', 'loop-shuffle'],
};
