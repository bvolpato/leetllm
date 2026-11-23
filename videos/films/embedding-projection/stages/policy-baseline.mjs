import { POLICY_SCORES } from '../model.mjs';
import {
  chapterBox,
  chapterCueVisible,
  chapterFooter,
  chapterRectangle,
  chapterText,
} from '../defaults.mjs';
export function drawPolicyBaseline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    chapterText(
      ctx,
      api,
      '18-day key query · six supplied policy vectors',
      960,
      280,
      35,
      themeColors.ink,
    );
    const names = [
      'rotation ticket',
      'rotate before reuse',
      'merge all gates',
      'failed security scan',
      'owner + expiry',
      'no standing admin',
    ];
    names.forEach((s, i) => {
      const y = 350 + i * 90;
      chapterBox(ctx, api, s, 170, y, 630, 70, i < 2 ? themeColors.green : themeColors.muted);
      const score = POLICY_SCORES[i];
      chapterRectangle(ctx, api, 900, y + 10, 650, 45, themeColors.panel, themeColors.line);
      if (chapterCueVisible(ctx, api, 'policy-scores') || currentBeat > 0)
        chapterRectangle(
          ctx,
          api,
          900,
          y + 10,
          650 * score,
          45,
          i < 2 ? themeColors.green : themeColors.pink,
          i < 2 ? themeColors.green : themeColors.pink,
        );
      if (chapterCueVisible(ctx, api, 'policy-scores') || currentBeat > 0)
        chapterText(
          ctx,
          api,
          score.toFixed(3),
          1660,
          y + 45,
          32,
          i < 2 ? themeColors.green : themeColors.muted,
        );
    });
    if (currentBeat === 1 && chapterCueVisible(ctx, api, 'policy-recall'))
      chapterText(
        ctx,
        api,
        'Recall@2 = 2 relevant retrieved / 2 relevant = 1',
        960,
        960,
        36,
        themeColors.green,
      );
    else
      chapterText(
        ctx,
        api,
        'Normalize first: cosine = dot / (norm × norm)',
        960,
        960,
        33,
        themeColors.yellow,
      );
    chapterFooter(
      ctx,
      api,
      'Hand-authored coordinates and judged labels · no language-model embedding run',
    );
  }
  return;
}
export default {
  id: 'policy-baseline',
  draw: drawPolicyBaseline,
  cues: ['policy-normalize', 'policy-scores', 'policy-control', 'policy-recall'],
};
