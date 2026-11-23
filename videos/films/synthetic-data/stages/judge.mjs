import { orderAudit } from '../arithmetic.mjs';
import { judgeSnapshot } from '../construction.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawJudge(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const audit = orderAudit(0.8, 0.7);
  {
    const swap = currentBeat === 0 ? 0 : currentBeat > 1 ? 1 : api.phase(progress, 0.01, 0.16),
      lift = Math.sin(Math.PI * swap) * 110;
    const ax = 250 + 860 * swap,
      bx = 1110 - 860 * swap;
    api.focus.target('answer-a', () =>
      card(ctx, api, 'A: follows the documented limit', ax, 475 - lift, 560, themeColors.green),
    );
    api.focus.target('answer-b', () =>
      card(ctx, api, 'B: asks for an oversized page', bx, 590 + lift, 560, themeColors.pink),
    );
    text(ctx, api, 'First order: P(A) = 0.80', 960, 845, 32, themeColors.blue, 'center');
    api.focus.target('remapped-probability', () => {
      if (
        judgeSnapshot(currentBeat, progress, api.focus.progress('judge-remap-result', 0))
          .comparisonVisible
      ) {
        text(
          ctx,
          api,
          'Reversed order: B 0.70, A 0.30. The winner flipped: audit this pair.',
          960,
          910,
          30,
          themeColors.pink,
          'center',
        );
        equation(
          ctx,
          api,
          String.raw`\bar P(A)=\frac{0.80+${audit.remappedA.toFixed(2)}}{2}=${audit.averageA.toFixed(2)}`,
          960,
          995,
          45,
          themeColors.yellow,
        );
      } else if (api.focus.progress('judge-remap-result', 0) > 0)
        text(
          ctx,
          api,
          'Remapping response identity · comparison pending',
          960,
          955,
          30,
          themeColors.muted,
          'center',
        );
    });

  }
}
export default {
  id: 'judge',
  draw: drawJudge,
  cues: ['judge-b1-1', 'judge-b2-1', 'judge-remap-result', 'judge-b3-1'],
};
