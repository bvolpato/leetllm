import { CHECKPOINT } from '../fixtures.mjs';
import { cueProgress, done } from '../construction.mjs';
import { instructionF as focus, instructionT as text } from '../defaults.mjs';

export function drawCompiledMask(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const prefixLength = CHECKPOINT.prefixIds.length;
  const tokens = [CHECKPOINT.prefixPieces.at(-1), ...CHECKPOINT.answerPieces];
  const last = tokens.length - 1;
  const center = (i) => 260 + i * 162;
  const annotated = cueProgress(state, 'compiled-bracket', 0);
  const endPair = done(state, 'compiled-last-pair', 2);
  const firstPair = done(state, 'compiled-first-pair', 2);
  if (beat === 3) {
    focus(ctx, api, 'completion-history', () => {
      text(ctx, api, 'Two replies in one conversation', 128, 310, 38);
      const restrict = done(state, 'compiled-completion', 3);
      for (const [i, reply] of ['She is happy.', 'She is playing.'].entries()) {
        const x = 150 + i * 850;
        text(ctx, api, reply, x, 485, 60);
        api.line(ctx, x, 540, x + 640, 540, C.cyan, 5);
        text(ctx, api, 'Available as input', x, 615, 36, C.cyan);
        const scored = i === 1 || !restrict;
        text(
          ctx,
          api,
          scored ? 'Reply and ending scored' : 'Earlier reply in the prompt',
          x,
          825,
          42,
          scored ? C.green : C.muted,
        );
      }
    });
    return;
  }
  focus(ctx, api, 'compiled-words', () => {
    text(ctx, api, 'Pinned Mistral training row', 126, 253, 37);
    text(ctx, api, '…', 112, 455, 52, C.muted);
    tokens.forEach((token, i) => {
      text(ctx, api, token.replace(/^▁/, ''), center(i), 455, 38, C.ink, 'center');
      text(ctx, api, prefixLength - 1 + i, center(i), 517, 31, C.muted, 'center');
    });
    if (annotated > 0) {
      const x = center(1) - 68;
      const right = center(last) + 65;
      api.line(ctx, x, 376, x, 356, C.green, 4);
      api.line(ctx, x, 356, x + (right - x) * annotated, 356, C.green, 4);
      if (annotated === 1) api.line(ctx, right, 356, right, 376, C.green, 4);
      text(ctx, api, 'Assistant generation span', x, 327, 34, C.green);
    }
  });
  focus(ctx, api, 'compiled-labels', () => {
    if (beat === 0) {
      text(ctx, api, 'Same rendered text and token IDs', 960, 781, 47, C.ink, 'center');
      return;
    }
    text(ctx, api, 'Unshifted labels', 960, 626, 33, C.muted, 'center');
    const labels = [-100, ...CHECKPOINT.answerIds];
    labels.forEach((value, i) =>
      text(
        ctx,
        api,
        value === -100 ? '−100' : value,
        center(i),
        712,
        38,
        value === -100 ? C.muted : C.green,
        'center',
      ),
    );
    if (firstPair || endPair) {
      const at = endPair ? last - 1 : 0;
      api.arrow(ctx, center(at), 555, center(at + 1), 665, C.yellow, 4);
    }
    const detail = endPair
      ? '51 predicts EOS at 52. The final logit has no following target.'
      : firstPair
        ? '43 predicts Open at 44. Its own label can still be ignored.'
        : beat === 1
          ? 'Which position predicts Open?'
          : 'Read one position to the left of the target.';
    text(ctx, api, detail, 960, 899, 42, C.yellow, 'center');
  });
}
export default {
  id: 'compiled-mask',
  draw: drawCompiledMask,
  cues: [
    'compiled-bracket',
    'compiled-question',
    'compiled-first-pair',
    'compiled-last-pair',
    'compiled-completion',
  ],
};
