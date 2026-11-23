import { stablePolicy } from '../arithmetic.mjs';
import { bestOfNFrame, policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyCard, drawPolicyText, drawRectangle } from '../defaults.mjs';
export function drawBestOfN(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('best-of-n', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'best-of-n'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const { C, teaching, components } = api;
    const id = 'best-of-n',
      beat = state.beat ?? 0;
    {
      const frame = bestOfNFrame(state),
        candidates = frame.candidates;
      drawPolicyText(
        ctx,
        api,
        'Complete answers · supplied outcome evaluator',
        960,
        300,
        32,
        C.muted,
        'center',
      );
      candidates.forEach((candidate, i) => {
        const y = 415 + i * 150;
        drawPolicyCard(ctx, api, 'best-of-n', candidate.id, 170, y, 80, 80, colors[i], 35);
        drawPolicyText(ctx, api, candidate.text, 310, y + 48, 31, colors[i]);
        drawPolicyText(ctx, api, `log P ${candidate.log.toFixed(1)}`, 1050, y + 48, 30, C.muted);
        const known = i < frame.known;
        target(() => {
          if (known) drawRectangle(ctx, api, 1350, y + 17, 350 * candidate.score, 38, colors[i]);
          drawPolicyText(
            ctx,
            api,
            known ? candidate.score.toFixed(2) : '?',
            1790,
            y + 48,
            32,
            colors[i],
            'right',
          );
          if (frame.winner === candidate.id)
            api.arrow(ctx, 1285, y + 36, 1330, y + 36, C.yellow, 5);
        });
      });
      drawPolicyText(
        ctx,
        api,
        beat === 0
          ? frame.winner
            ? 'Outcome maximum selects A. The generator’s log score prefers B.'
            : 'Evaluator selection pending. The generator’s log score prefers B.'
          : 'Finite tests cover their cases. A proof checker covers its statement and trusted assumptions.',
        960,
        895,
        28,
        C.yellow,
        'center',
      );
      drawCaption(
        ctx,
        api,
        'Declare generation, evaluation and selection budgets. Scores need task evidence of their own.',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'best-of-n',
  draw: drawBestOfN,
  cues: ['best-of-n-build-0', 'best-of-n-build-1'],
};
